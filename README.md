# proxy


### Index
- EventEmitter

    <!-- properties -->
    <!-- properties -->
    <!-- staticproperties -->
    <!-- staticproperties -->
    <!-- methods -->
    - Methods
        - [`EventEmitter#on`](#astnode100000115)
        - [`EventEmitter#emit`](#astnode100000132)
    <!-- methods -->
    <!-- staticmethods -->
    <!-- staticmethods -->
    <!-- events -->
    <!-- events -->
- Logger

    <!-- properties -->
    - Properties
        - [`Logger#id`](#astnode100000187)
        - [`Logger#logs`](#astnode100000196)
    <!-- properties -->
    <!-- staticproperties -->
    <!-- staticproperties -->
    <!-- methods -->
    - Methods
        - [`Logger#create`](#astnode100000198)
        - [`Logger#read`](#astnode100000231)
        - [`Logger#update`](#astnode100000242)
        - [`Logger#delete`](#astnode100000317)
    <!-- methods -->
    <!-- staticmethods -->
    <!-- staticmethods -->
    <!-- events -->
    <!-- events -->
- Server

    <!-- properties -->
    - Properties
        - [`Server#logging`](#astnode100000349)
        - [`Server#pools`](#astnode100000352)
    <!-- properties -->
    <!-- staticproperties -->
    <!-- staticproperties -->
    <!-- methods -->
    <!-- methods -->
    <!-- staticmethods -->
    - Static methods
        - [`Server.enableProxy`](#astnode100000354)
        - [`Server.disableProxy`](#astnode100000412)
        - [`Server.createCertificateAuthority`](#astnode100000446)
        - [`Server.listen`](#astnode100001540)
        - [`Server.close`](#astnode100001827)
    <!-- staticmethods -->
    <!-- events -->
    <!-- events -->
- ProxyServer

    <!-- properties -->
    <!-- properties -->
    <!-- staticproperties -->
    <!-- staticproperties -->
    <!-- methods -->
    - Methods
        - [`ProxyServer#post`](#astnode100001890)
        - [`ProxyServer#get`](#astnode100001904)
        - [`ProxyServer#set`](#astnode100001918)
        - [`ProxyServer#patch`](#astnode100001932)
        - [`ProxyServer#delete`](#astnode100001946)
        - [`ProxyServer#use`](#astnode100001960)
        - [`ProxyServer#listen`](#astnode100002014)
        - [`ProxyServer#close`](#astnode100002033)
    <!-- methods -->
    <!-- staticmethods -->
    <!-- staticmethods -->
    <!-- events -->
    <!-- events -->

# EventEmitter


<!-- properties -->
<!-- properties -->
<!-- staticproperties -->
<!-- staticproperties -->
<!-- methods -->
### Methods

<div><a href="./docs/astnode100000115.md" name="astnode100000115"><code>EventEmitter#on(eventName,listener)</code></a></div>


<div><a href="./docs/astnode100000132.md" name="astnode100000132"><code>EventEmitter#emit(eventName,args)</code></a></div>


<!-- methods -->
<!-- staticmethods -->
<!-- staticmethods -->
<!-- events -->
<!-- events -->

<!-- examples -->
<!-- examples -->

# Logger


<!-- properties -->
### Properties

<div><a href="./docs/astnode100000187.md" name="astnode100000187"><code>Logger#id</code></a></div>


<div><a href="./docs/astnode100000196.md" name="astnode100000196"><code>Logger#logs</code></a></div>


<!-- properties -->
<!-- staticproperties -->
<!-- staticproperties -->
<!-- methods -->
### Methods

<div><a href="./docs/astnode100000198.md" name="astnode100000198"><code>Logger#create(log)</code></a></div>


<div><a href="./docs/astnode100000231.md" name="astnode100000231"><code>Logger#read(id)</code></a></div>


<div><a href="./docs/astnode100000242.md" name="astnode100000242"><code>Logger#update(id,log)</code></a></div>


<div><a href="./docs/astnode100000317.md" name="astnode100000317"><code>Logger#delete(id)</code></a></div>


<!-- methods -->
<!-- staticmethods -->
<!-- staticmethods -->
<!-- events -->
<!-- events -->

<!-- examples -->
<!-- examples -->

# Server


<!-- properties -->
### Properties

<div><a href="./docs/astnode100000349.md" name="astnode100000349"><code>Server#logging</code></a></div>


<div><a href="./docs/astnode100000352.md" name="astnode100000352"><code>Server#pools</code></a></div>


<!-- properties -->
<!-- staticproperties -->
<!-- staticproperties -->
<!-- methods -->
<!-- methods -->
<!-- staticmethods -->
### Static methods

<div><a href="./docs/astnode100000354.md" name="astnode100000354"><code>Server.enableProxy(options)</code></a></div>
Enable windows proxy settings &#x60;Check proxy&#x60;

<div><a href="./docs/astnode100000412.md" name="astnode100000412"><code>Server.disableProxy()</code></a></div>
Disable windows proxy settings &#x60;Check proxy&#x60;

<div><a href="./docs/astnode100000446.md" name="astnode100000446"><code>Server.createCertificateAuthority()</code></a></div>
Create ROOT CA &#x60;crt&#x60; and &#x60;key&#x60;, then import to windows trusted root ca

<div><a href="./docs/astnode100001540.md" name="astnode100001540"><code>Server.listen(port,hostname,backlog)</code></a></div>


<div><a href="./docs/astnode100001827.md" name="astnode100001827"><code>Server.close()</code></a></div>


<!-- staticmethods -->
<!-- events -->
<!-- events -->

<!-- examples -->
<!-- examples -->

# ProxyServer


<!-- properties -->
<!-- properties -->
<!-- staticproperties -->
<!-- staticproperties -->
<!-- methods -->
### Methods

<div><a href="./docs/astnode100001890.md" name="astnode100001890"><code>ProxyServer#post(args)</code></a></div>


<div><a href="./docs/astnode100001904.md" name="astnode100001904"><code>ProxyServer#get(args)</code></a></div>


<div><a href="./docs/astnode100001918.md" name="astnode100001918"><code>ProxyServer#set(args)</code></a></div>


<div><a href="./docs/astnode100001932.md" name="astnode100001932"><code>ProxyServer#patch(args)</code></a></div>


<div><a href="./docs/astnode100001946.md" name="astnode100001946"><code>ProxyServer#delete(args)</code></a></div>


<div><a href="./docs/astnode100001960.md" name="astnode100001960"><code>ProxyServer#use(args)</code></a></div>


<div><a href="./docs/astnode100002014.md" name="astnode100002014"><code>ProxyServer#listen(args)</code></a></div>


<div><a href="./docs/astnode100002033.md" name="astnode100002033"><code>ProxyServer#close()</code></a></div>


<!-- methods -->
<!-- staticmethods -->
<!-- staticmethods -->
<!-- events -->
<!-- events -->

<!-- examples -->
### Examples

```js
// Create proxyconst proxy1 = new ProxyServer()// Network monitoring/logging// (eventName, requestObject)proxy1.logging.on('request.*', console.log)// (eventName, responseObject)proxy1.logging.on('response.*', console.log)// (eventName, logObject)// logObject={id,request,response}proxy1.logging.on('update.*', console.log)// Start serverproxy1.listen(8888, () => {    console.log('proxy1 started')})// Stop server aftersetTimeout(() => {    proxy1.close()    console.log('proxy1 stopped')}, 1000 * 5)// Create anaother proxy// it will subscribe with previous active proxyconst proxy2 = new ProxyServer()// Intercept request and response// using `use` function for global `request.method`// and post,get,patch,put,delete for spesific `request.method`// it's not like router middlewareproxy2.use('https://jsonplaceholder.typicode.com/posts', (req,res,next) => {    // this callback will call twice    // on before request    if(req){        // intercept req        delete req.headers['if-none-match'] // remove cache    }    // and before response    if(res){        // intercept res        res.body = JSON.stringify([]) // response with empty json array    }    // then continue request/response    // with `next` callback method    next()})// Start server// when previous proxy still active// this method never been call// so the port are still the saameproxy2.listen(8888, () => {    console.log('proxy2 started')})// Stop server after// also it never been stop until all proxy are stoppedsetTimeout(() => {    proxy2.close()    console.log('proxy2 stopped')}, 1000 * 10)// and thats it, just simple like that
```

<!-- examples -->

