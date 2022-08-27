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
process.on("uncaughtException", (err) => {
    const error = new TransparentProxyError();
    error.code = "uncaughtException";
    error.message = err.message;
    console.log(error);
});
process.on("unhandledRejection", (err) => {
    const error = new TransparentProxyError();
    error.code = "unhandledRejection";
    error.message = err.message;
    console.log(error);
});

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

    constructor() {
        this.handleConnection = this.handleConnection.bind(this);
        this.handleConnect = this.handleConnect.bind(this);
        this.SNICallback = this.SNICallback.bind(this);
        this.handleUpgrade = this.handleUpgrade.bind(this);
        this.handleRequest = this.handleRequest.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleSocketError = this.handleSocketError.bind(this);
        this.handleServerError = this.handleServerError.bind(this);
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
        // monitor CONNECT
        // socket.on("data", (chunk) => {
        //     const message = "" + chunk;
        //     if (message.indexOf("CONNECT") !== -1) {
        //         console.log(message);
        //     }
        // });
    }

    handleConnect(req, socket, head) {
        const { port, address } = this.httpsServer.address();
        const serverSocket = net.connect(port, address, () => {
            socket.write(
                "HTTP/1.1 200 OK\r\n" +
                    //   'Proxy-agent: Node.js-Proxy\r\n' +
                    "\r\n"
            );
            serverSocket.write(head);

            serverSocket.pipe(socket);
            socket.pipe(serverSocket);
        });

        serverSocket.on("error", this.handleSocketError);
        socket.on("error", this.handleSocketError);
    }

    async createCertificateAuthority() {
        let ca = {};
        try {
            ca.key = fs.readFileSync("./ca.key");
            ca.cert = fs.readFileSync("./ca.crt");
        } catch (error) {
            ca = Cert.createCertificateAuthority();

            fs.writeFileSync("./ca.key", ca.key);
            fs.writeFileSync("./ca.crt", ca.cert);

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
            // Generate ROOT CA
            const ca = await this.createCertificateAuthority();
            // Dynamic Issuer Certificate / Self-signed certiface
            // do not store, storing certificate make slower request
            const cert = Cert.createSelfSignedCertificate(servername, ca);
            ctx = tls.createSecureContext(cert);
            this.ctx[servername] = ctx;
        }
        cb(err, ctx);
    }

    handleUpgrade(req, socket, head) {}

    async handleRequest(req, res, head) {
        // do not clean code at the moment
        // it make me easier to iterate logic in research level

        // client<>server communication
        const base = (req.socket.encrypted ? "https:" : "http:") + "//" + req.headers.host;

        // Request Object
        let options = new URL2(req.url, base);
        options.method = req.method;
        options.url = options.path;
        options.headers = req.headers;
        options.body = req;

        // request.read change to request.buffer
        // response.read change to response.buffer
        // accidentally conflict naming with native socket

        // intercept handler
        let doc = this.log.create();
        let callback;

        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];
            const passed =
                (rule.method == ".*" || //
                    rule.method == options.method) &&
                rule.regexp.test(options.href);

            if (passed) {
                callback = rule.callback;
                break;
            }
        }

        // read request body
        // request body sould be uncompressed buffer data
        const buffer = [];
        options.body.on("data", (chunk) => {
            buffer.push(chunk);
        });
        options.body.on("end", () => {
            const object = options;
            object.body = Buffer.concat(buffer);
            this.log.update(doc._id, { request: object });
        });

        if (callback) {
            options = await new Promise((resolve) => {
                callback(options, null, () => {
                    resolve(options);
                });
            });
            let readable = options.body;
            if (!(options.body instanceof Readable)) {
                readable = new Readable();
                readable.push(options.body);
                readable.push(null); //end
            }
            options.body = readable;
        }

        // Send to intercept handler
        // console.log({ request: options });

        const protocol = req.socket.encrypted ? https : http;

        const request = protocol.request(options);

        // response
        request.on("response", async (response) => {
            // Response Object
            response.status = response.statusCode;
            response.body = response;

            let readable = response.body;
            const encoding = response.headers["content-encoding"];
            if (encoding == "gzip") {
                readable = readable.pipe(zlib.createGunzip());
            } else if (encoding == "deflate") {
                readable = readable.pipe(zlib.createInflate());
            } else if (encoding == "br") {
                readable = readable.pipe(zlib.createBrotliDecompress());
            }

            const buffer = [];
            readable.on("data", (chunk) => {
                buffer.push(chunk);
            });
            readable.on("end", () => {
                const object = response;
                object.body = Buffer.concat(buffer);
                this.log.update(doc._id, { response: object });
            });

            if (callback) {
                response = await new Promise((resolve) => {
                    callback(null, response, () => {
                        resolve(response);
                    });
                });
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

            // Send to intercept handler
            // console.log({ response });

            res.writeHead(response.status, response.headers);
            response.body.pipe(res);
        });

        // upgrade
        // prettier-ignore
        request.on("upgrade", ((sock) => {
            return (response, socket, headers) => {
                // Just by pass
                // and ignore this part
                // at the moment
                let message = "HTTP/1.1 101 Switching Protocols\r\n";
                // message += "Upgrade: websocket\r\n";
                // message += "Connection: Upgrade\r\n";
                for (const name in response.headers) {
                    message += name + ": " + response.headers[name] + "\r\n";
                }
                message += "\r\n";

                sock.write(message);
                socket.write(head);
                socket.pipe(sock);
                sock.pipe(socket);

                socket.on("error", this.handleSocketError);
                sock.on("error", this.handleSocketError);
            }
        })(res));

        // error
        request.on("error", this.handleServerError);

        options.body.pipe(request);
    }

    handleError(err) {
        const error = new TransparentProxyError();
        error.code = "handleError";
        error.message = err.message;
        console.log(error);
    }

    handleSocketError(err) {
        const error = new TransparentProxyError();
        error.code = "handleSocketError";
        error.message = err.message;
        console.log(error);
    }

    handleServerError(err) {
        const error = new TransparentProxyError();
        error.code = "handleServerError";
        error.message = err.message;
        console.log(error);
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
        hostname = hostname || "127.0.0.1";

        Regedit.enableProxy({ hostname, port });

        // hostname
        const SNICallback = this.SNICallback;
        this.httpServer = http.createServer().listen(port, "0.0.0.0", backlog);
        this.httpsServer = https.createServer({ SNICallback }).listen(0, "0.0.0.0");

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
