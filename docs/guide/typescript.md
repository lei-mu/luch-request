---
title: TypeScript 设计
description: 泛型顺序、params 类型、平台扩展和响应类型边界
---

# TypeScript 设计

v4 的原则是“输入精确、管线诚实”：调用处可以精确约束业务输入，但响应只声明
interceptor、defaults 和平台实际允许库保证的内容。

本页重点解释类型设计与使用方式。需要逐项查询包入口导出的配置、响应、Task、
取消、Interceptor 和错误类型，请查看 [导出类型](/api/exported-types)。

## 请求泛型顺序

```ts
http.request<TResponse, TData, TParams, TNativeOptions>(config)

http.get<TResponse, TParams, TNativeOptions>(url, config)
http.delete<TResponse, TParams, TNativeOptions>(url, config)

http.post<TResponse, TData, TParams, TNativeOptions>(url, data, config)
http.put<TResponse, TData, TParams, TNativeOptions>(url, data, config)
http.patch<TResponse, TData, TParams, TNativeOptions>(url, data, config)
```

没有请求体的快捷方法省略 `TData`。泛型都提供默认值，常见请求通常只写
`TResponse`。

## 独立的 params 类型

```ts
interface SearchParams {
  keyword: string
  page: number
  tags?: string[]
}

await http.get<User[], SearchParams>('/users', {
  params: {
    keyword: 'Ada',
    page: 1
  },
  paramsSerializer(params) {
    return `q=${params.keyword}&page=${params.page}`
  }
})
```

显式提供 `TParams` 时，参数名、对象内必填字段和值类型都会检查；低层 client
不会强制整个 `params` 配置必须存在。未显式提供时，`params` 使用宽 `object`，
因此只指定响应泛型仍可直接传入普通业务 interface。

## 为什么 response.config.params 是宽类型

实例 defaults 和 request interceptor 都能替换最终 params。即使调用处提供了
`TParams`，运行时也不能保证响应阶段仍是同一个对象形状，因此
`response.config.params` 只承诺 `object | undefined`。

响应阶段需要关联业务参数时，使用业务闭包或 `luchMeta`，不要把输入泛型当成
最终管线状态的证明。

## 平台新增参数

单次请求可以用 `TNativeOptions` 描述平台扩展：

```ts
await http.get<User, object, {
  enableProfile?: boolean
}>('/users/1', {
  nativeOptions: {
    enableProfile: true
  }
})
```

项目多处复用时，通过 module augmentation 扩展：

```ts
// types/luch-request.d.ts
import 'luch-request'

declare module 'luch-request' {
  interface LuchRequestNativeOptions {
    enableProfile?: boolean
  }

  interface LuchUploadNativeOptions {
    enableBackgroundUpload?: boolean
  }

  interface LuchDownloadNativeOptions {
    useDownloadCache?: boolean
  }

  interface LuchMeta {
    requiresAuth?: boolean
    traceName?: string
  }
}

export {}
```

## 错误守卫

catch 变量应保持 `unknown`，再通过守卫缩小：

```ts
try {
  await http.get<User>('/users/1')
} catch (error: unknown) {
  if (isLuchRequestError(error)) {
    console.log(error.code, error.config)
  }
}
```

`isLuchRequestError()` 不依赖 `instanceof`，适合跨包和跨运行环境判断。
