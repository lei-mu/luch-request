import { LuchRequestError } from '../core/LuchRequestError'
import type { TaskController } from '../core/TaskController'
import type { NativeTask } from '../types'

declare const uni: unknown

/** 首版支持的三个 uni 网络 API。 */
type UniMethodName = 'request' | 'uploadFile' | 'downloadFile'

type UniCallbackOptions<TResult> = Record<string, unknown> & {
  success: (result: TResult) => void
  fail: (error: unknown) => void
}

type UniMethod<TResult, TTask extends NativeTask> = (
  options: UniCallbackOptions<TResult>
) => TTask

/**
 * 运行时读取 uni 方法，避免静态依赖某个平台专有的全局对象类型。
 */
function getUniMethod<TResult, TTask extends NativeTask>(
  name: UniMethodName
): UniMethod<TResult, TTask> {
  if (typeof uni !== 'object' || uni === null) {
    throw new LuchRequestError(
      'uni API is not available in the current runtime',
      LuchRequestError.ERR_INVALID_CONFIG
    )
  }

  const runtime = uni as Record<string, unknown>
  const method = runtime[name]

  if (typeof method !== 'function') {
    throw new LuchRequestError(
      `uni.${name} is not supported in the current runtime`,
      LuchRequestError.ERR_INVALID_CONFIG
    )
  }

  return (options) => (
    Reflect.apply(method, runtime, [options]) as TTask
  )
}

/**
 * 将 callback 风格的 uni API 转换为标准 Promise，并同步登记原生 Task。
 * adapter 不解释平台错误，错误分类由上层请求管线统一处理。
 */
export function invokeUni<
  TResult,
  TTask extends NativeTask
>(
  name: UniMethodName,
  options: Record<string, unknown>,
  controller: TaskController<TTask>
): Promise<TResult> {
  return new Promise<TResult>((resolve, reject) => {
    let task: TTask

    try {
      const method = getUniMethod<TResult, TTask>(name)
      // callback 必须最后注入，防止透传配置覆盖内部 settle 行为。
      task = method({
        ...options,
        success: resolve,
        fail: reject
      })
    } catch (error) {
      reject(error)
      return
    }

    controller.setTask(task)
  })
}
