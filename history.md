## 3.0.3 (2020-06-16)

1. Bug Fix: 修复` params ` 选项对数组格式化错误bug

## 3.0.2 (2020-06-04)

1. Bug Fix: 修复文件上传和request 配置缺少字段bug 

## 3.0.1 (2020-06-02)

1. Bug Fix: 请求方式都为` GET `的bug

## 3.0.0 (2020-06-01)

1. New Feature: 支持多拦截器
1. New Feature: 支持局部配置自定义验证器

## 2.0.1 (2020-05-01)

1. Bug Fix: 修复多实例全局配置共用问题

## 2.0.0 (2020-04-24)

1. New Feature: 增加 request ` withCredentials `选项（仅h5端支持）
1. New Feature: h5端 upload 增加 ` files ` ` file `选项。[uni.uploadFile](https://uniapp.dcloud.io/api/request/network-file?id=uploadfile "uni.uploadFile")
1. Enhancement: ` params ` 选项参数格式化方法使用axios 格式化方法
1. Bug Fix: 对upload 返回data 为空字符串的情况容错
1. Change: 修改header与全局合并方式。当前：header = Object.assign(全局，局部)

## 0.0.0 (2019-05)

1. luch-request created


