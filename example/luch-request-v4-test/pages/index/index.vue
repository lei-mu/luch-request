<script setup lang="ts">
  import TestCaseCard from '../../components/request-test/TestCaseCard.vue'
  import TestLogPanel from '../../components/request-test/TestLogPanel.vue'
  import TestSummary from '../../components/request-test/TestSummary.vue'
  import { MOCK_BASE_URL } from '../../request/client'
  import { useRequestTests } from '../../composables/useRequestTests'

  const navigationItems = [
    {
      description: '复用项目唯一实例，验证默认配置、GET 与 POST。',
      path: '/pages/project-basic/index',
      title: '共享实例'
    },
    {
      description: '观察项目级 interceptor、HTTP 错误与网络错误。',
      path: '/pages/project-interceptors/index',
      title: '拦截器与错误'
    },
    {
      description: '验证 onTask、abort 与 createCancelSource。',
      path: '/pages/project-cancellation/index',
      title: '取消与 Task'
    },
    {
      description: '验证 download、upload、临时文件与进度回调。',
      path: '/pages/project-transfer/index',
      title: '上传与下载'
    },
    {
      description: '检测当前运行平台的关键 JavaScript API。',
      path: '/pages/api-compatibility/index',
      title: '运行时兼容检测'
    }
  ] as const

  const {
    counts,
    isBusy,
    isRunningAll,
    logs,
    platformLabel,
    testCases,
    clearResults,
    runAll,
    runTest
  } = useRequestTests()
</script>

<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">UNI-APP PLATFORM LAB</text>
      <text class="title">luch-request v4</text>
      <text class="subtitle">在真实运行平台中验证请求行为与兼容性</text>

      <view class="meta">
        <view class="meta-item">
          <text class="meta-label">当前平台</text>
          <text class="meta-value">{{ platformLabel }}</text>
        </view>
        <view class="meta-item">
          <text class="meta-label">Mock API</text>
          <text class="meta-value meta-value--url" selectable>{{ MOCK_BASE_URL }}</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-heading">
        <text class="section-kicker">PROJECT EXAMPLES</text>
        <text class="section-title">项目级用法</text>
      </view>

      <view class="navigation-list">
        <navigator
          v-for="item in navigationItems"
          :key="item.path"
          class="navigation-card"
          hover-class="navigation-card--active"
          :url="item.path"
        >
          <view class="navigation-copy">
            <text class="navigation-title">{{ item.title }}</text>
            <text class="navigation-description">{{ item.description }}</text>
          </view>
          <text class="navigation-arrow">→</text>
        </navigator>
      </view>
    </view>

    <TestSummary :busy="isBusy" :counts="counts" :running-all="isRunningAll" @clear="clearResults" @run-all="runAll" />

    <view class="section">
      <view class="section-heading">
        <text class="section-kicker">TEST CASES</text>
        <text class="section-title">测试用例</text>
      </view>

      <view class="test-list">
        <TestCaseCard v-for="testCase in testCases" :key="testCase.id" class="test-list-item" :disabled="isBusy"
          :test-case="testCase" @run="runTest" />
      </view>
    </view>

    <TestLogPanel :logs="logs" />
  </view>
</template>

<style scoped>
  page {
    background: #f4f2ed;
  }

  .page {
    min-height: 100vh;
    padding: 32rpx 28rpx 80rpx;
    box-sizing: border-box;
    color: #20231f;
  }

  .hero {
    padding: 42rpx 36rpx;
    background: #18221c;
    border-radius: 28rpx;
    color: #f8f5ec;
  }

  .eyebrow,
  .section-kicker {
    display: block;
    color: #9bbda5;
    font-size: 20rpx;
    font-weight: 700;
    letter-spacing: 3rpx;
  }

  .title {
    display: block;
    margin-top: 14rpx;
    font-size: 56rpx;
    font-weight: 800;
    line-height: 1.12;
  }

  .subtitle {
    display: block;
    margin-top: 16rpx;
    color: #cbd3cd;
    font-size: 27rpx;
    line-height: 1.6;
  }

  .meta {
    margin-top: 36rpx;
    padding-top: 28rpx;
    border-top: 1rpx solid rgba(255, 255, 255, 0.14);
  }

  .meta-item+.meta-item {
    margin-top: 18rpx;
  }

  .meta-label,
  .meta-value {
    display: block;
  }

  .meta-label {
    color: #91a498;
    font-size: 22rpx;
  }

  .meta-value {
    margin-top: 6rpx;
    font-size: 25rpx;
    font-weight: 600;
  }

  .meta-value--url {
    font-family: monospace;
    font-weight: 400;
    line-height: 1.5;
    word-break: break-all;
  }

  .section {
    margin-top: 34rpx;
  }

  .section-heading {
    margin-bottom: 20rpx;
  }

  .section-title {
    display: block;
    margin-top: 8rpx;
    font-size: 38rpx;
    font-weight: 750;
  }

  .test-list {
    display: flex;
    flex-direction: column;
  }

  .test-list-item+.test-list-item {
    margin-top: 18rpx;
  }

  .navigation-list {
    display: flex;
    flex-direction: column;
  }

  .navigation-card {
    display: flex;
    align-items: center;
    padding: 26rpx 28rpx;
    background: #ffffff;
    border: 1rpx solid #e2dfd7;
    border-radius: 20rpx;
  }

  .navigation-card + .navigation-card {
    margin-top: 16rpx;
  }

  .navigation-card--active {
    background: #edf3ee;
  }

  .navigation-copy {
    flex: 1;
    min-width: 0;
  }

  .navigation-title,
  .navigation-description {
    display: block;
  }

  .navigation-title {
    font-size: 29rpx;
    font-weight: 750;
  }

  .navigation-description {
    margin-top: 8rpx;
    color: #717771;
    font-size: 23rpx;
    line-height: 1.5;
  }

  .navigation-arrow {
    margin-left: 22rpx;
    color: #35714b;
    font-size: 36rpx;
    font-weight: 700;
  }
</style>
