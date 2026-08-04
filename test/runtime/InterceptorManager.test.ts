import { describe, expect, it } from 'vitest'

import {
  InternalInterceptorManager
} from '../../src/core/InterceptorManager'
import { LuchOperation } from '../../src/core/LuchOperation'

describe('InterceptorManager', () => {
  it('公开稳定的 operation 常量', () => {
    expect(LuchOperation.REQUEST).toBe('request')
    expect(LuchOperation.UPLOAD).toBe('upload')
    expect(LuchOperation.DOWNLOAD).toBe('download')
  })

  it('按注册顺序遍历 interceptor', () => {
    const manager = new InternalInterceptorManager<number>()
    const calls: number[] = []

    manager.use((value) => value + 1)
    manager.use((value) => value + 2)
    manager.forEach((handler) => {
      calls.push(handler.fulfilled(0, {
        operation: LuchOperation.REQUEST
      }) as number)
    })

    expect(calls).toEqual([1, 2])
  })

  it('支持 eject 和 clear', () => {
    const manager = new InternalInterceptorManager<number>()
    const firstId = manager.use((value) => value + 1)
    manager.use((value) => value + 2)

    manager.eject(firstId)

    const afterEject: number[] = []
    manager.forEach((handler) => {
      afterEject.push(handler.fulfilled(0, {
        operation: LuchOperation.REQUEST
      }) as number)
    })
    expect(afterEject).toEqual([2])

    manager.clear()

    const afterClear: number[] = []
    manager.forEach((handler) => {
      afterClear.push(handler.fulfilled(0, {
        operation: LuchOperation.REQUEST
      }) as number)
    })
    expect(afterClear).toEqual([])
  })
})
