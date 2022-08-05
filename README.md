<a name="module_proxy"></a>

## proxy

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>Object</code> |  | - |
| options.hostname | <code>Object</code> | <code>127.0.0.1</code> | - |
| options.port | <code>Object</code> | <code>8888</code> | - |
| options.handleBeforeRequest | <code>Object</code> |  | (req,res,next) => next() |
| options.handleAfterRequest | <code>Object</code> |  | (req,res,next) => next() |
| options.handleBeforeResponse | <code>Object</code> |  | (req,res,reqServer,resServer,next) => next() |
| options.handleAfterResponse | <code>Object</code> |  | (req,res,reqServer,resServer,next) => next() |


* [proxy](#module_proxy)
    * [.listen()](#module_proxy.listen)
    * [.close()](#module_proxy.close)

<a name="module_proxy.listen"></a>

### proxy.listen()
start proxy

**Kind**: static method of [<code>proxy</code>](#module_proxy)  
<a name="module_proxy.close"></a>

### proxy.close()
stop proxy

**Kind**: static method of [<code>proxy</code>](#module_proxy)  
