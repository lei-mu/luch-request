<script setup lang="ts">
defineProps<{
  busy: boolean
  buttonText: string
  description: string
  title: string
}>()

const emit = defineEmits<{
  run: []
}>()
</script>

<template>
  <view class="action-card">
    <view class="action-copy">
      <text class="action-title">{{ title }}</text>
      <text class="action-description">{{ description }}</text>
    </view>
    <button
      class="action-button"
      :disabled="busy"
      :loading="busy"
      @click="emit('run')"
    >
      {{ buttonText }}
    </button>
  </view>
</template>

<style scoped>
.action-card {
  padding: 28rpx;
  background: #ffffff;
  border: 1rpx solid #e2dfd7;
  border-radius: 20rpx;
}

.action-title,
.action-description {
  display: block;
}

.action-title {
  color: #252a26;
  font-size: 29rpx;
  font-weight: 750;
}

.action-description {
  margin-top: 9rpx;
  color: #707670;
  font-size: 23rpx;
  line-height: 1.55;
}

.action-button {
  height: 70rpx;
  margin: 22rpx 0 0;
  background: #286541;
  border-radius: 14rpx;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 70rpx;
}

.action-button::after {
  border: 0;
}
</style>
