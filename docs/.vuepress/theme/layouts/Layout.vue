<template>
  <div
    class="v4-docs-layout"
    :class="{'v4-docs-layout--with-navbar': shouldShowNavbar}"
  >
    <ParentLayout />
    <V4AlphaBanner />
  </div>
</template>

<script>
import ParentLayout from '@parent-theme/layouts/Layout.vue'
import V4AlphaBanner from '../../components/V4AlphaBanner.vue'

export default {
  name: 'Layout',
  components: {
    ParentLayout,
    V4AlphaBanner
  },
  computed: {
    shouldShowNavbar () {
      return this.$page.frontmatter.navbar !== false && this.$site.themeConfig.navbar !== false
    }
  }
}
</script>

<style lang="stylus">
$v4BannerHeight = 2.5rem
$navbarHeight = 3.6rem

.v4-docs-layout
  padding-top $v4BannerHeight

  &--with-navbar
    .v4-alpha-banner
      top $navbarHeight

    > .theme-container .sidebar
      top $navbarHeight + $v4BannerHeight
</style>
