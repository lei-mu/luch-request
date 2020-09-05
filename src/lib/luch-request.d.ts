export type LooseObject = Record<string | number | symbol, any>
export type DiffKeys<K extends string | number | symbol> = keyof Record<K, never>
export type LuchPromise<T = any> = Promise<LuchResponse<T>>

export interface LuchRequestConfig {
  baseURL?: string;
  url?: string;

  params?: LooseObject;
  data?: LooseObject;

  name?: string;
  formData?: LooseObject;

  header?: LooseObject;
  method?: DiffKeys<"GET" | "POST" | "PUT" | "DELETE" | "CONNECT" | "HEAD" | "OPTIONS" | "TRACE" | "UPLOAD" | "DOWNLOAD">;
  dataType?: DiffKeys<"json">;
  responseType?: DiffKeys<"text" | "arraybuffer">;
  custom?: LooseObject;
  timeout?: number;
  sslVerify?: boolean;
  withCredentials?: boolean;
  firstIpv4?: boolean;

  getTask?: (task: any, options: any) => void;
  validateStatus?: (statusCode: number) => boolean | void;
}

export interface LuchResponse<T = any> {
  statusCode: number;
  config: LuchRequestConfig;
  data: T;
}

export abstract class LuchRequestAbstract {
  constructor(config?: LuchRequestConfig);
  config: LuchRequestConfig;
  interceptors: {
    request: {
      use(onSend?: (config: LuchRequestConfig) => any): LuchRequestConfig | void;
    };
    response: {
      use(onSend?: (response: LuchResponse) => any, onError?: (response: LuchResponse) => any): void;
    };
  };
  middleware<T>(config: LuchRequestConfig): LuchPromise<T>
  request<T>(config: LuchRequestConfig): LuchPromise<T>
  get<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>
  upload<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>
  delete<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>
  head<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>
  post<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>
  put<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>
  connect<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>
  options<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>
  trace<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>

  setConfig(onSend: (config: LuchRequestConfig) => LuchRequestConfig | void): void;
}

declare class LuchRequest extends LuchRequestAbstract {}
export default LuchRequest
