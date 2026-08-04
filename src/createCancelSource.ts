import type {
  AbortSignalLike,
  CancelSource
} from './types'

/**
 * 创建不依赖原生 AbortController 的取消源。
 * signal 可由多个请求共享，cancel 只采用第一次调用提供的原因。
 */
export function createCancelSource(): CancelSource {
  const listeners = new Set<() => void>()
  let aborted = false
  let reason: unknown

  const signal: AbortSignalLike = {
    get aborted(): boolean {
      return aborted
    },
    get reason(): unknown {
      return reason
    },
    addEventListener(
      type: 'abort',
      listener: () => void
    ): void {
      if (type !== 'abort' || aborted) {
        return
      }

      listeners.add(listener)
    },
    removeEventListener(
      type: 'abort',
      listener: () => void
    ): void {
      if (type === 'abort') {
        listeners.delete(listener)
      }
    }
  }

  return {
    signal,
    cancel(cancelReason?: unknown): void {
      if (aborted) {
        return
      }

      aborted = true
      reason = cancelReason
      const pendingListeners = Array.from(listeners)
      listeners.clear()

      for (const listener of pendingListeners) {
        try {
          listener()
        } catch {
          // 单个监听者异常不得阻止其他请求收到取消通知。
        }
      }
    }
  }
}
