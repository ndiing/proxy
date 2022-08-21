## Classes

<dl>
<dt><a href="#EventEmitter">EventEmitter</a></dt>
<dd></dd>
<dt><a href="#Database">Database</a></dt>
<dd></dd>
<dt><a href="#TransparentProxy">TransparentProxy</a></dt>
<dd></dd>
</dl>

<a name="EventEmitter"></a>

## EventEmitter
**Kind**: global class  

* [EventEmitter](#EventEmitter)
    * [.on(eventName, listener)](#EventEmitter+on)
    * [.emit(eventName, ...args)](#EventEmitter+emit)

<a name="EventEmitter+on"></a>

### eventEmitter.on(eventName, listener)
**Kind**: instance method of [<code>EventEmitter</code>](#EventEmitter)  

| Param | Type |
| --- | --- |
| eventName | <code>\*</code> | 
| listener | <code>\*</code> | 

<a name="EventEmitter+emit"></a>

### eventEmitter.emit(eventName, ...args)
**Kind**: instance method of [<code>EventEmitter</code>](#EventEmitter)  

| Param | Type |
| --- | --- |
| eventName | <code>\*</code> | 
| ...args | <code>any</code> | 

<a name="Database"></a>

## Database
**Kind**: global class  
<a name="TransparentProxy"></a>

## TransparentProxy
**Kind**: global class  

* [TransparentProxy](#TransparentProxy)
    * _instance_
        * [.rules](#TransparentProxy+rules)
        * [.use(...args)](#TransparentProxy+use)
        * [.listen(port, hostname, backlog)](#TransparentProxy+listen) ⇒ <code>Any</code>
        * [.close()](#TransparentProxy+close)
    * _static_
        * [.enableProxy(options)](#TransparentProxy.enableProxy) ⇒ <code>Any</code>
        * [.disableProxy()](#TransparentProxy.disableProxy) ⇒ <code>Any</code>
        * [.createCert(domain, ca)](#TransparentProxy.createCert) ⇒ <code>Any</code>
        * [.createCA()](#TransparentProxy.createCA) ⇒ <code>Any</code>

<a name="TransparentProxy+rules"></a>

### transparentProxy.rules
**Kind**: instance property of [<code>TransparentProxy</code>](#TransparentProxy)  
<a name="TransparentProxy+use"></a>

### transparentProxy.use(...args)
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| ...args | <code>any</code> | 

<a name="TransparentProxy+listen"></a>

### transparentProxy.listen(port, hostname, backlog) ⇒ <code>Any</code>
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| port | <code>\*</code> | 
| hostname | <code>\*</code> | 
| backlog | <code>\*</code> | 

<a name="TransparentProxy+close"></a>

### transparentProxy.close()
**Kind**: instance method of [<code>TransparentProxy</code>](#TransparentProxy)  
<a name="TransparentProxy.enableProxy"></a>

### TransparentProxy.enableProxy(options) ⇒ <code>Any</code>
**Kind**: static method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| options | <code>\*</code> | 

<a name="TransparentProxy.disableProxy"></a>

### TransparentProxy.disableProxy() ⇒ <code>Any</code>
**Kind**: static method of [<code>TransparentProxy</code>](#TransparentProxy)  
<a name="TransparentProxy.createCert"></a>

### TransparentProxy.createCert(domain, ca) ⇒ <code>Any</code>
**Kind**: static method of [<code>TransparentProxy</code>](#TransparentProxy)  

| Param | Type |
| --- | --- |
| domain | <code>\*</code> | 
| ca | <code>\*</code> | 

<a name="TransparentProxy.createCA"></a>

### TransparentProxy.createCA() ⇒ <code>Any</code>
**Kind**: static method of [<code>TransparentProxy</code>](#TransparentProxy)  
