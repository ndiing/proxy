const http = require("http");
const https = require("https");
const net = require("net");
const tls = require("tls");
const zlib = require("zlib");
const fs = require("fs");
// const {pipeline} = require('stream')
// const events = require("events");
const { promisify } = require("util");
const { exec } = require("child_process");
const mkcert = require("mkcert");
const regedit = require("regedit").promisified;
const { URL2, Headers } = require("@ndiing/fetch");

// avoid error
process.on("uncaughtException", (err) => {
    console.log(err.message);
});
process.on("unhandledRejection", (err) => {
    console.log(err.message);
});

/**
 * ### Install
 * ```
 * npm install @ndiing/proxy
 * ```
 */
class TransparentProxy {
    rules = [];

    /**
     *
     * @param {Array} rules
     */
    constructor(rules = []) {
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
        let request = new URL2(req.url, (req.socket.encrypted ? "https:" : "http:") + "//" + req.headers.host);
        request.method = req.method;
        request.headers = req.headers;
        const protocol = request.protocol == "https:" ? https : http;

        let callback;
        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];
            const passed = (rule.method == ".*" || rule.method == request.method) && rule.url.test(request.href);

            if (passed) {
                callback = rule.callback;
                break;
            }
        }

        if (callback) {
            request = await new Promise(async (resolve) => {
                request.body = await new Promise((resolve) => {
                    const buffer = [];
                    req.on("data", (chunk) => {
                        buffer.push(chunk);
                    });
                    req.on("end", () => {
                        resolve(Buffer.concat(buffer).toString());
                    });
                });

                callback(request, null, () => resolve(request));
            });
        }

        const reqServer = protocol.request(request);
        reqServer.on("response", async (resServer) => {
            let response = {};
            response.status = resServer.statusCode;
            response.headers = resServer.headers;

            if (callback) {
                let readableStream;
                if (resServer.headers["content-encoding"] == "gzip") {
                    readableStream = zlib.createGunzip();
                } else if (resServer.headers["content-encoding"] == "deflate") {
                    readableStream = zlib.createInflate();
                } else if (resServer.headers["content-encoding"] == "br") {
                    readableStream = zlib.createBrotliDecompress();
                }

                if (readableStream) {
                    resServer.pipe(readableStream);
                }

                const readable = readableStream || resServer;

                response = await new Promise(async (resolve) => {
                    response.body = await new Promise((resolve) => {
                        const buffer = [];
                        readable.on("data", (chunk) => {
                            buffer.push(chunk);
                        });
                        readable.on("end", () => {
                            resolve(Buffer.concat(buffer).toString());
                        });
                    });

                    callback(null, response, () => resolve(response));
                });
            }

            res.writeHead(response.status, response.headers);

            if (callback && response.body) {
                let writableStream;
                if (resServer.headers["content-encoding"] == "gzip") {
                    writableStream = zlib.createGzip();
                } else if (resServer.headers["content-encoding"] == "deflate") {
                    writableStream = zlib.createDeflate();
                } else if (resServer.headers["content-encoding"] == "br") {
                    writableStream = zlib.createBrotliCompress();
                }

                if (writableStream) {
                    writableStream.pipe(res);
                }

                const writable = writableStream || res;

                response.body = Buffer.from(response.body);
                writable.write(response.body);
                writable.end();
            } else {
                resServer.pipe(res);
            }
        });

        req.on("error", this.handleError);

        if (callback && request.body) {
            request.body = Buffer.from(request.body);
            reqServer.write(request.body);
            reqServer.end();
        } else {
            req.pipe(reqServer);
        }
    }

    /**
     *
     * @param {Object} err
     */
    handleError(err) {
        console.log(err.message);
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

        // this.https.on('connection', this.handleConnection)
        // this.https.on('connect', this.handleConnect)
        // this.https.on('upgrade', this.handleUpgrade)
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

module.exports = TransparentProxy;
