<script setup lang="ts">
import type { ProjectLog } from '../../types/project-usage'

defineProps<{
  logs: readonly ProjectLog[]
}>()

const emit = defineEmits<{
  clear: []
  copy: []
}>()
</script>

<template>
  <view class="log-panel">
    <view class="log-heading">
      <view>
        <text class="log-kicker">PLATFORM EVIDENCE</text>
        <text class="log-title">运行日志</text>
      </view>
      <text class="log-count">{{ logs.length }} 条</text>
    </view>

    <view class="log-actions">
      <button class="log-button log-button--primary" @click="emit('copy')">
        复制日志
      </button>
      <button class="log-button" @click="emit('clear')">清空</button>
    </view>

    <view v-if="logs.length === 0" class="empty">
      <text class="empty-text">执行上方操作后，这里会显示判断依据。</text>
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
        <text v-if="log.details" class="log-details" selectable>
          {{ log.details }}
        </text>
      </view>
    </scroll-view>
  </view>
</template>

<style scoped>
.log-panel {
  margin-top: 28rpx;
  overflow: hidden;
  background: #171c18;
  border-radius: 22rpx;
}

.log-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 26rpx 28rpx 20rpx;
  border-bottom: 1rpx solid #303731;
}

.log-kicker,
.log-title {
  display: block;
}

.log-kicker {
  color: #79aa89;
  font-size: 18rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
}

.log-title {
  margin-top: 7rpx;
  color: #f0f2ee;
  font-size: 32rpx;
  font-weight: 750;
}

.log-count {
  color: #8d978f;
  font-size: 20rpx;
}

.log-actions {
  display: flex;
  padding: 18rpx 28rpx;
  border-bottom: 1rpx solid #292f2a;
}

.log-button {
  flex: 1;
  height: 62rpx;
  margin: 0;
  background: #303731;
  border-radius: 12rpx;
  color: #c6cec8;
  font-size: 22rpx;
  line-height: 62rpx;
}

.log-button + .log-button {
  margin-left: 14rpx;
}

.log-button--primary {
  background: #386f4b;
  color: #ffffff;
}

.log-button::after {
  border: 0;
}

.empty {
  padding: 38rpx 28rpx;
}

.empty-text {
  color: #7f8981;
  font-size: 23rpx;
}

.log-list {
  height: 600rpx;
}

.log-item {
  padding: 22rpx 28rpx;
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
  font-size: 18rpx;
}

.log-level {
  margin-left: 12rpx;
}

.log-message {
  display: block;
  margin-top: 8rpx;
  color: #e6e9e4;
  font-size: 23rpx;
  line-height: 1.5;
}

.log-details {
  display: block;
  margin-top: 11rpx;
  color: #aeb9b0;
  font-family: monospace;
  font-size: 19rpx;
  line-height: 1.55;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
