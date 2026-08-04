/** JSON 响应解析失败时的处理方式。 */
export const JSONParsingMode = {
  AUTO: 'auto',
  STRICT: 'strict'
} as const

/** 由运行时常量推导的 JSON 响应解析模式。 */
export type JSONParsingMode =
  typeof JSONParsingMode[keyof typeof JSONParsingMode]
