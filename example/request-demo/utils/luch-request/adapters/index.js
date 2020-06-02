import buildURL from '../helpers/buildURL'
import buildFullPath from '../core/buildFullPath'
import settle from '../core/settle'

const mergeKeys = (keys, config2) => {
  let config = {}
  keys.forEach(prop => {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop]
    }
  })
  return config
}
export default (config) => {
  return new Promise((resolve, reject) => {
    const _config = {
      url: buildURL(buildFullPath(config.baseURL, config.url), config.params),
      header: config.header
    }
    const complete = (response) => {
      response.config = config
      try {
        // 对可能字符串不是json 的情况容错
        if (typeof response.data === 'string') {
          response.data = JSON.parse(response.data)
        }
        // eslint-disable-next-line no-empty
      } catch (e) {
      }
      settle(resolve, reject, response)
    }
    let requestTask
    if (config.method === 'UPLOAD') {
      let otherConfig = {
        // #ifdef MP-ALIPAY
        fileType: config.fileType,
        // #endif
        filePath: config.filePath,
        name: config.name,
        complete: complete
      }
      const optionalKeys = ['formData',
        // #ifdef APP-PLUS || H5
        'files',
        // #endif
        // #ifdef H5
        'file'
        // #endif
      ]
      requestTask = uni.uploadFile({..._config, ...otherConfig, ...mergeKeys(optionalKeys, config)})

    } else if (config.method === 'DOWNLOAD') {
      requestTask = uni.downloadFile({..._config,complete})
    } else {
      const optionalKeys = [
        'method',
        'data',
        'dataType ',
        // #ifndef MP-ALIPAY || APP-PLUS
        'responseType',
        // #endif
        // #ifdef MP-ALIPAY || MP-WEIXIN
        'timeout',
        // #endif
        // #ifdef H5
        'withCredentials',
        // #endif
        // #ifdef APP-PLUS
        'sslVerify'
        // #endif
      ]
      requestTask = uni.request({..._config,...mergeKeys(optionalKeys, config), complete})
    }
    if (config.getTask) {
      config.getTask(requestTask, config)
    }
  })
}
