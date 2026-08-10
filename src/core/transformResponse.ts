import {
  JSONParsingMode
} from './JSONParsingMode'
import {
  LuchOperation
} from './LuchOperation'
import {
  LuchRequestError
} from './LuchRequestError'
import type {
  AnyLuchResponse,
  RequestHeaders,
  ResponseTransformContext,
  ResponseTransformer
} from '../types'

/** 用户未配置时只尝试解析 upload 的字符串 data。 */
const defaultJSONParsingOperations: readonly LuchOperation[] = [
  LuchOperation.UPLOAD
]

/** 区分默认 JSON 解析失败和自定义转换器失败。 */
class JSONResponseParsingError extends Error {
  readonly cause: unknown

  constructor(cause: unknown) {
    super('Response data is not valid JSON')
    this.name = 'JSONResponseParsingError'
    this.cause = cause
  }
}

/** 内置默认 transformer；jsonParsing 仅配置该转换器。 */
export const defaultJSONTransformer: ResponseTransformer = (
  data,
  context
) => {
  const options = context.config.luchOptions?.jsonParsing

  if (options === false) {
    return data
  }

  const include = options?.include ?? defaultJSONParsingOperations

  if (
    !include.includes(context.operation) ||
    typeof data !== 'string'
  ) {
    return data
  }

  try {
    return JSON.parse(data)
  } catch (cause) {
    if (
      (options?.mode ?? JSONParsingMode.AUTO) === JSONParsingMode.AUTO
    ) {
      return data
    }

    throw new JSONResponseParsingError(cause)
  }
}

/** Promise-like 返回值不属于第一版同步 transformer 契约。 */
function isPromiseLike(value: unknown): boolean {
  if (
    (typeof value !== 'object' && typeof value !== 'function') ||
    value === null
  ) {
    return false
  }

  return typeof (value as { then?: unknown }).then === 'function'
}

/** 只在平台确实返回普通响应头对象时向 transformer 暴露。 */
function getResponseHeaders(response: AnyLuchResponse): RequestHeaders | undefined {
  const header = response.header

  return typeof header === 'object' && header !== null && !Array.isArray(header)
    ? header as RequestHeaders
    : undefined
}

/**
 * 按顺序转换 response.data；全部成功后一次性写回，raw 始终保留原生响应。
 */
export function transformResponseData(
  response: AnyLuchResponse,
  operation: LuchOperation,
  statusAccepted: boolean
): AnyLuchResponse {
  const transformers = response.config.transformResponse ?? []
  const context: ResponseTransformContext = {
    operation,
    config: response.config,
    statusCode: typeof response.statusCode === 'number'
      ? response.statusCode
      : undefined,
    statusAccepted,
    header: getResponseHeaders(response)
  }
  let transformedData = response.data

  try {
    for (const transformer of transformers) {
      transformedData = transformer(transformedData, context)

      if (isPromiseLike(transformedData)) {
        throw new TypeError(
          'Response transformer must return synchronously'
        )
      }
    }
  } catch (error) {
    const isJSONParsingError = error instanceof JSONResponseParsingError

    throw new LuchRequestError(
      isJSONParsingError
        ? error.message
        : 'Response transformation failed',
      LuchRequestError.ERR_BAD_RESPONSE,
      {
        config: response.config,
        task: response.task,
        response,
        cause: isJSONParsingError ? error.cause : error,
        raw: response.raw
      }
    )
  }

  response.data = transformedData
  return response
}
