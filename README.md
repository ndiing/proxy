# [proxy](https://ndiing.github.io/proxy/)
proxy

### Install
```
npm install @ndiinginc/proxy
```

### Usage
```js

// Create proxy
const TransparentProxy = require('@ndiinginc/proxy')

// this will automaticaly
// create certificate authority
// import to windows trusted root ca
// enable&disable windows proxy internet settings
const proxy = new TransparentProxy();

// Incoming request&response
// event format =
// request,<id>
// response,<id>
// best practice using regexp
proxy.database.on(/request.*/, console.log);
proxy.database.on(/response.*/, console.log);

// Intercept request&response
// this will call twice on beforeRequest and beforeResponse
proxy.use('https://jsonplaceholder.typicode.com/todos', (req,res,next) => {
    // when req not null is callback from before request
    if(req){
        // remove cache
        req.headers.delete('if-none-match')
    }
    // and when res not null is callback from before response
    if(res){
        // modify response body
        res.body = JSON.stringify([])
    }
    next()
})

// Listen on port 8888
proxy.listen(8888, () => {
    console.log("proxy started on port 8888");
});

// Close proxy
setTimeout(() => {
    proxy.close()
    console.log('proxy stopped')
},1000*1)

```