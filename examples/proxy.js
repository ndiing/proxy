const TransparentProxy = require("../index.js");

// Intercept HTTP requests
var proxy = new TransparentProxy([
    {
        // method, // use regexp pattern, default method=".*"
        // protocol, // use regexp pattern, default protocol=".*"
        // hostname: "jsonplaceholder.typicode.com", // use regexp pattern, default hostname=".*"
        // path, // use regexp pattern, default path=".*"
        callback: (req, res, next) => {
            // callback will call twice
            // on before request
            // and on before response

            // when req exists
            // it from before request
            if (req) {
                // property that can be intercept
                // req.method
                // req.protocol
                // req.hostname
                // req.port
                // req.path
                // req.headers
                // req.body
                console.log(req.method,req.path)
                // console.log(Buffer.concat(req.body||[]).toString());
            }

            // when res exists
            // it form before response
            if (res) {
                // property that can be intercept
                // res.status
                // res.headers
                // res.body
                console.log(res.status)
                // console.log(Buffer.concat(res.body||[]).toString());
            }

            // when done
            // resolve with `next()`
            next();
        },
    },
]);

// proxy.listen(8888, () => {
//     console.log("proxy listen on port 8888");
// });

// setTimeout(() => {
//     proxy.close();
//     console.log("proxy closed");
// }, 1000 * 1);
