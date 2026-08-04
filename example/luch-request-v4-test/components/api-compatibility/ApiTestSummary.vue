<script setup lang="ts">
import type { ApiTestCounts } from '../../types/api-compatibility'

defineProps<{
  busy: boolean
  counts: ApiTestCounts
  runningAll: boolean
}>()

const emit = defineEmits<{
  clear: []
  runAll: []
}>()
</script>

<template>
  <view class="summary">
    <view class="metrics">
      <view class="metric">
        <text class="metric-value">{{ counts.total }}</text>
        <text class="metric-label">全部</text>
      </view>
      <view class="metric metric--passed">
        <text class="metric-value">{{ counts.passed }}</text>
        <text class="metric-label">通过</text>
      </view>
      <view class="metric metric--failed">
        <text class="metric-value">{{ counts.failed }}</text>
        <text class="metric-label">失败</text>
      </view>
      <view class="metric metric--unsupported">
        <text class="metric-value">{{ counts.unsupported }}</text>
        <text class="metric-label">不支持</text>
      </view>
      <view class="metric">
        <text class="metric-value">{{ counts.pending }}</text>
        <text class="metric-label">待运行</text>
      </view>
    </view>

    <view class="actions">
      <button
        class="action-button action-button--primary"
        :disabled="busy"
        :loading="runningAll"
        @click="emit('runAll')"
      >
        {{ runningAll ? '检测进行中' : '运行全部' }}
      </button>
      <button
        class="action-button action-button--secondary"
        :disabled="busy"
        @click="emit('clear')"
      >
        清空结果
      </button>
    </view>
  </view>
</template>

<style scoped>
.summary {
  margin-top: 24rpx;
  padding: 28rpx;
  background: #ffffff;
  border: 1rpx solid #dedbd2;
  border-radius: 24rpx;
}

.metrics {
  display: flex;
}

.metric {
  position: relative;
  flex: 1;
  min-width: 0;
  text-align: center;
}

.metric + .metric::before {
  position: absolute;
  top: 8rpx;
  bottom: 8rpx;
  left: 0;
  width: 1rpx;
  background: #e7e5df;
  content: '';
}

.metric-value,
.metric-label {
  display: block;
}

.metric-value {
  color: #252925;
  font-size: 34rpx;
  font-weight: 800;
}

.metric-label {
  margin-top: 5rpx;
  color: #7a7d78;
  font-size: 19rpx;
}

.metric--passed .metric-value {
  color: #287a43;
}

.metric--failed .metric-value {
  color: #b63b34;
}

.metric--unsupported .metric-value {
  color: #9a671d;
}

.actions {
  display: flex;
  margin-top: 28rpx;
}

.action-button {
  flex: 1;
  height: 78rpx;
  margin: 0;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 78rpx;
}

.action-button::after {
  border: 0;
}

.action-button--primary {
  background: #2b6242;
  color: #ffffff;
}

.action-button--secondary {
  margin-left: 16rpx;
  background: #eceae4;
  color: #3c423d;
}
</style>
