---
sidebar: auto
title: 3.x文档
---

# luch-request 3.x

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
- 支持多拦截器
- 对参数的处理比uni.request 更强

快速上手
------------
### npm

```` javascript
npm install luch-request -S
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
cli用户使用npm包，为什么要加以上配置[详见](/issue/#%E5%A6%82%E6%9E%9Ccli-%E7%94%A8%E6%88%B7npm-%E5%BC%95%E5%85%A5%E6%8A%A5%E9%94%99%EF%BC%9F)
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
    // #ifndef MP-ALIPAY
    responseType: 'text',
    // #endif
    // #ifdef H5 || APP-PLUS || MP-ALIPAY || MP-WEIXIN
    timeout: 60000, // H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)、微信小程序（2.10.0）、支付宝小程序
    // #endif
    // #ifdef APP-PLUS
    sslVerify: true, // 验证 ssl 证书 仅5+App安卓端支持（HBuilderX 2.3.3+）
    // #endif
    // #ifdef APP-PLUS
    firstIpv4: false, // DNS解析时优先使用ipv4 仅 App-Android 支持 (HBuilderX 2.8.0+)
    // #endif
    // #ifdef H5
    withCredentials: false, // 跨域请求时是否携带凭证（cookies）仅H5支持（HBuilderX 2.6.15+）
    // #endif
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
         // 相当于设置超时时间500ms
         // setTimeout(() => {
         //   task.abort()
         // }, 500)
    },
    //validateStatus: (statusCode) => { // statusCode 必存在。此处示例为全局默认配置。演示，非必填选项
	//	return statusCode >= 200 && statusCode < 300
	//},
	// forcedJSONParsing: true, // 是否尝试将响应数据json化,默认为true。如果失败则返回原数据
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
    // #ifndef MP-ALIPAY
    responseType: 'text',
    // #endif
    // #ifdef H5 || APP-PLUS || MP-ALIPAY || MP-WEIXIN
    timeout: 60000, // H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)、微信小程序（2.10.0）、支付宝小程序
    // #endif
    // #ifdef APP-PLUS
    sslVerify: true, // 验证 ssl 证书 仅5+App安卓端支持（HBuilderX 2.3.3+）
    // #endif
   // #ifdef APP-PLUS
    firstIpv4: false, // DNS解析时优先使用ipv4 仅 App-Android 支持 (HBuilderX 2.8.0+)
    // #endif
    // #ifdef H5
    withCredentials: false, // 跨域请求时是否携带凭证（cookies）仅H5支持（HBuilderX 2.6.15+）
    // #endif
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
         // 相当于设置超时时间500ms
         // setTimeout(() => {
         //   task.abort()
         // }, 500)
    },
    //validateStatus: (statusCode) => { // statusCode 必存在。此处示例为全局默认配置。演示，非必填选项
  	//	return statusCode >= 200 && statusCode < 300
  	//}
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
    // #ifdef H5 || APP-PLUS
    timeout: 60000, // H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)
    // #endif
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
    },
    //validateStatus: (statusCode) => { // statusCode 必存在。此处示例为全局默认配置。演示，非必填选项
    //	return statusCode >= 200 && statusCode < 300
    //}
  }).then(res => {
    // 返回的res.data 已经进行JSON.parse
  }).catch(err => {

  })
```
luch-request API
------------
### request
参考文档：[uni.request](https://uniapp.dcloud.io/api/request/request)
``` javascript 
 http.request({
    // baseURL: '',
    method: 'POST', // 请求方法必须大写 [GET|POST|PUT|DELETE|CONNECT|HEAD|OPTIONS|TRACE]
    url: '/user/12345',
    data: {
      firstName: 'Fred',
      lastName: 'Flintstone'
    },
    // #ifdef H5 || APP-PLUS || MP-ALIPAY || MP-WEIXIN
    timeout: 60000, // H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)、微信小程序（2.10.0）、支付宝小程序
    // #endif
    params: { // 会拼接到url上
      token: '1111'
    },
    // #ifdef APP-PLUS
    firstIpv4: false, // DNS解析时优先使用ipv4 仅 App-Android 支持 (HBuilderX 2.8.0+)
    // #endif
    // 注：如果局部custom与全局custom有同名属性，则后面的属性会覆盖前面的属性，相当于Object.assign(全局，局部)
    custom: {}, // 自定义参数
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
      // setTimeout(() => {
      //   task.abort()
      // }, 500)
    },
    //validateStatus: (statusCode) => { // statusCode 必存在。此处示例为全局默认配置。演示，非必填选项
    //	return statusCode >= 200 && statusCode < 300
    //},
     // 自定义处理params 函数
     //paramsSerializer: (params) => {
     //   return qs.stringify(params)
     //}
  })
```
### upload
参考文档：[uni.uploadFile](https://uniapp.dcloud.io/api/request/network-file?id=uploadfile)
``` javascript 
  // 具体参数说明：[uni.uploadFile](https://uniapp.dcloud.io/api/request/network-file)
  http.upload('api/upload/img', {
    // baseURL: '',
    params: {}, /* 会加在url上 */
    // #ifdef APP-PLUS || H5
    files: [], // 需要上传的文件列表。使用 files 时，filePath 和 name 不生效。App、H5（ 2.6.15+）
    // #endif
    // #ifdef MP-ALIPAY
    fileType: 'image/video/audio', // 仅支付宝小程序，且必填。
    // #endif
    filePath: '', // 要上传文件资源的路径。
    name: 'file', // 文件对应的 key , 开发者在服务器端通过这个 key 可以获取到文件二进制内容
    // #ifdef H5 || APP-PLUS
    timeout: 3000, // H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)
    // #endif
    header: {}, /* 会与全局header合并，如有同名属性，局部覆盖全局 */
    custom: {}, // 自定义参数
    formData: {}, // HTTP 请求中其他额外的 form data
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
      // setTimeout(() => {
      //   task.abort()
      // }, 500)
    },
    //validateStatus: (statusCode) => { // statusCode 必存在。此处示例为全局默认配置。演示，非必填选项
    //	return statusCode >= 200 && statusCode < 300
    //},
     // 自定义处理params 函数
     //paramsSerializer: (params) => {
     //   return qs.stringify(params)
     //}
  }).then(res => {
    // 返回的res.data 已经进行JSON.parse
  }).catch(err => {

  })
```
### download
参考文档：[uni.downloadFile](https://uniapp.dcloud.io/api/request/network-file?id=downloadfile)
``` javascript 

  // 具体参数说明：[uni.downloadFile](https://uniapp.dcloud.io/api/request/network-file?id=downloadfile)
  http.download('api/download', {
    // baseURL: '',
    params: {}, /* 会加在url上 */
    // #ifdef H5 || APP-PLUS
    timeout: 3000, // H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)
    // #endif
    header: {}, /* 会与全局header合并，如有同名属性，局部覆盖全局 */
    custom: {}, // 自定义参数
    // 返回当前请求的task, options。非必填
    getTask: (task, options) => {
      // setTimeout(() => {
      //   task.abort()
      // }, 500)
    },
    //validateStatus: (statusCode) => { // statusCode 必存在。此处示例为全局默认配置。演示，非必填选项
   	//	return statusCode >= 200 && statusCode < 300
   	//},
     // 自定义处理params 函数
     //paramsSerializer: (params) => {
     //   return qs.stringify(params)
     //}
  }).then(res => {

  }).catch(err => {

  })
```
### middleware
所有请求方式的超集。包含UPLOAD、DOWNLOAD方法。对应method使用对应参数。
``` javascript 
 http.middleware({
    // baseURL: '',
    method: 'POST', // 请求方法必须大写 [GET|POST|PUT|DELETE|CONNECT|HEAD|OPTIONS|TRACE|UPLOAD|DOWNLOAD]
    url: '/user/12345',
    data: {
      firstName: 'Fred',
      lastName: 'Flintstone'
    },
    timeout: 60000, // H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)、微信小程序（2.10.0）、支付宝小程序
    params: { // 会拼接到url上
      token: '1111'
    },
    // #ifdef APP-PLUS
    firstIpv4: false, // DNS解析时优先使用ipv4 仅 App-Android 支持 (HBuilderX 2.8.0+)
    // #endif
    // 注：如果局部custom与全局custom有同名属性，则后面的属性会覆盖前面的属性，相当于Object.assign(全局，局部)
    custom: {}, // 自定义参数
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
      // setTimeout(() => {
      //   task.abort()
      // }, 500)
    },
    //validateStatus: (statusCode) => { // statusCode 必存在。此处示例为全局默认配置。演示，非必填选项
    //	return statusCode >= 200 && statusCode < 300
    //},
     // 自定义处理params 函数
     //paramsSerializer: (params) => {
     //   return qs.stringify(params)
     //},
     // 是否尝试将响应数据json化。boolean 或者一个包含include的对象。非必填。默认true。include为数组，包含需要json化的method
     // forcedJSONParsing: {include: ['UPLOAD', 'DOWNLOAD']}
  })
```



**method 支持度**

|method|App|H5|微信小程序|支付宝小程序|百度小程序|字节跳动小程序|
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
|GET|√|√|√|√|√|√|
|POST|√|√|√|√|√|√|
|PUT|√|√|√|x|√|√|
|DELETE|√|√|√|x|√|x|
|CONNECT|x|√|√|x|x|x|
|HEAD|x|√|√|x|√|x|
|OPTIONS|√|√|√|x|√|x|
|TRACE|x|√|√|x|x|x|
|UPLOAD|√|√|√|√|√|√|
|DOWNLOAD|√|√|√|√|√|√|

**timeout 支持度**
|method|App|H5|微信小程序|支付宝小程序|百度小程序|字节跳动小程序|
|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
|GET|√ (HBuilderX 2.9.9+)|√ (HBuilderX 2.9.9+)|√ (2.10.0)|√|x|x|
|POST|√ (HBuilderX 2.9.9+)|√ (HBuilderX 2.9.9+)|√ (2.10.0)|√|x|x|
|PUT|√ (HBuilderX 2.9.9+)|√ (HBuilderX 2.9.9+)|√ (2.10.0)|x|x|x|
|DELETE|√ (HBuilderX 2.9.9+)|√ (HBuilderX 2.9.9+)|√ (2.10.0)|x|x|x|
|CONNECT|x|√ (HBuilderX 2.9.9+)|√ (2.10.0)|x|x|x|
|HEAD|x|√ (HBuilderX 2.9.9+)|√ (2.10.0)|x|x|x|
|OPTIONS|x|√ (HBuilderX 2.9.9+)|√ (2.10.0)|x|x|x|
|TRACE|x|√ (HBuilderX 2.9.9+)|√ (2.10.0)|x|x|x|
|UPLOAD|√ (HBuilderX 2.9.9+)|√ (HBuilderX 2.9.9+)|x|x|x|x|
|DOWNLOAD|√ (HBuilderX 2.9.9+)|√ (HBuilderX 2.9.9+)|x|x|x|x|


### 实例方法

``` javascript
http.middleware(config)
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
http.version // 返回插件版本号
```

全局请求配置
------------
### 可配置项
``` javascript
{
    baseURL: '',
    header: {},
    method: 'GET',
    dataType: 'json',
    // 自定义params 处理函数
    paramsSerializer: null,
    // #ifndef MP-ALIPAY
    responseType: 'text',
    // #endif
    // 注：如果局部custom与全局custom有同名属性，则后面的属性会覆盖前面的属性，相当于Object.assign(全局，局部)
    custom: {}, // 全局自定义参数默认值
    // #ifdef H5 || APP-PLUS || MP-ALIPAY || MP-WEIXIN
    timeout: 60000,
    // #endif
    // #ifdef APP-PLUS
    sslVerify: true,
    // #endif
    // #ifdef H5
    // 跨域请求时是否携带凭证（cookies）仅H5支持（HBuilderX 2.6.15+）
    withCredentials: false,
    // #endif
    // #ifdef APP-PLUS
    firstIpv4: false, // DNS解析时优先使用ipv4 仅 App-Android 支持 (HBuilderX 2.8.0+)
    // #endif
    // 局部优先级高于全局，返回当前请求的task,options。请勿在此处修改options。非必填
    // getTask: (task, options) => {
    // 相当于设置了请求超时时间500ms
    //   setTimeout(() => {
    //     task.abort()
    //   }, 500)
    // },
    // 全局自定义验证器。参数为statusCode 且必存在，不用判断空情况。
    validateStatus: (statusCode) => { // statusCode 必存在。此处示例为全局默认配置
        return statusCode >= 200 && statusCode < 300
    },
     // 是否尝试将响应数据json化。boolean 或者一个包含include的对象。非必填。默认true。include为数组，包含需要json化的method
     // forcedJSONParsing: {include: ['UPLOAD', 'DOWNLOAD']}
     // 是否尝试将响应数据json化
     forcedJSONParsing: true
  }
```


### 全局配置修改` setConfig `

``` javascript
/**
     * @description 修改全局默认配置
     * @param {Function}   
*/
http.setConfig((config) => { /* config 为默认全局配置*/
    config.baseURL = 'http://www.bbb.cn'; /* 根域名 */
    config.header = {
        a: 1, // 演示用
        b: 2  // 演示用
    }
    return config
})

// 方式二
const test = new Request({
    header: {a:1}, // 演示
    // ... 其他全局配置项
})


// 方式三
test.config.header = {c:1}
test.config.baseURL = 'https://quanzhan.co'
```


拦截器
------------

### 在请求之前拦截

``` javascript
http.interceptors.request.use((config) => { // 可使用async await 做异步操作
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
   /* 演示
   if (!token) { // 如果token不存在，return Promise.reject(config) 会取消本次请求
      return Promise.reject(config)
    }
   **/
  return config
}, config => { // 可使用async await 做异步操作
  return Promise.reject(config)
})
```

### 在请求之后拦截

``` javascript
http.interceptors.response.use((response) => { /* 对响应成功做点什么 可使用async await 做异步操作*/
  //  if (response.data.code !== 200) { // 服务端返回的状态码不等于200，则reject()
  //    return Promise.reject(response) // return Promise.reject 可使promise状态进入catch
 // if (response.config.custom.verification) { // 演示自定义参数的作用
  //   return response.data
  // }
  console.log(response)
  return response
}, (response) => { /*  对响应错误做点什么 （statusCode !== 200）*/
  console.log(response)
  return Promise.reject(response)
})
```


土豪赞赏
------------
[打赏事宜具体说明](/acknowledgement/)


###### 您的鼓励是我更新的动力

#### 创作不易，五星好评你懂得！
