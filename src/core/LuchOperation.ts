/**
 * luch-request 支持的三类请求操作。
 * operation 与 HTTP method 分离，upload/download 不使用伪 method。
 */
export const LuchOperation = {
  REQUEST: 'request',
  UPLOAD: 'upload',
  DOWNLOAD: 'download'
} as const

/** 由运行时常量推导的请求操作类型。 */
export type LuchOperation =
  typeof LuchOperation[keyof typeof LuchOperation]
