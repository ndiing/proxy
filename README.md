## Functions

<dl>
<dt><a href="#setProxyServer">setProxyServer([address], [port], enable)</a></dt>
<dd><p>Mengatur server proxy untuk Windows.</p>
</dd>
<dt><a href="#getProxyServer">getProxyServer()</a> ⇒ <code>string</code> | <code>null</code></dt>
<dd><p>Mengambil alamat server proxy yang sedang digunakan.</p>
</dd>
<dt><a href="#generateRootCA2">generateRootCA2()</a> ⇒ <code>Object</code></dt>
<dd><p>Menghasilkan CA root untuk sertifikat SSL.</p>
</dd>
<dt><a href="#handleSNICallback">handleSNICallback(servername, cb)</a></dt>
<dd><p>Menangani callback SNI (Server Name Indication) untuk TLS.</p>
</dd>
<dt><a href="#handleConnect">handleConnect(req, socket, head)</a></dt>
<dd><p>Menangani koneksi HTTP CONNECT untuk tunneling (misalnya, HTTPS).</p>
</dd>
<dt><a href="#handleResponse">handleResponse(req, res, res2)</a></dt>
<dd><p>Menangani respons dari permintaan dan meneruskan ke respons klien.</p>
</dd>
<dt><a href="#handleRequest">handleRequest(req, res, head)</a></dt>
<dd><p>Menangani permintaan HTTP dan meneruskannya ke server upstream.</p>
</dd>
<dt><a href="#handleUpgrade">handleUpgrade(req, socket, head, req2, socket2, head2)</a></dt>
<dd><p>Menangani upgrade koneksi HTTP (seperti WebSocket).</p>
</dd>
<dt><a href="#start">start([port], [hostname], [backlog])</a></dt>
<dd><p>Memulai server HTTP dan HTTPS.</p>
</dd>
<dt><a href="#stop">stop()</a></dt>
<dd><p>Menghentikan server HTTP dan HTTPS.</p>
</dd>
</dl>

<a name="setProxyServer"></a>

## setProxyServer([address], [port], enable)
Mengatur server proxy untuk Windows.

**Kind**: global function  
**Throws**:

- <code>Error</code> - Jika terjadi kesalahan saat mengubah pengaturan proxy.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [address] | <code>string</code> | <code>&quot;\&quot;127.0.0.1\&quot;&quot;</code> | Alamat IP dari server proxy. |
| [port] | <code>number</code> | <code>8000</code> | Port dari server proxy. |
| enable | <code>boolean</code> |  | Jika true, proxy diaktifkan; jika false, proxy dinonaktifkan. |

<a name="getProxyServer"></a>

## getProxyServer() ⇒ <code>string</code> \| <code>null</code>
Mengambil alamat server proxy yang sedang digunakan.

**Kind**: global function  
**Returns**: <code>string</code> \| <code>null</code> - - Alamat server proxy dalam format "http://address:port" atau null jika tidak ada.  
**Throws**:

- <code>Error</code> - Jika terjadi kesalahan saat mengambil pengaturan proxy.

<a name="generateRootCA2"></a>

## generateRootCA2() ⇒ <code>Object</code>
Menghasilkan CA root untuk sertifikat SSL.

**Kind**: global function  
**Returns**: <code>Object</code> - - Objek yang berisi kunci privat dan sertifikat root.  
**Throws**:

- <code>Error</code> - Jika terjadi kesalahan saat menghasilkan atau membaca kunci dan sertifikat.

<a name="handleSNICallback"></a>

## handleSNICallback(servername, cb)
Menangani callback SNI (Server Name Indication) untuk TLS.

**Kind**: global function  
**Throws**:

- <code>Error</code> - Jika terjadi kesalahan saat menghasilkan sertifikat.


| Param | Type | Description |
| --- | --- | --- |
| servername | <code>string</code> | Nama host server yang terhubung. |
| cb | <code>function</code> | Callback yang dipanggil dengan konteks TLS. |
| cb.err | <code>Error</code> \| <code>null</code> | Kesalahan jika ada, null jika tidak ada. |
| cb.ctx | <code>SecureContext</code> | Konteks TLS yang terkait dengan servername. |

**Example**  
```js
const server = tls.createServer({    SNICallback: handleSNICallback}, (socket) => {    // Handle socket});server.listen(443);
```
<a name="handleConnect"></a>

## handleConnect(req, socket, head)
Menangani koneksi HTTP CONNECT untuk tunneling (misalnya, HTTPS).

**Kind**: global function  
**Throws**:

- <code>Error</code> - Jika terjadi kesalahan saat mengatur koneksi.


| Param | Type | Description |
| --- | --- | --- |
| req | <code>http.IncomingMessage</code> | Objek permintaan HTTP. |
| socket | <code>net.Socket</code> | Socket yang terhubung dari klien. |
| head | <code>Buffer</code> | Bagian pertama dari data yang diterima. |

**Example**  
```js
const server = http.createServer(handleConnect);server.listen(3000);
```
<a name="handleResponse"></a>

## handleResponse(req, res, res2)
Menangani respons dari permintaan dan meneruskan ke respons klien.

**Kind**: global function  
**Throws**:

- <code>Error</code> - Jika terjadi kesalahan saat mengalirkan data dari respons.


| Param | Type | Description |
| --- | --- | --- |
| req | <code>http.IncomingMessage</code> | Objek permintaan HTTP dari klien. |
| res | <code>http.ServerResponse</code> | Objek respons HTTP yang akan dikirim ke klien. |
| res2 | <code>http.IncomingMessage</code> | Objek respons yang diterima dari server upstream. |

**Example**  
```js
const server = http.createServer((req, res) => {    const res2 = fetchUpstreamResponse(req); // Asumsi ada fungsi fetchUpstreamResponse()    handleResponse(req, res, res2);});server.listen(3000);
```
<a name="handleRequest"></a>

## handleRequest(req, res, head)
Menangani permintaan HTTP dan meneruskannya ke server upstream.

**Kind**: global function  
**Throws**:

- <code>Error</code> - Jika terjadi kesalahan saat mengalirkan data atau dalam permintaan upstream.


| Param | Type | Description |
| --- | --- | --- |
| req | <code>http.IncomingMessage</code> | Objek permintaan HTTP yang diterima dari klien. |
| res | <code>http.ServerResponse</code> | Objek respons HTTP yang akan dikirim ke klien. |
| head | <code>Buffer</code> | Bagian pertama dari data yang diterima (digunakan untuk upgrade). |

**Example**  
```js
const server = http.createServer(handleRequest);server.listen(3000);
```
<a name="handleUpgrade"></a>

## handleUpgrade(req, socket, head, req2, socket2, head2)
Menangani upgrade koneksi HTTP (seperti WebSocket).

**Kind**: global function  
**Throws**:

- <code>Error</code> - Jika terjadi kesalahan saat mengalirkan data atau menulis ke socket.


| Param | Type | Description |
| --- | --- | --- |
| req | <code>http.IncomingMessage</code> | Objek permintaan HTTP dari klien. |
| socket | <code>net.Socket</code> | Socket yang terhubung dari klien. |
| head | <code>Buffer</code> | Bagian pertama dari data yang diterima (digunakan untuk upgrade). |
| req2 | <code>http.IncomingMessage</code> | Objek permintaan HTTP dari server upstream. |
| socket2 | <code>net.Socket</code> | Socket yang terhubung dari server upstream. |
| head2 | <code>Buffer</code> | Bagian pertama dari data yang diterima dari server upstream. |

<a name="start"></a>

## start([port], [hostname], [backlog])
Memulai server HTTP dan HTTPS.

**Kind**: global function  
**Throws**:

- <code>Error</code> - Jika terjadi kesalahan saat memulai server.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [port] | <code>number</code> | <code>8000</code> | Port untuk server HTTP. Default adalah 8000. |
| [hostname] | <code>string</code> | <code>&quot;&#x27;0.0.0.0&#x27;&quot;</code> | Nama host untuk server. Default adalah '0.0.0.0'. |
| [backlog] | <code>function</code> | <code>() &#x3D;&gt; console.log(httpServer.address())</code> | Fungsi callback yang dipanggil setelah server mulai mendengarkan. |

**Example**  
```js
start(3000, 'localhost', () => {    console.log('Server is running on http://localhost:3000');});
```
<a name="stop"></a>

## stop()
Menghentikan server HTTP dan HTTPS.

**Kind**: global function  
**Throws**:

- <code>Error</code> - Jika terjadi kesalahan saat menghentikan server.

**Example**  
```js
stop();
```
