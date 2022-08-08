const TransparentProxy = require("../index.js");

// Intercept HTTP requests
const rules=[
    // basic rule
    // rule calling twice on before request and on before response
    // when req values exist and res null it's mean on before request
    // when req null and res values exists it's mean on before response
    { callback(req,res,next){
        if(req){console.log(req)}
        if(res){console.log(res)}
        next()
    } },
    // limit something
    // another rule are
    // all prop is string regexp
    // default .*
    // { method, hostname, path }
    // example
    { hostname:'jsonplaceholder.typicode.com',callback(req,res){
        console.log(req)
        console.log(res)
        next()
    } }
]
const proxy = new TransparentProxy(rules);

proxy.listen(8888, () => {
    console.log("proxy listen on port 8888");
});

setTimeout(() => {
    proxy.close();
    console.log("proxy closed");
}, 1000 * 60);
