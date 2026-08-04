import { invokeUni } from './invokeUni'
import type { TaskController } from '../core/TaskController'
import type {
  NativeRequestResponse,
  RequestTask
} from '../types'

/** 调用 uni.request，并保留平台扩展响应字段和 RequestTask。 */
export function requestAdapter(
  options: Record<string, unknown>,
  controller: TaskController<RequestTask>
): Promise<NativeRequestResponse<unknown> & Record<string, unknown>> {
  return invokeUni('request', options, controller)
}
