import { describe, expect, it } from 'vitest'

import {
  CancellationMode,
  isLuchRequestError,
  LuchRequestError
} from '../../src/core/LuchRequestError'

describe('LuchRequestError', () => {
  it('保留错误分类和原始原因', () => {
    const cause = {
      errMsg: 'request:fail'
    }
    const error = new LuchRequestError(
      '网络请求失败',
      LuchRequestError.ERR_NETWORK,
      {
        cause,
        raw: cause
      }
    )

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('LuchRequestError')
    expect(error.code).toBe('ERR_NETWORK')
    expect(error.cause).toBe(cause)
    expect(error.raw).toBe(cause)
    expect(isLuchRequestError(error)).toBe(true)
  })

  it('公开稳定的错误码静态常量', () => {
    expect(LuchRequestError.ERR_INVALID_CONFIG).toBe(
      'ERR_INVALID_CONFIG'
    )
    expect(LuchRequestError.ERR_NETWORK).toBe('ERR_NETWORK')
    expect(LuchRequestError.ERR_BAD_STATUS).toBe('ERR_BAD_STATUS')
    expect(LuchRequestError.ERR_BAD_RESPONSE).toBe(
      'ERR_BAD_RESPONSE'
    )
    expect(LuchRequestError.ERR_CANCELED).toBe('ERR_CANCELED')
    expect(LuchRequestError.ERR_INTERCEPTOR).toBe('ERR_INTERCEPTOR')
  })

  it('公开稳定的取消模式常量', () => {
    expect(CancellationMode.NATIVE).toBe('native')
    expect(CancellationMode.LOGICAL).toBe('logical')
  })

  it('toJSON 返回稳定字段并保留上下文引用', () => {
    const config = {
      url: '/users'
    }
    const task = {
      abort: () => {}
    }
    const raw = {
      statusCode: 503
    }
    const response = {
      statusCode: 503,
      raw
    }
    const cause = new Error('底层异常')
    const error = new LuchRequestError(
      '请求失败',
      LuchRequestError.ERR_BAD_STATUS,
      {
        config,
        task,
        response,
        cause,
        raw,
        cancelMode: CancellationMode.LOGICAL
      }
    )

    const result = error.toJSON()

    expect(result).toEqual({
      name: 'LuchRequestError',
      message: '请求失败',
      stack: error.stack,
      code: LuchRequestError.ERR_BAD_STATUS,
      statusCode: 503,
      config,
      cause,
      raw,
      cancelMode: CancellationMode.LOGICAL,
      isLuchRequestError: true
    })
    expect(result.config).toBe(config)
    expect(result.cause).toBe(cause)
    expect(result.raw).toBe(raw)
    expect(result).not.toHaveProperty('phase')
    expect(result).not.toHaveProperty('task')
    expect(result).not.toHaveProperty('response')
  })

  it('JSON.stringify 自动使用 toJSON 并省略 undefined', () => {
    const error = new LuchRequestError(
      '网络请求失败',
      LuchRequestError.ERR_NETWORK
    )
    const result = JSON.parse(JSON.stringify(error)) as Record<
      string,
      unknown
    >

    expect(result).toMatchObject({
      name: 'LuchRequestError',
      message: '网络请求失败',
      code: LuchRequestError.ERR_NETWORK,
      isLuchRequestError: true
    })
    expect(result).not.toHaveProperty('statusCode')
    expect(result).not.toHaveProperty('config')
    expect(result).not.toHaveProperty('task')
    expect(result).not.toHaveProperty('response')
  })

  it('不会把普通对象识别为 luch-request 错误', () => {
    expect(isLuchRequestError(new Error('boom'))).toBe(false)
    expect(isLuchRequestError(null)).toBe(false)
  })
})
