<script setup lang="ts">
import { computed } from 'vue'
import type { ApiCompatibilityTest } from '../../types/api-compatibility'

const props = defineProps<{
  disabled: boolean
  testCase: ApiCompatibilityTest
}>()

const emit = defineEmits<{
  run: [id: string]
}>()

const statusText = computed(() => {
  const labels = {
    idle: '待运行',
    running: '运行中',
    passed: '已通过',
    failed: '执行失败',
    unsupported: '不支持'
  }

  return labels[props.testCase.status]
})

const riskClass = computed(() => {
  const classes = {
    高: 'risk--high',
    中: 'risk--medium',
    低: 'risk--low'
  }

  return classes[props.testCase.risk]
})
</script>

<template>
  <view :class="['test-card', `test-card--${testCase.status}`]">
    <view class="test-content">
      <view class="test-heading">
        <text class="test-name">{{ testCase.name }}</text>
        <text :class="['risk', riskClass]">
          {{ testCase.risk }}风险
        </text>
        <text :class="['status', `status--${testCase.status}`]">
          {{ statusText }}
        </text>
      </view>

      <text class="test-description">{{ testCase.description }}</text>

      <view v-if="testCase.detail" class="detail">
        <text class="detail-text" selectable>{{ testCase.detail }}</text>
      </view>

      <text v-if="testCase.duration !== undefined" class="duration">
        耗时 {{ testCase.duration }} ms
      </text>
    </view>

    <button
      class="run-button"
      :disabled="disabled || testCase.status === 'running'"
      :loading="testCase.status === 'running'"
      @click="emit('run', testCase.id)"
    >
      检测
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
  border-left-color: #3975a7;
}

.test-card--passed {
  border-left-color: #348a51;
}

.test-card--failed {
  border-left-color: #c2473f;
}

.test-card--unsupported {
  border-left-color: #b47b22;
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
  margin-right: 12rpx;
  color: #242824;
  font-size: 28rpx;
  font-weight: 750;
}

.risk,
.status {
  margin: 4rpx 10rpx 4rpx 0;
  padding: 5rpx 11rpx;
  border-radius: 999rpx;
  font-size: 18rpx;
  font-weight: 700;
}

.risk {
  background: #edf0ec;
  color: #5f665f;
}

.risk--high {
  background: #f8dfdc;
  color: #9f342e;
}

.risk--medium {
  background: #fff0d2;
  color: #8b5d17;
}

.status {
  background: #e9e8e3;
  color: #696c68;
}

.status--running {
  background: #e1edf7;
  color: #2d658f;
}

.status--passed {
  background: #e1f3e6;
  color: #276a3d;
}

.status--failed {
  background: #f9e2df;
  color: #9f342e;
}

.status--unsupported {
  background: #fff0d2;
  color: #8b5d17;
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
  display: block;
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
