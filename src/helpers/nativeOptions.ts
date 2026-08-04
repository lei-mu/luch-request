import { LuchOperation } from '../core/LuchOperation'
import type { AnyRequestConfig } from '../types'

const blockedKeys = new Set([
  '__proto__',
  'constructor',
  'prototype'
])

// 三类 uni API 共用的顶层参数。
const commonNativeKeys = [
  'url',
  'header',
  'timeout'
]

const requestNativeKeys = new Set([
  ...commonNativeKeys,
  'data',
  'method',
  'dataType',
  'responseType',
  'sslVerify',
  'withCredentials',
  'firstIpv4',
  'enableHttp2',
  'enableQuic',
  'enableCache',
  'enableHttpDNS',
  'httpDNSServiceId',
  'enableChunked',
  'forceCellularNetwork',
  'enableCookie',
  'cloudCache',
  'defer'
])

const uploadNativeKeys = new Set([
  ...commonNativeKeys,
  'filePath',
  'name',
  'files',
  'formData'
])

const downloadNativeKeys = new Set([
  ...commonNativeKeys,
  'filePath'
])

const allKnownNativeKeys = new Set([
  ...requestNativeKeys,
  ...uploadNativeKeys,
  ...downloadNativeKeys
])

// URL 由库统一生成，callback 由 adapter 接管，均禁止 nativeOptions 覆盖。
const protectedNativeKeys = new Set([
  'url',
  'fullURL',
  'success',
  'fail',
  'complete'
])

/** 派发前删除空 header，避免不同原生 bridge 对 null/undefined 解释不一致。 */
function removeEmptyHeaders(value: unknown): unknown {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return value
  }

  const result: Record<string, unknown> = {}

  const headers = value as Record<string, unknown>

  for (const key of Object.keys(headers)) {
    const headerValue = headers[key]

    if (
      !blockedKeys.has(key) &&
      headerValue !== null &&
      headerValue !== undefined
    ) {
      result[key] = headerValue
    }
  }

  return result
}

/**
 * 只保留已声明的顶层原生字段，再展开 nativeOptions。
 * nativeOptions 用于未建模、平台专有或与 luch-request 重名的参数。
 */
export function toNativeOptions(
  config: AnyRequestConfig,
  fullURL: string,
  operation: LuchOperation
): Record<string, unknown> {
  const result: Record<string, unknown> = Object.create(null)
  const source = config as unknown as Record<string, unknown>
  const allowedKeys = operation === LuchOperation.REQUEST
    ? requestNativeKeys
    : operation === LuchOperation.UPLOAD
      ? uploadNativeKeys
      : downloadNativeKeys

  for (const key of Object.keys(config)) {
    if (!blockedKeys.has(key) && allowedKeys.has(key)) {
      result[key] = source[key]
    }
  }

  const overrides = config.nativeOptions

  if (overrides) {
    for (const key of Object.keys(overrides)) {
      if (
        !blockedKeys.has(key) &&
        !protectedNativeKeys.has(key) &&
        (
          !allKnownNativeKeys.has(key) ||
          allowedKeys.has(key)
        )
      ) {
        result[key] = overrides[key]
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(result, 'header')) {
    result.header = removeEmptyHeaders(result.header)
  }

  // 最后写入内部解析结果，确保任意运行时输入都无法篡改实际请求地址。
  result.url = fullURL

  return result
}
