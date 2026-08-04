<script setup lang="ts">
import { shallowRef } from 'vue'
import ProjectActionCard from '../../components/project-usage/ProjectActionCard.vue'
import ProjectLogPanel from '../../components/project-usage/ProjectLogPanel.vue'
import ProjectUsageHeader from '../../components/project-usage/ProjectUsageHeader.vue'
import { useProjectLogs } from '../../composables/useProjectLogs'
import { projectRequest } from '../../request/projectClient'
import type {
  ApiEnvelope,
  UserListPayload
} from '../../types/project-usage'

interface CreateUserPayload {
  id: string
  received: {
    name: string
    platform: string
  }
}

const codeExample = `// request/projectClient.ts
export const request = createLuchRequest({ baseURL, timeout: 10000 })

// 任意业务页面
import { request } from '@/request/projectClient'
const response = await request.get('/api/users')`

const isBusy = shallowRef(false)
const {
  addError,
  addLog,
  clearLogs,
  copyLogs,
  logs,
  platformLabel
} = useProjectLogs('共享实例')

async function runGet(): Promise<void> {
  if (isBusy.value) {
    return
  }

  isBusy.value = true
  addLog('info', '页面通过共享实例发起 GET 请求')

  try {
    const response = await projectRequest.get<ApiEnvelope<UserListPayload>>(
      '/api/users',
      {
        params: {
          source: 'project-basic'
        },
        luchMeta: {
          traceName: 'project-basic-get'
        }
      }
    )

    const projectHeader = response.config.header?.['X-Luch-Project']

    if (response.statusCode !== 200 || projectHeader !== 'luch-request-v4-test') {
      throw new Error('共享默认配置或响应状态不符合预期')
    }

    addLog('success', '共享实例 GET 表现正常', {
      businessCode: response.data.code,
      fullURL: response.config.fullURL,
      hasNativeTask: response.task !== undefined,
      listLength: response.data.data.list.length,
      projectHeader,
      statusCode: response.statusCode
    })
  } catch (error) {
    addError('共享实例 GET 验证失败', error)
  } finally {
    isBusy.value = false
  }
}

async function runPost(): Promise<void> {
  if (isBusy.value) {
    return
  }

  isBusy.value = true
  addLog('info', '页面通过共享实例发起 POST 请求')

  try {
    const response = await projectRequest.post<
      ApiEnvelope<CreateUserPayload>,
      CreateUserPayload['received']
    >(
      '/api/users',
      {
        name: '跨平台测试用户',
        platform: platformLabel
      },
      {
        luchMeta: {
          traceName: 'project-basic-post'
        }
      }
    )

    if (response.data.code !== 0 || typeof response.data.data.id !== 'string') {
      throw new Error('POST 响应结构不符合预期')
    }

    addLog('success', '共享实例 POST 表现正常', {
      id: response.data.data.id,
      received: response.data.data.received,
      statusCode: response.statusCode
    })
  } catch (error) {
    addError('共享实例 POST 验证失败', error)
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <view class="page">
    <ProjectUsageHeader
      description="项目只创建一个请求实例并统一配置，业务页面直接导入复用。"
      eyebrow="PROJECT CLIENT"
      :platform="platformLabel"
      title="共享请求实例"
    />

    <view class="code-card">
      <text class="code-text" selectable>{{ codeExample }}</text>
    </view>

    <view class="action-list">
      <ProjectActionCard
        :busy="isBusy"
        button-text="执行 GET"
        description="检查 baseURL、默认 header、泛型响应和原生 Task。"
        title="读取用户列表"
        @run="runGet"
      />
      <ProjectActionCard
        :busy="isBusy"
        button-text="执行 POST"
        description="检查请求体、业务响应和页面复用同一实例。"
        title="创建测试用户"
        @run="runPost"
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
page {
  background: #f4f2ed;
}

.page {
  min-height: 100vh;
  padding: 30rpx 28rpx 70rpx;
  box-sizing: border-box;
  color: #20231f;
}

.code-card {
  margin-top: 22rpx;
  padding: 24rpx;
  overflow: hidden;
  background: #ebe8df;
  border-radius: 18rpx;
}

.code-text {
  display: block;
  color: #39443c;
  font-family: monospace;
  font-size: 20rpx;
  line-height: 1.65;
  white-space: pre-wrap;
}

.action-list {
  margin-top: 24rpx;
}

.action-list :deep(.action-card + .action-card) {
  margin-top: 16rpx;
}
</style>
