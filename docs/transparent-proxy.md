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
// Create transparent rpoxyconst proxy = new TransparentProxy();// Listen request&response eventsproxy.database.on('request,.*', (eventName, req) => {    console.log(req.method, req.href);});proxy.database.on('response,.*', (eventName, res) => {    console.log(res.status);});// Start serverconst server = proxy.listen(8888, () => {    console.log("proxy started");    console.log(server.address());});// Intercept request&responseproxy.use('https://jsonplaceholder.typicode.com/.*', (req,res,next) => {    // this method will call twice    // on before request    // and on before response    if(req){}    if(res){}    // when done call    next()})// or more spesific using methodproxy.post('https://jsonplaceholder.typicode.com/posts', (req,res,next) => {    // this method will call twice    // on before request    // and on before response    if(req){}    if(res){}    // when done call    next()})// Stop serversetTimeout(() => {    proxy.close();    console.log("proxy stopped");}, 2000);
```



