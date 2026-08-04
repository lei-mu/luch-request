---
title: Interceptor
description: request 与 response interceptor 的顺序、上下文和错误恢复语义
---

# Interceptor

request 和 response interceptor 都按注册顺序 **FIFO** 执行，handler 可同步或
异步返回。三种 operation 共用实例上的 interceptor。

## `LuchOperation` {#luch-operation}

`LuchOperation` 是运行时常量对象，也可以作为同名 TypeScript 类型使用：

```ts
import { LuchOperation } from 'luch-request'

LuchOperation.REQUEST  // 'request'
LuchOperation.UPLOAD   // 'upload'
LuchOperation.DOWNLOAD // 'download'
```

| 常量 | 值 | 对应调用 |
| --- | --- | --- |
| `LuchOperation.REQUEST` | `'request'` | `request()` 与 HTTP 快捷方法 |
| `LuchOperation.UPLOAD` | `'upload'` | `upload()` |
| `LuchOperation.DOWNLOAD` | `'download'` | `download()` |

operation 描述底层操作类型，不等同于 HTTP method。upload 和 download 不会使用
`UPLOAD`、`DOWNLOAD` 之类的伪 method。

需要为三类操作执行不同逻辑时，直接按常量分支：

```ts
http.interceptors.request.use((config, context) => {
  switch (context.operation) {
    case LuchOperation.REQUEST:
      console.log('普通请求 method', config.method)
      break
    case LuchOperation.UPLOAD:
      console.log('上传文件', config.filePath)
      break
    case LuchOperation.DOWNLOAD:
      console.log('下载文件', config.filePath)
      break
  }

  return config
})
```

三者的区别是：`REQUEST` 进入 `uni.request` 并具有 HTTP method；`UPLOAD` 进入
`uni.uploadFile` 并使用上传字段；`DOWNLOAD` 进入 `uni.downloadFile` 并使用
下载字段。常量只用于识别 operation，不能作为 `config.method` 的值。

## Request interceptor

```ts
const interceptorId = http.interceptors.request.use(
  async (config, context) => {
    const token = await getAccessToken()

    if (context.operation === LuchOperation.REQUEST) {
      console.log(config.method)
    }

    return {
      ...config,
      header: {
        ...config.header,
        Authorization: `Bearer ${token}`
      }
    }
  },
  (error) => {
    throw error
  }
)

http.interceptors.request.eject(interceptorId)
```

第二个参数的 `context.operation` 是 `LuchOperation.REQUEST`、
`LuchOperation.UPLOAD` 或 `LuchOperation.DOWNLOAD`。operation 只存在于
interceptor context，不写入 config、response 或 error。

进入 request interceptor 前：

- 普通 request 的 `config.method` 已是大写有效值
- upload / download 不含顶层 method
- 三类操作的 `config.validateStatus` 都是最终参与判断的函数
- `config.fullURL` 尚未生成

handler 返回后，配置会再次补默认值、校验并归一化。

## 在 interceptor 中终止请求

```ts
http.interceptors.request.use((config) => {
  if (config.luchMeta?.requiresAuth === true && !hasLogin()) {
    throw new LuchRequestError(
      '用户未登录，终止请求',
      LuchRequestError.ERR_CANCELED
    )
  }

  return config
})
```

请求管线会自动补充缺失的 `config`。这里只是异常终止，没有调用原生
`Task.abort()`，所以 `cancelMode` 为 `undefined`。

抛普通 `Error` 同样会终止请求，并转换为
`LuchRequestError.ERR_INTERCEPTOR`。顶层 `message` 保留原始错误消息，原始异常
保存在 `cause`；不会再把同一个异常重复写入 `raw`。

如果后续 request interceptor 的 rejected handler 返回有效配置，请求会恢复并
继续派发。这与 Promise rejection 恢复语义一致。

## Response interceptor

```ts
const interceptorId = http.interceptors.response.use(
  (response) => {
    console.log(response.statusCode)
    return response
  },
  (error) => {
    if (
      isLuchRequestError(error) &&
      error.code === LuchRequestError.ERR_NETWORK
    ) {
      console.log('网络请求失败', error.raw)
    }

    throw error
  }
)
```

fulfilled handler 抛错后，会进入后续 rejected handler 或最终 Promise rejection。
普通异常转换为 `LuchRequestError.ERR_INTERCEPTOR`，并保留进入该 interceptor
的响应上下文。

rejected handler 返回有效响应时，后续管线恢复为 fulfilled。此时响应可能是业务
合成值，因此后续错误上的 `response` 不一定来自服务端。

## 移除与清空

```ts
http.interceptors.request.eject(requestId)
http.interceptors.response.eject(responseId)

http.interceptors.request.clear()
http.interceptors.response.clear()
```

`use()` 返回稳定 ID。`eject()` 移除单个 handler，`clear()` 清空对应类型。
