const TransparentProxy = require('./index')

const proxy = new TransparentProxy()

proxy.listen(8888, () => {
    console.log('proxy listen on port 8888')
})

// setTimeout(() => {
//     // stop proxy
//     proxy.close()
//     console.log('proxy stopped')
// }, 1000+1)