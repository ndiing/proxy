<a name="module_Proxy"></a>

## Proxy
Nodejs intercept Proxy### Install```npm install @ndiing/proxy```### Usage```jsconst Proxy = require('../index.js')// Create proxyconst proxy = Proxy({    port: 8888,    hostname: "127.0.0.1",    beforeRequest: (req, res, next) => next(),    afterRequest: (req, res, next) => next(),    beforeResponse: (req, res, next) => next(),    afterResponse: (req, res, reqServer, resServer, next) => {        console.log(req.postData)        console.log(resServer.content)        next();    },});// Start proxyproxy.listen();console.log("listened");setTimeout(() => {    // Stop proxy    proxy.close();    console.log("closed");}, 1000 * 60);```


| Param | Type |
| --- | --- |
| options | <code>Object</code> | 


* [Proxy](#module_Proxy)
    * [.enableWindowsProxy(port, hostname)](#module_Proxy.enableWindowsProxy)
    * [.disableWindowsProxy()](#module_Proxy.disableWindowsProxy)
    * [.createCert(domain, ca)](#module_Proxy.createCert) ⇒ <code>Object</code>
    * [.trustedRootCA()](#module_Proxy.trustedRootCA) ⇒ <code>Promise</code>
    * [.createCA()](#module_Proxy.createCA) ⇒ <code>Object</code>
    * [.listen(port, hostname, backlog)](#module_Proxy.listen)
    * [.close()](#module_Proxy.close)

<a name="module_Proxy.enableWindowsProxy"></a>

### Proxy.enableWindowsProxy(port, hostname)
Enable windows proxy server

**Kind**: static method of [<code>Proxy</code>](#module_Proxy)  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>Number</code> | - |
| hostname | <code>String</code> | - |

<a name="module_Proxy.disableWindowsProxy"></a>

### Proxy.disableWindowsProxy()
Disabled windows proxy server

**Kind**: static method of [<code>Proxy</code>](#module_Proxy)  
<a name="module_Proxy.createCert"></a>

### Proxy.createCert(domain, ca) ⇒ <code>Object</code>
Create TLS Certificate

**Kind**: static method of [<code>Proxy</code>](#module_Proxy)  

| Param | Type | Description |
| --- | --- | --- |
| domain | <code>String</code> | - |
| ca | <code>Object</code> | - |

<a name="module_Proxy.trustedRootCA"></a>

### Proxy.trustedRootCA() ⇒ <code>Promise</code>
Trusted Root Certificate Authorization on windows

**Kind**: static method of [<code>Proxy</code>](#module_Proxy)  
<a name="module_Proxy.createCA"></a>

### Proxy.createCA() ⇒ <code>Object</code>
Create Certificate Authorization

**Kind**: static method of [<code>Proxy</code>](#module_Proxy)  
<a name="module_Proxy.listen"></a>

### Proxy.listen(port, hostname, backlog)
Start proxy

**Kind**: static method of [<code>Proxy</code>](#module_Proxy)  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>Number</code> | - |
| hostname | <code>String</code> | - |
| backlog | <code>function</code> | - |

<a name="module_Proxy.close"></a>

### Proxy.close()
Stop proxy

**Kind**: static method of [<code>Proxy</code>](#module_Proxy)  
