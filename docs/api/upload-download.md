---
title: 上传与下载
description: 文件操作、进度、响应解析和跨平台路径字段
---

# 上传与下载

upload 和 download 使用各自的 uni API 与配置类型，同时复用实例 interceptor、
错误契约和取消能力。

文件字段、公共配置和特殊原生选项的完整参考见
[配置选项：upload 与 download](/api/config-options#upload-与-download-选项)。

## 上传

```ts
interface UploadResult {
  code: number
  data: {
    id: number
  }
}

const pendingUpload = http.upload<UploadResult>({
  url: '/files',
  filePath: tempFilePath,
  name: 'file',
  formData: {
    category: 'avatar'
  },
  onTask(nativeTask, control) {
    nativeTask.onProgressUpdate?.((event) => {
      console.log('上传进度', event.progress)
    })

    // 需要取消当前上传时使用：
    // control.abort('用户取消上传')
  }
})

const response = await pendingUpload

if (typeof response.data === 'string') {
  console.log('服务端返回的不是有效 JSON', response.data)
} else {
  console.log(response.data.code)
}
```

`uni.uploadFile` 的原始 `data` 是字符串。默认 `auto` 模式尝试解析，失败时保留
原字符串，所以 `upload<T>()` 的 `response.data` 类型是 `T | string`。

第二个泛型用于本次原生参数扩展：

```ts
http.upload<UploadResult, {
  enableBackgroundUpload?: boolean
}>({
  url: '/files',
  filePath: tempFilePath,
  name: 'file',
  nativeOptions: {
    enableBackgroundUpload: true
  }
})
```

本次 upload 没有显式设置 `Content-Type` 时，不继承实例默认值中的该 header，
让平台生成 multipart 类型与 boundary。其他 header 仍正常继承。

## 下载

```ts
const pendingDownload = http.download({
  url: '/files/report.pdf',
  onTask(nativeTask) {
    nativeTask.onProgressUpdate?.((event) => {
      console.log('下载进度', event.progress)
    })
  }
})

const response = await pendingDownload
const filePath =
  response.tempFilePath ||
  response.apFilePath ||
  response.filePath
```

文件路径字段因平台不同而变化，使用前检查是否存在。未知平台响应字段会保留在
响应顶层。

## 配置继承边界

文件操作只继承实例中的公共配置：`baseURL`、`header`、`params`、`luchMeta`、
`validateStatus`、`signal`、`timeout`、`luchOptions` 等。

实例 request 专属配置与 `nativeOptions` 不进入 upload / download。文件操作的
扩展参数必须写在本次调用的 `nativeOptions` 中。已知属于其他 operation 的字段
还会在原生派发边界被过滤。

## 取消与能力检测

upload / download 与普通请求一样支持配置 `onTask(nativeTask, control)`、增强
Promise 的 `pending.onTask()`、`pending.abort()` 和 signal。配置形式适合在 Task
创建后立即注册进度或响应头事件；需要动态增加多个监听器或取消订阅时，使用
`pending.onTask()`。

原生 Task 只用于平台事件和能力检测，禁止直接调用 `nativeTask.abort()`。在配置
listener 内取消当前文件操作时使用 `control.abort(reason)`；其他位置可以使用
`pending.abort(reason)`。取消能力需要穿过 service 或 Promise 转换链时使用
`createCancelSource()`。

如果后续还需要增强 Promise 上的 `abort()`、`onTask()` 或 `task`，应直接保存
`http.upload()` / `http.download()` 的返回值，不要链式赋值 `then()`、`catch()`
或 `finally()` 的返回值。原生进度与响应头事件是否存在取决于目标平台，使用前
应进行能力检测。
