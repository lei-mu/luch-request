# luch-request v4 uni-app 测试项目

该项目用于在 HBuilderX 的各个 uni-app 运行目标中手动验证 v4。测试页使用
FastMock 接口，涵盖基础请求、并发、拦截器、HTTP 500、取消、BigInt、下载、
上传及错误 JSON 解析。

## 准备

先构建本地 v4 包：

```bash
cd ../..
npm install
npm run build
```

再安装测试项目的本地依赖：

```bash
cd example/luch-request-v4-test
npm install
```

使用 HBuilderX 打开本目录，选择需要验证的平台运行。首页分为两类入口：

- “项目级用法”包含共享实例、拦截器与错误、取消与 Task、上传下载页面；
- 首页下半部分保留完整回归测试，可以逐项执行或点击“运行全部”。

项目级用法页会同时向页面和控制台输出带时间、平台和结构化详情的日志。测试后
点击“复制日志”，可以直接把证据粘贴到 Issue 或测试反馈中。

`request/projectClient.ts` 展示推荐的项目组织方式：集中创建一个请求实例、安装
项目级 interceptor，各业务页面只导入并复用该实例。这里的“项目级”不是 Vue
`app.use()` 插件，因为 luch-request v4 当前没有提供 Vue install 契约。

## 平台注意事项

- 小程序开发阶段需在开发工具中关闭域名校验，真机或发布版本需配置
  `mock.quanzhan.co` 为合法 request/uploadFile/downloadFile 域名。
- H5 运行结果受浏览器 CORS 策略影响。
- “RequestTask 取消”会显示实际使用的 `native` 或 `logical` 模式。
- BigInt 用例是平台行为观察项，重点比较 JSON 结果与 `dataType: 'text'` 结果。
- 上传用例依赖 Mock 服务接受 multipart 请求；失败时可结合页面错误判断是平台、
  域名配置还是服务能力问题。
