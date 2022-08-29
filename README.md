# Install

```
npm install @ndiinginc/proxy
```

## EventEmitter

<!-- constructor -->
### Constructor
<dl>
    <dt><code><a href="./docs//event-emitter.md">EventEmitter()</a></code></dt>
    <dd></dd>
</dl>
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
## Logger

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
### Properties
<dl>
    <dt><code><a href="./docs/logger/id.md">Logger#id</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/logger/logs.md">Logger#logs</a></code></dt>
    <dd></dd>
</dl>
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
<!-- examples -->

<!-- see -->
<!-- see -->
## Server

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
### Properties
<dl>
    <dt><code><a href="./docs/server/logging.md">Server#logging</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/server/pools.md">Server#pools</a></code></dt>
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
    <dt><code><a href="./docs/server/enable-proxy.md">Server.enableProxy()</a></code></dt>
    <dd>Enable windows proxy settings &#x60;Check proxy&#x60;</dd>
    <dt><code><a href="./docs/server/disable-proxy.md">Server.disableProxy()</a></code></dt>
    <dd>Disable windows proxy settings &#x60;Check proxy&#x60;</dd>
    <dt><code><a href="./docs/server/create-certificate-authority.md">Server.createCertificateAuthority()</a></code></dt>
    <dd>Create ROOT CA &#x60;crt&#x60; and &#x60;key&#x60;, then import to windows trusted root ca</dd>
    <dt><code><a href="./docs/server/listen.md">Server.listen()</a></code></dt>
    <dd></dd>
    <dt><code><a href="./docs/server/close.md">Server.close()</a></code></dt>
    <dd></dd>
</dl>
<!-- staticmethods -->

<!-- examples -->
<!-- examples -->

<!-- see -->
<!-- see -->
## ProxyServer

<!-- constructor -->
<!-- constructor -->

<!-- properties -->
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
// Create proxyconst proxy1 = new ProxyServer()// Network monitoring/logging// (eventName, requestObject)proxy1.logging.on('request.*', console.log)// (eventName, responseObject)proxy1.logging.on('response.*', console.log)// (eventName, logObject)// logObject={id,request,response}proxy1.logging.on('update.*', console.log)// Start serverproxy1.listen(8888, () => {    console.log('proxy1 started')})// Stop server aftersetTimeout(() => {    proxy1.close()    console.log('proxy1 stopped')}, 1000 * 5)// Create anaother proxy// it will subscribe with previous active proxyconst proxy2 = new ProxyServer()// Intercept request and response// using `use` function for global `request.method`// and post,get,patch,put,delete for spesific `request.method`// it's not like router middlewareproxy2.use('https://jsonplaceholder.typicode.com/posts', (req,res,next) => {    // this callback will call twice    // on before request    if(req){        // intercept req        delete req.headers['if-none-match'] // remove cache    }    // and before response    if(res){        // intercept res        res.body = JSON.stringify([]) // response with empty json array    }    // then continue request/response    // with `next` callback method    next()})// Start server// when previous proxy still active// this method never been call// so the port are still the saameproxy2.listen(8888, () => {    console.log('proxy2 started')})// Stop server after// also it never been stop until all proxy are stoppedsetTimeout(() => {    proxy2.close()    console.log('proxy2 stopped')}, 1000 * 10)// and thats it, just simple like that
```

<!-- examples -->

<!-- see -->
<!-- see -->
