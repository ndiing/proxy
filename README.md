<a name="module_proxy"></a>

## proxy
### Install```npm install @ndiing/proxy```


* [proxy](#module_proxy)
    * [~EventEmitter](#module_proxy..EventEmitter)
        * [.on(eventName, listener)](#module_proxy..EventEmitter+on)
        * [.emit(eventName, ...args)](#module_proxy..EventEmitter+emit)
    * [~Store](#module_proxy..Store)
        * [.id](#module_proxy..Store+id)
        * [.data](#module_proxy..Store+data)
        * [.create(doc)](#module_proxy..Store+create) ⇒ <code>Object</code>
        * [.read(_id)](#module_proxy..Store+read) ⇒ <code>Object</code>
        * [.update(_id, doc)](#module_proxy..Store+update) ⇒ <code>Object</code>
        * [.destroy(_id)](#module_proxy..Store+destroy) ⇒ <code>Object</code>
    * [~TransparentProxy](#module_proxy..TransparentProxy)
        * [new TransparentProxy(rules)](#new_module_proxy..TransparentProxy_new)
        * [.rules](#module_proxy..TransparentProxy+rules)
        * [.use(url, callback)](#module_proxy..TransparentProxy+use)
        * [.createCert(domain, ca)](#module_proxy..TransparentProxy+createCert) ⇒ <code>Object</code>
        * [.createCA()](#module_proxy..TransparentProxy+createCA) ⇒ <code>Object</code>
        * [.enableProxy()](#module_proxy..TransparentProxy+enableProxy)
        * [.disableProxy()](#module_proxy..TransparentProxy+disableProxy)
        * [.SNICallback(servername, cb)](#module_proxy..TransparentProxy+SNICallback)
        * [.handleConnection(socket)](#module_proxy..TransparentProxy+handleConnection)
        * [.handleConnect(req, socket, head)](#module_proxy..TransparentProxy+handleConnect)
        * [.handleUpgrade(req, socket, head)](#module_proxy..TransparentProxy+handleUpgrade)
        * [.handleRequest(req, res)](#module_proxy..TransparentProxy+handleRequest)
        * [.handleError(err)](#module_proxy..TransparentProxy+handleError)
        * [.listen(port, hostname, backlog)](#module_proxy..TransparentProxy+listen) ⇒ <code>Object</code>
        * [.close()](#module_proxy..TransparentProxy+close)

<a name="module_proxy..EventEmitter"></a>

### proxy~EventEmitter
EventEmitter with regexp

**Kind**: inner class of [<code>proxy</code>](#module_proxy)  

* [~EventEmitter](#module_proxy..EventEmitter)
    * [.on(eventName, listener)](#module_proxy..EventEmitter+on)
    * [.emit(eventName, ...args)](#module_proxy..EventEmitter+emit)

<a name="module_proxy..EventEmitter+on"></a>

#### eventEmitter.on(eventName, listener)
**Kind**: instance method of [<code>EventEmitter</code>](#module_proxy..EventEmitter)  

| Param | Type |
| --- | --- |
| eventName | <code>String/RegExp</code> | 
| listener | <code>function</code> | 

<a name="module_proxy..EventEmitter+emit"></a>

#### eventEmitter.emit(eventName, ...args)
**Kind**: instance method of [<code>EventEmitter</code>](#module_proxy..EventEmitter)  

| Param | Type |
| --- | --- |
| eventName | <code>String</code> | 
| ...args | <code>any</code> | 

<a name="module_proxy..Store"></a>

### proxy~Store
**Kind**: inner class of [<code>proxy</code>](#module_proxy)  

* [~Store](#module_proxy..Store)
    * [.id](#module_proxy..Store+id)
    * [.data](#module_proxy..Store+data)
    * [.create(doc)](#module_proxy..Store+create) ⇒ <code>Object</code>
    * [.read(_id)](#module_proxy..Store+read) ⇒ <code>Object</code>
    * [.update(_id, doc)](#module_proxy..Store+update) ⇒ <code>Object</code>
    * [.destroy(_id)](#module_proxy..Store+destroy) ⇒ <code>Object</code>

<a name="module_proxy..Store+id"></a>

#### store.id
**Kind**: instance property of [<code>Store</code>](#module_proxy..Store)  
<a name="module_proxy..Store+data"></a>

#### store.data
**Kind**: instance property of [<code>Store</code>](#module_proxy..Store)  
<a name="module_proxy..Store+create"></a>

#### store.create(doc) ⇒ <code>Object</code>
**Kind**: instance method of [<code>Store</code>](#module_proxy..Store)  

| Param | Type |
| --- | --- |
| doc | <code>Object</code> | 

<a name="module_proxy..Store+read"></a>

#### store.read(_id) ⇒ <code>Object</code>
**Kind**: instance method of [<code>Store</code>](#module_proxy..Store)  

| Param | Type |
| --- | --- |
| _id | <code>Number</code> | 

<a name="module_proxy..Store+update"></a>

#### store.update(_id, doc) ⇒ <code>Object</code>
**Kind**: instance method of [<code>Store</code>](#module_proxy..Store)  

| Param | Type |
| --- | --- |
| _id | <code>Number</code> | 
| doc | <code>Object</code> | 

<a name="module_proxy..Store+destroy"></a>

#### store.destroy(_id) ⇒ <code>Object</code>
**Kind**: instance method of [<code>Store</code>](#module_proxy..Store)  

| Param | Type |
| --- | --- |
| _id | <code>Number</code> | 

<a name="module_proxy..TransparentProxy"></a>

### proxy~TransparentProxy
**Kind**: inner class of [<code>proxy</code>](#module_proxy)  

* [~TransparentProxy](#module_proxy..TransparentProxy)
    * [new TransparentProxy(rules)](#new_module_proxy..TransparentProxy_new)
    * [.rules](#module_proxy..TransparentProxy+rules)
    * [.use(url, callback)](#module_proxy..TransparentProxy+use)
    * [.createCert(domain, ca)](#module_proxy..TransparentProxy+createCert) ⇒ <code>Object</code>
    * [.createCA()](#module_proxy..TransparentProxy+createCA) ⇒ <code>Object</code>
    * [.enableProxy()](#module_proxy..TransparentProxy+enableProxy)
    * [.disableProxy()](#module_proxy..TransparentProxy+disableProxy)
    * [.SNICallback(servername, cb)](#module_proxy..TransparentProxy+SNICallback)
    * [.handleConnection(socket)](#module_proxy..TransparentProxy+handleConnection)
    * [.handleConnect(req, socket, head)](#module_proxy..TransparentProxy+handleConnect)
    * [.handleUpgrade(req, socket, head)](#module_proxy..TransparentProxy+handleUpgrade)
    * [.handleRequest(req, res)](#module_proxy..TransparentProxy+handleRequest)
    * [.handleError(err)](#module_proxy..TransparentProxy+handleError)
    * [.listen(port, hostname, backlog)](#module_proxy..TransparentProxy+listen) ⇒ <code>Object</code>
    * [.close()](#module_proxy..TransparentProxy+close)

<a name="new_module_proxy..TransparentProxy_new"></a>

#### new TransparentProxy(rules)

| Param | Type |
| --- | --- |
| rules | <code>Array</code> | 

<a name="module_proxy..TransparentProxy+rules"></a>

#### transparentProxy.rules
**Kind**: instance property of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  
<a name="module_proxy..TransparentProxy+use"></a>

#### transparentProxy.use(url, callback)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| url | <code>String/Function</code> | 
| callback | <code>function</code> | 

<a name="module_proxy..TransparentProxy+createCert"></a>

#### transparentProxy.createCert(domain, ca) ⇒ <code>Object</code>
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| domain | <code>String</code> | 
| ca | <code>Object</code> | 

<a name="module_proxy..TransparentProxy+createCA"></a>

#### transparentProxy.createCA() ⇒ <code>Object</code>
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  
<a name="module_proxy..TransparentProxy+enableProxy"></a>

#### transparentProxy.enableProxy()
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  
<a name="module_proxy..TransparentProxy+disableProxy"></a>

#### transparentProxy.disableProxy()
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  
<a name="module_proxy..TransparentProxy+SNICallback"></a>

#### transparentProxy.SNICallback(servername, cb)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| servername | <code>String</code> | 
| cb | <code>function</code> | 

<a name="module_proxy..TransparentProxy+handleConnection"></a>

#### transparentProxy.handleConnection(socket)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| socket | <code>Stream</code> | 

<a name="module_proxy..TransparentProxy+handleConnect"></a>

#### transparentProxy.handleConnect(req, socket, head)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| req | <code>Stream</code> | 
| socket | <code>Stream</code> | 
| head | <code>Stream</code> | 

<a name="module_proxy..TransparentProxy+handleUpgrade"></a>

#### transparentProxy.handleUpgrade(req, socket, head)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| req | <code>Stream</code> | 
| socket | <code>Stream</code> | 
| head | <code>Stream</code> | 

<a name="module_proxy..TransparentProxy+handleRequest"></a>

#### transparentProxy.handleRequest(req, res)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| req | <code>Stream</code> | 
| res | <code>Stream</code> | 

<a name="module_proxy..TransparentProxy+handleError"></a>

#### transparentProxy.handleError(err)
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| err | <code>Object</code> | 

<a name="module_proxy..TransparentProxy+listen"></a>

#### transparentProxy.listen(port, hostname, backlog) ⇒ <code>Object</code>
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  

| Param | Type |
| --- | --- |
| port | <code>Number</code> | 
| hostname | <code>String/Function</code> | 
| backlog | <code>function</code> | 

<a name="module_proxy..TransparentProxy+close"></a>

#### transparentProxy.close()
**Kind**: instance method of [<code>TransparentProxy</code>](#module_proxy..TransparentProxy)  
