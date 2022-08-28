const http = require("http");
const https = require("https");
const net = require("net");
const tls = require("tls");
const zlib = require("zlib");
const { Readable } = require("stream");
const fs = require("fs");
const events = require("events");
const { exec } = require("child_process");
const { promisify } = require("util");
const URL2 = require("@ndiinginc/url");
const Cert = require("@ndiinginc/cert");
const regedit = require("regedit").promisified;
const execAsync = promisify(exec);

/**
 * Error Object
 */
class TransparentProxyError extends Error {}

// Avoid crash
// process.on("uncaughtException", (err) => {
//     if(process.env.NODE_ENV=='development'){
//         const error = new TransparentProxyError();
//         error.code = "uncaughtException";
//         error.message = err.message;
//         console.log(error);
//     }
// });
// process.on("unhandledRejection", (err) => {
//     if(process.env.NODE_ENV=='development'){
//         const error = new TransparentProxyError();
//         error.code = "unhandledRejection";
//         error.message = err.message;
//         console.log(error);
//     }
// });

/**
 * Extended `EventEmitter` in flavor `RegExp`
 */
class EventEmitter extends events {
    /**
     *
     * @param {String/RegExp} eventName -
     * @param {Function} listener
     */
    on(eventName, listener) {
        super.on(eventName.source || eventName, listener);
    }

    /**
     *
     * @param {String/RegExp} eventName -
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
class Regedit {
    /**
     *
     */
    static enableProxy(options = {}) {
        return regedit
            .putValue({
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
                    ProxyEnable: { value: 1, type: "REG_DWORD" },
                    ProxyOverride: { value: "<-loopback>", type: "REG_SZ" },
                    ProxyServer: { value: `http=${options.hostname}:${options.port};https=${options.hostname}:${options.port};ftp=${options.hostname}:${options.port}`, type: "REG_SZ" },
                },
            })
            .catch(() => {});
    }

    /**
     *
     */
    static disableProxy() {
        return regedit
            .putValue({
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
                    ProxyEnable: { value: 0, type: "REG_DWORD" },
                    ProxyOverride: { value: "", type: "REG_SZ" },
                    ProxyServer: { value: "", type: "REG_SZ" },
                },
            })
            .catch(() => {});
    }
}

/**
 * Used in transparent proxy, for record request&response while monitoring
 * @example
 * // Usage
 *
 * const log = new Logger()
 *
 * // Create initial `_id`
 * var doc = log.create()
 * console.log(doc)
 *
 * // Update when request
 * var doc = log.update(doc._id,{request:{}})
 * console.log(doc)
 *
 * // Update when response
 * var doc = log.update(doc._id,{response:{}})
 * console.log(doc)
 *
 * // Read request&respoonse doc
 * console.log(log.read(doc._id))
 */
class Logger extends EventEmitter {
    id_ = -1;
    /**
     * Auto Increment ID
     */
    get _id() {
        return ++this.id_;
    }
    /**
     * Document collection
     */
    docs = [];

    constructor() {
        super();
        // Infinity
        this.setMaxListeners(0);
    }

    /**
     *
     * @param {Object} doc -
     * @returns {Object}
     */
    create(doc = {}) {
        doc._id = this._id;
        this.docs[doc._id] = doc;
        return { _id: doc._id, status: true };
    }

    /**
     *
     * @param {Number} _id -
     * @returns {Object}
     */
    read(_id) {
        return this.docs[_id];
    }

    /**
     *
     * @param {Number} _id -
     * @param {Object} doc -
     * @returns {Object}
     */
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

    /**
     *
     * @param {Number} _id -
     * @returns {Object}
     */
    delete(_id) {
        const oldDoc = this.read(_id);
        this.docs[_id] = undefined;
        return { _id, status: !!oldDoc };
    }
}

/**
 * Fast proxy without redundancy, `Transparent proxy`. Also known as an `intercepting proxy`, `inline proxy`, or `forced proxy`, a transparent proxy intercepts normal application layer communication without requiring any special client configuration.
 * @see [Transparent proxy](https://en.wikipedia.org/wiki/Proxy_server#:~:text=in%20web%20proxies.-,Transparent%20proxy,requiring%20any%20special%20client%20configuration.)
 * @example
 * // Usage
 *
 * // Create proxy object
 * const proxy = new TransparentProxy();
 *
 * // Event listener
 *
 * // Listen on request
 * // proxy.log.on(/request,\d+/, console.log);
 *
 * // Listen on response
 * // proxy.log.on(/response,\d+/, console.log);
 *
 * // Listen on request&response
 * // proxy.log.on(/update,\d+/, console.log);
 *
 * // Start transparent proxy server
 * const server = proxy.listen(8888, () => {
 *     console.log("proxy listen", server.address());
 * });
 *
 * // // Intercepting request&response
 * // proxy.use("https://jsonplaceholder.typicode.com/posts", (req, res, next) => {
 * //     // callback will call twice on
 * //     // before request
 * //     if (req) console.log(req.method, req.url);
 * //     // and before response
 * //     if (res) console.log(res.status);
 * //     next();
 * // });
 *
 * // also you can use spesific method
 * proxy.get("https://jsonplaceholder.typicode.com/posts", (req, res, next) => {
 *     if (req) {
 *         delete req.headers["if-none-match"];
 *     }
 *     if (res) {
 *         res.body = JSON.stringify([]);
 *     }
 *     next();
 * });
 *
 * // Stop proxy
 * // setTimeout(() => {
 * //     proxy.close();
 * //     console.log("proxy close");
 * // }, 2000);
 *
 */
class TransparentProxy {
    ctx = {};
    log = new Logger();
    rules = [];

    /**
     *
     */
    constructor() {
        this.handleConnection = this.handleConnection.bind(this);
        this.handleConnect = this.handleConnect.bind(this);
        this.SNICallback = this.SNICallback.bind(this);
        this.handleUpgrade = this.handleUpgrade.bind(this);
        this.handleRequest = this.handleRequest.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    /**
     * @private
     * @param {*} method
     * @param {*} path
     * @param {*} callback
     */
    add(method, path, callback) {
        if (typeof method == "object") {
            ({ method, path, callback } = method);
        }
        let regexp = path.source || path;
        regexp = new RegExp("^" + regexp, "i");
        this.rules.push({ method, path, callback, regexp });
        return this;
    }

    /**
     * @param {String/Function} path - path/callback
     * @param {Function} callback
     */
    use(...args) {
        this.add(".*", ...args);
        return this;
    }

    /**
     * @param {String} path
     * @param {Function} callback
     */
    post(...args) {
        this.add("POST", ...args);
        return this;
    }

    /**
     * @param {String} path
     * @param {Function} callback
     */
    get(...args) {
        this.add("GET", ...args);
        return this;
    }

    /**
     * @param {String} path
     * @param {Function} callback
     */
    patch(...args) {
        this.add("PATCH", ...args);
        return this;
    }

    /**
     * @param {String} path
     * @param {Function} callback
     */
    put(...args) {
        this.add("PUT", ...args);
        return this;
    }

    /**
     * @param {String} path
     * @param {Function} callback
     */
    delete(...args) {
        this.add("DELETE", ...args);
        return this;
    }

    handleConnection(socket) {
        // @todo store CONNECT info
    }

    handleConnect(req, socket, head) {
        // Tunnel server
        const { port, address } = this.httpsServer.address();
        const serverSocket = net.connect(port, address, () => {
            let message = "";
            message += "HTTP/1.1 200 OK\r\n";
            message += "\r\n";
            socket.write(message);
            serverSocket.write(head);
            serverSocket.pipe(socket);
            socket.pipe(serverSocket);
        });
        serverSocket.on("error", this.handleError);
        socket.on("error", this.handleError);
    }

    async createCertificateAuthority() {
        // Create ROOT CA if not exists
        let ca = {};
        try {
            ca.key = fs.readFileSync("./ca.key");
            ca.cert = fs.readFileSync("./ca.crt");
        } catch (error) {
            ca = Cert.createCertificateAuthority();
            fs.writeFileSync("./ca.key", ca.key);
            fs.writeFileSync("./ca.crt", ca.cert);
            // Import to windows trusted ROOT CA
            await execAsync(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd ${process.cwd()} && certutil -enterprise -addstore -f root ${process.cwd()}\\ca.crt'"`);
        }
        return ca;
    }

    async SNICallback(servername, cb) {
        const err = null;
        let ctx;

        if (this.ctx[servername]) {
            ctx = this.ctx[servername];
        } else {
            const ca = await this.createCertificateAuthority();
            const cert = Cert.createSelfSignedCertificate(servername, ca);
            // Create secure context base on ROOT CA and
            // self-signed certificate/knows as issuer certificate
            ctx = tls.createSecureContext(cert);
            this.ctx[servername] = ctx;
        }
        cb(err, ctx);
    }

    async handleRequest(req, res, head) {
        // Get origin from incoming request
        const base = (req.socket.encrypted ? "https:" : "http:") + "//" + req.headers.host;

        // Create request object
        // with request options spec `node:http`
        // but in flavor window.fetch/self.fetch `Request` object
        let options = new URL2(req.url, base);
        options.method = req.method;
        options.url = options.path;
        options.headers = req.headers;
        options.body = req;

        // Init log data
        let doc = this.log.create();

        // Check for intercepting
        let callback;
        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];
            const passed = (rule.method == ".*" || rule.method == options.method) && rule.regexp.test(options.href);
            if (passed) {
                callback = rule.callback;
                break;
            }
        }

        // Read incoming request body
        const buffer = [];
        options.body.on("error", this.handleError);
        options.body.on("data", (chunk) => {
            buffer.push(chunk);
        });
        options.body.on("end", () => {
            const object = options;
            object.body = Buffer.concat(buffer);
            // Update log request data
            this.log.update(doc._id, { request: object });
        });

        if (callback) {
            // Intercept request sent
            options = await new Promise((resolve) => {
                callback(options, null, () => {
                    resolve(options);
                });
            });
            // in order to continue pipe request
            // convert string/buffer to readable stream
            let readable = options.body;
            if (!(options.body instanceof Readable)) {
                readable = new Readable();
                readable.push(options.body);
                readable.push(null); //end
            }
            options.body = readable;
        }

        // Get request protocol
        const protocol = req.socket.encrypted ? https : http;

        // Make request
        const request = protocol.request(options);

        // Handler request events

        request.on("error", this.handleError);
        request.on("response", this.handleResponse(doc, res, callback));
        request.on("upgrade", this.handleUpgrade(res, head));

        options.body.pipe(request);
    }

    handleUpgrade(sock, head) {
        return (response, socket, headers) => {
            // Switch protocol to ws/wss
            let message = "HTTP/1.1 101 Switching Protocols\r\n";
            for (const name in response.headers) {
                message += name + ": " + response.headers[name] + "\r\n";
            }
            message += "\r\n";

            sock.write(message);
            socket.write(head);
            socket.pipe(sock);
            sock.pipe(socket);

            socket.on("error", this.handleError);
            sock.on("error", this.handleError);
        };
    }

    handleResponse(doc, res, callback) {
        return async (response) => {
            // Create response object in flavor window.fetch/self.fetch `Response` object
            response.status = response.statusCode;
            response.body = response;

            // Uncompress response body
            // for log data or intercept response
            let readable = response.body;
            const encoding = response.headers["content-encoding"];
            if (encoding == "gzip") {
                readable = readable.pipe(zlib.createGunzip());
            } else if (encoding == "deflate") {
                readable = readable.pipe(zlib.createInflate());
            } else if (encoding == "br") {
                readable = readable.pipe(zlib.createBrotliDecompress());
            }

            // Read response body
            const buffer = [];
            readable.on("error", this.handleError);
            readable.on("data", (chunk) => {
                buffer.push(chunk);
            });
            readable.on("end", () => {
                const object = response;
                object.body = Buffer.concat(buffer);
                this.log.update(doc._id, { response: object });
            });

            // Intercept response
            if (callback) {
                response = await new Promise((resolve) => {
                    callback(null, response, () => {
                        resolve(response);
                    });
                });

                // Compress back `response.body`
                let readable = response.body;
                if (!(response.body instanceof Readable)) {
                    readable = new Readable();
                    readable.push(response.body);
                    readable.push(null); //end
                }
                const encoding = response.headers["content-encoding"];
                if (encoding == "gzip") {
                    readable = readable.pipe(zlib.createGzip());
                } else if (encoding == "deflate") {
                    readable = readable.pipe(zlib.createDeflate());
                } else if (encoding == "br") {
                    readable = readable.pipe(zlib.createBrotliCompress());
                }
                response.body = readable;
            }

            // finishing response
            res.writeHead(response.status, response.headers);
            response.body.pipe(res);
        };
    }

    handleError(err) {
        if (process.env.NODE_ENV == "development") {
            const error = new TransparentProxyError();
            error.code = "handleError";
            error.message = err.message;
            console.log(error);
        }
    }

    /**
     *
     * @param {Number} port -
     * @param {String} hostname -
     * @param {Function} backlog
     * @returns {Object}
     */
    listen(port, hostname, backlog) {
        if (typeof hostname == "function") {
            backlog = hostname;
            hostname = undefined;
        }

        port = port || 8888;
        // This hostname set for windows
        // by default proxy server using global host
        hostname = hostname || "127.0.0.1";

        // Enabling window proxy internet settings
        Regedit.enableProxy({ hostname, port });

        // Create proxy server
        this.httpServer = http.createServer().listen(port, "0.0.0.0", backlog);
        // Create proxy tunnel server
        this.httpsServer = https.createServer({ SNICallback: this.SNICallback }).listen(0, "0.0.0.0");

        this.httpServer.on("connection", this.handleConnection);
        this.httpServer.on("connect", this.handleConnect);
        this.httpServer.on("upgrade", this.handleRequest);
        this.httpServer.on("request", this.handleRequest);
        this.httpServer.on("error", this.handleError);

        this.httpsServer.on("connection", this.handleConnection);
        this.httpsServer.on("connect", this.handleConnect);
        this.httpsServer.on("upgrade", this.handleRequest);
        this.httpsServer.on("request", this.handleRequest);
        this.httpsServer.on("error", this.handleError);

        return this.httpServer;
    }

    /**
     *
     */
    close() {
        this.httpServer.close();
        this.httpServer = null;

        this.httpsServer.close();
        this.httpsServer = null;

        Regedit.disableProxy();
    }
}

module.exports = TransparentProxy;

// const proxy = new TransparentProxy();

// proxy.log.on("update.*", (e, doc) => {
//     console.log(doc?.request?.method, doc?.request?.url, doc?.response?.status);
// });

// proxy.listen(8888, () => {
//     console.log("proxy.listen");
// });

// setTimeout(() => {
//     proxy.close()
//     console.log('proxy.close')
// }, 1000)
