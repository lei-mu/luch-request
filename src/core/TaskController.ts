import {
  CancellationMode,
  LuchRequestError
} from './LuchRequestError'
import type {
  AbortSignalLike,
  LuchRequestControl,
  LuchRequestPromise,
  NativeTask,
  TaskListener
} from '../types'

/** 将取消状态转换为包含当前上下文的统一错误。 */
type CancelErrorFactory<TTask extends NativeTask> = (
  reason: unknown,
  task: TTask | undefined,
  abortCause: unknown,
  cancelMode: CancellationMode
) => LuchRequestError

/**
 * 协调 Promise、可延迟产生的原生 Task 和可选 signal。
 * 该控制器只管理单次调用，不在请求之间共享状态。
 */
export class TaskController<TTask extends NativeTask> {
  private taskValue: TTask | undefined
  private readonly taskListeners = new Set<TaskListener<TTask>>()
  private readonly requestControl: LuchRequestControl = {
    abort: (reason?: string): void => {
      this.abort(reason)
    }
  }
  private signal: AbortSignalLike | undefined
  private signalListener: (() => void) | undefined
  private canceled = false
  private settled = false
  private cancelReason: unknown
  private abortCause: unknown
  private cancelMode: CancellationMode = CancellationMode.LOGICAL
  private cancelListener: ((
    reason: unknown,
    task: TTask | undefined,
    abortCause: unknown,
    cancelMode: CancellationMode
  ) => void) | undefined

  get task(): TTask | undefined {
    return this.taskValue
  }

  get isCanceled(): boolean {
    return this.canceled
  }

  /** 记录原生 Task，并通知在异步 interceptor 期间提前注册的监听者。 */
  setTask(task: TTask): void {
    this.taskValue = task

    if (this.canceled) {
      // 请求在 Task 创建前已取消，Task 一出现就补做原生中断。
      this.abortNativeTask()
      return
    }

    for (const listener of this.taskListeners) {
      this.notifyTaskListener(listener, task)
    }
  }

  /**
   * 订阅 Task 创建事件。Task 已存在时同步触发，返回函数用于取消订阅。
   */
  onTask(listener: TaskListener<TTask>): () => void {
    if (this.taskValue) {
      this.notifyTaskListener(listener, this.taskValue)
      return () => {}
    }

    if (this.settled) {
      return () => {}
    }

    this.taskListeners.add(listener)
    return () => {
      this.taskListeners.delete(listener)
    }
  }

  /** 幂等取消当前调用，并立即通知 Promise 取消分支。 */
  abort(reason: unknown): void {
    if (this.canceled || this.settled) {
      return
    }

    this.canceled = true
    this.cancelReason = reason
    this.abortNativeTask()
    this.cancelListener?.(
      reason,
      this.taskValue,
      this.abortCause,
      this.cancelMode
    )
  }

  /**
   * 接入结构化 signal；切换 signal 时先释放旧监听，防止泄漏。
   */
  connectSignal(signal: AbortSignalLike | undefined): void {
    if (signal === this.signal) {
      if (signal?.aborted) {
        this.abort(signal.reason)
      }
      return
    }

    this.disconnectSignal()

    if (!signal) {
      return
    }

    if (signal.aborted) {
      this.abort(signal.reason)
      return
    }

    const listener = (): void => {
      this.abort(signal.reason)
    }

    signal.addEventListener('abort', listener, { once: true })
    this.signal = signal
    this.signalListener = listener
  }

  setCancelListener(listener: (
    reason: unknown,
    task: TTask | undefined,
    abortCause: unknown,
    cancelMode: CancellationMode
  ) => void): void {
    this.cancelListener = listener
  }

  /** 在进入 adapter 前后检查取消状态，阻止晚到结果继续流转。 */
  throwIfCanceled(
    createError: CancelErrorFactory<TTask>
  ): void {
    if (this.canceled) {
      throw createError(
        this.cancelReason,
        this.taskValue,
        this.abortCause,
        this.cancelMode
      )
    }
  }

  /** 请求完成后清理 listener，后续 abort 不再改变已完成结果。 */
  markSettled(): void {
    this.settled = true
    this.cancelListener = undefined
    this.taskListeners.clear()
    this.disconnectSignal()
  }

  /**
   * 能力检测后调用原生 abort；能力缺失或调用失败时保持逻辑取消。
   */
  private abortNativeTask(): void {
    if (!this.taskValue?.abort) {
      return
    }

    try {
      this.taskValue.abort()
      this.cancelMode = CancellationMode.NATIVE
    } catch (error) {
      this.abortCause = error
      this.cancelMode = CancellationMode.LOGICAL
    }
  }

  private disconnectSignal(): void {
    const signal = this.signal
    const listener = this.signalListener
    this.signal = undefined
    this.signalListener = undefined

    if (signal && listener) {
      try {
        signal.removeEventListener('abort', listener)
      } catch {
        // signal 清理是尽力而为，不得改变已经完成或正在切换的请求结果。
      }
    }
  }

  /** Task listener 是观察者，其异常不得影响网络请求生命周期。 */
  private notifyTaskListener(
    listener: TaskListener<TTask>,
    task: TTask
  ): void {
    try {
      listener(task, this.requestControl)
    } catch {
      // 调用方可在 listener 内自行处理异常，本库只隔离请求主流程。
    }
  }
}

/**
 * 创建标准 Promise，并以竞速方式加入立即生效的取消分支。
 * 原生 Promise 本体通过不可枚举属性获得 abort、onTask 和 task。
 */
export function createControlledPromise<
  TValue,
  TTask extends NativeTask
>(
  execute: (controller: TaskController<TTask>) => Promise<TValue>,
  createCancelError: CancelErrorFactory<TTask>
): LuchRequestPromise<TValue, TTask> {
  let rejectCancellation: (error: LuchRequestError) => void = () => {}

  const cancellation = new Promise<never>((_resolve, reject) => {
    rejectCancellation = reject
  })
  const controller = new TaskController<TTask>()

  controller.setCancelListener((
    reason,
    task,
    abortCause,
    cancelMode
  ) => {
    rejectCancellation(
      createCancelError(
        reason,
        task,
        abortCause,
        cancelMode
      )
    )
  })

  const execution = Promise.resolve().then(async () => {
    // 延迟到微任务执行，使调用方可在请求管线启动前立即 abort。
    controller.throwIfCanceled(createCancelError)
    return execute(controller)
  })
  const result = Promise.race([
    execution,
    cancellation
  ]) as LuchRequestPromise<TValue, TTask>

  Object.defineProperties(result, {
    abort: {
      value: (reason?: string): void => {
        controller.abort(reason)
      }
    },
    onTask: {
      value: (listener: TaskListener<TTask>): (() => void) => (
        controller.onTask(listener)
      )
    },
    task: {
      get: (): TTask | undefined => controller.task
    }
  })

  result.then(
    () => controller.markSettled(),
    () => controller.markSettled()
  )

  return result
}
