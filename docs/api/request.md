---
title: 请求与响应
description: request、HTTP 快捷方法、查询参数和响应结构
---

# 请求与响应

## `createLuchRequest()` {#create-luch-request}

```ts
function createLuchRequest<TNativeOptions extends object = {}>(
  defaults?: RequestDefaults<TNativeOptions>
): LuchRequestInstance<TNativeOptions>
```

`createLuchRequest()` 是创建请求实例的公共工厂。每次调用都会返回相互独立的
实例，`defaults` 和 interceptor 不会在实例之间共享；内部实现类不从包入口导出。

```ts
import { createLuchRequest } from 'luch-request'

const http = createLuchRequest({
  baseURL: 'https://api.example.com',
  timeout: 10_000
})
```

返回实例公开以下成员：

| 成员 | 说明 |
| --- | --- |
| `defaults` | 当前实例默认配置；可以修改其中字段，使后续请求使用新值 |
| `interceptors.request` | request interceptor 管理器 |
| `interceptors.response` | response interceptor 管理器 |
| `request()` | 使用完整配置发起普通请求 |
| `get()`、`delete()`、`head()`、`options()` | 无请求体的 HTTP 快捷方法 |
| `post()`、`put()`、`patch()` | 带请求体的 HTTP 快捷方法 |
| `upload()` | 调用 `uni.uploadFile` |
| `download()` | 调用 `uni.downloadFile` |

公共 TypeScript API 将 `defaults` 属性声明为 `readonly`，应修改其中字段，不要
替换整个配置对象：

```ts
http.defaults.baseURL = 'https://next-api.example.com'
```

修改只影响之后开始合并配置的请求，不会追溯改变已经派发的请求。完整默认配置
字段与合并策略见[配置与合并](/guide/configuration)。

## 完整 request

```ts
interface LoginResponse {
  token: string
  userId: number
}

interface LoginBody {
  username: string
  password: string
}

interface LoginParams {
  source: string
}

const response = await http.request<
  LoginResponse,
  LoginBody,
  LoginParams
>({
  url: '/user/login',
  method: 'POST',
  data: {
    username: 'demo',
    password: 'secret'
  },
  params: {
    source: 'uni-app'
  }
})
```

泛型依次表示响应数据、请求体、查询参数和本次 `nativeOptions`。

## HTTP 快捷方法

```ts
http.get<TResponse, TParams, TNativeOptions>(url, config)
http.delete<TResponse, TParams, TNativeOptions>(url, config)
http.head<TResponse, TParams, TNativeOptions>(url, config)
http.options<TResponse, TParams, TNativeOptions>(url, config)

http.post<TResponse, TData, TParams, TNativeOptions>(url, data, config)
http.put<TResponse, TData, TParams, TNativeOptions>(url, data, config)
http.patch<TResponse, TData, TParams, TNativeOptions>(url, data, config)
```

快捷方法会覆盖实例默认 method。普通 request 的 method 在 request interceptor
前归一化为大写有效值。

## 常用配置

下面只列出完成普通请求最常用的字段。全部原生选项、`luchOptions`、
`nativeOptions` 及其设计边界见 [配置选项](/api/config-options)。

| 字段 | 说明 |
| --- | --- |
| `url` | 请求逻辑地址，必填 |
| `baseURL` | 相对 URL 的基础地址；绝对 URL 不与它组合 |
| `method` | 普通请求 method |
| `data` | 请求体 |
| `header` | 请求头 |
| `params` | 追加到 URL 的查询参数 |
| `paramsSerializer` | 自定义 params 序列化 |
| `luchMeta` | 业务元数据，不发送给 uni API |
| `validateStatus` | 判断状态码是否成功，默认接受 2xx |
| `transformResponse` | 按顺序同步转换响应 data；单次数组整体替换实例数组 |
| `signal` | 结构化取消信号 |
| `onTask` | 原生 Task 创建后调用的单次监听器，第二个参数提供统一取消能力 |
| `timeout` | 超时时间，实际能力由平台决定 |
| `nativeOptions` | 平台专有或未来新增的原生参数 |

`success`、`fail`、`complete` 被内部 callback adapter 保留，不能覆盖。
`fullURL` 由库生成，也不能作为请求配置传入。

`onTask(nativeTask, control)` 只属于单次配置，不允许写入
`createLuchRequest()` 的实例默认值，也不会发送给原生 API。普通 request 的
`nativeTask` 推导为 `RequestTask`；监听响应头或取消当前调用的示例见
[取消与原生 Task](/api/cancellation#config-on-task)。

这些字段分成库配置和原生配置，是为了让跨平台行为与平台专有能力保持清晰边界：
库配置可以给出稳定契约，原生配置则必须服从目标平台的兼容表。

## 查询参数序列化

内置序列化规则：

- 忽略 `undefined`
- 数组转为 `key[]=value1&key[]=value2`
- `Date` 转为 ISO 字符串
- 对象使用 `JSON.stringify`
- URL 已有 query 时继续追加，fragment 不带入请求

需要其他格式时传入 serializer：

```ts
interface UserIdsParams {
  ids: number[]
}

await http.get<unknown, UserIdsParams>('/users', {
  params: {
    ids: [1, 2, 3]
  },
  paramsSerializer: (params) => `ids=${params.ids.join(',')}`
})
```

## 响应结构

```ts
const response = await http.get<User>('/users/1')

response.data
response.statusCode
response.header
response.config
response.task
response.raw
```

- `data`：调用泛型指定的响应数据
- `statusCode`：归一化后的数字状态码
- `config.url`：request interceptor 最终返回的逻辑地址
- `config.fullURL`：包含 `baseURL` 与 `params` 的实际请求地址
- `task`：平台提供时对应原生 Task
- `raw`：完整原始平台响应
- 平台新增响应字段：保留在响应顶层

默认只有 2xx resolve。需要接受重定向状态时：

```ts
const http = createLuchRequest({
  validateStatus: (status) => status >= 200 && status < 400
})
```

## `transformResponse`

`transformResponse` 用于同步转换平台返回的 `response.data`。例如，在保留内置
JSON transformer 的基础上统一转换业务字段：

```ts
import camelcaseKeys from 'camelcase-keys'

http.defaults.transformResponse = [
  ...http.defaults.transformResponse,
  (data) => camelcaseKeys(data as Record<string, unknown>, {
    deep: true
  })
]
```

单次请求传入数组会整体替换实例默认数组，可用于 `json-bigint` 等自定义 parser：

```ts
import JSONbig from 'json-bigint'

const response = await http.get('/orders/1', {
  dataType: 'text',
  transformResponse: [
    (data) => JSONbig.parse(data as string)
  ]
})
```

完整的 context 字段、合并规则、状态错误优先级和 XML/CSV 输入边界见
[配置选项：transformResponse](/api/config-options#transform-response)。

## JSON 响应解析

普通 request 和 download 不额外执行 `JSON.parse`。由于 `uni.uploadFile` 固定
返回字符串 `data`，upload 默认使用 `JSONParsingMode.AUTO` 尝试解析：成功时返回
对应 JSON 值，失败时保留原字符串。

```ts
import { JSONParsingMode } from 'luch-request'

await http.upload({
  url: '/upload',
  filePath,
  name: 'file',
  luchOptions: {
    jsonParsing: {
      mode: JSONParsingMode.STRICT
    }
  }
})
```

`JSONParsingMode.STRICT` 解析失败时抛出
`LuchRequestError.ERR_BAD_RESPONSE`；设置 `jsonParsing: false` 可关闭。解析只改变
`response.data`，`response.raw.data` 始终保留原始字符串。两种 mode 的完整区别见
[配置选项：jsonParsing](/api/config-options#jsonparsing)。
