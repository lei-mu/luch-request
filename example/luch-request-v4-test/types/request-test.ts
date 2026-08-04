export type TestStatus = 'idle' | 'running' | 'passed' | 'failed'

export interface RequestTestCase {
  id: string
  name: string
  description: string
  status: TestStatus
  detail?: string
  duration?: number
}

export interface TestCounts {
  total: number
  passed: number
  failed: number
  pending: number
}

export interface TestLog {
  id: number
  time: string
  level: 'info' | 'success' | 'error'
  message: string
  details?: string
}

export interface ApiEnvelope<T> {
  code: number
  data: T
  message?: string
}
