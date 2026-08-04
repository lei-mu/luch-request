<script setup lang="ts">
import { shallowRef } from 'vue'
import {
  isLuchRequestError,
  LuchRequestError
} from 'luch-request'
import ProjectActionCard from '../../components/project-usage/ProjectActionCard.vue'
import ProjectLogPanel from '../../components/project-usage/ProjectLogPanel.vue'
import ProjectUsageHeader from '../../components/project-usage/ProjectUsageHeader.vue'
import { useProjectLogs } from '../../composables/useProjectLogs'
import { projectRequest } from '../../request/projectClient'

const codeExample = `request.interceptors.request.use((config) => ({
  ...config,
  header: { ...config.header, Authorization: getToken() }
}))

request.interceptors.response.use(
  response => response,
  error => { throw error }
)`

const isBusy = shallowRef(false)
const {
  addError,
  addLog,
  clearLogs,
  copyLogs,
  logs,
  platformLabel
} = useProjectLogs('拦截器与错误')

async function runAuthorizedRequest(): Promise<void> {
  if (isBusy.value) {
    return
  }

  isBusy.value = true
  addLog('info', '发起带 requiresAuth 元数据的请求')

  try {
    const response = await projectRequest.get('/api/users', {
      luchMeta: {
        requiresAuth: true,
        traceName: 'project-auth-check'
      }
    })
    const authorization = response.config.header?.['X-Demo-Authorization']

    if (authorization !== 'project-interceptor-enabled') {
      throw new Error('request interceptor 没有写入预期 header')
    }

    addLog('success', '项目级 request interceptor 表现正常', {
      authorization,
      statusCode: response.statusCode,
      traceName: response.config.luchMeta?.traceName
    })
  } catch (error) {
    addError('request interceptor 验证失败', error)
  } finally {
    isBusy.value = false
  }
}

async function runBadStatus(): Promise<void> {
  if (isBusy.value) {
    return
  }

  isBusy.value = true
  addLog('info', '请求真实 HTTP 500，预期得到 ERR_BAD_STATUS')

  try {
    await projectRequest.get('/api/status/500', {
      luchMeta: {
        traceName: 'project-http-500'
      }
    })
    addLog('error', 'HTTP 500 被错误地当作成功响应')
  } catch (error) {
    if (
      isLuchRequestError(error) &&
      error.code === LuchRequestError.ERR_BAD_STATUS &&
      error.response !== undefined
    ) {
      addLog('success', 'HTTP 状态错误归一化正常', {
        code: error.code,
        hasResponse: true,
        statusCode: error.toJSON().statusCode
      })
    } else {
      addError('HTTP 状态错误结构异常', error)
    }
  } finally {
    isBusy.value = false
  }
}

async function runNetworkError(): Promise<void> {
  if (isBusy.value) {
    return
  }

  isBusy.value = true
  addLog('info', '请求无效域名，预期得到无 response 的 ERR_NETWORK')

  try {
    await projectRequest.get('https://invalid.invalid/luch-request-v4', {
      timeout: 3000,
      luchMeta: {
        traceName: 'project-network-error'
      }
    })
    addLog('error', '无效域名被错误地当作成功响应')
  } catch (error) {
    if (
      isLuchRequestError(error) &&
      error.code === LuchRequestError.ERR_NETWORK &&
      error.response === undefined
    ) {
      addLog('success', '网络错误归一化正常', {
        code: error.code,
        hasResponse: false,
        nativeCause: error.cause
      })
    } else {
      addError('网络错误结构异常', error)
    }
  } finally {
    isBusy.value = false
  }
}
</script>

<template>
  <view class="page">
    <ProjectUsageHeader
      description="集中安装 interceptor，并明确区分有 response 的 HTTP 错误与无 response 的网络错误。"
      eyebrow="INTERCEPTOR PIPELINE"
      :platform="platformLabel"
      title="拦截器与错误"
    />

    <view class="code-card">
      <text class="code-text" selectable>{{ codeExample }}</text>
    </view>

    <view class="action-list">
      <ProjectActionCard
        :busy="isBusy"
        button-text="验证 interceptor"
        description="通过 luchMeta 触发项目级 header 注入，并检查最终 config。"
        title="项目级鉴权示例"
        @run="runAuthorizedRequest"
      />
      <ProjectActionCard
        :busy="isBusy"
        button-text="请求 HTTP 500"
        description="预期 code 为 ERR_BAD_STATUS，且 error.response 存在。"
        title="HTTP 状态错误"
        @run="runBadStatus"
      />
      <ProjectActionCard
        :busy="isBusy"
        button-text="制造网络错误"
        description="预期 code 为 ERR_NETWORK，且 error.response 不存在。"
        title="网络层错误"
        @run="runNetworkError"
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
