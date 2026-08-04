/** 判断 url 是否已经是绝对地址或协议相对地址。 */
const absoluteURLPattern = /^([a-z][a-z\d+\-.]*:)?\/\//i

/**
 * 对查询参数编码，同时保留 URL 中常用且语义明确的字符。
 */
function encode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']')
}

/** 将日期、对象等查询值转换为稳定的字符串表示。 */
function serializeValue(value: unknown): string {
  if (value === null) {
    return ''
  }

  if (Object.prototype.toString.call(value) === '[object Date]') {
    return (value as Date).toISOString()
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * 默认查询序列化：忽略 undefined，数组使用 key[]=value 形式展开。
 */
function defaultSerialize(params: object): string {
  const parts: string[] = []
  const source = params as Record<string, unknown>

  for (const key of Object.keys(params)) {
    const value = source[key]

    if (value === undefined) {
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) {
          parts.push(
            `${encode(key)}[]=${encode(serializeValue(item))}`
          )
        }
      }
      continue
    }

    if (value !== null) {
      parts.push(
        `${encode(key)}=${encode(serializeValue(value))}`
      )
    }
  }

  return parts.join('&')
}

/** 合并 baseURL 和相对地址；绝对地址始终优先。 */
export function combineURLs(baseURL: string, url: string): string {
  if (!baseURL || absoluteURLPattern.test(url)) {
    return url
  }

  return `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`
}

/**
 * 将 params 追加到 URL，并移除 fragment，避免查询串出现在 # 之后。
 */
export function buildURL<TParams extends object>(
  url: string,
  params: TParams | undefined,
  serializer?: (params: TParams) => string
): string {
  if (!params) {
    return url
  }

  const serialized = (serializer ?? defaultSerialize)(params)
    .replace(/^\?/, '')

  if (!serialized) {
    return url
  }

  const hashIndex = url.indexOf('#')
  const urlWithoutHash = hashIndex === -1
    ? url
    : url.slice(0, hashIndex)
  const separator = urlWithoutHash.includes('?') ? '&' : '?'

  return `${urlWithoutHash}${separator}${serialized}`
}
