import {
  LuchRequestError
} from './LuchRequestError'
import type {
  AnyLuchResponse,
  AnyRequestConfig,
  NativeTask,
  ResolvedRequestConfig
} from '../types'

/** 默认仅接受 2xx HTTP 状态。 */
export const defaultValidateStatus = (status: number): boolean => (
  status >= 200 && status < 300
)

/**
 * 支付宝等平台可能返回字符串状态码，只归一化有限数字。
 */
function normalizeStatus(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (
    typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isFinite(Number(value))
  ) {
    return Number(value)
  }

  return undefined
}

/**
 * 在不丢弃平台新增字段的前提下，为原始响应附加请求上下文。
 */
export function createResponse(
  raw: object,
  config: ResolvedRequestConfig<AnyRequestConfig>,
  task: NativeTask | undefined
): AnyLuchResponse {
  const response: AnyLuchResponse = {
    ...raw,
    config,
    raw
  }

  if (task) {
    response.task = task
  }

  return response
}

/**
 * 根据 validateStatus 决定 resolve 或抛出统一状态错误。
 * 平台未返回可识别状态码时不猜测结果，直接保留原始响应。
 */
export function settleResponse(
  response: AnyLuchResponse
): AnyLuchResponse {
  const status = normalizeStatus(response.statusCode)

  if (status === undefined) {
    return response
  }

  response.statusCode = status

  let accepted: boolean

  try {
    accepted = response.config.validateStatus(status)
  } catch (error) {
    throw new LuchRequestError(
      'validateStatus execution failed',
      LuchRequestError.ERR_INVALID_CONFIG,
      {
        config: response.config,
        task: response.task,
        response,
        cause: error
      }
    )
  }

  if (!accepted) {
    throw new LuchRequestError(
      `Request failed with status code ${status}`,
      LuchRequestError.ERR_BAD_STATUS,
      {
        config: response.config,
        task: response.task,
        response,
        raw: response.raw
      }
    )
  }

  return response
}
