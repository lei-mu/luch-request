<script setup lang="ts">
interface FlowStep {
  code: string
  label: string
  detail: string
  tone: 'blue' | 'cyan' | 'amber'
}

const steps: FlowStep[] = [
  { code: '01', label: 'NORMALIZE', detail: 'merge config', tone: 'blue' },
  { code: '02', label: 'INTERCEPT', detail: 'async · FIFO', tone: 'cyan' },
  { code: '03', label: 'DISPATCH', detail: 'uni.* Task', tone: 'blue' },
  { code: '04', label: 'SETTLE', detail: 'response / error', tone: 'amber' }
]
</script>

<template>
  <section class="request-flow" aria-label="luch-request 请求管线">
    <div class="request-flow__topline">
      <span>REQUEST PIPELINE</span>
      <span class="request-flow__status">● TYPE SAFE</span>
    </div>
    <ol class="request-flow__steps">
      <li
        v-for="step in steps"
        :key="step.code"
        class="request-flow__step"
        :data-tone="step.tone"
      >
        <span class="request-flow__code">{{ step.code }}</span>
        <span class="request-flow__node" aria-hidden="true"></span>
        <strong class="request-flow__label">{{ step.label }}</strong>
        <span class="request-flow__detail">{{ step.detail }}</span>
      </li>
    </ol>
    <div class="request-flow__packet" aria-hidden="true"></div>
    <div class="request-flow__footer">
      <span>operation: REQUEST</span>
      <span>transport: uni.request</span>
    </div>
  </section>
</template>

<style scoped>
.request-flow {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(204, 213, 229, 0.24);
  background: #13213c;
  color: #f5f7fb;
  box-shadow: 16px 16px 0 rgba(49, 87, 213, 0.12);
}

.request-flow::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(204, 213, 229, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(204, 213, 229, 0.06) 1px, transparent 1px);
  background-size: 32px 32px;
  content: '';
  pointer-events: none;
}

.request-flow__topline,
.request-flow__footer {
  position: relative;
  display: flex;
  padding: 12px 16px;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--lr-font-code);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.request-flow__topline {
  border-bottom: 1px solid rgba(204, 213, 229, 0.18);
}

.request-flow__status {
  color: #3ec7c2;
}

.request-flow__steps {
  position: relative;
  display: grid;
  margin: 0;
  padding: 34px 20px 38px;
  grid-template-columns: repeat(4, 1fr);
  list-style: none;
}

.request-flow__steps::before {
  position: absolute;
  top: 65px;
  right: 12.5%;
  left: 12.5%;
  height: 1px;
  background: rgba(204, 213, 229, 0.35);
  content: '';
}

.request-flow__step {
  position: relative;
  display: grid;
  justify-items: center;
  text-align: center;
}

.request-flow__code {
  margin-bottom: 14px;
  color: #8f9cb4;
  font-family: var(--lr-font-code);
  font-size: 10px;
}

.request-flow__node {
  z-index: 1;
  width: 10px;
  height: 10px;
  margin-bottom: 16px;
  border: 2px solid #3157d5;
  background: #13213c;
  transform: rotate(45deg);
}

.request-flow__step[data-tone='cyan'] .request-flow__node {
  border-color: #3ec7c2;
}

.request-flow__step[data-tone='amber'] .request-flow__node {
  border-color: #f2a93b;
}

.request-flow__label {
  font-family: var(--lr-font-code);
  font-size: 11px;
  letter-spacing: 0.04em;
}

.request-flow__detail {
  margin-top: 6px;
  color: #8f9cb4;
  font-size: 11px;
}

.request-flow__packet {
  position: absolute;
  top: 61px;
  left: 12%;
  width: 8px;
  height: 8px;
  background: #f2a93b;
  box-shadow: 0 0 18px #f2a93b;
  animation: packet-route 5s linear infinite;
}

.request-flow__footer {
  border-top: 1px solid rgba(204, 213, 229, 0.18);
  color: #8f9cb4;
}

@keyframes packet-route {
  0% { left: 12%; opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { left: 87%; opacity: 0; }
}

@media (max-width: 680px) {
  .request-flow__steps {
    padding-right: 12px;
    padding-left: 12px;
  }

  .request-flow__label {
    font-size: 9px;
  }

  .request-flow__detail {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .request-flow__packet {
    left: 86%;
    animation: none;
  }
}
</style>
