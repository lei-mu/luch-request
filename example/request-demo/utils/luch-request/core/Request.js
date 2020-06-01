/**
 * @Class Request
 * @description luch-request http请求插件
 * @version 2.0.1
 * @Author lu-ch
 * @Date 2020-05-01
 * @Email webwork.s@qq.com
 * 文档: https://soso.luxe/luch-request/
 * http://ext.dcloud.net.cn/plugin?id=392
 * hbuilderx:2.6.15
 */


import dispatchRequest from './dispatchRequest'
import InterceptorManager from './InterceptorManager'
import mergeConfig from './mergeConfig'
import defaults from './defaults'
import { isPlainObject } from '../utils'

export default class Request {
  constructor(arg = {}) {
    if (!isPlainObject(arg)) {
      arg = {}
      console.warn('设置全局参数必须接收一个Object')
    }
    this.config = {...defaults, ...arg}
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
  }
  /**
   * @Function
   * @param {Request~setConfigCallback} f - 设置全局默认配置
   */
  setConfig(f) {
		console.log(f(this.config))
    this.config = f(this.config)
  }

  _middleware(config) {
		console.log('-345-')
		console.log(this.config)
    config = mergeConfig(this.config, config)
    let chain = [dispatchRequest, undefined]
    let promise = Promise.resolve(config)

    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      chain.unshift(interceptor.fulfilled, interceptor.rejected)
    })

    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise
  }

  /**
   * @Function
   * @param {Object} config - 请求配置项
   * @prop {String} options.url - 请求路径
   * @prop {Object} options.data - 请求参数
   * @prop {Object} [options.responseType = config.responseType] [text|arraybuffer] - 响应的数据类型
   * @prop {Object} [options.dataType = config.dataType] - 如果设为 json，会尝试对返回的数据做一次 JSON.parse
   * @prop {Object} [options.header = config.header] - 请求header
   * @prop {Object} [options.method = config.method] - 请求方法
   * @returns {Promise<unknown>}
   */
  request(config = {}) {
    return this._middleware(config)
  }

  get(url, options = {}) {
    return this.request({
      url,
      method: 'GET',
      ...options
    })
  }

  post(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'POST',
      ...options
    })
  }

  // #ifndef MP-ALIPAY
  put(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'PUT',
      ...options
    })
  }

  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN || MP-BAIDU
  delete(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'DELETE',
      ...options
    })
  }

  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN
  connect(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'CONNECT',
      ...options
    })
  }

  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN || MP-BAIDU
  head(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'HEAD',
      ...options
    })
  }

  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN || MP-BAIDU
  options(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'OPTIONS',
      ...options
    })
  }

  // #endif

  // #ifdef APP-PLUS || H5 || MP-WEIXIN
  trace(url, data, options = {}) {
    return this.request({
      url,
      data,
      method: 'TRACE',
      ...options
    })
  }

  // #endif

 upload(url, config = {}) {
    config.url = url
    config.method = 'UPLOAD'
    return this._middleware(config)
  }

  download(url, config = {}) {
    config.url = url
    config.method = 'DOWNLOAD'
    return this._middleware(config)
  }
}


/**
 * setConfig回调
 * @return {Object} - 返回操作后的config
 * @callback Request~setConfigCallback
 * @param {Object} config - 全局默认config
 */
/**
 * 请求拦截器回调
 * @return {Object} - 返回操作后的config
 * @callback Request~requestCallback
 * @param {Object} config - 全局config
 * @param {Function} [cancel] - 取消请求钩子，调用会取消本次请求
 */
/**
 * 响应拦截器回调
 * @return {Object} - 返回操作后的response
 * @callback Request~responseCallback
 * @param {Object} response - 请求结果 response
 */
/**
 * 响应错误拦截器回调
 * @return {Object} - 返回操作后的response
 * @callback Request~responseErrCallback
 * @param {Object} response - 请求结果 response
 */
