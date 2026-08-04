import type { NativeTask } from '../types'

/**
 * native 表示已调用原生 Task.abort，logical 表示只停止本库后续流程。
 */
export const CancellationMode = {
  NATIVE: 'native',
  LOGICAL: 'logical'
} as const

/** 调用方可稳定判断的取消模式，由同名运行时常量推导。 */
export type CancellationMode =
  typeof CancellationMode[keyof typeof CancellationMode]

/** 创建 LuchRequestError 时保留的请求上下文和原始信息。 */
export interface LuchRequestErrorOptions<
  TConfig = unknown,
  TResponse = unknown
> {
  config?: TConfig | undefined
  task?: NativeTask | undefined
  response?: TResponse | undefined
  cause?: unknown
  raw?: unknown
  cancelMode?: CancellationMode | undefined
}

/** toJSON 返回的稳定错误摘要；上下文字段保留原始引用。 */
export interface LuchRequestErrorJSON<TConfig = unknown> {
  name: string
  message: string
  stack: string | undefined
  code: LuchRequestErrorCode
  statusCode: number | string | undefined
  config: TConfig | undefined
  cause: unknown
  raw: unknown
  cancelMode: CancellationMode | undefined
  isLuchRequestError: true
}

/** 从响应中读取 uni 风格状态码，不改变原始响应。 */
function getStatusCode(response: unknown): number | string | undefined {
  if (typeof response !== 'object' || response === null) {
    return undefined
  }

  const statusCode = (
    response as {
      statusCode?: unknown
    }
  ).statusCode

  return typeof statusCode === 'number' || typeof statusCode === 'string'
    ? statusCode
    : undefined
}

/**
 * luch-request 的统一错误。
 * cause/raw 保留平台异常，code 用于跨平台分支判断。
 */
export class LuchRequestError<
  TConfig = unknown,
  TResponse = unknown
> extends Error {
  /** 请求配置无效或当前运行环境缺少必要能力。 */
  static readonly ERR_INVALID_CONFIG = 'ERR_INVALID_CONFIG'
  /** uni API 通过 fail callback 返回网络层失败。 */
  static readonly ERR_NETWORK = 'ERR_NETWORK'
  /** HTTP 状态未通过 validateStatus。 */
  static readonly ERR_BAD_STATUS = 'ERR_BAD_STATUS'
  /** 响应内容无法按调用方要求完成转换。 */
  static readonly ERR_BAD_RESPONSE = 'ERR_BAD_RESPONSE'
  /** 请求被调用方主动取消。 */
  static readonly ERR_CANCELED = 'ERR_CANCELED'
  /** interceptor 执行或错误恢复失败。 */
  static readonly ERR_INTERCEPTOR = 'ERR_INTERCEPTOR'

  /** 稳定的跨平台错误分类。 */
  readonly code: LuchRequestErrorCode
  /** 错误发生时请求管线正在使用的配置。 */
  readonly config: TConfig | undefined
  /** 已创建时保留对应的原生 Task。 */
  readonly task: NativeTask | undefined
  /** HTTP 状态失败时保留完整响应。 */
  readonly response: TResponse | undefined
  /** 导致当前错误的底层异常或取消原因。 */
  readonly cause?: unknown
  /** 未转换的平台原始错误或取消原因。 */
  readonly raw?: unknown
  /** 取消错误使用的实际中断模式。 */
  readonly cancelMode: CancellationMode | undefined
  /** 供类型守卫和跨包识别使用的固定标记。 */
  readonly isLuchRequestError = true

  constructor(
    message: string,
    code: LuchRequestErrorCode,
    options: LuchRequestErrorOptions<TConfig, TResponse> = {}
  ) {
    super(message)
    this.name = 'LuchRequestError'
    this.code = code
    this.config = options.config
    this.task = options.task
    this.response = options.response
    this.cause = options.cause
    this.raw = options.raw
    this.cancelMode = options.cancelMode
  }

  /**
   * 返回适合检查和日志传递的稳定字段，不克隆上下文或处理循环引用。
   * Task 和完整 response 仍保留在错误实例上，但不进入该摘要。
   */
  toJSON(): LuchRequestErrorJSON<TConfig> {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      code: this.code,
      statusCode: getStatusCode(this.response),
      config: this.config,
      cause: this.cause,
      raw: this.raw,
      cancelMode: this.cancelMode,
      isLuchRequestError: this.isLuchRequestError
    }
  }
}

/**
 * 调用方可稳定判断的错误分类，由 LuchRequestError 静态常量推导。
 */
export type LuchRequestErrorCode =
  | typeof LuchRequestError.ERR_INVALID_CONFIG
  | typeof LuchRequestError.ERR_NETWORK
  | typeof LuchRequestError.ERR_BAD_STATUS
  | typeof LuchRequestError.ERR_BAD_RESPONSE
  | typeof LuchRequestError.ERR_CANCELED
  | typeof LuchRequestError.ERR_INTERCEPTOR

/**
 * 跨包和跨运行环境识别错误，不依赖可能失效的 instanceof。
 */
export function isLuchRequestError<
  TConfig = unknown,
  TResponse = unknown
>(
  value: unknown
): value is LuchRequestError<TConfig, TResponse> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'isLuchRequestError' in value &&
    value.isLuchRequestError === true
  )
}
