---
title: 错误处理
description: LuchRequestError、稳定错误码、response 语义和服务端到达判断
---

# 错误处理

所有请求 Promise rejection 都统一为 `LuchRequestError`。业务判断使用稳定的
`code`，不要匹配消息文本。

## `LuchRequestError` {#luch-request-error}

```ts
class LuchRequestError<TConfig = unknown, TResponse = unknown> extends Error {
  constructor(
    message: string,
    code: LuchRequestErrorCode,
    options?: LuchRequestErrorOptions<TConfig, TResponse>
  )
}
```

| 成员 | 说明 |
| --- | --- |
| `name`、`message`、`stack` | 标准 Error 字段；`name` 固定为 `LuchRequestError` |
| `code` | 稳定的跨平台错误分类 |
| `config` | 错误发生时管线使用的请求配置 |
| `task` | 已创建时对应的原生 Task |
| `response` | HTTP 状态、响应转换或 interceptor 场景中的响应上下文 |
| `cause` | 导致当前错误的底层异常或取消原因 |
| `raw` | 未转换的平台原始错误或取消原因 |
| `cancelMode` | 取消错误实际采用的 `CancellationMode` |
| `isLuchRequestError` | 固定为 `true` 的跨环境识别标记 |
| `toJSON()` | 返回稳定摘要，不包含 Task 和完整 response |

## 错误码常量

| 静态常量 | 触发阶段 | 主要区别 |
| --- | --- | --- |
| `LuchRequestError.ERR_INVALID_CONFIG` | 原生派发前 | 配置无效或缺少对应 uni API，通常没有 `response` |
| `LuchRequestError.ERR_NETWORK` | uni API 的 fail callback | `raw`、`cause` 保留平台错误，不能证明服务端是否收到请求 |
| `LuchRequestError.ERR_BAD_STATUS` | 收到原生响应后 | HTTP 状态未通过 `validateStatus`，保留完整 `response` |
| `LuchRequestError.ERR_BAD_RESPONSE` | 响应转换时 | 响应无法按配置转换，保留 `response` 和原始数据 |
| `LuchRequestError.ERR_CANCELED` | 取消或业务主动终止时 | 库取消流程可通过 `cancelMode` 区分原生与逻辑取消 |
| `LuchRequestError.ERR_INTERCEPTOR` | interceptor 执行或恢复时 | `cause` 保留 handler 异常，response 阶段可能带 `response` |

业务分支应比较静态常量，不要比较字符串字面量：

```ts
import { LuchRequestError } from 'luch-request'

function handleRequestError(error: LuchRequestError): void {
  switch (error.code) {
    case LuchRequestError.ERR_INVALID_CONFIG:
      reportConfigurationError(error)
      break
    case LuchRequestError.ERR_NETWORK:
      showNetworkMessage(error.raw)
      break
    case LuchRequestError.ERR_BAD_STATUS:
      handleUnexpectedStatus(error.response)
      break
    case LuchRequestError.ERR_BAD_RESPONSE:
      reportInvalidResponse(error.response)
      break
    case LuchRequestError.ERR_CANCELED:
      handleCanceledRequest(error.cancelMode)
      break
    case LuchRequestError.ERR_INTERCEPTOR:
      reportInterceptorError(error.cause)
      break
  }
}
```

## `isLuchRequestError()` {#is-luch-request-error}

```ts
function isLuchRequestError<TConfig = unknown, TResponse = unknown>(
  value: unknown
): value is LuchRequestError<TConfig, TResponse>
```

该函数检查公开标记，不依赖可能跨包失效的 `instanceof`，用于把 catch 中的
`unknown` 安全收窄为 `LuchRequestError`。

### 推荐的 catch 写法

```ts
try {
  await http.get('/users/1')
} catch (error: unknown) {
  if (!isLuchRequestError(error)) {
    throw error
  }

  console.log(error.code)
  console.log(error.config)
  console.log(error.response)
  console.log(error.task)
  console.log(error.cause)
  console.log(error.raw)
  console.log(error.cancelMode)
}
```

`LuchRequestError.ERR_NETWORK` 的 `message` 优先使用平台 fail 错误中的非空
`errMsg`，其次使用 `message` 或字符串原因；无法提取时才回退为
`Network request failed`。因此微信超时通常会直接显示 `request:fail timeout`。
业务分支仍应判断稳定的 `code`，不要匹配平台消息文本。

## response 能说明请求到达服务端吗

需要按错误来源区分：

| 场景 | 能得出的结论 |
| --- | --- |
| 库生成的 `LuchRequestError.ERR_BAD_STATUS` / `LuchRequestError.ERR_BAD_RESPONSE` 且有 `response` | uni API 已取得响应 |
| `LuchRequestError.ERR_NETWORK` | 只能说明 uni API 报告网络失败，不能证明服务端是否收到 |
| request interceptor 抛错 | 尚未进入对应 uni API |
| response interceptor 抛错且有 `response` | 有响应上下文，但可能由前序 rejected handler 合成 |

因此，`error.response` 的体验与 Axios 类似，但不能无条件等价为“服务端一定收到”。
只有明确来自原生响应的状态或转换错误，才能判断平台已经取得响应。服务端是否
真正执行业务，还需要 request ID、服务端日志或幂等协议确认。

## 原始上下文

- HTTP 状态错误在 `response` 中保留完整响应
- 网络失败在 `raw` 与 `cause` 中保留平台错误，并尽量将原始消息提升到 `message`
- interceptor 普通异常只保存在 `cause`
- 库取消流程通过 `cancelMode` 区分原生中断与逻辑取消
- 请求管线逐字段补充缺失的 `config`、`task` 和 `response`

调用方显式提供的字段保持原值。手动设置 `cancelMode` 只修改错误元数据，不会
触发 Task 取消。

## 主动抛出统一错误

```ts
throw new LuchRequestError(
  '业务主动取消',
  LuchRequestError.ERR_CANCELED
)
```

通常不需要手动传 `config`，请求管线会自动补充。只有确实需要覆盖当前上下文的
高级场景才传第三个 options 参数。

## toJSON

```ts
const summary = error.toJSON()

summary.name
summary.message
summary.stack
summary.code
summary.statusCode
summary.config
summary.cause
summary.raw
summary.cancelMode
summary.isLuchRequestError
```

`toJSON()` 不包含原生 Task 或完整 response，也不会克隆、脱敏或处理循环引用。
记录日志前仍需由应用过滤 token、Cookie 等敏感字段。
