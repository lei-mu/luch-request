# luch-request

[![npm](https://img.shields.io/npm/l/luch-request "npm")](https://www.npmjs.com/package/luch-request "npm")
[![npm](https://img.shields.io/npm/v/luch-request "npm")](https://www.npmjs.com/package/luch-request "npm")
[![github](https://img.shields.io/github/package-json/v/lei-mu/luch-request "github")](https://github.com/lei-mu/luch-request "github")
[![github stars](https://img.shields.io/github/stars/lei-mu/luch-request.svg "github stars")](https://github.com/lei-mu/luch-request "github stars")
[![github forks](https://img.shields.io/github/forks/lei-mu/luch-request.svg "github forks")](https://github.com/lei-mu/luch-request "github forks")

- 基于 Promise 对象实现更简单的 request 使用方式，支持请求和响应拦截
- 支持全局挂载
- 支持多个全局配置实例
- 支持自定义验证器
- 支持文件上传/下载
- 支持task 操作
- 支持自定义参数

安装
------------
###### 使用npm

``` javascript
npm i luch-request -S
```


###### github

[github](https://github.com/lei-mu/luch-request "github")
安装依赖后 ` npm run build ` ，使用DCloud/luch-request 文件夹即可


###### DCloud插件市场:

[DCloud插件市场](https://ext.dcloud.net.cn/plugin?id=392 "DCloud插件市场")

Example
------------
创建实例  

``` javascript 
import Request from '@/utils/luch-request/index.js' // 下载的插件
// import Request from 'luch-request' // 使用npm

const http = new Request();
```

执行` GET `请求

``` javascript 
http.get('/user/login', {params: {userName: 'name', password: '123456'}}).then(res => {

}).catch(err => {

})
// 局部修改配置，局部配置优先级高于全局配置
http.get('/user/login', {
    params: {userName: 'name', password: '123456'}, /* 会加在url上 */
    header: {}, /* 会与全局header合并，如有同名属性，局部覆盖全局 */
    dataType: 'json',
    // 注：如果局部custom与全局custom有同名属性，则后面的属性会覆盖前面的属性，相当于Object.assign(全局，局部)
    custom: {auth: true}, // 可以加一些自定义参数，在拦截器等地方使用。比如这里我加了一个auth，可在拦截器里拿到，如果true就传token
    // #ifndef MP-ALIPAY || APP-PLUS
    responseType: 'text',
    // #endif
    // #ifdef MP-ALIPAY || MP-WEIXIN
    timeout: 30000, // 仅微信小程序（2.10.0）、支付宝小程序支持
    // #endif
    // #ifdef APP-PLUS
    sslVerify: true, // 验证 ssl 证书 仅5+App安卓端支持（HBuilderX 2.3.3+）
    // #endif
    // #ifdef H5
    withCredentials: false, // 跨域请求时是否携带凭证（cookies）仅H5支持（HBuilderX 2.6.15+）
    // #endif
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
         // setTimeout(() => {
         //   task.abort()
         // }, 500)
    }
}).then(res => {

}).catch(err => {

})
```
执行` POST `请求

``` javascript 
http.post('/user/login', {userName: 'name', password: '123456'} ).then(res => {

}).catch(err => {

})
// 局部修改配置，局部配置优先级高于全局配置
http.post('/user/login', {userName: 'name', password: '123456'}, {
    params: {}, /* 会加在url上 */
    header: {}, /* 会与全局header合并，如有同名属性，局部覆盖全局 */
    dataType: 'json',
    // 注：如果局部custom与全局custom有同名属性，则后面的属性会覆盖前面的属性，相当于Object.assign(全局，局部)
    custom: {auth: true}, // 可以加一些自定义参数，在拦截器等地方使用。比如这里我加了一个auth，可在拦截器里拿到，如果true就传token
    // #ifndef MP-ALIPAY || APP-PLUS
    responseType: 'text',
    // #endif
    // #ifdef MP-ALIPAY || MP-WEIXIN
    timeout: 30000, // 仅微信小程序（2.10.0）、支付宝小程序支持
    // #endif
    // #ifdef APP-PLUS
    sslVerify: true, // 验证 ssl 证书 仅5+App安卓端支持（HBuilderX 2.3.3+）
    // #endif
    // #ifdef H5
    withCredentials: false, // 跨域请求时是否携带凭证（cookies）仅H5支持（HBuilderX 2.6.15+）
    // #endif
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
         // setTimeout(() => {
         //   task.abort()
         // }, 500)
    }
}).then(res => {

}).catch(err => {

})
```
执行` upload `请求

``` javascript 
  http.upload('api/upload/img', {
    params: {}, /* 会加在url上 */
    // #ifdef APP-PLUS || H5
    files: [], // 需要上传的文件列表。使用 files 时，filePath 和 name 不生效。App、H5（ 2.6.15+）
    // #endif
    // #ifdef MP-ALIPAY
    fileType: 'image/video/audio', // 仅支付宝小程序，且必填。
    // #endif
    filePath: '', // 要上传文件资源的路径。
    // 注：如果局部custom与全局custom有同名属性，则后面的属性会覆盖前面的属性，相当于Object.assign(全局，局部)
    custom: {auth: true}, // 可以加一些自定义参数，在拦截器等地方使用。比如这里我加了一个auth，可在拦截器里拿到，如果true就传token
    name: 'file', // 文件对应的 key , 开发者在服务器端通过这个 key 可以获取到文件二进制内容
    header: {},  /* 会与全局header合并，如有同名属性，局部覆盖全局 */
    formData: {}, // HTTP 请求中其他额外的 form data
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
      // task.onProgressUpdate((res) => {
      //   console.log('上传进度' + res.progress);
      //   console.log('已经上传的数据长度' + res.totalBytesSent);
      //   console.log('预期需要上传的数据总长度' + res.totalBytesExpectedToSend);
      //
      //   // 测试条件，取消上传任务。
      //   if (res.progress > 50) {
      //     uploadTask.abort();
      //   }
      // });
    }
  }).then(res => {
    // 返回的res.data 已经进行JSON.parse
  }).catch(err => {

  })
```
luch-request API
------------
``` javascript 
 http.request({
    method: 'POST', // 请求方法必须大写
    url: '/user/12345',
    data: {
      firstName: 'Fred',
      lastName: 'Flintstone'
    },
    // #ifdef MP-ALIPAY || MP-WEIXIN
    timeout: 30000, // 仅微信小程序（2.10.0）、支付宝小程序支持
    // #endif
    params: { // 会拼接到url上
      token: '1111'
    },
    // 注：如果局部custom与全局custom有同名属性，则后面的属性会覆盖前面的属性，相当于Object.assign(全局，局部)
    custom: {}, // 自定义参数
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
      // setTimeout(() => {
      //   task.abort()
      // }, 500)
    }
  })

  // 具体参数说明：[uni.uploadFile](https://uniapp.dcloud.io/api/request/network-file)
  http.upload('api/upload/img', {
    params: {}, /* 会加在url上 */
    // #ifdef APP-PLUS || H5
    files: [], // 需要上传的文件列表。使用 files 时，filePath 和 name 不生效。App、H5（ 2.6.15+）
    // #endif
    // #ifdef MP-ALIPAY
    fileType: 'image/video/audio', // 仅支付宝小程序，且必填。
    // #endif
    filePath: '', // 要上传文件资源的路径。
    name: 'file', // 文件对应的 key , 开发者在服务器端通过这个 key 可以获取到文件二进制内容
    header: {}, /* 会与全局header合并，如有同名属性，局部覆盖全局 */
    custom: {}, // 自定义参数
    formData: {}, // HTTP 请求中其他额外的 form data
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
      // setTimeout(() => {
      //   task.abort()
      // }, 500)
    }
  }).then(res => {
    // 返回的res.data 已经进行JSON.parse
  }).catch(err => {

  })

  // 具体参数说明：[uni.downloadFile](https://uniapp.dcloud.io/api/request/network-file?id=downloadfile)
  http.download('api/download', {
    params: {}, /* 会加在url上 */
    header: {}, /* 会与全局header合并，如有同名属性，局部覆盖全局 */
    custom: {}, // 自定义参数
    // 返回当前请求的task, options。非必填
    getTask: (task, options) => {
      // setTimeout(() => {
      //   task.abort()
      // }, 500)
    }
  }).then(res => {

  }).catch(err => {

  })
```


请求方法别名 / 实例方法

``` javascript
http.request(config)
http.get(url[, config])
http.upload(url[, config])
http.delete(url[, data[, config]])
http.head(url[, data[, config]])
http.post(url[, data[, config]])
http.put(url[, data[, config]])
http.connect(url[, data[, config]])
http.options(url[, data[, config]])
http.trace(url[, data[, config]])
```

全局请求配置
------------
``` javascript
{
    baseUrl: '',
    header: {},
    method: 'GET',
    dataType: 'json',
    // #ifndef MP-ALIPAY || APP-PLUS
    responseType: 'text',
    // #endif
    // 注：如果局部custom与全局custom有同名属性，则后面的属性会覆盖前面的属性，相当于Object.assign(全局，局部)
    custom: {}, // 全局自定义参数默认值
    // #ifdef MP-ALIPAY || MP-WEIXIN
    timeout: 30000,
    // #endif
    // #ifdef APP-PLUS
    sslVerify: true,
    // #endif
    // #ifdef H5
    // 跨域请求时是否携带凭证（cookies）仅H5支持（HBuilderX 2.6.15+）
    withCredentials: false,
    // #endif
    // 局部优先级高于全局，返回当前请求的task,options。请勿在此处修改options。非必填
    // getTask: (task, options) => {
    // 相当于设置了请求超时时间500ms
    //   setTimeout(() => {
    //     task.abort()
    //   }, 500)
    // }
  }
```


全局配置修改` setConfig `

``` javascript
/**
     * @description 修改全局默认配置
     * @param {Function}   
*/
http.setConfig((config) => { /* config 为默认全局配置*/
    config.baseUrl = 'http://www.bbb.cn'; /* 根域名 */
    config.header = {
        a: 1, // 演示用
        b: 2  // 演示用
    }
    return config
})
```

自定义验证器` validateStatus `

``` javascript
/**
 * 自定义验证器，如果返回true 则进入响应拦截器的响应成功函数(resolve)，否则进入响应拦截器的响应错误函数(reject)
 * @param { Number } statusCode - 请求响应体statusCode（只读）
 * @return { Boolean } 如果为true,则 resolve, 否则 reject
*/
http.validateStatus = (statusCode) => { // 默认
     return statusCode === 200
}

// 举个栗子
http.validateStatus = (statusCode) => {
   return statusCode && statusCode >= 200 && statusCode < 300
}
```

拦截器
------------

在请求之前拦截

``` javascript
/**
 * @param { Function} cancel - 取消请求,调用cancel 会取消本次请求，但是该函数的catch() 仍会执行; 不会进入响应拦截器
 *
 * @param {String} text ['handle cancel'| any] - catch((err) => {}) err.errMsg === 'handle cancel'。非必传，默认'handle cancel'
 * @cancel {Object} config - catch((err) => {}) err.config === config; 非必传，默认为request拦截器修改之前的config
 * function cancel(text, config) {}
 */
 http.interceptor.request((config, cancel) => { /* cancel 为函数，如果调用会取消本次请求。需要注意：调用cancel,本次请求的catch仍会执行。必须return config */
    config.header = {
      ...config.header,
      a: 1 // 演示拦截器header加参
    }
    // 演示custom 用处
    // if (config.custom.auth) {
    //   config.header.token = 'token'
    // }
    /**
    /* 演示cancel 函数
    if (!token) { // 如果token不存在，调用cancel 会取消本次请求，不会进入响应拦截器，但是该函数的catch() 仍会执行
      cancel('token 不存在', config) //  把修改后的config传入，之后响应就可以拿到修改后的config。 如果调用了cancel但是不传修改后的config，则catch((err) => {}) err.config 为request拦截器修改之前的config
    }
    **/
    return config
  })
```

在请求之后拦截

``` javascript
http.interceptor.response((response) => { /* 对响应成功做点什么 （statusCode === 200），必须return response*/
  //  if (response.data.code !== 200) { // 服务端返回的状态码不等于200，则reject()
  //    return Promise.reject(response) // return Promise.reject 可使promise状态进入catch
 // if (response.config.custom.verification) { // 演示自定义参数的作用
  //   return response.data
  // }
  console.log(response)
  return response
}, (response) => { /*  对响应错误做点什么 （statusCode !== 200），必须return response*/
  console.log(response)
  return response
})
```


luch-request Guide
------------
[luch-request 官网地址](https://soso.luxe/luch-request/ "luch-request 官网地址")
<br>
[github](https://github.com/lei-mu/luch-request "github")



常见问题
------------
1. 为什么会请求两次？
    - 总有些小白问这些很那啥的问题，有两种可能，一种是‘post三次握手’，还有一种可能是`本地访问接口时跨域请求，所以浏览器会先发一个option 去预测能否成功，然后再发一个真正的请求`（自己观察请求头，Request Method，百度简单请求）。
2. 如何跨域？
    - 问的人不少，可以先百度了解一下。<a href="https://ask.dcloud.net.cn/article/35267" target="_blank">如何跨域</a>
3. post 怎么传不了数组的参数啊？
    - <a href="https://uniapp.dcloud.io/api/request/request" target="_blank">uni-request</a> <br>
      可以点击看一下uni-request 的api 文档，data支持的文件类型只有<code>Object/String/ArrayBuffer</code>这个真跟我没啥关系 0.0
4. TypeError: undefined is not an object (evaluating 'this.$http.get')
    - 不知道为啥问的人这么多？太基础了，百度学习一下 export default 和export，头大。
    - `import { http } from '@/utils/luch-request/index.js'`   
5. 什么参数需要在` setConfig ` 设置？什么参数需要在` request ` 拦截器设置？
    - ` setConfig ` 适用于设置一些静态的/默认的参数；比如header 里的一些默认值、默认全局参数（全局请求配置）。` token ` 并不适合在这里设置。
    - ` interceptor.request ` 拦截器适用范围较广，但我仍然建议把一些静态的东西放在 ` setConfig ` 里。拦截器会在每次请求调用，而 ` setConfig ` 仅在调用时修改一遍。

tip
------------
- nvue 不支持全局挂载
- 当前的hbuilderx 版本号：2.6.15
- 推荐使用下载插件的方式使用。如果本插件完全满足你的需求可直接使用 ` npm `安装
- license: MIT


issue
------------
- DCloud: 有任何问题或者建议可以=> <a href="https://ask.dcloud.net.cn/question/74922" target="_blank">issue提交</a>,先给个五星好评QAQ!!
- github: [Issues](https://github.com/lei-mu/luch-request/issues "Issues")


作者想说
------------
- 写代码很容易，为了让你们看懂写文档真的很lei 0.0
- 最近发现有插件与我雷同，当初接触uni-app 就发现插件市场虽然有封装的不错的request库，但是都没有对多全局配置做处理，都是通过修改源码的方式配置。我首先推出通过class类，并仿照axios的api实现request请求库，并起名‘仿axios封装request网络请求库，支持拦截器全局配置’。他们虽然修改了部分代码，但是功能与性能并没有优化，反而使代码很冗余。希望能推出新的功能，和性能更加强悍的请求库。（2019-05）
- 任何形式的‘参考’、‘借鉴’，请标明作者
 ```javascript
 <a href="https://ext.dcloud.net.cn/plugin?id=392">luch-request</a>
 ```
- 关于问问题
1. 首先请善于利用搜索引擎，不管百度，还是Google，遇到问题请先自己尝试解决。自己尝试过无法解决，再问。 
2. 不要问类似为什么我的xx无法使用这种问题。请仔细阅读文档，检查代码，或者说明运行环境，把相关代码贴至评论或者发送至我的邮箱，还可以点击上面的issue提交，在里面提问，可能我在里面已经回答了。
3. 我的代码如果真的出现bug,或者你有好的建议、需求，可以提issue,我看到后会立即解决
4. 不要问一些弱智问题！！！
5. 如第四条
- 如何问问题
1. 问问题之前请换位思考，如果自己要解决这个问题，需要哪些信息
2. 仔细阅读文档，检查代码
3. 说明运行环境，比如：app端 ios、android 版本号、手机机型、普遍现象还是个别现象（越详细越好）
4. 发出代码片段或者截图至邮箱（很重要）
5. 或者可以在上方的'issue提交' 里发出详细的问题描述
6. 以上都觉得解决不了你的问题，可以加QQ:`370306150`

个人网站
------------
- 虽然我的网站里还啥都没有，但我还是放在这，<a href="https://soso.luxe/luch-request/" target="_blank">万一有人点呢</a> 0.0

土豪赞赏
------------
[![wechat 打赏](http://oss.soso.luxe/images/common/my-wechat-qrcode.png?imageView2/1/w/150/h/150 "wechat 打赏")](http://oss.soso.luxe/images/common/my-wechat-qrcode.png?imageView2/1/w/150/h/150 "wechat 打赏")


###### 您的鼓励是我更新的动力

#### 创作不易，五星好评你懂得！
