<script setup lang="ts">
import { shallowRef } from 'vue'
import {
  createCancelSource,
  isLuchRequestError,
  LuchRequestError
} from 'luch-request'
import ProjectActionCard from '../../components/project-usage/ProjectActionCard.vue'
import ProjectLogPanel from '../../components/project-usage/ProjectLogPanel.vue'
import ProjectUsageHeader from '../../components/project-usage/ProjectUsageHeader.vue'
import { useProjectLogs } from '../../composables/useProjectLogs'
import { projectRequest } from '../../request/projectClient'

const codeExample = `const pending = request.get('/api/slow')
pending.onTask(task => console.log('Task ready', task))
pending.abort('用户取消')

const source = createCancelSource()
request.get('/api/slow', { signal: source.signal })
source.cancel('批量取消')`

const isBusy = shallowRef(false)
const {
  addError,
  addLog,
  clearLogs,
  copyLogs,
  logs,
  platformLabel
} = useProjectLogs('取消与 Task')

async function runTaskAbort(): Promise<void> {
  if (isBusy.value) {
    return
  }

  isBusy.value = true
  addLog('info', '发起慢请求，取得原生 Task 后调用 abort')
  const pending = projectRequest.get('/api/slow', {
    luchMeta: {
      traceName: 'project-task-abort'
    }
  })
  let taskReceived = false

  pending.onTask((task) => {
    taskReceived = true
    addLog('info', 'onTask 已返回当前平台的原生 Task', {
      hasAbort: typeof task.abort === 'function'
    })
    pending.abort('项目示例主动取消')
  })

  try {
    await pending
    addLog('error', '调用 abort 后请求仍成功完成')
  } catch (error) {
    if (
      isLuchRequestError(error) &&
      error.code === LuchRequestError.ERR_CANCELED &&
      taskReceived
    ) {
      addLog('success', 'Task 取消表现正常', {
        cancelMode: error.cancelMode,
        code: error.code,
        message: error.message,
        taskReceived
      })
    } else {
      addError('Task 取消结果异常', error)
    }
  } finally {
    isBusy.value = false
  }
}

async function runSharedCancelSource(): Promise<void> {
  if (isBusy.value) {
    return
  }

  isBusy.value = true
  addLog('info', '使用同一个 cancel source 启动两个慢请求')
  const source = createCancelSource()
  const requests = [1, 2].map((index) => (
    projectRequest.get('/api/slow', {
      signal: source.signal,
      luchMeta: {
        traceName: `project-shared-cancel-${index}`
      }
    })
  ))
  const timer = setTimeout(() => {
    source.cancel('项目示例共享取消')
  }, 100)

  try {
    const results = await Promise.all(
      requests.map(async (request) => {
        try {
          await request
          return undefined
        } catch (error) {
          return error
        }
      })
    )
    const canceled = results.filter((error) => (
      isLuchRequestError(error) &&
      error.code === LuchRequestError.ERR_CANCELED
    ))

    if (canceled.length !== requests.length) {
      throw new Error(`预期取消 ${requests.length} 个请求，实际 ${canceled.length} 个`)
    }

    addLog('success', '共享 cancel source 表现正常', {
      canceledCount: canceled.length,
      reason: source.signal.reason,
      total: requests.length
    })
  } catch (error) {
    addError('共享 cancel source 验证失败', error)
  } finally {
    clearTimeout(timer)
    isBusy.value = false
  }
}
</script>

<template>
  <view class="page">
    <ProjectUsageHeader
      description="不假设全平台存在 AbortController，直接验证库提供的 abort、onTask 和 cancel source。"
      eyebrow="TASK & CANCELLATION"
      :platform="platformLabel"
      title="取消与原生 Task"
    />

    <view class="code-card">
      <text class="code-text" selectable>{{ codeExample }}</text>
    </view>

    <view class="action-list">
      <ProjectActionCard
        :busy="isBusy"
        button-text="验证 Task 取消"
        description="记录是否取得原生 Task，以及最终 native/logical 取消模式。"
        title="onTask + abort"
        @run="runTaskAbort"
      />
      <ProjectActionCard
        :busy="isBusy"
        button-text="取消两个请求"
        description="同一个 signal 同时控制两个请求，并保留第一次取消原因。"
        title="共享 cancel source"
        @run="runSharedCancelSource"
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
