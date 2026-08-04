<script setup lang="ts">
import { shallowRef } from 'vue'
import type { TransferTask } from 'luch-request'
import ProjectActionCard from '../../components/project-usage/ProjectActionCard.vue'
import ProjectLogPanel from '../../components/project-usage/ProjectLogPanel.vue'
import ProjectUsageHeader from '../../components/project-usage/ProjectUsageHeader.vue'
import { useProjectLogs } from '../../composables/useProjectLogs'
import { projectRequest } from '../../request/projectClient'
import type {
  ApiEnvelope,
  UploadPayload
} from '../../types/project-usage'

const codeExample = `const download = request.download({ url: '/api/files/download' })
download.onTask(task => task.onProgressUpdate?.(onProgress))

await request.upload({
  url: '/api/files/upload',
  filePath,
  name: 'file'
})`

const isBusy = shallowRef(false)
const downloadedPath = shallowRef<string>()
const {
  addError,
  addLog,
  clearLogs,
  copyLogs,
  logs,
  platformLabel
} = useProjectLogs('上传与下载')

async function downloadFixture(): Promise<string> {
  const pending = projectRequest.download({
    url: '/api/files/download',
    luchMeta: {
      traceName: 'project-download'
    }
  })
  let lastProgress = -1

  pending.onTask((task: TransferTask) => {
    addLog('info', '已取得原生 DownloadTask', {
      supportsProgress: typeof task.onProgressUpdate === 'function'
    })
    task.onProgressUpdate?.((event) => {
      if (event.progress === 100 || event.progress - lastProgress >= 20) {
        lastProgress = event.progress
        addLog('info', `下载进度 ${event.progress}%`, event)
      }
    })
  })

  const response = await pending
  const filePath =
    response.tempFilePath || response.apFilePath || response.filePath

  if (!filePath) {
    throw new Error('下载响应没有返回可用临时文件路径')
  }

  downloadedPath.value = filePath
  addLog('success', '下载表现正常', {
    filePath,
    statusCode: response.statusCode
  })

  return filePath
}

async function runDownload(): Promise<void> {
  if (isBusy.value) {
    return
  }

  isBusy.value = true
  addLog('info', '开始下载跨平台测试文件')

  try {
    await downloadFixture()
  } catch (error) {
    addError('下载验证失败', error)
  } finally {
    isBusy.value = false
  }
}

async function runUpload(): Promise<void> {
  if (isBusy.value) {
    return
  }

  isBusy.value = true
  addLog('info', '准备上传测试；没有临时文件时会先下载')

  try {
    const filePath = downloadedPath.value || await downloadFixture()
    const pending = projectRequest.upload<ApiEnvelope<UploadPayload>>({
      url: '/api/files/upload',
      filePath,
      name: 'file',
      formData: {
        platform: platformLabel,
        source: 'project-transfer'
      },
      luchMeta: {
        traceName: 'project-upload'
      }
    })

    pending.onTask((task: TransferTask) => {
      addLog('info', '已取得原生 UploadTask', {
        supportsProgress: typeof task.onProgressUpdate === 'function'
      })
    })

    const response = await pending

    if (typeof response.data === 'string' || response.data.code !== 0) {
      throw new Error('上传响应没有按预期解析为业务对象')
    }

    addLog('success', '上传表现正常', {
      fileId: response.data.data.fileId,
      fileName: response.data.data.fileName,
      statusCode: response.statusCode
    })
  } catch (error) {
    addError('上传验证失败', error)
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <view class="page">
    <ProjectUsageHeader
      description="使用同一个项目实例验证文件 API、原生 Task、进度能力和 upload JSON 解析。"
      eyebrow="TRANSFER TASKS"
      :platform="platformLabel"
      title="上传与下载"
    />

    <view class="code-card">
      <text class="code-text" selectable>{{ codeExample }}</text>
    </view>

    <view class="action-list">
      <ProjectActionCard
        :busy="isBusy"
        button-text="下载测试文件"
        description="检查临时路径、状态码、DownloadTask 与可选进度回调。"
        title="项目级 download"
        @run="runDownload"
      />
      <ProjectActionCard
        :busy="isBusy"
        button-text="下载并上传"
        description="复用下载文件执行 upload，并检查默认 JSON 解析。"
        title="项目级 upload"
        @run="runUpload"
      />
    </view>

    <ProjectLogPanel
      :logs="logs"
      @clear="clearLogs"
      @copy="copyLogs"
    />
  </view>
</template>

<style scoped>
page { background: #f4f2ed; }
.page { min-height: 100vh; padding: 30rpx 28rpx 70rpx; box-sizing: border-box; color: #20231f; }
.code-card { margin-top: 22rpx; padding: 24rpx; overflow: hidden; background: #ebe8df; border-radius: 18rpx; }
.code-text { display: block; color: #39443c; font-family: monospace; font-size: 20rpx; line-height: 1.65; white-space: pre-wrap; }
.action-list { margin-top: 24rpx; }
.action-list :deep(.action-card + .action-card) { margin-top: 16rpx; }
</style>
