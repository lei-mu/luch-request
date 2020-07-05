---
sidebar: auto
title: 指南
---


# 指南

介绍
------------

luch-request 是一个基于Promise 开发的uni-app跨平台、项目级别的请求库，它有更小的体积，易用的api，方便简单的自定义能力。

- 支持全局挂载
- 支持多个全局配置实例
- 支持自定义验证器
- 支持文件上传/下载
- 支持task 操作
- 支持自定义参数
- 支持多拦截器
- 对参数的处理比uni.request 更强

### 它是如何工作的
luch-request 基于Promise,使用条件编译开发，专用于uni-app项目（事实上，我们可以剔除对应的终端以外的代码，直接在对应终端原生语言使用）。为了降低学习成本，一些api参照axios 设计。并扩展一些其它的api
<br>
在项目中，我们可以通过`局部引入`和`全局引入`的方式去使用它。

### 为什么不是...?

#### axios
axios 是一个优秀的可用于前端项目和node 的请求库。但是在uni-app 项目中却不能使用它。因为它使用了`xhr` 对象的请求库，但是在除h5终端以外的终端都没有开放xhr对象，所以它无法跨端开发。并且大量的配置在uni-app中不支持，或者没有。无用的代码意味着无用的消耗。它的迭代并不会考虑uni-app。

#### axios重写`adapter`
还是那句话，对于uni-app来说它太大太重。大量无用的代码，并不适用于项目。luch-request完全满足项目开发。

#### 其他的uni request 插件
**非条件编译开发:** 插件市场的部分request没有使用条件编译开发，这对我们项目debug会造成误导影响。并且多余的代码也增大了项目体积。
<br>
**多余的配置项:** 有些插件会把loading、auth等参数加入配置，使其做一些请求之外的操作，这些配置并不是所有人都会使用。**request请求库只需专注于请求即可**。luch-request对额外操作的处理则更为优雅，增加了`custom` 配置，使开发者可以做一些自定义操作。
<br>
**开发构建:** luch-request请求库开发配置了eslint、rollup等等项目级构建打包工具，很大程度上使代码更加标准。
<br>
其他显而易见的优势就不用说了

#### uni.request
...
<br>
无法满足项目级开发要求，无拦截器，无自定义api.
<br>
你的使用方式
```` javascript
uni.request({
    url: this.$baseUrl + 'api/user'
    method: 'POST',
    data: {a:1},
    header: {Content-Type: '...', token: '....'}
    success: (res) => {},
    fail: (err) => {}
}) 
````
使用luch-request后
```` javascript
this.$http.post('/api/user', {a:1}).then(res => {
    ...
}).catch(err => {
    ...
})
````
<br>
luch-request 对特殊参数的处理方式比uni.request 更强。具体可见get,传递数组。

#### function
这是我见得大多数人的使用方法。自己写一个function封装。修改配置都是直接改代码。在一些项目中可能出现多个api的情况，无法多实例。
<br>
...

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
cli用户使用npm包，为什么要加以上配置[详见](/issue/#_1-%E4%B8%BA%E4%BB%80%E4%B9%88cli%E7%94%A8%E6%88%B7%E4%B8%8D%E8%83%BD%E4%BD%BF%E7%94%A8-npm-%E6%96%B9%E5%BC%8F%E5%BC%95%E5%85%A5)
:::

### github

<a href="https://github.com/lei-mu/luch-request" target="_blank" rel="noopener noreferrer nofollow">GitHub</a>
<br>
使用DCloud/luch-request 文件夹即可


### DCloud插件市场

<a href="https://ext.dcloud.net.cn/plugin?id=392" target="_blank" rel="noopener noreferrer nofollow">DCloud插件市场</a>


tip
------------
- nvue 不支持全局挂载
- 当前的hbuilderx 版本号：beat-2.7.14 alpha-2.8.0
- 推荐使用下载插件的方式使用。如果本插件完全满足你的需求可直接使用 ` npm `安装
- license: MIT


issue
------------
- DCloud: 有任何问题或者建议可以=> <a href="https://ask.dcloud.net.cn/question/74922" target="_blank" rel="noopener noreferrer nofollow">issue提交</a>,先给个<a href="https://ext.dcloud.net.cn/plugin?id=392" target="_blank" rel="noopener noreferrer nofollow">五星好评</a>QAQ!!
- github: <a href="https://github.com/lei-mu/luch-request/issues" target="_blank" rel="noopener noreferrer nofollow">Issues</a>


作者想说
------------
- 写代码很容易，为了让你们看懂写文档真的很lei 0.0
- 最近发现有插件与我雷同，当初接触uni-app 就发现插件市场虽然有封装的不错的request库，但是都没有对多全局配置做处理，都是通过修改源码的方式配置。我首先推出通过class类，并仿照axios的api实现request请求库，并起名‘仿axios封装request网络请求库，支持拦截器全局配置’。他们虽然修改了部分代码，但是功能与性能并没有优化，反而使代码很冗余。希望能推出新的功能，和性能更加强悍的请求库。（2019-05）
- 任何形式的‘参考’、‘借鉴’，请标明作者` luch-request `
 ```javascript
 <a href="https://www.quanzhan.co/luch-request/">luch-request</a>
 ```


我有疑惑
------------
### 关于问问题
1. 首先请善于利用搜索引擎，不管百度，还是Google，遇到问题请先自己尝试解决。自己尝试过无法解决，再问。 
2. 不要问类似为什么我的xx无法使用这种问题。请仔细阅读文档，检查代码，或者说明运行环境，把相关代码贴至评论或者发送至我的邮箱，还可以点击<a href="https://ask.dcloud.net.cn/question/74922" target="_blank">DCloud 社区</a>，在里面提问，可能我在里面已经回答了。
3. 我的代码如果真的出现bug,或者你有好的建议、需求，可以提issue,我看到后会立即解决
4. 不要问一些弱智问题！！！
5. 如第四条

### 如何问问题
1. 问问题之前请换位思考，如果自己要解决这个问题，需要哪些信息
2. 仔细阅读文档，检查代码
3. 说明运行环境，比如：app端 ios、android 版本号、手机机型、普遍现象还是个别现象（越详细越好）
4. 发出代码片段或者截图至邮箱（很重要）`webwork.s@qq.com`
5. 或者可以在<a href="https://ask.dcloud.net.cn/question/74922" target="_blank" rel="noopener noreferrer nofollow">DCloud 社区</a>里发出详细的问题描述
6. 以上都觉得解决不了你的问题或问题过于复杂难以描述，可以加QQ:`370306150`


# 深入


开发理念
------------
...
