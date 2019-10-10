import Request from './request'

const test = new Request()

test.setConfig((config) => { /* 设置全局配置 */
  config.baseUrl = 'http://www.aaa.cn'
  config.header = {
    ...config.header,
    a: 1,
    b: 2
  }
  return config
})

test.interceptor.request((config, cancel) => { /* 请求之前拦截器 */
  config.header = {
    ...config.header,
    a: 3
  }
  /*
  if (!token) { // 如果token不存在，调用cancel 会取消本次请求，但是该函数的catch() 仍会执行
    cancel('token 不存在') // 接收一个参数，会传给catch((err) => {}) err.errMsg === 'token 不存在'
  }
  */
  return config
})

/**
 * 自定义验证器，如果返回true 则进入响应拦截器的响应成功函数(resolve)，否则进入响应拦截器的响应错误函数(reject)
 * @param { Object } response - 请求响应体（只读）
 * @return { Boolean } 如果为true,则 resolve, 否则 reject
 */
test.validateStatus = (response) => {
  return response.statusCode === 200
}

test.interceptor.response((response) => { /* 请求之后拦截器 */
  return response
}, (response) => { // 请求错误做点什么
  return response
})

const http = new Request()

http.setConfig((config) => { /* 设置全局配置 */
  config.baseUrl = 'http://www.bbb.cn' /* 根域名不同 */
  config.header = {
    ...config.header,
    a: 1,
    b: 2
  }
  return config
})

/**
 * 自定义验证器，如果返回true 则进入响应拦截器的响应成功函数(resolve)，否则进入响应拦截器的响应错误函数(reject)
 * @param { Object } response - 请求响应体（只读）
 * @return { Boolean } 如果为true,则 resolve, 否则 reject
 */
http.validateStatus = (response) => {
  return response.statusCode === 200
}

http.interceptor.request((config, cancel) => { /* 请求之前拦截器 */
  config.header = {
    ...config.header,
    b: 1
  }
  /*
  if (!token) { // 如果token不存在，调用cancel 会取消本次请求，但是该函数的catch() 仍会执行
    cancel('token 不存在') // 接收一个参数，会传给catch((err) => {}) err.errMsg === 'token 不存在'
  }
  */
  return config
})

http.interceptor.response((response) => { /* 请求之后拦截器 */
  return response
}, (response) => { // 请求错误做点什么
  return response
})

export {
  http,
  test
}
