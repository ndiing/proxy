const http = require("http");
const https = require("https");
const tls = require("tls");
const net = require("net");
const { generateRootCA, generateCertsForHostname } = require("@ndiinginc/cert");
const Request = require("@ndiinginc/fetch/lib/request");
const Response = require("@ndiinginc/fetch/lib/response");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Mengatur server proxy untuk Windows.
 *
 * @param {string} [address="127.0.0.1"] - Alamat IP dari server proxy.
 * @param {number} [port=8000] - Port dari server proxy.
 * @param {boolean} enable - Jika true, proxy diaktifkan; jika false, proxy dinonaktifkan.
 *
 * @throws {Error} - Jika terjadi kesalahan saat mengubah pengaturan proxy.
 */
function setProxyServer(address = "127.0.0.1", port = 8000, enable) {
    try {
        if (enable) {
            execSync('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f');
            execSync('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyOverride /t REG_SZ /d "<-loopback>" /f');
            execSync(`reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "http=${address}:${port};https=${address}:${port};ftp=${address}:${port}" /f`);
        } else {
            execSync('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f');
            execSync('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyOverride /t REG_SZ /d "" /f');
            execSync('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "" /f');
        }
    } catch (error) {}
}

/**
 * Mengambil alamat server proxy yang sedang digunakan.
 *
 * @returns {string|null} - Alamat server proxy dalam format "http://address:port" atau null jika tidak ada.
 *
 * @throws {Error} - Jika terjadi kesalahan saat mengambil pengaturan proxy.
 */
function getProxyServer() {
    try {
        const output = execSync('reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /s /f "ProxyServer"');
        const array = Array.from(output.toString().matchAll(/([^= ;]+)=([^;\r\n]+)/g), (match) => match.slice(1).join("://"));
        const string = array.find((string) => string.includes("http"));
        return string;
    } catch (error) {}
    return null;
}

/**
 * Menghasilkan CA root untuk sertifikat SSL.
 *
 * @returns {{ key: Buffer, cert: Buffer }} - Objek yang berisi kunci privat dan sertifikat root.
 *
 * @throws {Error} - Jika terjadi kesalahan saat menghasilkan atau membaca kunci dan sertifikat.
 */
function generateRootCA2() {
    let key, cert;

    const dirname = path.join(process.cwd());
    const keyfile = path.join(dirname, "root.key");
    const crtfile = path.join(dirname, "root.crt");

    try {
        key = fs.readFileSync(keyfile);
        cert = fs.readFileSync(crtfile);
    } catch (error) {
        const root = generateRootCA();

        key = root.privateKey;
        cert = root.certificate;

        fs.writeFileSync(keyfile, key);
        fs.writeFileSync(crtfile, cert);

        execSync(`powershell -Command "Start-Process cmd -Verb RunAs -ArgumentList '/c cd ${dirname} && certutil -enterprise -addstore -f root ${crtfile}'"`, { shell: true });
    }

    return { key, cert };
}

// const root = generateRootCA()
// console.log(root)

const contexts = {};

/**
 * Menangani callback SNI (Server Name Indication) untuk TLS.
 *
 * @param {string} servername - Nama host server yang terhubung.
 * @param {Function} cb - Callback yang dipanggil dengan konteks TLS.
 * @param {Error|null} cb.err - Kesalahan jika ada, null jika tidak ada.
 * @param {SecureContext} cb.ctx - Konteks TLS yang terkait dengan servername.
 *
 * @throws {Error} - Jika terjadi kesalahan saat menghasilkan sertifikat.
 *
 * @example
 * const server = tls.createServer({
 *     SNICallback: handleSNICallback
 * }, (socket) => {
 *     // Handle socket
 * });
 * server.listen(443);
 */
function handleSNICallback(servername, cb) {
    let err,
        ctx = contexts[servername];

    if (!ctx) {
        const root = generateRootCA2();
        const host = generateCertsForHostname(servername, root);

        ctx = tls.createSecureContext({
            key: host.privateKey,
            cert: host.certificate,
        });

        contexts[servername] = ctx;
    }

    console.log(Object.keys(contexts));

    cb(err, ctx);
}

const httpServer = http.createServer();
const httpsServer = https.createServer({
    SNICallback: handleSNICallback,
});

function handleClose() {}
/**
 * Menangani koneksi HTTP CONNECT untuk tunneling (misalnya, HTTPS).
 *
 * @param {http.IncomingMessage} req - Objek permintaan HTTP.
 * @param {net.Socket} socket - Socket yang terhubung dari klien.
 * @param {Buffer} head - Bagian pertama dari data yang diterima.
 *
 * @throws {Error} - Jika terjadi kesalahan saat mengatur koneksi.
 *
 * @example
 * const server = http.createServer(handleConnect);
 * server.listen(3000);
 */
function handleConnect(req, socket, head) {
    const { port, address: host } = httpsServer.address();
    const socket2 = net.connect(port, host, () => {
        // connectionListener
        socket.write("HTTP/1.1 200 OK\r\n\r\n");
        socket2.write(head);

        socket2.pipe(socket);
        socket.pipe(socket2);
    });
    socket.on("error", handleError);
    socket2.on("error", handleError);
}
function handleConnection(socket) {}
function handleError(err) {
    // console.log(err);
}
function handleTimeout() {}
/**
 * Menangani respons dari permintaan dan meneruskan ke respons klien.
 *
 * @param {http.IncomingMessage} req - Objek permintaan HTTP dari klien.
 * @param {http.ServerResponse} res - Objek respons HTTP yang akan dikirim ke klien.
 * @param {http.IncomingMessage} res2 - Objek respons yang diterima dari server upstream.
 *
 * @throws {Error} - Jika terjadi kesalahan saat mengalirkan data dari respons.
 *
 * @example
 * const server = http.createServer((req, res) => {
 *     const res2 = fetchUpstreamResponse(req); // Asumsi ada fungsi fetchUpstreamResponse()
 *     handleResponse(req, res, res2);
 * });
 * server.listen(3000);
 */
function handleResponse(req, res, res2) {
    const response = new Response(res2, {
        status: res2.statusCode,
        statusText: res2.statusMessage,
        headers: res2.headers,
    });

    // console.log(response.status);

    res.writeHead(response.status, response.headers);
    response.body.pipe(res);
}
/**
 * Menangani permintaan HTTP dan meneruskannya ke server upstream.
 *
 * @param {http.IncomingMessage} req - Objek permintaan HTTP yang diterima dari klien.
 * @param {http.ServerResponse} res - Objek respons HTTP yang akan dikirim ke klien.
 * @param {Buffer} head - Bagian pertama dari data yang diterima (digunakan untuk upgrade).
 *
 * @throws {Error} - Jika terjadi kesalahan saat mengalirkan data atau dalam permintaan upstream.
 *
 * @example
 * const server = http.createServer(handleRequest);
 * server.listen(3000);
 */
function handleRequest(req, res, head) {
    const protocol = req.socket.encrypted ? "https:" : "http:";
    const host = req.headers.host;
    const url = req.url,
        base = `${protocol}//${host}`;
    const url2 = new URL(url, base);
    const request = new Request(url2.toString(), {
        method: req.method,
        headers: req.headers,
        body: req,
    });

    // console.log(request.url);

    const req2 = request.client.request(request);

    req2.on("close", handleClose);
    req2.on("timeout", handleTimeout);
    req2.on("error", handleError);
    req2.on("upgrade", (req2, res2, head2) => handleUpgrade(req, res, head, req2, res2, head2));
    req2.on("response", (res2) => handleResponse(req, res, res2));

    request.body.pipe(req2);
}
/**
 * Menangani upgrade koneksi HTTP (seperti WebSocket).
 *
 * @param {http.IncomingMessage} req - Objek permintaan HTTP dari klien.
 * @param {net.Socket} socket - Socket yang terhubung dari klien.
 * @param {Buffer} head - Bagian pertama dari data yang diterima (digunakan untuk upgrade).
 * @param {http.IncomingMessage} req2 - Objek permintaan HTTP dari server upstream.
 * @param {net.Socket} socket2 - Socket yang terhubung dari server upstream.
 * @param {Buffer} head2 - Bagian pertama dari data yang diterima dari server upstream.
 *
 * @throws {Error} - Jika terjadi kesalahan saat mengalirkan data atau menulis ke socket.
 */
function handleUpgrade(req, socket, head, req2, socket2, head2) {
    // req, socket, head,
    // req2, socket2, head2
    let raw = "";
    raw += `HTTP/1.1 101 Switching Protocols\r\n`;
    for (const name in req2.headers) {
        const value = req2.headers[name];
        raw += `${name}: ${value}\r\n`;
    }
    raw += `\r\n`;

    socket.write(raw);
    socket2.write(head);

    socket2.pipe(socket);
    socket.pipe(socket2);

    socket.on("error", handleError);
    socket2.on("error", handleError);
}

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

/**
 * Memulai server HTTP dan HTTPS.
 *
 * @param {number} [port=8000] - Port untuk server HTTP. Default adalah 8000.
 * @param {string} [hostname='0.0.0.0'] - Nama host untuk server. Default adalah '0.0.0.0'.
 * @param {Function} [backlog=() => console.log(httpServer.address())] - Fungsi callback yang dipanggil setelah server mulai mendengarkan.
 *
 * @throws {Error} - Jika terjadi kesalahan saat memulai server.
 *
 * @example
 * start(3000, 'localhost', () => {
 *     console.log('Server is running on http://localhost:3000');
 * });
 */
function start(port = 8000, hostname = "0.0.0.0", backlog = (address) => address) {
    // setProxyServer("127.0.0.1", "8000", true);
    // setProxyServer("127.0.0.1", "8000", false);
    // console.log(getProxyServer());

    httpServer.listen(port, hostname, () => backlog(httpServer.address()));
    httpsServer.listen(0, "0.0.0.0", () => backlog(httpsServer.address()));
}

/**
 * Menghentikan server HTTP dan HTTPS.
 *
 * @throws {Error} - Jika terjadi kesalahan saat menghentikan server.
 *
 * @example
 * stop();
 */
function stop() {
    httpServer.close();
    httpsServer.close();
}

module.exports = {
    setProxyServer,
    getProxyServer,
    start,
    stop,
};

// start(8000,'0.0.0.0',(address) => {console.log(address);/* stop() */})
