import type {
  CommonConfig,
  HeaderValue,
  LuchOptions,
  RequestHeaders
} from '../types'

// 拒绝可能改变对象原型链的键，避免配置合并引入原型污染。
const blockedKeys = new Set([
  '__proto__',
  'constructor',
  'prototype'
])

type ConfigRecord = Record<string, unknown>
type MergeableConfig = Pick<
  CommonConfig,
  'header' | 'luchMeta' | 'luchOptions' | 'nativeOptions'
>

// 取消依赖对象身份传播状态，不能作为普通配置对象复制。
const preservedRootReferences = new Set([
  'signal'
])

/** 仅识别普通对象，Date、ArrayBuffer 等平台对象不参与递归合并。 */
function isPlainObject(value: unknown): value is ConfigRecord {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === null || prototype === Object.prototype
}

/**
 * 递归复制普通对象和数组；函数、Date、ArrayBuffer、class 与平台对象保留引用。
 */
function cloneConfigValue(
  value: unknown,
  seen: WeakMap<object, unknown> = new WeakMap()
): unknown {
  if (!Array.isArray(value) && !isPlainObject(value)) {
    return value
  }

  const cached = seen.get(value)

  if (cached !== undefined) {
    return cached
  }

  if (Array.isArray(value)) {
    const result: unknown[] = new Array(value.length)
    seen.set(value, result)

    for (let index = 0; index < value.length; index += 1) {
      if (index in value) {
        result[index] = cloneConfigValue(value[index], seen)
      }
    }

    return result
  }

  const result: ConfigRecord = Object.getPrototypeOf(value) === null
    ? Object.create(null) as ConfigRecord
    : {}
  seen.set(value, result)

  for (const key of Object.keys(value)) {
    if (!blockedKeys.has(key)) {
      result[key] = cloneConfigValue(value[key], seen)
    }
  }

  return result
}

/** 将安全的自有可枚举属性复制到目标对象。 */
function assignSafe(
  target: ConfigRecord,
  source: ConfigRecord | undefined,
  preservedKeys?: ReadonlySet<string>
): void {
  if (!source) {
    return
  }

  const seen = new WeakMap<object, unknown>()
  seen.set(source, target)

  for (const key of Object.keys(source)) {
    if (!blockedKeys.has(key)) {
      target[key] = preservedKeys?.has(key)
        ? source[key]
        : cloneConfigValue(source[key], seen)
    }
  }
}

/** 将普通对象递归合并到已归属当前配置的目标对象。 */
function mergePlainSource(
  target: ConfigRecord,
  source: ConfigRecord,
  seen: WeakMap<object, unknown>
): void {
  seen.set(source, target)

  for (const key of Object.keys(source)) {
    if (blockedKeys.has(key)) {
      continue
    }

    const targetValue = target[key]
    const sourceValue = source[key]

    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      const cached = seen.get(sourceValue)

      if (cached !== undefined) {
        target[key] = cached
      } else {
        mergePlainSource(targetValue, sourceValue, seen)
      }
    } else {
      target[key] = cloneConfigValue(sourceValue, seen)
    }
  }
}

/** 递归合并普通对象，其他类型由局部值整体替换。 */
function mergePlainObjects(
  defaults: ConfigRecord | undefined,
  local: ConfigRecord | undefined
): ConfigRecord | undefined {
  if (!defaults && !local) {
    return undefined
  }

  const result: ConfigRecord = Object.create(null)

  if (defaults) {
    mergePlainSource(result, defaults, new WeakMap())
  }

  if (local) {
    mergePlainSource(result, local, new WeakMap())
  }

  return result
}

/** 对调用方定义的未知结构只做一层安全合并。 */
function mergeShallowObjects(
  defaults: ConfigRecord | undefined,
  local: ConfigRecord | undefined
): ConfigRecord | undefined {
  if (!defaults && !local) {
    return undefined
  }

  const result: ConfigRecord = Object.create(null)
  assignSafe(result, defaults)
  assignSafe(result, local)
  return result
}

/**
 * header 键按大小写不敏感合并，并保留最后一次配置使用的键名。
 */
function mergeHeaders(
  defaults: RequestHeaders | undefined,
  local: RequestHeaders | undefined
): RequestHeaders | undefined {
  if (!defaults && !local) {
    return undefined
  }

  const result: RequestHeaders = {}
  const keyMap = new Map<string, string>()

  const apply = (headers: RequestHeaders | undefined): void => {
    if (!headers) {
      return
    }

    for (const [key, value] of Object.entries(headers)) {
      if (blockedKeys.has(key)) {
        continue
      }

      const normalizedKey = key.toLowerCase()
      const previousKey = keyMap.get(normalizedKey)

      if (previousKey) {
        delete result[previousKey]
      }

      if (value === null || value === undefined) {
        keyMap.delete(normalizedKey)
        continue
      }

      keyMap.set(normalizedKey, key)
      result[key] = value as HeaderValue
    }
  }

  apply(defaults)
  apply(local)
  return result
}

/**
 * luchOptions 按功能键合并；jsonParsing 支持局部字段覆盖和 false 关闭。
 */
function mergeLuchOptions(
  defaults: LuchOptions | undefined,
  local: LuchOptions | undefined
): LuchOptions | undefined {
  return mergePlainObjects(
    defaults as ConfigRecord | undefined,
    local as ConfigRecord | undefined
  ) as LuchOptions | undefined
}

/**
 * 合并实例默认值和单次请求配置，不修改任何调用方对象。
 * header 按键名合并，luchMeta 和 nativeOptions 做一层浅合并，
 * luchOptions 使用各功能自己的覆盖规则。
 */
export function mergeConfig<
  TDefaults extends object,
  TLocal extends object
>(
  defaults: TDefaults | undefined,
  local: TLocal
): TDefaults & TLocal {
  const result: ConfigRecord = Object.create(null)
  assignSafe(
    result,
    defaults as ConfigRecord | undefined,
    preservedRootReferences
  )
  assignSafe(
    result,
    local as ConfigRecord,
    preservedRootReferences
  )
  const defaultConfig = defaults as MergeableConfig | undefined
  const localConfig = local as MergeableConfig

  const header = mergeHeaders(defaultConfig?.header, localConfig.header)
  const luchMeta = mergeShallowObjects(
    defaultConfig?.luchMeta,
    localConfig.luchMeta
  )
  const luchOptions = mergeLuchOptions(
    defaultConfig?.luchOptions,
    localConfig.luchOptions
  )
  const nativeOptions: ConfigRecord = Object.create(null)
  assignSafe(nativeOptions, defaultConfig?.nativeOptions)
  assignSafe(nativeOptions, localConfig.nativeOptions)

  if (header) {
    result.header = header
  }

  if (luchMeta) {
    result.luchMeta = luchMeta
  }

  if (luchOptions) {
    result.luchOptions = luchOptions
  }

  if (Object.keys(nativeOptions).length > 0) {
    result.nativeOptions = nativeOptions
  }

  return result as TDefaults & TLocal
}
