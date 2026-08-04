import type {
  LuchDownloadNativeOptions,
  LuchMeta,
  LuchRequestNativeOptions,
  LuchUploadNativeOptions
} from './index'
import type { LuchOperation } from './core/LuchOperation'
import type { JSONParsingMode } from './core/JSONParsingMode'

/** uni-app 常见的标准 HTTP 方法。 */
export type KnownHttpMethod =
  | 'OPTIONS'
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'TRACE'
  | 'CONNECT'
  | 'PATCH'

/**
 * 请求方法同时接受未知字符串，避免具体平台新增 method 后必须升级本库。
 */
export type HttpMethod =
  | KnownHttpMethod
  | Lowercase<KnownHttpMethod>
  | (string & {})

/** 请求头允许 uni-app 各平台接受的基础值类型。 */
export type HeaderValue = string | number | boolean | null | undefined

export type RequestHeaders = Record<string, HeaderValue>

export type QueryPrimitive = string | number | boolean | null | undefined

/** URL 查询参数支持基础值、日期、对象和数组。 */
export type QueryValue =
  | QueryPrimitive
  | Date
  | Record<string, unknown>
  | readonly unknown[]

export type QueryParams = Record<string, QueryValue>

/** 按请求操作启用 JSON 响应解析。 */
export interface JSONParsingOptions {
  /** 需要解析字符串 data 的 operation；默认只包含 upload。 */
  include?: readonly LuchOperation[]
  /** strict 抛出错误，auto 保留原字符串；默认 auto。 */
  mode?: JSONParsingMode
}

/**
 * 与 AbortSignal 保持结构兼容，但不依赖 DOM 类型或全平台 AbortController。
 */
export interface AbortSignalLike {
  readonly aborted: boolean
  readonly reason?: unknown
  addEventListener(
    type: 'abort',
    listener: () => void,
    options?: { once?: boolean }
  ): void
  removeEventListener(type: 'abort', listener: () => void): void
}

/** 不依赖平台 AbortController 的取消信号生产者。 */
export interface CancelSource {
  /** 传给请求 config.signal 的只读取消信号。 */
  readonly signal: AbortSignalLike
  /** 取消所有共享该 signal 的请求；重复调用保持第一次原因。 */
  cancel(reason?: unknown): void
}

/** 所有 uni-app Task 的最小公共能力。 */
export interface NativeTask {
  abort?: () => void
}

/** 供 Task listener 使用的 luch-request 单次请求控制能力。 */
export interface LuchRequestControl {
  /** 通过 luch-request 的统一取消语义中止当前请求。 */
  readonly abort: (reason?: string) => void
}

/** 原生 Task 创建后的观察回调。 */
export type TaskListener<TTask extends NativeTask> = (
  nativeTask: TTask,
  control: LuchRequestControl
) => void

/** 原生失败分类器可读取的只读请求上下文。 */
export interface NativeAbortErrorContext {
  /** 当前调用对应的 uni API 类型。 */
  readonly operation: LuchOperation
  /** request interceptor 完成后的最终请求配置。 */
  readonly config: Readonly<ResolvedRequestConfig>
  /** 平台已返回原生 Task 时保留该对象。 */
  readonly task?: NativeTask | undefined
}

/** 判断平台 fail callback 是否表示原生 Task 已被中止。 */
export type NativeAbortErrorDetector = (
  error: unknown,
  context: NativeAbortErrorContext
) => boolean

/** luch-request 自身消费且不会传给 uni API 的配置命名空间。 */
export interface LuchOptions {
  /** false 明确关闭默认 upload 解析；对象按字段与实例默认配置合并。 */
  jsonParsing?: false | JSONParsingOptions
  /** 覆盖内置的原生 abort 错误兜底识别；返回 false 可禁用默认识别。 */
  isNativeAbortError?: NativeAbortErrorDetector
}

/** uni.request 返回的 Task；事件是否存在由具体平台决定。 */
export interface RequestTask extends NativeTask {
  onHeadersReceived?: (listener: (result: unknown) => void) => void
  offHeadersReceived?: (listener: (result: unknown) => void) => void
}

/** 上传或下载过程中的跨平台进度信息。 */
export interface ProgressEvent {
  progress: number
  totalBytesSent?: number
  totalBytesWritten?: number
  totalBytesExpectedToSend?: number
  totalBytesExpectedToWrite?: number
}

/** 上传、下载 Task 的可选进度及响应头能力。 */
export interface TransferTask extends NativeTask {
  onProgressUpdate?: (listener: (event: ProgressEvent) => void) => void
  offProgressUpdate?: (listener: (event: ProgressEvent) => void) => void
  onHeadersReceived?: (listener: (result: unknown) => void) => void
  offHeadersReceived?: (listener: (result: unknown) => void) => void
}

/**
 * uni.request 的最小响应基线。
 * 索引签名用于保留具体平台新增的响应字段。
 */
export interface NativeRequestResponse<TData = unknown> {
  [key: string]: unknown
  data: TData
  statusCode: number
  header: RequestHeaders
  cookies?: string[]
}

/** uni.uploadFile 的最小响应基线。 */
export interface NativeUploadResponse {
  [key: string]: unknown
  data: string
  statusCode: number | string
}

/**
 * uni.downloadFile 的最小响应基线。
 * 不同平台使用的临时文件字段不同，因此均按可选字段保留。
 */
export interface NativeDownloadResponse {
  [key: string]: unknown
  statusCode?: number | string
  tempFilePath?: string
  apFilePath?: string
  filePath?: string
  fileContent?: unknown
}

/**
 * callback 由内部 adapter 接管，禁止调用方覆盖 Promise 的完成逻辑。
 */
type ReservedCallbacks = {
  success?: never
  fail?: never
  complete?: never
}

/**
 * 已声明字段保留在顶层，未建模的原生字段统一收敛到 nativeOptions。
 */
type WithNativeOptions<
  TBase extends object,
  TExtension extends object,
  TNativeOptions extends object
> = Omit<TBase, 'nativeOptions'> & {
  nativeOptions?: TExtension & TNativeOptions
} &
  ReservedCallbacks

/** 为单次调用附加原生 Task 观察能力。 */
type WithTaskListener<
  TConfig extends object,
  TTask extends NativeTask
> = TConfig & {
  /**
   * 原生 Task 创建后调用一次；取消请求优先使用 control.abort()。
   * listener 异常会被隔离，不影响请求结果。
   */
  onTask?: TaskListener<TTask>
}

/** 三类请求共用、且由 luch-request 自身消费的配置。 */
export interface CommonConfig<
  TParams extends object = object
> {
  /** 相对 url 使用的基础地址；绝对 url 不会与它组合。 */
  baseURL?: string
  /** 发送给平台的请求头，实例值与单次请求值按键名合并。 */
  header?: RequestHeaders
  /** 追加到 URL 的查询参数。 */
  params?: TParams
  /** 自定义 params 序列化函数，返回值可以带或不带开头的问号。 */
  paramsSerializer?: (params: TParams) => string
  /** 仅供 interceptor 和业务读取的元数据，不传给 uni API。 */
  luchMeta?: LuchMeta
  /** 判断 HTTP 状态是否成功；默认接受 200 至 299。 */
  validateStatus?: (status: number) => boolean
  /** 可选的结构化取消信号，不要求原生 AbortSignal 实例。 */
  signal?: AbortSignalLike
  /** 请求超时时间，具体支持范围由运行平台决定。 */
  timeout?: number
  /** luch-request 自身功能配置，不作为原生参数发送。 */
  luchOptions?: LuchOptions
  /**
   * 未建模、平台专有或与 luch-request 重名的原生参数。
   * 派发前做一层展开，不作为嵌套字段传给 uni API。
   */
  nativeOptions?: Record<string, unknown>
}

/**
 * uni.request 已核对的基础参数。
 * 未列出的平台新参数通过 nativeOptions 传入。
 */
export interface NativeRequestOptions<TData = unknown> {
  url: string
  data?: TData
  method?: HttpMethod
  dataType?: string
  responseType?: string
  sslVerify?: boolean
  withCredentials?: boolean
  firstIpv4?: boolean
  enableHttp2?: boolean
  enableQuic?: boolean
  enableCache?: boolean
  enableHttpDNS?: boolean
  httpDNSServiceId?: string
  enableChunked?: boolean
  forceCellularNetwork?: boolean
  enableCookie?: boolean
  cloudCache?: object | boolean
  defer?: boolean
}

/**
 * 单次 request 配置。
 * 泛型依次表示请求体、查询参数和 nativeOptions 的局部类型。
 */
export type RequestConfig<
  TData = unknown,
  TParams extends object = object,
  TNativeOptions extends object = {}
> = WithTaskListener<
  WithNativeOptions<
    CommonConfig<TParams> & NativeRequestOptions<TData>,
    LuchRequestNativeOptions,
    TNativeOptions
  >,
  RequestTask
>

/** uni.uploadFile 已核对的基础参数。 */
export interface NativeUploadOptions {
  url: string
  filePath?: string
  name?: string
  files?: readonly {
    name?: string
    uri: string
  }[]
  formData?: Record<string, unknown>
}

/** 单次 upload 配置；泛型用于声明 nativeOptions 的局部类型。 */
export type UploadConfig<
  TNativeOptions extends object = {}
> = WithTaskListener<
  WithNativeOptions<
    CommonConfig & NativeUploadOptions,
    LuchUploadNativeOptions,
    TNativeOptions
  >,
  TransferTask
>

/** uni.downloadFile 已核对的基础参数。 */
export interface NativeDownloadOptions {
  url: string
  filePath?: string
}

/** 单次 download 配置；泛型用于声明 nativeOptions 的局部类型。 */
export type DownloadConfig<
  TNativeOptions extends object = {}
> = WithTaskListener<
  WithNativeOptions<
    CommonConfig & NativeDownloadOptions,
    LuchDownloadNativeOptions,
    TNativeOptions
  >,
  TransferTask
>

/**
 * 实例默认配置不允许预设具体请求的 url 和 data。
 * method 只作为普通 request 的默认值，不会进入 upload 或 download。
 */
type RequestDefaultBase = CommonConfig &
  Omit<NativeRequestOptions<unknown>, 'url' | 'data'>

/** createLuchRequest 接受的实例默认配置。 */
export type RequestDefaults<
  TNativeOptions extends object = {}
> = Partial<
  WithNativeOptions<
    RequestDefaultBase,
    LuchRequestNativeOptions,
    TNativeOptions
  >
>

/**
 * 请求管线内部使用的宽配置类型。
 * 未建模的原生参数必须放入 nativeOptions，避免与库配置字段冲突。
 */
export type AnyRequestConfig = CommonConfig &
  NativeRequestOptions<unknown> &
  Partial<Omit<NativeUploadOptions, 'url'>> &
  Partial<Omit<NativeDownloadOptions, 'url'>> & {
    onTask?: TaskListener<NativeTask>
  }

/**
 * 请求拦截器完成后生成的最终配置。
 * fullURL 仅用于响应、错误上下文和实际派发，不属于请求输入配置。
 */
export type ResolvedRequestConfig<
  TConfig extends object = AnyRequestConfig
> = TConfig & {
  readonly fullURL: string
  validateStatus: (status: number) => boolean
}

/**
 * luch-request 附加到原生响应上的上下文。
 * raw 始终保留未经重建的原始平台响应。
 */
interface LuchResponseMetadata<
  TNative extends object,
  TConfig extends object,
  TTask extends NativeTask
> {
  /** 请求经过 interceptor 和 URL 解析后的最终配置。 */
  config: Readonly<ResolvedRequestConfig<TConfig>>
  /** 对应平台返回的原生 Task；平台不提供时为空。 */
  task?: TTask
  /** 未经字段白名单重建的原始平台响应。 */
  raw: TNative
}

/** 带请求上下文和原生扩展字段的通用响应。 */
export type LuchResponse<
  TData,
  TNative extends object,
  TConfig extends object,
  TTask extends NativeTask = NativeTask
> = TNative & {
  data: TData
} & LuchResponseMetadata<TNative, TConfig, TTask>

/** 不强制包含 data 字段的下载响应。 */
export type LuchDownloadResponse<
  TNative extends object,
  TConfig extends object,
  TTask extends NativeTask = TransferTask
> = TNative & LuchResponseMetadata<TNative, TConfig, TTask>

/** interceptor 和内部管线使用的宽响应类型。 */
export type AnyLuchResponse = {
  config: Readonly<ResolvedRequestConfig>
  task?: NativeTask
  raw: object
  data?: unknown
  [key: string]: unknown
}

/** request 的公开响应类型，statusCode 统一为 number。 */
export type RequestResponse<
  TData = unknown,
  TNative extends object = NativeRequestResponse<TData>,
  TConfig extends object = AnyRequestConfig
> = Omit<TNative, 'data' | 'statusCode'> & {
  data: TData
  statusCode: number
  header: RequestHeaders
  cookies?: string[]
} & LuchResponseMetadata<TNative, TConfig, RequestTask>

/** upload 的公开响应类型，兼容平台返回字符串状态码。 */
export type UploadResponse<
  TData = unknown,
  TNative extends object = NativeUploadResponse,
  TConfig extends object = AnyRequestConfig
> = Omit<TNative, 'data' | 'statusCode'> & {
  data: TData
  statusCode: number
} & LuchResponseMetadata<TNative, TConfig, TransferTask>

/** download 的公开响应类型；部分平台可能不提供状态码。 */
export type DownloadResponse<
  TNative extends object = NativeDownloadResponse,
  TConfig extends object = AnyRequestConfig
> = Omit<TNative, 'statusCode'> & {
  statusCode?: number
  tempFilePath?: string
  apFilePath?: string
  filePath?: string
  fileContent?: unknown
} & LuchResponseMetadata<TNative, TConfig, TransferTask>

/**
 * 在原生 Promise 上附加取消和 Task 访问能力，不改变 await/then 行为。
 */
export interface LuchRequestPromise<TValue, TTask extends NativeTask>
  extends Promise<TValue> {
  /** 取消当前调用；原生 Task 不支持 abort 时执行逻辑取消。 */
  abort(reason?: string): void
  /** 监听原生 Task 创建，通过 control 统一取消，并返回取消监听函数。 */
  onTask(listener: TaskListener<TTask>): () => void
  /** Task 已创建时可直接访问，否则为 undefined。 */
  readonly task?: TTask
}
