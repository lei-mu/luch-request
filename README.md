# luch-request v4

`luch-request v4` 是面向传统 uni-app 的 TypeScript-first 请求库。

当前版本为 `4.0.0` 正式版。

## 当前能力

- `request`、常用 HTTP 方法、`upload`、`download`
- 实例默认配置与单次请求配置
- request/response interceptor
- 统一的 `LuchRequestError`
- Promise 上的 `abort()`、`task` 和 `onTask()`
- 通过 `signal` 传播取消，并提供跨平台 `createCancelSource()`
- `nativeOptions` 动态透传平台新增参数，未知响应字段保留

## 安装

```sh
npm install luch-request
```

v4 只提供 ESM：

```ts
import {
  CancellationMode,
  createCancelSource,
  createLuchRequest,
  isLuchRequestError,
  LuchRequestError
} from 'luch-request'
```

构建产物使用 ES2017 语法，不提供 CommonJS、UMD、ES5 legacy bundle 或
运行时 polyfill。正式版本支持传统 uni-app，App iOS 的正式支持
下限为 iOS 13；不支持 uni-app x / UTS。完整范围和验证要求见
[`COMPATIBILITY.md`](./COMPATIBILITY.md)。

## 快速开始

```ts
import {
  CancellationMode,
  createCancelSource,
  createLuchRequest,
  isLuchRequestError,
  LuchRequestError
} from 'luch-request'

const http = createLuchRequest({
  baseURL: 'https://api.example.com',
  timeout: 10_000
})

try {
  const response = await http.get<{ id: number }>('/users/1')
  console.log(response.data.id)
} catch (error) {
  if (isLuchRequestError(error)) {
    console.log(error.code, error.raw, error.cancelMode)

    if (error.code === LuchRequestError.ERR_CANCELED) {
      console.log('请求已取消')
    }
  }
}
```

## 创建实例

使用 `createLuchRequest(defaults)` 创建独立实例。不同实例的默认配置和
interceptor 不共享：

```ts
const http = createLuchRequest({
  baseURL: 'https://api.example.com',
  method: 'POST',
  timeout: 10_000,
  header: {
    Accept: 'application/json'
  },
  validateStatus: (status) => status >= 200 && status < 300
})
```

### 内置默认行为

`createLuchRequest()` 不传配置时，luch-request 使用以下默认行为：

| 配置 | 用户未传时的行为 |
| --- | --- |
| `baseURL` | 按空字符串处理，直接使用请求的 `url` |
| `method` | `request()` 使用实例默认 method，未配置时为 `GET`；快捷方法使用各自固定 method |
| `header` | 不主动添加请求头 |
| `params` | 不追加查询参数 |
| `paramsSerializer` | 使用内置序列化规则，详见“查询参数” |
| `validateStatus` | 只接受 `200` 至 `299` |
| `luchOptions.jsonParsing` | 对 upload 使用 `auto` 解析；其他 operation 不解析 |
| `luchOptions.isNativeAbortError` | 使用内置窄规则尽力识别原生 Task 的 abort 失败 |
| `signal` | 不监听取消信号 |
| `luchMeta`、`nativeOptions` | 不设置 |
| `timeout` 及其他 uni 原生配置 | 不设置，由目标平台采用自身默认值 |

`method` 和 `validateStatus` 会在 request interceptor 前补齐。普通 request
的 `config.method` 是大写有效值；upload 和 download 没有 method，但同样
包含实际使用的 `validateStatus`。其他默认行为不会全部写入 config，例如用户
未传 `baseURL` 时仍为 `undefined`，只在生成 `fullURL` 时按空字符串处理。
JSON 解析的 `mode` 未传时按 `auto` 处理，`include` 未传时只匹配 upload。

### 配置合并策略

配置优先级固定为“内置行为默认值 → 实例默认配置 → 单次请求配置”，即同一
配置项由靠后的有效值覆盖。不同配置项按以下策略处理：

| 配置 | 合并策略 |
| --- | --- |
| `header` | 按大小写不敏感的 header 名合并；单次值覆盖实例值，`null/undefined` 删除继承值 |
| `luchMeta` | 第一层浅合并；同名嵌套值由单次请求整体替换 |
| `luchOptions` | 按库功能定义策略；`jsonParsing` 对象按字段合并，`isNativeAbortError` 单次函数整体替换实例函数 |
| `nativeOptions` | request 实例默认值与单次 request 第一层浅合并；upload/download 只使用各自单次配置 |
| `method` | 只作为普通 request 的默认值；单次 request 或快捷方法覆盖实例值，upload/download 不继承 |
| `baseURL`、`params`、`paramsSerializer`、`validateStatus`、`signal`、`timeout` | 单次请求整体覆盖实例值 |
| `data`、`formData`、`files` 及其他已声明原生字段 | 单次请求整体覆盖，不与实例值递归合并；采用的普通结构会生成请求私有副本 |
| 普通对象和数组 | 递归复制普通对象及数组中的普通结构，防止 interceptor 污染 defaults、调用方输入或其他请求 |
| `signal`、函数、`Date`、`ArrayBuffer`、类实例和平台对象 | 保留引用身份，不尝试通用克隆 |

例如：

```ts
const http = createLuchRequest({
  params: {
    language: 'zh',
    pageSize: 20
  },
  luchMeta: {
    source: 'app',
    auth: {
      required: true,
      role: 'user'
    }
  },
  nativeOptions: {
    platformOption: {
      cache: true
    }
  }
})

await http.get('/users', {
  params: {
    page: 2
  },
  luchMeta: {
    auth: {
      role: 'admin'
    }
  },
  nativeOptions: {
    platformOption: {
      trace: true
    }
  }
})
```

合并后：

- `params` 是 `{ page: 2 }`，不会与实例 `params` 合并。
- `luchMeta` 保留第一层的 `source`，但 `auth` 整体替换为
  `{ role: 'admin' }`。
- `nativeOptions.platformOption` 整体替换为 `{ trace: true }`。

`header` 还有一项 upload 特例：本次 upload 未显式设置 `Content-Type` 时，
不会继承实例默认值中的该请求头，让平台生成 multipart 类型及 boundary；
其他默认 header 正常继承。

局部 header 使用 `null` 或 `undefined` 可以删除实例继承值；空值会在派发前
再次过滤，不传给底层 uni API：

```ts
await http.get('/users', {
  header: {
    Authorization: undefined
  }
})
```

`luchOptions.jsonParsing` 对象按字段合并，其中 `include` 数组整体替换；
单次请求设置为 `false` 时明确关闭解析。

合并过程不会写入传入的默认配置或单次请求配置。普通对象和数组会生成实例或
请求私有的结构副本，因此 request interceptor 原地修改普通嵌套配置时，不会
污染其他实例、实例 defaults、调用方输入或其他并发请求。该行为不是对所有值
执行通用深克隆：`signal`、函数、`Date`、`ArrayBuffer`、class 实例和平台对象
仍保留引用身份，interceptor 不应修改这些不透明对象的内部状态。

## 请求 API

### 完整配置

```ts
interface User {
  id: number
  name: string
}

interface LoginBody {
  username: string
  password: string
}

interface LoginParams {
  source: string
}

const response = await http.request<
  User,
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

`request<TResponse, TData, TParams, TNativeOptions>()` 的四个泛型依次
表示响应数据、请求体、查询参数和本次请求的 `nativeOptions`。

### 快捷方法

```ts
http.get<TResponse, TParams, TNativeOptions>(url, config)
http.delete<TResponse, TParams, TNativeOptions>(url, config)
http.head<TResponse, TParams, TNativeOptions>(url, config)
http.options<TResponse, TParams, TNativeOptions>(url, config)

http.post<TResponse, TData, TParams, TNativeOptions>(
  url,
  data,
  config
)
http.put<TResponse, TData, TParams, TNativeOptions>(
  url,
  data,
  config
)
http.patch<TResponse, TData, TParams, TNativeOptions>(
  url,
  data,
  config
)
```

示例：

```ts
interface User {
  id: number
  name: string
}

interface CreateUser {
  name: string
}

interface UserListParams {
  page: number
  pageSize: number
  tags?: string[]
}

const list = await http.get<User[], UserListParams>('/users', {
  params: {
    page: 1,
    pageSize: 20,
    tags: ['new', 'active']
  }
})

const created = await http.post<User, CreateUser>(
  '/users',
  {
    name: 'Ada'
  }
)
```

### 常用配置

| 配置 | 说明 |
| --- | --- |
| `baseURL` | 相对 `url` 使用的基础地址；绝对地址不会与它组合 |
| `header` | 发送给平台的请求头 |
| `params` | 追加到 URL 的查询参数 |
| `paramsSerializer` | 自定义查询参数序列化 |
| `luchMeta` | 业务和 interceptor 元数据，不发送给 uni API |
| `validateStatus` | 判断 HTTP 状态是否成功，默认接受 2xx |
| `signal` | 可选的结构化取消信号 |
| `timeout` | 请求超时时间，实际能力由平台决定 |
| `nativeOptions` | 未建模、平台专有或与库配置重名的原生参数 |

`success`、`fail`、`complete` 被内部 callback adapter 保留，不能在配置中覆盖。
`fullURL` 由库内部生成，也不能作为请求配置传入。

### 查询参数

普通 request 的 `TParams` 用于约束输入查询参数，并传播到
`paramsSerializer`：

```ts
interface UserListParams {
  page: number
  pageSize: number
  keyword?: string
}

const response = await http.get<User[], UserListParams>(
  '/users',
  {
    params: {
      page: 1,
      pageSize: 20
    },
    paramsSerializer: (params) => (
      `page=${params.page}&pageSize=${params.pageSize}`
    )
  }
)
```

显式提供 `TParams` 且传入 `params` 时，对象内的参数名、必填字段和值类型
由 TypeScript 检查；低层 client 不强制整个 `params` 必须存在。未显式提供
`TParams` 时，
`params` 使用宽泛的 `object`，保持只指定响应类型时传入普通业务 interface
的便利：

```ts
const params: UserListParams = {
  page: 1,
  pageSize: 20
}

await http.get<User[]>('/users', {
  params
})
```

实例 defaults 和 request interceptor 都可以替换最终 params，因此
`response.config.params` 只承诺为 `object | undefined`。需要在响应阶段关联
业务参数时，应从业务闭包或 `luchMeta` 读取，不依赖无法由运行时保证的泛型。

默认序列化规则：

- 忽略 `undefined`。
- 数组转换为 `key[]=value1&key[]=value2`。
- `Date` 转换为 ISO 字符串。
- 对象使用 `JSON.stringify`。
- URL 中已有查询参数时继续追加；fragment 不会被带入请求。

需要不同格式时：

```ts
interface UserIdsParams {
  ids: number[]
}

await http.get<unknown, UserIdsParams>('/users', {
  params: {
    ids: [1, 2, 3]
  },
  paramsSerializer: (params) => {
    return `ids=${params.ids.join(',')}`
  }
})
```

## TypeScript 与平台新增参数

已知字段在顶层提供直接类型提示。未声明的顶层字段不会传给 uni API；
uni-app 或具体平台新增字段统一放入 `nativeOptions`：

```ts
import type { QueryParams } from 'luch-request'

await http.get<User, QueryParams, {
  enableProfile?: boolean
  futurePlatformOption?: string
}>('/users/1', {
  nativeOptions: {
    enableProfile: true,
    futurePlatformOption: 'enabled'
  }
})
```

额外泛型只描述本次请求。项目多处使用同一批平台参数时，可通过 module
augmentation 一次性补充全局类型：

```ts
// types/luch-request.d.ts
import 'luch-request'

declare module 'luch-request' {
  interface LuchRequestNativeOptions {
    enableProfile?: boolean
    futurePlatformOption?: string
  }

  interface LuchUploadNativeOptions {
    enableBackgroundUpload?: boolean
  }

  interface LuchDownloadNativeOptions {
    useDownloadCache?: boolean
  }
}

export {}
```

之后无需重复泛型：

```ts
await http.get<User>('/users/1', {
  nativeOptions: {
    enableProfile: true
  }
})
```

`nativeOptions` 在派发前做一层展开，不作为嵌套字段发送；通常会覆盖同名的
已声明原生字段。`url`、`fullURL`、`success`、`fail`、`complete` 属于内部
保护字段，即使通过 JavaScript 动态传入也会被忽略。透传不代表所有平台都
支持该参数，调用方仍需根据目标平台文档和基础库版本进行能力判断。

实例 defaults 的类型是 request defaults，其中的 request 专属原生字段和
`nativeOptions` 不会进入 upload/download。文件操作只继承 `baseURL`、
`header`、`params`、`luchMeta`、`validateStatus`、`signal`、`timeout`、
`luchOptions` 等公共配置；其平台扩展应写在本次 upload/download 的
`nativeOptions` 中。已知属于其他 operation 的字段会在派发边界被过滤。

## 响应结构

普通请求返回原生响应字段，并增加请求上下文：

```ts
const response = await http.get<User>('/users/1')

response.data
response.statusCode
response.header
response.config
response.task
response.raw
```

- `data`：用户泛型指定的响应数据。
- `statusCode`：归一化后的数字状态码。
- `config.url`：request interceptor 最终返回的逻辑地址，保留调用方写法。
- `config.fullURL`：在 request interceptor 完成后生成，包含 `baseURL` 和
  `params` 的实际请求地址。
- `config.params`：interceptor 和 defaults 处理后的最终查询参数，类型为宽
  `object | undefined`。
- `task`：平台提供时对应原生 Task。
- `raw`：完整原始平台响应。
- 平台新增响应字段保留在响应顶层，不通过字段白名单重建。

默认只有 2xx 响应 resolve。可以按业务调整：

```ts
const http = createLuchRequest({
  validateStatus: (status) => status >= 200 && status < 400
})
```

## JSON 响应解析

由于 `uni.uploadFile` 固定返回字符串 `data`，luch-request 默认只对 upload
使用 `auto` 模式尝试 `JSON.parse`。普通 request 和 download 不额外解析：

```ts
import { createLuchRequest } from 'luch-request'

const http = createLuchRequest()

interface UploadResult {
  code: number
  data: {
    id: number
  }
}

const response = await http.upload<UploadResult>({
  url: '/upload',
  filePath,
  name: 'file'
})

if (typeof response.data === 'string') {
  console.log('服务端返回的不是有效 JSON', response.data)
} else {
  console.log(response.data.code)
}
```

- 只在 `response.data` 是字符串且当前 operation 位于 `include` 时解析。
- `auto` 为默认模式；解析失败时保留原字符串。
- `strict` 模式解析失败时抛出 `ERR_BAD_RESPONSE`。
- 解析只改变外层 `response.data`，`response.raw.data` 保留原始字符串。
- 未提供 `include` 时只匹配 `LuchOperation.UPLOAD`。
- `upload<T>()` 的 `response.data` 类型为 `T | string`，调用方需要缩小类型。

实例或单次配置可以启用严格模式，也可以明确关闭解析：

```ts
await http.upload({
  url: '/upload',
  filePath,
  name: 'file',
  luchOptions: {
    jsonParsing: {
      mode: 'strict'
    }
  }
})

await http.upload({
  url: '/upload',
  filePath,
  name: 'file',
  luchOptions: {
    jsonParsing: false
  }
})
```

## Interceptor

request 和 response interceptor 均按注册顺序 FIFO 执行，支持同步或异步
返回。普通请求、上传和下载共用实例上的两组 interceptor。`use()` 返回稳定
ID，可用 `eject()` 移除，也可用 `clear()` 清空。公共入口只导出
`InterceptorManager` interface，不导出内部实现类、handler 存储结构或遍历
方法。

handler 的第二个参数提供只读 operation，不需要通过字段猜测请求类型：

```ts
http.interceptors.request.use((config, context) => {
  if (context.operation === LuchOperation.UPLOAD) {
    // upload 专属逻辑
  }

  return config
})
```

`LuchOperation.REQUEST`、`UPLOAD`、`DOWNLOAD` 对应三类公开调用。operation
不写入 config、response 或 error，也不使用 `UPLOAD`/`DOWNLOAD` 伪 method。

进入 request interceptor 前，luch-request 已补齐会影响请求行为的默认值：

- `context.operation` 为 `REQUEST` 时，`config.method` 是大写有效 method。
- `UPLOAD` 或 `DOWNLOAD` 时，config 不包含顶层 `method`；即使实例设置了
  默认 method，也不会传给文件 API。
- 三种 operation 的 `config.validateStatus` 都是实际使用的函数。
- interceptor 可以修改这些值；返回后会再次补默认值、校验并归一化。

### Request interceptor

```ts
const requestInterceptorId = http.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken()

    return {
      ...config,
      header: {
        ...config.header,
        Authorization: `Bearer ${token}`
      }
    }
  },
  (error) => {
    throw error
  }
)

http.interceptors.request.eject(requestInterceptorId)
```

request interceptor 可以读取 `config.luchMeta`：

```ts
await http.get('/users/1', {
  luchMeta: {
    requiresAuth: true,
    traceName: 'user-detail'
  }
})
```

项目可以通过 module augmentation 为 `luchMeta` 补充业务类型：

```ts
declare module 'luch-request' {
  interface LuchMeta {
    requiresAuth?: boolean
    traceName?: string
  }
}
```

此阶段只有逻辑 `config.url`，没有 `config.fullURL`，也不能设置它。
`fullURL` 会在全部 request interceptor 完成后生成，并出现在响应及已进入
派发阶段的错误 `config` 中。

### 在 interceptor 中终止请求

在 request interceptor 中抛出错误，请求不会进入对应的底层 uni API
（普通请求即 `uni.request`）：

```ts
http.interceptors.request.use((config) => {
  if (config.luchMeta?.requiresAuth === true && !hasLogin()) {
    throw new LuchRequestError(
      '用户未登录，终止请求',
      LuchRequestError.ERR_CANCELED
    )
  }

  return config
})
```

请求管线会为该错误补充当前 `config`。因为这里只是通过异常终止流程，没有
执行 `abort()` 或 signal 取消，所以 `cancelMode` 保持 `undefined`。抛普通
`Error` 也会终止请求，并统一转换为 `ERR_INTERCEPTOR`；顶层 `message`
保留原始错误消息，原始错误保留在 `cause`，`raw` 不重复保存同一个错误。
如果后续 interceptor 的 rejected handler 返回有效配置，请求会被恢复。

### Response interceptor

```ts
const responseInterceptorId = http.interceptors.response.use(
  (response) => {
    console.log(response.statusCode)
    return response
  },
  (error) => {
    if (
      isLuchRequestError(error) &&
      error.code === LuchRequestError.ERR_NETWORK
    ) {
      console.log('网络请求失败', error.raw)
    }

    throw error
  }
)

http.interceptors.response.eject(responseInterceptorId)
```

response interceptor 抛出的错误会进入后续 rejected handler 或最终
Promise rejection。rejected handler 返回有效响应时，后续管线会恢复为
fulfilled。普通错误会统一为 `ERR_INTERCEPTOR`，并在 `response` 中保留进入
该 interceptor 的响应。

需要清空某类 interceptor：

```ts
http.interceptors.request.clear()
http.interceptors.response.clear()
```

## 错误处理

错误码通过 `LuchRequestError` 的静态常量公开。用户也可以在 interceptor
中抛出能够被请求管线识别的指定错误：

```ts
throw new LuchRequestError(
  '业务主动取消',
  LuchRequestError.ERR_CANCELED
)
```

请求管线会逐字段补充统一错误中缺失的 `config`、`task` 和 `response`；显式
传入的字段保持原值，适合高级用法。手动设置 `cancelMode` 只改变错误元数据，
不会调用原生 `Task.abort()`，普通业务不应依赖它触发取消。

| 错误码 | 说明 |
| --- | --- |
| `ERR_INVALID_CONFIG` | 配置无效，或运行环境缺少对应 uni API |
| `ERR_NETWORK` | uni API 进入 fail callback |
| `ERR_BAD_STATUS` | HTTP 状态未通过 `validateStatus` |
| `ERR_BAD_RESPONSE` | 响应内容无法按配置完成转换 |
| `ERR_CANCELED` | 调用方主动取消 |
| `ERR_INTERCEPTOR` | interceptor 执行或错误恢复失败 |

库生成的固定错误消息使用英文，便于日志检索和跨语言协作；interceptor
抛出的普通错误会保留其原始 `message`。`ERR_NETWORK` 优先使用平台 fail
错误中的非空 `errMsg`，其次使用 `message` 或字符串原因；无法提取时回退为
`Network request failed`。错误分类仍以 `error.code` 为稳定判断依据，不要匹配
`message`。调用方主动提供的错误、取消原因以及平台返回的 `raw`、`cause`
保持原值，库不会翻译。需要向最终用户展示中文等本地化提示时，应由应用根据
错误分类映射文案。

建议始终使用类型守卫：

```ts
try {
  await http.get('/users/1')
} catch (error) {
  if (!isLuchRequestError(error)) {
    throw error
  }

  console.log(error.code)
  console.log(error.config)
  console.log(error.response)
  console.log(error.task)
  console.log(error.cause)
  console.log(error.raw)
  console.log(error.cancelMode)
}
```

- HTTP 状态错误在 `response` 中保留完整响应。
- 网络失败在 `raw` 和 `cause` 中保留平台错误，并尽量将原始消息提升到 `message`。
- interceptor 普通异常在 `cause` 中保留原始错误，不重复写入 `raw`。
- 由库取消流程产生的错误通过 `cancelMode` 区分原生中断与逻辑取消。
- `isLuchRequestError()` 不依赖 `instanceof`，适合跨包和跨运行环境判断。

对于库自身产生的 `ERR_BAD_STATUS` 或 `ERR_BAD_RESPONSE`，存在
`error.response` 表示 uni API 已经返回响应。`ERR_INTERCEPTOR` 的 `response`
表示进入 interceptor 的响应上下文；如果前序 rejected handler 合成了恢复
响应，它不一定来自服务端。`ERR_NETWORK` 只能说明 uni API 报告网络失败，
不能证明服务端实际收到了请求。

`toJSON()` 返回稳定的错误摘要：

```ts
const result = error.toJSON()

result.name
result.message
result.stack
result.code
result.statusCode
result.config
result.cause
result.raw
result.cancelMode
result.isLuchRequestError
```

`statusCode` 从 `response.statusCode` 提取。原生 `task` 和完整 `response`
仍可从错误实例读取，但不会进入 `toJSON()`。`config`、`cause` 和 `raw`
保持原始引用；该方法不克隆、不脱敏，也不处理循环引用。

## 上传与下载

`upload()` 和 `download()` 返回真正的 Promise，同时附加 `abort()`、
`onTask()` 和 `task`。单次配置也可以通过 `onTask(nativeTask, control)`
在原生 Task 创建后立即注册平台事件。

### 上传

```ts
let shouldCancelUpload = false

const pendingUpload = http.upload({
  url: '/files',
  filePath: tempFilePath,
  name: 'file',
  formData: {
    category: 'avatar'
  },
  onTask(task, control) {
    task.onProgressUpdate?.((event) => {
      console.log('上传进度', event.progress)

      if (shouldCancelUpload) {
        control.abort('用户取消上传')
      }
    })
  }
})

const uploadResponse = await pendingUpload
console.log(uploadResponse.statusCode)
console.log(uploadResponse.data)
```

默认会以 `auto` 模式尝试解析上传响应的字符串 `data`。第一个泛型用于声明
期望的解析结果，实际类型为 `UploadResult | string`；第二个泛型用于单次
`nativeOptions` 扩展：

```ts
http.upload<UploadResult, {
  enableBackgroundUpload?: boolean
}>({
  url: '/files',
  filePath: tempFilePath,
  name: 'file',
  nativeOptions: {
    enableBackgroundUpload: true
  }
})
```

### 下载

```ts
const pendingDownload = http.download({
  url: '/files/report.pdf',
  onTask(task) {
    task.onProgressUpdate?.((event) => {
      console.log('下载进度', event.progress)
    })
  }
})

const downloadResponse = await pendingDownload
const filePath =
  downloadResponse.tempFilePath ||
  downloadResponse.apFilePath ||
  downloadResponse.filePath
```

不同平台使用的文件路径字段不同，使用前应检查字段是否存在。

## 取消与原生 Task

`success`、`fail`、`complete` 由内部 callback adapter 保留。需要取消或访问原生 Task 时：

```ts
const pending = http.download({
  url: '/files/report.pdf'
})

pending.onTask((task) => {
  task.onProgressUpdate?.((event) => {
    console.log(event.progress)
  })
})

pending.abort('页面已离开')
```

配置 `onTask(nativeTask, control)` 的第一个参数是对应 uni API 返回的原生
`RequestTask`、`UploadTask` 或 `DownloadTask`；第二个参数只提供当前调用的
统一 `abort(reason?)` 能力。插件获得原生 Task 后主动调用该回调一次；请求在
Task 创建前取消或失败时不会调用。回调不会传给 `uni.request`、
`uni.uploadFile` 或 `uni.downloadFile`。

原生 Task 主要用于进度、响应头等平台事件。需要取消时优先调用
`control.abort(reason)` 或返回 Promise 的 `pending.abort(reason)`，不要直接调用
`nativeTask.abort()`；后者绕过插件的主动取消入口，只能依赖平台 fail 错误形态
进行兜底识别。

`abort()` 幂等并立即 reject：

- Task 已创建且具有 `abort()` 时，调用原生中断，错误的 `cancelMode` 为
  `CancellationMode.NATIVE`（值为 `native`）。
- Task 尚未创建、平台不支持 `abort()` 或原生调用失败时，停止本库后续
  流程，`cancelMode` 为 `CancellationMode.LOGICAL`（值为 `logical`）。
- 在异步 request interceptor 完成前取消，不会调用底层 uni API。
- 调用方直接执行 `onTask()` 提供的原生 `task.abort()` 时，如果平台通过
  fail callback 返回可识别的 abort 错误，兜底转换为 `ERR_CANCELED`，并标记
  `CancellationMode.NATIVE`；平台原始错误保留在 `cause` 和 `raw`。该路径依赖
  平台错误形态，不与 `pending.abort()` 的稳定语义等价。

不同平台的原生 abort 错误不一致时，可以在实例默认配置或单次请求中完全替换
内置识别器；返回 `false` 可以禁用内置识别。识别器抛出的异常不会覆盖原始
网络错误：

```ts
const http = createLuchRequest({
  luchOptions: {
    isNativeAbortError(error, context) {
      return context.operation === LuchOperation.REQUEST &&
        typeof error === 'object' &&
        error !== null &&
        'errMsg' in error &&
        error.errMsg === 'platform request stopped'
    }
  }
})
```

跨平台业务仍应优先调用 `pending.abort(reason)`。自定义识别器只负责解释已经
发生的原生 fail，无法恢复未经过 luch-request 记录的取消原因。

返回 Promise 上的 `onTask()` 适用于需要动态增加或取消多个监听器的场景，并
返回取消订阅函数。它同样提供第二个 `control` 参数：

```ts
const unsubscribe = pending.onTask((task, control) => {
  console.log(task)
  // 需要取消时使用 control.abort('取消原因')
})

unsubscribe()
```

`onTask()` 是观察型 API。listener 抛出的异常会被隔离，不会中断原生 Task、
拒绝请求或转换成 `ERR_INTERCEPTOR`；需要处理 listener 内部失败时，应在
listener 自身使用 `try/catch`。

直接持有原始请求 Promise 时可以使用 `pending.abort()`；请求经过 `async`、
`.then()` 或 service 层封装后，附加在原 Promise 上的取消方法不会传播，此时
应通过 `signal` 独立传递取消能力。

运行环境提供 `AbortController` 时直接传入原生 signal：

```ts
const controller = new AbortController()

const pending = http.get('/users', {
  signal: controller.signal
}).then((response) => response.data)

controller.abort('页面离开')
```

传统 uni-app 平台不保证存在 `AbortController`。`createCancelSource()` 提供纯
JavaScript 实现，并与原生 signal 使用同一个配置项：

```ts
const source = createCancelSource()

const users = http.get('/users', {
  signal: source.signal
}).then((response) => response.data)

const orders = http.get('/orders', {
  signal: source.signal
})

source.cancel('页面离开')
```

同一 signal 可以取消多个请求；`cancel()` 幂等并保留第一次 reason。signal
取消后，新接入的请求会立即取消，需要新的生命周期时应创建新的 source。
config 只接受 `source.signal` 或 `controller.signal`，不接受整个 source 或
controller。

signal 会在初次配置归一化后接入，并在 interceptor 替换 signal 时重新接入。
监听注册失败返回 `ERR_INVALID_CONFIG`；请求完成后的监听清理采用尽力而为，
清理实现抛错不会改变请求结果。

## 平台注意事项

- 核心不依赖 `window`、`document`、Node.js API 或单一小程序全局对象。
- Task 的 `abort`、进度和响应头事件都可能因平台或基础库版本缺失，使用前
  必须进行能力检测。
- 未建模请求字段通过 `nativeOptions` 透传；未知响应字段仍保留在顶层。
- H5 请求受浏览器 CORS 限制。
- 小程序需要配置 request、uploadFile、downloadFile 合法域名。
- `PATCH`、后台请求、超时和文件数量等能力以具体平台为准。

## 开发命令

```sh
npm install
npm run typecheck
npm test
npm run build
```

核心包保持零运行时依赖，只输出 ESM。

从 v3 升级前请阅读 [`MIGRATION.md`](./MIGRATION.md)。
