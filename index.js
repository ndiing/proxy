const http = require("http");
const https = require("https");
const net = require("net");
const tls = require("tls");
const zlib = require("zlib");
const { Readable } = require("stream");
const fs = require("fs");
const events = require("events");
const { promisify } = require("util");
const { exec } = require("child_process");
const regedit = require("regedit").promisified;
const forge = require("node-forge");
const { URL2, Headers } = require("@ndiinginc/fetch");

process.on("uncaughtException", (err) => {
    console.log(err);
});

process.on("unhandledRejection", (err) => {
    console.log(err);
});

/**
 *
 */
class EventEmitter extends events {
    /**
     *
     */
    on(eventName, listener) {
        super.on(eventName.source || eventName, listener);
    }

    /**
     *
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
class Database extends EventEmitter {
    /**
     *
     */
    docs = [];
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
    post(doc = {}) {
        doc._id = this.id;
        this.docs[doc._id] = doc;
        return { _id: doc._id };
    }

    /**
     *
     */
    get(_id) {
        return this.docs[_id];
    }

    /**
     *
     */
    patch(_id, doc = {}) {
        let oldDoc = this.get(_id);

        for (const name in doc) {
            if (name == "_id") {
                continue;
            }
            oldDoc[name] = doc[name];
            this.emit(`${name},${_id}`, oldDoc[name]);
        }
        return { _id };
    }
}

/**
 * Create self-signed certificate and certificate authority using `node-forge`
 */
class Certificate {
    /**
     * @property {String} countryName=ID
     * @property {String} organizationName=Ndiing
     * @property {String} ST=Jatim
     * @property {String} OU=Pacitan
     */
    static defaultAttrs = [
        { name: "countryName", value: "ID" },
        { name: "organizationName", value: "Ndiing" },
        { shortName: "ST", value: "Jatim" },
        { shortName: "OU", value: "Pacitan" },
    ];

    /**
     *
     * @param {String} serialNumber - certificate serial number
     * @returns {Object}
     * @private
     */
    static createCertificate(serialNumber) {
        const keys = forge.pki.rsa.generateKeyPair(2048);
        const cert = forge.pki.createCertificate();

        cert.publicKey = keys.publicKey;
        cert.serialNumber = serialNumber || Math.floor(Math.random() * 100000) + "";
        cert.validity.notBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
        cert.validity.notAfter = new Date(Date.now() + 824 * 24 * 60 * 60 * 1000);

        return { keys, cert };
    }

    /**
     *
     * @param {String} commonName - server name
     * @returns {Object}
     */
    static createCertificateAuthority(commonName) {
        const { keys, cert } = this.createCertificate();
        const attrs = this.defaultAttrs.concat([{ name: "commonName", value: commonName || "CertManager" }]);

        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.setExtensions([{ name: "basicConstraints", cA: true }]);
        cert.sign(keys.privateKey, forge.md.sha256.create());

        return {
            key: forge.pki.privateKeyToPem(keys.privateKey),
            cert: forge.pki.certificateToPem(cert),
        };
    }

    /**
     *
     * @param {String} domain - ip/domain
     * @param {Object} config - certificate autority config {key,value}
     * @returns {Object}
     */
    static createSelfSignedCertificate(domain, config) {
        const md = forge.md.md5.create();
        md.update(domain);

        const { keys, cert } = this.createCertificate(md.digest().toHex());
        const caCert = forge.pki.certificateFromPem(config.cert);
        const caKey = forge.pki.privateKeyFromPem(config.key);

        const attrs = this.defaultAttrs.concat([{ name: "commonName", value: domain }]);
        const altNames = /^\d+?\.\d+?\.\d+?\.\d+?$/.test(domain) ? [{ type: 7, ip: domain }] : [{ type: 2, value: domain }];
        const extensions = [
            { name: "basicConstraints", cA: false },
            { name: "subjectAltName", altNames },
        ];

        cert.setIssuer(caCert.subject.attributes);
        cert.setSubject(attrs);
        cert.setExtensions(extensions);
        cert.sign(caKey, forge.md.sha256.create());

        return {
            key: forge.pki.privateKeyToPem(keys.privateKey),
            cert: forge.pki.certificateToPem(cert),
        };
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
 * @example
 * // Create transparent rpoxy
 * const proxy = new TransparentProxy();
 *
 * // Listen request&response events
 * proxy.database.on('request,.*', (eventName, req) => {
 *     console.log(req.method, req.href);
 * });
 * proxy.database.on('response,.*', (eventName, res) => {
 *     console.log(res.status);
 * });
 *
 * // Start server
 * const server = proxy.listen(8888, () => {
 *     console.log("proxy started");
 *     console.log(server.address());
 * });
 *
 * // Intercept request&response
 * proxy.use('https://jsonplaceholder.typicode.com/.*', (req,res,next) => {
 *     // this method will call twice
 *     // on before request
 *     // and on before response
 *     if(req){}
 *     if(res){}
 *     // when done call
 *     next()
 * })
 * // or more spesific using method
 * proxy.post('https://jsonplaceholder.typicode.com/posts', (req,res,next) => {
 *     // this method will call twice
 *     // on before request
 *     // and on before response
 *     if(req){}
 *     if(res){}
 *     // when done call
 *     next()
 * })
 *
 * // Stop server
 * setTimeout(() => {
 *     proxy.close();
 *     console.log("proxy stopped");
 * }, 2000);
 */
class TransparentProxy {
    rules = [];

    /**
     *
     */
    static async generateCertificateAuthority() {
        let ca = {};
        try {
            ca.key = fs.readFileSync("./ca.key");
            ca.cert = fs.readFileSync("./ca.crt");
        } catch (error) {
            ca = Certificate.createCertificateAuthority();

            fs.writeFileSync("./ca.key", ca.key);
            fs.writeFileSync("./ca.crt", ca.cert);

            await promisify(exec)(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd ${process.cwd()} && certutil -enterprise -addstore -f root ${process.cwd()}\\ca.crt'"`);
        }
        return ca;
    }

    /**
     *
     */
    constructor() {
        this.database = new Database();

        this.handleSocketError = this.handleSocketError.bind(this);
        this.handleServerError = this.handleServerError.bind(this);
        this.handleServerUpgrade = this.handleServerUpgrade.bind(this);
        this.handleServerResponse = this.handleServerResponse.bind(this);
        this.handleRequest = this.handleRequest.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleConnection = this.handleConnection.bind(this);
        this.handleConnect = this.handleConnect.bind(this);
        this.SNICallback = this.SNICallback.bind(this);

        const methods = ["POST", "GET", "PATCH", "PUT", "DELETE"];

        for (let i = 0; i < methods.length; i++) {
            const method = methods[i];

            this[method.toLowerCase()] = (...args) => {
                this.add(method, ...args);
            };
        }
    }

    add(method, path, callback) {
        if (typeof method == "object") {
            ({ method, path, callback } = method);
        }
        let regexp = path.source || path;
        regexp = new RegExp("^" + regexp, "i");
        this.rules.push({ method, path, callback, regexp });
    }

    /**
     *
     */
    use(...args) {
        this.add(".*", ...args);
    }

    handleConnection(socket) {}

    handleConnect(req, socket, head) {
        const { port, address } = this.httpsServer.address();
        const socketServer = net.connect(port, address, () => {
            let message = "";
            message += "HTTP/1.1 200 OK\r\n";
            message += "\r\n";

            socket.write(message);
            socketServer.write(head);
            socketServer.pipe(socket);
            socket.pipe(socketServer);

            socketServer.on("error", this.handleSocketError);
            socket.on("error", this.handleSocketError);
        });
    }

    async handleRequest(req, res, head) {
        let { request, protocol, socket } = this.request(req, res);
        const doc = this.database.post();
        let callback;

        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];
            const passed = (rule.method == ".*" || rule.method == request.method) && rule.regexp.test(request.href);

            if (passed) {
                callback = rule.callback;
                break;
            }
        }
        this.readRequest(req, request, doc);

        if (callback) {
            request = await this.beforeRequest(request, doc, callback);
        }
        const reqServer = protocol.request(request);

        reqServer.on("error", this.handleServerError);
        reqServer.on("upgrade", this.handleServerUpgrade(socket, head));
        reqServer.on("response", this.handleServerResponse(doc, callback, res));

        request.body.pipe(reqServer);
    }

    async beforeRequest(request, doc, callback) {
        request = await new Promise(async (resolve) => {
            request = await new Promise((resolve) => {
                this.database.once(`request,${doc._id}`, resolve);
            });

            callback(request, null, () => {
                this.writeRequest(request);
                resolve(request);
            });
        });
        return request;
    }

    request(req, res) {
        const base = (req.socket.encrypted ? "https:" : "http") + "//" + req.headers.host;
        const url = new URL2(req.url, base);
        const protocol = url.protocol == "https:" ? https : http;
        const socket = res;

        let request = url;
        request.method = req.method;
        request.headers = new Headers(req.headers);
        request.body = req;

        return { request, protocol, socket };
    }

    response(resServer) {
        let response = {};

        response.body = resServer;
        response.status = resServer.statusCode;
        response.headers = new Headers(resServer.headers);

        return response;
    }

    handleServerResponse(doc, callback, res) {
        return async (resServer) => {
            let response = this.response(resServer);
            const encoding = response.headers.get("content-encoding");
            this.readResponse(response, encoding, doc);

            if (callback) {
                response = await this.beforeResponse(response, doc, callback, encoding);
            }
            res.writeHead(response.status, response.headers.entries());
            response.body.pipe(res);
        };
    }

    async beforeResponse(response, doc, callback, encoding) {
        response = await new Promise(async (resolve) => {
            response = await new Promise((resolve) => {
                this.database.once(`response,${doc._id}`, resolve);
            });

            callback(null, response, () => {
                this.writeResponse(response, encoding);
                resolve(response);
            });
        });
        return response;
    }

    handleServerUpgrade(socket, head) {
        return (resServer, socketServer, headServer) => {
            let message = "";
            message += "HTTP/1.1 101 Switching Protocols\r\n";

            for (const name in resServer.headers) {
                message += `${name}: ${resServer.headers[name]}\r\n`;
            }
            message += "\r\n";

            socket.write(message);
            socketServer.write(head);
            socketServer.pipe(socket);
            socket.pipe(socketServer);

            socketServer.on("error", this.handleSocketError);
            socket.on("error", this.handleSocketError);
        };
    }

    readRequest(req, request, doc) {
        let buffer = [];

        req.on("data", (chunk) => {
            buffer.push(chunk);
        });

        req.on("end", () => {
            let body = "" + Buffer.concat(buffer);
            request.body = body;
            this.database.patch(doc._id, { request });
        });
    }

    writeRequest(request) {
        let readable = request.body;

        if (!(request.body instanceof Readable)) {
            readable = new Readable();
            readable.push(request.body);
            readable.push(null);
        }
        request.body = readable;
    }

    readResponse(response, encoding, doc) {
        let readable = response.body;

        if (encoding == "gzip") {
            readable = readable.pipe(zlib.createGunzip());
        } else if (encoding == "deflate") {
            readable = readable.pipe(zlib.createInflate());
        } else if (encoding == "br") {
            readable = readable.pipe(zlib.createBrotliDecompress());
        }
        let buffer = [];

        readable.on("data", (chunk) => {
            buffer.push(chunk);
        });

        readable.on("end", () => {
            let body = "" + Buffer.concat(buffer);
            response.body = body;
            this.database.patch(doc._id, { response });
        });
    }

    writeResponse(response, encoding) {
        let readable = response.body;

        if (!(response.body instanceof Readable)) {
            readable = new Readable();
            readable.push(response.body);
            readable.push(null);

            if (encoding == "gzip") {
                readable = readable.pipe(zlib.createGzip());
            } else if (encoding == "deflate") {
                readable = readable.pipe(zlib.createDeflate());
            } else if (encoding == "br") {
                readable = readable.pipe(zlib.createBrotliCompress());
            }
        }
        response.body = readable;
    }

    handleError(err) {}

    handleSocketError(err) {}

    handleServerError(err) {}

    ctx = {};

    async SNICallback(servername, cb) {
        let err = null;
        let ctx = null;

        if (this.ctx[servername]) {
            ctx = this.ctx[servername];
        } else {
            const ca = await TransparentProxy.generateCertificateAuthority();
            const cert = Certificate.createSelfSignedCertificate(servername, ca);

            // console.log(ca)
            // console.log(cert)

            ctx = tls.createSecureContext(cert);

            this.ctx[servername] = ctx;
        }
        cb(err, ctx);
    }

    /**
     *
     */
    listen(port, hostname, backlog) {
        if (typeof hostname == "function") {
            backlog = hostname;
            hostname = undefined;
        }

        port = port || 8888;

        Regedit.enableProxy({ hostname: "127.0.0.1", port });
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
        this.httpsServer.close();

        this.httpServer = null;
        this.httpsServer = null;

        Regedit.disableProxy();
    }
}

TransparentProxy.EventEmitter = EventEmitter;
TransparentProxy.Database = Database;
TransparentProxy.Certificate = Certificate;
TransparentProxy.Regedit = Regedit;

module.exports = TransparentProxy;
