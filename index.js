const http = require("http");
const https = require("https");
const net = require("net");
const tls = require("tls");
const zlib = require("zlib");
const fs = require("fs");
const { Readable, PassThrough } = require("stream");
const events = require("events");
const { promisify } = require("util");
const { exec } = require("child_process");
const mkcert = require("mkcert");
const regedit = require("regedit").promisified;
const { URL2, Headers } = require("@ndiing/fetch");

// avoid error
process.on("uncaughtException", (err) => {
    console.log(err);
});
process.on("unhandledRejection", (err) => {
    console.log(err);
});

/**
 * ### Install
 * ```
 * npm install @ndiing/proxy
 * ```
 * @module proxy
 */

/**
 * EventEmitter with regexp
 */
class EventEmitter extends events {
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
     * @param {String} eventName
     * @param  {...any} args
     */
    emit(eventName, ...args) {
        super.emit(eventName, ...args);
        for (const _eventName in this._events) {
            if (new RegExp(_eventName).test(eventName) && _eventName !== eventName) {
                super.emit(_eventName, eventName, ...args);
            }
        }
    }
}

// const ee = new EventEmitter();
// ee.on("book", console.log);
// ee.on(".*", console.log);
// ee.emit("book", "ge the book");

/**
 *
 */
class Store extends EventEmitter {
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
    data = [];

    /**
     *
     * @param {Object} doc
     * @returns {Object}
     */
    create(doc = {}) {
        doc._id = this.id;
        this.data[doc._id] = doc;
        return { _id: doc._id, ok: true };
    }

    /**
     *
     * @param {Number} _id
     * @returns {Object}
     */
    read(_id) {
        return this.data[_id];
    }

    /**
     *
     * @param {Number} _id
     * @param {Object} doc
     * @returns {Object}
     */
    update(_id, doc = {}) {
        let old = this.read(_id);
        if (old) {
            for (const name in doc) {
                if (name == "_id") {
                    continue;
                }

                // store,0,request
                // store,0,response
                let value = doc[name];
                this.emit("" + ["doc", _id, name], value);
                old[name] = value;
            }

            // store,0
            this.emit("" + ["doc", _id], old);

            return { _id, ok: true };
        }

        return { _id, ok: false };
    }

    /**
     *
     * @param {Number} _id
     * @returns {Object}
     */
    destroy(_id) {
        let old = this.read(_id);
        this.data[_id] = null;
        return { _id, ok: !!old };
    }
}

/**
 *
 */
class TransparentProxy extends Store {
    /**
     *
     */
    rules = [];

    /**
     *
     * @param {Array} rules
     */
    constructor(rules = []) {
        super();
        this.SNICallback = this.SNICallback.bind(this);
        this.handleConnection = this.handleConnection.bind(this);
        this.handleConnect = this.handleConnect.bind(this);
        this.handleUpgrade = this.handleUpgrade.bind(this);
        this.handleRequest = this.handleRequest.bind(this);
        this.handleError = this.handleError.bind(this);

        for (let i = 0; i < http.METHODS.length; i++) {
            const method = http.METHODS[i];

            this[method.toLowerCase()] = (...args) => {
                this.add(method, ...args);
            };
        }

        for (let j = 0; j < rules.length; j++) {
            const { method = ".*", url = ".*", callback } = rules[j];
            this.add({ method, url, callback });
        }
    }

    add(method, url, callback) {
        if (typeof method == "object") {
            ({ method, url, callback } = method);
        }

        if (typeof url == "function") {
            callback = url;
            url = ".*";
        }

        url = new RegExp(`^${url}$`, "i");
        this.rules.push({ method, url, callback });
    }

    /**
     *
     * @param  {String/Function} url
     * @param  {Function} callback
     */
    use(...args) {
        this.add(".*", ...args);
    }

    /**
     *
     * @param {String} domain
     * @param {Object} ca
     * @returns {Object}
     */
    async createCert(domain, ca) {
        return await mkcert.createCert({
            domains: ["::1", "127.0.0.1", "localhost", domain],
            validityDays: 365,
            caKey: ca.key,
            caCert: ca.cert,
        });
    }

    /**
     *
     * @returns {Object}
     */
    async createCA() {
        let ca = {};
        try {
            ca.key = fs.readFileSync("./ca.key");
            ca.cert = fs.readFileSync("./ca.crt");
        } catch (error) {
            ca = await mkcert.createCA({
                organization: "NDIING",
                countryCode: "ID",
                state: "JATIM",
                locality: "PACITAN",
                validityDays: 365,
            });

            fs.writeFileSync("./ca.key", ca.key);
            fs.writeFileSync("./ca.crt", ca.cert);
            await promisify(exec)(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd ${process.cwd()} && certutil -enterprise -addstore -f root ${process.cwd()}\\ca.crt'"`);
        }

        return ca;
    }

    /**
     *
     */
    async enableProxy() {
        try {
            await regedit.putValue({
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
                    ProxyEnable: {
                        value: 1,
                        type: "REG_DWORD",
                    },

                    ProxyOverride: {
                        value: "<-loopback>",
                        type: "REG_SZ",
                    },

                    ProxyServer: {
                        value: `http=${this.hostname}:${this.port};https=${this.hostname}:${this.port};ftp=${this.hostname}:${this.port}`,
                        type: "REG_SZ",
                    },
                },
            });
        } catch (error) {
            // console.log(error)
        }
    }

    /**
     *
     */
    async disableProxy() {
        try {
            await regedit.putValue({
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
                    ProxyEnable: {
                        value: 0,
                        type: "REG_DWORD",
                    },

                    ProxyOverride: {
                        value: "",
                        type: "REG_SZ",
                    },

                    ProxyServer: {
                        value: "",
                        type: "REG_SZ",
                    },
                },
            });
        } catch (error) {
            // console.log(error)
        }
    }

    ctx = {};

    /**
     *
     * @param {String} servername
     * @param {Function} cb
     */
    async SNICallback(servername, cb) {
        let err = null;
        let ctx = null;
        if (this.ctx[servername]) {
            ctx = this.ctx[servername];
        } else {
            const ca = await this.createCA();
            const cert = await this.createCert(servername, ca);
            ctx = tls.createSecureContext(cert);
            this.ctx[servername] = ctx;
        }

        cb(err, ctx);
    }

    /**
     *
     * @param {Stream} socket
     */
    handleConnection(socket) {
        // socket.on("data", (chunk) => {
        //     let data = "" + chunk;
        //     if (data.indexOf("CONNECT") !== -1) {
        //         console.log(data);
        //     }
        // });
    }

    /**
     *
     * @param {Stream} req
     * @param {Stream} socket
     * @param {Stream} head
     */
    handleConnect(req, socket, head) {
        const serverSocket = net.connect(this.https.address().port, this.hostname, () => {
            socket.write(
                "HTTP/1.1 200 Connection Established\r\n" +
                    // 'Proxy-agent: Node.js-Proxy\r\n' +
                    "\r\n"
            );
            serverSocket.write(head);
            serverSocket.pipe(socket);
            socket.pipe(serverSocket);
        });

        serverSocket.on("error", this.handleError);
        socket.on("error", this.handleError);
    }

    /**
     *
     * @param {Stream} req
     * @param {Stream} socket
     * @param {Stream} head
     */
    handleUpgrade(req, socket, head) {
        socket.write(
            "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
                "Upgrade: WebSocket\r\n" + //
                "Connection: Upgrade\r\n" +
                "\r\n"
        );
        socket.pipe(socket); // echo back
        socket.on("error", this.handleError);
    }

    /**
     *
     * @param {Stream} req
     * @param {Stream} res
     */
    async handleRequest(req, res) {
        const base = (req.socket.encrypted ? "https:" : "http:") + "//" + req.headers.host;
        const input = new URL2(req.url, base);

        let request = {
            ...input,
            method: req.method,
            headers: new Headers(req.headers),
            body: req,
        };

        let callback;

        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];
            const passed = (rule.method == ".*" || rule.method == request.method) && rule.url.test(request.href);
            if (passed) {
                callback = rule.callback;
                break;
            }
        }

        let readable = request.body;
        const doc = this.create();

        const buffer = [];
        readable.on("data", (chunk) => {
            buffer.push(chunk);
        });
        readable.on("end", () => {
            request.body = Buffer.concat(buffer);
            this.update(doc._id, { request });
        });

        if (callback) {
            // block request
            request = await new Promise(async (resolve) => {
                request = await new Promise((resolve) => {
                    this.once("" + ["doc", doc._id, "request"], resolve);
                });
                callback(request, null, () => {
                    resolve(request);
                });
            });
        }

        if (!(request.body instanceof Readable)) {
            readable = new Readable();
            readable.push(request.body);
            readable.push(null);

            request.body = readable;
        }

        const protocol = input.protocol == "https:" ? https : http;

        const reqServer = protocol.request(request);
        reqServer.on("response", async (resServer) => {
            let response = {
                status: resServer.statusCode,
                headers: new Headers(resServer.headers),
                body: resServer,
            };

            let readable = response.body;
            const encoding = response.headers.get("content-encoding");

            if (encoding == "gzip") {
                readable = response.body.pipe(zlib.createGunzip());
            } else if (encoding == "deflate") {
                readable = response.body.pipe(zlib.createInflate());
            } else if (encoding == "br") {
                readable = response.body.pipe(zlib.createBrotliDecompress());
            }

            const buffer = [];
            readable.on("data", (chunk) => {
                buffer.push(chunk);
            });
            readable.on("end", () => {
                response.body = Buffer.concat(buffer);
                this.update(doc._id, { response });
            });

            if (callback) {
                // block response
                response = await new Promise(async (resolve) => {
                    response = await new Promise((resolve) => {
                        this.once("" + ["doc", doc._id, "response"], resolve);
                    });
                    callback(null, response, () => {
                        resolve(response);
                    });
                });
            }

            if (!(response.body instanceof Readable)) {
                readable = new Readable();
                readable.push(response.body);
                readable.push(null);

                response.body = readable;

                if (encoding == "gzip") {
                    readable = response.body.pipe(zlib.createGzip());
                } else if (encoding == "deflate") {
                    readable = response.body.pipe(zlib.createDeflate());
                } else if (encoding == "br") {
                    readable = response.body.pipe(zlib.createBrotliCompress());
                }

                response.body = readable;
            }

            res.writeHead(response.status, response.headers.entries());
            response.body.pipe(res);
        });

        request.body.pipe(reqServer);
    }

    /**
     *
     * @param {Object} err
     */
    handleError(err) {
        console.log(err);
    }

    /**
     *
     * @param {Number} port
     * @param {String/Function} hostname
     * @param {Function} backlog
     * @returns {Object}
     */
    async listen(port, hostname, backlog) {
        if (typeof hostname == "function") {
            backlog = hostname;
            hostname = "";
        }

        this.port = port || 8888;
        this.hostname = hostname || "127.0.0.1";

        await this.enableProxy();

        this.http = http.createServer().listen(this.port, this.hostname, backlog);

        let SNICallback = this.SNICallback;

        this.https = https.createServer({ SNICallback }).listen(0, this.hostname);

        this.http.on("connection", this.handleConnection);
        this.http.on("connect", this.handleConnect);
        this.http.on("upgrade", this.handleUpgrade);
        this.http.on("request", this.handleRequest);
        this.http.on("error", this.handleError);

        this.https.on("connection", this.handleConnection);
        this.https.on("connect", this.handleConnect);
        this.https.on("upgrade", this.handleUpgrade);
        this.https.on("request", this.handleRequest);
        this.https.on("error", this.handleError);

        return this.http;
    }

    /**
     *
     */
    async close() {
        this.http.close();
        this.https.close();

        this.http = null;
        this.https = null;

        await this.disableProxy();
    }
}

TransparentProxy.EventEmitter = EventEmitter;
TransparentProxy.Store = Store;
module.exports = TransparentProxy;

// jsdoc2md proxy/index.js > proxy/README.md
