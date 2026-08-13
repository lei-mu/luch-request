import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import HomePage from './components/HomePage.vue'
import './style.css'

const theme: Theme = {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout),
  enhanceApp({ app }) {
    app.component('HomePage', HomePage)
  }
}

export default theme
