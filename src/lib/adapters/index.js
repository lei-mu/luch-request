import buildURL from '../helpers/buildURL'
import buildFullPath from '../core/buildFullPath'
import settle from '../core/settle'
import {isUndefined} from "../utils"

/**
 * 返回可选值存在的配置
 * @param {Array} keys - 可选值数组
 * @param {Object} config2 - 配置
 * @return {{}} - 存在的配置项
 */
const mergeKeys = (keys, config2) => {
  let config = {}
  keys.forEach(prop => {
    if (!isUndefined(config2[prop])) {
      config[prop] = config2[prop]
    }
  })
  return config
}
export default (config, mergeMap) => {
  return new Promise((resolve, reject) => {
    let fullPath = buildURL(buildFullPath(config.baseURL, config.url), config.params, config.paramsSerializer)
    const _config = {
      url: fullPath,
      header: config.header,
      complete: (response) => {
        config.fullPath = fullPath
        response.config = config
        response.rawData = response.data
        try {
          let jsonParseHandle = false
          const forcedJSONParsingType = typeof config.forcedJSONParsing
          if (forcedJSONParsingType === 'boolean') {
            jsonParseHandle = config.forcedJSONParsing
          } else if (forcedJSONParsingType === 'object') {
            const includesMethod = config.forcedJSONParsing.include || []
            jsonParseHandle = includesMethod.includes(config.method)
          }

          // 对可能字符串不是json 的情况容错
          if (jsonParseHandle && typeof response.data === 'string') {
            response.data = JSON.parse(response.data)
          }
          // eslint-disable-next-line no-empty
        } catch (e) {
        }
        settle(resolve, reject, response)
      }
    }
    // const ignoreCommonKey = ['url', 'method', 'baseURL', 'params', 'custom', 'getTask', ]
    // const commonKey = Object.keys(mergeMap.COMMON).filter((key) => {
    //   return !ignoreCommonKey.includes(key)
    // })
    // _config = {..._config, ...mergeKeys(commonKey, config)}

    let requestTask
    if (config.method === 'UPLOAD') {
      delete _config.header['content-type']
      delete _config.header['Content-Type']

      requestTask = uni.uploadFile({..._config, ...mergeKeys(Object.keys(mergeMap.UPLOAD), config)})
    } else if (config.method === 'DOWNLOAD') {

      requestTask = uni.downloadFile({
        ..._config,
        ...mergeKeys(Object.keys(mergeMap.DOWNLOAD), config)
      })

    } else {
      const reqConfig = {..._config, ...mergeKeys(Object.keys(mergeMap.REQUEST), config)}
      if (config.method) {
        reqConfig.method = config.method
      }
      requestTask = uni.request(reqConfig)
    }
    if (config.getTask) {
      config.getTask(requestTask, config)
    }
  })
}
