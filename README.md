<a name="module_proxy"></a>

## proxy
Nodejs transparent proxy### Install```npm install @ndiing/proxy```

**See**: [./examples/proxy.js](./examples/proxy.js)  

* [proxy](#module_proxy)
    * [~TransparentProxy](#module_proxy..TransparentProxy)
        * [.enableWindowsInternetSettings()](#module_proxy..TransparentProxy+enableWindowsInternetSettings)
        * [.disableWindowsInternetSettings()](#module_proxy..TransparentProxy+disableWindowsInternetSettings)
        * [.createCert(domain, ca)](#module_proxy..TransparentProxy+createCert) ⇒ <code>Any</code>
        * [.createCA()](#module_proxy..TransparentProxy+createCA) ⇒ <code>Any</code>
        * [.handleClientConnection(socket)](#module_proxy..TransparentProxy+handleClientConnection)
        * [.handleClientConnect(req, socket, head)](#module_proxy..TransparentProxy+handleClientConnect)
        * [.handleClientRequest(req, res)](#module_proxy..TransparentProxy+handleClientRequest)
        * [.handleClientError(err)](#module_proxy..TransparentProxy+handleClientError)
        * [.handleSocketError(err)](#module_proxy..TransparentProxy+handleSocketError)
        * [.SNICallback(servername, cb)](#module_proxy..TransparentProxy+SNICallback)
        * [.listen(port, hostname, backlog)](#module_proxy..TransparentProxy+listen) ⇒ <code>Object</code>
        * [.close()](#module_proxy..TransparentProxy+close)
    * [~req](#module_proxy..req)
    * [~res](#module_proxy..res)

<a name="module_proxy..TransparentProxy"></a>

### proxy~TransparentProxy
**Kind**: inner class of [<code>proxy</code>](#module_proxy)  

* [~TransparentProxy](#module_proxy..TransparentProxy)
    * [.enableWindowsInternetSettings()](#module_proxy..TransparentProxy+enableWindowsInternetSettings)
    * [.disableWindowsInternetSettings()](#module_proxy..TransparentProxy+disableWindowsInternetSettings)
    * [.createCert(domain, ca)](#module_proxy..TransparentProxy+createCert) ⇒ <code>Any</code>
    * [.createCA()](#module_proxy..TransparentProxy+createCA) ⇒ <code>Any</code>
    * [.handleClientConnection(socket)](#module_proxy..TransparentProxy+handleClientConnection)
    * [.handleClientConnect(req, socket, head)](#module_proxy..TransparentProxy+handleClientConnect)
    * [.handleClientRequest(req, res)](#module_proxy..TransparentProxy+handleClientRequest)
    * [.handleClientError(err)](#module_proxy..TransparentProxy+handleClientError)
    * [.handleSocketError(err)](#module_proxy..TransparentProxy+handleSocketError)
    * [.SNICallback(servername, cb)](#module_proxy..TransparentProxy+SNICallback)
    * [.listen(port, hostname, backlog)](#module_proxy..TransparentProxy+listen) ⇒ <code>Object</code>
    * [.close()](#module_proxy..TransparentProxy+close)

<a name="module_proxy..TransparentProxy+enableWindowsInternetSettings"></a>

#### transparentProxy.enableWindowsInternetSettings()
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  
<a name="module_proxy..TransparentProxy+disableWindowsInternetSettings"></a>

#### transparentProxy.disableWindowsInternetSettings()
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  
<a name="module_proxy..TransparentProxy+createCert"></a>

#### transparentProxy.createCert(domain, ca) ⇒ <code>Any</code>
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| domain | <code>\*</code> | 
| ca | <code>\*</code> | 

<a name="module_proxy..TransparentProxy+createCA"></a>

#### transparentProxy.createCA() ⇒ <code>Any</code>
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  
<a name="module_proxy..TransparentProxy+handleClientConnection"></a>

#### transparentProxy.handleClientConnection(socket)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| socket | <code>\*</code> | 

<a name="module_proxy..TransparentProxy+handleClientConnect"></a>

#### transparentProxy.handleClientConnect(req, socket, head)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| req | <code>\*</code> | 
| socket | <code>\*</code> | 
| head | <code>\*</code> | 

<a name="module_proxy..TransparentProxy+handleClientRequest"></a>

#### transparentProxy.handleClientRequest(req, res)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| req | <code>\*</code> | 
| res | <code>\*</code> | 

<a name="module_proxy..TransparentProxy+handleClientError"></a>

#### transparentProxy.handleClientError(err)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| err | <code>\*</code> | 

<a name="module_proxy..TransparentProxy+handleSocketError"></a>

#### transparentProxy.handleSocketError(err)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| err | <code>\*</code> | 

<a name="module_proxy..TransparentProxy+SNICallback"></a>

#### transparentProxy.SNICallback(servername, cb)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| servername | <code>\*</code> | 
| cb | <code>\*</code> | 

<a name="module_proxy..TransparentProxy+listen"></a>

#### transparentProxy.listen(port, hostname, backlog) ⇒ <code>Object</code>
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| port | <code>\*</code> | 
| hostname | <code>\*</code> | 
| backlog | <code>\*</code> | 

<a name="module_proxy..TransparentProxy+close"></a>

#### transparentProxy.close()
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  
<a name="module_proxy..req"></a>

### proxy~req
**Kind**: inner typedef of [<code>proxy</code>](#module_proxy)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| req.method | <code>String</code> | - |
| req.protocol | <code>String</code> | - |
| req.hostname | <code>String</code> | - |
| req.port | <code>Number</code> | - |
| req.path | <code>String</code> | - |
| req.headers | <code>Object</code> | - |
| req.stream | <code>Stream</code> | - |
| req.body | <code>Buffer</code> | - |

<a name="module_proxy..res"></a>

### proxy~res
**Kind**: inner typedef of [<code>proxy</code>](#module_proxy)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| res.status | <code>Number</code> | - |
| res.headers | <code>Object</code> | - |
| res.stream | <code>Stream</code> | - |
| res.body | <code>Buffer</code> | - |

