import {deepMerge, isFunction, isPlainObject, isUndefined} from '../utils'


// 合并全局、局部
export const MERGE_DEEP_PROPERTIES = 'MERGE_DEEP_PROPERTIES'

// 只获取局部配置
export const VALUE_FROM_LOCAL_CONFIG = 'VALUE_FROM_LOCAL_CONFIG'
// 优先获取局部，其次全局
export const DEFAULT_TO_LOCAL_CONFIG = 'DEFAULT_TO_LOCAL_CONFIG'


function mergeDeepProperties(g, l, prop) {
  if (!isUndefined(l)) {
    return getMergedValue(g, l);
  } else if (!isUndefined(a)) {
    return getMergedValue(undefined, l);
  }
}


function getMergedValue(target, source) {
  if (isPlainObject(target) && isPlainObject(source)) {
    return deepMerge(target, source);
  } else if (isPlainObject(source)) {
    return deepMerge({}, source);
  } else if (Array.isArray(source)) {
    return source.slice();
  }
  return source;
}

function valueFromLocalConfig(g, l) {
  if (!isUndefined(l)) {
    return getMergedValue(undefined, l);
  }
}

function defaultToLocalConfig(g, l) {
  if (!isUndefined(l)) {
    return getMergedValue(undefined, l);
  } else if (!isUndefined(g)) {
    return getMergedValue(undefined, g);
  }
}

/**
 * 合并局部配置优先的配置，如果局部有该配置项则用局部，如果全局有该配置项则用全局
 * @param {Array} keys - 配置项
 * @param {Object} globalsConfig - 当前的全局配置
 * @param {Object} config2 - 局部配置
 * @return {{}}
 */
const mergeKeys = (keys, globalsConfig, config2) => {
  let config = {}
  keys.forEach(prop => {
    if (!isUndefined(config2[prop])) {
      config[prop] = config2[prop]
    } else if (!isUndefined(globalsConfig[prop])) {
      config[prop] = globalsConfig[prop]
    }
  })
  return config
}

const mergeKeyMap = {
  MERGE_DEEP_PROPERTIES: mergeDeepProperties,
  VALUE_FROM_LOCAL_CONFIG: valueFromLocalConfig,
  DEFAULT_TO_LOCAL_CONFIG: defaultToLocalConfig,

}


/**
 *
 * @param mergeMap - 合并策略
 * @param globalsConfig - 当前实例的全局配置
 * @param config2 - 当前的局部配置
 * @return - 合并后的配置
 */
export default (mergeMap, globalsConfig, config2 = {}) => {

  const getMergeMethod = (curMap, mergeKey) => {
    const keyVal = curMap[mergeKey]
    if (isFunction(keyVal)) {
      return keyVal
    } else if ([MERGE_DEEP_PROPERTIES, VALUE_FROM_LOCAL_CONFIG, DEFAULT_TO_LOCAL_CONFIG].includes(mergeKey)
    ) {
      return mergeKeyMap[mergeKey]
    } else {
      return mergeKeyMap[DEFAULT_TO_LOCAL_CONFIG]
    }
  }
  const config = {}
  const methodMerge = getMergeMethod(mergeMap.COMMON, 'method')
  const method = methodMerge(globalsConfig['method'], config['method'])
  let curMergeMap = {
    ...mergeMap.COMMON
  }
  if (method === 'DOWNLOAD') {
    curMergeMap = {
      ...curMergeMap,
      ...mergeMap.DOWNLOAD
    }
  } else if (method === 'UPLOAD') {
    curMergeMap = {
      ...curMergeMap,
      ...mergeMap.UPLOAD
    }
  } else {
    curMergeMap = {
      ...curMergeMap,
      ...mergeMap.REQUEST
    }
  }
  Object.keys({
    ...globalsConfig,
    ...config2
  }).forEach(prop => {
    const merge = getMergeMethod(curMergeMap, prop);
    const configValue = merge(globalsConfig[prop], config2[prop], prop);
    if (!isUndefined(configValue)) {
      config[prop] = configValue
    }
  })
  return config
}
