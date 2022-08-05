const http = require("http");
const https = require("https");
const net = require("net");
const tls = require("tls");
const fs = require("fs");
const mkcert = require("mkcert");
const regedit = require("regedit").promisified;
const url = require("url");
const { promisify } = require("util");
let { exec } = require("child_process");
exec = promisify(exec);

process.on("uncaughtException", (error, origin) => {
    console.log(error);
    console.log(origin);
});
process.on("unhandledRejection", (reason, promise) => {
    console.log(reason);
    console.log(promise);
});

/**
 * 
 * @param {Object} options -
 * @param {Object} options.hostname=127.0.0.1 -
 * @param {Object} options.port=8888 -
 * @param {Object} options.handleBeforeRequest - (req,res,next) => next()
 * @param {Object} options.handleAfterRequest - (req,res,next) => next()
 * @param {Object} options.handleBeforeResponse - (req,res,reqServer,resServer,next) => next()
 * @param {Object} options.handleAfterResponse - (req,res,reqServer,resServer,next) => next()
 * @module proxy
 */
function Proxy(options = {}) {
    const {
        //
        hostname = "127.0.0.1",
        port = 8888,
        cwd = process.cwd(),
        handleBeforeRequest = (req, res, next) => next(),
        handleAfterRequest = (req, res, next) => next(),
        handleBeforeResponse = (req, res, reqServer, resServer, next) => next(),
        handleAfterResponse = (req, res, reqServer, resServer, next) => next(),
    } = options;
    let httpServer;
    let httpsServer;
    let ca = {};
    const ctxServer = {};

    async function createCert(domain, ca) {
        return await mkcert.createCert({
            domains: ["127.0.0.1", "localhost", "::1", domain],
            validityDays: 365,
            caKey: ca.key,
            caCert: ca.cert,
        });
    }

    async function createCA() {
        let ca = {};

        try {
            ca.key = fs.readFileSync("./key.pem");
            ca.cert = fs.readFileSync("./cert.pem");
        } catch (error) {
            ca = await mkcert.createCA({
                organization: "Ndiing Proxy",
                countryCode: "Ndiing Proxy",
                state: "Ndiing Proxy",
                locality: "Ndiing Proxy",
                validityDays: 365,
            });
            fs.writeFileSync("./key.pem", ca.key);
            fs.writeFileSync("./cert.pem", ca.cert);
            await exec(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd ${cwd} && certutil -enterprise -addstore -f root ${cwd + "/cert.pem"}'"`);
        }
        return ca;
    }

    async function enableProxy() {
        try {
            await regedit.putValue({
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
                    ProxyEnable: {
                        value: 1,
                        type: "REG_DWORD",
                    },
                    ProxyServer: {
                        value: "http=127.0.0.1:8888;https=127.0.0.1:8888;ftp=127.0.0.1:8888",
                        type: "REG_SZ",
                    },
                    ProxyOverride: {
                        value: "<-loopback>",
                        type: "REG_SZ",
                    },
                },
            });
        } catch (error) {}
    }

    async function disableProxy() {
        try {
            await regedit.putValue({
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings": {
                    ProxyEnable: {
                        value: 0,
                        type: "REG_DWORD",
                    },
                    ProxyServer: {
                        value: "",
                        type: "REG_SZ",
                    },
                    ProxyOverride: {
                        value: "",
                        type: "REG_SZ",
                    },
                },
            });
        } catch (error) {}
    }

    /** @private */
    async function SNICallback(servername, cb) {
        let ctx;

        if (ctxServer[servername]) {
            ctx = ctxServer[servername];
        } else {
            const cert = await createCert(servername, ca);
            ctx = tls.createSecureContext(cert);
            ctxServer[servername] = ctx;
        }
        cb(null, ctx);
    }

    /** @private */
    async function bodyParser(req) {
        let buffer = [];
        for await (const chunk of req) buffer.push(chunk);
        return Buffer.concat(buffer).toString();
    }

    /** @private */
    function handleClose() {
        // console.log('handleClose')
    }

    /** @private */
    function handleConnection(socket) {
        // console.log('handleConnection')
    }

    /** @private */
    function handleError(err) {
        // console.log('handleError')
    }

    /** @private */
    function handleConnect(req, socket, head) {
        const port = httpsServer.address().port;
        const socketServer = net.connect(port, hostname, () => {
            socket.write(
                "HTTP/1.1 200 Connection Established\r\n" +
                    // "Proxy-agent: Node.js-Proxy\r\n" + //
                    "\r\n"
            );
            socketServer.write(head);
            socketServer.pipe(socket);
            socket.pipe(socketServer);
        });
        socket.on("close", handleClose);
        socket.on("error", handleError);
        socketServer.on("close", handleClose);
        socketServer.on("error", handleError);
    }

    /** @private */
    async function handleRequest(req, res) {
        await new Promise((resolve) => handleBeforeRequest(req, res, (next) => resolve()));

        const Url = url.parse((req.socket.encrypted ? "https:" : "http:") + "//" + req.headers.host + req.url);
        const protocol = Url.protocol == "https:" ? https : http;

        const options = {
            method: req.method,
            ...Url,
            port: parseInt(Url.port || (Url.protocol == "https:" ? 443 : 80)),
            headers: {
                ...req.headers,
                Connection: "keep-alive",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
                Accept: "*/*", //"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "Accept-Encoding": "*", //"gzip, deflate, br",
                "Accept-Language": "*", //"en-US,en;q=0.9,id;q=0.8",
            },
        };

        req.body = await bodyParser(req);
        await new Promise((resolve) => handleAfterRequest(req, res, (next) => resolve()));

        const reqServer = protocol.request(options, async function (resServer) {
            await new Promise((resolve) => handleBeforeResponse(req, res, reqServer, resServer, (next) => resolve()));
            resServer.pipe(res);
            resServer.body = await bodyParser(resServer);
            await new Promise((resolve) => handleAfterResponse(req, res, reqServer, resServer, (next) => resolve()));
        });
        req.pipe(reqServer);
    }

    /**
     * start proxy
     * @memberof module:proxy
     */
    async function listen() {
        await enableProxy();

        ca = await createCA();

        httpServer = http.createServer().listen(port, () => {
            console.log(httpServer.address());
        });

        httpsServer = https.createServer({ SNICallback }).listen(0, () => {
            // console.log(httpsServer.address())
        });

        httpServer.on("close", handleClose);
        httpServer.on("connection", handleConnection);
        httpServer.on("error", handleError);
        httpServer.on("connect", handleConnect);
        httpServer.on("request", handleRequest);
        httpsServer.on("close", handleClose);
        httpsServer.on("error", handleError);
        httpsServer.on("request", handleRequest);
    }

    /**
     * stop proxy
     * @memberof module:proxy
     */
    async function close() {
        httpServer.close();
        httpsServer.close();

        httpServer = null;
        httpsServer = null;

        await disableProxy();
    }

    return {
        createCert,
        createCA,
        enableProxy,
        disableProxy,
        listen,
        close,
    };
}

module.exports = Proxy
