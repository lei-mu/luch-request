---
title: 常见问题
---

#### 1. 如果cli 用户npm 引入报错？
插件使用es6,es7 开发，好处就是结构清晰，语义化，开发代码少，并且对于目前的我来说，完全没有必要使用es5开发。
<br>
为什么不用babel解决：babel 编译后的代码对uni的条件编译注释不友好。如果不用条件编译则不能发挥最大优势。
<br>
这样存在的问题：对于HBuilderX 创建的项目完全没有影响，idea 会对node_modules 里的插件条件编译，并且babel。主要是cli 用户，cli 不会对node_modules 里的代码babel。
<br>
可尝试如下配置
``` javascript 
// vue.config.js
 module.exports = {
      transpileDependencies: ['luch-request']
 }
```


#### 2. 为什么会请求两次？
如果其中有`options` 请求：`本地访问接口时跨域请求，所以浏览器会先发一个option 去预测能否成功，然后再发一个真正的请求`。（自己观察请求头，Request Method，百度`简单请求`）

#### 3. 如何跨域？
问的人不少，可以先百度了解一下。<a href="https://ask.dcloud.net.cn/article/35267" target="_blank" rel="noopener noreferrer nofollow">如何跨域</a>

#### 4. TypeError: undefined is not an object (evaluating 'this.$http.get')
 不知道为啥问的人这么多？太基础了，百度学习一下 export default 和export，头大。<br>
 `import { http } from '@/utils/luch-request/index.js'`   
#### 5. 什么参数需要在` setConfig ` 设置？什么参数需要在` request ` 拦截器设置？
- ` setConfig ` 适用于设置一些静态的/默认的参数；比如header 里的一些默认值、默认全局参数（全局请求配置）。` token ` 并不适合在这里设置。
- ` interceptors.request ` 拦截器适用范围较广，但我仍然建议把一些静态的东西放在 ` setConfig ` 里。拦截器会在每次请求调用，而 ` setConfig ` 仅在调用时修改一遍。

#### 6. 如何jwt无痛刷新？

[jwt无痛刷新](/resources/article.html#jwt-%E6%97%A0%E7%97%9B%E5%88%B7%E6%96%B0)

#### 7. 如何配置超时时间？
**全局**

网络请求的 超时时间 可以统一在 manifest.json 中配置 [networkTimeout](https://uniapp.dcloud.io/collocation/manifest?id=networktimeout)

插件的全局配置超时时间：[插件-全局请求配置-timeout](/guide/3.x/#%E5%8F%AF%E9%85%8D%E7%BD%AE%E9%A1%B9)。必须请求方法和终端支持`timeout`,支持度参照[timeout 支持度](/guide/3.x/#middleware)

**局部**

局部配置项`timeout`：[timeout](/guide/3.x/#request)。必须请求方法和终端支持`timeout`,支持度参照[timeout 支持度](/guide/3.x/#middleware)

如果终端和请求方式不支持`timeout`,可参考如下实现
```` javascript
 http.request({
    method: 'POST', // 请求方法必须大写 [GET|POST|PUT|DELETE|CONNECT|HEAD|OPTIONS|TRACE]
    url: '/user/12345',
    data: {
      firstName: 'Fred',
      lastName: 'Flintstone'
    },
    params: { // 会拼接到url上
      token: '1111'
    },
    // 返回当前请求的task, options。请勿在此处修改options。非必填
    getTask: (task, options) => {
      // 500ms 后终止请求
      setTimeout(() => {
       task.abort()
      }, 500)
    }
  })
````
