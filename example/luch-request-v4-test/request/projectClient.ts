import {
  createLuchRequest,
  isLuchRequestError
} from 'luch-request'
import { MOCK_BASE_URL } from './client'
import type { ProjectRequestEvent } from '../types/project-usage'

type ProjectRequestListener = (event: ProjectRequestEvent) => void

const listeners: ProjectRequestListener[] = []

function publish(event: ProjectRequestEvent): void {
  console.log(`[luch-request 项目级示例] ${event.message}`, event.details ?? '')

  listeners.slice().forEach((listener) => {
    listener(event)
  })
}

export function subscribeProjectRequestEvents(
  listener: ProjectRequestListener
): () => void {
  listeners.push(listener)

  return () => {
    const index = listeners.indexOf(listener)

    if (index >= 0) {
      listeners.splice(index, 1)
    }
  }
}

/**
 * 项目级共享实例：在独立模块中创建一次，各页面只导入使用。
 */
export const projectRequest = createLuchRequest({
  baseURL: MOCK_BASE_URL,
  timeout: 10000,
  header: {
    Accept: 'application/json',
    'X-Luch-Project': 'luch-request-v4-test'
  }
})

projectRequest.interceptors.request.use((config, context) => {
  const requiresAuth = config.luchMeta?.requiresAuth === true
  const nextConfig = {
    ...config,
    header: {
      ...config.header,
      ...(requiresAuth
        ? { 'X-Demo-Authorization': 'project-interceptor-enabled' }
        : {})
    }
  }

  publish({
    level: 'info',
    message: '项目级 request interceptor 已执行',
    details: {
      method: nextConfig.method,
      operation: context.operation,
      requiresAuth,
      traceName: nextConfig.luchMeta?.traceName,
      url: nextConfig.url
    }
  })

  return nextConfig
})

projectRequest.interceptors.response.use(
  (response) => {
    publish({
      level: 'success',
      message: '项目级 response interceptor 已执行',
      details: {
        fullURL: response.config.fullURL,
        statusCode: response.statusCode,
        traceName: response.config.luchMeta?.traceName
      }
    })

    return response
  },
  (error) => {
    console.error(`global error:`, error)
    if (isLuchRequestError(error)) {
        console.error(`global error response:`, error.response)
        console.error(`global error object:`, error.toJSON())
    }
    publish({
      level: 'error',
      message: '项目级 response error interceptor 已执行',
      details: isLuchRequestError(error)
        ? {
            code: error.code,
            hasResponse: error.response !== undefined,
            message: error.message,
            statusCode: error.toJSON().statusCode
          }
        : error
    })

    throw error
  }
)
