# Install

```
npm install @ndiinginc/proxy
```

## EventEmitter
_Extended &#x60;EventEmitter&#x60; in flavor &#x60;RegExp&#x60;_

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

<!-- see -->
<!-- see -->
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

<!-- see -->
<!-- see -->
## Logger
_Used in transparent proxy, for record request&amp;response while monitoring_

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
<!-- properties -->

<!-- staticproperties -->
<!-- staticproperties -->

<!-- methods -->
### Methods
<dl>
    <dt><code><a href="./docs/logger/create.md">Logger#create()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/logger/read.md">Logger#read()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/logger/update.md">Logger#update()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/logger/delete.md">Logger#delete()</a></code></dt>
    <dd></dd>
</dl>
<!-- methods -->

<!-- staticmethods -->
<!-- staticmethods -->

<!-- examples -->
### Examples
```js
// Usageconst log = new Logger()// Create initial `_id`var doc = log.create()console.log(doc)// Update when requestvar doc = log.update(doc._id,{request:{}})console.log(doc)// Update when responsevar doc = log.update(doc._id,{response:{}})console.log(doc)// Read request&respoonse docconsole.log(log.read(doc._id))
```

<!-- examples -->

<!-- see -->
<!-- see -->
## TransparentProxy
_Fast proxy without redundancy, &#x60;Transparent proxy&#x60;. Also known as an &#x60;intercepting proxy&#x60;, &#x60;inline proxy&#x60;, or &#x60;forced proxy&#x60;, a transparent proxy intercepts normal application layer communication without requiring any special client configuration._

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
<!-- properties -->

<!-- staticproperties -->
<!-- staticproperties -->

<!-- methods -->
### Methods
<dl>
    <dt><code><a href="./docs/transparent-proxy/add.md">TransparentProxy#add()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/transparent-proxy/use.md">TransparentProxy#use()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/transparent-proxy/post.md">TransparentProxy#post()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/transparent-proxy/get.md">TransparentProxy#get()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/transparent-proxy/patch.md">TransparentProxy#patch()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/transparent-proxy/put.md">TransparentProxy#put()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/transparent-proxy/delete.md">TransparentProxy#delete()</a></code></dt>
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
// Usage// Create proxy objectconst proxy = new TransparentProxy();// Event listener// Listen on request// proxy.log.on(/request,\d+/, console.log);// Listen on response// proxy.log.on(/response,\d+/, console.log);// Listen on request&response// proxy.log.on(/update,\d+/, console.log);// Start transparent proxy serverconst server = proxy.listen(8888, () => {    console.log("proxy listen", server.address());});// // Intercepting request&response// proxy.use("https://jsonplaceholder.typicode.com/posts", (req, res, next) => {//     // callback will call twice on//     // before request//     if (req) console.log(req.method, req.url);//     // and before response//     if (res) console.log(res.status);//     next();// });// also you can use spesific methodproxy.get("https://jsonplaceholder.typicode.com/posts", (req, res, next) => {    if (req) {        delete req.headers["if-none-match"];    }    if (res) {        res.body = JSON.stringify([]);    }    next();});// Stop proxy// setTimeout(() => {//     proxy.close();//     console.log("proxy close");// }, 2000);
```

<!-- examples -->

<!-- see -->
### See also
- [Transparent proxy](https://en.wikipedia.org/wiki/Proxy_server#:~:text&#x3D;in%20web%20proxies.-,Transparent%20proxy,requiring%20any%20special%20client%20configuration.)
<!-- see -->
