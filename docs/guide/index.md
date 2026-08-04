---
title: 认识 v4 Alpha
description: luch-request v4 的定位、当前能力和采用边界
---

# 认识 v4 Alpha

`luch-request v4` 是面向**传统 uni-app** 的 TypeScript-first 请求库。它不是
v3 的内部重构，而是围绕 uni API、原生 Task、类型边界和统一错误重新设计的
breaking version。

::: warning 当前状态
文档对应 `4.0.0-alpha.1`。v4 alpha 已发布到 npm，可通过
`npm install luch-request@alpha` 安装；公共 API 在稳定版前仍可能调整。
生产项目应继续使用 [v3 稳定版](https://www.quanzhan.co/luch-request/v3/)，或先在
所有目标平台完成验证。
:::

## 当前能力

- 普通 `request` 与常用 HTTP 快捷方法
- `upload`、`download` 与原生 Task 访问
- 实例默认配置、单次配置及字段级合并策略
- request / response interceptor，支持同步和异步 handler
- 统一 `LuchRequestError` 与稳定错误码
- 单次配置 `onTask(nativeTask, control)`，以及 Promise 上的 `abort()`、`task`、
  `onTask()`
- H5 浏览器原生 `AbortController` 与跨平台 `createCancelSource()`
- `nativeOptions` 透传平台新增参数，保留未知响应字段

## 一次请求经过什么

```text
调用配置
  ↓ merge + normalize
request interceptor（FIFO）
  ↓ 生成 fullURL
uni.request / uni.uploadFile / uni.downloadFile
  ↓ validateStatus + response transform
response interceptor（FIFO）
  ↓
response 或 LuchRequestError
```

`request`、`upload`、`download` 共用 interceptor 和错误契约，但在派发边界保持
各自的原生参数，不使用 `UPLOAD`、`DOWNLOAD` 伪 method。

## 设计边界

v4 首个稳定版本计划只支持传统 uni-app，不支持 uni-app x / UTS。包只输出
ESM，构建目标为 ES2017，核心不提供 polyfill，也不依赖 DOM、Node.js API
或某个小程序的全局对象。

以下能力不进入首个 npm 版本：重试、缓存、请求去重、并发控制、Token 自动刷新、
WebSocket 与 `uni_modules` 分发。业务可以使用 interceptor 组合自己的策略，
但库不会提前承诺尚未验证的抽象。

## 推荐阅读顺序

1. [快速开始](./getting-started)
2. [配置与合并](./configuration)
3. [请求与响应 API](/api/request)
4. [错误处理](/api/error)
5. [兼容性](/compatibility/)

从 v3 升级时，直接阅读[从 v3 迁移到 v4](/migration/v3-to-v4)。
