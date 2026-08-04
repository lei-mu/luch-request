<script setup lang="ts">
defineProps<{
  description: string
  eyebrow: string
  platform: string
  title: string
}>()
</script>

<template>
  <view class="hero">
    <text class="eyebrow">{{ eyebrow }}</text>
    <text class="title">{{ title }}</text>
    <text class="description">{{ description }}</text>

    <view class="platform">
      <text class="platform-label">当前平台</text>
      <text class="platform-value" selectable>{{ platform }}</text>
    </view>
  </view>
</template>

<style scoped>
.hero {
  padding: 40rpx 34rpx;
  background: #18221c;
  border-radius: 26rpx;
  color: #f8f5ec;
}

.eyebrow,
.title,
.description,
.platform-label,
.platform-value {
  display: block;
}

.eyebrow {
  color: #9bbda5;
  font-size: 19rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
}

.title {
  margin-top: 14rpx;
  font-size: 46rpx;
  font-weight: 800;
  line-height: 1.18;
}

.description {
  margin-top: 16rpx;
  color: #cbd3cd;
  font-size: 25rpx;
  line-height: 1.6;
}

.platform {
  margin-top: 28rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.14);
}

.platform-label {
  color: #91a498;
  font-size: 20rpx;
}

.platform-value {
  margin-top: 7rpx;
  font-family: monospace;
  font-size: 23rpx;
  line-height: 1.5;
}
</style>
