const http = require("http");
const https = require("https");
const url2 = require("@ndiinginc/url");
const net = require("net");
const tls = require("tls");
const certmaker = require("@ndiinginc/cert");
const regedit = require("regedit").promisified;
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const { Readable } = require("stream");
const zlib = require("zlib");
const events = require("events");
const crypto = require("crypto");

class Logger extends events {
    id_ = -1;
    get _id() {
        return ++this.id_;
    }

    docs = [];

    constructor(...args) {
        super(...args);
        this.setMaxListeners(0);
    }

    on(eventName, listener) {
        super.on(eventName.source || eventName, listener);
    }

    emit(eventName, ...args) {
        super.emit(eventName, ...args);

        for (const _eventName in this._events) {
            if (new RegExp(`^${_eventName}$`).test(eventName) && _eventName !== eventName) {
                super.emit(_eventName, eventName, ...args);
            }
        }
    }

    create(doc = {}) {
        doc._id = this._id;
        this.docs[doc._id] = doc;
        return { _id: doc._id, status: true };
    }

    read(_id) {
        return this.docs[_id];
    }

    update(_id, doc = {}) {
        const oldDoc = this.read(_id);
        if (oldDoc) {
            for (const name in doc) {
                if (name == "_id") {
                    continue;
                }
                oldDoc[name] = doc[name];
                this.emit(`${name},${_id}`, doc[name]);
            }
            this.emit(`update,${_id}`, oldDoc);
            return { _id, status: true };
        }
        return { _id, status: false };
    }

    delete(_id) {
        const oldDoc = this.read(_id);
        this.docs[_id] = undefined;
        return { _id, status: !!oldDoc };
    }
}

let httpServer = null;
let httpsServer = null;
const secureContext = new Map();
const logging = new Logger();
const pools = {};

// regedit
function enableProxy(options = {}) {
    const { hostname, port } = options;
    regedit
        .putValue({
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
                ProxyEnable: { value: 1, type: "REG_DWORD" },
                ProxyOverride: { value: "<-loopback>", type: "REG_SZ" },
                ProxyServer: { value: `http=${hostname}:${port};https=${hostname}:${port};ftp=${hostname}:${port}`, type: "REG_SZ" },
            },
        })
        .catch(() => {});
}
function disableProxy() {
    regedit
        .putValue({
            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
                ProxyEnable: { value: 0, type: "REG_DWORD" },
                ProxyOverride: { value: "", type: "REG_SZ" },
                ProxyServer: { value: "", type: "REG_SZ" },
            },
        })
        .catch(() => {});
}

// cert
async function createCertificateAuthority() {
    let ca = {};

    try {
        ca.key = fs.readFileSync("./ca.key");
        ca.cert = fs.readFileSync("./ca.crt");
    } catch (error) {
        ca = Cert.createCertificateAuthority();

        fs.writeFileSync("./ca.key", ca.key);
        fs.writeFileSync("./ca.crt", ca.cert);

        await promisify(exec)(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd ${process.cwd()} && certutil -enterprise -addstore -f root ${process.cwd()}\\ca.crt'"`);
    }

    return ca;
}

// handler
function handleClose() {}
function handleConnect(req, socket, head) {
    const { port, address: hostname } = httpsServer.address();

    const socketServer = net.connect(port, hostname, () => {
        let message = "";
        message += `HTTP/1.1 200 OK\r\n`;
        message += `\r\n`;

        socket.write(message);
        socketServer.write(head);

        socketServer.pipe(socket);
        socket.pipe(socketServer);
    });

    socketServer.on("error", handleError);
    socket.on("error", handleError);
}
function handleConnection(socket) {}
function handleError(err) {}
async function handleRequest(req, res, head) {
    const protocol = [http, https][~~req.socket.encrypted];
    const base = ["http:", "https:"][~~req.socket.encrypted] + "//" + req.headers.host;

    let request = new url2(req.url, base);
    request.method = req.method;
    request.url = request.href;
    request.headers = req.headers;
    request.body = req;

    let doc = logging.create();
    let callback; // = (req, res, next) => next();

    const rules = Object.values(pools)
        .map((pool) => pool.rules)
        .flat();

    for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        const passed =
            (rule.method == ".*" || //
                rule.method == request.method) &&
            rule.regexp.test(request.url);
        if (passed) {
            callback = rule.callback;
            break;
        }
    }

    let readable = request.body;

    let buffer = [];
    readable.on("error", handleError);
    readable.on("data", (chunk) => {
        buffer.push(chunk);
    });
    readable.on("end", () => {
        const obj = request;
        obj.body = Buffer.concat(buffer);
        logging.update(doc._id, { request: obj });
    });

    if (callback) {
        request = await new Promise((resolve) => {
            logging.once(`request,${doc._id}`, (obj) => {
                callback(obj, null, () => {
                    resolve(obj);
                });
            });
        });

        let readable = request.body;
        if (!(request.body instanceof Readable)) {
            readable = new Readable();
            readable.push(request.body);
            readable.push(null);
        }
        request.body = readable;
    }

    const reqServer = protocol.request(request);

    reqServer.on("close", handleClose);
    reqServer.on("error", handleError);
    reqServer.on("response", handleResponse(doc, callback, res));
    reqServer.on("timeout", handleTimeout);
    reqServer.on("upgrade", handleUpgrade(res, head));

    request.body.pipe(reqServer);
}
//  handleRequest(req,socket,head){}
function handleResponse(doc, callback, res) {
    return async function (resServer) {
        let response = {};
        response.status = resServer.statusCode;
        response.headers = resServer.headers;
        response.body = resServer;

        let readable = response.body;
        const encoding = resServer.headers["content-encoding"];
        if (encoding == "gzip") {
            readable = readable.pipe(zlib.createGunzip());
        } else if (encoding == "deflate") {
            readable = readable.pipe(zlib.createInflate());
        } else if (encoding == "br") {
            readable = readable.pipe(zlib.createBrotliDecompress());
        }

        let buffer = [];
        readable.on("error", handleError);
        readable.on("data", (chunk) => {
            buffer.push(chunk);
        });
        readable.on("end", () => {
            const obj = response;
            obj.body = Buffer.concat(buffer);
            logging.update(doc._id, { response: obj });
        });

        if (callback) {
            response = await new Promise((resolve) => {
                logging.once(`response,${doc._id}`, (obj) => {
                    callback(null, obj, () => {
                        resolve(obj);
                    });
                });
            });

            let readable = response.body;
            if (!(response.body instanceof Readable)) {
                readable = new Readable();
                readable.push(response.body);
                readable.push(null);
            }
            const encoding = resServer.headers["content-encoding"];
            if (encoding == "gzip") {
                readable = readable.pipe(zlib.createGzip());
            } else if (encoding == "deflate") {
                readable = readable.pipe(zlib.createDeflate());
            } else if (encoding == "br") {
                readable = readable.pipe(zlib.createBrotliCompress());
            }
            response.body = readable;
        }

        res.writeHead(response.status, response.headers);
        response.body.pipe(res);
    };
}
function handleTimeout() {}
function handleUpgrade(socket, head) {
    return function (req, socketServer, headServer) {
        let message = "";
        message += "HTTP/1.1 101 Switching Protocols\r\n";
        for (const name in req.headers) {
            message += name + ": " + req.headers[name] + "\r\n";
        }
        message += "\r\n";

        socket.write(message);
        socketServer.write(head);

        socketServer.pipe(socket);
        socket.pipe(socketServer);

        socketServer.on("error", handleError);
        socket.on("error", handleError);
    };
}
async function SNICallback(servername, cb) {
    let err = null,
        ctx = null;
    if (secureContext.has(servername)) {
        ctx = secureContext.get(servername);
    } else {
        const ca = await createCertificateAuthority();
        const cert = certmaker.createSelfSignedCertificate(servername, ca);

        ctx = tls.createSecureContext(cert);

        secureContext.set(servername, ctx);
    }
    cb(err, ctx);
}

// listen
function listen(port, hostname, backlog) {
    if (typeof hostname == "function") {
        backlog = hostname;
        hostname = undefined;
    }

    hostname = hostname || "127.0.0.1";
    port = port || 8888;

    enableProxy({ hostname, port });

    httpServer = http.createServer().listen(port, "0.0.0.0");
    httpsServer = https.createServer({ SNICallback }).listen(0, "0.0.0.0");

    httpServer.on("close", handleClose);
    httpServer.on("connect", handleConnect);
    httpServer.on("connection", handleConnection);
    httpServer.on("error", handleError);
    httpServer.on("request", handleRequest);
    httpServer.on("upgrade", handleRequest);

    httpsServer.on("close", handleClose);
    httpsServer.on("connect", handleConnect);
    httpsServer.on("connection", handleConnection);
    httpsServer.on("error", handleError);
    httpsServer.on("request", handleRequest);
    httpsServer.on("upgrade", handleRequest);
}

// close
function close() {
    httpServer.close();
    httpsServer.close();

    httpServer = null;
    httpsServer = null;

    disableProxy();
}

/**
 * @example
 * // Create proxy
 * var proxy1 = new ProxyServer();
 * // Listen on logging
 * // using request,\d+
 * // response,\d+
 * // and update,\d+
 * // event name
 * proxy1.logging.on("request.*", (eventName, req) => {
 *     console.log("from proxy1", req.method, req.pathname);
 * });
 * proxy1.listen();
 * setTimeout(() => {
 *     // close after 3minutes
 *     proxy1.close();
 *     // when proxy more than one
 *     // is not close primary proxy
 *     // just proxx configuration for this one
 * }, 1000 * 60 * 3);
 *
 * // like another server proxy
 * // it always create one proxy per machine
 * // register more than one proxy, is only subscribe from
 * // primary proxy
 * var proxy2 = new ProxyServer();
 * proxy2.logging.on("request.*", (eventName, req) => {
 *     console.log("from proxy2", req.method, req.pathname);
 * });
 * // adding intercept method like
 * // use,get,post,patch,set,delete
 * // it only match one, not like regular router middleware
 * proxy2.use("https://jsonplaceholder.typicode.com/posts", (req, res, next) => {
 *     if (req) {
 *         delete req.headers["if-none-match"];
 *     }
 *     next();
 * });
 * // when proxy already listening
 * // this method never been call
 * proxy2.listen();
 * setTimeout(() => {
 *     // close after 5minutes
 *     proxy2.close();
 * }, 1000 * 60 * 5);
 */
class ProxyServer {
    /**
     *
     */
    constructor() {
        /**
         * will be remove, use `logging`
         * @deprecated
         */
        this.log = logging;

        this.logging = logging;
        this.rules = [];
        this.uuid = crypto.randomUUID();
        pools[this.uuid] = this;
        // console.log("proxy subscribe");
    }

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    post(...args){this.add('POST',...args)}

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    get(...args){this.add('GET',...args)}

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    set(...args){this.add('SET',...args)}

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    patch(...args){this.add('PATCH',...args)}

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    delete(...args){this.add('DELETE',...args)}

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    use(...args){this.add('.*',...args)}

    add(method, path, callback) {
        let regexp = path.source || path;
        regexp = new RegExp("^" + regexp, "i");
        this.rules.push({ method, path, callback, regexp });
    }

    /**
     *
     * @param {Number} port
     * @param {String/Function} hostname
     * @param {Function} backlog
     */
    listen(...args) {
        if (httpServer) {
            return;
        }
        listen(...args);
        // console.log("proxy listen");
    }

    /**
     *
     */
    close() {
        delete pools[this.uuid];
        // console.log("proxy unsubscribe");
        if (Object.keys(pools).length == 0) {
            close();
            // console.log("proxy close");
        }
    }
}

module.exports = ProxyServer;
