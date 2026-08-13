---
title: 平台兼容性
description: v4 正式版本的构建边界、支持范围和验证要求
---

# 平台兼容性

本文描述 v4 正式版本的**支持范围**。兼容性结论以真实平台验证为准，
理论可执行不等于正式支持。

## 构建产物

- 只提供 ESM，不提供 CommonJS、UMD 或 ES5 legacy bundle
- JavaScript 构建目标为 ES2017
- 不提供 `Promise`、`Map`、`Set` 等运行时 polyfill
- 核心不依赖 DOM、Node.js API 或特定小程序全局对象
- 低于支持表的环境需要使用方自行转译和提供 polyfill，且不在官方支持范围

## 支持范围

| 环境 | 正式版本支持范围 |
| --- | --- |
| 传统 uni-app App Android | 当前受支持的标准基座，以实际验证版本为准 |
| 传统 uni-app App iOS | iOS 13 及以上 |
| H5 | 支持 ES2017 的现代浏览器，不支持 IE11 |
| 微信、支付宝等小程序 | 平台当前受支持的运行时和基础库版本 |
| HarmonyOS | 支持对应 `uni` 网络 API 的 HBuilderX 版本 |
| uni-app x / UTS | **不支持** |

最终 App 最低系统版本取 luch-request、HBuilderX / 原生打包环境与项目原生插件
三者要求的最高值。

## 平台能力

核心请求能力依赖：

- `uni.request`
- `uni.uploadFile`
- `uni.downloadFile`

Task 的 `abort`、进度和响应头事件可能因平台或基础库版本缺失。luch-request 会
做能力检测，但不会把缺失能力模拟成原生能力。

`AbortController` 是 H5 浏览器提供的原生 JavaScript/Web API 对象，只在 H5
使用。App、小程序、HarmonyOS 等其他平台没有该对象；这些平台以及需要共享一套
跨平台代码的项目，应使用 luch-request 的 `createCancelSource()` 传递取消信号。
库不提供、也不要求全局 `AbortController` polyfill。

应用仍需自行处理：

- 小程序 request / uploadFile / downloadFile 合法域名
- H5 CORS
- 各平台网络权限
- `PATCH`、后台请求、超时、文件数量等平台差异

## 发布验证

正式版本发布前至少需要：

1. TypeScript 类型检查、Vitest 测试和完整构建通过
2. 最终 `dist/index.js` 不包含高于 ES2017 的必要运行语法
3. npm 包可被 Vue 2 CLI 和 Vue 3 / Vite 项目消费
4. H5、App Android、App iOS 13、微信小程序、支付宝小程序完成基础
   request / upload / download smoke test
5. Task 支持路径与能力缺失的降级路径分别有验证记录

兼容性结论仍应以目标平台的实际验证记录为准。
