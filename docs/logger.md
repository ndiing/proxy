## Logger()

### Syntax
```
Logger()
```

### Parameters
<dl>
</dl>

### Return value

<dl>
    <dt>None <code>undefined</code></dt>
</dl>

### Examples
```js
// Usageconst log = new Logger()// Create initial `_id`var doc = log.create()console.log(doc)// Update when requestvar doc = log.update(doc._id,{request:{}})console.log(doc)// Update when responsevar doc = log.update(doc._id,{response:{}})console.log(doc)// Read request&respoonse docconsole.log(log.read(doc._id))
```



