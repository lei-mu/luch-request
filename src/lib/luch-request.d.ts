type DiffKeys<K extends string> = K;
type AnyObject = Record<string | number | symbol, any>
type HttpPromise<T> = Promise<HttpResponse<T>>;
type Tasks = UniApp.RequestTask | UniApp.UploadTask | UniApp.DownloadTask
export interface RequestTask {
  abort: () => void;
  offHeadersReceived: () => void;
  onHeadersReceived: () => void;
}
export interface HttpRequestConfig<T> {
  /** 请求基地址 */
  baseURL?: string;
  /** 请求服务器接口地址 */
  url?: string;

  /** 请求查询参数，自动拼接为查询字符串 */
  params?: AnyObject;
  /** 请求体参数 */
  data?: AnyObject;

  /** 文件对应的 key */
  name?: string;
  /** HTTP 请求中其他额外的 form data */
  formData?: AnyObject;
  /** 要上传文件资源的路径。 */
  filePath?: string;
  /** 需要上传的文件列表。使用 files 时，filePath 和 name 不生效，App、H5（ 2.6.15+） */
  files?: Array<string>;
  /** 要上传的文件对象，仅H5（2.6.15+）支持 */
  file?: File;

  /** 请求头信息 */
  header?: AnyObject;
  /** 请求方式 */
  method?: DiffKeys<"GET" | "POST" | "PUT" | "DELETE" | "CONNECT" | "HEAD" | "OPTIONS" | "TRACE" | "UPLOAD" | "DOWNLOAD">;
  /** 如果设为 json，会尝试对返回的数据做一次 JSON.parse */
  dataType?: DiffKeys<"json" | string>;
  /** 设置响应的数据类型，App和支付宝小程序不支持 */
  responseType?: DiffKeys<"text" | "arraybuffer">;
  /** 自定义参数 */
  custom?: AnyObject;
  /** 超时时间，仅微信小程序（2.10.0）、支付宝小程序支持 */
  timeout?: number;
  /** DNS解析时优先使用ipv4，仅 App-Android 支持 (HBuilderX 2.8.0+) */
  firstIpv4?: boolean;
  /** 验证 ssl 证书 仅5+App安卓端支持（HBuilderX 2.3.3+） */
  sslVerify?: boolean;
  /** 跨域请求时是否携带凭证（cookies）仅H5支持（HBuilderX 2.6.15+） */
  withCredentials?: boolean;

  /** 返回当前请求的task, options。请勿在此处修改options。 */
  getTask?: (task: T, options: HttpRequestConfig<Tasks>) => void;
  /**  全局自定义验证器 */
  validateStatus?: (statusCode: number) => boolean | void;
}


export interface HttpResponse<T = any> {
  config: HttpRequestConfig<Tasks>;
  statusCode: number;
  cookies: Array<string>;
  data: T;
  errMsg: string;
  header: AnyObject;
}

export interface HttpDownloadResponse extends HttpResponse {
  tempFilePath: string;
}

export interface HttpError {
  config: HttpRequestConfig<Tasks>;
  statusCode?: number;
  cookies?: Array<string>;
  data?: any;
  errMsg: string;
  header?: AnyObject;
}
export interface HttpInterceptorManager<V, E> {
  use(
    onFulfilled?: (config: V) => Promise<V> | V,
    onRejected?: (config: E) => Promise<E> | E
  ): void;
  eject(id: number): void;
}
export abstract class HttpRequestAbstract {
  constructor(config?: HttpRequestConfig<Tasks>);
  config: HttpRequestConfig<Tasks>;
  interceptors: {
    request: HttpInterceptorManager<HttpRequestConfig<Tasks>, HttpRequestConfig<Tasks>>;
    response: HttpInterceptorManager<HttpResponse, HttpError>;
  }
  middleware<T = any>(config: HttpRequestConfig<Tasks>): HttpPromise<T>;
  request<T = any>(config: HttpRequestConfig<UniApp.RequestTask>): HttpPromise<T>;
  get<T = any>(url: string, config?: HttpRequestConfig<UniApp.RequestTask>): HttpPromise<T>;
  upload<T = any>(url: string, config?: HttpRequestConfig<UniApp.UploadTask>): HttpPromise<T>;
  delete<T = any>(url: string, data?: AnyObject, config?: HttpRequestConfig<UniApp.RequestTask>): HttpPromise<T>;
  head<T = any>(url: string, data?: AnyObject, config?: HttpRequestConfig<Tasks>): HttpPromise<T>;
  post<T = any>(url: string, data?: AnyObject, config?: HttpRequestConfig<Tasks>): HttpPromise<T>;
  put<T = any>(url: string, data?: AnyObject, config?: HttpRequestConfig<Tasks>): HttpPromise<T>;
  connect<T = any>(url: string, data?: AnyObject, config?: HttpRequestConfig<Tasks>): HttpPromise<T>;
  options<T = any>(url: string, data?: AnyObject, config?: HttpRequestConfig<Tasks>): HttpPromise<T>;
  trace<T = any>(url: string, data?: AnyObject, config?: HttpRequestConfig<Tasks>): HttpPromise<T>;

  download(url: string, config?: HttpRequestConfig<UniApp.DownloadTask>): Promise<HttpDownloadResponse>;

  setConfig(onSend: (config: HttpRequestConfig<Tasks>) => HttpRequestConfig<Tasks>): void;
}

declare class HttpRequest extends HttpRequestAbstract { }
export default HttpRequest;
