---
title: 取消与原生 Task
description: abort、onTask、signal 和 createCancelSource 的使用边界
---

# 取消与原生 Task

请求返回真正的 Promise，并附加 `abort()`、`onTask()` 和 `task`。应根据调用链
是否仍持有原始 Promise 选择取消方式。

::: danger 取消只能走 luch-request 公共 API
禁止通过 `pending.task` 或 listener 的第一个参数直接调用原生
`nativeTask.abort()`。配置或 Promise 的 `onTask` listener 内使用第二个参数
`control.abort(reason)`，其他位置使用 `pending.abort(reason)`；取消能力需要穿过
`async`、service 或 Promise 转换链时，使用 `createCancelSource()` 传递 `signal`。
:::

## `createCancelSource()` {#create-cancel-source}

```ts
function createCancelSource(): CancelSource
```

`createCancelSource()` 创建不依赖 DOM `AbortController` 的纯 JavaScript 取消源，
适用于 H5、App、小程序和 HarmonyOS。返回对象包含：

| 成员 | 说明 |
| --- | --- |
| `signal` | 传给请求配置的 `AbortSignalLike` |
| `cancel(reason?)` | 取消共享该 signal 的请求；幂等并保留第一次 reason |

signal 已取消后，新接入的请求会立即取消。需要新的业务生命周期时，应重新调用
`createCancelSource()`，不要复用已取消的 source。

### 监听 `abort` 事件

`source.signal` 提供与原生 `AbortSignal` 相同用途的最小事件接口。除传给请求配置
外，Hook 或其他业务状态也可以监听同一次取消：

```ts
import { createCancelSource } from 'luch-request'

const source = createCancelSource()

const handleAbort = (): void => {
  console.log('已取消：', source.signal.reason)
}

source.signal.addEventListener('abort', handleAbort)

// 同步更新 aborted 和 reason，并通知 abort listener
source.cancel('页面离开')

console.log(source.signal.aborted) // true
console.log(source.signal.reason)  // '页面离开'
```

不再需要监听时，必须使用注册时的同一个函数引用移除：

```ts
source.signal.removeEventListener('abort', handleAbort)
```

`cancel()` 只生效一次，所有 listener 也只会收到一次通知。单个 listener 抛出的
异常会被隔离，不会阻止其他 listener 或请求收到取消通知。

如果注册时 signal 已经取消，新增 listener 不会补发事件；需要同时兼容这种情况
时，应先检查 `aborted`：

```ts
if (source.signal.aborted) {
  handleAbort()
} else {
  source.signal.addEventListener('abort', handleAbort)
}
```

::: info 与原生 `AbortSignal` 的边界
`createCancelSource()` 实现的是跨平台最小 `AbortSignalLike`，支持 `aborted`、
`reason`、`addEventListener('abort', ...)` 和
`removeEventListener('abort', ...)`。listener 不接收 DOM `Event` 参数，也不提供
`onabort` 或 `dispatchEvent()`；需要取消原因时直接读取 `signal.reason`。
:::

## 单次配置监听 Task {#config-on-task}

单次 request、upload 和 download 配置都支持
`onTask(nativeTask, control)`：

```ts
const pending = http.get('/users', {
  onTask(nativeTask, control) {
    nativeTask.onHeadersReceived?.((result) => {
      console.log('响应头', result)
    })

    // 需要在 listener 内取消当前请求时使用：
    // control.abort('用户取消')
  }
})
```

- `nativeTask` 是当前 uni API 返回的原生 Task；普通 request 推导为
  `RequestTask`，upload/download 推导为 `TransferTask`。
- `control` 是 luch-request 为当前调用提供的最小控制面，只公开
  `abort(reason?)`，不暴露内部 `TaskController`。
- 最终 request interceptor 完成、原生 Task 创建后，库主动调用一次 listener。
- 请求在 Task 创建前取消、配置失败或原生 API 同步失败时，不会调用 listener。
- listener 抛错会被隔离，不改变请求结果，也不会转换成 interceptor 错误。
- `onTask` 只属于单次配置，不进入实例 defaults，也不会发送给原生 uni API。

`control.abort(reason)` 与返回 Promise 的 `pending.abort(reason)` 复用同一个取消
控制器，都会产生稳定的 `ERR_CANCELED` 和实际 `cancelMode`。第一个参数只用于
注册进度、响应头等平台事件或执行能力检测，不要调用它的原生 `abort()`。

::: info 手动重试时会观察每次新 Task
response interceptor 使用 `http.request(error.config)` 手动重试时，配置中的
`onTask` 会随最终配置进入新请求，因此每次尝试都会收到新的
`nativeTask` 和 `control`。原始 Promise 上注册的 `pending.onTask()` 只属于原始
请求，不会自动观察 interceptor 创建的重试 Promise。库当前不内置重试次数和
幂等策略，业务仍需自行限制次数。
:::

## 直接取消原始 Promise

```ts
const pending = http.download({
  url: '/files/report.pdf'
})

pending.onTask((nativeTask) => {
  nativeTask.onProgressUpdate?.((event) => {
    console.log(event.progress)
  })
})

pending.abort('页面已离开')
```

`abort()` 幂等并立即 reject：

- Task 已创建且支持 `abort()`：调用原生中断，`cancelMode` 为
  `CancellationMode.NATIVE`
- Task 尚未创建、平台不支持或原生调用失败：停止库的后续流程，`cancelMode`
  为 `CancellationMode.LOGICAL`
- 在异步 request interceptor 完成前取消：不会调用底层 uni API

跨平台业务必须调用 `pending.abort(reason)` 或 listener 提供的
`control.abort(reason)`，禁止直接执行原生 `task.abort()`。
绕过公共取消入口后，库无法可靠记录取消原因、选择逻辑取消降级或统一
`cancelMode`，只能根据各平台 `fail` 形态猜测请求是否被取消。

## `CancellationMode` {#cancellation-mode}

`CancellationMode` 是运行时常量对象，也可以作为同名 TypeScript 类型使用：

```ts
import { CancellationMode } from 'luch-request'

CancellationMode.NATIVE  // 'native'
CancellationMode.LOGICAL // 'logical'
```

| 常量 | 值 | 含义 |
| --- | --- | --- |
| `CancellationMode.NATIVE` | `'native'` | 已调用原生 `Task.abort()` |
| `CancellationMode.LOGICAL` | `'logical'` | 未能调用原生中断，只停止本库后续流程 |

该值记录实际采用的取消方式，不表示平台是否最终向服务端送达或撤回了请求。

在 catch 中应先确认错误码，再根据取消模式处理日志或提示：

```ts
import {
  CancellationMode,
  isLuchRequestError,
  LuchRequestError
} from 'luch-request'

try {
  await pending
} catch (error) {
  if (
    !isLuchRequestError(error) ||
    error.code !== LuchRequestError.ERR_CANCELED
  ) {
    throw error
  }

  if (error.cancelMode === CancellationMode.NATIVE) {
    console.log('已调用原生 Task.abort()')
  } else if (error.cancelMode === CancellationMode.LOGICAL) {
    console.log('只停止了 luch-request 后续流程')
  } else {
    console.log('业务抛出的取消错误，没有执行取消流程')
  }
}
```

`CancellationMode.NATIVE` 与 `CancellationMode.LOGICAL` 都会让 luch-request
Promise reject；区别只在是否成功调用原生 `Task.abort()`。`cancelMode` 为
`undefined` 通常表示业务或 interceptor 主动构造了
`LuchRequestError.ERR_CANCELED`，并不代表库执行过取消。

## 观察原生 Task

```ts
const unsubscribe = pending.onTask((nativeTask, control) => {
  console.log(nativeTask)

  // 需要在 listener 内取消时使用：
  // control.abort('用户取消')
})

unsubscribe()
```

增强 Promise 的 `onTask()` 是动态观察 API，可以注册多个 listener，并返回取消
订阅函数。Task 已创建时，新 listener 会立即收到当前 Task；请求已经结束且没有
Task 时不会调用。配置 `onTask` 固定随单次请求执行一次，不提供取消订阅函数。

两种 listener 抛错都会被隔离，不会中断 Task、拒绝请求或转换成
`LuchRequestError.ERR_INTERCEPTOR`。需要处理 listener 内部错误时，在 listener
内部使用 `try/catch`。

listener 的 `nativeTask` 只用于订阅进度、响应头等原生事件。即使 Task 暴露
`abort`，也禁止业务代码调用；listener 内统一使用 `control.abort()`，其他位置
使用 `pending.abort()`。进度和响应头事件可能因平台或基础库版本缺失，调用前
必须能力检测。

## 保留增强 Promise

如果后续还需要 `abort()`、`onTask()` 或 `task`，必须直接保存请求方法返回的
`pending`。不要在赋值请求结果时链式调用 `then()`、`catch()` 或 `finally()`：

```ts
// 推荐：pending 始终是 luch-request 返回的增强 Promise
const pending = http.get<User[]>('/users')

function leavePage(): void {
  pending.abort('页面离开')
}

// 需要读取结果时直接 await 原对象
const response = await pending
const users = response.data
```

下面三种写法返回的都是普通 Promise，不再包含 luch-request 的扩展能力：

```ts
const fromThen = http.get('/users').then((response) => response.data)
const fromCatch = http.get('/users').catch(handleError)
const fromFinally = http.get('/users').finally(hideLoading)

// fromThen / fromCatch / fromFinally 均没有 abort()、onTask() 和 task
```

`then()`、`catch()`、`finally()` 不会修改原始 `pending`，但它们返回的新 Promise
不会复制扩展属性。为了避免误把新 Promise 当成增强对象，需要扩展能力时不要对
请求表达式或 `pending` 的返回值继续链式赋值。

## 跨 service 层传递取消

经过 `async`、service 封装或确实需要 Promise 转换链时，使用独立 signal。

| 平台 | 可用的 signal 来源 |
| --- | --- |
| H5 | 浏览器原生 JavaScript/Web API `AbortController`，也可使用 `createCancelSource()` |
| App、小程序、HarmonyOS 等其他平台 | 没有 `AbortController` 对象，使用 `createCancelSource()` |

::: warning `AbortController` 仅限 H5
`AbortController` 是浏览器提供的原生 JavaScript/Web API 对象，不是 uni-app 的
跨平台 API。除 H5 外，其他平台不存在这个对象，不能访问
`globalThis.AbortController`、直接执行 `new AbortController()`，也不能要求业务方
自行补齐同名全局对象。
:::

H5 可以直接使用浏览器原生 `AbortController`：

```ts
const controller = new AbortController()

const users = http.get('/users', {
  signal: controller.signal
}).then((response) => response.data)

controller.abort('页面离开')
```

App、小程序、HarmonyOS 等其他平台必须使用库提供的纯 JavaScript 实现；跨平台
代码也应优先采用这一写法：

```ts
const source = createCancelSource()

const users = http.get('/users', {
  signal: source.signal
})

const orders = http.get('/orders', {
  signal: source.signal
})

source.cancel('页面离开')
```

同一 signal 可以取消多个请求。`cancel()` 幂等并保留第一次 reason；signal 已取消
后，新接入的请求会立即取消。新的业务生命周期应创建新的 source。

::: warning 只传 signal
配置接受 `source.signal`，H5 还接受浏览器原生 `controller.signal`；不接受整个
source 或 controller。
:::

signal 在初次配置归一化后接入，并在 interceptor 替换 signal 时重新接入。监听
注册失败返回 `LuchRequestError.ERR_INVALID_CONFIG`；完成后的监听清理采用尽力
而为，清理异常不会改变请求结果。
