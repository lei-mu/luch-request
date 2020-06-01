import buildURL from '../helpers/buildURL'
import buildFullPath from '../core/buildFullPath'
import settle from
export default config => {
  return new Promise((resolve, reject) => {
    const _config = {
      url: buildURL(buildFullPath(config.baseUrl, config.url), config.params || {}),
      // #ifdef MP-ALIPAY
      fileType: config.fileType,
      // #endif
      filePath: config.filePath,
      name: config.name,
      header: config.header || {},
      formData: config.formData || {},
      complete: (response) => {
        response.config = config
        try {
          // 对可能字符串不是json 的情况容错
          if (typeof response.data === 'string') {
            response.data = JSON.parse(response.data)
          }
          // eslint-disable-next-line no-empty
        } catch (e) {
        }
        if (this.validateStatus(response.statusCode)) { // 成功
          response = this.requestComFun(response)
          resolve(response)
        } else {
          response = this.requestComFail(response)
          reject(response)
        }
      }
    }
    // #ifdef APP-PLUS || H5
    if (handleRe.files) {
      _config.files = handleRe.files
    }
    // #endif
    // #ifdef H5
    if (handleRe.file) {
      _config.file = handleRe.file
    }
    // #endif
    if (!next) return
    const requestTask = uni.uploadFile(_config)
    if (handleRe.getTask) {
      handleRe.getTask(requestTask, handleRe)
    }
  })
}
