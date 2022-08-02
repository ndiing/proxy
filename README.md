
# Proxy
nodejs intercept proxy / web debugger

### Install
```
npm install @ndiing/proxy
```

#### Usage

const Proxy = require('@ndiing/proxy')

const proxy = Proxy({
    // hostname ,// default > "127.0.0.1",
    // port ,// default > 8888,
    // cwd ,// default > process.cwd(),
    // handleBeforeRequest ,// default > (req, res, next) => next(),
    // handleAfterRequest ,// default > (req, res, next) => next(),
    // handleBeforeResponse ,// default > (req, res, reqServer, resServer, next) => next(),
    // handleAfterResponse ,// default > (req, res, reqServer, resServer, next) => next(),
})

// Start proxy
proxy.listen()

// Stop proxy
// proxy.close()

// Stop proxy after 5s
setTimeout(() => {
    proxy.close()
}, 1000*5)