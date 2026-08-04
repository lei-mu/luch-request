---
title: 从 v3 迁移到 v4
description: v4 breaking redesign 的 API、错误、取消和配置迁移清单
---

# 从 v3 迁移到 v4

v4 是 breaking redesign，不建议在未验证的情况下直接替换生产项目。

## 创建实例与模块格式

```ts
// v3
import Request from 'luch-request'
const http = new Request()

// v4
import { createLuchRequest } from 'luch-request'
const http = createLuchRequest()
```

v4 只发布 ESM，不再提供默认导出、CommonJS 或 UMD，构建目标为 ES2017。

## 请求改为 Promise-only

`success`、`fail`、`complete` 由 v4 内部 callback adapter 保留。调用方只使用
Promise：

```ts
const response = await http.get<User>('/users/1')
```

普通请求泛型顺序：

```ts
http.request<TResponse, TData, TParams, TNativeOptions>(config)
http.get<TResponse, TParams, TNativeOptions>(url, config)
http.post<TResponse, TData, TParams, TNativeOptions>(url, data, config)
```

`TParams` 约束输入 `params` 与 `paramsSerializer`。由于 defaults 与 request
interceptor 可以替换最终参数，`response.config.params` 只保留宽
`object | undefined` 类型。

upload / download 使用各自配置类型，不再通过伪 method 进入普通请求。

## 错误处理

所有 rejection 都是 `LuchRequestError`，根据 `code` 区分：

- `LuchRequestError.ERR_INVALID_CONFIG`
- `LuchRequestError.ERR_NETWORK`
- `LuchRequestError.ERR_BAD_STATUS`
- `LuchRequestError.ERR_BAD_RESPONSE`
- `LuchRequestError.ERR_CANCELED`
- `LuchRequestError.ERR_INTERCEPTOR`

固定错误消息使用英文，业务不要匹配 message。平台原始错误位于 `raw` 与
`cause`；HTTP 状态错误和 response interceptor 错误尽可能保留 `response`。

库产生的 `LuchRequestError.ERR_BAD_STATUS` /
`LuchRequestError.ERR_BAD_RESPONSE` 可通过 `error.response` 判断平台已取得响应。
`LuchRequestError.ERR_NETWORK` 不能证明服务端是否收到请求；interceptor 的
response 还可能来自恢复逻辑的合成值。各常量触发阶段和上下文区别见
[错误处理：错误码常量](/api/error#错误码常量)。

`cancelMode` 在库取消流程中标识原生中断或逻辑取消；手动构造错误时非必填，
也不会触发实际取消。

## 取消与 Task

```ts
const pending = http.download({ url: '/file.pdf' })

pending.onTask((task, control) => {
  task.onProgressUpdate?.(console.log)

  // listener 内需要取消时使用：
  // control.abort('页面已离开')
})

pending.abort('页面已离开')
```

`onTask()` 的第一个参数只用于观察进度、响应头等事件，禁止调用
`task.abort()`；listener 内取消使用第二个参数 `control.abort()`，直接持有增强
Promise 时使用 `pending.abort()` 代替 v3 的 `getTask` 取消流程。单次配置也支持
同样签名的 `onTask(nativeTask, control)`。

如果还需要 `abort()`、`onTask()` 或 `task`，不要把 `pending.then()`、
`pending.catch()`、`pending.finally()` 的返回值保存为新的 pending，这些方法返回
普通 Promise，不会传播扩展能力。经过 `async`、service 或 Promise 转换链时，
改用 `signal` 传播。浏览器原生 JavaScript/Web API `AbortController` 只在 H5
可用；App、小程序、HarmonyOS 等其他平台没有该对象，必须使用
`createCancelSource()`。需要共用一套跨平台代码时也应直接使用
`createCancelSource()`。

## 配置变化

- defaults 优先级低于单次配置
- 普通对象和数组生成请求私有副本；不透明平台对象保持引用
- `header` 按大小写不敏感合并，单次 `null/undefined` 删除继承值
- v3 `custom` 更名为 `luchMeta`，按第一层浅合并
- upload 默认不继承实例 `Content-Type`
- 平台新增字段移入 `nativeOptions`，未声明顶层字段不再自动透传
- request 实例 `nativeOptions` 不进入 upload / download
- request / response interceptor 都按注册顺序 FIFO
- handler 通过 `context.operation` 区分三类操作
- upload 默认 `auto` 解析字符串 JSON；其他操作不额外解析
- 响应增加 `config`、`task`、`raw`，保留未知平台响应字段

## 暂不提供

首个 npm 版本不包含 `uni_modules`、uni-app x、重试、缓存、请求去重、并发控制、
Token 自动刷新或 WebSocket。

## 迁移建议

1. 先建立独立 v4 实例，不与生产 v3 实例混用
2. 迁移一条无文件、无取消的普通请求链路
3. 改造错误判断为 `isLuchRequestError()` + `code`
4. 再迁移 interceptor、Task 与 signal
5. 在每个目标平台完成 smoke test 后才扩大流量
