const http = require("http");
const https = require("https");
const URL2 = require("@ndiinginc/url");
const net = require("net");
const tls = require("tls");
const Cert = require("@ndiinginc/cert");
const regedit = require("regedit").promisified;
const fs = require("fs");
const { exec } = require("child_process");
const { promisify } = require("util");
const { Readable } = require("stream");
const zlib = require("zlib");
const events = require("events");
const crypto = require("crypto");

/**
 *
 */
class EventEmitter extends events {
    /**
     *
     */
    constructor(...args) {
        super(...args);
        this.setMaxListeners(0);
    }

    /**
     *
     * @param {String/RegExp} eventName
     * @param {Function} listener
     */
    on(eventName, listener) {
        super.on(eventName.source || eventName, listener);
    }

    /**
     *
     * @param {String/RegExp} eventName
     * @param  {any} args
     */
    emit(eventName, ...args) {
        super.emit(eventName, ...args);
        for (const _eventName in this._events) {
            if (new RegExp(`^${_eventName}$`).test(eventName) && _eventName !== eventName) {
                super.emit(_eventName, eventName, ...args);
            }
        }
    }
}

/**
 *
 */
class Logger extends EventEmitter {
    _id = -1;
    /**
     *
     */
    get id() {
        return ++this._id;
    }

    /**
     *
     */
    logs = [];

    /**
     *
     * @param {Object} log
     * @returns {Object}
     */
    create(log = {}) {
        log.id = this.id;
        this.logs[log.id] = log;
        return { id: log.id, status: true };
    }

    /**
     *
     * @param {Number} id
     * @returns {Object}
     */
    read(id) {
        return this.logs[id];
    }

    /**
     *
     * @param {Number} id
     * @param {Object} log
     * @returns {Object}
     */
    update(id, log = {}) {
        const oldDoc = this.read(id);
        if (oldDoc) {
            for (const name in log) {
                if (name == "id") {
                    continue;
                }

                oldDoc[name] = log[name];
                this.emit(`${name},${id}`, log[name]);
            }

            this.emit(`update,${id}`, oldDoc);
            return { id, status: true };
        }

        return { id, status: false };
    }

    /**
     *
     * @param {Number} id
     * @returns {Object}
     */
    delete(id) {
        const oldDoc = this.read(id);
        this.logs[id] = undefined;
        return { id, status: !!oldDoc };
    }
}

/**
 *
 */
class Server {
    /**
     *
     */
    static logging = new Logger();

    /**
     *
     */
    static pools = {};

    /**
     * Enable windows proxy settings `Check proxy`
     * @param {Object} options
     * @param {String} options.hostname
     * @param {Number} options.port
     */
    static async enableProxy(options = {}) {
        const { hostname, port } = options;
        try {
            await regedit.putValue({
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
                    ProxyEnable: { value: 1, type: "REG_DWORD" },
                    ProxyOverride: { value: "<-loopback>", type: "REG_SZ" },
                    ProxyServer: { value: `http=${hostname}:${port};https=${hostname}:${port};ftp=${hostname}:${port}`, type: "REG_SZ" },
                },
            });
        } catch (error) {}
    }

    /**
     * Disable windows proxy settings `Check proxy`
     */
    static async disableProxy() {
        try {
            await regedit.putValue({
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
                    ProxyEnable: { value: 0, type: "REG_DWORD" },
                    ProxyOverride: { value: "", type: "REG_SZ" },
                    ProxyServer: { value: "", type: "REG_SZ" },
                },
            });
        } catch (error) {}
    }

    /**
     * Create ROOT CA `crt` and `key`, then import to windows trusted root ca
     * @returns {Object}
     */
    static async createCertificateAuthority() {
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

    static handleClose() {}

    static handleConnect(req, socket, head) {
        const { port, address: hostname } = this.httpsServer.address();
        const connectionListener = () => {
            let message = "HTTP/1.1 200 OK\r\n\r\n";
            socket.write(message);
            socketServer.write(head);
            socketServer.pipe(socket);
            socket.pipe(socketServer);
        };

        const socketServer = net.connect(port, hostname, connectionListener);
        socketServer.on("error", (...args) => this.handleError(...args));
        socket.on("error", (...args) => this.handleError(...args));
    }

    static handleConnection(socket) {}

    static handleError(err) {}

    static async handleRequest(req, res, head) {
        const base = `${["http:", "https:"][~~req.socket.encrypted]}//${req.headers.host}`;

        let request = new URL2(req.url, base);
        request.url = request.href;
        request.method = req.method;
        request.headers = req.headers;
        request.body = req;

        const protocol = [http, https][~~req.socket.encrypted];

        const log = this.logging.create();

        let callback;
        const rules = Object.values(this.pools)
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
        readable.on("error", (...args) => this.handleError(...args));
        readable.on("data", (chunk) => {
            buffer.push(chunk);
        });

        readable.on("end", () => {
            const newLog = request;
            newLog.body = Buffer.concat(buffer);
            this.logging.update(log.id, { request: newLog });
        });

        if (callback) {
            request = await new Promise((resolve) => {
                this.logging.once(`request,${log.id}`, (newLog) => {
                    callback(newLog, null, () => {
                        resolve(newLog);
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

        reqServer.on("close", (...args) => this.handleClose(...args));
        reqServer.on("error", (...args) => this.handleError(...args));
        reqServer.on("response", (...args) => this.handleResponse(req, res, log, callback, ...args));
        reqServer.on("timeout", (...args) => this.handleTimeout(...args));
        reqServer.on("upgrade", (...args) => this.handleUpgrade(req, res, head, ...args));

        request.body.pipe(reqServer);
    }

    static async handleResponse(req, res, log, callback, resServer) {
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
        readable.on("error", (...args) => this.handleError(...args));
        readable.on("data", (chunk) => {
            buffer.push(chunk);
        });

        readable.on("end", () => {
            const newLog = response;
            newLog.body = Buffer.concat(buffer);
            this.logging.update(log.id, { response: newLog });
        });

        if (callback) {
            response = await new Promise((resolve) => {
                this.logging.once(`response,${log.id}`, (newLog) => {
                    callback(null, newLog, () => {
                        resolve(newLog);
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
    }

    static handleTimeout() {}

    static handleUpgrade(req, socket, head, resServer, socketServer, headServer) {
        let message = "HTTP/1.1 101 Switching Protocols\r\n";
        for (const name in resServer.headers) {
            message += `${name}: ${resServer.headers[name]}\r\n`;
        }
        message += "\r\n";

        socket.write(message);
        socketServer.write(head);

        socketServer.pipe(socket);
        socket.pipe(socketServer);

        socketServer.on("error", (...args) => this.handleError(...args));
        socket.on("error", (...args) => this.handleError(...args));
    }

    static ctx = new Map();
    static async SNICallback(servername, cb) {
        let err, ctx;
        if (this.ctx.has(servername)) {
            ctx = this.ctx.get(servername);
        } else {
            const ca = await this.createCertificateAuthority();
            const cert = Cert.createSelfSignedCertificate(servername, ca);
            ctx = tls.createSecureContext(cert);

            this.ctx.set(servername, ctx);
        }

        cb(err, ctx);
    }

    /**
     *
     * @param {Number} port=8888
     * @param {String/Function} hostname=127.0.0.1
     * @param {Function} backlog
     */
    static listen(port, hostname, backlog) {
        if (typeof hostname == "function") {
            backlog = hostname;
            hostname = undefined;
        }

        port = port || 8888;
        hostname = hostname || "127.0.0.1";

        this.enableProxy({ port, hostname });

        this.httpServer = http.createServer().listen(8888, "0.0.0.0", backlog);
        this.httpsServer = https.createServer({ SNICallback: (...args) => this.SNICallback(...args) }).listen(0, "0.0.0.0");

        this.httpServer.on("close", (...args) => this.handleClose(...args));
        this.httpServer.on("connect", (...args) => this.handleConnect(...args));
        this.httpServer.on("connection", (...args) => this.handleConnection(...args));
        this.httpServer.on("error", (...args) => this.handleError(...args));
        this.httpServer.on("request", (...args) => this.handleRequest(...args));
        this.httpServer.on("upgrade", (...args) => this.handleRequest(...args));

        this.httpsServer.on("close", (...args) => this.handleClose(...args));
        this.httpsServer.on("connect", (...args) => this.handleConnect(...args));
        this.httpsServer.on("connection", (...args) => this.handleConnection(...args));
        this.httpsServer.on("error", (...args) => this.handleError(...args));
        this.httpsServer.on("request", (...args) => this.handleRequest(...args));
        this.httpsServer.on("upgrade", (...args) => this.handleRequest(...args));
    }

    /**
     *
     */
    static close() {
        this.httpServer.close();
        this.httpsServer.close();

        this.httpServer = null;
        this.httpsServer = null;

        this.disableProxy();
    }
}

/**
 * @example
 * // Create proxy
 * const proxy1 = new ProxyServer()
 *
 * // Network monitoring/logging
 *
 * // (eventName, requestObject)
 * proxy1.logging.on('request.*', console.log)
 * // (eventName, responseObject)
 * proxy1.logging.on('response.*', console.log)
 * // (eventName, logObject)
 * // logObject={id,request,response}
 * proxy1.logging.on('update.*', console.log)
 *
 * // Start server
 * proxy1.listen(8888, () => {
 *     console.log('proxy1 started')
 * })
 *
 * // Stop server after
 * setTimeout(() => {
 *     proxy1.close()
 *     console.log('proxy1 stopped')
 * }, 1000 * 5)
 *
 * // Create anaother proxy
 * // it will subscribe with previous active proxy
 * const proxy2 = new ProxyServer()
 *
 * // Intercept request and response
 * // using `use` function for global `request.method`
 * // and post,get,patch,put,delete for spesific `request.method`
 * // it's not like router middleware
 * proxy2.use('https://jsonplaceholder.typicode.com/posts', (req,res,next) => {
 *     // this callback will call twice
 *     // on before request
 *     if(req){
 *         // intercept req
 *         delete req.headers['if-none-match'] // remove cache
 *     }
 *     // and before response
 *     if(res){
 *         // intercept res
 *         res.body = JSON.stringify([]) // response with empty json array
 *     }
 *     // then continue request/response
 *     // with `next` callback method
 *     next()
 * })
 *
 * // Start server
 * // when previous proxy still active
 * // this method never been call
 * // so the port are still the saame
 * proxy2.listen(8888, () => {
 *     console.log('proxy2 started')
 * })
 *
 * // Stop server after
 * // also it never been stop until all proxy are stopped
 * setTimeout(() => {
 *     proxy2.close()
 *     console.log('proxy2 stopped')
 * }, 1000 * 10)
 *
 * // and thats it, just simple like that
 */
class ProxyServer {
    logging = Server.logging;
    rules = [];
    name = crypto.randomUUID();
    /**
     *
     */
    constructor() {
        Server.pools[this.name] = this;
    }

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    post(...args) {
        this.add("POST", ...args);
    }

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    get(...args) {
        this.add("GET", ...args);
    }

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    set(...args) {
        this.add("SET", ...args);
    }

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    patch(...args) {
        this.add("PATCH", ...args);
    }

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    delete(...args) {
        this.add("DELETE", ...args);
    }

    /**
     *
     * @param {String} path
     * @param {Function} callback
     */
    use(...args) {
        this.add(".*", ...args);
    }

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
        if (Server.httpServer) {
            return;
        }
        Server.listen(...args);
    }

    /**
     *
     */
    close() {
        delete Server.pools[this.name];
        if (Object.keys(Server.pools).length == 0) {
            Server.close();
        }
    }
}

module.exports = ProxyServer;
