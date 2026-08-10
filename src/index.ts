// 包入口只暴露经过设计确认的公共 API，内部 adapter 和控制器不直接导出。
/** 三类 uni API 共用的原生配置扩展入口。 */
export interface LuchNativeOptions {
  /** URL 始终由库根据 url、baseURL 和 params 生成。 */
  url?: never
  /** fullURL 是请求拦截器完成后生成的只读上下文。 */
  fullURL?: never
  /** Promise callback 始终由内部 adapter 接管。 */
  success?: never
  fail?: never
  complete?: never
  [key: string]: unknown
}

/** uni.request 的全局原生配置扩展入口。 */
export interface LuchRequestNativeOptions extends LuchNativeOptions {}

/** uni.uploadFile 的全局原生配置扩展入口。 */
export interface LuchUploadNativeOptions extends LuchNativeOptions {}

/** uni.downloadFile 的全局原生配置扩展入口。 */
export interface LuchDownloadNativeOptions extends LuchNativeOptions {}

/** 仅供业务和 interceptor 使用的请求元数据扩展入口。 */
export interface LuchMeta {
  [key: string]: unknown
}

export {
  type InterceptorContext,
  type InterceptorFulfilled,
  type InterceptorManager,
  type InterceptorRejected
} from './core/InterceptorManager'
export {
  LuchOperation
} from './core/LuchOperation'
export {
  JSONParsingMode
} from './core/JSONParsingMode'
export {
  CancellationMode,
  isLuchRequestError,
  LuchRequestError,
  type LuchRequestErrorCode,
  type LuchRequestErrorJSON,
  type LuchRequestErrorOptions
} from './core/LuchRequestError'
export {
  createCancelSource
} from './createCancelSource'
export {
  createLuchRequest,
  type LuchRequestInstance
} from './createLuchRequest'
export type {
  AbortSignalLike,
  CancelSource,
  CommonConfig,
  DownloadConfig,
  HeaderValue,
  HttpMethod,
  KnownHttpMethod,
  JSONParsingOptions,
  LuchRequestControl,
  LuchOptions,
  LuchDownloadResponse,
  LuchRequestPromise,
  LuchResponse,
  NativeAbortErrorContext,
  NativeAbortErrorDetector,
  NativeDownloadOptions,
  NativeDownloadResponse,
  NativeRequestOptions,
  NativeRequestResponse,
  NativeTask,
  NativeUploadOptions,
  NativeUploadResponse,
  ProgressEvent,
  QueryParams,
  QueryPrimitive,
  QueryValue,
  RequestConfig,
  RequestDefaults,
  RequestHeaders,
  RequestResponse,
  RequestTask,
  ResolvedRequestConfig,
  ResponseTransformContext,
  ResponseTransformer,
  TransferTask,
  TaskListener,
  UploadConfig,
  UploadResponse,
  DownloadResponse
} from './types'
