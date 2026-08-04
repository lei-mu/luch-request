import { describe, expect, it } from 'vitest'

import { LuchOperation } from '../../src/core/LuchOperation'
import { toNativeOptions } from '../../src/helpers/nativeOptions'
import type { AnyRequestConfig } from '../../src/types'

describe('toNativeOptions', () => {
  it('只透传已声明的顶层字段', () => {
    const options = toNativeOptions(
      {
        url: '/users',
        method: 'GET',
        unknownTopLevel: true
      } as AnyRequestConfig,
      'https://api.example.com/users',
      LuchOperation.REQUEST
    )

    expect(options).toEqual({
      url: 'https://api.example.com/users',
      method: 'GET'
    })
    expect(options).not.toHaveProperty('unknownTopLevel')
  })

  it('展开 nativeOptions 并由其覆盖同名顶层字段', () => {
    const options = toNativeOptions(
      {
        url: '/users',
        method: 'GET',
        nativeOptions: {
          url: 'https://evil.example.com',
          fullURL: 'https://evil.example.com/full',
          method: 'POST',
          futureOption: true,
          validateStatus: 'native-rule',
          success: '不能覆盖内部 callback',
          fail: '不能覆盖内部 callback',
          complete: '不能覆盖内部 callback'
        }
      },
      'https://api.example.com/users',
      LuchOperation.REQUEST
    )

    expect(options).toEqual({
      url: 'https://api.example.com/users',
      method: 'POST',
      futureOption: true,
      validateStatus: 'native-rule'
    })
  })

  it('派发前删除 interceptor 或 nativeOptions 注入的空 header', () => {
    const options = toNativeOptions(
      {
        url: '/users',
        header: {
          Accept: 'application/json',
          Empty: undefined
        },
        nativeOptions: {
          header: {
            Authorization: 'token',
            Removed: null
          }
        }
      },
      'https://api.example.com/users',
      LuchOperation.REQUEST
    )

    expect(options.header).toEqual({
      Authorization: 'token'
    })
  })

  it('拒绝 nativeOptions 中可能污染原型链的键', () => {
    const nativeOptions = JSON.parse(
      '{"__proto__":{"polluted":true},"constructor":{"polluted":true}}'
    ) as Record<string, unknown>
    const options = toNativeOptions(
      {
        url: '/users',
        nativeOptions
      },
      'https://api.example.com/users',
      LuchOperation.REQUEST
    )

    expect(
      Object.prototype.hasOwnProperty.call(options, '__proto__')
    ).toBe(false)
    expect(
      Object.prototype.hasOwnProperty.call(options, 'constructor')
    ).toBe(false)
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined()
  })

  it('按 operation 过滤其他 uni API 的已知字段', () => {
    const uploadOptions = toNativeOptions(
      {
        url: '/upload',
        method: 'POST',
        responseType: 'arraybuffer',
        filePath: '/tmp/source',
        name: 'file',
        nativeOptions: {
          method: 'PATCH',
          responseType: 'text',
          futureUploadOption: true
        }
      },
      'https://api.example.com/upload',
      LuchOperation.UPLOAD
    )

    expect(uploadOptions).toEqual({
      url: 'https://api.example.com/upload',
      filePath: '/tmp/source',
      name: 'file',
      futureUploadOption: true
    })
  })
})
