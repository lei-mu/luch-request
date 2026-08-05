<template>
  <aside class="v4-alpha-banner" role="status">
    <span class="v4-alpha-banner__message v4-alpha-banner__message--desktop">
      luch-request v4 Alpha 已发布，欢迎开发者体验并反馈
    </span>
    <span class="v4-alpha-banner__message v4-alpha-banner__message--mobile">
      v4 Alpha 已发布
    </span>
    <a
      class="v4-alpha-banner__link"
      href="https://luch-request.quanzhan.co/"
      target="_blank"
      rel="noopener noreferrer"
    >
      查看 v4 文档 <span aria-hidden="true">→</span>
    </a>
  </aside>
</template>

<script>
export default {
  name: 'V4AlphaBanner'
}
</script>

<style lang="stylus" scoped>
.v4-alpha-banner
  position fixed
  z-index 19
  top 0
  right 0
  left 0
  box-sizing border-box
  display flex
  align-items center
  justify-content center
  gap .75rem
  height 2.5rem
  padding 0 1rem
  border-bottom 1px solid #b8d8cc
  background #edf8f4
  color #29473d
  font-size .9rem
  line-height 1.2

  &__message--mobile
    display none

  &__link
    color #16825d
    font-weight 600
    white-space nowrap

    &:hover
      text-decoration underline

@media (max-width: 719px)
  .v4-alpha-banner
    justify-content space-between
    gap .5rem
    padding 0 .75rem
    font-size .85rem

    &__message--desktop
      display none

    &__message--mobile
      display inline
</style>
