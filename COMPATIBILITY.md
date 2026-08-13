# 兼容性说明

本文档描述 luch-request v4 正式版本承诺的运行环境和构建边界。
兼容性结论以实际测试范围为准，不把理论可执行环境视为正式支持环境。

## 构建产物

- npm 包只提供 ESM，不提供 CommonJS、UMD 或 ES5 legacy bundle。
- JavaScript 构建目标为 ES2017。
- 核心包不提供 `Promise`、`Map`、`Set` 等运行时 polyfill。
- 核心包不依赖 DOM、Node.js API 或特定小程序全局对象。
- 使用方如果需要低于本表的环境，必须自行转译和提供 polyfill；该环境不在
  官方支持范围内。

## 平台范围

| 环境 | 正式版本支持范围 |
| --- | --- |
| 传统 uni-app App Android | 当前受支持的 uni-app 标准基座，以实际验证版本为准 |
| 传统 uni-app App iOS | iOS 13 及以上 |
| H5 | 支持 ES2017 的现代浏览器，不支持 IE11 |
| 微信、支付宝等小程序 | 平台当前受支持的运行时和基础库版本 |
| HarmonyOS | 使用支持对应 `uni` 网络 API 的 HBuilderX 版本 |
| uni-app x / UTS | 不支持 |

最终 App 的最低系统版本由 luch-request、HBuilderX/原生打包环境和项目使用
的原生插件共同决定，应取其中要求最高的版本。构建工具或原生插件提高最低
系统版本时，本库的 JavaScript 语法下限不会覆盖该限制。

## 平台能力

核心请求能力依赖目标平台提供 `uni.request`、`uni.uploadFile` 和
`uni.downloadFile`。原生 Task 的 `abort`、进度事件、响应头事件等能力可能
因平台和基础库版本不同而缺失，luch-request 会进行能力检测，但不会把缺失
能力模拟成原生能力。

调用方仍需配置小程序合法域名、H5 CORS 和各平台要求的网络权限。

## 发布验证

稳定版本发布前至少验证：

1. TypeScript 类型检查、Vitest 运行时测试和完整构建全部通过。
2. 最终 `dist/index.js` 不包含高于 ES2017 的必要运行语法。
3. 打包后的 npm 包可被 Vue 2 CLI 和 Vue 3/Vite 项目消费。
4. H5、App Android、App iOS 13、微信小程序和支付宝小程序完成基础
   request/upload/download smoke test。
5. Task 支持路径和缺失能力的降级路径分别保留验证记录。

兼容性结论应以目标平台的真实环境验证记录为准。
