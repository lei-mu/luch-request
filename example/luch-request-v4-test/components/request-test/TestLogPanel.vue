<script setup lang="ts">
import type { TestLog } from '../../types/request-test'

defineProps<{
  logs: readonly TestLog[]
}>()
</script>

<template>
  <view class="log-section">
    <view class="log-heading">
      <view>
        <text class="log-kicker">LIVE OUTPUT</text>
        <text class="log-title">运行日志</text>
      </view>
      <text class="log-count">{{ logs.length }} 条</text>
    </view>

    <view v-if="logs.length === 0" class="empty">
      <text class="empty-text">运行测试后，结果会显示在这里。</text>
    </view>

    <scroll-view v-else class="log-list" scroll-y>
      <view
        v-for="log in logs"
        :key="log.id"
        :class="['log-item', `log-item--${log.level}`]"
      >
        <view class="log-meta">
          <text class="log-time">{{ log.time }}</text>
          <text class="log-level">{{ log.level }}</text>
        </view>
        <text class="log-message">{{ log.message }}</text>
        <text v-if="log.details" class="log-details" selectable>{{ log.details }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.log-section {
  margin-top: 36rpx;
  overflow: hidden;
  background: #171c18;
  border-radius: 24rpx;
}

.log-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 28rpx 30rpx 22rpx;
  border-bottom: 1rpx solid #303731;
}

.log-kicker,
.log-title {
  display: block;
}

.log-kicker {
  color: #79aa89;
  font-size: 19rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
}

.log-title {
  margin-top: 8rpx;
  color: #f0f2ee;
  font-size: 34rpx;
  font-weight: 750;
}

.log-count {
  color: #8d978f;
  font-size: 21rpx;
}

.empty {
  padding: 42rpx 30rpx;
}

.empty-text {
  color: #7f8981;
  font-size: 24rpx;
}

.log-list {
  height: 560rpx;
}

.log-item {
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #292f2a;
}

.log-item--success {
  box-shadow: inset 5rpx 0 #4d9d67;
}

.log-item--error {
  box-shadow: inset 5rpx 0 #c65a50;
}

.log-meta {
  display: flex;
}

.log-time,
.log-level {
  color: #7e8980;
  font-family: monospace;
  font-size: 19rpx;
}

.log-level {
  margin-left: 12rpx;
}

.log-message {
  display: block;
  margin-top: 8rpx;
  color: #e6e9e4;
  font-size: 24rpx;
  line-height: 1.5;
}

.log-details {
  display: block;
  margin-top: 12rpx;
  color: #aeb9b0;
  font-family: monospace;
  font-size: 20rpx;
  line-height: 1.55;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
