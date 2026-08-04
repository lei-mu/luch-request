import { invokeUni } from './invokeUni'
import type { TaskController } from '../core/TaskController'
import type {
  NativeDownloadResponse,
  TransferTask
} from '../types'

/** 调用 uni.downloadFile，并保留平台扩展响应字段和 DownloadTask。 */
export function downloadAdapter(
  options: Record<string, unknown>,
  controller: TaskController<TransferTask>
): Promise<NativeDownloadResponse & Record<string, unknown>> {
  return invokeUni('downloadFile', options, controller)
}
