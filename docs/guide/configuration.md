---
title: 配置与合并
description: 实例默认配置、单次请求配置和原生参数的合并规则
---

# 配置与合并

本页说明实例默认配置与单次配置如何合并。需要查询每个字段的类型、用途、平台
边界和设计原因，请先阅读 [配置选项](/api/config-options)。

配置优先级固定为：

```text
内置行为默认值 → 实例 defaults → 单次请求配置
```

这不意味着所有字段都采用同一种深合并。v4 按字段定义明确策略。

## 内置行为

| 配置 | 未传时的行为 |
| --- | --- |
| `baseURL` | 按空字符串生成最终 URL |
| `method` | `request()` 使用 `GET`；快捷方法使用固定 method |
| `header` | 不主动添加请求头 |
| `params` | 不追加查询参数 |
| `validateStatus` | 接受 200–299 |
| `transformResponse` | 运行内置 JSON transformer |
| `luchOptions.jsonParsing` | 只对 upload 使用 `auto` 解析 |
| `signal` | 不监听取消信号 |
| `timeout` 等原生配置 | 不设置，由目标平台决定 |

`method` 和 `validateStatus` 会在 request interceptor 前补齐。`fullURL` 只会在
全部 request interceptor 完成后生成。

## 字段合并策略

| 字段 | 策略 |
| --- | --- |
| `header` | header 名大小写不敏感；单次值覆盖，`null/undefined` 删除继承值 |
| `luchMeta` | 第一层浅合并，嵌套同名值整体替换 |
| `luchOptions` | 按库功能定义；`jsonParsing` 对象按字段合并 |
| `transformResponse` | 单次数组整体替换实例数组，不自动拼接 |
| `nativeOptions` | request 的实例值与单次值浅合并；文件操作只用单次值 |
| `onTask` | 只允许单次配置，不从实例 defaults 继承 |
| `baseURL`、`params`、`signal` 等 | 单次值整体覆盖实例值 |
| `data`、`formData`、`files` 等 | 单次值整体覆盖，不与实例值递归合并 |

普通对象和数组会生成请求私有副本，避免 interceptor 修改 defaults 或其他并发
请求。`signal`、函数、`Date`、`ArrayBuffer`、class 实例和平台对象保持引用身份。

之所以不对所有对象统一深合并，是因为不同字段表达的语义不同：`header` 是可组合
键值集合，`params` 和 `data` 是完整业务输入，`signal` 则依赖对象身份传播取消。
按字段选择策略，可以避免“合并成功但请求含义已经改变”的隐性问题。

`onTask` 描述某一次原生 Task 的生命周期，因此不能作为实例默认监听器跨请求
复用。它会保留到 request interceptor 完成后的最终配置中，但在原生派发时被
过滤；Task 创建后由库单独调用一次。

## 合并与原生派发是两层机制

`mergeConfig` 负责生成 request interceptor 使用的配置，不使用原生参数白名单；
除了原型污染相关字段外，调用方传入的顶层属性会保留到这个阶段。interceptor
执行完成后，库才按 request、upload 或 download 的运行时白名单构造原生参数。

因此，无论使用 TypeScript 还是 JavaScript：

```text
未知顶层 key
→ 配置合并时保留
→ request interceptor 中可见
→ 原生派发时过滤
→ 不会传给 uni API
```

`nativeOptions` 是明确的原生扩展通道，其中允许的扩展字段会在派发前展开。完整的
request、upload、download 顶层白名单见
[配置选项：顶层原生字段白名单](/api/config-options#顶层原生字段白名单)。

## params 不做对象合并

```ts
const http = createLuchRequest({
  params: {
    language: 'zh',
    pageSize: 20
  }
})

await http.get('/users', {
  params: {
    page: 2
  }
})
```

最终 `params` 是 `{ page: 2 }`，不会保留实例中的 `language` 和 `pageSize`。
这样可以避免实例级业务参数意外进入不相关请求。

## header 的删除语义

```ts
const http = createLuchRequest({
  header: {
    Authorization: 'Bearer token',
    Accept: 'application/json'
  }
})

await http.get('/public', {
  header: {
    authorization: undefined
  }
})
```

header 名按大小写不敏感处理，最终不会发送 `Authorization`。空值在派发前还会
再次过滤。upload 未显式设置 `Content-Type` 时，不继承实例默认值中的该字段，
以便平台生成 multipart boundary。

## luchMeta 与 nativeOptions

`luchMeta` 是业务及 interceptor 元数据，不发送给 uni API：

```ts
await http.get('/users/1', {
  luchMeta: {
    requiresAuth: true,
    traceName: 'user-detail'
  }
})
```

`nativeOptions` 用于平台新增、专有或与库配置重名的原生参数。派发前它会展开到
原生配置顶层，不会以嵌套对象发送：

```ts
await http.get('/users/1', {
  nativeOptions: {
    enableProfile: true
  }
})
```

`url`、`fullURL`、`success`、`fail`、`complete` 是保护字段，不能通过
`nativeOptions` 覆盖。透传也不代表每个平台都支持该参数，仍需核对目标平台文档。

## 文件操作的隔离

upload / download 只继承 `baseURL`、`header`、`params`、`luchMeta`、
`validateStatus`、`transformResponse`、`signal`、`timeout`、`luchOptions` 等公共配置。实例中的
request 专属字段和 `nativeOptions` 不会进入文件操作；文件平台扩展应写在本次
upload / download 的 `nativeOptions` 中。
