---
title: 最佳实践与常见场景
description: 创建统一请求实例、处理鉴权、业务状态码、取消请求和多服务端的实践
---

# 最佳实践与常见场景

本页展示业务项目中常见的组合方式。示例中的 `getAccessToken()`、
`clearSession()`、`redirectToLogin()` 与 `showWarning()` / `showError()` 都是应用层函数，
请替换为项目实际的状态管理、页面跳转与提示实现。

::: tip 边界
`luch-request` 只负责 HTTP 请求、Task 和统一错误契约；Token 刷新、业务状态码、
登录跳转与 UI 提示属于应用层策略。本页示例不是必须的固定模板。
:::

## 统一创建请求实例

将服务端地址、超时、公共请求头和全局 interceptor 集中到一个模块，业务代码只导入
该实例。`luchMeta` 保存业务控制信息，不会发送给服务端。

```ts
import {
  createLuchRequest,
  LuchRequestError
} from 'luch-request'

const http = createLuchRequest({
  baseURL: 'https://api.example.com/v1',
  timeout: 10_000,
  header: {
    clientid: 'web'
  },
  luchMeta: {
    hideToast: false,
    hideErrToast: false
  }
})

http.interceptors.request.use((config) => {
  const token = getAccessToken()

  if (!token) {
    return config
  }

  return {
    ...config,
    header: {
      ...config.header,
      Authorization: `Bearer ${token}`
    }
  }
})

http.interceptors.response.use(
  (response) => {
    const meta = response.config.luchMeta ?? {}
    const body = response.data as {
      code?: number
      msg?: string
    }

    // 这里的 200 是示例项目的业务成功码，不是 HTTP statusCode。
    if (body.code === 401) {
      clearSession()
      redirectToLogin()
    }

    if (!meta.hideToast && body.code != null && body.code !== 200) {
      showWarning(body.msg ?? '请求失败')
    }

    return response
  },
  (error) => {
    const meta = error.config.luchMeta ?? {}
    const responseData = error.response?.data as {
      msg?: string
      message?: string
    } | undefined
    // responseData?.message 是服务器特殊异常返回非标响应体message
    const errorMessage = responseData?.msg
      ?? responseData?.message
      ?? error.message

    if (
      !meta.hideErrToast &&
      error.code !== LuchRequestError.ERR_CANCELED
    ) {
      showError(errorMessage)
    }

    throw error
  }
)

export default http
```

response error interceptor 收到的是 v4 统一的 `LuchRequestError`，请求管线会补齐
`error.config`，可以直接读取 `error.code`、`error.config` 与 `error.response`。业务侧的
`catch` 则仍建议使用
`isLuchRequestError()` 收窄 `unknown`，见[错误处理](/api/error)。

当 `error.response` 存在时，说明请求已取得服务端响应（常见于 HTTP 状态未通过
`validateStatus`）；示例优先使用响应体中的 `msg`、`message`，再回退到 v4 统一的
`error.message`。网络失败通常没有 `error.response`，会直接显示 `error.message`。

### 为什么业务错误码在成功分支处理

HTTP 请求成功（例如 `statusCode` 为 200）与业务成功（例如响应体 `code` 为 200）是
两件事。`validateStatus` 通过后，响应会进入 fulfilled handler；因此业务码应在上例的
第一个 handler 判断。若希望业务码失败也进入 `catch`，应在这里明确 `throw` 一个错误，
并让全项目统一采用这一约定。

### 避免 401 重复提示

示例在 401 时只清理会话并跳转登录，不额外调用 `showWarning()`。如果
`redirectToLogin()` 本身会提示登录失效，这能避免同一事件出现两次提示。项目若不在跳转
时提示，也可以在该分支单独提示一次。

## 单次请求关闭全局提示

为不需要全局提示的请求传入 `luchMeta`，不要把 UI 控制字段混进 `header`、`params` 或
请求体：

```ts
await http.get('/users', {
  luchMeta: {
    hideToast: true,
    hideErrToast: true
  }
})
```

`luchMeta` 与实例默认值按第一层浅合并。字段含义由应用自行定义，适合保持为扁平、稳定的
标签；完整合并规则见[配置与合并](./configuration#luchmeta-与-nativeoptions)。

## 取消请求不弹错误

取消是预期控制流，统一错误提示中应排除 `ERR_CANCELED`。上面的实例已经包含此判断；调用
处只需按页面或业务范围持有取消源：

```ts
import {
  createCancelSource,
  LuchRequestError
} from 'luch-request'

const source = createCancelSource()
const pending = http.get('/users', {
  signal: source.signal
})

source.cancel('页面已离开')

try {
  await pending
} catch (error) {
  if (error.code !== LuchRequestError.ERR_CANCELED) {
    throw error
  }
}
```

跨平台项目使用 `createCancelSource()`，不要假设所有 uni-app 平台都有浏览器的
`AbortController`。取消与 Task 的区别见[取消与原生 Task](/api/cancellation)。

## BigInt 大整数响应

JavaScript `number` 只能安全表示 `Number.MAX_SAFE_INTEGER`（`9007199254740991`）
以内的整数。订单号、雪花 ID 等大整数若由服务端以 JSON 数字返回，原生 JSON 解析后可能
静默丢失精度。

服务端可以调整时，优先将这类标识符按字符串返回：

```json
{
  "orderId": "9007199254740993"
}
```

标识符通常不参与数值运算，使用字符串在所有 uni-app 平台上最简单，也避免 `BigInt` 无法
直接 `JSON.stringify()` 的限制。

服务端暂时不能调整、且响应体以数字字面量返回时，单次请求应让原生层保留文本，再用支持
大整数的 parser 完全接管 `transformResponse`：

```ts
import JSONbig from 'json-bigint'

const JSONBigInt = JSONbig({
  storeAsString: true
})

const response = await http.get('/orders/9007199254740993', {
  dataType: 'text',
  transformResponse: [
    (data) => JSONBigInt.parse(data as string)
  ]
})

console.log(response.data.orderId) // '9007199254740993'
```

单次 `transformResponse` 会整体替换实例默认转换数组，不能省略 `dataType: 'text'`；否则
平台可能已先将大整数解析为 `number`，之后无法恢复精度。若业务确实需要整数运算，可在
应用层对已保留的字符串显式调用 `BigInt(value)`，并避免将含 `bigint` 的对象直接传给
`JSON.stringify()`。

## 多个服务端使用独立实例

不同服务端、鉴权规则或错误提示策略使用独立实例，不要在单个实例中通过 interceptor
反复切换 `baseURL`：

```ts
const coreApi = createLuchRequest({
  baseURL: 'https://api.example.com',
  timeout: 10_000
})

const uploadApi = createLuchRequest({
  baseURL: 'https://upload.example.com',
  timeout: 30_000
})
```

实例的默认配置和 interceptor 互不共享。上传与下载的配置边界见
[上传与下载](/api/upload-download)。

## 常见误区

| 场景 | 推荐做法 | 原因 |
| --- | --- | --- |
| 用 `custom` 传递 UI 标记 | 使用 `luchMeta` | v4 已将 v3 的 `custom` 更名为 `luchMeta`。 |
| 用 `message` 判断错误 | 判断 `error.code` | message 面向人类且可能随平台变化，错误码是稳定契约。 |
| 取消时显示网络异常 | 排除 `ERR_CANCELED` | 取消通常由页面离开或用户操作触发。 |
| 把业务 `code` 当 HTTP 状态 | 在 fulfilled handler 判断业务码 | HTTP 成功并不表示业务成功。 |
| 将 Token 写入每个请求 | 在 request interceptor 追加 `Authorization` | 能避免重复，并保证 Token 在派发前读取。 |
