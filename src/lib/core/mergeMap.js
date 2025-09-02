
import mergeConfig, {DEFAULT_TO_LOCAL_CONFIG, MERGE_DEEP_PROPERTIES, VALUE_FROM_LOCAL_CONFIG} from './mergeConfig'
export default {
  'COMMON': {
    method: DEFAULT_TO_LOCAL_CONFIG,
    baseURL: DEFAULT_TO_LOCAL_CONFIG,
    url: VALUE_FROM_LOCAL_CONFIG,
    params: VALUE_FROM_LOCAL_CONFIG,
    custom: MERGE_DEEP_PROPERTIES,
    header: MERGE_DEEP_PROPERTIES,
    getTask: VALUE_FROM_LOCAL_CONFIG,
    validateStatus: DEFAULT_TO_LOCAL_CONFIG,
    paramsSerializer: VALUE_FROM_LOCAL_CONFIG,
    forcedJSONParsing: DEFAULT_TO_LOCAL_CONFIG,
  },
  'UPLOAD': {
    // #ifdef APP-PLUS || H5
    'files': VALUE_FROM_LOCAL_CONFIG,
    // #endif
    // #ifdef MP-ALIPAY
    'fileType': VALUE_FROM_LOCAL_CONFIG,
    // #endif
    // #ifdef H5
    'file': VALUE_FROM_LOCAL_CONFIG,
    // #endif
    'filePath': VALUE_FROM_LOCAL_CONFIG,
    'name': VALUE_FROM_LOCAL_CONFIG,
    // #ifdef H5 || APP-PLUS || MP-WEIXIN || MP-ALIPAY || MP-TOUTIAO || MP-KUAISHOU
    'timeout': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    'formData': VALUE_FROM_LOCAL_CONFIG,
  },
  'DOWNLOAD': {
    // #ifdef H5 || APP-PLUS || MP-WEIXIN || MP-ALIPAY || MP-TOUTIAO || MP-KUAISHOU
    'timeout': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    // #ifdef MP
    'filePath': VALUE_FROM_LOCAL_CONFIG,
    // #endif
  },
  'REQUEST': {
    'data': VALUE_FROM_LOCAL_CONFIG,
    // #ifdef H5 || APP-PLUS || MP-ALIPAY || MP-WEIXIN
    'timeout': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    'dataType': DEFAULT_TO_LOCAL_CONFIG,
    // #ifndef MP-ALIPAY
    'responseType': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    // #ifdef APP-PLUS
    'sslVerify': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    // #ifdef H5
    'withCredentials': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    // #ifdef APP-PLUS
    'firstIpv4': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    // #ifdef MP-WEIXIN
    'enableHttp2': DEFAULT_TO_LOCAL_CONFIG,
    'enableQuic': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    // #ifdef MP-TOUTIAO || MP-WEIXIN
    'enableCache': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    // #ifdef MP-WEIXIN
    'enableHttpDNS': DEFAULT_TO_LOCAL_CONFIG,
    'httpDNSServiceId': DEFAULT_TO_LOCAL_CONFIG,
    'enableChunked': DEFAULT_TO_LOCAL_CONFIG,
    'forceCellularNetwork': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    // #ifdef MP-ALIPAY
    'enableCookie': DEFAULT_TO_LOCAL_CONFIG,
    // #endif
    // #ifdef MP-BAIDU
    'cloudCache': DEFAULT_TO_LOCAL_CONFIG,
    'defer': DEFAULT_TO_LOCAL_CONFIG
    // #endif
  }

}
