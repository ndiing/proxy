const http = require("http");
const https = require("https");
const mkcert = require("mkcert");
const tls = require("tls");
const net = require("net");
const fs = require("fs");
const { exec } = require("child_process");
const { promisify } = require("util");
const regedit = require("regedit").promisified;

process.on("uncaughtException", (error) => {
    console.log("uncaughtException", error);
});
process.on("unhandledRejection", (error) => {
    console.log("unhandledRejection", error);
});

/**
 * Nodejs intercept Proxy
 * ### Install
 * ```
 * npm install @ndiing/proxy
 * ```
 * ### Usage
 * ```js
 * const Proxy = require('../index.js')
 *
 * // Create proxy
 * const proxy = Proxy({
 *     port: 8888,
 *     hostname: "127.0.0.1",
 *     beforeRequest: (req, res, next) => next(),
 *     afterRequest: (req, res, next) => next(),
 *     beforeResponse: (req, res, next) => next(),
 *     afterResponse: (req, res, reqServer, resServer, next) => {
 *         console.log(req.postData)
 *         console.log(resServer.content)
 *         next();
 *     },
 * });
 *
 * // Start proxy
 * proxy.listen();
 * console.log("listened");
 *
 * setTimeout(() => {
 *     // Stop proxy
 *     proxy.close();
 *     console.log("closed");
 * }, 1000 * 60);
 *
 * ```
 * @param {Object} options
 * @module Proxy
 */
function Proxy(options = {}) {
    options = {
        port: 8888,
        hostname: "127.0.0.1",
        beforeRequest: (req, res, next) => next(),
        afterRequest: (req, res, next) => next(),
        beforeResponse: (req, res, next) => next(),
        afterResponse: (req, res, reqServer, resServer, next) => next(),
        ...options,
    };

    /**
     * Enable windows proxy server
     * @param {Number} port -
     * @param {String} hostname -
     * @memberof module:Proxy
     */
    async function enableWindowsProxy(port = options.port, hostname = options.hostname) {
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
                        value: `http=${hostname}:${port};https=${hostname}:${port};ftp=${hostname}:${port}`,
                        type: "REG_SZ",
                    },
                },
            });
        } catch (error) {
            // ignore
        }
    }

    /**
     * Disabled windows proxy server
     * @memberof module:Proxy
     */
    async function disableWindowsProxy() {
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
            // ignore
        }
    }

    /**
     * Create TLS Certificate
     * @param {String} domain -
     * @param {Object} ca -
     * @returns {Object}
     * @memberof module:Proxy
     */
    function createCert(domain, ca = {}) {
        return mkcert.createCert({
            domains: ["::1", "127.0.0.1", "localhost", domain],
            validityDays: 365,
            caKey: ca.key,
            caCert: ca.cert,
        });
    }

    /**
     * Trusted Root Certificate Authorization on windows
     * @returns {Promise}
     * @memberof module:Proxy
     */
    function trustedRootCA() {
        return promisify(exec)(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd ${process.cwd()} && certutil -enterprise -addstore -f root ${process.cwd()}/cert.pem'"`);
    }

    /**
     * Create Certificate Authorization
     * @returns {Object}
     * @memberof module:Proxy
     */
    async function createCA() {
        let ca = {};
        try {
            ca = {
                cert: fs.readFileSync("./cert.pem"),
                key: fs.readFileSync("./key.pem"),
            };
        } catch (error) {
            ca = await mkcert.createCA({
                organization: "CA",
                countryCode: "CA",
                state: "CA",
                locality: "CA",
                validityDays: 365,
            });
            fs.writeFileSync("./cert.pem", ca.cert);
            fs.writeFileSync("./key.pem", ca.key);
            await trustedRootCA();
        }
        return ca;
    }

    let httpServer;
    let httpsServer;

    /**
     * Start proxy
     * @param {Number} port -
     * @param {String} hostname -
     * @param {Function} backlog -
     * @memberof module:Proxy
     */
    async function listen(port = options.port, hostname = options.hostname, backlog = function () {}) {
        await enableWindowsProxy(options.port, options.hostname);

        async function handleClientRequest(req, res) {
            const url = { protocol: "http:", port: 80 };
            let protocol = http;
            if (req.socket.encrypted) {
                url.protocol = "https:";
                url.port = 443;
                protocol = https;
            }
            const [hostname, port] = req.headers.host.split(":");
            const requestOptions = {
                method: req.method,
                protocol: url.protocol,
                hostname,
                port: parseInt(port || url.port),
                path: req.url,
                headers: {
                    ...req.headers,
                    // Host: req.headers.host,
                    Connection: "keep-alive",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
                    Accept: "*/*", //"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    "Accept-Encoding": "*", //"gzip, deflate, br",
                    "Accept-Language": "*", //"en-US,en;q=0.9,id;q=0.8",
                },
            };

            // har request
            req.postData = {
                mimeType: req.headers["content-type"],
                text: "",
            };
            const buffer = [];
            for await (const chunk of req) buffer.push(chunk);
            req.postData.text = Buffer.concat(buffer).toString();
            await new Promise((resolve) => options.beforeRequest(req, res, (next) => resolve()));
            async function callback(resServer) {
                await new Promise((resolve) => options.afterRequest(req, res, (next) => resolve()));
                await new Promise((resolve) => options.beforeResponse(req, res, (next) => resolve()));
                resServer.pipe(res);
                // har response
                resServer.content = {
                    mimeType: resServer.headers["content-type"],
                    text: "",
                };
                const buffer = [];
                for await (const chunk of resServer) buffer.push(chunk);
                resServer.content.text = Buffer.concat(buffer).toString();
                await new Promise((resolve) => options.afterResponse(req, res, reqServer, resServer, (next) => resolve()));
            }
            const reqServer = protocol.request(requestOptions, callback);
            req.pipe(reqServer);
        }

        function handleClientError(err) {}

        function handleSocketError(err) {}

        function handleClientConnect(req, socket, head) {
            const port = httpsServer.address().port;
            const host = hostname;

            function connectionListener() {
                socket.write(
                    // prettier-ignore
                    "HTTP/1.1 200 Connection Established\r\n" + 
                    // "Proxy-agent: Node.js-Proxy\r\n" +
                    "\r\n"
                );
                socketServer.write(head);
                socketServer.pipe(socket);
                socket.pipe(socketServer);
            }

            const socketServer = net.connect(port, host, connectionListener);

            socket.on("error", handleSocketError);
            socketServer.on("error", handleSocketError);
        }

        const ctxs = {};
        async function SNICallback(servername, cb) {
            let ctx;
            if (ctxs[servername]) ctx = ctxs[servername];
            else {
                const ca = await createCA();
                const cert = await createCert(servername, ca);
                ctx = tls.createSecureContext(cert);
                ctxs[servername] = ctx;
            }
            cb(undefined, ctx);
        }

        httpServer = http.createServer().listen(port, hostname, backlog);
        httpsServer = https.createServer({ SNICallback }).listen(0, hostname);

        httpServer.on("request", handleClientRequest);
        httpsServer.on("request", handleClientRequest);
        httpServer.on("error", handleClientError);
        httpsServer.on("error", handleClientError);
        httpServer.on("connect", handleClientConnect);
        // httpServer.on("connection", (socket) => {
        //     socket.on('data',chunk => {
        //         console.log(''+chunk)
        //     })
        // });
    }

    /**
     * Stop proxy
     * @memberof module:Proxy
     */
    async function close() {
        httpServer.close();
        httpsServer.close();

        httpServer = null;
        httpsServer = null;

        await disableWindowsProxy();
    }

    return {
        enableWindowsProxy,
        disableWindowsProxy,
        createCert,
        trustedRootCA,
        createCA,
        listen,
        close,
    };
}

module.exports = Proxy;
