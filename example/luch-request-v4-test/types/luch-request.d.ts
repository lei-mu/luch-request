import 'luch-request'

declare module 'luch-request' {
  interface LuchMeta {
    requiresAuth?: boolean
    traceName?: string
  }

  interface LuchRequestNativeOptions {
    enableProfile?: boolean
  }
}

export {}
