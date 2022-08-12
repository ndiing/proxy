const TransparentProxy = require('./index')

const proxy = new TransparentProxy()
// proxy.store.on(/(request|response)$/, console.log)

// callback
// call twice
// on beforeRequest and on beforeResponse
proxy.use('https://jsonplaceholder.typicode.com/posts', (req,res,next) => {
    // when not null
    // indicate beforeRequest
    if(req){
        req.headers.delete('if-none-match')
    }
    // when not null
    // indicate beforeResponse
    if(res){
        res.headers.set('x-powered-by','ndiing')
    }
    next()
})

// proxy.listen(8888, () => {
//     console.log('proxy listen on port 8888')
// })

// setTimeout(() => {
//     // stop proxy
//     proxy.close()
//     console.log('proxy stopped')
// }, 1000+1)