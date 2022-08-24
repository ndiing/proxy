# Install

```
npm install @ndiinginc/proxy
```

## EventEmitter

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
<!-- properties -->

<!-- staticproperties -->
<!-- staticproperties -->

<!-- methods -->
### Methods
<dl>
    <dt><code><a href="./docs/event-emitter/on.md">EventEmitter#on()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/event-emitter/emit.md">EventEmitter#emit()</a></code></dt>
    <dd></dd>
</dl>
<!-- methods -->

<!-- staticmethods -->
<!-- staticmethods -->

<!-- examples -->
<!-- examples -->
## Database

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
### Properties
<dl>
    <dt><code><a href="./docs/database/docs.md">Database#docs</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/database/id.md">Database#id</a></code></dt>
    <dd></dd>
</dl>
<!-- properties -->

<!-- staticproperties -->
<!-- staticproperties -->

<!-- methods -->
### Methods
<dl>
    <dt><code><a href="./docs/database/post.md">Database#post()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/database/get.md">Database#get()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/database/patch.md">Database#patch()</a></code></dt>
    <dd></dd>
</dl>
<!-- methods -->

<!-- staticmethods -->
<!-- staticmethods -->

<!-- examples -->
<!-- examples -->
## Certificate
_Create self-signed certificate and certificate authority using &#x60;node-forge&#x60;_

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
### Properties
<dl>
    <dt><code><a href="./docs/certificate/default-attrs.md">Certificate#defaultAttrs</a></code></dt>
    <dd></dd>
</dl>
<!-- properties -->

<!-- staticproperties -->
<!-- staticproperties -->

<!-- methods -->
<!-- methods -->

<!-- staticmethods -->
### Static Methods
<dl>
    <dt><code><a href="./docs/certificate/create-certificate.md">Certificate.createCertificate()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/certificate/create-certificate-authority.md">Certificate.createCertificateAuthority()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/certificate/create-self-signed-certificate.md">Certificate.createSelfSignedCertificate()</a></code></dt>
    <dd></dd>
</dl>
<!-- staticmethods -->

<!-- examples -->
<!-- examples -->
## Regedit

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
<!-- properties -->

<!-- staticproperties -->
<!-- staticproperties -->

<!-- methods -->
<!-- methods -->

<!-- staticmethods -->
### Static Methods
<dl>
    <dt><code><a href="./docs/regedit/enable-proxy.md">Regedit.enableProxy()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/regedit/disable-proxy.md">Regedit.disableProxy()</a></code></dt>
    <dd></dd>
</dl>
<!-- staticmethods -->

<!-- examples -->
<!-- examples -->
## TransparentProxy

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
<!-- properties -->

<!-- staticproperties -->
<!-- staticproperties -->

<!-- methods -->
### Methods
<dl>
    <dt><code><a href="./docs/transparent-proxy/use.md">TransparentProxy#use()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/transparent-proxy/listen.md">TransparentProxy#listen()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/transparent-proxy/close.md">TransparentProxy#close()</a></code></dt>
    <dd></dd>
</dl>
<!-- methods -->

<!-- staticmethods -->
<!-- staticmethods -->

<!-- examples -->
### Examples
```js
// Create transparent rpoxyconst proxy = new TransparentProxy();// Listen request&response eventsproxy.database.on('request,.*', (eventName, req) => {    console.log(req.method, req.href);});proxy.database.on('response,.*', (eventName, res) => {    console.log(res.status);});// Start serverconst server = proxy.listen(8888, () => {    console.log("proxy started");    console.log(server.address());});// Intercept request&responseproxy.use('https://jsonplaceholder.typicode.com/.*', (req,res,next) => {    // this method will call twice    // on before request    // and on before response    if(req){}    if(res){}    // when done call    next()})// or more spesific using methodproxy.post('https://jsonplaceholder.typicode.com/posts', (req,res,next) => {    // this method will call twice    // on before request    // and on before response    if(req){}    if(res){}    // when done call    next()})// Stop serversetTimeout(() => {    proxy.close();    console.log("proxy stopped");}, 2000);
```

<!-- examples -->
