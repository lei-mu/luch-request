import type { LuchOperation } from './LuchOperation'

/** interceptor 可读取但不能通过请求配置覆盖的管线上下文。 */
export interface InterceptorContext {
  readonly operation: LuchOperation
}

/** interceptor 成功处理函数，允许同步或异步返回。 */
export type InterceptorFulfilled<TValue> = (
  value: TValue,
  context: InterceptorContext
) => TValue | PromiseLike<TValue>

/** interceptor 错误恢复函数，返回值会继续进入后续管线。 */
export type InterceptorRejected<TValue> = (
  error: unknown,
  context: InterceptorContext
) => TValue | PromiseLike<TValue>

/** 用户可操作的 interceptor 管理器公共接口。 */
export interface InterceptorManager<TValue> {
  use(
    fulfilled: InterceptorFulfilled<TValue>,
    rejected?: InterceptorRejected<TValue>
  ): number
  eject(id: number): void
  clear(): void
}

/** 单个 interceptor 的内部存储结构。 */
interface InterceptorHandler<TValue> {
  fulfilled: InterceptorFulfilled<TValue>
  rejected?: InterceptorRejected<TValue>
}

/**
 * 按注册顺序保存 interceptor。
 * eject 只留下空槽位，确保已有 ID 不会因删除操作发生变化。
 */
export class InternalInterceptorManager<TValue>
  implements InterceptorManager<TValue> {
  private handlers: Array<InterceptorHandler<TValue> | undefined> = []

  /** 注册 interceptor 并返回用于移除它的稳定 ID。 */
  use(
    fulfilled: InterceptorFulfilled<TValue>,
    rejected?: InterceptorRejected<TValue>
  ): number {
    const handler: InterceptorHandler<TValue> = rejected
      ? { fulfilled, rejected }
      : { fulfilled }

    this.handlers.push(handler)
    return this.handlers.length - 1
  }

  /** 移除指定 interceptor；未知或已移除的 ID 会被忽略。 */
  eject(id: number): void {
    if (id >= 0 && id < this.handlers.length) {
      this.handlers[id] = undefined
    }
  }

  /** 移除当前管理器中的全部 interceptor。 */
  clear(): void {
    this.handlers = []
  }

  /** 按注册顺序访问仍然有效的 interceptor。 */
  forEach(visitor: (handler: InterceptorHandler<TValue>) => void): void {
    for (const handler of this.handlers) {
      if (handler) {
        visitor(handler)
      }
    }
  }
}
