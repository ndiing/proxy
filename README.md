### Install
```
npm i @ndiing/proxy
```
### Usage
```js
const proxy = Proxy({
    // Set hostname
    hostname: '127.0.0.1',// default value= 127.0.0.1
    // Set port
    port: 8888, // default value = 8888
    // Intercept
    // when finish call `next()`
 
    handleBeforeRequest: (req, res, next) => next(),
    handleAfterRequest: (req, res, next) => next(),
    handleBeforeResponse: (req, res, reqServer, resServer, next) => next(),
    handleAfterResponse: (req, res, reqServer, resServer, next) => next(),
})
// Start proxy
proxy.listen()
// Stop proxy after 5s
setTimeout(() => {
    proxy.close()
}, 1000*5)
```
