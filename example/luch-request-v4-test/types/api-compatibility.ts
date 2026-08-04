export type ApiTestStatus =
  | 'idle'
  | 'running'
  | 'passed'
  | 'failed'
  | 'unsupported'

export type ApiRiskLevel = '高' | '中' | '低'

export interface ApiCompatibilityTest {
  description: string
  detail?: string
  duration?: number
  id: string
  name: string
  risk: ApiRiskLevel
  status: ApiTestStatus
}

export interface ApiTestCounts {
  failed: number
  passed: number
  pending: number
  total: number
  unsupported: number
}
