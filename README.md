<a name="TransparentProxy"></a>

## TransparentProxy
### Install```npm install @ndiing/proxy```

**Kind**: global class  

* [TransparentProxy](#TransparentProxy)
    * [new TransparentProxy(rules)](#new_TransparentProxy_new)
    * [.use(url, callback)](#TransparentProxy+use)
    * [.createCert(domain, ca)](#TransparentProxy+createCert) ⇒ <code>Object</code>
    * [.createCA()](#TransparentProxy+createCA) ⇒ <code>Object</code>
    * [.enableProxy()](#TransparentProxy+enableProxy)
    * [.disableProxy()](#TransparentProxy+disableProxy)
    * [.SNICallback(servername, cb)](#TransparentProxy+SNICallback)
    * [.handleConnection(socket)](#TransparentProxy+handleConnection)
    * [.handleConnect(req, socket, head)](#TransparentProxy+handleConnect)
    * [.handleUpgrade(req, socket, head)](#TransparentProxy+handleUpgrade)
    * [.handleRequest(req, res)](#TransparentProxy+handleRequest)
    * [.handleError(err)](#TransparentProxy+handleError)
    * [.listen(port, hostname, backlog)](#TransparentProxy+listen) ⇒ <code>Object</code>
    * [.close()](#TransparentProxy+close)

<a name="new_TransparentProxy_new"></a>

### new TransparentProxy(rules)

| Param | Type |
| --- | --- |
| rules | <code>Array</code> | 

<a name="TransparentProxy+use"></a>

### transparentProxy.use(url, callback)
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| url | <code>String/Function</code> | 
| callback | <code>function</code> | 

<a name="TransparentProxy+createCert"></a>

### transparentProxy.createCert(domain, ca) ⇒ <code>Object</code>
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| domain | <code>String</code> | 
| ca | <code>Object</code> | 

<a name="TransparentProxy+createCA"></a>

### transparentProxy.createCA() ⇒ <code>Object</code>
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  
<a name="TransparentProxy+enableProxy"></a>

### transparentProxy.enableProxy()
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  
<a name="TransparentProxy+disableProxy"></a>

### transparentProxy.disableProxy()
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  
<a name="TransparentProxy+SNICallback"></a>

### transparentProxy.SNICallback(servername, cb)
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| servername | <code>String</code> | 
| cb | <code>function</code> | 

<a name="TransparentProxy+handleConnection"></a>

### transparentProxy.handleConnection(socket)
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| socket | <code>Stream</code> | 

<a name="TransparentProxy+handleConnect"></a>

### transparentProxy.handleConnect(req, socket, head)
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| req | <code>Stream</code> | 
| socket | <code>Stream</code> | 
| head | <code>Stream</code> | 

<a name="TransparentProxy+handleUpgrade"></a>

### transparentProxy.handleUpgrade(req, socket, head)
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| req | <code>Stream</code> | 
| socket | <code>Stream</code> | 
| head | <code>Stream</code> | 

<a name="TransparentProxy+handleRequest"></a>

### transparentProxy.handleRequest(req, res)
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| req | <code>Stream</code> | 
| res | <code>Stream</code> | 

<a name="TransparentProxy+handleError"></a>

### transparentProxy.handleError(err)
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| err | <code>Object</code> | 

<a name="TransparentProxy+listen"></a>

### transparentProxy.listen(port, hostname, backlog) ⇒ <code>Object</code>
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| port | <code>Number</code> | 
| hostname | <code>String/Function</code> | 
| backlog | <code>function</code> | 

<a name="TransparentProxy+close"></a>

### transparentProxy.close()
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  
