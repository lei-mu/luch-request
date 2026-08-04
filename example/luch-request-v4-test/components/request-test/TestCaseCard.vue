<script setup lang="ts">
import { computed } from 'vue'
import type { RequestTestCase } from '../../types/request-test'

const props = defineProps<{
  disabled: boolean
  testCase: RequestTestCase
}>()

const emit = defineEmits<{
  run: [id: string]
}>()

const statusText = computed(() => {
  const labels = {
    idle: '待运行',
    running: '运行中',
    passed: '已通过',
    failed: '失败'
  }

  return labels[props.testCase.status]
})
</script>

<template>
  <view :class="['test-card', `test-card--${testCase.status}`]">
    <view class="test-content">
      <view class="test-heading">
        <text class="test-name">{{ testCase.name }}</text>
        <text :class="['status', `status--${testCase.status}`]">{{ statusText }}</text>
      </view>
      <text class="test-description">{{ testCase.description }}</text>

      <view v-if="testCase.detail" class="detail">
        <text class="detail-text" selectable>{{ testCase.detail }}</text>
      </view>

      <view v-if="testCase.duration !== undefined" class="duration">
        耗时 {{ testCase.duration }} ms
      </view>
    </view>

    <button
      class="run-button"
      :disabled="disabled || testCase.status === 'running'"
      :loading="testCase.status === 'running'"
      @click="emit('run', testCase.id)"
    >
      运行
    </button>
  </view>
</template>

<style scoped>
.test-card {
  display: flex;
  align-items: flex-start;
  padding: 28rpx;
  background: #ffffff;
  border: 1rpx solid #e2dfd7;
  border-left: 8rpx solid #c6c5bf;
  border-radius: 20rpx;
}

.test-card--running {
  border-left-color: #b47b22;
}

.test-card--passed {
  border-left-color: #348a51;
}

.test-card--failed {
  border-left-color: #c2473f;
}

.test-content {
  flex: 1;
  min-width: 0;
}

.test-heading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.test-name {
  color: #242824;
  font-size: 29rpx;
  font-weight: 750;
}

.status {
  margin-left: 12rpx;
  padding: 5rpx 12rpx;
  background: #e9e8e3;
  border-radius: 999rpx;
  color: #696c68;
  font-size: 19rpx;
  font-weight: 700;
}

.status--running {
  background: #fff0d2;
  color: #8b5d17;
}

.status--passed {
  background: #e1f3e6;
  color: #276a3d;
}

.status--failed {
  background: #f9e2df;
  color: #9f342e;
}

.test-description {
  display: block;
  margin-top: 10rpx;
  color: #70746f;
  font-size: 24rpx;
  line-height: 1.55;
}

.detail {
  margin-top: 16rpx;
  padding: 16rpx;
  background: #f5f4ef;
  border-radius: 12rpx;
}

.detail-text {
  display: block;
  color: #4d554f;
  font-family: monospace;
  font-size: 21rpx;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
}

.duration {
  margin-top: 12rpx;
  color: #999b97;
  font-size: 20rpx;
}

.run-button {
  flex: none;
  width: 116rpx;
  height: 64rpx;
  margin: 0 0 0 22rpx;
  background: #e7eee9;
  border-radius: 14rpx;
  color: #235d39;
  font-size: 23rpx;
  font-weight: 700;
  line-height: 64rpx;
}

.run-button::after {
  border: 0;
}
</style>
