import { defineConfig } from 'vitepress'

const v3DocsUrl = 'https://v3.luch-request.quanzhan.co/'

const docBase = process.env.VITE_V4_DOCS_BASE || '/'

export default defineConfig({
  lang: 'zh-CN',
  title: 'luch-request v4',
  description: '面向传统 uni-app 的 TypeScript-first 请求库',
  base: docBase,
  srcExclude: ['README.md'],
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#13213c' }],
    ['meta', { name: 'color-scheme', content: 'light dark' }],
    [
      'script',
      {},
      `var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?c37f4cb010f2219ad896381b96914a65";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();`
    ]
  ],
  themeConfig: {
    logo: {
      light: '/logo.svg',
      dark: '/logo-dark.svg',
      alt: 'luch-request'
    },
    siteTitle: 'luch-request / v4 Alpha',
    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'API', link: '/api/request' },
      { text: '兼容性', link: '/compatibility/' },
      { text: '从 v3 迁移', link: '/migration/v3-to-v4' },
      { text: 'v3 稳定版', link: v3DocsUrl }
    ],
    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '认识 v4 Alpha', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '配置与合并', link: '/guide/configuration' },
            { text: 'TypeScript 设计', link: '/guide/typescript' }
          ]
        }
      ],
      '/api/': [
        {
          text: '核心 API',
          items: [
            { text: '请求与响应', link: '/api/request' },
            { text: '配置选项', link: '/api/config-options' },
            { text: '公共导出', link: '/api/exported-types' },
            { text: 'Interceptor', link: '/api/interceptors' },
            { text: '错误处理', link: '/api/error' },
            { text: '取消与原生 Task', link: '/api/cancellation' },
            { text: '上传与下载', link: '/api/upload-download' }
          ]
        }
      ],
      '/compatibility/': [
        {
          text: '发布边界',
          items: [
            { text: '平台兼容性', link: '/compatibility/' }
          ]
        }
      ],
      '/migration/': [
        {
          text: '版本迁移',
          items: [
            { text: '从 v3 迁移到 v4', link: '/migration/v3-to-v4' }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/lei-mu/luch-request' }
    ],
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    },
    lastUpdated: {
      text: '最后更新'
    },
    footer: {
      message: 'v4 处于 Alpha 阶段，公共 API 仍可能调整。',
      copyright: 'MIT Licensed · luch-request'
    }
  }
})
