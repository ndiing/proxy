# Install

```
npm install @ndiinginc/proxy
```

## ProxyServer

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
### Properties
<dl>
    <dt><code><a href="./docs/proxy-server/log.md">ProxyServer#log</a></code></dt>
    <dd>will be remove, use &#x60;logging&#x60;</dd>
</dl>
<!-- properties -->

<!-- staticproperties -->
<!-- staticproperties -->

<!-- methods -->
### Methods
<dl>
    <dt><code><a href="./docs/proxy-server/post.md">ProxyServer#post()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/proxy-server/get.md">ProxyServer#get()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/proxy-server/set.md">ProxyServer#set()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/proxy-server/patch.md">ProxyServer#patch()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/proxy-server/delete.md">ProxyServer#delete()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/proxy-server/use.md">ProxyServer#use()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/proxy-server/listen.md">ProxyServer#listen()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/proxy-server/close.md">ProxyServer#close()</a></code></dt>
    <dd></dd>
</dl>
<!-- methods -->

<!-- staticmethods -->
<!-- staticmethods -->

<!-- examples -->
### Examples
```js
// Create proxyvar proxy1 = new ProxyServer();// Listen on logging// using request,\d+// response,\d+// and update,\d+// event nameproxy1.logging.on("request.*", (eventName, req) => {    console.log("from proxy1", req.method, req.pathname);});proxy1.listen();setTimeout(() => {    // close after 3minutes    proxy1.close();    // when proxy more than one    // is not close primary proxy    // just proxx configuration for this one}, 1000 * 60 * 3);// like another server proxy// it always create one proxy per machine// register more than one proxy, is only subscribe from// primary proxyvar proxy2 = new ProxyServer();proxy2.logging.on("request.*", (eventName, req) => {    console.log("from proxy2", req.method, req.pathname);});// adding intercept method like// use,get,post,patch,set,delete// it only match one, not like regular router middlewareproxy2.use("https://jsonplaceholder.typicode.com/posts", (req, res, next) => {    if (req) {        delete req.headers["if-none-match"];    }    next();});// when proxy already listening// this method never been callproxy2.listen();setTimeout(() => {    // close after 5minutes    proxy2.close();}, 1000 * 60 * 5);
```

<!-- examples -->

<!-- see -->
<!-- see -->
