const http = require("http");
const https = require("https");
const net = require("net");
const tls = require("tls");
const fs = require("fs");
const zlib = require("zlib");
const { promisify } = require("util");
const { exec } = require("child_process");
const mkcert = require("mkcert");
const regedit = require("regedit").promisified;
process.on("uncaughtException", (err) => {
    console.log(err);
});
process.on("unhandledRejection", (err) => {
    console.log(err);
});

/**
 * Nodejs transparent proxy
 * ### Install
 * ```
 * npm install @ndiing/proxy
 * ```
 * @see {@link ./examples/proxy.js}
 * @module proxy
 */

/**
 *
 */
class TransparentProxy {
    routes = [];

    /**
     *
     */
    constructor(routes = []) {
        this.handleClientConnection = this.handleClientConnection.bind(this);
        this.handleClientConnect = this.handleClientConnect.bind(this);
        this.handleClientRequest = this.handleClientRequest.bind(this);
        this.handleClientError = this.handleClientError.bind(this);
        this.handleSocketError = this.handleSocketError.bind(this);
        this.SNICallback = this.SNICallback.bind(this);

        for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            this.add(route);
        }
    }

    add(route = {}) {
        let { method = ".*", protocol = ".*", hostname = ".*", path = ".*", callback = (req, res, next) => next() } = route;
        method = new RegExp(method);
        protocol = new RegExp(protocol);
        hostname = new RegExp(hostname);
        path = new RegExp(path);
        this.routes.push({ method, protocol, hostname, path, callback });
    }

    /**
     *
     */
    async enableWindowsInternetSettings() {
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
        } catch (error) {}
    }

    /**
     *
     */
    async disableWindowsInternetSettings() {
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
        } catch (error) {}
    }

    /**
     *
     * @param {*} domain
     * @param {*} ca
     * @returns {Any}
     */
    async createCert(domain, ca) {
        return mkcert.createCert({
            domains: ["::1", "127.0.0.1", "localhost", domain],
            validityDays: 365,
            caKey: ca.key,
            caCert: ca.cert,
        });
    }

    /**
     *
     * @returns {Any}
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
     * @param {*} socket
     */
    handleClientConnection(socket) {}

    /**
     *
     * @param {*} req
     * @param {*} socket
     * @param {*} head
     */
    handleClientConnect(req, socket, head) {
        const socketServer = net.connect(this.httpsServer.address().port, this.hostname, () => {
            socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
            socketServer.write(head);
            socketServer.pipe(socket);
            socket.pipe(socketServer);
        });
        socketServer.on("error", this.handleSocketError);
        socket.on("error", this.handleSocketError);
    }

    /**
     * @typedef req
     * @property {String} req.method -
     * @property {String} req.protocol -
     * @property {String} req.hostname -
     * @property {Number} req.port -
     * @property {String} req.path -
     * @property {Object} req.headers -
     * @property {Stream} req.stream -
     * @property {Buffer} req.body -
     */

    /**
     * @typedef res
     * @property {Number} res.status -
     * @property {Object} res.headers -
     * @property {Stream} res.stream -
     * @property {Buffer} res.body -
     */

    /**
     *
     * @param {*} req
     * @param {*} res
     */
    async handleClientRequest(req, res) {
        const instance = req.socket.encrypted ? https : http;
        let [hostname, port] = req.headers.host.split(":");
        const request = {};

        request.method = req.method;
        request.protocol = req.socket.encrypted ? "https:" : "http:";
        request.hostname = hostname;
        request.port = parseInt(port || (req.socket.encrypted ? 443 : 80));
        request.path = req.url;
        request.headers = req.headers;
        // request.stream = req;
        request.body = [];

        for await (const chunk of req) {
            request.body.push(chunk);
        }

        let handle;

        // console.log(this.routes);
        for (let i = 0; i < this.routes.length; i++) {
            const { method, protocol, hostname, path, callback } = this.routes[i];
            const passed =
                method.test(request.method) && //
                protocol.test(request.protocol) &&
                hostname.test(request.hostname) &&
                path.test(request.path);
            if (passed) {
                handle = callback;
                break;
            }
        }

        if (handle) {
            await new Promise((resolve) => handle(request, null, () => resolve()));
        }

        const reqServer = instance.request(request, async (resServer) => {
            const contentEncoding = resServer.headers["content-encoding"];
            let readStream = resServer;

            if (/\bdeflate\b/.test(contentEncoding)) {
                readStream = zlib.createInflate();
            } else if (/\bgzip\b/.test(contentEncoding)) {
                readStream = zlib.createGunzip();
            } else if (/\bbr\b/.test(contentEncoding)) {
                readStream = zlib.createBrotliDecompress();
            }

            if (readStream !== resServer) {
                resServer.pipe(readStream);
            }
            const response = {};
            response.status = resServer.statusCode;
            response.headers = resServer.headers;
            // response.stream = resServer;
            response.body = [];

            for await (const chunk of readStream) {
                response.body.push(chunk);
            }

            if (handle) {
                await new Promise((resolve) => handle(null, response, () => resolve()));
            }

            res.writeHead(response.status, response.headers);

            let writeStream = res;

            if (/\bdeflate\b/.test(contentEncoding)) {
                writeStream = zlib.createDeflate();
            } else if (/\bgzip\b/.test(contentEncoding)) {
                writeStream = zlib.createGzip();
            } else if (/\bbr\b/.test(contentEncoding)) {
                writeStream = zlib.createBrotliCompress();
            }

            if (writeStream !== res) {
                writeStream.pipe(res);
            }

            if (response.body) {
                response.body = Buffer.concat(response.body);
                writeStream.write(response.body);
            }
            writeStream.end();
        });

        if (request.body) {
            request.body = Buffer.concat(request.body);
            reqServer.write(request.body);
        }
        reqServer.end();
    }

    /**
     *
     * @param {*} err
     */
    handleClientError(err) {}

    /**
     *
     * @param {*} err
     */
    handleSocketError(err) {}

    /**
     *
     * @param {*} servername
     * @param {*} cb
     */
    async SNICallback(servername, cb) {
        const err = null;
        let ctx;

        if (!this.ctx) {
            this.ctx = {};
        }

        if (this.ctx[servername]) {
            ctx = this.ctx[servername];
        } else {
            // createCA
            const ca = await this.createCA();
            // createCert
            const cert = await this.createCert(servername, ca);
            // createSecureContext
            ctx = tls.createSecureContext(cert);
            this.ctx[servername] = ctx;
        }
        cb(err, ctx);
    }

    /**
     *
     * @param {*} port
     * @param {*} hostname
     * @param {*} backlog
     * @returns {Object}
     */
    async listen(port, hostname, backlog) {
        if (typeof hostname == "function") {
            backlog = hostname;
            hostname = "127.0.0.1";
        }
        this.port = port;
        this.hostname = hostname;
        // enableWindowsInternetSettings
        await this.enableWindowsInternetSettings();
        // httpServer
        this.httpServer = http.createServer().listen(this.port, this.hostname, backlog);
        this.httpServer.on("connection", this.handleClientConnection);
        this.httpServer.on("connect", this.handleClientConnect);
        this.httpServer.on("request", this.handleClientRequest);
        this.httpServer.on("error", this.handleClientError);
        // httpsServer
        this.httpsServer = https.createServer({ SNICallback: this.SNICallback }).listen(0, hostname);
        this.httpsServer.on("request", this.handleClientRequest);
        this.httpsServer.on("error", this.handleClientError);
        return this.httpServer;
    }

    /**
     *
     */
    async close() {
        this.httpServer.close();
        this.httpServer = null;
        this.httpsServer.close();
        this.httpsServer = null;
        // disableWindowsInternetSettings
        await this.disableWindowsInternetSettings();
    }
}

module.exports = TransparentProxy;
