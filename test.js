const TransparentProxy = require("./index");

const proxy = new TransparentProxy();

// // get only request
// proxy.store.on(/doc,\d+,request/, (eventName, doc) => {
//     console.log(doc)
// })

// // get only response
// proxy.store.on(/doc,\d+,response/, (eventName, doc) => {})

// // get all request & response
// proxy.store.on(/doc,\d+/, (eventName, doc) => {
//     console.log(eventName)
// })

// // intercept all request & response
// proxy.use((req,res,next) => {next()})

// // intercept request & response with url
// proxy.use(/https:\/\/jsonplaceholder.typicode.com.*/, (req, res, next) => {
//     // // before request
//     // console.log(req)

//     // // before response
//     // console.log(res)

//     next();
// });

// // intercept request & response with url & method
// proxy.get("https://jsonplaceholder.typicode.com/posts", (req, res, next) => {
//     if(req){
//         req.headers.delete('if-none-match')
//     }
//     if(res){
//         res.body = JSON.stringify([{id:1,title:'intercepting response'}])
//     }
//     next();
// });

// // start proxy
// proxy.listen(8888, () => {
//     console.log('proxy started')
// });

// // stop proxy
// setTimeout(() => {
//     proxy.close();
//     console.log('proxy stopped')
// }, 1000 * 1);
