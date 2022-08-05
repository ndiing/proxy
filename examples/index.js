const Proxy = require('../index.js')

// Create proxy
const proxy = Proxy({
    port: 8888,
    hostname: "127.0.0.1",
    beforeRequest: (req, res, next) => next(),
    afterRequest: (req, res, next) => next(),
    beforeResponse: (req, res, next) => next(),
    afterResponse: (req, res, reqServer, resServer, next) => {
        console.log(req.postData)
        console.log(resServer.content)
        next();
    },
});

// Start proxy
proxy.listen();
console.log("listened");

setTimeout(() => {
    // Stop proxy
    proxy.close();
    console.log("closed");
}, 1000 * 60);
