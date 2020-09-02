/**
 * 商品相关api
 */
import {
  http
} from '@/api/service.js'

/**
 * 查询商品列表
 * @param {Object} params - 查询参数  
 */
export const getGoodsList = (params) => {
  return http.get('/api/user/list', {
    params
  })
}

// 通用请求方法middleware 演示。文档：https://www.quanzhan.co/luch-request/guide/3.x/#middleware
/**
 * 查询商品信息
 * @param {Object} data - 查询数据
 * @param {Object} params - 查询params参数
 */
export const getGoodsInfo = (data, params) => {
  return http.middleware({
    method: 'POST', // 必须大写
    url: '/api/user/update',
    data: data,
    params: params,
    custom: {
      auth: true
    }
  })
}
