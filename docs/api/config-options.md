---
title: 配置选项
description: 从公共配置到平台专有参数的完整选项参考与设计说明
---

# 配置选项

这一页按使用频率逐步展开配置。第一次接入通常只需要 `url`、`baseURL`、
`method`、`data` 和 `header`；遇到查询参数、取消、文件传输或平台差异时，再阅读
后面的进阶与特殊选项。

::: tip 先区分三个配置空间
- 顶层公共字段由 luch-request 识别、合并或透传。
- `luchOptions` 只控制 luch-request 自身行为，不发送给 `uni` API。
- `nativeOptions` 在派发前展开，用于平台专有或未来新增的原生参数。
:::

## 最小配置

```ts
const http = createLuchRequest({
  baseURL: 'https://api.example.com',
  timeout: 10_000
})

const response = await http.get<User>('/users/1')
```

`createLuchRequest()` 创建实例默认配置，单次调用再覆盖它。实例默认配置不能包含
`url` 和 `data`，因为两者描述的是一次具体请求，而不是 client 的长期行为。

| 选项 | 类型 | 默认行为 | 说明 |
| --- | --- | --- | --- |
| `url` | `string` | 无，单次调用必填 | 相对地址会与 `baseURL` 组合；绝对地址直接使用 |
| `baseURL` | `string` | `''` | 只参与生成最终 URL，不发送给原生 API |
| `method` | `string` | `request()` 为 `GET` | 快捷方法始终使用各自固定 method |
| `data` | `TData` | 不发送 | 普通 request 的请求体；其编码规则由目标平台决定 |
| `header` | `Record<string, HeaderValue>` | 库不主动添加 | 实例值和单次值按 header 名大小写不敏感合并 |
| `timeout` | `number` | 库不设置 | 单位 ms；未传时使用目标平台或项目配置的行为 |

为什么不复制一套原生默认值：luch-request 面向多个 uni-app 运行平台，各平台的
默认值与最低版本可能不同。库只补齐自身必须保证的 `method` 和
`validateStatus`，其余未传字段交给当前平台处理，避免一个跨端默认值覆盖平台的
正确行为。

## 查询参数与状态判断

| 选项 | 类型 | 默认行为 | 说明 |
| --- | --- | --- | --- |
| `params` | `TParams` | 不追加 query | 追加到最终 URL，不等同于 `data` |
| `paramsSerializer` | `(params) => string` | 使用内置 serializer | 自定义整个 `params` 的序列化结果 |
| `validateStatus` | `(status) => boolean` | 接受 200–299 | 返回 `false` 时以 `LuchRequestError.ERR_BAD_STATUS` reject |
| `transformResponse` | `readonly ResponseTransformer[]` | 内置 JSON transformer | 按数组顺序同步转换 `response.data` |

内置 serializer 会忽略 `undefined`，把数组展开为 `key[]=value`，把 `Date`
转换为 ISO 字符串，把普通对象转换为 JSON 字符串。`null` 不产生键值；URL 中已有
query 时继续追加，fragment 会被移除。

```ts
await http.get<User[]>('/users', {
  params: { ids: [1, 2], keyword: 'Ada' },
  paramsSerializer: (params) => (
    `ids=${params.ids.join(',')}&keyword=${encodeURIComponent(params.keyword)}`
  ),
  validateStatus: (status) => status >= 200 && status < 400
})
```

`params` 不与实例默认值做对象合并。它通常是一个完整的业务输入，深合并可能把
其他接口的分页、租户或筛选条件带入当前请求。自定义 serializer 接管全部编码，
库只移除开头多余的 `?`，因此动态文本仍应由调用方正确编码。

## `transformResponse` {#transform-response}

`transformResponse` 是同步的响应数据管线。实例默认数组包含内置 JSON
transformer，多个 transformer 按数组顺序执行，后一个接收前一个的返回值。

```ts
import type {
  ResponseTransformContext,
  ResponseTransformer
} from 'luch-request'

const transformer: ResponseTransformer = (data, context) => {
  const transformContext: ResponseTransformContext = context
  console.log(transformContext.statusCode)
  return data
}
```

`context` 提供以下只读信息：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `operation` | `LuchOperation` | 当前是 request、upload 或 download |
| `config` | `Readonly<ResolvedRequestConfig>` | interceptor 完成后的最终请求配置 |
| `statusCode` | `number \| undefined` | 平台返回并完成归一化的状态码 |
| `statusAccepted` | `boolean` | 当前状态是否通过 `validateStatus` |
| `header` | `Readonly<RequestHeaders> \| undefined` | 平台返回的响应头 |

### 在默认转换后追加处理

需要保留内置 JSON transformer，并在它之后继续处理时，应显式展开实例默认值：

```ts
import camelcaseKeys from 'camelcase-keys'
import { createLuchRequest } from 'luch-request'

const http = createLuchRequest()

http.defaults.transformResponse = [
  ...http.defaults.transformResponse,
  (data) => camelcaseKeys(data as Record<string, unknown>, {
    deep: true
  })
]
```

`http.defaults.transformResponse` 始终是数组，因此不需要额外判断或导入内部默认
transformer。luch-request 不单独导出 `defaultTransformResponse`。

### 单次请求完全接管解析

单次请求传入 `transformResponse` 时会整体替换实例数组。这适合接管解析，例如使用
支持大整数的 JSON parser：

```ts
import JSONbig from 'json-bigint'

await http.get('/api', {
  dataType: 'text',
  transformResponse: [
    (data) => JSONbig.parse(data as string)
  ]
})
```

这里必须让原生 request 返回文本，否则平台可能已经使用原生 JSON parser 转换
数据，大整数精度会在自定义 transformer 执行前丢失。XML、CSV 或其他格式是否以
字符串进入管线，同样取决于目标平台和原生 `dataType`；库不预设输入类型。

### 合并、同步和错误规则

- 修改实例默认值时，可通过展开数组保留内置 JSON transformer。
- 单次配置整体替换实例数组，不自动拼接。
- transformer 必须同步返回；返回 Promise 会以
  `LuchRequestError.ERR_BAD_RESPONSE` reject。
- `response.data` 保存最终转换结果，`response.raw` 始终保留平台原始响应。

状态码未通过 `validateStatus` 时仍执行转换，使 `error.response.data` 与成功响应
采用相同数据契约。若转换成功，保留 `ERR_BAD_STATUS`；若转换失败，转换错误
`ERR_BAD_RESPONSE` 优先。

## 业务上下文与取消

| 选项 | 类型 | 发送给原生 API | 说明 |
| --- | --- | --- | --- |
| `luchMeta` | `LuchMeta` | 否 | 供 interceptor 和业务读取的元数据 |
| `signal` | `AbortSignalLike` | 否 | 在 service 层之间传播取消 |
| `onTask` | `(nativeTask, control) => void` | 否 | Task 创建后监听平台事件，并可通过 `control.abort()` 统一取消 |

```ts
const source = createCancelSource()

const pending = http.get<User>('/users/1', {
  signal: source.signal,
  onTask(nativeTask, control) {
    nativeTask.onHeadersReceived?.((result) => {
      console.log('响应头', result)
    })

    // 需要取消当前调用时使用：
    // control.abort('用户取消')
  },
  luchMeta: {
    requiresAuth: true,
    traceName: 'user-detail'
  }
})

source.cancel('页面已离开')
```

`luchMeta` 第一层浅合并，适合稳定、扁平的请求标签；它不进入网络层，避免把业务
控制信息误发给服务端。`signal` 采用结构类型而不强制 `AbortSignal`，是因为
`AbortController` 只存在于 H5 的浏览器原生 JavaScript/Web API 中；App、小程序、
HarmonyOS 等其他平台没有这个对象，必须使用 `createCancelSource()`。取消细节见
[取消与原生 Task](/api/cancellation#跨-service-层传递取消)。

`onTask` 只允许写在单次 request、upload 或 download 配置中，不属于实例
`defaults`。request interceptor 完成且原生 API 返回 Task 后，库主动调用一次
`onTask(nativeTask, control)`；Task 创建前取消或失败时不调用。listener 异常会被
隔离，整个回调也不会传给 `uni.request`、`uni.uploadFile` 或
`uni.downloadFile`。完整用法见[取消与原生 Task](/api/cancellation#config-on-task)。

## 普通 request 原生选项

下面的字段位于配置顶层，并按原名传给 `uni.request`。luch-request 只保证透传，
不会模拟目标平台缺少的能力。平台范围和最低版本应以
[uni.request 官方兼容表](https://uniapp.dcloud.net.cn/api/request/request.html) 为准。

### 数据与响应格式

| 选项 | 类型 | 原生含义 | 注意事项 |
| --- | --- | --- | --- |
| `dataType` | `string` | 指定原生响应数据解析方式 | 普通 request 不在原生处理后再次 `JSON.parse` |
| `responseType` | `string` | 指定响应类型，如 `text`、`arraybuffer` | 合法值和支持平台由原生 API 决定 |
| `withCredentials` | `boolean` | 跨域时是否携带凭证 | 主要是 H5 能力，仍受 CORS 与 cookie 规则约束 |

`dataType` 保留在原生层，是为了沿用各平台已经提供的解析能力；
`luchOptions.jsonParsing` 则解决 upload 固定返回字符串这一类库层问题，两者不应
混为一谈。

### 连接、安全与网络策略

| 选项 | 类型 | 原生含义 | 官方文档中的主要平台边界 |
| --- | --- | --- | --- |
| `sslVerify` | `boolean` | 是否校验 SSL 证书 | App Android 专有且离线打包不支持；不建议关闭 |
| `firstIpv4` | `boolean` | DNS 解析优先 IPv4 | App Android 专有 |
| `enableHttp2` | `boolean` | 启用 HTTP/2 | 微信小程序 |
| `enableQuic` | `boolean` | 启用 QUIC | 微信小程序 |
| `enableHttpDNS` | `boolean` | 启用 HttpDNS | 微信小程序；通常与 `httpDNSServiceId` 配套 |
| `httpDNSServiceId` | `string` | HttpDNS 服务商 ID | 微信小程序 |
| `enableChunked` | `boolean` | 启用 chunked 传输 | 微信小程序 |
| `forceCellularNetwork` | `boolean` | Wi-Fi 下改用蜂窝网络 | 微信小程序 |

这些选项保持原生名称，不增加跨平台别名。原因是相同名称在不同平台未必有相同
语义，统一成看似通用的抽象反而会隐藏兼容性风险。

### 缓存与平台行为

| 选项 | 类型 | 原生含义 | 官方文档中的主要平台边界 |
| --- | --- | --- | --- |
| `enableCache` | `boolean` | 启用原生 request cache | 微信、抖音小程序等特定版本 |
| `enableCookie` | `boolean` | 允许编辑 cookie header | 支付宝小程序特定版本 |
| `cloudCache` | `object \| boolean` | 启用云加速 | 百度小程序特定版本 |
| `defer` | `boolean` | 延后到首屏渲染后发送 | 百度小程序特定版本 |

这些能力不是 luch-request 的缓存、调度或 cookie 管理功能。库仅把值交给原生
API；是否生效、默认值以及副作用均由运行平台决定。

## upload 与 download 选项

文件操作复用 `url`、`baseURL`、`header`、`params`、`timeout` 等公共选项，但
使用独立的原生配置类型。

### upload

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `filePath` | `string` | 单文件本地资源路径 |
| `name` | `string` | 单文件对应的 multipart 字段名 |
| `files` | `readonly { name?: string; uri: string }[]` | 多文件列表 |
| `formData` | `Record<string, unknown>` | 一同提交的其他表单字段 |

`filePath` 与 `files` 的组合要求以及多文件支持范围由平台决定。官方文档指出，
`files` 与 `filePath` 二选一，并且多文件并非所有平台支持，详见
[uni.uploadFile 官方文档](https://uniapp.dcloud.net.cn/api/request/network-file.html)。

upload 未显式设置 `Content-Type` 时不会继承实例默认的该 header，让原生 API
生成正确的 multipart boundary。手工复用 JSON `Content-Type` 会使 header 与
实际请求体不一致，这是文件操作需要单独处理的原因。

### download

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `filePath` | `string` | 指定下载路径；不传时通常由平台返回临时路径 |

不同平台可能返回 `tempFilePath`、`apFilePath`、`filePath` 或 `fileContent`，因此
响应类型保留这些可选字段，而不伪造一个所有平台都存在的路径。

## `luchOptions`：库行为选项

`luchOptions` 的设计目的，是为 **luch-request 自身消费的行为配置** 提供独立
命名空间。它解决三个问题：

- 避免库功能与 `uni.request`、`uni.uploadFile`、`uni.downloadFile` 的原生字段
  重名。
- 明确这些配置只影响请求管线、响应转换或错误分类，绝不会发送给原生 API。
- 允许每项库功能定义自己的校验和合并规则，而不把越来越多的行为开关堆到配置
  顶层。

例如 `jsonParsing` 控制内置 JSON transformer，
`isNativeAbortError` 控制平台 fail payload 的错误分类；它们都不是 uni API 参数。
如果一个选项描述的是“luch-request 应该如何处理请求或响应”，应放入
`luchOptions`，而不是 `nativeOptions`。

::: info `luchOptions` 不会透传
整个 `luchOptions` 对象都会在原生派发前移除。即使字段名恰好与某个平台参数
相同，也不会到达 `uni` API。
:::

### `jsonParsing`

`jsonParsing` 不是独立的第二条解析管线，它只配置实例默认
`transformResponse` 数组中的内置 JSON transformer。单次请求整体替换
`transformResponse` 后，内置解析自然不会执行。

```ts
import {
  createLuchRequest,
  isLuchRequestError,
  JSONParsingMode,
  LuchOperation,
  LuchRequestError
} from 'luch-request'

const http = createLuchRequest({
  luchOptions: {
    jsonParsing: {
      include: [
        LuchOperation.UPLOAD,
        LuchOperation.REQUEST
      ],
      mode: JSONParsingMode.AUTO
    }
  }
})
```

| 子选项 | 类型 | 默认行为 | 说明 |
| --- | --- | --- | --- |
| `include` | `readonly LuchOperation[]` | `[LuchOperation.UPLOAD]` | 对哪些 operation 的字符串 `data` 执行解析 |
| `mode` | `JSONParsingMode` | `JSONParsingMode.AUTO` | JSON 解析失败时保留字符串或抛出错误 |
| 整体设为 `false` | `false` | — | 明确关闭库层 JSON 解析 |

默认只处理 upload，因为 `uni.uploadFile` 的响应 `data` 固定为字符串；普通
request 已有 `dataType`，download 也没有稳定的字符串 `data` 契约。默认采用
`JSONParsingMode.AUTO` 是为了兼容空响应、纯文本和返回格式不稳定的历史接口；
只有服务端契约明确要求 JSON 时才建议使用 `JSONParsingMode.STRICT`。

`include` 应使用 [LuchOperation](/api/interceptors#luch-operation) 常量，`mode` 应
使用 `JSONParsingMode` 常量。对应的运行时值为：

```ts
JSONParsingMode.AUTO   // 'auto'
JSONParsingMode.STRICT // 'strict'
```

不同配置的结果如下：

| 配置 | `data` 是有效 JSON 字符串 | `data` 是无效 JSON 字符串 |
| --- | --- | --- |
| `JSONParsingMode.AUTO` | 解析为对应 JSON 值并 resolve | 保留原字符串并 resolve |
| `JSONParsingMode.STRICT` | 解析为对应 JSON 值并 resolve | 以 `LuchRequestError.ERR_BAD_RESPONSE` reject |
| `jsonParsing: false` | 不解析，保留原字符串 | 不解析，保留原字符串 |
| operation 不在 `include` | 不解析，保留原字符串 | 不解析，保留原字符串 |

`JSONParsingMode.STRICT` 解析失败时，`error.response.data` 和 `error.raw.data` 都
保留平台返回的原字符串，便于检查和记录原始响应：

```ts
try {
  await http.upload({
    url: '/upload',
    filePath,
    name: 'file',
    luchOptions: {
      jsonParsing: {
        include: [LuchOperation.UPLOAD],
        mode: JSONParsingMode.STRICT
      }
    }
  })
} catch (error) {
  if (
    isLuchRequestError(error) &&
    error.code === LuchRequestError.ERR_BAD_RESPONSE
  ) {
    console.log(error.response)
    console.log(error.raw)
  }
}
```

`response.data` 只在当前 operation 位于 `include` 且原值是字符串时尝试解析；
`response.raw.data` 始终保留平台返回的原始值。

### `isNativeAbortError`

| 类型 | 默认值 | 用途 |
| --- | --- | --- |
| `NativeAbortErrorDetector` | 内置原生 abort 错误识别器 | 判断 uni API 的 fail payload 是否由原生 `Task.abort()` 产生 |

默认识别器只匹配明确的常见 abort 形态，行为等价于：

```ts
function defaultIsNativeAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  if ('name' in error && error.name === 'AbortError') {
    return true
  }

  const message = 'errMsg' in error && typeof error.errMsg === 'string'
    ? error.errMsg
    : 'message' in error && typeof error.message === 'string'
      ? error.message
      : undefined

  return typeof message === 'string' &&
    /(?:^|:)fail(?:ed)?\s+abort(?:ed)?$/i.test(message.trim())
}
```

它可以识别 `AbortError`、`request:fail abort`、`uploadFile:fail aborted` 等明确
标记，但不会把超时、断网或普通服务端失败猜成取消。

::: warning 这是直接调用原生 abort 的兜底，不是推荐入口
业务应调用 listener 第二个参数的 `control.abort(reason)`、
`pending.abort(reason)` 或 signal 取消，不要调用从 `pending.task` 或 `onTask()`
取得的 `nativeTask.abort()`。这些公共入口由内部控制器直接记录，不依赖
`isNativeAbortError`。

这个 detector 的存在，是为了兜底兼容用户绕过公共 API、直接执行
`nativeTask.abort()` 后，平台通过 fail callback 返回 abort 错误的场景。此时库
没有提前记录取消状态，只能检查平台错误并尝试恢复为统一取消语义。
:::

目标平台返回不同的 abort payload 时，可以完全替换默认识别器：

```ts
import {
  createLuchRequest,
  LuchOperation
} from 'luch-request'

const http = createLuchRequest({
  luchOptions: {
    isNativeAbortError(error, context) {
      return context.operation === LuchOperation.REQUEST &&
        typeof error === 'object' &&
        error !== null &&
        'errMsg' in error &&
        String(error.errMsg).includes('用户取消')
    }
  }
})
```

自定义函数会完全覆盖内置 detector，不会在返回 `false` 后继续执行默认识别。
`context` 提供当前 `operation`、最终 `config` 和已创建的原生 `task`，可用于适配
特定平台。

如果已经调用 `nativeTask.abort()`，但自定义 detector 返回 `false`：

```ts
import {
  createLuchRequest,
  isLuchRequestError,
  LuchRequestError
} from 'luch-request'

const http = createLuchRequest({
  luchOptions: {
    isNativeAbortError: () => false
  }
})

const pending = http.get('/users')

pending.onTask((nativeTask) => {
  // 仅演示 detector 的兜底场景，业务代码不要直接调用。
  nativeTask.abort?.()
})

try {
  await pending
} catch (error) {
  if (isLuchRequestError(error)) {
    console.log(error.code)       // 等于 LuchRequestError.ERR_NETWORK
    console.log(error.cancelMode) // undefined
    console.log(error.cause)      // 平台原始 fail payload
    console.log(error.raw)        // 平台原始 fail payload
  }
}
```

实际原生 Task 可能已经被平台中止；返回 `false` 不会撤销这次 abort，只会让
luch-request 把 fail payload 按普通网络失败处理：错误码是
`LuchRequestError.ERR_NETWORK`，`cancelMode` 为 `undefined`，而不是
`LuchRequestError.ERR_CANCELED` 和 `CancellationMode.NATIVE`。detector 自身抛错
时也采用相同的网络错误降级，并保留原始平台错误。

| 取消入口或识别结果 | 最终错误码 | `cancelMode` |
| --- | --- | --- |
| `control.abort()`、`pending.abort()` 或 signal 取消 | `LuchRequestError.ERR_CANCELED` | 实际采用的 `CancellationMode` |
| 直接调用 `nativeTask.abort()`，detector 返回 `true` | `LuchRequestError.ERR_CANCELED` | `CancellationMode.NATIVE` |
| 直接调用 `nativeTask.abort()`，detector 返回 `false` 或抛错 | `LuchRequestError.ERR_NETWORK` | `undefined` |

不同平台的 fail payload 和取消文案并不统一，所以库只提供可替换的分类边界，
不会维护一份无法穷尽的平台字符串列表。detector 只负责错误分类，不会主动调用
`task.abort()`。

## `nativeOptions`：特殊原生选项

`nativeOptions` 的设计目的是提供一个明确的 **原生参数逃生窗口**。luch-request
只把已经核对并建模的公共原生字段开放在配置顶层，但 uni-app 生态和各平台基础库
会持续演进，可能出现以下时间差：

- 某个平台基础库已经新增参数，但 luch-request 当前版本尚未建模。
- 新参数已经可以在目标运行时使用，但 uni-app 官方文档尚未收录或说明不完整。
- uni-app、编辑器或第三方插件的 TypeScript 类型声明尚未支持该参数。
- 项目使用了厂商扩展、私有运行时或条件编译后的专有参数。

如果已经通过目标平台资料、运行时版本或真机验证确认底层 `uni.*` API 接受该
参数，可以先通过 `nativeOptions` 透传，无需等待 luch-request 或类型插件升级：

```ts
await http.request({
  url: '/users',
  nativeOptions: {
    // 示例：目标运行时已支持，但当前公共类型尚未建模。
    futurePlatformOption: true
  }
})
```

派发时这个对象会展开，底层收到的是：

```ts
uni.request({
  url: '/users',
  futurePlatformOption: true
})
```

把未知参数收敛到独立对象，而不是允许任意顶层字段，可以让调用方明确表达“这里
正在使用未经 luch-request 建模的原生能力”，同时防止 JavaScript 拼写错误或业务
字段被意外发送给平台。

::: warning 逃生窗口只负责透传，不提供能力
`nativeOptions` 可以绕过 luch-request 的顶层字段白名单和 TypeScript 建模限制，
但不能让底层运行时凭空支持一个参数。如果当前 uni-app 版本、目标平台基础库或
原生 bridge 没有实现该能力，参数仍可能被忽略、报错或产生平台差异。上线前必须
在实际目标平台和最低支持版本验证。
:::

配置位置可以按下表选择：

| 需求 | 应使用的位置 |
| --- | --- |
| 控制 luch-request 的解析、取消识别等行为 | `luchOptions` |
| 使用 luch-request 已建模的原生参数 | 配置顶层 |
| 使用较新、平台专有或类型插件尚未覆盖的原生参数 | `nativeOptions` |
| 保存只供业务和 interceptor 读取的信息 | `luchMeta` |

### 顶层原生字段白名单

配置合并和原生派发是两个不同阶段。`mergeConfig` 会保留安全的自有可枚举属性，
让 request interceptor 仍能读取调用方配置；真正调用 `uni` API 前，库会按当前
operation 的运行时白名单重新构造原生参数。因此 JavaScript 调用方即使绕过了
TypeScript，未知顶层字段也不会传给原生 API。

| operation | 可以直接写在顶层并传给原生 API 的 key |
| --- | --- |
| 三类 operation 公共 | `url`、`header`、`timeout` |
| request | `data`、`method`、`dataType`、`responseType`、`sslVerify`、`withCredentials`、`firstIpv4`、`enableHttp2`、`enableQuic`、`enableCache`、`enableHttpDNS`、`httpDNSServiceId`、`enableChunked`、`forceCellularNetwork`、`enableCookie`、`cloudCache`、`defer` |
| upload | `filePath`、`name`、`files`、`formData` |
| download | `filePath` |

这里的白名单只描述最终传给原生 API 的顶层参数。`baseURL`、`params`、
`paramsSerializer`、`luchMeta`、`validateStatus`、`signal`、`luchOptions` 等顶层
配置仍然可以正常使用，但由 luch-request 自己消费，不会原样发送给 `uni` API。

例如下面的 JavaScript 配置可以进入合并结果和 request interceptor，但
`unknownTopLevel` 会在派发边界被过滤：

```js
await http.request({
  url: '/users',
  method: 'GET',
  unknownTopLevel: true
})
```

需要传递白名单之外的平台字段时，必须显式放入 `nativeOptions`：

```js
await http.request({
  url: '/users',
  nativeOptions: {
    futurePlatformOption: true
  }
})
```

::: warning 不会静默变成原生参数
未知顶层字段不会因为使用 JavaScript 就绕过运行时白名单。它只会在 interceptor
阶段暂时可见，最终不会到达 `uni.request`、`uni.uploadFile` 或
`uni.downloadFile`。
:::

当目标平台新增参数、参数只属于某个平台，或者原生字段名与 luch-request 配置
重名时，将它放入 `nativeOptions`：

```ts
await http.get<User, object, {
  enableProfile?: boolean
}>('/users/1', {
  nativeOptions: {
    enableProfile: true
  }
})
```

派发前 `nativeOptions` 会展开到原生配置顶层。它使用浅合并，是因为库不知道未知
平台对象内部各字段的语义；递归合并可能制造一个平台从未接受过的组合。

以下边界是刻意设计的：

- `url`、`fullURL`、`success`、`fail`、`complete` 不能被覆盖。URL 必须来自统一
  解析，callbacks 必须由 adapter 接管，才能保证 Promise、错误和 Task 契约。
- 已知属于其他 operation 的字段会被过滤，例如 upload 的 `filePath` 不会进入
  普通 request。
- request 实例级 `nativeOptions` 不继承到 upload/download。文件平台扩展必须在
  本次文件调用中声明，避免普通请求的专有开关污染另一类原生 API。
- 透传只表示 luch-request 不丢弃字段，不表示目标平台支持它。上线前仍需在目标
  真机或模拟器验证。

复用扩展字段时，可通过 module augmentation 获得项目级类型提示，详见
[TypeScript 设计](/guide/typescript#平台新增参数)。

## 合并速查

| 字段 | 实例默认值与单次值的关系 |
| --- | --- |
| `header` | 大小写不敏感合并；单次 `null/undefined` 删除继承值 |
| `luchMeta` | 第一层浅合并 |
| `luchOptions` | 按功能键递归合并；数组由单次值整体替换 |
| `nativeOptions` | 第一层浅合并，并在派发前经过保护字段过滤 |
| `onTask` | 只允许单次配置，不进入实例 defaults 或原生参数 |
| `params`、`data`、`signal` 等 | 单次值整体覆盖 |

完整的复制规则、header 删除语义和文件继承边界见
[配置与合并](/guide/configuration)。
