<script setup lang="ts">
import ApiTestCard from '../../components/api-compatibility/ApiTestCard.vue'
import ApiTestSummary from '../../components/api-compatibility/ApiTestSummary.vue'
import { useApiCompatibilityTests } from '../../composables/useApiCompatibilityTests'

const {
  counts,
  isBusy,
  isRunningAll,
  platformLabel,
  testCases,
  clearResults,
  runAll,
  runTest
} = useApiCompatibilityTests()
</script>

<template>
  <view class="page">
    <view class="hero">
      <text class="eyebrow">RUNTIME CAPABILITY LAB</text>
      <text class="title">运行时 API 兼容检测</text>
      <text class="subtitle">
        在当前真实运行平台中检查 luch-request v4 使用的关键 JavaScript API。
      </text>

      <view class="platform">
        <text class="platform-label">当前平台</text>
        <text class="platform-value" selectable>{{ platformLabel }}</text>
      </view>
    </view>

    <view class="notice">
      <text class="notice-title">结果边界</text>
      <text class="notice-text">
        本页只能证明当前设备与当前版本的运行结果。页面能成功加载，才说明编译产物的现代语法已被当前引擎接受；它不能代替其他 App、小程序或 uni-app x 端的验证。
      </text>
    </view>

    <ApiTestSummary
      :busy="isBusy"
      :counts="counts"
      :running-all="isRunningAll"
      @clear="clearResults"
      @run-all="runAll"
    />

    <view class="section">
      <view class="section-heading">
        <text class="section-kicker">API TEST CASES</text>
        <text class="section-title">检测项目</text>
      </view>

      <view class="test-list">
        <ApiTestCard
          v-for="testCase in testCases"
          :key="testCase.id"
          class="test-list-item"
          :disabled="isBusy"
          :test-case="testCase"
          @run="runTest"
        />
      </view>
    </view>
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
  background: #17231d;
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
  font-size: 48rpx;
  font-weight: 800;
  line-height: 1.18;
}

.subtitle {
  display: block;
  margin-top: 16rpx;
  color: #cbd3cd;
  font-size: 26rpx;
  line-height: 1.6;
}

.platform {
  margin-top: 30rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.14);
}

.platform-label,
.platform-value {
  display: block;
}

.platform-label {
  color: #91a498;
  font-size: 21rpx;
}

.platform-value {
  margin-top: 7rpx;
  font-family: monospace;
  font-size: 24rpx;
  line-height: 1.5;
}

.notice {
  margin-top: 22rpx;
  padding: 24rpx 26rpx;
  background: #fff7df;
  border: 1rpx solid #ead6a0;
  border-radius: 20rpx;
}

.notice-title {
  display: block;
  color: #795619;
  font-size: 24rpx;
  font-weight: 750;
}

.notice-text {
  display: block;
  margin-top: 8rpx;
  color: #725f37;
  font-size: 23rpx;
  line-height: 1.6;
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

.test-list-item + .test-list-item {
  margin-top: 18rpx;
}
</style>
