export type LooseObject = Record<string | number | symbol, any>;
export type DiffKeys<K extends string | number | symbol> = keyof Record<K, never>;
export type LuchPromise<T = any> = Promise<LuchResponse<T>>;

export interface RequestTask {
  abort: () => void;
  offHeadersReceived: () => void;
  onHeadersReceived: () => void;
};

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

  getTask?: (task: RequestTask, options: LuchRequestConfig) => void;
  validateStatus?: (statusCode: number) => boolean | void;
};

export interface LuchResponse<T = any> {
  config: LuchRequestConfig;
  statusCode: number;
  cookies: Array<string>;
  data: T;
  errMsg: string;
  header: LooseObject;
};

export interface LuchError {
  config: LuchRequestConfig;
  statusCode?: number;
  cookies?: Array<string>;
  data?: any;
  errMsg: string;
  header?: LooseObject;
};

export abstract class LuchRequestAbstract {
  constructor(config?: LuchRequestConfig);
  config: LuchRequestConfig;
  interceptors: {
    request: {
      use(onSend?: (config: LuchRequestConfig) => LuchRequestConfig): void;
    };
    response: {
      use(onSend?: (response: LuchResponse) => LuchResponse, onError?: (response: LuchError) => any): void;
    };
  };
  middleware<T>(config: LuchRequestConfig): LuchPromise<T>;
  request<T>(config: LuchRequestConfig): LuchPromise<T>;
  get<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>;
  upload<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>;
  delete<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>;
  head<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>;
  post<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>;
  put<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>;
  connect<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>;
  options<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>;
  trace<T>(url: string, config?: LuchRequestConfig): LuchPromise<T>;

  setConfig(onSend: (config: LuchRequestConfig) => LuchRequestConfig | void): void;
};

declare class LuchRequest extends LuchRequestAbstract { };
export default LuchRequest;
