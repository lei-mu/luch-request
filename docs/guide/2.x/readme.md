---
sidebar: auto
title: 2.x文档
---

# luch-request 2.x

介绍
------------
<a href="https://www.npmjs.com/package/luch-request" target="_blank" rel="noopener noreferrer nofollow" title="npm"><img src="https://img.shields.io/npm/l/luch-request" alt="npm"></a>
<a href="https://www.npmjs.com/package/luch-request" target="_blank" rel="noopener noreferrer nofollow" title="npm"><img src="https://img.shields.io/npm/v/luch-request" alt="npm"></a>
<a href="https://github.com/lei-mu/luch-request" target="_blank" rel="noopener noreferrer nofollow" title="github"><img src="https://img.shields.io/github/package-json/v/lei-mu/luch-request" alt="github"></a>
<a href="https://github.com/lei-mu/luch-request" target="_blank" rel="noopener noreferrer nofollow" title="github stars"><img src="https://img.shields.io/github/stars/lei-mu/luch-request.svg" alt="github stars"></a>
<a href="https://github.com/lei-mu/luch-request" target="_blank" rel="noopener noreferrer nofollow" title="github forks"><img src="https://img.shields.io/github/forks/lei-mu/luch-request.svg" alt="github forks"></a>

- 基于 Promise 对象实现更简单的 request 使用方式，支持请求和响应拦截
- 支持全局挂载
- 支持多个全局配置实例
- 支持自定义验证器
- 支持文件上传/下载
- 支持task 操作
- 支持自定义参数

快速上手
------------
### npm

```` javascript
npm i luch-request -S
````
cli 用户使用npm 包需增加以下配置(<a href="https://uniapp.dcloud.io/quickstart?id=_2-%e9%80%9a%e8%bf%87vue-cli%e5%91%bd%e4%bb%a4%e8%a1%8c" target="_blank" rel="noopener noreferrer nofollow">什么是cli用户</a>)
<br>
项目根路径下创建`vue.config.js` 文件，增加以下内容
``` javascript 
// vue.config.js
 module.exports = {
      transpileDependencies: ['luch-request']
 }
```

::: warning
cli用户使用npm包，为什么要加以上配置<a href="/issue/#_1-%E4%B8%BA%E4%BB%80%E4%B9%88cli%E7%94%A8%E6%88%B7%E4%B8%8D%E8%83%BD%E4%BD%BF%E7%94%A8-npm-%E6%96%B9%E5%BC%8F%E5%BC%95%E5%85%A5" target="_blank">详见</a>
:::

### github

<a href="https://github.com/lei-mu/luch-request" target="_blank" rel="noopener noreferrer nofollow">GitHub</a>
<br>
使用DCloud/luch-request 文件夹即可


### DCloud插件市场

<a href="https://ext.dcloud.net.cn/plugin?id=392" target="_blank" rel="noopener noreferrer nofollow">DCloud插件市场</a>




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
### request
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
```
### upload
``` javascript 
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
```
### download
``` javascript 

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

### 实例方法

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
### 可配置项
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


### 全局配置修改` setConfig `

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

自定义验证器
------------
### ` validateStatus `

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

### 在请求之前拦截

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
    // if (config.custom.loading) {
    //  uni.showLoading()
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

### 在请求之后拦截

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

土豪赞赏
------------
[打赏事宜具体说明](/acknowledgement/)


###### 您的鼓励是我更新的动力

#### 创作不易，五星好评你懂得！
