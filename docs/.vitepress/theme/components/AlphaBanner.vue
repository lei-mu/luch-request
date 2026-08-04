<template>
  <aside class="alpha-banner" aria-label="v4 Alpha 版本提示">
    <div class="alpha-banner__inner">
      <span class="alpha-banner__badge">ALPHA</span>
      <p class="alpha-banner__message">
        v4 尚未稳定，不建议未经验证直接替换生产项目。
      </p>
      <a class="alpha-banner__link" href="https://v3.luch-request.quanzhan.co/">
        前往 v3 稳定版
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  </aside>
</template>

<style scoped>
.alpha-banner {
  position: sticky;
  top: 0;
  z-index: 40;
  border-bottom: 1px solid color-mix(in srgb, #f2a93b 45%, transparent);
  background: #13213c;
  color: #f5f7fb;
}

.alpha-banner__inner {
  display: flex;
  min-height: 36px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 7px 32px;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.alpha-banner__badge {
  padding: 1px 6px;
  border: 1px solid #f2a93b;
  color: #f2a93b;
  font-family: var(--lr-font-code);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.alpha-banner__message {
  flex: 1;
  margin: 0;
  color: #d8e0ef;
}

.alpha-banner__link {
  color: #ffffff;
  font-weight: 650;
  text-decoration: none;
}

.alpha-banner__link:hover {
  color: #f2a93b;
}

@media (max-width: 640px) {
  .alpha-banner__inner {
    padding: 8px 16px;
    flex-wrap: wrap;
    gap: 6px 10px;
  }

  .alpha-banner__message {
    flex-basis: calc(100% - 60px);
  }

  .alpha-banner__link {
    margin-left: 60px;
  }
}
</style>
