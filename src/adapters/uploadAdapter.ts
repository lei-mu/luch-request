import { invokeUni } from './invokeUni'
import type { TaskController } from '../core/TaskController'
import type {
  NativeUploadResponse,
  TransferTask
} from '../types'

/** 调用 uni.uploadFile，并保留平台扩展响应字段和 UploadTask。 */
export function uploadAdapter(
  options: Record<string, unknown>,
  controller: TaskController<TransferTask>
): Promise<NativeUploadResponse & Record<string, unknown>> {
  return invokeUni('uploadFile', options, controller)
}
