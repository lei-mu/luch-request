type DiffKeys<K extends string> = K;
type HttpPromise<T> = Promise<HttpResponse<T>>;

export interface RequestTask {
  abort: () => void;
  offHeadersReceived: () => void;
  onHeadersReceived: () => void;
}

export interface HttpRequestConfig {
  baseURL?: string;
  url?: string;

  params?: Record<string, any>;
  data?: Record<string, any>;

  name?: string;
  formData?: Record<string, any>;

  header?: Record<string, any>;
  method?: DiffKeys<"GET" | "POST" | "PUT" | "DELETE" | "CONNECT" | "HEAD" | "OPTIONS" | "TRACE" | "UPLOAD" | "DOWNLOAD">;
  dataType?: DiffKeys<"json">;
  responseType?: DiffKeys<"text" | "arraybuffer">;
  custom?: Record<string, any>;
  timeout?: number;
  sslVerify?: boolean;
  withCredentials?: boolean;

  getTask?: (task: RequestTask, options: HttpRequestConfig) => void;
  validateStatus?: (statusCode: number) => boolean | void;
}

export interface HttpResponse<T = any> {
  config: HttpRequestConfig;
  statusCode: number;
  cookies: Array<string>;
  data: T;
  errMsg: string;
  header: Record<string, any>;
}

export interface HttpDownloadResponse extends HttpResponse {
  tempFilePath: string;
}

export interface HttpError {
  config: HttpRequestConfig;
  statusCode?: number;
  cookies?: Array<string>;
  data?: any;
  errMsg: string;
  header?: Record<string, any>;
}

export abstract class HttpRequestAbstract {
  constructor(config?: HttpRequestConfig);
  config: HttpRequestConfig;
  interceptors: {
    request: {
      use(
        onSend?: (config: HttpRequestConfig) => HttpRequestConfig
      ): void;
    };
    response: {
      use(
        onSend?: (response: HttpResponse) => HttpResponse,
        onError?: (response: HttpError) => HttpError | Promise<HttpError>
      ): void;
    };
  }
  middleware<T = any>(config: HttpRequestConfig): HttpPromise<T>;
  request<T = any>(config: HttpRequestConfig): HttpPromise<T>;
  get<T = any>(url: string, config?: HttpRequestConfig): HttpPromise<T>;
  upload<T = any>(url: string, config?: HttpRequestConfig): HttpPromise<T>;
  delete<T = any>(url: string, config?: HttpRequestConfig): HttpPromise<T>;
  head<T = any>(url: string, config?: HttpRequestConfig): HttpPromise<T>;
  post<T = any>(url: string, config?: HttpRequestConfig): HttpPromise<T>;
  put<T = any>(url: string, config?: HttpRequestConfig): HttpPromise<T>;
  connect<T = any>(url: string, config?: HttpRequestConfig): HttpPromise<T>;
  options<T = any>(url: string, config?: HttpRequestConfig): HttpPromise<T>;
  trace<T = any>(url: string, config?: HttpRequestConfig): HttpPromise<T>;

  download(url: string, config?: HttpRequestConfig): Promise<HttpDownloadResponse>;
  
  setConfig(onSend: (config: HttpRequestConfig) => HttpRequestConfig): void;
}

declare class HttpRequest extends HttpRequestAbstract { }
export default HttpRequest;
