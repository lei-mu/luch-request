import { downloadAdapter } from '../adapters/downloadAdapter'
import { requestAdapter } from '../adapters/requestAdapter'
import { uploadAdapter } from '../adapters/uploadAdapter'
import { buildURL, combineURLs } from '../helpers/buildURL'
import { toNativeOptions } from '../helpers/nativeOptions'
import {
  InternalInterceptorManager,
  type InterceptorContext,
  type InterceptorManager
} from './InterceptorManager'
import {
  LuchOperation
} from './LuchOperation'
import {
  JSONParsingMode
} from './JSONParsingMode'
import {
  CancellationMode,
  isLuchRequestError,
  LuchRequestError
} from './LuchRequestError'
import { mergeConfig } from './mergeConfig'
import {
  createControlledPromise,
  type TaskController
} from './TaskController'
import {
  createResponse,
  defaultValidateStatus,
  settleResponse
} from './settle'
import type {
  AnyLuchResponse,
  AnyRequestConfig,
  DownloadConfig,
  DownloadResponse,
  LuchRequestPromise,
  NativeRequestResponse,
  NativeTask,
  RequestConfig,
  RequestDefaults,
  RequestHeaders,
  RequestResponse,
  RequestTask,
  ResolvedRequestConfig,
  TransferTask,
  UploadConfig,
  UploadResponse
} from '../types'

/** 将准备后的原生参数交给对应 uni API 的内部 adapter。 */
type Adapter<TTask extends NativeTask> = (
  options: Record<string, unknown>,
  controller: TaskController<TTask>
) => Promise<object>

/** request interceptor 收到的配置始终包含实际使用的状态校验函数。 */
type InterceptorRequestConfig = AnyRequestConfig & {
  validateStatus: (status: number) => boolean
}

const transferDefaultKeys = new Set([
  'baseURL',
  'header',
  'params',
  'paramsSerializer',
  'luchMeta',
  'validateStatus',
  'signal',
  'timeout',
  'luchOptions'
])

/**
 * 文件操作只继承公共默认配置；实例 nativeOptions 当前属于普通 request。
 */
function getOperationDefaults(
  defaults: RequestDefaults & Record<string, unknown>,
  operation: LuchOperation
): object {
  if (operation === LuchOperation.REQUEST) {
    const requestDefaults = {
      ...defaults
    }
    // onTask 只属于单次调用，运行时传入实例默认值时同样不继承。
    delete requestDefaults.onTask
    return requestDefaults
  }

  const result: Record<string, unknown> = {}

  for (const key of Object.keys(defaults)) {
    if (transferDefaultKeys.has(key)) {
      result[key] = defaults[key]
    }
  }

  return result
}

/** 判断请求头是否包含指定键，比较时忽略大小写。 */
function hasHeader(
  headers: RequestHeaders | undefined,
  target: string
): boolean {
  return headers
    ? Object.keys(headers).some(
        (key) => key.toLowerCase() === target
      )
    : false
}

/** 删除指定请求头；合并结果是内部副本，不会修改调用方对象。 */
function deleteHeader(
  headers: RequestHeaders | undefined,
  target: string
): void {
  if (!headers) {
    return
  }

  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === target) {
      delete headers[key]
    }
  }
}

/** 快捷方法中由方法本身确定、调用方无需重复提供的字段。 */
type RequestMethodConfig<
  TData,
  TParams extends object,
  TNativeOptions extends object
> = Omit<
  RequestConfig<TData, TParams, TNativeOptions>,
  'url' | 'method' | 'data'
>

/** 保留请求体、查询参数和原生扩展类型的普通请求响应。 */
type TypedRequestResponse<
  TResponse
> = RequestResponse<
  TResponse,
  NativeRequestResponse<TResponse>
>

/** 在进入请求管线及 interceptor 返回后校验最小配置契约。 */
function ensureConfig(value: unknown): asserts value is AnyRequestConfig {
  if (typeof value !== 'object' || value === null) {
    throw new LuchRequestError(
      'Request config must be an object',
      LuchRequestError.ERR_INVALID_CONFIG,
      {
        raw: value
      }
    )
  }

  const url = (value as { url?: unknown }).url

  if (typeof url !== 'string' || url.trim() === '') {
    throw new LuchRequestError(
      'Request config must include a non-empty url',
      LuchRequestError.ERR_INVALID_CONFIG,
      {
        config: value
      }
    )
  }
}

/** 校验 luchOptions 中需要参与请求管线判断的配置。 */
function ensureLuchOptions(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    return
  }

  const luchOptions = (
    value as {
      luchOptions?: unknown
    }
  ).luchOptions

  if (luchOptions === undefined) {
    return
  }

  if (
    typeof luchOptions !== 'object' ||
    luchOptions === null ||
    Array.isArray(luchOptions)
  ) {
    throw new TypeError('luchOptions must be an object')
  }

  const options = luchOptions as {
    isNativeAbortError?: unknown
    jsonParsing?: unknown
  }

  if (
    options.isNativeAbortError !== undefined &&
    typeof options.isNativeAbortError !== 'function'
  ) {
    throw new TypeError('isNativeAbortError must be a function')
  }

  const jsonParsing = options.jsonParsing

  if (jsonParsing === undefined || jsonParsing === false) {
    return
  }

  if (
    typeof jsonParsing !== 'object' ||
    jsonParsing === null ||
    Array.isArray(jsonParsing)
  ) {
    throw new TypeError('jsonParsing must be an object or false')
  }

  const jsonParsingOptions = jsonParsing as {
    include?: unknown
    mode?: unknown
  }

  if (
    jsonParsingOptions.include !== undefined &&
    (
      !Array.isArray(jsonParsingOptions.include) ||
      jsonParsingOptions.include.some((operation) => (
        operation !== LuchOperation.REQUEST &&
        operation !== LuchOperation.UPLOAD &&
        operation !== LuchOperation.DOWNLOAD
      ))
    )
  ) {
    throw new TypeError(
      'jsonParsing.include contains an unknown operation'
    )
  }

  if (
    jsonParsingOptions.mode !== undefined &&
    jsonParsingOptions.mode !== 'strict' &&
    jsonParsingOptions.mode !== 'auto'
  ) {
    throw new TypeError(
      'jsonParsing.mode must be "strict" or "auto"'
    )
  }
}

/**
 * 在 request interceptor 前后补齐并校验会影响请求行为的默认配置。
 * method 只属于普通 request，文件上传和下载不会继承实例默认 method。
 */
function normalizeBehaviorConfig(
  config: AnyRequestConfig,
  operation: LuchOperation
): InterceptorRequestConfig {
  try {
    const validateStatus = config.validateStatus === undefined
      ? defaultValidateStatus
      : config.validateStatus

    if (typeof validateStatus !== 'function') {
      throw new TypeError('validateStatus must be a function')
    }

    if (
      config.onTask !== undefined &&
      typeof config.onTask !== 'function'
    ) {
      throw new TypeError('onTask must be a function')
    }

    const result: InterceptorRequestConfig = {
      ...config,
      validateStatus
    }

    if (operation === LuchOperation.REQUEST) {
      const method = config.method === undefined
        ? 'GET'
        : config.method

      if (typeof method !== 'string' || method.trim() === '') {
        throw new TypeError('method must be a non-empty string')
      }

      result.method = method.toUpperCase()
    } else {
      delete result.method
    }

    return result
  } catch (error) {
    if (isLuchRequestError(error)) {
      throw error
    }

    throw new LuchRequestError(
      'Failed to normalize request config',
      LuchRequestError.ERR_INVALID_CONFIG,
      {
        config,
        cause: error
      }
    )
  }
}

/** 在 request interceptor 完成后生成最终派发地址。 */
function resolveConfig(
  config: InterceptorRequestConfig
): ResolvedRequestConfig<AnyRequestConfig> {
  try {
    const combinedURL = combineURLs(
      config.baseURL ?? '',
      config.url
    )
    const fullURL = buildURL(
      combinedURL,
      config.params,
      config.paramsSerializer
    )

    return {
      ...config,
      fullURL
    }
  } catch (error) {
    if (isLuchRequestError(error)) {
      throw error
    }

    throw new LuchRequestError(
      'Failed to normalize request config',
      LuchRequestError.ERR_INVALID_CONFIG,
      {
        config,
        cause: error
      }
    )
  }
}

/**
 * 为任意异常逐字段补齐当前 config、task 和 response，并保留统一错误分类。
 */
function toContextError(
  error: unknown,
  code:
    | typeof LuchRequestError.ERR_INVALID_CONFIG
    | typeof LuchRequestError.ERR_NETWORK
    | typeof LuchRequestError.ERR_INTERCEPTOR,
  message: string,
  config: AnyRequestConfig,
  task: NativeTask | undefined,
  response?: unknown,
  includeRaw = true
): LuchRequestError {
  if (isLuchRequestError(error)) {
    const resolvedConfig = error.config === undefined
      ? config
      : error.config
    const resolvedTask = error.task === undefined
      ? task
      : error.task
    const resolvedResponse = error.response === undefined
      ? response
      : error.response

    if (
      resolvedConfig === error.config &&
      resolvedTask === error.task &&
      resolvedResponse === error.response
    ) {
      return error
    }

    return new LuchRequestError(
      error.message,
      error.code,
      {
        config: resolvedConfig,
        task: resolvedTask,
        response: resolvedResponse,
        cause: error.cause ?? error,
        raw: error.raw,
        cancelMode: error.cancelMode
      }
    )
  }

  return new LuchRequestError(
    message,
    code,
    {
      config,
      task,
      response,
      cause: error,
      raw: includeRaw ? error : undefined
    }
  )
}

/** interceptor 普通异常优先暴露自身消息，非 Error 值使用稳定兜底文案。 */
function getInterceptorErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (typeof error === 'string' && error !== '') {
    return error
  }

  if (typeof error !== 'object' || error === null) {
    return fallback
  }

  const message = (error as { message?: unknown }).message
  return typeof message === 'string' && message !== ''
    ? message
    : fallback
}

/** 平台网络失败优先暴露原始消息，无法识别时使用稳定兜底文案。 */
function getNetworkErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (typeof error === 'object' && error !== null) {
    const errorRecord = error as Record<string, unknown>
    const errMsg = errorRecord.errMsg

    if (typeof errMsg === 'string' && errMsg.trim() !== '') {
      return errMsg
    }

    const message = errorRecord.message

    if (typeof message === 'string' && message.trim() !== '') {
      return message
    }
  }

  return typeof error === 'string' && error.trim() !== ''
    ? error
    : fallback
}

/**
 * 识别原生 Task.abort() 进入 fail callback 后的跨平台常见错误形态。
 * 只匹配明确的 abort 标记，避免把普通网络失败误判为用户取消。
 */
function defaultIsNativeAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const errorRecord = error as Record<string, unknown>

  if (errorRecord.name === 'AbortError') {
    return true
  }

  const message = typeof errorRecord.errMsg === 'string'
    ? errorRecord.errMsg
    : errorRecord.message

  return typeof message === 'string' &&
    /(?:^|:)fail(?:ed)?\s+abort(?:ed)?$/i.test(message.trim())
}

/**
 * 使用单次请求覆盖或内置规则识别原生 abort；用户检测器异常不覆盖原错误。
 */
function detectNativeAbortError(
  error: unknown,
  config: ResolvedRequestConfig,
  operation: LuchOperation,
  task: NativeTask | undefined
): boolean {
  const detector = config.luchOptions?.isNativeAbortError ??
    defaultIsNativeAbortError

  try {
    return detector(error, {
      operation,
      config,
      task
    })
  } catch {
    return false
  }
}

/** 接入当前配置的 signal，并统一转换结构实现异常。 */
function connectConfigSignal<TTask extends NativeTask>(
  controller: TaskController<TTask>,
  config: AnyRequestConfig
): void {
  try {
    controller.connectSignal(config.signal)
  } catch (error) {
    throw new LuchRequestError(
      'Failed to attach the signal listener',
      LuchRequestError.ERR_INVALID_CONFIG,
      {
        config,
        cause: error
      }
    )
  }
}

/**
 * 按注册顺序将 interceptor 接入 Promise 链。
 * interceptor 自身抛出的错误在当前位置统一补充请求上下文。
 */
function applyInterceptors<TValue>(
  promise: Promise<TValue>,
  manager: InternalInterceptorManager<TValue>,
  getConfig: () => AnyRequestConfig,
  operation: LuchOperation,
  getResponse?: (value: TValue) => AnyLuchResponse | undefined
): Promise<TValue> {
  let chain = promise

  manager.forEach((handler) => {
    chain = chain.then(
      async (value) => {
        try {
          const interceptorContext: InterceptorContext = {
            operation
          }
          return await handler.fulfilled(value, interceptorContext)
        } catch (error) {
          const response = getResponse?.(value)
          throw toContextError(
            error,
            LuchRequestError.ERR_INTERCEPTOR,
            getInterceptorErrorMessage(
              error,
              'Interceptor execution failed'
            ),
            getConfig(),
            response?.task,
            response,
            false
          )
        }
      },
      handler.rejected
        ? async (error) => {
            try {
              const interceptorContext: InterceptorContext = {
                operation
              }
              return await handler.rejected!(
                error,
                interceptorContext
              )
            } catch (rejectedError) {
              const failedError = isLuchRequestError(error)
                ? error
                : undefined
              throw toContextError(
                rejectedError,
                LuchRequestError.ERR_INTERCEPTOR,
                getInterceptorErrorMessage(
                  rejectedError,
                  'Interceptor rejection handler failed'
                ),
                getConfig(),
                failedError?.task,
                failedError?.response,
                false
              )
            }
          }
        : undefined
    )
  })

  return chain
}

/** 用户未配置时只尝试解析 upload 的字符串 data。 */
const defaultJSONParsingOperations: readonly LuchOperation[] = [
  LuchOperation.UPLOAD
]

/**
 * 按 luchOptions 解析字符串 data；raw 始终保留平台原始响应。
 */
function transformResponseData(
  response: AnyLuchResponse,
  operation: LuchOperation
): AnyLuchResponse {
  const options = response.config.luchOptions?.jsonParsing

  if (options === false) {
    return response
  }

  const include = options?.include ?? defaultJSONParsingOperations

  if (
    !include.includes(operation) ||
    typeof response.data !== 'string'
  ) {
    return response
  }

  try {
    response.data = JSON.parse(response.data)
    return response
  } catch (cause) {
    if (
      (options?.mode ?? JSONParsingMode.AUTO) === JSONParsingMode.AUTO
    ) {
      return response
    }

    throw new LuchRequestError(
      'Response data is not valid JSON',
      LuchRequestError.ERR_BAD_RESPONSE,
      {
        config: response.config,
        task: response.task,
        response,
        cause,
        raw: response.raw
      }
    )
  }
}

/**
 * 单个 luch-request 实例的内部实现。
 * 实例之间的默认配置和 interceptor 完全隔离。
 */
export class LuchRequest<TNativeOptions extends object = {}> {
  private readonly requestInterceptors =
    new InternalInterceptorManager<InterceptorRequestConfig>()
  private readonly responseInterceptors =
    new InternalInterceptorManager<AnyLuchResponse>()

  /** 已合并 luch-request 行为默认值的实例默认配置。 */
  readonly defaults: RequestDefaults<TNativeOptions> & {
    validateStatus: (status: number) => boolean
  }
  /** request 与 response 使用各自独立的 interceptor 管理器。 */
  readonly interceptors: {
    request: InterceptorManager<InterceptorRequestConfig>
    response: InterceptorManager<AnyLuchResponse>
  } = {
    request: this.requestInterceptors,
    response: this.responseInterceptors
  }

  constructor(defaults: RequestDefaults<TNativeOptions>) {
    this.defaults = mergeConfig(
      {
        validateStatus: defaultValidateStatus
      },
      defaults
    )
  }

  /** 使用完整配置发起普通网络请求。 */
  request<
    TResponse = unknown,
    TData = unknown,
    TParams extends object = object,
    TNativeOptions extends object = {}
  >(
    config: RequestConfig<TData, TParams, TNativeOptions>
  ): LuchRequestPromise<
    TypedRequestResponse<TResponse>,
    RequestTask
  > {
    return this.start(
      config as unknown as AnyRequestConfig,
      requestAdapter,
      LuchOperation.REQUEST
    ) as unknown as LuchRequestPromise<
      TypedRequestResponse<TResponse>,
      RequestTask
    >
  }

  /** 发起 GET 请求。 */
  get<
    TResponse = unknown,
    TParams extends object = object,
    TNativeOptions extends object = {}
  >(
    url: string,
    config?: RequestMethodConfig<
      never,
      TParams,
      TNativeOptions
    >
  ): LuchRequestPromise<
    TypedRequestResponse<TResponse>,
    RequestTask
  > {
    return this.start(
      {
        ...config,
        url,
        method: 'GET'
      } as unknown as AnyRequestConfig,
      requestAdapter,
      LuchOperation.REQUEST
    ) as unknown as LuchRequestPromise<
      TypedRequestResponse<TResponse>,
      RequestTask
    >
  }

  /** 发起 DELETE 请求。 */
  delete<
    TResponse = unknown,
    TParams extends object = object,
    TNativeOptions extends object = {}
  >(
    url: string,
    config?: RequestMethodConfig<
      never,
      TParams,
      TNativeOptions
    >
  ): LuchRequestPromise<
    TypedRequestResponse<TResponse>,
    RequestTask
  > {
    return this.start(
      {
        ...config,
        url,
        method: 'DELETE'
      } as unknown as AnyRequestConfig,
      requestAdapter,
      LuchOperation.REQUEST
    ) as unknown as LuchRequestPromise<
      TypedRequestResponse<TResponse>,
      RequestTask
    >
  }

  /** 发起 HEAD 请求。 */
  head<
    TResponse = unknown,
    TParams extends object = object,
    TNativeOptions extends object = {}
  >(
    url: string,
    config?: RequestMethodConfig<
      never,
      TParams,
      TNativeOptions
    >
  ): LuchRequestPromise<
    TypedRequestResponse<TResponse>,
    RequestTask
  > {
    return this.start(
      {
        ...config,
        url,
        method: 'HEAD'
      } as unknown as AnyRequestConfig,
      requestAdapter,
      LuchOperation.REQUEST
    ) as unknown as LuchRequestPromise<
      TypedRequestResponse<TResponse>,
      RequestTask
    >
  }

  /** 发起 OPTIONS 请求。 */
  options<
    TResponse = unknown,
    TParams extends object = object,
    TNativeOptions extends object = {}
  >(
    url: string,
    config?: RequestMethodConfig<
      never,
      TParams,
      TNativeOptions
    >
  ): LuchRequestPromise<
    TypedRequestResponse<TResponse>,
    RequestTask
  > {
    return this.start(
      {
        ...config,
        url,
        method: 'OPTIONS'
      } as unknown as AnyRequestConfig,
      requestAdapter,
      LuchOperation.REQUEST
    ) as unknown as LuchRequestPromise<
      TypedRequestResponse<TResponse>,
      RequestTask
    >
  }

  /** 发起 POST 请求，第二个参数作为请求体。 */
  post<
    TResponse = unknown,
    TData = unknown,
    TParams extends object = object,
    TNativeOptions extends object = {}
  >(
    url: string,
    data?: TData,
    config?: RequestMethodConfig<
      TData,
      TParams,
      TNativeOptions
    >
  ): LuchRequestPromise<
    TypedRequestResponse<TResponse>,
    RequestTask
  > {
    const requestConfig = {
      ...config,
      url,
      method: 'POST'
    } as unknown as AnyRequestConfig

    if (data !== undefined) {
      requestConfig.data = data
    }

    return this.start(
      requestConfig,
      requestAdapter,
      LuchOperation.REQUEST
    ) as unknown as LuchRequestPromise<
      TypedRequestResponse<TResponse>,
      RequestTask
    >
  }

  /** 发起 PUT 请求，第二个参数作为请求体。 */
  put<
    TResponse = unknown,
    TData = unknown,
    TParams extends object = object,
    TNativeOptions extends object = {}
  >(
    url: string,
    data?: TData,
    config?: RequestMethodConfig<
      TData,
      TParams,
      TNativeOptions
    >
  ): LuchRequestPromise<
    TypedRequestResponse<TResponse>,
    RequestTask
  > {
    const requestConfig = {
      ...config,
      url,
      method: 'PUT'
    } as unknown as AnyRequestConfig

    if (data !== undefined) {
      requestConfig.data = data
    }

    return this.start(
      requestConfig,
      requestAdapter,
      LuchOperation.REQUEST
    ) as unknown as LuchRequestPromise<
      TypedRequestResponse<TResponse>,
      RequestTask
    >
  }

  /** 发起 PATCH 请求，第二个参数作为请求体。 */
  patch<
    TResponse = unknown,
    TData = unknown,
    TParams extends object = object,
    TNativeOptions extends object = {}
  >(
    url: string,
    data?: TData,
    config?: RequestMethodConfig<
      TData,
      TParams,
      TNativeOptions
    >
  ): LuchRequestPromise<
    TypedRequestResponse<TResponse>,
    RequestTask
  > {
    const requestConfig = {
      ...config,
      url,
      method: 'PATCH'
    } as unknown as AnyRequestConfig

    if (data !== undefined) {
      requestConfig.data = data
    }

    return this.start(
      requestConfig,
      requestAdapter,
      LuchOperation.REQUEST
    ) as unknown as LuchRequestPromise<
      TypedRequestResponse<TResponse>,
      RequestTask
    >
  }

  /** 发起文件上传并返回可访问 UploadTask 的增强 Promise。 */
  upload<
    TResponse = unknown,
    TNativeOptions extends object = {}
  >(
    config: UploadConfig<TNativeOptions>
  ): LuchRequestPromise<
    UploadResponse<TResponse | string>,
    TransferTask
  > {
    return this.start(
      config as unknown as AnyRequestConfig,
      uploadAdapter,
      LuchOperation.UPLOAD
    ) as unknown as LuchRequestPromise<
      UploadResponse<TResponse | string>,
      TransferTask
    >
  }

  /** 发起文件下载并返回可访问 DownloadTask 的增强 Promise。 */
  download<TNativeOptions extends object = {}>(
    config: DownloadConfig<TNativeOptions>
  ): LuchRequestPromise<DownloadResponse, TransferTask> {
    return this.start(
      config as unknown as AnyRequestConfig,
      downloadAdapter,
      LuchOperation.DOWNLOAD
    ) as LuchRequestPromise<DownloadResponse, TransferTask>
  }

  /**
   * 三类请求共用的执行入口：
   * 配置合并 → 行为默认值 → request interceptor → 归一化 → adapter
   * → 状态判定 → response interceptor。
   *
   * @param localConfig 单次调用传入的原始配置。
   * @param adapter 当前请求类型对应的 uni API adapter。
   * @param operation 当前执行的 request、upload 或 download 操作。
   */
  private start<TTask extends NativeTask>(
    localConfig: unknown,
    adapter: Adapter<TTask>,
    operation: LuchOperation
  ): LuchRequestPromise<AnyLuchResponse, TTask> {
    const safeLocalConfig = (
      typeof localConfig === 'object' &&
      localConfig !== null
    )
      ? localConfig as AnyRequestConfig
      : { url: '' }
    const context: {
      config: AnyRequestConfig
    } = {
      config: safeLocalConfig
    }
    return createControlledPromise(
      async (controller) => {
        try {
          ensureConfig(localConfig)
          ensureLuchOptions(this.defaults)
          ensureLuchOptions(localConfig)

          const instanceDefaults = this.defaults as unknown as
            RequestDefaults & Record<string, unknown>
          const mergedConfig = mergeConfig(
            getOperationDefaults(instanceDefaults, operation),
            localConfig
          ) as AnyRequestConfig
          if (
            operation === LuchOperation.UPLOAD &&
            !hasHeader(localConfig.header, 'content-type')
          ) {
            // upload 未显式设置时，让平台生成带 boundary 的 multipart 类型。
            deleteHeader(mergedConfig.header, 'content-type')
          }
          // fullURL 不是输入配置，即使 JavaScript 调用方强行传入也不进入拦截器。
          delete (
            mergedConfig as unknown as Record<string, unknown>
          ).fullURL
          const merged = normalizeBehaviorConfig(
            mergedConfig,
            operation
          )
          context.config = merged

          // 初次归一化后接入 signal，使异步 interceptor 期间也能立即取消。
          connectConfigSignal(controller, merged)
          controller.throwIfCanceled(
            (reason, task, abortCause, cancelMode) => (
              this.createCancelError(
                reason,
                context.config,
                task,
                abortCause,
                cancelMode
              )
            )
          )

          // request interceptor 可以异步返回新配置，因此完成后再次校验。
          const intercepted = applyInterceptors(
            Promise.resolve(merged),
            this.requestInterceptors,
            () => context.config,
            operation
          )
          const dispatched = intercepted.then(async (config) => {
            ensureConfig(config)
            ensureLuchOptions(config)
            const interceptorConfig = {
              ...config
            } as AnyRequestConfig
            // 忽略 request interceptor 通过动态代码注入的 fullURL。
            delete (
              interceptorConfig as unknown as Record<string, unknown>
            ).fullURL
            const requestConfig = normalizeBehaviorConfig(
              interceptorConfig,
              operation
            )
            context.config = requestConfig

            connectConfigSignal(controller, requestConfig)

            controller.throwIfCanceled(
              (reason, task, abortCause, cancelMode) => (
                this.createCancelError(
                  reason,
                  context.config,
                  task,
                  abortCause,
                  cancelMode
                )
              )
            )

            const prepared = resolveConfig(requestConfig)
            context.config = prepared
            let raw: object

            try {
              if (prepared.onTask) {
                controller.onTask(prepared.onTask)
              }

              // 只将原生参数交给 adapter，内部配置不会泄漏给 uni API。
              raw = await adapter(
                toNativeOptions(
                  prepared,
                  prepared.fullURL,
                  operation
                ),
                controller
              )
            } catch (error) {
              controller.throwIfCanceled(
                (reason, task, abortCause, cancelMode) => (
                  this.createCancelError(
                    reason,
                    prepared,
                    task,
                    abortCause,
                    cancelMode
                  )
                )
              )

              if (
                detectNativeAbortError(
                  error,
                  prepared,
                  operation,
                  controller.task
                )
              ) {
                throw this.createCancelError(
                  error,
                  prepared,
                  controller.task,
                  undefined,
                  CancellationMode.NATIVE
                )
              }

              throw toContextError(
                error,
                LuchRequestError.ERR_NETWORK,
                getNetworkErrorMessage(error, 'Network request failed'),
                prepared,
                controller.task
              )
            }

            controller.throwIfCanceled(
              (reason, task, abortCause, cancelMode) => (
                this.createCancelError(
                  reason,
                  context.config,
                  task,
                  abortCause,
                  cancelMode
                )
              )
            )

            const response = settleResponse(
              createResponse(
                raw,
                prepared,
                controller.task
              )
            )

            return transformResponseData(response, operation)
          })

          // 只有成功获得且通过状态检查的响应才进入成功拦截链。
          return await applyInterceptors(
            dispatched,
            this.responseInterceptors,
            () => context.config,
            operation,
            (response) => response
          )
        } catch (error) {
          throw toContextError(
            error,
            LuchRequestError.ERR_INVALID_CONFIG,
            'Request execution failed',
            context.config,
            controller.task
          )
        }
      },
      (reason, task, abortCause, cancelMode) => (
        this.createCancelError(
          reason,
          context.config,
          task,
          abortCause,
          cancelMode
        )
      )
    )
  }

  /** 将任意取消原因转换为稳定的 ERR_CANCELED 错误。 */
  private createCancelError(
    reason: unknown,
    config: AnyRequestConfig,
    task: NativeTask | undefined,
    abortCause: unknown,
    cancelMode: CancellationMode
  ): LuchRequestError {
    const message = typeof reason === 'string' && reason
      ? reason
      : 'Request canceled'

    return new LuchRequestError(
      message,
      LuchRequestError.ERR_CANCELED,
      {
        config,
        task,
        cause: abortCause ?? reason,
        raw: reason,
        cancelMode
      }
    )
  }
}
