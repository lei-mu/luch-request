import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  CancellationMode,
  createCancelSource,
  createLuchRequest,
  LuchRequestError
} from '../../src'

interface CallbackOptions {
  fail: (error: unknown) => void
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createCancelSource', () => {
  it('只采用第一次取消原因并只通知一次', () => {
    const source = createCancelSource()
    const listener = vi.fn()
    const lateListener = vi.fn()

    source.signal.addEventListener('abort', listener, { once: true })
    source.cancel('页面离开')
    source.cancel('重复取消')
    source.signal.addEventListener('abort', lateListener)

    expect(source.signal.aborted).toBe(true)
    expect(source.signal.reason).toBe('页面离开')
    expect(listener).toHaveBeenCalledOnce()
    expect(lateListener).not.toHaveBeenCalled()
  })

  it('支持取消监听且隔离监听者异常', () => {
    const source = createCancelSource()
    const removedListener = vi.fn()
    const remainingListener = vi.fn()

    source.signal.addEventListener('abort', removedListener)
    source.signal.removeEventListener('abort', removedListener)
    source.signal.addEventListener('abort', () => {
      throw new Error('listener failed')
    })
    source.signal.addEventListener('abort', remainingListener)

    expect(() => source.cancel()).not.toThrow()
    expect(removedListener).not.toHaveBeenCalled()
    expect(remainingListener).toHaveBeenCalledOnce()
  })

  it('同一个 signal 可以取消多个请求', async () => {
    const tasks: Array<{
      abort: ReturnType<typeof vi.fn>
    }> = []
    const request = vi.fn((options: CallbackOptions) => {
      const task = {
        abort: vi.fn(() => {
          options.fail({
            errMsg: 'request:fail abort'
          })
        })
      }
      tasks.push(task)
      return task
    })
    vi.stubGlobal('uni', {
      request
    })
    const source = createCancelSource()
    const http = createLuchRequest()
    const first = http.get('/first', {
      signal: source.signal
    })
    const second = http.get('/second', {
      signal: source.signal
    })
    const firstError = first.catch((error: unknown) => error)
    const secondError = second.catch((error: unknown) => error)

    await Promise.all([
      new Promise<void>((resolve) => first.onTask(() => resolve())),
      new Promise<void>((resolve) => second.onTask(() => resolve()))
    ])
    source.cancel('批量取消')

    await expect(firstError).resolves.toMatchObject({
      code: LuchRequestError.ERR_CANCELED,
      message: '批量取消',
      cancelMode: CancellationMode.NATIVE
    })
    await expect(secondError).resolves.toMatchObject({
      code: LuchRequestError.ERR_CANCELED,
      message: '批量取消',
      cancelMode: CancellationMode.NATIVE
    })
    expect(tasks).toHaveLength(2)
    expect(tasks[0]?.abort).toHaveBeenCalledOnce()
    expect(tasks[1]?.abort).toHaveBeenCalledOnce()
  })

  it('已取消 signal 会阻止后续请求进入 uni API', async () => {
    const request = vi.fn()
    vi.stubGlobal('uni', {
      request
    })
    const source = createCancelSource()
    source.cancel('请求前取消')

    await expect(
      createLuchRequest().get('/users', {
        signal: source.signal
      })
    ).rejects.toMatchObject({
      code: LuchRequestError.ERR_CANCELED,
      message: '请求前取消',
      cancelMode: CancellationMode.LOGICAL
    })
    expect(request).not.toHaveBeenCalled()
  })
})
