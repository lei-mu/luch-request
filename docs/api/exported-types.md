---
title: 公共导出
description: luch-request v4 运行时导出与公共 TypeScript 类型的完整入口索引
---

# 公共导出

luch-request v4 只从包入口导出本页列出的运行时值和 TypeScript 类型。adapter、
内部管线宽类型和实现类不属于公共 API，不应从源码深路径导入。

## 如何导入

只在类型位置使用的导出建议通过 `import type` 引入：

```ts
import {
  CancellationMode,
  createCancelSource,
  createLuchRequest,
  isLuchRequestError,
  JSONParsingMode,
  LuchOperation,
  LuchRequestError
} from 'luch-request'
import type {
  LuchRequestControl,
  RequestConfig,
  RequestResponse,
  TaskListener,
  LuchRequestInstance
} from 'luch-request'
```

上面第一个 import 中的七个名称都是运行时值。其中 `CancellationMode`、
`JSONParsingMode`、`LuchOperation` 同时具有同名类型，既可以用于运行时比较，也
可以用于类型标注。

## 运行时导出

| 导出 | 种类 | 用途 | 详细说明 |
| --- | --- | --- | --- |
| `createLuchRequest` | 函数 | 创建相互独立的请求实例 | [请求与响应：createLuchRequest](/api/request#create-luch-request) |
| `createCancelSource` | 函数 | 创建跨平台取消源 | [取消与原生 Task：createCancelSource](/api/cancellation#create-cancel-source) |
| `LuchOperation` | 常量对象 | 区分 request、upload、download | [Interceptor：LuchOperation](/api/interceptors#luch-operation) |
| `JSONParsingMode` | 常量对象 | 指定 JSON 解析失败时的处理方式 | [配置选项：jsonParsing](/api/config-options#jsonparsing) |
| `CancellationMode` | 常量对象 | 区分原生中断与逻辑取消 | [取消与原生 Task：CancellationMode](/api/cancellation#cancellation-mode) |
| `LuchRequestError` | class | 表示统一的请求错误并公开稳定错误码 | [错误处理：LuchRequestError](/api/error#luch-request-error) |
| `isLuchRequestError` | 类型守卫函数 | 跨包、跨运行环境识别统一错误 | [错误处理：isLuchRequestError](/api/error#is-luch-request-error) |

以上是 `src/index.ts` 的全部运行时导出。其余入口导出均为 TypeScript 类型或可供
module augmentation 的 interface，编译后不会生成运行时对象。

::: tip 通常不需要手写所有类型
业务调用优先让 `createLuchRequest()` 和请求方法推导实例、Promise、Task 与响应
类型。只有在封装函数、声明公共接口、扩展平台字段或构造测试对象时，才需要显式
导入对应类型。
:::

## 配置类型

### 面向调用方的配置

| 类型 | 泛型 | 用途 |
| --- | --- | --- |
| `RequestDefaults<TNativeOptions>` | 原生扩展字段 | `createLuchRequest()` 的实例默认配置；不允许预设 `url`、`data` |
| `RequestConfig<TData, TParams, TNativeOptions>` | 请求体、查询参数、原生扩展 | 单次 `request()` 配置 |
| `UploadConfig<TNativeOptions>` | 原生扩展字段 | 单次 `upload()` 配置 |
| `DownloadConfig<TNativeOptions>` | 原生扩展字段 | 单次 `download()` 配置 |
| `CommonConfig<TParams>` | 查询参数 | 三类 operation 共用的库配置 |

```ts
interface CreateUserBody {
  name: string
}

interface ListParams {
  page: number
}

type CreateUserConfig = RequestConfig<
  CreateUserBody,
  ListParams,
  { enableProfile?: boolean }
>
```

这里的 `RequestConfig` 泛型不包含响应数据。请求方法的第一个泛型才是响应数据：

```ts
http.request<User, CreateUserBody, ListParams>({
  url: '/users',
  method: 'POST',
  data: { name: 'Ada' },
  params: { page: 1 }
})
```

这样设计是为了让配置对象只描述输入，而响应泛型留在真正产生响应的方法上。

### 原生配置基线

| 类型 | 说明 |
| --- | --- |
| `NativeRequestOptions<TData>` | 已建模的 `uni.request` 顶层参数 |
| `NativeUploadOptions` | 已建模的 `uni.uploadFile` 顶层参数 |
| `NativeDownloadOptions` | 已建模的 `uni.downloadFile` 顶层参数 |
| `ResolvedRequestConfig<TConfig>` | interceptor 完成后、已包含只读 `fullURL` 的最终配置 |

`Native*Options` 是 luch-request 已核对的原生参数基线，不是目标平台全部能力的
永久快照。平台新增或专有字段应放入 `nativeOptions`，详见
[配置选项](/api/config-options#nativeoptions-特殊原生选项)。

`ResolvedRequestConfig` 主要用于响应、错误和 interceptor 周边封装。它表示库已
补齐 `validateStatus` 并生成 `fullURL`，不应把它当作请求输入类型。

## 响应类型

### 推荐使用的响应类型

| 类型 | 泛型 | 对应调用 |
| --- | --- | --- |
| `RequestResponse<TData, TNative, TConfig>` | 数据、原生响应、最终配置 | `request()` 和 HTTP 快捷方法 |
| `UploadResponse<TData, TNative, TConfig>` | 数据、原生响应、最终配置 | `upload()` |
| `DownloadResponse<TNative, TConfig>` | 原生响应、最终配置 | `download()` |

```ts
type UserResponse = RequestResponse<User>

async function loadUser(
  http: LuchRequestInstance
): Promise<UserResponse> {
  return http.get<User>('/users/1')
}
```

三类响应都会保留 `config`、`task` 和 `raw`。普通 request 与 upload 将
`statusCode` 归一化为 `number`；download 的 `statusCode` 仍为可选，因为部分
平台不保证返回。upload 默认解析后仍可能保留原字符串，所以方法返回的 `data`
通常是 `TData | string`。

### 原生响应与通用组合类型

| 类型 | 说明 |
| --- | --- |
| `NativeRequestResponse<TData>` | `uni.request` 的最小响应基线 |
| `NativeUploadResponse` | `uni.uploadFile` 的最小响应基线，原始 `data` 为字符串 |
| `NativeDownloadResponse` | 文件路径字段均为可选的 download 响应基线 |
| `LuchResponse<TData, TNative, TConfig, TTask>` | 带 `data` 的通用响应组合工具 |
| `LuchDownloadResponse<TNative, TConfig, TTask>` | 不强制存在 `data` 的通用响应组合工具 |

`RequestResponse`、`UploadResponse`、`DownloadResponse` 已经为三种公开方法设置了
合适的默认原生类型，业务代码通常优先使用它们。只有封装自定义 adapter 边界或
补充平台响应字段时，才需要直接使用 `Native*Response` 或 `Luch*Response`。

```ts
interface ProfiledNativeResponse extends NativeRequestResponse<User> {
  profile?: {
    protocol?: string
  }
}

type ProfiledResponse = RequestResponse<User, ProfiledNativeResponse>
```

保留 `TNative` 泛型而不把平台字段写死，是为了让已知公共字段保持稳定，同时允许
调用方精确描述特定平台真实返回的扩展字段。

## 实例、Promise 与 Task

| 类型 | 泛型 | 说明 |
| --- | --- | --- |
| `LuchRequestInstance<TNativeOptions>` | 实例级 request 原生扩展 | `createLuchRequest()` 返回的公共实例类型 |
| `LuchRequestPromise<TValue, TTask>` | resolve 值、原生 Task | 带 `abort()`、`onTask()` 和 `task` 的增强 Promise |
| `LuchRequestControl` | — | Task listener 的最小控制面，只公开统一 `abort(reason?)` |
| `TaskListener<TTask>` | 原生 Task | `onTask(nativeTask, control)` 的公共 listener 类型 |
| `NativeTask` | — | 所有 Task 的最小公共能力，仅保证可选 `abort` |
| `RequestTask` | — | request Task，可选响应头事件 |
| `TransferTask` | — | upload/download Task，可选进度与响应头事件 |
| `ProgressEvent` | — | 上传下载的跨平台进度字段 |

::: danger 不直接取消原生 Task
`NativeTask` 的 `abort` 字段用于描述平台能力并供 luch-request 内部适配。业务代码
禁止通过 `pending.task` 或 `onTask()` 得到的 Task 调用 `abort()`；取消必须使用
listener 的 `control.abort()`、`pending.abort()`，跨调用链取消使用
`createCancelSource()`。
:::

```ts
function bindRequestTask(
  pending: LuchRequestPromise<RequestResponse<User>, RequestTask>
): void {
  pending.onTask((task, control) => {
    task.onHeadersReceived?.((result) => {
      console.log(result)
    })

    // control.abort('用户取消')
  })
}
```

单次请求配置中的 `onTask` 与增强 Promise 的 `onTask()` 使用同一个
`TaskListener<TTask>` 签名。前者在原生 Task 创建后自动调用一次；后者支持动态
增加多个 listener，并返回取消订阅函数。两者收到的 `control` 都只控制当前调用。

Task 方法大多是可选的，因为平台和基础库版本能力不同。类型不会伪装不存在的
原生事件能力，订阅进度或响应头时应使用可选调用或显式能力检测。

需要保留 `LuchRequestPromise` 的 `abort()`、`onTask()` 和 `task` 时，应直接保存
请求方法返回的 `pending`，不要保存 `pending.then()`、`pending.catch()` 或
`pending.finally()` 的返回值。这三个标准 Promise 方法返回普通 Promise，不会
传播 luch-request 附加的扩展能力。

`LuchRequestInstance` 暴露稳定的工厂返回类型，而不导出内部实现类。这样 service
层可以声明依赖和测试替身，同时库仍能演进内部实现。

## 取消类型

| 类型 | 说明 |
| --- | --- |
| `AbortSignalLike` | 不依赖 DOM lib 的结构化取消信号 |
| `CancelSource` | `createCancelSource()` 的返回类型，包含 `signal` 与 `cancel()` |
| `CancellationMode` | `'native' \| 'logical'`，同时有同名运行时常量 |
| `NativeAbortErrorContext` | 原生取消识别器读取的 operation、最终配置和 Task |
| `NativeAbortErrorDetector` | 自定义原生 abort 错误分类函数 |

```ts
const source: CancelSource = createCancelSource()
const signal: AbortSignalLike = source.signal

http.get('/users', { signal })
source.cancel('页面已离开')
```

`AbortSignalLike` 使用结构类型，是因为浏览器原生 JavaScript/Web API
`AbortController` 只在 H5 可用。App、小程序、HarmonyOS 等其他平台没有
`AbortController` 对象，应通过 `createCancelSource()` 获得兼容的 signal；不要
创建或填充同名全局对象。完整行为见 [取消与原生 Task](/api/cancellation)。

## Interceptor 类型

| 类型 | 说明 |
| --- | --- |
| `InterceptorContext` | 只读上下文，包含当前 `operation` |
| `InterceptorFulfilled<TValue>` | 成功 handler，可同步或异步返回同类值 |
| `InterceptorRejected<TValue>` | 错误恢复 handler，接收 `unknown` 并返回同类值 |
| `InterceptorManager<TValue>` | 公共管理接口，提供 `use()`、`eject()`、`clear()` |

```ts
type RequestInterceptor = Parameters<
  typeof http.interceptors.request.use
>[0]

const addToken: RequestInterceptor = (config, context) => {
  if (context.operation === LuchOperation.REQUEST) {
    config.header = {
      ...config.header,
      Authorization: 'Bearer token'
    }
  }

  return config
}
```

通常应从具体实例推导 request/response interceptor 的值类型，因为实例管线已经
包含正确的配置与响应宽度。`InterceptorManager` 是接口，不能直接实例化，也不
暴露内部遍历方法。

## 错误类型

| 类型 | 说明 |
| --- | --- |
| `LuchRequestError<TConfig, TResponse>` | 统一错误类，也是运行时导出 |
| `LuchRequestErrorCode` | 六种稳定错误码的联合类型 |
| `LuchRequestErrorOptions<TConfig, TResponse>` | 手动构造错误时的上下文选项 |
| `LuchRequestErrorJSON<TConfig>` | `error.toJSON()` 的稳定摘要类型 |

```ts
function reportError(error: unknown): void {
  if (!isLuchRequestError<RequestConfig>(error)) {
    return
  }

  const code: LuchRequestErrorCode = error.code
  const summary: LuchRequestErrorJSON<RequestConfig> = error.toJSON()
  console.log(code, summary.statusCode)
}
```

优先使用 `isLuchRequestError()` 收窄 `unknown`，而不是直接断言类型。
`LuchRequestErrorOptions` 主要用于 interceptor 或测试中主动构造统一错误；普通
业务 catch 通常不需要它。完整字段与错误码见 [错误处理](/api/error)。

## Operation 与基础值类型

| 类型 | 说明 |
| --- | --- |
| `LuchOperation` | `'request' \| 'upload' \| 'download'`，同时有同名运行时常量 |
| `KnownHttpMethod` | 内置已知 HTTP method 的大小写联合类型 |
| `HttpMethod` | 接受已知 method，也允许平台未来增加字符串值 |
| `HeaderValue` | header 可接受的基础值类型 |
| `RequestHeaders` | `Record<string, HeaderValue>` |
| `QueryPrimitive` | query 基础值类型 |
| `QueryValue` | query 基础值、`Date`、对象或数组 |
| `QueryParams` | `Record<string, QueryValue>` |
| `JSONParsingMode` | `'auto' \| 'strict'`，同时有同名运行时常量 |
| `JSONParsingOptions` | JSON 解析的 operation 与失败策略 |
| `LuchOptions` | luch-request 自身功能选项 |

`HttpMethod` 和平台扩展类型都保留未知字符串入口，是为了避免平台新增合法能力时
必须等待 luch-request 发版；这不表示任意字符串都能在当前平台运行。

## 可扩展接口

以下接口专门用于 module augmentation：

| 接口 | 扩展范围 |
| --- | --- |
| `LuchMeta` | 业务元数据 |
| `LuchNativeOptions` | 三类 operation 共用的原生扩展基线 |
| `LuchRequestNativeOptions` | `uni.request` 原生扩展 |
| `LuchUploadNativeOptions` | `uni.uploadFile` 原生扩展 |
| `LuchDownloadNativeOptions` | `uni.downloadFile` 原生扩展 |

```ts
import 'luch-request'

declare module 'luch-request' {
  interface LuchMeta {
    requiresAuth?: boolean
  }

  interface LuchRequestNativeOptions {
    enableProfile?: boolean
  }
}

export {}
```

四个 `Luch*NativeOptions` 接口中的 `url`、`fullURL` 和 callbacks 已被保护，不能
通过扩展恢复为可写字段。按 operation 分开扩展，是为了避免某个平台的 upload
选项错误出现在 request 或 download 上。

## 不属于公共入口的类型

`AnyRequestConfig`、`AnyLuchResponse`、内部 adapter 类型、控制器和
`InternalInterceptorManager` 不从包入口导出。它们用于连接内部宽管线，结构可能
随实现演进，不应成为业务代码的依赖。

公共封装应优先组合本页列出的配置、响应和接口类型；如果现有公共类型无法表达
真实业务边界，应先确认缺口，而不是从源码深路径导入内部类型。
