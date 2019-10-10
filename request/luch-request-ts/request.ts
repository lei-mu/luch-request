/**
 * Request 1.0.1
 * @Class Request
 * @description luch-request 1.0.1 http请求插件
 * @Author lu-ch
 * @Date 2019-09-20
 * @Email webwork.s@qq.com
 * http://ext.dcloud.net.cn/plugin?id=392
 */
interface header { // header 接口
  'content-type'?: string,
  [propName: string]: any
}

interface config { // init 全局config接口
  baseUrl: string,
  header: header,
  method: string,
  dataType: string,
  responseType: string
}

interface interceptor { // init 拦截器接口
  request: Function,
  response: Function
}

interface options { // request 方法配置参数（public）
  url: string,
  dataType?: string,
  data?: object,
  params?: object,
  header?: header,
  method?: string,
  responseType?: string
}

interface handleOptions { // get/post 方法配置参数（public）
  header?: header,
  params?: object,
  dataType?: string,
  responseType?: string
}

interface newOptions { // 定义新的配置接口
  baseUrl: string
  url: string,
  dataType: string,
  data: object,
  params: object,
  header: header,
  method: string,
  complete?: Function,
  responseType: string
}

interface requestCb { // 请求拦截器回调
  (x: object, y: Function): object
}

interface responseCb { // 相应拦截器回调
  (x: object): object
}

interface response { // 响应体 (public)
  statusCode?: number,
  config: Object,
  errMsg: string,
  [propName: string]: any
}

interface requestConfig { // 请求之前参数配置项 (public)
  readonly baseUrl: string
  url: string,
  dataType: string,
  data: object,
  params: object,
  header: header,
  method: string,
  readonly complete: Function,
  responseType: string
}

export default class Request {
  config: config = {
    baseUrl: '',
    header: {
      'content-type': 'application/json;charset=UTF-8'
    },
    method: 'GET',
    dataType: 'json',
    responseType: 'text'
  }

  static posUrl (url: string): boolean { /* 判断url是否为绝对路径 */
    return /(http|https):\/\/([\w.]+\/?)\S*/.test(url)
  }

  static addQueryString (params: object): string {
    let paramsData = ''
    Object.keys(params).forEach(function (key) {
      paramsData += key + '=' + params[key] + '&'
    })
    return paramsData.substring(0, paramsData.length - 1)
  }

  interceptor: interceptor = {
    request: (f: requestCb) => {
      if (f) {
        this.requestBeforeFun = f
      }
    },
    response: (cb: responseCb, ecb: responseCb) => {
      if (cb && ecb) {
        this.requestComFun = cb
        this.requestComFail = ecb
      }
    }
  }

  private requestBeforeFun (config: object, cancel?: Function): object {
    return config
  }

  private requestComFun (response: object): object {
    return response
  }

  private requestComFail (response: object): object {
    return response
  }

  /**
   * 自定义验证器，如果返回true 则进入响应拦截器的响应成功函数(resolve)，否则进入响应拦截器的响应错误函数(reject)
   * @param { Object } response - 请求响应体（只读）
   * @return { Boolean } 如果为true,则 resolve, 否则 reject
   */
  validateStatus (response: response) {
    return response.statusCode === 200
  }

  set setConfig (f: Function) {
    this.config = f(this.config)
  }

  async request (options: options) {
    const _options: newOptions = {
      baseUrl: this.config.baseUrl,
      dataType: options.dataType || this.config.dataType,
      responseType: options.responseType || this.config.responseType,
      // url: Request.posUrl(options.url) ? options.url : (this.config.baseUrl + options.url),
      url: options.url || '',
      data: options.data || {},
      params: options.params || {},
      header: options.header || this.config.header,
      method: options.method || this.config.method
    }
    // @ts-ignore
    return new Promise((resolve: Function, reject: Function) => {
      let next: boolean = true
      let handleRe: object = {}
      _options.complete = (response: response) => {
        response.config = handleRe
        if (this.validateStatus(response)) { // 成功
          resolve(this.requestComFun(response))
        } else {
          reject(this.requestComFail(response))
        }
      }
      const cancel = (t = 'handle cancel', config = _options): void => {
        const err = {
          errMsg: t,
          config: config
        }
        reject(err)
        next = false
      }
      handleRe = { ...this.requestBeforeFun(_options, cancel) }
      const _config: object = { ...handleRe }
      if (!next) return
      let mergeUrl = Request.posUrl(_options.url) ? _options.url : (_options.baseUrl + _options.url)
      if (JSON.stringify(options.params) !== '{}') {
        const paramsH = Request.addQueryString(options.params)
        mergeUrl += mergeUrl.indexOf('?') === -1 ? `?${paramsH}` : `&${paramsH}`
      }
      // @ts-ignore
      _config.url = mergeUrl
      uni.request(_config)
    })
  }

  get (url: string, options: handleOptions = {}) {
    return this.request({
      url,
      method: 'GET',
      ...options
    })
  }

  post (url: string, data: object = {}, options: handleOptions = {}) {
    return this.request({
      url,
      data,
      method: 'POST',
      ...options
    })
  }

  // #ifndef MP-ALIPAY
  put (url: string, data: object = {}, options: handleOptions = {}) {
    return this.request({
      url,
      data,
      method: 'PUT',
      ...options
    })
  }
  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN || MP-BAIDU
  delete (url: string, data: object = {}, options: handleOptions = {}) {
    return this.request({
      url,
      data,
      method: 'DELETE',
      ...options
    })
  }
  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN
  connect (url: string, data: object = {}, options: handleOptions = {}) {
    return this.request({
      url,
      data,
      method: 'CONNECT',
      ...options
    })
  }
  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN || MP-BAIDU
  head (url: string, data: object = {}, options: handleOptions = {}) {
    return this.request({
      url,
      data,
      method: 'HEAD',
      ...options
    })
  }
  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN || MP-BAIDU
  options (url: string, data: object = {}, options: handleOptions = {}) {
    return this.request({
      url,
      data,
      method: 'OPTIONS',
      ...options
    })
  }
  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN
  trace (url: string, data: object = {}, options: handleOptions = {}) {
    return this.request({
      url,
      data,
      method: 'TRACE',
      ...options
    })
  }
  // #endif

  upload (url, {
    // #ifdef APP-PLUS
    files,
    // #endif
    // #ifdef MP-ALIPAY
    fileType,
    // #endif
    filePath,
    name,
    header,
    formData
  }) {
    // @ts-ignore
    return new Promise((resolve, reject) => {
      let next = true
      let handleRe = {}
      const pubConfig = {
        baseUrl: this.config.baseUrl,
        url,
        // #ifdef APP-PLUS
        files,
        // #endif
        // #ifdef MP-ALIPAY
        fileType,
        // #endif
        filePath,
        method: 'UPLOAD',
        name,
        header: header || this.config.header,
        formData,
        complete: (response) => {
          response.config = handleRe
          if (response.statusCode === 200) { // 成功
            response = this.requestComFun(response)
            resolve(response)
          } else {
            response = this.requestComFail(response)
            reject(response)
          }
        }
      }
      const cancel = (t = 'handle cancel', config = pubConfig) => {
        const err = {
          errMsg: t,
          config: config
        }
        reject(err)
        next = false
      }

      handleRe = { ...this.requestBeforeFun(pubConfig, cancel) }
      const _config = { ...handleRe }
      if (!next) return
      // @ts-ignore
      _config.url = Request.posUrl(url) ? url : (this.config.baseUrl + url)
      uni.uploadFile(_config)
    })
  }
}

export {
  options,
  handleOptions,
  config,
  requestConfig,
  response
}
