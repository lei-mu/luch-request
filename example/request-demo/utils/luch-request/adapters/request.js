import {isBoolean} from '../utils'
import buildURL from '../helpers/buildURL'
import buildFullPath from '../core/buildFullPath'

export default (config) => {
  return new Promise((resolve, reject) => {
    return new Promise((resolve, reject) => {
      options.baseUrl = this.config.baseUrl
      options.dataType = options.dataType || this.config.dataType
      // #ifndef MP-ALIPAY || APP-PLUS
      options.responseType = options.responseType || this.config.responseType
      // #endif
      // #ifdef MP-ALIPAY || MP-WEIXIN
      options.timeout = options.timeout || this.config.timeout
      // #endif
      // #ifdef H5
      options.withCredentials = isBoolean(options.withCredentials) ? options.withCredentials : this.config.withCredentials
      // #endif
      options.url = options.url || ''
      options.data = options.data || {}
      options.params = options.params || {}
      options.header = {...this.config.header, ...(options.header || {})}
      options.method = options.method || this.config.method
      options.custom =  {...this.config.custom,...(options.custom || {})}
      // #ifdef APP-PLUS
      options.sslVerify = options.sslVerify === undefined ? this.config.sslVerify : options.sslVerify
      // #endif
      options.getTask = options.getTask || this.config.getTask
      let next = true
      const cancel = (t = 'handle cancel', config = options) => {
        const err = {
          errMsg: t,
          config: config
        }
        reject(err)
        next = false
      }

      const handleRe =  {...this.requestBeforeFun(options, cancel)}
      const _config = {...handleRe}
      if (!next) return
      const requestTask = uni.request({
        url: buildURL(buildFullPath(_config.baseUrl, _config.url), _config.params),
        data: _config.data,
        header: _config.header,
        method: _config.method,
        // #ifdef MP-ALIPAY || MP-WEIXIN
        timeout: _config.timeout,
        // #endif
        dataType: _config.dataType,
        // #ifndef MP-ALIPAY || APP-PLUS
        responseType: _config.responseType,
        // #endif
        // #ifdef APP-PLUS
        sslVerify: _config.sslVerify,
        // #endif
        // #ifdef H5
        withCredentials: _config.withCredentials,
        // #endif
        complete: (response) => {
          response.config = handleRe
          if (this.validateStatus(response.statusCode)) { // 成功
            response = this.requestComFun(response)
            resolve(response)
          } else {
            response = this.requestComFail(response)
            resolve(response)
          }
        }
      })
      if (handleRe.getTask) {
        handleRe.getTask(requestTask, handleRe)
      }
    })
  })
}
