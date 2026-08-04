import { onMounted, onUnmounted, readonly, ref } from 'vue'
import { isLuchRequestError } from 'luch-request'
import { subscribeProjectRequestEvents } from '../request/projectClient'
import type {
  ProjectLog,
  ProjectLogLevel
} from '../types/project-usage'

function formatDetails(value: unknown): string {
  const visited: object[] = []

  try {
    const serialized = JSON.stringify(
      value,
      (_key, currentValue: unknown) => {
        if (typeof currentValue === 'bigint') {
          return `${currentValue.toString()}n`
        }

        if (typeof currentValue === 'function') {
          return '[Function]'
        }

        if (currentValue && typeof currentValue === 'object') {
          if (visited.includes(currentValue)) {
            return '[Circular]'
          }

          visited.push(currentValue)
        }

        return currentValue
      },
      2
    )

    return serialized === undefined ? String(value) : serialized
  } catch {
    return String(value)
  }
}

function getPlatformLabel(): string {
  try {
    const systemInfo = uni.getSystemInfoSync() as {
      platform?: string
      system?: string
      uniPlatform?: string
    }

    return [
      systemInfo.uniPlatform || systemInfo.platform || 'unknown',
      systemInfo.system
    ]
      .filter(Boolean)
      .join(' / ')
  } catch {
    return 'unknown'
  }
}

function summarizeError(error: unknown): unknown {
  if (isLuchRequestError(error)) {
    return {
      cancelMode: error.cancelMode,
      cause: error.cause,
      code: error.code,
      hasConfig: error.config !== undefined,
      hasResponse: error.response !== undefined,
      message: error.message,
      statusCode: error.toJSON().statusCode
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack
    }
  }

  return error
}

export function useProjectLogs(scope: string) {
  const logs = ref<ProjectLog[]>([])
  const platformLabel = getPlatformLabel()
  let logSequence = 0
  let unsubscribe: (() => void) | undefined

  function addLog(
    level: ProjectLogLevel,
    message: string,
    details?: unknown
  ): void {
    logSequence += 1

    const log: ProjectLog = {
      id: logSequence,
      time: new Date().toLocaleTimeString(),
      level,
      message,
      details: details === undefined ? undefined : formatDetails(details)
    }

    logs.value = [log, ...logs.value].slice(0, 100)

    if (level === 'error') {
      console.error(`[${scope}] ${message}`, details ?? '')
    } else {
      console.log(`[${scope}] ${message}`, details ?? '')
    }
  }

  function addError(message: string, error: unknown): void {
    addLog('error', message, summarizeError(error))
  }

  function clearLogs(): void {
    logs.value = []
  }

  function copyLogs(): void {
    const text = [
      `测试页面：${scope}`,
      `运行平台：${platformLabel}`,
      ...logs.value
        .slice()
        .reverse()
        .map((log) => (
          `[${log.time}] [${log.level}] ${log.message}` +
          (log.details ? `\n${log.details}` : '')
        ))
    ].join('\n')

    uni.setClipboardData({
      data: text,
      success: () => {
        addLog('success', '日志已复制，可直接粘贴到测试反馈中')
      },
      fail: (error) => {
        addError('复制日志失败', error)
      }
    })
  }

  onMounted(() => {
    unsubscribe = subscribeProjectRequestEvents((event) => {
      addLog(event.level, event.message, event.details)
    })
    addLog('info', '页面测试环境已就绪', { platform: platformLabel })
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    addError,
    addLog,
    clearLogs,
    copyLogs,
    logs: readonly(logs),
    platformLabel
  }
}
