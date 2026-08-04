import { describe, expect, it } from 'vitest'

import { createCancelSource } from '../../src/createCancelSource'
import { mergeConfig } from '../../src/core/mergeConfig'
import { LuchOperation } from '../../src/core/LuchOperation'
import type { RequestConfig } from '../../src/types'

describe('mergeConfig', () => {
  it('按大小写不敏感的 header 键应用局部配置', () => {
    const defaults = {
      header: {
        Accept: 'application/json',
        Authorization: 'default'
      }
    }
    const local: RequestConfig = {
      url: '/users',
      header: {
        authorization: 'local'
      }
    }

    const result = mergeConfig(defaults, local)

    expect(result.header).toEqual({
      Accept: 'application/json',
      authorization: 'local'
    })
  })

  it('使用 null 或 undefined 删除继承的 header', () => {
    const result = mergeConfig({
      header: {
        Accept: 'application/json',
        Authorization: 'token',
        EmptyDefault: undefined
      }
    }, {
      url: '/users',
      header: {
        accept: null,
        Authorization: undefined,
        Trace: 'trace-id'
      }
    })

    expect(result.header).toEqual({
      Trace: 'trace-id'
    })
    expect(Object.getPrototypeOf(result.header!)).toBe(
      Object.prototype
    )
  })

  it('浅合并 luchMeta 和 nativeOptions', () => {
    const defaults = {
      luchMeta: {
        auth: {
          required: true,
          role: 'user'
        },
        defaultOnly: true
      },
      nativeOptions: {
        defaultOnly: true,
        platformOption: {
          cache: true
        }
      }
    }
    const local = {
      url: '/users',
      luchMeta: {
        auth: {
          role: 'admin'
        },
        localOnly: true
      },
      nativeOptions: {
        localOnly: true,
        platformOption: {
          trace: true
        }
      }
    }

    const result = mergeConfig(defaults, local)

    expect(result.luchMeta).toEqual({
      auth: {
        role: 'admin'
      },
      defaultOnly: true,
      localOnly: true
    })
    expect(result.nativeOptions).toEqual({
      defaultOnly: true,
      localOnly: true,
      platformOption: {
        trace: true
      }
    })
  })

  it('按字段合并 jsonParsing，并整体替换 include', () => {
    const defaults = {
      luchOptions: {
        jsonParsing: {
          include: [
            LuchOperation.REQUEST,
            LuchOperation.UPLOAD
          ],
          mode: 'strict' as const
        }
      }
    }
    const local = {
      url: '/upload',
      luchOptions: {
        jsonParsing: {
          include: [
            LuchOperation.UPLOAD
          ],
          mode: 'auto' as const
        }
      }
    }

    const result = mergeConfig(defaults, local)

    expect(result.luchOptions?.jsonParsing).toEqual({
      include: [
        LuchOperation.UPLOAD
      ],
      mode: 'auto'
    })
    expect(defaults.luchOptions.jsonParsing.include).toEqual([
      LuchOperation.REQUEST,
      LuchOperation.UPLOAD
    ])
  })

  it('允许局部覆盖 jsonParsing 字段或明确关闭', () => {
    const defaults = {
      luchOptions: {
        jsonParsing: {
          include: [
            LuchOperation.UPLOAD
          ],
          mode: 'strict' as const
        }
      }
    }

    const overridden = mergeConfig(defaults, {
      url: '/upload',
      luchOptions: {
        jsonParsing: {
          mode: 'auto' as const
        }
      }
    })
    const disabled = mergeConfig(defaults, {
      url: '/upload',
      luchOptions: {
        jsonParsing: false as const
      }
    })

    expect(overridden.luchOptions?.jsonParsing).toEqual({
      include: [
        LuchOperation.UPLOAD
      ],
      mode: 'auto'
    })
    expect(disabled.luchOptions?.jsonParsing).toBe(false)
  })

  it('单次请求完全替换实例的原生 abort 识别器', () => {
    const defaultDetector = (): boolean => true
    const localDetector = (): boolean => false
    const result = mergeConfig(
      {
        luchOptions: {
          isNativeAbortError: defaultDetector
        }
      },
      {
        url: '/request',
        luchOptions: {
          isNativeAbortError: localDetector
        }
      }
    )

    expect(result.luchOptions?.isNativeAbortError).toBe(localDetector)
  })

  it('不修改默认配置和单次请求配置', () => {
    const defaults = {
      header: {
        Accept: 'application/json'
      },
      luchMeta: {
        auth: {
          required: true
        }
      }
    }
    const local = {
      url: '/users',
      header: {
        Authorization: 'token'
      }
    }
    const defaultsSnapshot = JSON.parse(JSON.stringify(defaults))
    const localSnapshot = JSON.parse(JSON.stringify(local))

    const result = mergeConfig(defaults, local)
    result.header!.Accept = 'text/plain'

    expect(defaults).toEqual(defaultsSnapshot)
    expect(local).toEqual(localSnapshot)
  })

  it('递归复制普通对象和数组并保留不透明对象身份', () => {
    const source = createCancelSource()
    const createdAt = new Date('2026-07-31T00:00:00.000Z')
    const defaults = {
      params: {
        filters: {
          tenant: 'a'
        },
        items: [
          {
            enabled: true
          }
        ]
      },
      luchMeta: {
        auth: {
          role: 'user'
        }
      },
      nativeOptions: {
        platform: {
          cache: true
        },
        createdAt
      },
      signal: source.signal
    }
    const local = {
      url: '/users',
      data: {
        profile: {
          name: 'original'
        }
      }
    }
    const result = mergeConfig(defaults, local)

    result.params.filters.tenant = 'b'
    result.params.items[0]!.enabled = false
    result.luchMeta.auth.role = 'admin'
    result.nativeOptions.platform.cache = false
    result.data.profile.name = 'changed'

    expect(defaults.params.filters.tenant).toBe('a')
    expect(defaults.params.items[0]!.enabled).toBe(true)
    expect(defaults.luchMeta.auth.role).toBe('user')
    expect(defaults.nativeOptions.platform.cache).toBe(true)
    expect(local.data.profile.name).toBe('original')
    expect(result.signal).toBe(source.signal)
    expect(result.nativeOptions.createdAt).toBe(createdAt)
  })

  it('复制循环普通对象时保持副本内部引用', () => {
    const params: Record<string, unknown> = {
      tenant: 'a'
    }
    params.self = params

    const result = mergeConfig(
      {
        params
      },
      {
        url: '/users'
      }
    )
    const clonedParams = result.params as Record<string, unknown>

    expect(clonedParams).not.toBe(params)
    expect(clonedParams.self).toBe(clonedParams)
  })

  it('忽略危险键', () => {
    const local = JSON.parse(
      '{"url":"/users","__proto__":{"polluted":true},"constructor":{"polluted":true}}'
    ) as RequestConfig

    const result = mergeConfig(undefined, local)

    expect(
      Object.prototype.hasOwnProperty.call(result, '__proto__')
    ).toBe(false)
    expect(
      Object.prototype.hasOwnProperty.call(result, 'constructor')
    ).toBe(false)
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined()
  })
})
