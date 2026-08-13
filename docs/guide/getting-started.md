---
title: 快速开始
description: 在项目中安装并发出第一个 luch-request v4 请求
---

# 快速开始

## 安装

```sh
npm install luch-request
```

::: info ESM only
v4 只提供 ESM，不再提供默认导出、CommonJS 或 UMD。使用方构建工具需要能消费
ESM 与 ES2017 语法。
:::

## 创建实例

```ts
import { createLuchRequest } from 'luch-request'

const http = createLuchRequest({
  baseURL: 'https://api.example.com',
  timeout: 10_000,
  header: {
    Accept: 'application/json'
  }
})
```

不同实例的默认配置和 interceptor 不共享。没有配置 `method` 时，普通
`request()` 默认使用 `GET`；快捷方法使用自身固定 method。

## 发出请求

```ts
interface User {
  id: number
  name: string
}

interface UserListParams {
  page: number
  pageSize: number
}

const response = await http.get<User[], UserListParams>('/users', {
  params: {
    page: 1,
    pageSize: 20
  }
})

console.log(response.data[0].name)
console.log(response.statusCode)
console.log(response.config.fullURL)
```

第一个泛型描述 `response.data`，第二个泛型描述查询参数。只关心响应类型时，
写成 `http.get<User[]>('/users', { params })` 即可。

## 处理错误

```ts
import {
  isLuchRequestError,
  LuchRequestError
} from 'luch-request'

try {
  await http.get<User>('/users/1')
} catch (error) {
  if (!isLuchRequestError(error)) {
    throw error
  }

  if (error.code === LuchRequestError.ERR_CANCELED) {
    console.log('请求已取消')
  }

  if (error.response) {
    console.log('已经取得响应上下文', error.response.statusCode)
  }
}
```

业务判断应使用 `error.code`，不要匹配 `message`。`error.response` 的准确含义和
服务端到达判断见[错误处理](/api/error)。

## 下一步

- 先了解[配置如何合并](./configuration)，避免 defaults 与单次配置产生误解。
- 需要鉴权或统一解包时，阅读 [Interceptor](/api/interceptors)。
- 需要取消、进度或 Task 能力时，阅读[取消与原生 Task](/api/cancellation)。
