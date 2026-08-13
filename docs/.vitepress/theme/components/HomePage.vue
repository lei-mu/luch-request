<script setup lang="ts">
import { withBase } from 'vitepress'
import RequestFlow from './RequestFlow.vue'

interface Capability {
  index: string
  title: string
  description: string
  meta: string
}

const capabilities: Capability[] = [
  {
    index: '01',
    title: '类型从调用处开始',
    description: '响应、data、params 与 nativeOptions 各自建模，常见调用保持短而清晰。',
    meta: 'TResponse · TData · TParams'
  },
  {
    index: '02',
    title: '围绕 uni API 设计',
    description: 'request、upload、download 保留各自原生能力，不套用浏览器或 Node adapter。',
    meta: 'uni.request · Task'
  },
  {
    index: '03',
    title: '错误上下文可判断',
    description: '统一 code、config、response、task 与 cause，同时保留平台原始信息。',
    meta: 'LuchRequestError'
  },
  {
    index: '04',
    title: '取消能力可独立传递',
    description: '直接持有 Promise 时使用 abort；跨 service 层时使用 signal。',
    meta: 'abort · signal'
  }
]

const docRoutes = [
  { index: 'A', title: '第一次使用', detail: '安装、创建实例、发出请求', href: '/guide/getting-started' },
  { index: 'B', title: '理解请求管线', detail: '配置合并、interceptor、响应', href: '/guide/configuration' },
  { index: 'C', title: '处理失败与取消', detail: 'error.response、Task、signal', href: '/api/error' },
  { index: 'D', title: '从 v3 升级', detail: 'breaking changes 与迁移边界', href: '/migration/v3-to-v4' }
]
</script>

<template>
  <main class="home-page">
    <section class="home-hero">
      <div class="home-hero__copy">
        <p class="home-eyebrow">
          <span>luch-request</span>
          <span>4.0.0</span>
        </p>
        <h1 class="home-title">
          让 uni-app 请求<br>
          保留原生能力，<br>
          获得明确类型。
        </h1>
        <p class="home-lead">
          面向传统 uni-app 的 TypeScript-first 请求库。围绕配置管线、原生 Task、
          统一错误和跨平台边界重新设计。
        </p>
        <div class="home-actions">
          <a class="home-action home-action--primary" :href="withBase('/guide/getting-started')">
            开始使用 <span aria-hidden="true">→</span>
          </a>
          <a class="home-action" :href="withBase('/guide/')">
            查看兼容性
          </a>
        </div>
      </div>
      <RequestFlow class="home-hero__flow" />
    </section>

    <div class="home-scope" aria-label="当前支持范围">
      <span>ESM ONLY</span>
      <span>ES2017</span>
      <span>TRADITIONAL UNI-APP</span>
      <span>ZERO RUNTIME DEPS</span>
    </div>

    <section class="home-section home-capabilities">
      <header class="home-section__header">
        <p class="home-section__index">01 / DESIGN</p>
        <h2 class="home-section__title">不是浏览器 HTTP client 的移植版</h2>
        <p class="home-section__intro">
          v4 从 uni-app 的 callback API、平台 Task 和多端差异出发，公共类型只承诺运行时真正能保证的内容。
        </p>
      </header>
      <div class="capability-list">
        <article
          v-for="capability in capabilities"
          :key="capability.index"
          class="capability-row"
        >
          <span class="capability-row__index">{{ capability.index }}</span>
          <h3 class="capability-row__title">{{ capability.title }}</h3>
          <p class="capability-row__description">{{ capability.description }}</p>
          <code class="capability-row__meta">{{ capability.meta }}</code>
        </article>
      </div>
    </section>

    <section class="home-section home-example">
      <header class="home-section__header home-section__header--compact">
        <p class="home-section__index">02 / CALL SITE</p>
        <h2 class="home-section__title">常见用法保持直接</h2>
      </header>
      <div class="home-example__layout">
        <div class="code-window" aria-label="TypeScript 请求示例">
          <div class="code-window__bar">
            <span>users.ts</span>
            <span>TYPE CHECKED</span>
          </div>
          <pre><code><span class="code-keyword">interface</span> UserListParams {
  page: <span class="code-type">number</span>
  keyword?: <span class="code-type">string</span>
}

<span class="code-keyword">const</span> response = <span class="code-keyword">await</span> http.get&lt;
  User[],
  UserListParams
&gt;(<span class="code-string">'/users'</span>, {
  params: { page: 1 },
  luchMeta: { requiresAuth: <span class="code-literal">true</span> }
})

response.data[0].id</code></pre>
        </div>
        <aside class="error-anatomy">
          <p class="error-anatomy__label">ERROR ANATOMY</p>
          <h3>请求失败后，先看什么？</h3>
          <dl class="error-anatomy__list">
            <div>
              <dt>code</dt>
              <dd>稳定错误分类</dd>
            </div>
            <div>
              <dt>response</dt>
              <dd>是否已取得响应上下文</dd>
            </div>
            <div>
              <dt>cause / raw</dt>
              <dd>原始异常与平台载荷</dd>
            </div>
            <div>
              <dt>cancelMode</dt>
              <dd>原生中断或逻辑取消</dd>
            </div>
          </dl>
          <a :href="withBase('/api/error')">阅读错误判断边界 →</a>
        </aside>
      </div>
    </section>

    <section class="home-section home-routes">
      <header class="home-section__header home-section__header--compact">
        <p class="home-section__index">03 / DOC ROUTES</p>
        <h2 class="home-section__title">按你正在解决的问题进入</h2>
      </header>
      <nav class="route-list" aria-label="文档阅读路径">
        <a
          v-for="route in docRoutes"
          :key="route.index"
          class="route-row"
          :href="withBase(route.href)"
        >
          <span class="route-row__index">{{ route.index }}</span>
          <strong>{{ route.title }}</strong>
          <span>{{ route.detail }}</span>
          <span aria-hidden="true">↗</span>
        </a>
      </nav>
    </section>

  </main>
</template>

<style scoped>
.home-page {
  color: var(--lr-ink);
}

.home-hero {
  display: grid;
  max-width: 1320px;
  min-height: 620px;
  margin: 0 auto;
  padding: 92px 32px 72px;
  align-items: center;
  gap: 64px;
  grid-template-columns: minmax(0, 1.06fr) minmax(460px, 0.94fr);
}

.home-eyebrow,
.home-section__index {
  display: flex;
  margin: 0 0 24px;
  color: var(--lr-blue);
  font-family: var(--lr-font-code);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.home-eyebrow {
  gap: 28px;
}

.home-title {
  max-width: 760px;
  margin: 0;
  font-family: var(--lr-font-display);
  font-size: clamp(54px, 6.3vw, 92px);
  font-stretch: condensed;
  font-weight: 760;
  letter-spacing: -0.055em;
  line-height: 0.94;
}

.home-lead {
  max-width: 610px;
  margin: 32px 0 0;
  color: var(--lr-muted);
  font-size: 18px;
  line-height: 1.75;
}

.home-actions {
  display: flex;
  margin-top: 34px;
  flex-wrap: wrap;
  gap: 12px;
}

.home-action {
  display: inline-flex;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--lr-line);
  align-items: center;
  gap: 18px;
  color: var(--lr-ink);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
}

.home-action:hover {
  border-color: var(--lr-blue);
  color: var(--lr-blue);
}

.home-action--primary {
  border-color: var(--lr-blue);
  background: var(--lr-blue);
  color: #ffffff;
}

.home-action--primary:hover {
  background: var(--lr-ink);
  color: #ffffff;
}

.home-scope {
  display: grid;
  border-block: 1px solid var(--lr-line);
  grid-template-columns: repeat(5, 1fr);
  font-family: var(--lr-font-code);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.09em;
}

.home-scope span {
  padding: 14px 18px;
  border-right: 1px solid var(--lr-line);
  text-align: center;
}

.home-scope span:last-child {
  border-right: 0;
}

.home-scope__warning {
  color: #8a5600;
  background: color-mix(in srgb, var(--lr-amber) 24%, transparent);
}

.home-section {
  max-width: 1320px;
  margin: 0 auto;
  padding: 124px 32px;
}

.home-section__header {
  display: grid;
  margin-bottom: 64px;
  gap: 24px 48px;
  grid-template-columns: 150px minmax(320px, 0.9fr) minmax(280px, 0.65fr);
}

.home-section__header--compact {
  grid-template-columns: 150px minmax(0, 1fr);
}

.home-section__index {
  margin: 8px 0 0;
}

.home-section__title {
  margin: 0;
  font-family: var(--lr-font-display);
  font-size: clamp(36px, 4.5vw, 64px);
  font-weight: 730;
  letter-spacing: -0.045em;
  line-height: 1;
}

.home-section__intro {
  margin: 5px 0 0;
  color: var(--lr-muted);
  font-size: 16px;
  line-height: 1.75;
}

.capability-list,
.route-list {
  border-top: 1px solid var(--lr-ink);
}

.capability-row {
  display: grid;
  min-height: 116px;
  padding: 24px 0;
  border-bottom: 1px solid var(--lr-line);
  align-items: center;
  gap: 24px;
  grid-template-columns: 60px minmax(220px, 0.75fr) minmax(300px, 1fr) 210px;
}

.capability-row__index,
.route-row__index {
  color: var(--lr-blue);
  font-family: var(--lr-font-code);
  font-size: 11px;
}

.capability-row__title {
  margin: 0;
  font-size: 19px;
}

.capability-row__description {
  margin: 0;
  color: var(--lr-muted);
  line-height: 1.7;
}

.capability-row__meta {
  color: var(--lr-blue);
  font-size: 11px;
}

.home-example {
  max-width: none;
  padding-right: max(32px, calc((100vw - 1256px) / 2));
  padding-left: max(32px, calc((100vw - 1256px) / 2));
  background: #e9edf5;
}

.home-example__layout {
  display: grid;
  gap: 0;
  grid-template-columns: minmax(0, 1.5fr) minmax(300px, 0.7fr);
}

.code-window {
  overflow: auto;
  background: #13213c;
  color: #d8e0ef;
}

.code-window__bar {
  display: flex;
  padding: 13px 18px;
  border-bottom: 1px solid rgba(204, 213, 229, 0.18);
  justify-content: space-between;
  color: #8f9cb4;
  font-family: var(--lr-font-code);
  font-size: 10px;
}

.code-window pre {
  margin: 0;
  padding: 36px;
  font-family: var(--lr-font-code);
  font-size: 14px;
  line-height: 1.75;
}

.code-keyword { color: #70a0ff; }
.code-type { color: #58d6cf; }
.code-string { color: #f2c46d; }
.code-literal { color: #f18da6; }

.error-anatomy {
  padding: 36px;
  border: 1px solid var(--lr-line);
  border-left: 0;
  background: var(--lr-paper);
}

.error-anatomy__label {
  color: var(--lr-blue);
  font-family: var(--lr-font-code);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.error-anatomy h3 {
  margin: 20px 0 28px;
  font-family: var(--lr-font-display);
  font-size: 32px;
  line-height: 1.05;
}

.error-anatomy__list {
  margin: 0 0 28px;
}

.error-anatomy__list div {
  display: grid;
  padding: 12px 0;
  border-top: 1px solid var(--lr-line);
  grid-template-columns: 100px 1fr;
}

.error-anatomy__list dt {
  color: var(--lr-blue);
  font-family: var(--lr-font-code);
  font-size: 12px;
}

.error-anatomy__list dd {
  margin: 0;
  color: var(--lr-muted);
  font-size: 13px;
}

.error-anatomy a {
  color: var(--lr-ink);
  font-weight: 700;
  text-decoration: none;
}

.route-row {
  display: grid;
  min-height: 92px;
  padding: 22px 8px;
  border-bottom: 1px solid var(--lr-line);
  align-items: center;
  gap: 24px;
  grid-template-columns: 50px minmax(200px, 0.6fr) minmax(260px, 1fr) 24px;
  color: var(--lr-ink);
  text-decoration: none;
  transition: background-color 160ms ease, padding 160ms ease;
}

.route-row:hover {
  padding-right: 18px;
  padding-left: 18px;
  background: #eef2fa;
}

.route-row > span:nth-child(3) {
  color: var(--lr-muted);
}

@media (max-width: 980px) {
  .home-hero {
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .home-hero__flow {
    max-width: 720px;
  }

  .home-scope {
    grid-template-columns: repeat(3, 1fr);
  }

  .home-section__header,
  .home-section__header--compact {
    grid-template-columns: 120px 1fr;
  }

  .home-section__intro {
    grid-column: 2;
  }

  .capability-row {
    grid-template-columns: 48px 0.8fr 1.2fr;
  }

  .capability-row__meta {
    display: none;
  }

  .home-example__layout {
    grid-template-columns: 1fr;
  }

  .error-anatomy {
    border-top: 0;
    border-left: 1px solid var(--lr-line);
  }
}

@media (max-width: 680px) {
  .home-hero,
  .home-section {
    padding: 72px 20px;
  }

  .home-title {
    font-size: clamp(40px, 11vw, 46px);
  }

  .home-lead {
    font-size: 16px;
  }

  .home-scope {
    grid-template-columns: 1fr 1fr;
  }

  .home-section__header,
  .home-section__header--compact {
    margin-bottom: 40px;
    grid-template-columns: 1fr;
  }

  .home-section__intro {
    grid-column: auto;
  }

  .capability-row {
    gap: 10px 16px;
    grid-template-columns: 36px 1fr;
  }

  .capability-row__description {
    grid-column: 2;
  }

  .home-example {
    padding-right: 20px;
    padding-left: 20px;
  }

  .code-window pre,
  .error-anatomy {
    padding: 24px 20px;
  }

  .route-row {
    gap: 8px 14px;
    grid-template-columns: 28px 1fr 20px;
  }

  .route-row > span:nth-child(3) {
    grid-column: 2;
  }

  .route-row > span:last-child {
    grid-column: 3;
    grid-row: 1 / span 2;
  }

}
</style>
