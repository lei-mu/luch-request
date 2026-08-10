import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  CancellationMode,
  createLuchRequest,
  isLuchRequestError,
  JSONParsingMode,
  LuchOperation,
  LuchRequestError
} from '../../src'
import type {
  LuchRequestControl,
  NativeAbortErrorContext,
  NativeTask
} from '../../src'
import type {
  AnyLuchResponse,
  AnyRequestConfig,
  ResponseTransformer
} from '../../src/types'

interface CallbackOptions {
  success: (result: Record<string, unknown>) => void
  fail: (error: unknown) => void
  [key: string]: unknown
}

function succeed(
  options: CallbackOptions,
  result: Record<string, unknown>
): void {
  Promise.resolve().then(() => {
    options.success(result)
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LuchRequest', () => {
  it('合并配置并透传 nativeOptions 和未知响应字段', async () => {
    const task: NativeTask = {
      abort: vi.fn()
    }
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: {
          id: 1
        },
        statusCode: 200,
        header: {
          'x-request-id': 'request-id'
        },
        profile: {
          protocol: 'h2'
        }
      })
      return task
    })
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest({
      baseURL: 'https://api.example.com/v1/',
      header: {
        Accept: 'application/json',
        Authorization: 'default'
      }
    })
    http.interceptors.request.use((config, context) => {
      expect(context.operation).toBe(LuchOperation.REQUEST)
      expect('fullURL' in config).toBe(false)
      return {
        ...config,
        fullURL: 'https://evil.example.com'
      } as unknown as typeof config
    })
    const pending = http.get<
      { id: number },
      { page: number; tag: string[] },
      { enableFutureOption?: boolean }
    >('/users#ignored', {
      header: {
        authorization: 'local'
      },
      params: {
        page: 1,
        tag: ['a', 'b']
      },
      validateStatus: () => true,
      luchMeta: {
        traceName: 'user-list'
      },
      nativeOptions: {
        enableFutureOption: true,
        validateStatus: 'native-rule',
        success: '不能覆盖内部 callback'
      } as unknown as {
        enableFutureOption?: boolean
      }
    })
    const taskListener = vi.fn()
    pending.onTask(taskListener)

    const response = await pending
    const nativeOptions = request.mock.calls[0]![0]

    expect(nativeOptions.url).toBe(
      'https://api.example.com/v1/users?page=1&tag[]=a&tag[]=b'
    )
    expect(nativeOptions.method).toBe('GET')
    expect(nativeOptions.header).toEqual({
      Accept: 'application/json',
      authorization: 'local'
    })
    expect(nativeOptions.enableFutureOption).toBe(true)
    expect(nativeOptions.validateStatus).toBe('native-rule')
    expect(nativeOptions).not.toHaveProperty('baseURL')
    expect(nativeOptions).not.toHaveProperty('params')
    expect(nativeOptions).not.toHaveProperty('luchMeta')
    expect(nativeOptions).not.toHaveProperty('nativeOptions')
    expect(nativeOptions.success).toBeTypeOf('function')
    expect(nativeOptions.fail).toBeTypeOf('function')
    expect(response.data.id).toBe(1)
    expect(response.profile).toEqual({
      protocol: 'h2'
    })
    expect(response.raw).not.toBe(response)
    expect(response.config.url).toBe('/users#ignored')
    expect(response.config.fullURL).toBe(
      'https://api.example.com/v1/users?page=1&tag[]=a&tag[]=b'
    )
    expect(response.task).toBe(task)
    expect(pending.task).toBe(task)
    expect(taskListener).toHaveBeenCalledWith(
      task,
      expect.objectContaining({
        abort: expect.any(Function)
      })
    )
  })

  it('在请求拦截器前应用实例默认 method 和 validateStatus', async () => {
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 304,
        header: {}
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      request
    })

    const validateStatus = vi.fn((status: number) => status < 400)
    const http = createLuchRequest({
      method: 'post',
      validateStatus
    })
    const interceptorMethods: unknown[] = []
    const interceptorValidators: unknown[] = []
    http.interceptors.request.use((config, context) => {
      expect(context.operation).toBe(LuchOperation.REQUEST)
      interceptorMethods.push(config.method)
      interceptorValidators.push(config.validateStatus)
      return config
    })

    const defaultResponse = await http.request({
      url: '/default'
    })
    await http.request({
      url: '/local',
      method: 'put'
    })
    await http.get('/shortcut')

    expect(http.defaults.method).toBe('post')
    expect(http.defaults.validateStatus).toBe(validateStatus)
    expect(interceptorMethods).toEqual([
      'POST',
      'PUT',
      'GET'
    ])
    expect(interceptorValidators).toEqual([
      validateStatus,
      validateStatus,
      validateStatus
    ])
    expect(request.mock.calls.map((call) => call[0].method)).toEqual([
      'POST',
      'PUT',
      'GET'
    ])
    expect(defaultResponse.config.method).toBe('POST')
    expect(defaultResponse.config.validateStatus).toBe(validateStatus)
    expect(validateStatus).toHaveBeenCalledWith(304)
  })

  it('共享默认配置的多个实例不会被拦截器嵌套修改污染', async () => {
    const requestMock = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 200,
        header: {}
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      request: requestMock
    })
    const sharedDefaults = {
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
        }
      }
    }
    const requestData = {
      profile: {
        name: 'original'
      }
    }
    const instanceA = createLuchRequest(sharedDefaults)
    const instanceB = createLuchRequest(sharedDefaults)

    instanceB.interceptors.request.use((config) => {
      const params = config.params as typeof sharedDefaults.params
      const luchMeta = config.luchMeta as typeof sharedDefaults.luchMeta
      const nativeOptions = config.nativeOptions as
        typeof sharedDefaults.nativeOptions
      const data = config.data as typeof requestData

      params.filters.tenant = 'b'
      params.items[0]!.enabled = false
      luchMeta.auth.role = 'admin'
      nativeOptions.platform.cache = false
      data.profile.name = 'changed'
      return config
    })

    await instanceB.post('/instance-b', requestData)
    const responseA = await instanceA.get('/instance-a')

    expect(sharedDefaults).toEqual({
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
        }
      }
    })
    expect(requestData.profile.name).toBe('original')
    expect(instanceA.defaults.params).toEqual(sharedDefaults.params)
    expect(instanceB.defaults.params).toEqual(sharedDefaults.params)
    expect(instanceA.defaults.luchMeta).toEqual(sharedDefaults.luchMeta)
    expect(instanceB.defaults.luchMeta).toEqual(sharedDefaults.luchMeta)
    expect(responseA.config.params).toEqual(sharedDefaults.params)
    expect(responseA.config.luchMeta).toEqual(sharedDefaults.luchMeta)
    expect(responseA.config.nativeOptions).toEqual(
      sharedDefaults.nativeOptions
    )
  })

  it('同一实例的并发请求拥有独立普通配置结构', async () => {
    const requestMock = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 200,
        header: {}
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      request: requestMock
    })
    const http = createLuchRequest({
      params: {
        filters: {
          tenant: 'a'
        }
      }
    })

    http.interceptors.request.use((config) => {
      if (config.url === '/first') {
        const params = config.params as {
          filters: {
            tenant: string
          }
        }
        params.filters.tenant = 'first'
      }

      return config
    })

    const [firstResponse, secondResponse] = await Promise.all([
      http.get('/first'),
      http.get('/second')
    ])

    expect(firstResponse.config.params).toEqual({
      filters: {
        tenant: 'first'
      }
    })
    expect(secondResponse.config.params).toEqual({
      filters: {
        tenant: 'a'
      }
    })
    expect(http.defaults.params).toEqual({
      filters: {
        tenant: 'a'
      }
    })
  })

  it('在拦截器修改后恢复行为默认值并拒绝非法配置', async () => {
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 200,
        header: {}
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest({
      method: 'POST',
      validateStatus: () => false
    })
    http.interceptors.request.use((config) => ({
      ...config,
      method: undefined,
      validateStatus: undefined
    }) as unknown as typeof config)

    const response = await http.request({
      url: '/users'
    })

    expect(request.mock.calls[0]![0].method).toBe('GET')
    expect(response.config.method).toBe('GET')
    expect(response.config.validateStatus(200)).toBe(true)

    const invalidHTTP = createLuchRequest()
    invalidHTTP.interceptors.request.use((config) => ({
      ...config,
      validateStatus: null
    }) as unknown as typeof config)

    const error = await invalidHTTP.request({
      url: '/invalid'
    }).catch((reason: unknown) => reason)

    expect(error).toMatchObject({
      code: LuchRequestError.ERR_INVALID_CONFIG,
      message: 'Failed to normalize request config'
    })

    const invalidMethodHTTP = createLuchRequest()
    invalidMethodHTTP.interceptors.request.use((config) => ({
      ...config,
      method: null
    }) as unknown as typeof config)

    const methodError = await invalidMethodHTTP.request({
      url: '/invalid-method'
    }).catch((reason: unknown) => reason)

    expect(methodError).toMatchObject({
      code: LuchRequestError.ERR_INVALID_CONFIG,
      message: 'Failed to normalize request config'
    })
    expect(request).toHaveBeenCalledOnce()
  })

  it('把平台字符串状态码归一化并拒绝非成功状态', async () => {
    const uploadFile = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'failed',
        statusCode: '500',
        platformField: 'kept'
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      uploadFile
    })

    const http = createLuchRequest()
    const error = await http.upload({
      url: 'https://api.example.com/upload',
      filePath: '/tmp/avatar.png',
      name: 'avatar'
    }).catch((reason: unknown) => reason)

    expect(isLuchRequestError(error)).toBe(true)
    expect(error).toMatchObject({
      code: 'ERR_BAD_STATUS',
      message: 'Request failed with status code 500'
    })

    if (isLuchRequestError(error)) {
      expect(error.response).toMatchObject({
        statusCode: 500,
        platformField: 'kept'
      })
      expect(error.config).toMatchObject({
        url: 'https://api.example.com/upload',
        fullURL: 'https://api.example.com/upload'
      })
      expect(error.response).toMatchObject({
        raw: {
          statusCode: '500'
        }
      })
    }
  })

  it('运行时非法配置也通过统一 Promise 错误返回', async () => {
    const http = createLuchRequest()
    const pending = http.request(null as never)

    await expect(pending).rejects.toMatchObject({
      code: 'ERR_INVALID_CONFIG',
      message: 'Request config must be an object'
    })
  })

  it('将平台 fail 统一为网络错误并保留原始信息', async () => {
    const rawError = {
      errMsg: 'request:fail timeout',
      errno: 600001
    }
    const request = vi.fn((options: CallbackOptions) => {
      Promise.resolve().then(() => {
        options.fail(rawError)
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      request
    })

    const error = await createLuchRequest()
      .get('/users')
      .catch((reason: unknown) => reason)

    expect(error).toMatchObject({
      code: 'ERR_NETWORK',
      message: 'request:fail timeout',
      raw: rawError,
      cause: rawError,
      config: {
        url: '/users',
        fullURL: '/users'
      }
    })
  })

  it.each([
    {
      name: '对象 message',
      rawError: { message: 'socket closed' },
      expectedMessage: 'socket closed'
    },
    {
      name: '字符串原因',
      rawError: 'platform request failed',
      expectedMessage: 'platform request failed'
    },
    {
      name: '空白平台消息',
      rawError: { errMsg: '  ', message: '' },
      expectedMessage: 'Network request failed'
    }
  ])(
    '网络错误支持$name并保留稳定回退',
    async ({ rawError, expectedMessage }) => {
      const request = vi.fn((options: CallbackOptions) => {
        Promise.resolve().then(() => {
          options.fail(rawError)
        })
        return {
          abort: vi.fn()
        }
      })
      vi.stubGlobal('uni', {
        request
      })

      await expect(
        createLuchRequest().get('/users')
      ).rejects.toMatchObject({
        cause: rawError,
        code: LuchRequestError.ERR_NETWORK,
        message: expectedMessage,
        raw: rawError
      })
    }
  )

  it('请求 interceptor 失败时保留原始消息和原因且不派发请求', async () => {
    const request = vi.fn()
    const cause = new Error('3')
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest()
    http.interceptors.request.use(async () => {
      throw cause
    })

    const error = await http.get('/users').catch(
      (reason: unknown) => reason
    )

    expect(error).toMatchObject({
      code: LuchRequestError.ERR_INTERCEPTOR,
      message: '3',
      cause,
      raw: undefined,
      response: undefined
    })
    expect(request).not.toHaveBeenCalled()
  })

  it('为 interceptor 主动抛出的两参数统一错误补充当前配置', async () => {
    const request = vi.fn()
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest()
    http.interceptors.request.use(() => {
      throw new LuchRequestError(
        '用户未登录',
        LuchRequestError.ERR_CANCELED
      )
    })

    const error = await http.get('/users').catch(
      (reason: unknown) => reason
    )

    expect(error).toMatchObject({
      code: LuchRequestError.ERR_CANCELED,
      message: '用户未登录',
      cancelMode: undefined,
      config: {
        url: '/users',
        method: 'GET'
      }
    })
    expect(request).not.toHaveBeenCalled()
  })

  it('保留 interceptor 统一错误显式提供的上下文字段', async () => {
    const request = vi.fn()
    const config = {
      url: '/manual'
    }
    const customError = new LuchRequestError(
      '用户未登录',
      LuchRequestError.ERR_CANCELED,
      {
        config,
        cancelMode: CancellationMode.LOGICAL
      }
    )
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest()
    http.interceptors.request.use(() => {
      throw customError
    })

    const error = await http.get('/users').catch(
      (reason: unknown) => reason
    )

    expect(error).toBe(customError)
    expect(error).toMatchObject({
      config,
      cancelMode: CancellationMode.LOGICAL
    })
    expect(request).not.toHaveBeenCalled()
  })

  it('响应 interceptor 失败时保留已获得的响应上下文', async () => {
    const task = {
      abort: vi.fn()
    }
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 200,
        header: {}
      })
      return task
    })
    const cause = new Error('response failed')
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest()
    http.interceptors.response.use(async () => {
      throw cause
    })

    const error = await http.get('/users').catch(
      (reason: unknown) => reason
    )

    expect(error).toMatchObject({
      code: LuchRequestError.ERR_INTERCEPTOR,
      message: 'response failed',
      cause,
      raw: undefined,
      task,
      response: {
        data: 'ok',
        statusCode: 200
      }
    })
    expect(request).toHaveBeenCalledOnce()
  })

  it('响应 interceptor 统一错误按字段补充缺失上下文', async () => {
    const task = {
      abort: vi.fn()
    }
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 200,
        header: {}
      })
      return task
    })
    const config = {
      url: '/manual'
    }
    const customError = new LuchRequestError(
      '响应处理失败',
      LuchRequestError.ERR_INTERCEPTOR,
      {
        config
      }
    )
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest()
    http.interceptors.response.use(() => {
      throw customError
    })

    const error = await http.get('/users').catch(
      (reason: unknown) => reason
    )

    expect(error).not.toBe(customError)
    expect(error).toMatchObject({
      code: LuchRequestError.ERR_INTERCEPTOR,
      message: '响应处理失败',
      config,
      task,
      response: {
        data: 'ok',
        statusCode: 200
      },
      cause: customError
    })
    expect(request).toHaveBeenCalledOnce()
  })

  it('按 FIFO 执行两类 interceptor，并允许响应错误恢复', async () => {
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'failed',
        statusCode: 503,
        header: {}
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      request
    })

    const calls: string[] = []
    const http = createLuchRequest()

    http.interceptors.request.use(async (config) => {
      calls.push('request-1')
      return {
        ...config,
        luchMeta: {
          ...config.luchMeta,
          first: true
        }
      }
    })
    http.interceptors.request.use((config) => {
      calls.push('request-2')
      expect(config.luchMeta?.first).toBe(true)
      return config
    })
    http.interceptors.response.use((response) => {
      calls.push('response-1')
      return response
    })
    http.interceptors.response.use(
      (response) => response,
      (error) => {
        calls.push('response-rejected')
        expect(error).toMatchObject({
          code: 'ERR_BAD_STATUS'
        })

        return {
          data: 'fallback',
          statusCode: 200,
          header: {},
          config: {
            url: '/fallback',
            fullURL: 'https://api.example.com/fallback',
            validateStatus: () => true
          },
          raw: {}
        } as AnyLuchResponse
      }
    )

    const response = await http.get<string>('/users')

    expect(response.data).toBe('fallback')
    expect(calls).toEqual([
      'request-1',
      'request-2',
      'response-rejected'
    ])
  })

  it('在异步 request interceptor 完成前取消时不调用 uni API', async () => {
    let release: ((
      config: AnyRequestConfig & {
        validateStatus: (status: number) => boolean
        transformResponse: readonly ResponseTransformer[]
      }
    ) => void) | undefined
    const request = vi.fn()
    const onTask = vi.fn()
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest()
    http.interceptors.request.use((config) => (
      new Promise<AnyRequestConfig & {
        validateStatus: (status: number) => boolean
        transformResponse: readonly ResponseTransformer[]
      }>((resolve) => {
        release = resolve
      })
    ))

    const pending = http.get('/slow', {
      onTask
    })
    pending.abort('页面已离开')

    await expect(pending).rejects.toMatchObject({
      code: 'ERR_CANCELED',
      message: '页面已离开'
    })

    release?.({
      url: '/slow',
      validateStatus: () => true,
      transformResponse: []
    })
    await Promise.resolve()

    expect(request).not.toHaveBeenCalled()
    expect(onTask).not.toHaveBeenCalled()
  })

  it('Task 创建后取消会调用原生 abort', async () => {
    let resolveTask: ((task: NativeTask) => void) | undefined
    const taskReady = new Promise<NativeTask>((resolve) => {
      resolveTask = resolve
    })
    const task: NativeTask = {
      abort: vi.fn()
    }
    const request = vi.fn((_options: CallbackOptions) => task)
    vi.stubGlobal('uni', {
      request
    })

    const pending = createLuchRequest().get('/slow')
    pending.onTask((createdTask) => {
      resolveTask?.(createdTask)
    })

    await taskReady
    pending.abort()

    await expect(pending).rejects.toMatchObject({
      code: 'ERR_CANCELED',
      message: 'Request canceled',
      cancelMode: CancellationMode.NATIVE
    })
    expect(task.abort).toHaveBeenCalledOnce()
  })

  it('单次配置 onTask 可通过 control 使用统一取消语义', async () => {
    const task: NativeTask = {
      abort: vi.fn()
    }
    const request = vi.fn((_options: CallbackOptions) => task)
    vi.stubGlobal('uni', {
      request
    })

    const onTask = vi.fn((
      nativeTask: NativeTask,
      control: LuchRequestControl
    ) => {
      expect(nativeTask).toBe(task)
      control.abort('配置回调取消')
    })
    const pending = createLuchRequest().get('/slow', {
      onTask
    })
    const error = await pending.catch((reason: unknown) => reason)
    const nativeOptions = request.mock.calls[0]![0]

    expect(error).toMatchObject({
      code: LuchRequestError.ERR_CANCELED,
      message: '配置回调取消',
      cancelMode: CancellationMode.NATIVE
    })
    expect(onTask).toHaveBeenCalledOnce()
    expect(task.abort).toHaveBeenCalledOnce()
    expect(nativeOptions).not.toHaveProperty('onTask')
  })

  it('支持不依赖 DOM 类型的结构化 signal', async () => {
    const listeners = new Set<() => void>()
    const signal = {
      aborted: false,
      reason: undefined as unknown,
      addEventListener: vi.fn((
        _type: 'abort',
        listener: () => void
      ) => {
        listeners.add(listener)
      }),
      removeEventListener: vi.fn((
        _type: 'abort',
        listener: () => void
      ) => {
        listeners.delete(listener)
      })
    }
    const task = {
      abort: vi.fn()
    }
    const request = vi.fn((_options: CallbackOptions) => task)
    vi.stubGlobal('uni', {
      request
    })

    const pending = createLuchRequest().get('/slow', {
      signal
    })
    await new Promise<void>((resolve) => {
      pending.onTask(() => resolve())
    })

    signal.aborted = true
    signal.reason = 'signal canceled'
    for (const listener of listeners) {
      listener()
    }

    await expect(pending).rejects.toMatchObject({
      code: 'ERR_CANCELED',
      message: 'signal canceled'
    })
    expect(task.abort).toHaveBeenCalledOnce()
    expect(signal.removeEventListener).toHaveBeenCalledOnce()
  })

  it('异步 request interceptor 期间 signal 取消不会调用 uni API', async () => {
    const listeners = new Set<() => void>()
    const signal = {
      aborted: false,
      reason: undefined as unknown,
      addEventListener: vi.fn((
        _type: 'abort',
        listener: () => void
      ) => {
        listeners.add(listener)
      }),
      removeEventListener: vi.fn((
        _type: 'abort',
        listener: () => void
      ) => {
        listeners.delete(listener)
      })
    }
    const request = vi.fn()
    vi.stubGlobal('uni', {
      request
    })
    let continueInterceptor: (() => void) | undefined
    let markInterceptorStarted: (() => void) | undefined
    const interceptorStarted = new Promise<void>((resolve) => {
      markInterceptorStarted = resolve
    })
    const http = createLuchRequest()
    http.interceptors.request.use((config) => (
      new Promise((resolve) => {
        markInterceptorStarted?.()
        continueInterceptor = () => resolve(config)
      })
    ))

    const pending = http.get('/slow', {
      signal
    })
    await interceptorStarted
    signal.aborted = true
    signal.reason = 'signal canceled during interceptor'
    for (const listener of listeners) {
      listener()
    }
    continueInterceptor?.()

    await expect(pending).rejects.toMatchObject({
      code: LuchRequestError.ERR_CANCELED,
      message: 'signal canceled during interceptor'
    })
    expect(request).not.toHaveBeenCalled()
  })

  it('signal 注册失败时返回配置错误且不调用 uni API', async () => {
    const attachError = new Error('attach failed')
    const signal = {
      aborted: false,
      addEventListener: vi.fn(() => {
        throw attachError
      }),
      removeEventListener: vi.fn()
    }
    const request = vi.fn()
    vi.stubGlobal('uni', {
      request
    })

    const error = await createLuchRequest().get('/users', {
      signal
    }).catch((reason: unknown) => reason)

    expect(error).toMatchObject({
      code: LuchRequestError.ERR_INVALID_CONFIG,
      message: 'Failed to attach the signal listener',
      cause: attachError
    })
    expect(request).not.toHaveBeenCalled()
    expect(signal.removeEventListener).not.toHaveBeenCalled()
  })

  it('signal 清理失败不改变已经完成的请求结果', async () => {
    const signal = {
      aborted: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(() => {
        throw new Error('cleanup failed')
      })
    }
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 200,
        header: {}
      })
      return {}
    })
    vi.stubGlobal('uni', {
      request
    })

    await expect(createLuchRequest().get('/users', {
      signal
    })).resolves.toMatchObject({
      data: 'ok'
    })
    expect(signal.removeEventListener).toHaveBeenCalledOnce()
  })

  it('onTask listener 抛错不影响请求或原生 Task', async () => {
    const task = {
      abort: vi.fn()
    }
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 200,
        header: {}
      })
      return task
    })
    vi.stubGlobal('uni', {
      request
    })

    const pending = createLuchRequest().get('/users', {
      onTask() {
        throw new Error('config listener failed')
      }
    })
    pending.onTask(() => {
      throw new Error('listener failed before task')
    })

    await expect(pending).resolves.toMatchObject({
      data: 'ok'
    })
    expect(() => {
      pending.onTask(() => {
        throw new Error('listener failed after task')
      })
    }).not.toThrow()
    expect(task.abort).not.toHaveBeenCalled()
  })

  it('直接通过原生 Task 中断时返回原生取消错误', async () => {
    const nativeAbortError = {
      errMsg: 'request:fail abort'
    }
    let requestOptions: CallbackOptions | undefined
    const task = {
      abort: vi.fn(() => {
        requestOptions?.fail(nativeAbortError)
      })
    }
    const request = vi.fn((options: CallbackOptions) => {
      requestOptions = options
      return task
    })
    vi.stubGlobal('uni', {
      request
    })

    const pending = createLuchRequest().post('/api/delay')
    pending.onTask((nativeTask) => {
      nativeTask.abort?.()
    })
    const error = await pending.catch((reason: unknown) => reason)

    expect(error).toMatchObject({
      code: LuchRequestError.ERR_CANCELED,
      cancelMode: CancellationMode.NATIVE,
      cause: nativeAbortError,
      raw: nativeAbortError
    })
    expect(task.abort).toHaveBeenCalledOnce()
  })

  it('允许通过实例配置覆盖原生 abort 错误识别', async () => {
    const platformError = {
      errMsg: 'platform request stopped'
    }
    let requestOptions: CallbackOptions | undefined
    const task = {
      abort: vi.fn(() => {
        requestOptions?.fail(platformError)
      })
    }
    const request = vi.fn((options: CallbackOptions) => {
      requestOptions = options
      return task
    })
    const isNativeAbortError = vi.fn((
      error: unknown,
      context: NativeAbortErrorContext
    ) => {
      expect(error).toBe(platformError)
      expect(context.operation).toBe(LuchOperation.REQUEST)
      expect(context.config.fullURL).toBe('/api/delay')
      expect(context.task).toBe(task)
      return true
    })
    vi.stubGlobal('uni', {
      request
    })

    const pending = createLuchRequest({
      luchOptions: {
        isNativeAbortError
      }
    }).post('/api/delay')
    pending.onTask((nativeTask) => {
      nativeTask.abort?.()
    })

    await expect(pending).rejects.toMatchObject({
      code: LuchRequestError.ERR_CANCELED,
      cancelMode: CancellationMode.NATIVE,
      cause: platformError,
      raw: platformError
    })
    expect(isNativeAbortError).toHaveBeenCalledOnce()
  })

  it('自定义识别器返回 false 时禁用内置 abort 判断', async () => {
    const nativeAbortError = {
      errMsg: 'request:fail abort'
    }
    const request = vi.fn((options: CallbackOptions) => {
      Promise.resolve().then(() => {
        options.fail(nativeAbortError)
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      request
    })

    await expect(
      createLuchRequest({
        luchOptions: {
          isNativeAbortError: () => false
        }
      }).get('/api/failure')
    ).rejects.toMatchObject({
      code: LuchRequestError.ERR_NETWORK,
      cancelMode: undefined,
      cause: nativeAbortError
    })
  })

  it('自定义 abort 识别器抛错时保留原始网络错误', async () => {
    const networkError = {
      errMsg: 'platform request failed'
    }
    const request = vi.fn((options: CallbackOptions) => {
      Promise.resolve().then(() => {
        options.fail(networkError)
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      request
    })

    await expect(
      createLuchRequest({
        luchOptions: {
          isNativeAbortError: () => {
            throw new Error('detector failed')
          }
        }
      }).get('/api/failure')
    ).rejects.toMatchObject({
      code: LuchRequestError.ERR_NETWORK,
      cancelMode: undefined,
      cause: networkError
    })
  })

  it('含非取消 abort 文本的网络失败仍返回网络错误', async () => {
    const networkError = {
      errMsg: 'request:fail connection aborted unexpectedly'
    }
    const request = vi.fn((options: CallbackOptions) => {
      Promise.resolve().then(() => {
        options.fail(networkError)
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      request
    })

    await expect(
      createLuchRequest().get('/api/failure')
    ).rejects.toMatchObject({
      code: LuchRequestError.ERR_NETWORK,
      cancelMode: undefined,
      cause: networkError
    })
  })

  it('Task 不支持 abort 时明确标记为逻辑取消', async () => {
    const request = vi.fn((_options: CallbackOptions) => ({}))
    vi.stubGlobal('uni', {
      request
    })

    const pending = createLuchRequest().get('/slow')
    await new Promise<void>((resolve) => {
      pending.onTask(() => resolve())
    })
    pending.abort()

    await expect(pending).rejects.toMatchObject({
      code: 'ERR_CANCELED',
      cancelMode: CancellationMode.LOGICAL
    })
  })

  it('原生 abort 抛错时降级为逻辑取消并保留原因', async () => {
    const abortError = new Error('abort failed')
    const task = {
      abort: vi.fn(() => {
        throw abortError
      })
    }
    const request = vi.fn((_options: CallbackOptions) => task)
    vi.stubGlobal('uni', {
      request
    })

    const pending = createLuchRequest().get('/slow')
    await new Promise<void>((resolve) => {
      pending.onTask(() => resolve())
    })
    pending.abort()

    await expect(pending).rejects.toMatchObject({
      code: 'ERR_CANCELED',
      cancelMode: CancellationMode.LOGICAL,
      cause: abortError
    })
  })

  it('用户传入的 callback 不会覆盖内部 callback', async () => {
    const userSuccess = vi.fn()
    const request = vi.fn((options: CallbackOptions) => {
      expect(options.success).not.toBe(userSuccess)
      succeed(options, {
        data: 'ok',
        statusCode: 200,
        header: {}
      })
      return {
        abort: vi.fn()
      }
    })
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest()
    await http.request({
      url: '/users',
      success: userSuccess
    } as never)

    expect(userSuccess).not.toHaveBeenCalled()
  })

  it('请求完成后的 abort 不再中断 Task', async () => {
    const task = {
      abort: vi.fn()
    }
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 200,
        header: {}
      })
      return task
    })
    vi.stubGlobal('uni', {
      request
    })

    const pending = createLuchRequest().get('/users')
    await pending
    pending.abort()

    expect(task.abort).not.toHaveBeenCalled()
  })

  it('参数序列化失败时返回统一配置错误', async () => {
    const request = vi.fn()
    vi.stubGlobal('uni', {
      request
    })
    const circular: Record<string, unknown> = {}
    circular.self = circular

    const pending = createLuchRequest().get('/users', {
      params: {
        circular
      }
    })

    const error = await pending.catch((reason: unknown) => reason)

    expect(error).toMatchObject({
      code: 'ERR_INVALID_CONFIG',
      message: 'Failed to normalize request config',
      config: {
        url: '/users'
      }
    })
    if (isLuchRequestError(error)) {
      expect(error.config).not.toHaveProperty('fullURL')
    }
    expect(request).not.toHaveBeenCalled()
  })

  it('upload 与 download 调用各自的 uni API', async () => {
    const uploadTask = {
      abort: vi.fn(),
      onProgressUpdate: vi.fn()
    }
    const downloadTask = {
      abort: vi.fn(),
      onProgressUpdate: vi.fn()
    }
    const uploadFile = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 201
      })
      return uploadTask
    })
    const downloadFile = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        tempFilePath: '/tmp/file',
        statusCode: 200
      })
      return downloadTask
    })
    vi.stubGlobal('uni', {
      uploadFile,
      downloadFile
    })

    const validateStatus = (status: number): boolean => (
      status >= 200 && status < 300
    )
    const http = createLuchRequest({
      baseURL: 'https://api.example.com',
      method: 'POST',
      responseType: 'arraybuffer',
      nativeOptions: {
        requestDefaultOnly: true
      },
      validateStatus
    })
    const requestOperations: string[] = []
    const responseOperations: string[] = []
    const uploadOnTask = vi.fn()
    const downloadOnTask = vi.fn()
    http.interceptors.request.use((config, context) => {
      requestOperations.push(context.operation)
      expect(config).not.toHaveProperty('method')
      expect(config).not.toHaveProperty('responseType')
      if (context.operation === LuchOperation.UPLOAD) {
        expect(config.nativeOptions).toEqual({
          backgroundMode: true
        })
      } else {
        expect(config).not.toHaveProperty('nativeOptions')
      }
      expect(config.validateStatus).toBe(validateStatus)
      return {
        ...config,
        method: 'PATCH'
      } as unknown as typeof config
    })
    http.interceptors.response.use((response, context) => {
      responseOperations.push(context.operation)
      return response
    })
    const uploadResponse = await http.upload({
      url: '/upload',
      filePath: '/tmp/source',
      name: 'file',
      nativeOptions: {
        backgroundMode: true
      },
      onTask: uploadOnTask
    })
    const downloadResponse = await http.download({
      url: '/download',
      onTask: downloadOnTask
    })

    expect(uploadFile).toHaveBeenCalledOnce()
    expect(downloadFile).toHaveBeenCalledOnce()
    expect(uploadOnTask).toHaveBeenCalledWith(
      uploadTask,
      expect.objectContaining({
        abort: expect.any(Function)
      })
    )
    expect(downloadOnTask).toHaveBeenCalledWith(
      downloadTask,
      expect.objectContaining({
        abort: expect.any(Function)
      })
    )
    expect(uploadFile.mock.calls[0]![0]).not.toHaveProperty('onTask')
    expect(downloadFile.mock.calls[0]![0]).not.toHaveProperty('onTask')
    expect(uploadFile.mock.calls[0]![0]).not.toHaveProperty('method')
    expect(downloadFile.mock.calls[0]![0]).not.toHaveProperty('method')
    expect(uploadFile.mock.calls[0]![0]).not.toHaveProperty(
      'responseType'
    )
    expect(downloadFile.mock.calls[0]![0]).not.toHaveProperty(
      'responseType'
    )
    expect(uploadFile.mock.calls[0]![0]).not.toHaveProperty(
      'requestDefaultOnly'
    )
    expect(downloadFile.mock.calls[0]![0]).not.toHaveProperty(
      'requestDefaultOnly'
    )
    expect(uploadFile.mock.calls[0]![0].backgroundMode).toBe(true)
    expect(uploadResponse.data).toBe('ok')
    expect(downloadResponse.tempFilePath).toBe('/tmp/file')
    expect(uploadResponse.config).not.toHaveProperty('method')
    expect(downloadResponse.config).not.toHaveProperty('method')
    expect(requestOperations).toEqual([
      LuchOperation.UPLOAD,
      LuchOperation.DOWNLOAD
    ])
    expect(responseOperations).toEqual([
      LuchOperation.UPLOAD,
      LuchOperation.DOWNLOAD
    ])
  })

  it('upload 删除继承的 Content-Type，并保留本次显式设置', async () => {
    const uploadFile = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 200
      })
    })
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'ok',
        statusCode: 200,
        header: {}
      })
    })
    vi.stubGlobal('uni', {
      request,
      uploadFile
    })

    const defaultHeader = {
      Authorization: 'Bearer token',
      'Content-Type': 'application/json'
    }
    const http = createLuchRequest({
      header: defaultHeader
    })

    await http.post('/users', {
      name: 'Ada'
    })
    await http.upload({
      url: '/upload/default',
      filePath: '/tmp/default',
      name: 'file'
    })
    await http.upload({
      url: '/upload/explicit',
      filePath: '/tmp/explicit',
      name: 'file',
      header: {
        'content-type': 'custom/type'
      }
    })

    expect(request.mock.calls[0]![0].header).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json'
    })
    expect(uploadFile.mock.calls[0]![0].header).toEqual({
      Authorization: 'Bearer token'
    })
    expect(uploadFile.mock.calls[1]![0].header).toEqual({
      Authorization: 'Bearer token',
      'content-type': 'custom/type'
    })
    expect(defaultHeader).toEqual({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json'
    })
  })

  it('默认以 auto 解析 upload JSON，并保留 raw 字符串', async () => {
    const validJSON = '{"code":200,"data":{"id":1}}'
    const invalidJSON = '{"code":'
    const results = [
      validJSON,
      validJSON,
      invalidJSON,
      invalidJSON
    ]
    const uploadFile = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: results.shift(),
        statusCode: 200
      })
    })
    vi.stubGlobal('uni', {
      uploadFile
    })

    const http = createLuchRequest()

    const parsed = await http.upload<{
      code: number
      data: {
        id: number
      }
    }>({
      url: '/upload/parsed',
      filePath: '/tmp/parsed',
      name: 'file'
    })
    const disabled = await http.upload({
      url: '/upload/disabled',
      filePath: '/tmp/disabled',
      name: 'file',
      luchOptions: {
        jsonParsing: false
      }
    })
    const automatic = await http.upload({
      url: '/upload/auto',
      filePath: '/tmp/auto',
      name: 'file'
    })
    const strictError = await http.upload({
      url: '/upload/strict',
      filePath: '/tmp/strict',
      name: 'file',
      luchOptions: {
        jsonParsing: {
          mode: JSONParsingMode.STRICT
        }
      }
    }).catch((reason: unknown) => reason)

    expect(parsed.data).toEqual({
      code: 200,
      data: {
        id: 1
      }
    })
    expect(parsed.raw.data).toBe(validJSON)
    expect(uploadFile.mock.calls[0]![0]).not.toHaveProperty(
      'luchOptions'
    )
    expect(disabled.data).toBe(validJSON)
    expect(automatic.data).toBe(invalidJSON)
    expect(strictError).toMatchObject({
      code: LuchRequestError.ERR_BAD_RESPONSE,
      message: 'Response data is not valid JSON',
      response: {
        data: invalidJSON
      },
      raw: {
        data: invalidJSON
      }
    })
  })

  it('默认不解析 request 和 download 的字符串 data', async () => {
    const data = '{"code":200}'
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data,
        statusCode: 200,
        header: {}
      })
    })
    const downloadFile = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data,
        statusCode: 200,
        tempFilePath: '/tmp/file'
      })
    })
    vi.stubGlobal('uni', {
      request,
      downloadFile
    })

    const http = createLuchRequest()
    const requestResponse = await http.get('/request')
    const downloadResponse = await http.download({
      url: '/download'
    })

    expect(requestResponse.data).toBe(data)
    expect(downloadResponse).toHaveProperty('data', data)
  })

  it('允许在实例默认 JSON transformer 后追加同步转换器', async () => {
    const data = '{"user_id":1}'
    const header = {
      'content-type': 'application/json'
    }
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data,
        statusCode: 200,
        header
      })
    })
    vi.stubGlobal('uni', {
      request
    })

    const contexts: Array<{
      operation: LuchOperation
      statusCode: number | undefined
      statusAccepted: boolean
      header: unknown
      metadata: unknown
    }> = []
    const http = createLuchRequest({
      luchMeta: {
        source: 'default'
      },
      luchOptions: {
        jsonParsing: {
          include: [LuchOperation.REQUEST],
          mode: JSONParsingMode.STRICT
        }
      }
    })
    const inheritedTransforms = http.defaults.transformResponse
    http.defaults.transformResponse = [
      ...http.defaults.transformResponse,
      (value, context) => {
        contexts.push({
          operation: context.operation,
          statusCode: context.statusCode,
          statusAccepted: context.statusAccepted,
          header: context.header,
          metadata: context.config.luchMeta
        })

        const parsed = value as { user_id: number }
        return {
          userId: parsed.user_id
        }
      },
      (value) => ({
        result: value
      })
    ]

    const response = await http.get('/users')

    expect(response.data).toEqual({
      result: {
        userId: 1
      }
    })
    expect(response.raw.data).toBe(data)
    expect(contexts).toEqual([{
      operation: LuchOperation.REQUEST,
      statusCode: 200,
      statusAccepted: true,
      header,
      metadata: {
        source: 'default'
      }
    }])
    expect(http.defaults.transformResponse).not.toBe(inheritedTransforms)
    expect(request.mock.calls[0]![0]).not.toHaveProperty(
      'transformResponse'
    )
  })

  it('单次 transformResponse 整体替换默认 JSON transformer', async () => {
    const data = '{"id":9007199254740993}'
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data,
        statusCode: 200,
        header: {}
      })
    })
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest({
      luchOptions: {
        jsonParsing: {
          include: [LuchOperation.REQUEST],
          mode: JSONParsingMode.STRICT
        }
      }
    })
    const response = await http.get('/big-integer', {
      dataType: 'text',
      transformResponse: [
        (value) => ({
          raw: value
        })
      ]
    })

    expect(response.data).toEqual({
      raw: data
    })
  })

  it('状态拒绝后仍转换 error.response.data 并保留 BAD_STATUS', async () => {
    const data = '{"error_code":"UNAVAILABLE"}'
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data,
        statusCode: 500,
        header: {}
      })
    })
    vi.stubGlobal('uni', {
      request
    })

    const http = createLuchRequest({
      luchOptions: {
        jsonParsing: {
          include: [LuchOperation.REQUEST],
          mode: JSONParsingMode.STRICT
        }
      }
    })
    http.defaults.transformResponse = [
      ...http.defaults.transformResponse,
      (value, context) => ({
        errorCode: (value as { error_code: string }).error_code,
        statusAccepted: context.statusAccepted
      })
    ]

    const error = await http.get('/failure').catch(
      (reason: unknown) => reason
    )

    expect(error).toMatchObject({
      code: LuchRequestError.ERR_BAD_STATUS,
      response: {
        data: {
          errorCode: 'UNAVAILABLE',
          statusAccepted: false
        }
      }
    })
    expect(isLuchRequestError(error)).toBe(true)
    if (!isLuchRequestError(error)) {
      throw new TypeError('Expected a LuchRequestError')
    }
    expect(
      ((error.response as AnyLuchResponse).raw as { data: unknown }).data
    ).toBe(data)
  })

  it('状态拒绝且严格 JSON 解析失败时由 BAD_RESPONSE 替代', async () => {
    const data = '{"error":'
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data,
        statusCode: 500,
        header: {}
      })
    })
    vi.stubGlobal('uni', {
      request
    })

    const error = await createLuchRequest({
      luchOptions: {
        jsonParsing: {
          include: [LuchOperation.REQUEST],
          mode: JSONParsingMode.STRICT
        }
      }
    }).get('/invalid-json').catch((reason: unknown) => reason)

    expect(error).toMatchObject({
      code: LuchRequestError.ERR_BAD_RESPONSE,
      message: 'Response data is not valid JSON',
      response: {
        data,
        statusCode: 500
      }
    })
    expect(isLuchRequestError(error)).toBe(true)
    if (!isLuchRequestError(error)) {
      throw new TypeError('Expected a LuchRequestError')
    }
    expect(error.cause).toBeInstanceOf(SyntaxError)
  })

  it('拒绝异步和运行时非法的 transformResponse', async () => {
    const request = vi.fn((options: CallbackOptions) => {
      succeed(options, {
        data: 'value',
        statusCode: 200,
        header: {}
      })
    })
    vi.stubGlobal('uni', {
      request
    })

    const asyncError = await createLuchRequest({
      transformResponse: [
        async (value) => value
      ]
    }).get('/async-transform').catch((reason: unknown) => reason)
    const invalidError = await createLuchRequest({
      transformResponse: ['invalid']
    } as never).get('/invalid-transform').catch(
      (reason: unknown) => reason
    )

    expect(asyncError).toMatchObject({
      code: LuchRequestError.ERR_BAD_RESPONSE,
      message: 'Response transformation failed',
      cause: {
        message: 'Response transformer must return synchronously'
      }
    })
    expect(invalidError).toMatchObject({
      code: LuchRequestError.ERR_INVALID_CONFIG,
      cause: {
        message: 'transformResponse must contain only functions'
      }
    })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('拒绝运行时非法的 jsonParsing 配置', async () => {
    const uploadFile = vi.fn()
    vi.stubGlobal('uni', {
      uploadFile
    })

    const pending = createLuchRequest().upload({
      url: '/upload',
      filePath: '/tmp/file',
      name: 'file',
      luchOptions: {
        jsonParsing: true
      }
    } as never)

    await expect(pending).rejects.toMatchObject({
      code: LuchRequestError.ERR_INVALID_CONFIG,
      message: 'Request execution failed',
      cause: {
        message: 'jsonParsing must be an object or false'
      }
    })
    expect(uploadFile).not.toHaveBeenCalled()
  })

  it('拒绝运行时非函数类型的原生 abort 识别器', async () => {
    const request = vi.fn()
    vi.stubGlobal('uni', {
      request
    })

    const pending = createLuchRequest({
      luchOptions: {
        isNativeAbortError: true
      }
    } as never).get('/api/failure')

    await expect(pending).rejects.toMatchObject({
      code: LuchRequestError.ERR_INVALID_CONFIG,
      message: 'Request execution failed',
      cause: {
        message: 'isNativeAbortError must be a function'
      }
    })
    expect(request).not.toHaveBeenCalled()
  })

  it('拒绝运行时非函数类型的 onTask', async () => {
    const request = vi.fn()
    vi.stubGlobal('uni', {
      request
    })

    const pending = createLuchRequest().get('/users', {
      onTask: true
    } as never)

    await expect(pending).rejects.toMatchObject({
      code: LuchRequestError.ERR_INVALID_CONFIG,
      message: 'Failed to normalize request config',
      cause: {
        message: 'onTask must be a function'
      }
    })
    expect(request).not.toHaveBeenCalled()
  })
})
