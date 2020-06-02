import {deepMerge, isObject} from '../utils'

const mergeKeys = (keys, globalsConfig, config2) => {
  let config = {}
  keys.forEach(prop => {
    if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop]
    } else if (typeof globalsConfig[prop] !== 'undefined') {
      config[prop] = globalsConfig[prop]
    }
  })
  return config
}
/**
 *
 * @param globalsConfig - 当前实例的全局配置
 * @param config2 - 当前的局部配置
 * @return - 合并后的配置
 */
export default (globalsConfig, config2 = {}) => {
  const method = config2.method || globalsConfig.method || 'GET'
  let config = {
    baseURL: globalsConfig.baseURL || '',
    method: method,
    url: config2.url || ''
  }
  const mergeDeepPropertiesKeys = ['header', 'params', 'custom']
  const defaultToConfig2Keys = ['getTask', 'validateStatus']
  mergeDeepPropertiesKeys.forEach(prop => {
    if (isObject(config2[prop])) {
      config[prop] = deepMerge(globalsConfig[prop], config2[prop])
    } else if (typeof config2[prop] !== 'undefined') {
      config[prop] = config2[prop]
    } else if (isObject(globalsConfig[prop])) {
      config[prop] = deepMerge(globalsConfig[prop])
    } else if (typeof globalsConfig[prop] !== 'undefined') {
      config[prop] = globalsConfig[prop]
    }
  })
  config = {...config, ...mergeKeys(defaultToConfig2Keys, globalsConfig, config2)}

  // eslint-disable-next-line no-empty
  if (method === 'DOWNLOAD') {

  } else if (method === 'UPLOAD') {
    delete config.header['content-type']
    delete config.header['Content-Type']
    const uploadKeys = [
      // #ifdef MP-ALIPAY
      'fileType',
      // #endif
      'name', 'formData',
      // #ifdef APP-PLUS || H5
      'files',
      // #endif
      // #ifdef H5
      'file'
      // #endif
    ]
    uploadKeys.forEach(prop => {
      if (typeof config2[prop] !== 'undefined') {
        config[prop] = config2[prop]
      }
    })
  } else {
    const defaultsKeys = [
      'data',
      'dataType',
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
    config = {...config, ...mergeKeys(defaultsKeys, globalsConfig, config2)}
  }

  return config
}
