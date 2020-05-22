---
title: 常见问题
---

#### 1. 为什么cli用户不能使用 npm 方式引入
插件使用es6,es7 开发，好处就是结构清晰，语义化，开发代码少，并且对于目前的我来说，完全没有必要使用es5开发。
<br>
为什么不用babel解决：babel 编译后的代码对uni的条件编译注释不友好。如果不用条件编译则不能发挥最大优势。
<br>
这样存在的问题：对于HBuilderX 创建的项目完全没有影响，idea 会对node_modules 里的插件条件编译，并且babel。主要是cli 用户，cli 不会对node_modules 里的代码babel。它不认识es7 `class-properties`,我目前没有想到一个好的解决方案,以下配置也不起作用

``` javascript 
// vue.config.js
 module.exports = {
      transpileDependencies: ['luch-request']
 }
```

**最终解决方案：cli 用户使用插件下载包的方式引入即可**

#### 2. 为什么会请求两次？
如果其中有`options` 请求：`本地访问接口时跨域请求，所以浏览器会先发一个option 去预测能否成功，然后再发一个真正的请求`。（自己观察请求头，Request Method，百度`简单请求`）

#### 3. 如何跨域？
问的人不少，可以先百度了解一下。[如何跨域](https://ask.dcloud.net.cn/article/35267)

#### 4. TypeError: undefined is not an object (evaluating 'this.$http.get')
 不知道为啥问的人这么多？太基础了，百度学习一下 export default 和export，头大。<br>
 `import { http } from '@/utils/luch-request/index.js'`   
#### 5. 什么参数需要在` setConfig ` 设置？什么参数需要在` request ` 拦截器设置？
- ` setConfig ` 适用于设置一些静态的/默认的参数；比如header 里的一些默认值、默认全局参数（全局请求配置）。` token ` 并不适合在这里设置。
- ` interceptor.request ` 拦截器适用范围较广，但我仍然建议把一些静态的东西放在 ` setConfig ` 里。拦截器会在每次请求调用，而 ` setConfig ` 仅在调用时修改一遍。