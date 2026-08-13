# 从 v3 迁移到 v4

v4 是 breaking redesign，不建议在未验证的情况下直接替换生产项目。

## 创建实例

```ts
// v3
import Request from 'luch-request'
const http = new Request()

// v4
import { createLuchRequest } from 'luch-request'
const http = createLuchRequest()
```

v4 只发布 ESM，不再提供默认导出、CommonJS 或 UMD。
构建目标为 ES2017，最低平台范围见
[`COMPATIBILITY.md`](./COMPATIBILITY.md)。

`InterceptorManager` 仅作为公共 TypeScript interface 导出，不能由调用方
直接实例化。`mergeConfig`、内部 handler 结构及 `Any*` 管线类型不属于公共
API。

## 请求与回调

`success`、`fail`、`complete` 由 v4 内部保留，用于统一各 uni-app 版本的 Promise 行为。调用方只使用 Promise：

```ts
const response = await http.get<User>('/users/1')
```

普通请求的泛型顺序为：

```ts
http.request<TResponse, TData, TParams, TNativeOptions>(config)
http.get<TResponse, TParams, TNativeOptions>(url, config)
http.post<TResponse, TData, TParams, TNativeOptions>(
  url,
  data,
  config
)
```

`TParams` 会约束输入 `params` 和 `paramsSerializer`。defaults 和 request
interceptor 可以替换最终 params，因此 `response.config.params` 从本次
修订起只保留宽 `object | undefined` 类型，不再承诺输入侧的 `TParams`。
由于 v4 早期版本曾把单次 `TNativeOptions` 放在 `get` 的第二位、
`request` 的第三位，使用过这些泛型位置的代码需要顺延一个位置。

`upload` 和 `download` 使用各自的配置类型，不再通过 `UPLOAD`、`DOWNLOAD` 等伪 method 进入普通请求配置。
`upload<TResponse, TNativeOptions>()` 的第一个泛型表示响应 `data`，第二个
泛型用于本次调用的原生参数扩展；未启用 JSON parsing 时默认响应类型仍为
`string`。

## 错误处理

所有 Promise rejection 都是 `LuchRequestError`。根据 `code` 区分：

- `ERR_INVALID_CONFIG`
- `ERR_NETWORK`
- `ERR_BAD_STATUS`
- `ERR_BAD_RESPONSE`
- `ERR_CANCELED`
- `ERR_INTERCEPTOR`

这些值通过 `LuchRequestError.ERR_NETWORK`、
`LuchRequestError.ERR_CANCELED` 等静态常量公开，业务和 interceptor
不需要重复书写错误码字符串。

v4 由库生成的固定 `error.message` 使用英文；interceptor 抛出的普通错误会
保留原始消息。业务判断必须使用稳定的 `error.code`，不要匹配消息文本。
调用方提供的错误、取消原因以及平台原始 `raw`、`cause` 保持原值，不由库
翻译。

原始平台错误位于 `raw` 和 `cause`；interceptor 普通异常只放在 `cause`，
不重复写入 `raw`。HTTP 状态错误和响应 interceptor 错误会尽可能保留完整
`response`。库产生的 `ERR_BAD_STATUS`、`ERR_BAD_RESPONSE` 可通过
`error.response` 判断已取得平台响应；interceptor 的响应可能由前序恢复逻辑
合成，需要结合业务判断。`ERR_NETWORK` 不能证明服务端实际收到请求。
由库取消流程产生的错误通过 `cancelMode` 标识原生中断或逻辑取消；手动构造
错误时该字段非必填，也不会触发实际取消。
请求管线会逐字段补充统一错误中缺失的 `config`、`task` 和 `response`，用户
显式传入的字段保持原值。
取消模式使用 `CancellationMode.NATIVE` 和 `CancellationMode.LOGICAL`
运行时常量判断，不需要直接比较字符串。
`toJSON()` 提供包含 `statusCode`、`config`、`cause` 和 `raw` 的稳定摘要，
不包含原生 Task 或完整 response。

## 取消与 Task

```ts
const pending = http.download({ url: '/file.pdf' })

pending.onTask((task) => {
  task.onProgressUpdate?.(console.log)
})

pending.abort('页面已离开')
```

直接持有请求 Promise 时使用 `abort()` 代替 v3 的 `getTask` 取消流程；经过
`async`、`.then()` 或 service 封装时，通过 `signal` 传播取消。平台没有原生
`AbortController` 时使用 `createCancelSource().signal`。signal 监听注册失败统一返回
`ERR_INVALID_CONFIG`，清理失败不改变请求结果。`onTask()` listener 作为
观察者隔离异常，不再中断 Task 或拒绝请求。

## 配置与响应

- 实例默认值优先级低于单次请求配置。
- 普通对象和数组会生成实例或请求私有的结构副本，request interceptor 修改
  普通嵌套配置不会污染其他实例、defaults、调用方输入或并发请求；`signal`、
  函数和平台对象等不透明值仍保留引用身份。
- `header` 按大小写不敏感的键合并。
- 单次 header 的 `null` 或 `undefined` 表示删除同名实例默认值，空值不会
  发送给底层 uni API。
- v3 的 `custom` 更名为 `luchMeta`，并改为一层浅合并；嵌套值由单次
  请求整体覆盖。
- upload 默认不继承实例 `header` 中的 `Content-Type`；本次 upload
  显式设置时仍会保留，认证等其他 header 不受影响。
- request 的 `nativeOptions` 浅合并，用于未建模、平台专有或与库配置重名
  的原生参数；实例 request `nativeOptions` 不再进入 upload/download，
  文件操作的扩展参数应放在各自单次配置中。
- 派发时按 operation 过滤已知原生字段，request 的 `method`、
  `responseType` 等不会进入 upload/download。
- `url`、`fullURL` 和三个 callback 是保护字段，不能通过 `nativeOptions`
  覆盖。
- 未声明的顶层字段不再自动透传，需要移动到 `nativeOptions`。
- request/response interceptor 均按注册顺序 FIFO。
- interceptor handler 可通过第二个参数的 `context.operation` 区分
  request、upload 和 download，不再依赖伪 method。
- v4 默认不额外执行 JSON.parse；需要处理 upload 字符串响应时，通过
  `luchOptions.jsonParsing` 按 operation 显式启用。
- 响应新增 `config`、`task`、`raw`，未知平台响应字段保留在顶层。
- `response.config.url` 保留 request interceptor 最终返回的逻辑地址；
  `response.config.fullURL` 是包含 `baseURL` 和 `params` 的实际请求地址。

## 暂不提供

首个 npm 版本不包含 `uni_modules`、uni-app x、重试、缓存、去重、并发控制、Token 刷新或 WebSocket。
