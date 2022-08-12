const TransparentProxy = require('./index')

const proxy = new TransparentProxy()
proxy.on(/(request|response)$/, (eventName,doc) => {
    // doc=request/response
    console.log(eventName)
})

// // callback
// // call twice
// // on beforeRequest and on beforeResponse
// proxy.use('https://jsonplaceholder.typicode.com/posts', (req,res,next) => {
//     // when not null
//     // indicate beforeRequest
//     if(req){
//         req.headers.delete('if-none-match')
//     }
//     // when not null
//     // indicate beforeResponse
//     if(res){
//         res.headers.set('x-powered-by','ndiing')
//         res.body=JSON.parse(res.body)
//         res.body=JSON.stringify(res.body)
//     }
//     next()
// })

// proxy.use('https://www.youtube.com/.*', (req,res,next) => {
//     if(req){}
//     if(res){
//         res.body='Hello YouTube'
//     }
//     next()
// })

// proxy.listen(8888, () => {
//     console.log('proxy listen on port 8888')
// })

// setTimeout(() => {
//     // stop proxy
//     proxy.close()
//     console.log('proxy stopped')
// }, 1000+1)