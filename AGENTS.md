# Repository Guidelines

## 项目结构与模块组织

`src/` 是 TypeScript 库源码：`core/` 保存请求生命周期与拦截器，`adapters/` 封装 `uni.request`、上传和下载，`helpers/` 放置 URL 与原生选项工具；公共 API 统一从 `src/index.ts` 导出。运行时测试位于 `test/runtime/*.test.ts`，类型契约测试位于 `test/types/*.test-d.ts`。`docs/` 是独立的 VitePress 文档项目，`example/luch-request-v4-test/` 是 uni-app 集成示例。`dist/` 与 `zipDist/` 为生成产物，不要手工编辑。

## 核心设计先于实现

新增或调整 v4 核心能力时，必须先提交设计方案并获得确认，再修改业务代码。核心能力包括公共 API、配置合并、adapter、interceptor、错误模型、取消机制、公共 TypeScript 类型及跨平台行为。局部 bug 修复、测试补充和不改变外部行为的内部整理，可直接按最小改动原则执行。

设计方案必须至少说明：

- 目标、非目标与明确的成功标准；
- 公共 API、调用示例及兼容性影响；
- 配置的默认值、合并顺序和覆盖规则；
- adapter 与 uni-app 原生 Task API 的职责边界；
- interceptor 的执行顺序、异步行为和错误传播；
- 错误分类、取消语义及降级行为；
- TypeScript 类型约束、扩展方式和类型验证；
- 各 uni-app 平台的能力差异、检测策略与最低版本；
- runtime、类型、构建和平台集成的验证方式。

设计未确认前，不得创建业务实现、预埋扩展点或引入“以后可能需要”的抽象。允许编写用于验证可行性的最小实验，但实验代码不得进入正式实现，且结论必须记录在设计方案中。

需要进行方案对比时，可以查阅 Axios 等成熟 HTTP client 的当前官方文档或源码。Axios 是一个面向 JavaScript 环境的 HTTP client，仅作为设计案例，不代表本项目必须兼容或照搬其 API。引用外部方案时必须说明：

1. 借鉴了什么机制，以及它解决的问题；
2. 哪些部分不适合 uni-app 多平台环境；
3. 最终方案在复杂度、稳定性、包体积和可测试性上的取舍。

如果外部资料不可用或平台支持情况无法确认，应明确说明未知项，不得依赖模型记忆虚构行为。存在更简单、更健壮或更适合 uni-app 的方案时，应优先采用并说明理由。

## 跨平台兼容性

所有功能设计必须优先保证 uni-app 多平台兼容，不能默认 Web API、DOM API、Node.js API 或某个小程序 API 在其他平台可用。例如，不得直接假设 `AbortController`、`AbortSignal`、`window` 或 Node.js 内置模块能够在所有运行环境中使用。

采用支持范围不明确或可能随版本变化的 API 前，必须先搜索并核对当前官方文档，优先查阅 uni-app 与对应平台的原始资料，记录平台差异和最低版本。无法确认全平台支持时，应采用能力检测、原生 Task API 或明确的降级行为；不得静默宣称全平台支持。实现后应为支持路径和降级路径分别补充测试。

## 构建、测试与本地开发

仓库使用 Node.js 22 与 `pnpm@11.17.0`；首次运行执行 `pnpm install --frozen-lockfile`。

- `pnpm typecheck`：以严格模式检查源码和测试类型。
- `pnpm test`：使用 Vitest 单次运行全部测试；开发时用 `pnpm test:watch`。
- `pnpm build`：清理并生成 `dist/index.js`、声明文件及 sourcemap。
- `pnpm check`：依次执行类型检查、测试和完整构建；提交前必须通过。
- `cd docs && pnpm install --frozen-lockfile && pnpm build`：验证文档站点。

## 编码风格与命名

遵循现有 TypeScript 风格：两个空格缩进、单引号、不写分号、尾随逗号按现有文件保持一致。项目启用 `strict`、`noUncheckedIndexedAccess` 和 `exactOptionalPropertyTypes`；不要用 `any` 绕过类型约束。类和 enum 使用 PascalCase，函数与变量使用 camelCase，测试文件按被测模块命名。新增公共能力必须通过 `src/index.ts` 显式导出，并同步相关文档。仓库未配置 formatter 或 linter，避免无关格式化改动。

## 测试规范

行为变更应在 `test/runtime/` 增加 Vitest 用例；公共类型变更应在 `test/types/` 增加编译期断言。测试描述应明确输入、行为和边界条件，并覆盖成功与失败路径。当前没有硬性覆盖率阈值，但修复 bug 时必须加入可复现该问题的回归测试。

## Commit 与 Pull Request

近期历史采用 Conventional Commits，例如 `fix: 修正文档站内链接路径`、`test: 迁移 v4 示例项目`。使用 `feat:`、`fix:`、`test:`、`docs:`、`ci:` 或 `chore:`，主题保持简短、使用祈使语气且一次提交只处理一个目标。PR 应说明问题、方案、兼容性影响与验证命令，关联相关 issue；涉及文档 UI 或示例界面时附截图。提交前运行 `pnpm check`，并确保文档或示例的对应 CI 检查通过。

## 安全与兼容性

不要提交 token、私有接口地址或本机配置。修改 uni-app 平台行为或公共 API 前，检查 `COMPATIBILITY.md` 与 `MIGRATION.md`，避免未经说明的 breaking change。
