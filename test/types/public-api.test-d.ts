import type {
  AbortSignalLike,
  CancelSource,
  LuchDownloadNativeOptions,
  LuchMeta,
  LuchNativeOptions,
  InterceptorManager,
  LuchRequestErrorCode,
  LuchRequestErrorJSON,
  LuchRequestControl,
  LuchRequestNativeOptions,
  LuchUploadNativeOptions,
  NativeAbortErrorContext,
  NativeAbortErrorDetector,
  NativeRequestResponse,
  QueryParams,
  RequestConfig,
  RequestHeaders,
  ResolvedRequestConfig,
  ResponseTransformContext,
  ResponseTransformer,
  TaskListener
} from '../../src'
import {
  CancellationMode,
  createCancelSource,
  createLuchRequest,
  isLuchRequestError,
  JSONParsingMode,
  LuchOperation,
  LuchRequestError
} from '../../src'

// @ts-expect-error mergeConfig 是内部配置合并策略，不属于公共入口
import { mergeConfig } from '../../src'

// @ts-expect-error AnyRequestConfig 是内部管线宽类型
import type { AnyRequestConfig } from '../../src'

// @ts-expect-error AnyLuchResponse 是内部管线宽类型
import type { AnyLuchResponse } from '../../src'

void mergeConfig
void ({} as AnyRequestConfig)
void ({} as AnyLuchResponse)

declare module '../../src' {
  interface LuchMeta {
    requiresAuth?: boolean
    traceName?: string
  }

  interface LuchRequestNativeOptions {
    enableProfile?: boolean
  }

  interface LuchUploadNativeOptions {
    enableBackgroundUpload?: boolean
  }

  interface LuchDownloadNativeOptions {
    useDownloadCache?: boolean
  }
}

const config: RequestConfig<
  { name: string },
  { page: number; keyword?: string },
  { platformTraceId?: string }
> = {
  url: '/users',
  data: {
    name: 'Ada'
  },
  params: {
    page: 1,
    keyword: 'Ada'
  },
  paramsSerializer: (params) => {
    const page: number = params.page
    const keyword: string | undefined = params.keyword
    void keyword
    return `page=${page}`
  },
  luchMeta: {
    requiresAuth: true,
    traceName: 'create-user'
  },
  onTask(nativeTask, control) {
    nativeTask.onHeadersReceived?.(() => {})
    control.abort('取消请求')
    // @ts-expect-error 普通 RequestTask 没有上传下载进度 API
    nativeTask.onProgressUpdate?.(() => {})
  },
  nativeOptions: {
    enableProfile: true,
    platformTraceId: 'trace-id'
  }
}

const response: NativeRequestResponse<{ id: number }> = {
  data: {
    id: 1
  },
  statusCode: 200,
  header: {}
}

void config
void response
void ({} as LuchNativeOptions)
void ({} as LuchMeta)
void ({} as LuchRequestNativeOptions)
void ({} as LuchUploadNativeOptions)
void ({} as LuchDownloadNativeOptions)

const canceledCode: LuchRequestErrorCode =
  LuchRequestError.ERR_CANCELED
const canceledError = new LuchRequestError(
  '用户主动取消',
  canceledCode,
  {
    cancelMode: CancellationMode.LOGICAL
  }
)

void canceledError

const canceledJSON: LuchRequestErrorJSON = canceledError.toJSON()
const canceledStatus: number | string | undefined =
  canceledJSON.statusCode
void canceledStatus

// @ts-expect-error phase 不属于公开错误模型
void canceledError.phase

// @ts-expect-error toJSON 摘要不包含 phase
void canceledJSON.phase

// @ts-expect-error toJSON 摘要不包含原生 Task
void canceledJSON.task

// @ts-expect-error toJSON 摘要不包含完整响应
void canceledJSON.response

const nativeMode: CancellationMode = CancellationMode.NATIVE
void nativeMode

const uploadOperation: LuchOperation = LuchOperation.UPLOAD
void uploadOperation

const automaticJSONParsingMode: JSONParsingMode = JSONParsingMode.AUTO
const strictJSONParsingMode: JSONParsingMode = JSONParsingMode.STRICT
void automaticJSONParsingMode
void strictJSONParsingMode

const cancelSource: CancelSource = createCancelSource()
const portableSignal: AbortSignalLike = cancelSource.signal
const cancelSourceHTTP = createLuchRequest()
cancelSource.cancel({
  type: 'page-unload'
})
cancelSourceHTTP.get('/cancel-source', {
  signal: portableSignal
})
cancelSourceHTTP.get('/invalid-cancel-source', {
  // @ts-expect-error signal 只接受 source.signal，不接受整个 source
  signal: cancelSource
})

const nativeAbortDetector: NativeAbortErrorDetector = (
  error,
  context
) => {
  const typedContext: NativeAbortErrorContext = context
  const operation: LuchOperation = context.operation
  const fullURL: string = context.config.fullURL
  const task = context.task
  void error
  void typedContext
  void operation
  void fullURL
  void task
  return true
}

createLuchRequest({
  luchOptions: {
    isNativeAbortError: nativeAbortDetector
  }
})

createLuchRequest({
  luchOptions: {
    // @ts-expect-error 原生 abort 识别器必须返回 boolean
    isNativeAbortError: () => 'yes'
  }
})

// @ts-expect-error 未声明的错误码不能赋给公开错误码类型
const unknownCode: LuchRequestErrorCode = 'ERR_UNKNOWN'
void unknownCode

// @ts-expect-error 未声明的取消模式不能赋给公开取消模式类型
const unknownMode: CancellationMode = 'physical'
void unknownMode

const http = createLuchRequest({
  baseURL: 'https://api.example.com',
  method: 'POST'
})

createLuchRequest({
  // @ts-expect-error onTask 只允许配置在单次调用中
  onTask: () => {}
})
const defaultMethod: string | undefined = http.defaults.method
const acceptsOK: boolean = http.defaults.validateStatus(200)
const transformResponse: ResponseTransformer = (data, context) => {
  const operation: LuchOperation = context.operation
  const statusCode: number | undefined = context.statusCode
  const statusAccepted: boolean = context.statusAccepted
  const header: Readonly<RequestHeaders> | undefined = context.header
  const url: string = context.config.url
  void operation
  void statusCode
  void statusAccepted
  void header
  void url
  return data
}
const readTransformContext = (context: ResponseTransformContext): void => {
  const config: Readonly<ResolvedRequestConfig> = context.config
  void config
}
http.defaults.transformResponse = [
  ...http.defaults.transformResponse,
  transformResponse
]
http.get('/transform', {
  transformResponse: [transformResponse]
})
http.get('/invalid-transform', {
  // @ts-expect-error transformResponse 只接受函数数组
  transformResponse: ['invalid']
})
void defaultMethod
void acceptsOK
void readTransformContext
const pending = http.request<{ id: number }>({
  url: '/users/1',
  nativeOptions: {
    enableProfile: true,
    enableFutureOption: true
  }
})

pending.onTask((task, control) => {
  task.abort?.()
  const requestControl: LuchRequestControl = control
  requestControl.abort('取消请求')
})

const requestTaskListener: TaskListener<
  NonNullable<typeof pending.task>
> = (nativeTask, control) => {
  nativeTask.onHeadersReceived?.(() => {})
  control.abort()
}
void requestTaskListener

pending.then((result) => {
  const id: number = result.data.id
  const originalURL: string = result.config.url
  const fullURL: string = result.config.fullURL
  const responseHeader: RequestHeaders = result.header
  void id
  void originalURL
  void fullURL
  void responseHeader
})

interface UserListParams {
  page: number
  pageSize: number
  keyword?: string
}

const typedParamsPending = http.get<
  { id: number }[],
  UserListParams
>('/users', {
  params: {
    page: 1,
    pageSize: 20
  },
  paramsSerializer: (params) => {
    const page: number = params.page
    const keyword: string | undefined = params.keyword
    void keyword
    return `page=${page}`
  }
})

typedParamsPending.then((result) => {
  const finalParams: object | undefined = result.config.params
  void finalParams
})

const userListParams: UserListParams = {
  page: 1,
  pageSize: 20
}

http.get<{ id: number }[]>('/users', {
  params: userListParams
})

http.get<{ id: number }[], UserListParams>('/users', {
  params: {
    // @ts-expect-error page 必须是 number
    page: '1',
    pageSize: 20
  }
})

http.interceptors.request.use((requestConfig, context) => {
  const operation: LuchOperation = context.operation
  const accepted: boolean = requestConfig.validateStatus(200)
  const method: string | undefined = requestConfig.method
  void operation
  void accepted
  void method
  // @ts-expect-error fullURL 在请求拦截器完成后才生成
  void requestConfig.fullURL
  // @ts-expect-error 请求拦截器不能设置内部生成的 fullURL
  requestConfig.fullURL = 'https://evil.example.com'
  return requestConfig
})

type RequestInterceptorConfig = Parameters<
  Parameters<typeof http.interceptors.request.use>[0]
>[0]
const requestInterceptors: InterceptorManager<RequestInterceptorConfig> =
  http.interceptors.request
void requestInterceptors

// @ts-expect-error InterceptorManager 仅作为类型导出，不能直接实例化
new InterceptorManager<RequestInterceptorConfig>()

// @ts-expect-error 公共 interceptor 管理器不暴露内部遍历方法
http.interceptors.request.forEach(() => {})

const resolvedConfig = {} as ResolvedRequestConfig<RequestConfig>
const resolvedURL: string = resolvedConfig.fullURL
const resolvedAccepted: boolean = resolvedConfig.validateStatus(200)
void resolvedURL
void resolvedAccepted

http.post<{ id: number }, { name: string }>(
  '/users',
  {
    name: 'Ada'
  }
)

http.post<
  { id: number },
  { name: string },
  UserListParams
>(
  '/users',
  {
    name: 'Ada'
  },
  {
    params: {
      page: 1,
      pageSize: 20
    }
  }
).then((result) => {
  const finalData: unknown = result.config.data
  const finalParams: object | undefined = result.config.params
  void finalData
  void finalParams
})

http.request({
  url: '/users',
  // @ts-expect-error 未声明的顶层字段不能绕过 nativeOptions
  enableFutureOption: true
})

http.request({
  url: '/users',
  // @ts-expect-error v4 使用 luchMeta，不再接受 custom
  custom: {
    requiresAuth: true
  }
})

http.request<unknown, unknown, QueryParams, {
  platformTraceId?: string
}>({
  url: '/users',
  nativeOptions: {
    platformTraceId: 'trace-id'
  }
})

declare const caughtError: unknown

if (
  isLuchRequestError<
    RequestConfig<{ name: string }, UserListParams>
  >(caughtError)
) {
  const errorPage: number | undefined =
    caughtError.config?.params?.page
  void errorPage
}

http.upload({
  url: '/upload',
  filePath: '/tmp/avatar.png',
  name: 'file',
  onTask(nativeTask, control) {
    nativeTask.onProgressUpdate?.((event) => {
      const progress: number = event.progress
      void progress
    })
    control.abort('取消上传')
  },
  nativeOptions: {
    enableBackgroundUpload: true
  }
})

http.upload<{
  code: number
}>({
  url: '/upload-json',
  filePath: '/tmp/avatar.png',
  name: 'file',
  luchOptions: {
    jsonParsing: {
      include: [
        LuchOperation.UPLOAD
      ],
      mode: JSONParsingMode.STRICT
    }
  }
}).then((result) => {
  if (typeof result.data !== 'string') {
    const code: number = result.data.code
    void code
  }
})

http.upload<{
  code: number
}, {
  platformTraceId?: string
}>({
  url: '/upload-json-native-options',
  filePath: '/tmp/avatar.png',
  name: 'file',
  nativeOptions: {
    platformTraceId: 'trace-id'
  }
})

http.upload({
  url: '/upload-text',
  filePath: '/tmp/avatar.png',
  name: 'file',
  luchOptions: {
    jsonParsing: false
  }
})

http.upload({
  url: '/upload-invalid-operation',
  filePath: '/tmp/avatar.png',
  name: 'file',
  luchOptions: {
    jsonParsing: {
      include: [
        // @ts-expect-error operation 使用小写稳定值
        'UPLOAD'
      ]
    }
  }
})

http.download({
  url: '/download',
  onTask(nativeTask, control) {
    nativeTask.onProgressUpdate?.(() => {})
    control.abort('取消下载')
  },
  nativeOptions: {
    useDownloadCache: true
  }
}).then((result) => {
  const tempFilePath: string | undefined = result.tempFilePath
  const apFilePath: string | undefined = result.apFilePath
  const filePath: string | undefined = result.filePath
  void tempFilePath
  void apFilePath
  void filePath
})

http.request({
  url: '/users',
  // @ts-expect-error callback 由 luch-request 内部保留
  success: () => {}
})

http.request({
  url: '/users',
  // @ts-expect-error URL 由 luch-request 统一解析
  nativeOptions: {
    url: 'https://evil.example.com'
  }
})

http.request({
  url: '/users',
  // @ts-expect-error fullURL 是响应上下文，不是原生配置
  nativeOptions: {
    fullURL: 'https://evil.example.com'
  }
})
