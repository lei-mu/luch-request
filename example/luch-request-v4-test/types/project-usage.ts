export type ProjectLogLevel = 'info' | 'success' | 'error'

export interface ProjectLog {
  details?: string
  id: number
  level: ProjectLogLevel
  message: string
  time: string
}

export interface ProjectRequestEvent {
  details?: unknown
  level: ProjectLogLevel
  message: string
}

export interface ApiEnvelope<T> {
  code: number
  data: T
  message?: string
}

export interface UserListPayload {
  list: Array<{
    active: boolean
    email: string
    id: number
    name: string
  }>
  query: Record<string, string>
}

export interface UploadPayload {
  fileId: string
  fileName: string
  url: string
}
