## TransparentProxy()

### Syntax
```
TransparentProxy()
```

### Parameters
<dl>
</dl>

### Return value

<dl>
    <dt>None <code>undefined</code></dt>
</dl>

### Examples
```js
// Usage// Create proxy objectconst proxy = new TransparentProxy();// Event listener// Listen on request// proxy.log.on(/request,\d+/, console.log);// Listen on response// proxy.log.on(/response,\d+/, console.log);// Listen on request&response// proxy.log.on(/update,\d+/, console.log);// Start transparent proxy serverconst server = proxy.listen(8888, () => {    console.log("proxy listen", server.address());});// // Intercepting request&response// proxy.use("https://jsonplaceholder.typicode.com/posts", (req, res, next) => {//     // callback will call twice on//     // before request//     if (req) console.log(req.method, req.url);//     // and before response//     if (res) console.log(res.status);//     next();// });// also you can use spesific methodproxy.get("https://jsonplaceholder.typicode.com/posts", (req, res, next) => {    if (req) {        delete req.headers["if-none-match"];    }    if (res) {        res.body = JSON.stringify([]);    }    next();});// Stop proxy// setTimeout(() => {//     proxy.close();//     console.log("proxy close");// }, 2000);
```


### See also
- [[Transparent proxy](https://en.wikipedia.org/wiki/Proxy_server#:~:text=in%20web%20proxies.-,Transparent%20proxy,requiring%20any%20special%20client%20configuration.)]([Transparent proxy](https://en.wikipedia.org/wiki/Proxy_server#:~:text=in%20web%20proxies.-,Transparent%20proxy,requiring%20any%20special%20client%20configuration.))

