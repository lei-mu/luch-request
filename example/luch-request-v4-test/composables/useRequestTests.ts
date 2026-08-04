import { computed, readonly, ref, shallowRef } from 'vue'
import {
  CancellationMode,
  createCancelSource,
  isLuchRequestError,
  LuchRequestError,
  type TransferTask
} from 'luch-request'
import { request } from '../request/client'
import type {
  ApiEnvelope,
  RequestTestCase,
  TestLog
} from '../types/request-test'

interface UserListPayload {
  list: Array<{
    active: boolean
    email: string
    id: number
    name: string
  }>
  query: Record<string, string>
}

interface CreateUserPayload<TBody> {
  id: string
  received: TBody
}

interface ReplaceUserPayload<TBody> {
  mode: 'replace'
  received: TBody
}

interface DeleteUserPayload {
  query: Record<string, string>
}

interface UploadPayload {
  fileId: string
  fileName: string
  url: string
}

interface BigIntPayload {
  original: string
  userNo: number
}


const INITIAL_TEST_CASES: Array<Omit<RequestTestCase, 'status'>> = [
  {
    id: 'basic-get',
    name: '基础 GET 与透传参数',
    description: '验证 params、header、未知平台参数及原生响应字段透传。'
  },
  {
    id: 'post-create',
    name: 'POST 与泛型响应',
    description: '验证 JSON 请求体、响应数据及 TypeScript 泛型。'
  },
  {
    id: 'put-delete',
    name: 'PUT / DELETE 快捷方法',
    description: '验证不同 HTTP method 的参数位置与返回结构。'
  },
  {
    id: 'concurrent',
    name: '并发请求',
    description: '同时发出四个请求，检查实例在并发场景下的数据隔离。'
  },
  {
    id: 'interceptors',
    name: '拦截器 FIFO 顺序',
    description: '验证请求与响应拦截器均按注册顺序执行，并可被移除。'
  },
  {
    id: 'bad-status',
    name: 'HTTP 状态错误归一化',
    description: '接收真实 HTTP 500，检查 ERR_BAD_STATUS 错误结构。'
  },
  {
    id: 'network-error',
    name: '网络错误归一化',
    description: '访问无效域名，检查平台错误是否归一为 ERR_NETWORK。'
  },
  {
    id: 'logical-cancel',
    name: '派发前逻辑取消',
    description: '在异步拦截器期间取消，确保请求不会被实际派发。'
  },
  {
    id: 'task-cancel',
    name: 'RequestTask 取消',
    description: '取得原生 task 后立即取消，并记录 native/logical 模式。'
  },
  {
    id: 'cancel-source-shared',
    name: '取消源链式与共享',
    description: '验证 Promise 转换后仍可通过同一 signal 取消多个请求。'
  },
  {
    id: 'cancel-source-pre-canceled',
    name: '取消源预取消',
    description: '验证已取消 signal 会在原生 Task 创建前终止后续请求。'
  },
  {
    id: 'bigint',
    name: '大整数响应观察',
    description: '对比默认 JSON 解析与 text 模式，观察各平台精度表现。'
  },
  {
    id: 'download',
    name: '下载任务与进度',
    description: '验证 download 返回临时文件路径及可选进度能力。'
  },
  {
    id: 'upload',
    name: '上传任务',
    description: '将前一步下载的临时文件上传到 Mock API，验证原生上传链路。'
  },
  {
    id: 'upload-invalid-json',
    name: '上传错误 JSON',
    description: '验证 auto 保留原文，strict 抛出 ERR_BAD_RESPONSE。'
  }
]

function createInitialCases(): RequestTestCase[] {
  return INITIAL_TEST_CASES.map((testCase) => ({
    ...testCase,
    status: 'idle'
  }))
}

function assertCondition(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function getExpectedError(
  error: unknown,
  code: LuchRequestError['code']
): LuchRequestError {
  assertCondition(isLuchRequestError(error), '捕获结果不是 LuchRequestError')
  assertCondition(error.code === code, `预期 ${code}，实际为 ${error.code}`)

  return error
}

function summarizeRequestError(error: LuchRequestError) {
  return {
    cancelMode: error.cancelMode,
    cause: error.cause,
    code: error.code,
    config: error.config,
    isLuchRequestError: error.isLuchRequestError,
    message: error.message,
    name: error.name,
    raw: error.raw,
    response: error.response
  }
}

function formatDetails(value: unknown): string {
  const visited: object[] = []

  try {
    return JSON.stringify(
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
  } catch {
    return String(value)
  }
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

async function captureFailure(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
    return undefined
  } catch (error) {
    return error
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

export function useRequestTests() {
  const testCases = ref<RequestTestCase[]>(createInitialCases())
  const logs = ref<TestLog[]>([])
  const isRunningAll = shallowRef(false)
  let logSequence = 0

  const counts = computed(() => ({
    total: testCases.value.length,
    passed: testCases.value.filter(({ status }) => status === 'passed').length,
    failed: testCases.value.filter(({ status }) => status === 'failed').length,
    pending: testCases.value.filter(({ status }) => status === 'idle').length
  }))
  const isBusy = computed(
    () =>
      isRunningAll.value ||
      testCases.value.some(({ status }) => status === 'running')
  )

  function addLog(
    level: TestLog['level'],
    message: string,
    details?: unknown
  ): void {
    logSequence += 1
    logs.value = [
      {
        id: logSequence,
        time: new Date().toLocaleTimeString(),
        level,
        message,
        details: details === undefined ? undefined : formatDetails(details)
      },
      ...logs.value
    ].slice(0, 100)
  }

  async function testBasicGet() {
    const response = await request.get<ApiEnvelope<UserListPayload>>(
      '/api/users',
      {
        params: {
          source: 'uni-app'
        },
        header: {
          'X-Luch-Test': 'basic-get'
        },
        nativeOptions: {
          enableProfile: true
        }
      }
    )

    assertCondition(response.statusCode === 200, 'HTTP 状态码不是 200')
    assertCondition(response.data.code === 0, '业务状态码不是 0')
    assertCondition(Array.isArray(response.data.data.list), '用户列表不是数组')

    return {
      businessCode: response.data.code,
      hasNativeTask: Boolean(response.task),
      httpStatus: response.statusCode,
      listLength: response.data.data.list.length,
      profileReturned: Boolean(response.profile)
    }
  }

  async function testPostCreate() {
    type CreateBody = { expiresTime: number }
    const response = await request.post<
      ApiEnvelope<CreateUserPayload<CreateBody>>,
      CreateBody
    >('/api/users', {
      expiresTime: 7200
    })

    assertCondition(response.data.code === 0, '创建接口业务状态异常')
    assertCondition(
      typeof response.data.data.id === 'string',
      '创建接口资源 ID 类型异常'
    )

    return {
      id: response.data.data.id,
      received: response.data.data.received
    }
  }

  async function testPutAndDelete() {
    type ReplaceBody = { id: number; username: string }
    const updateResponse = await request.put<
      ApiEnvelope<ReplaceUserPayload<ReplaceBody>>,
      ReplaceBody
    >('/api/users', {
      id: 7,
      username: 'luch-request-v4'
    })
    const deleteResponse = await request.delete<
      ApiEnvelope<DeleteUserPayload>
    >('/api/users', {
      params: {
        id: 7,
        reason: 'manual-test'
      }
    })

    assertCondition(updateResponse.data.code === 0, 'PUT 接口返回异常')
    assertCondition(deleteResponse.data.code === 0, 'DELETE 接口返回异常')

    return {
      deleted: deleteResponse.data.data,
      updated: updateResponse.data.data
    }
  }

  async function testConcurrentRequests() {
    const responses = await Promise.all(
      [1, 2, 3, 4].map((index) =>
        request.post<
          ApiEnvelope<CreateUserPayload<{ requestIndex: number }>>,
          { requestIndex: number }
        >(
          '/api/users',
          {
            requestIndex: index
          },
          {
            params: {
              requestIndex: index
            }
          }
        )
      )
    )

    assertCondition(
      responses.every((response) => response.data.code === 0),
      '存在并发请求失败'
    )

    return responses.map((response, index) => ({
      endpoint: '/api/users',
      requestIndex: index + 1,
      status: response.statusCode
    }))
  }

  async function testInterceptors() {
    const order: string[] = []
    const requestInterceptorIds = [
      request.interceptors.request.use((config) => {
        console.log('request-1', config)
        order.push('request-1')
        return config
      }),
      request.interceptors.request.use((config) => {
        console.log('request-2', config)
        order.push('request-2')
        return config
      })
    ]
    const responseInterceptorIds = [
      request.interceptors.response.use((response) => {
        order.push('response-1')
        return response
      }),
      request.interceptors.response.use((response) => {
        order.push('response-2')
        return response
      })
    ]

    try {
      await request.get('/api/users')
      const expectedOrder =
        'request-1,request-2,response-1,response-2'

      assertCondition(
        order.join(',') === expectedOrder,
        `拦截器顺序异常：${order.join(',')}`
      )

      return {
        order
      }
    } finally {
      requestInterceptorIds.forEach((id) => {
        request.interceptors.request.eject(id)
      })
      responseInterceptorIds.forEach((id) => {
        request.interceptors.response.eject(id)
      })
    }
  }

  async function testBadStatus() {
    let caughtError: unknown

    try {
      await request.get('/api/status/500')
    } catch (error) {
      caughtError = error
    }

    const requestError = getExpectedError(
      caughtError,
      LuchRequestError.ERR_BAD_STATUS
    )
    const errorStatus = (
      requestError.response as { statusCode?: unknown } | undefined
    )?.statusCode
    assertCondition(
      errorStatus === 500,
      '错误响应的 HTTP 状态不是 500'
    )

    return {
      cancelMode: requestError.cancelMode,
      code: requestError.code,
      hasConfig: Boolean(requestError.config),
      hasResponse: Boolean(requestError.response),
      isLuchRequestError: requestError.isLuchRequestError
    }
  }

  async function testNetworkError() {
    let caughtError: unknown

    try {
      await request.get('https://invalid.invalid/luch-request-v4', {
        timeout: 2000
      })
    } catch (error) {
      caughtError = error
    }

    const requestError = getExpectedError(
      caughtError,
      LuchRequestError.ERR_NETWORK
    )

    return {
      code: requestError.code,
      message: requestError.message,
      nativeError: requestError.cause
    }
  }

  async function testLogicalCancel() {
    const interceptorId = request.interceptors.request.use(async (config) => {
      if (config.luchMeta?.cancelBeforeDispatch === true) {
        await wait(800)
      }

      return config
    })

    try {
      const pendingRequest = request.get('/api/users', {
        luchMeta: {
          cancelBeforeDispatch: true
        }
      })

      setTimeout(() => {
        pendingRequest.abort('测试派发前取消')
      }, 80)

      let caughtError: unknown

      try {
        await pendingRequest
      } catch (error) {
        caughtError = error
      }

      const requestError = getExpectedError(
        caughtError,
        LuchRequestError.ERR_CANCELED
      )
      assertCondition(
        requestError.cancelMode === CancellationMode.LOGICAL,
        `预期 ${CancellationMode.LOGICAL}，实际为 ${requestError.cancelMode}`
      )

      return {
        cancelMode: requestError.cancelMode,
        code: requestError.code,
        message: requestError.message
      }
    } finally {
      request.interceptors.request.eject(interceptorId)
    }
  }

  async function testTaskCancel() {
    const pendingRequest = request.get('/api/slow')
    let taskReceived = false

    pendingRequest.onTask(() => {
      taskReceived = true
      pendingRequest.abort('测试原生任务取消')
    })

    let caughtError: unknown

    try {
      await pendingRequest
    } catch (error) {
      caughtError = error
    }

    const requestError = getExpectedError(
      caughtError,
      LuchRequestError.ERR_CANCELED
    )
    assertCondition(taskReceived, '未取得原生 RequestTask')

    return {
      cancelMode: requestError.cancelMode,
      code: requestError.code,
      taskReceived
    }
  }

  async function testCancelSourceShared() {
    const source = createCancelSource()
    const firstRequest = request.get('/api/slow', {
      signal: source.signal
    }).then((response) => response.data)
    const secondRequest = request.get('/api/slow', {
      signal: source.signal
    }).then((response) => response.data)
    const transformedHasAbort = 'abort' in firstRequest
    const firstFailure = captureFailure(firstRequest)
    const secondFailure = captureFailure(secondRequest)
    const cancelTimer = setTimeout(() => {
      source.cancel('测试共享 signal 取消')
      source.cancel('该原因不应覆盖第一次取消')
    }, 80)

    try {
      const [firstCaught, secondCaught] = await Promise.all([
        firstFailure,
        secondFailure
      ])
      const firstError = getExpectedError(
        firstCaught,
        LuchRequestError.ERR_CANCELED
      )
      const secondError = getExpectedError(
        secondCaught,
        LuchRequestError.ERR_CANCELED
      )

      assertCondition(
        transformedHasAbort === false,
        'then 返回的新 Promise 不应携带 abort'
      )
      assertCondition(source.signal.aborted, '取消后 signal.aborted 不是 true')
      assertCondition(
        source.signal.reason === '测试共享 signal 取消',
        '重复 cancel 覆盖了第一次取消原因'
      )
      assertCondition(
        firstError.message === '测试共享 signal 取消' &&
          secondError.message === '测试共享 signal 取消',
        '共享 signal 没有向两个请求传播相同取消原因'
      )

      return {
        firstCancelMode: firstError.cancelMode,
        reason: source.signal.reason,
        secondCancelMode: secondError.cancelMode,
        transformedHasAbort
      }
    } finally {
      clearTimeout(cancelTimer)
    }
  }

  async function testCancelSourcePreCanceled() {
    const source = createCancelSource()
    source.cancel('测试请求前取消')
    const caughtError = await captureFailure(
      request.get('/api/users', {
        signal: source.signal
      })
    )
    const requestError = getExpectedError(
      caughtError,
      LuchRequestError.ERR_CANCELED
    )

    assertCondition(
      requestError.cancelMode === CancellationMode.LOGICAL,
      `预期 ${CancellationMode.LOGICAL}，实际为 ${requestError.cancelMode}`
    )
    assertCondition(requestError.task === undefined, '预取消后仍创建了原生 Task')
    assertCondition(
      requestError.message === '测试请求前取消',
      '预取消原因没有进入取消错误'
    )

    return {
      cancelMode: requestError.cancelMode,
      code: requestError.code,
      hasNativeTask: Boolean(requestError.task),
      reason: source.signal.reason
    }
  }

  async function testBigIntResponse() {
    const jsonResponse = await request.get<ApiEnvelope<BigIntPayload>>(
      '/api/bigint'
    )
    const textResponse = await request.request<unknown>({
      url: '/api/bigint',
      method: 'GET',
      dataType: 'text'
    })
    const textData = textResponse.data
    const original = jsonResponse.data.data.original

    assertCondition(
      jsonResponse.data.code === 0,
      '大整数接口业务状态异常'
    )

    return {
      jsonNumber: jsonResponse.data.data.userNo,
      jsonNumberAsString: String(jsonResponse.data.data.userNo),
      original,
      precisionPreservedAfterJson:
        String(jsonResponse.data.data.userNo) === original,
      textContainsOriginal:
        typeof textData === 'string' && textData.includes(original),
      textResponseType: typeof textData
    }
  }

  async function downloadFixture() {
    let progress: number | undefined
    const pendingDownload = request.download({
      url: '/api/files/download'
    })

    pendingDownload.onTask((task: TransferTask) => {
      task.onProgressUpdate?.((event) => {
        progress = event.progress
      })
    })

    const response = await pendingDownload
    const filePath =
      response.tempFilePath || response.apFilePath || response.filePath

    assertCondition(
      typeof filePath === 'string' && filePath.length > 0,
      '下载响应没有可用文件路径'
    )

    return {
      filePath,
      progress,
      statusCode: response.statusCode
    }
  }

  async function testDownload() {
    const result = await downloadFixture()

    return {
      filePath: result.filePath,
      progress:
        result.progress === undefined ? '平台未上报' : `${result.progress}%`,
      statusCode: result.statusCode
    }
  }

  async function testUpload() {
    const downloaded = await downloadFixture()
    const response = await request.upload<ApiEnvelope<UploadPayload>>({
      url: '/api/files/upload',
      filePath: downloaded.filePath,
      name: 'file',
      formData: {
        id: 7,
        source: 'luch-request-v4-test'
      }
    })

    assertCondition(
      response.statusCode >= 200 && response.statusCode < 300,
      `上传 HTTP 状态异常：${response.statusCode}`
    )
    assertCondition(
      typeof response.data !== 'string' && response.data.code === 0,
      '上传响应没有按默认 auto 模式解析'
    )

    return {
      dataPreview: response.data,
      hasNativeTask: Boolean(response.task),
      statusCode: response.statusCode
    }
  }

  async function testUploadInvalidJSON() {
    const downloaded = await downloadFixture()
    const uploadConfig = {
      url: '/api/files/upload-invalid-json',
      filePath: downloaded.filePath,
      name: 'file',
      header: {
        'Content-Type': 'text/xml'
      }
    }
    const autoResponse = await request.upload(uploadConfig)

    assertCondition(
      typeof autoResponse.data === 'string' &&
        autoResponse.data.startsWith('<?xml'),
      'auto 模式没有保留不可解析的 XML 原文'
    )

    const strictError = getExpectedError(
      await captureFailure(request.upload({
        ...uploadConfig,
        luchOptions: {
          jsonParsing: {
            mode: 'strict'
          }
        }
      })),
      LuchRequestError.ERR_BAD_RESPONSE
    )

    return {
      autoDataPreview: autoResponse.data.slice(0, 180),
      strictErrorCode: strictError.code,
      strictHasResponse: Boolean(strictError.response)
    }
  }

  const runners: Record<string, () => Promise<unknown>> = {
    'basic-get': testBasicGet,
    'post-create': testPostCreate,
    'put-delete': testPutAndDelete,
    concurrent: testConcurrentRequests,
    interceptors: testInterceptors,
    'bad-status': testBadStatus,
    'network-error': testNetworkError,
    'logical-cancel': testLogicalCancel,
    'task-cancel': testTaskCancel,
    'cancel-source-shared': testCancelSourceShared,
    'cancel-source-pre-canceled': testCancelSourcePreCanceled,
    bigint: testBigIntResponse,
    download: testDownload,
    upload: testUpload,
    'upload-invalid-json': testUploadInvalidJSON
  }

  async function executeTest(id: string): Promise<void> {
    const testCase = testCases.value.find((item) => item.id === id)
    const runner = runners[id]

    if (!testCase || !runner || testCase.status === 'running') {
      return
    }

    const startedAt = Date.now()
    testCase.status = 'running'
    testCase.detail = undefined
    testCase.duration = undefined
    addLog('info', `开始：${testCase.name}`)

    try {
      const result = await runner()
      testCase.status = 'passed'
      testCase.detail = formatDetails(result)
      addLog('success', `通过：${testCase.name}`, result)
    } catch (error) {
      const details = isLuchRequestError(error)
        ? summarizeRequestError(error)
        : error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack
            }
          : error

      testCase.status = 'failed'
      testCase.detail = formatDetails(details)
      addLog('error', `失败：${testCase.name}`, details)
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
    addLog('info', `开始全量测试，共 ${testCases.value.length} 项`)

    try {
      for (const testCase of testCases.value) {
        await executeTest(testCase.id)
      }

      addLog('info', '全量测试结束', counts.value)
    } finally {
      isRunningAll.value = false
    }
  }

  function clearResults(): void {
    if (isBusy.value) {
      return
    }

    testCases.value = createInitialCases()
    logs.value = []
  }

  return {
    counts,
    isBusy,
    isRunningAll: readonly(isRunningAll),
    logs: readonly(logs),
    platformLabel: getPlatformLabel(),
    testCases: readonly(testCases),
    clearResults,
    runAll,
    runTest
  }
}
