import { computed, readonly, ref, shallowRef } from 'vue'
import type {
  ApiCompatibilityTest,
  ApiTestCounts
} from '../types/api-compatibility'

type TestRunner = () => Promise<unknown> | unknown

interface TestDefinition extends Omit<
  ApiCompatibilityTest,
  'detail' | 'duration' | 'status'
> {
  run: TestRunner
}

interface UnsupportedError extends Error {
  unsupported: true
}

function assertCondition(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function createUnsupportedError(message: string): UnsupportedError {
  const error = new Error(message) as UnsupportedError
  error.unsupported = true
  return error
}

function requireSupport(condition: unknown, message: string): void {
  if (!condition) {
    throw createUnsupportedError(message)
  }
}

function isUnsupportedError(error: unknown): error is UnsupportedError {
  return (
    error instanceof Error &&
    'unsupported' in error &&
    error.unsupported === true
  )
}

function formatDetail(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function getPlatformLabel(): string {
  try {
    const systemInfo = uni.getSystemInfoSync() as {
      appVersion?: string
      deviceBrand?: string
      osName?: string
      osVersion?: string
      platform?: string
      system?: string
      uniPlatform?: string
    }
    const platform =
      systemInfo.uniPlatform || systemInfo.platform || 'unknown'
    const system =
      systemInfo.system ||
      [systemInfo.osName, systemInfo.osVersion].filter(Boolean).join(' ')

    return [platform, system, systemInfo.deviceBrand]
      .filter(Boolean)
      .join(' / ')
  } catch {
    return 'unknown'
  }
}

const TEST_DEFINITIONS: TestDefinition[] = [
  {
    id: 'reflect-apply',
    name: 'Reflect.apply',
    description: '检查 Reflect.apply 是否存在，并验证 this 与参数传递。',
    risk: '低',
    run() {
      requireSupport(
        typeof Reflect !== 'undefined' &&
          typeof Reflect.apply === 'function',
        '当前运行时不支持 Reflect.apply'
      )

      function joinValue(
        this: { prefix: string },
        first: string,
        second: string
      ): string {
        return `${this.prefix}${first}${second}`
      }

      const result = Reflect.apply(
        joinValue,
        { prefix: 'luch-' },
        ['request-', 'v4']
      )
      assertCondition(result === 'luch-request-v4', '调用结果不符合预期')

      return { result }
    }
  },
  {
    id: 'object-define-properties',
    name: 'Object.defineProperties + Promise',
    description: '模拟库当前实现，在 Promise 上挂载不可枚举的 task 属性。',
    risk: '中',
    async run() {
      requireSupport(
        typeof Object.defineProperties === 'function',
        '当前运行时不支持 Object.defineProperties'
      )

      const result = Promise.resolve('resolved') as Promise<string> & {
        task?: string
      }
      Object.defineProperties(result, {
        task: {
          configurable: true,
          enumerable: false,
          value: 'mock-task'
        }
      })

      assertCondition(result.task === 'mock-task', 'Promise 扩展属性读取失败')
      assertCondition(
        Object.keys(result).indexOf('task') === -1,
        'task 属性应保持不可枚举'
      )
      assertCondition(
        (await result) === 'resolved',
        '扩展属性后 Promise 行为发生变化'
      )

      return {
        enumerable: Object.keys(result).indexOf('task') !== -1,
        resolvedValue: await result,
        task: result.task
      }
    }
  },
  {
    id: 'promise-race',
    name: 'Promise.race',
    description: '验证快速 Promise 能否在竞争中先返回。',
    risk: '低',
    async run() {
      requireSupport(
        typeof Promise !== 'undefined' &&
          typeof Promise.race === 'function',
        '当前运行时不支持 Promise.race'
      )

      const slowPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve('slow'), 30)
      })
      const winner = await Promise.race([
        Promise.resolve('fast'),
        slowPromise
      ])
      assertCondition(winner === 'fast', 'Promise.race 返回结果不符合预期')

      return { winner }
    }
  },
  {
    id: 'signal-event-contract',
    name: 'signal addEventListener',
    description: '使用自定义 signal 验证 abort 监听、触发和清理契约，不依赖 DOM。',
    risk: '中',
    run() {
      const listeners: Array<() => void> = []
      const signal = {
        aborted: false,
        addEventListener(type: string, listener: () => void) {
          if (type === 'abort') {
            listeners.push(listener)
          }
        },
        removeEventListener(type: string, listener: () => void) {
          if (type !== 'abort') {
            return
          }

          const index = listeners.indexOf(listener)
          if (index !== -1) {
            listeners.splice(index, 1)
          }
        }
      }
      let calls = 0
      const listener = () => {
        calls += 1
      }

      signal.addEventListener('abort', listener)
      listeners.slice().forEach((callback) => callback())
      signal.removeEventListener('abort', listener)

      assertCondition(calls === 1, 'abort 监听器没有被正确触发')
      assertCondition(listeners.length === 0, 'abort 监听器没有被正确清理')

      return {
        calls,
        remainingListeners: listeners.length,
        source: '自定义 signal，非 window.addEventListener'
      }
    }
  },
  {
    id: 'native-abort-controller',
    name: '原生 AbortController',
    description: '观察当前平台是否提供标准 AbortSignal；luch-request 本身不强制依赖它。',
    risk: '中',
    run() {
      requireSupport(
        typeof AbortController !== 'undefined',
        '当前运行时没有提供原生 AbortController'
      )

      const controller = new AbortController()
      let calls = 0
      const listener = () => {
        calls += 1
      }

      controller.signal.addEventListener('abort', listener)
      controller.abort()
      controller.signal.removeEventListener('abort', listener)

      assertCondition(controller.signal.aborted, 'AbortSignal 状态没有更新')
      assertCondition(calls === 1, '原生 abort 监听器触发次数异常')

      return {
        aborted: controller.signal.aborted,
        calls,
        note: '此项不支持不会阻止自定义 signal 工作'
      }
    }
  },
  {
    id: 'object-entries',
    name: 'Object.entries',
    description: '检查 ES2017 Object.entries 是否存在并保持键值。',
    risk: '高',
    run() {
      requireSupport(
        typeof Object.entries === 'function',
        '当前运行时不支持 Object.entries'
      )

      const entries = Object.entries({ first: 1, second: 2 })
      assertCondition(entries.length === 2, 'Object.entries 长度异常')
      assertCondition(
        entries[0][0] === 'first' && entries[0][1] === 1,
        'Object.entries 键值异常'
      )

      return { entries }
    }
  },
  {
    id: 'array-includes',
    name: 'Array.prototype.includes',
    description: '检查数组 includes；DCloud 文档明确旧 iOS 8 不支持。',
    risk: '高',
    run() {
      requireSupport(
        typeof Array.prototype.includes === 'function',
        '当前运行时不支持 Array.prototype.includes'
      )

      const matched = ['app', 'h5', 'mp-weixin'].includes('h5')
      assertCondition(matched, 'Array.prototype.includes 匹配失败')

      return { matched }
    }
  },
  {
    id: 'string-includes',
    name: 'String.prototype.includes',
    description: '检查字符串 includes 是否存在并能正确匹配。',
    risk: '中',
    run() {
      requireSupport(
        typeof String.prototype.includes === 'function',
        '当前运行时不支持 String.prototype.includes'
      )

      const matched = 'luch-request-v4'.includes('request')
      assertCondition(matched, 'String.prototype.includes 匹配失败')

      return { matched }
    }
  },
  {
    id: 'number-is-finite',
    name: 'Number.isFinite',
    description: '检查 ES6 Number.isFinite 的存在性和严格数值判断。',
    risk: '中',
    run() {
      requireSupport(
        typeof Number.isFinite === 'function',
        '当前运行时不支持 Number.isFinite'
      )

      const finiteNumber = Number.isFinite(10)
      const numericString = Number.isFinite('10')
      assertCondition(finiteNumber, '有限数值判断失败')
      assertCondition(!numericString, '字符串不应被判断为有限数值')

      return { finiteNumber, numericString }
    }
  },
  {
    id: 'promise-finally',
    name: 'Promise.prototype.finally',
    description: '检查 Promise.finally 是否执行且不改变完成值。',
    risk: '中',
    async run() {
      requireSupport(
        typeof Promise.prototype.finally === 'function',
        '当前运行时不支持 Promise.prototype.finally'
      )

      let finalized = false
      const value = await Promise.resolve('kept').finally(() => {
        finalized = true
      })
      assertCondition(finalized, 'Promise.finally 没有执行')
      assertCondition(value === 'kept', 'Promise.finally 改变了完成值')

      return { finalized, value }
    }
  },
  {
    id: 'map',
    name: 'Map',
    description: '检查 Map 构造、写入和读取能力。',
    risk: '低',
    run() {
      requireSupport(typeof Map !== 'undefined', '当前运行时不支持 Map')

      const values = new Map<string, number>()
      values.set('request', 4)
      assertCondition(values.get('request') === 4, 'Map 读写失败')

      return { size: values.size, value: values.get('request') }
    }
  },
  {
    id: 'set',
    name: 'Set',
    description: '检查 Set 去重和成员判断能力。',
    risk: '低',
    run() {
      requireSupport(typeof Set !== 'undefined', '当前运行时不支持 Set')

      const values = new Set(['request', 'request', 'adapter'])
      assertCondition(values.size === 2, 'Set 去重失败')
      assertCondition(values.has('adapter'), 'Set 成员判断失败')

      return { hasAdapter: values.has('adapter'), size: values.size }
    }
  },
  {
    id: 'null-prototype-object',
    name: 'Object.create(null)',
    description: '检查无原型字典；本项不代表原生 uni API 桥接已经验证。',
    risk: '中',
    run() {
      requireSupport(
        typeof Object.create === 'function',
        '当前运行时不支持 Object.create'
      )

      const dictionary = Object.create(null) as Record<string, string>
      dictionary.authorization = 'token'
      assertCondition(
        dictionary.authorization === 'token',
        '无原型对象读写失败'
      )
      assertCondition(
        Object.getPrototypeOf(dictionary) === null,
        '对象原型不是 null'
      )

      return {
        authorization: dictionary.authorization,
        hasNullPrototype: Object.getPrototypeOf(dictionary) === null
      }
    }
  }
]

function createInitialTests(): ApiCompatibilityTest[] {
  return TEST_DEFINITIONS.map(({ run: _run, ...testCase }) => ({
    ...testCase,
    status: 'idle'
  }))
}

export function useApiCompatibilityTests() {
  const testCases = ref<ApiCompatibilityTest[]>(createInitialTests())
  const isRunningAll = shallowRef(false)

  const counts = computed<ApiTestCounts>(() => ({
    total: testCases.value.length,
    passed: testCases.value.filter(({ status }) => status === 'passed').length,
    failed: testCases.value.filter(({ status }) => status === 'failed').length,
    unsupported: testCases.value.filter(
      ({ status }) => status === 'unsupported'
    ).length,
    pending: testCases.value.filter(({ status }) => status === 'idle').length
  }))
  const isBusy = computed(
    () =>
      isRunningAll.value ||
      testCases.value.some(({ status }) => status === 'running')
  )

  async function executeTest(id: string): Promise<void> {
    const testCase = testCases.value.find((item) => item.id === id)
    const definition = TEST_DEFINITIONS.find((item) => item.id === id)

    if (!testCase || !definition || testCase.status === 'running') {
      return
    }

    const startedAt = Date.now()
    testCase.status = 'running'
    testCase.detail = undefined
    testCase.duration = undefined

    try {
      const result = await definition.run()
      testCase.status = 'passed'
      testCase.detail = formatDetail(result)
    } catch (error) {
      testCase.status = isUnsupportedError(error)
        ? 'unsupported'
        : 'failed'
      testCase.detail =
        error instanceof Error ? error.message : formatDetail(error)
    } finally {
      testCase.duration = Date.now() - startedAt
    }
  }

  async function runTest(id: string): Promise<void> {
    if (isBusy.value) {
      return
    }

    await executeTest(id)
  }

  async function runAll(): Promise<void> {
    if (isBusy.value) {
      return
    }

    isRunningAll.value = true

    try {
      for (const testCase of testCases.value) {
        await executeTest(testCase.id)
      }
    } finally {
      isRunningAll.value = false
    }
  }

  function clearResults(): void {
    if (!isBusy.value) {
      testCases.value = createInitialTests()
    }
  }

  return {
    counts,
    isBusy,
    isRunningAll: readonly(isRunningAll),
    platformLabel: getPlatformLabel(),
    testCases: readonly(testCases),
    clearResults,
    runAll,
    runTest
  }
}
