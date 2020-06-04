module.exports = {
  locales: {
    '/': {
      lang: 'zh-CN',
      title: 'luch-request',
      description: '基于Promise实现uni-app request 请求插件'
    }
  },
  base: '/luch-request/',
  title: 'luch-request',
  description: '基于Promise实现uni-app request 请求插件',
  head: [
    ['meta', {'http-equiv': 'X-UA-Compatible', content: 'IE=Edge'}],
    ['meta', {'name': 'renderer', content: 'webkit'}],
    ['meta', {'name': 'author', content: 'luch'}],
    ['meta', {'name': 'keywords', content: 'luch,luch-requst,luch-request官网,luch的个人博客,uni-app,request插件'}],
    ['script', {}, `
            var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?7b23607ef1c743909207973e8e7eae6d";
    var s = document.getElementsByTagName("script")[0]; 
    s.parentNode.insertBefore(hm, s);
        `]
  ],
  themeConfig: {
    // 假定是 GitHub. 同时也可以是一个完整的 GitLab URL
    repo: 'https://github.com/lei-mu/luch-request',
    // 自定义仓库链接文字。默认从 `themeConfig.repo` 中自动推断为
    // "GitHub"/"GitLab"/"Bitbucket" 其中之一，或是 "Source"。
    // repoLabel: '查看源码',

    // 以下为可选的编辑链接选项
    // 假如文档不是放在仓库的根目录下：
    docsDir: 'docs',
    // 假如文档放在一个特定的分支下：
    docsBranch: 'docs',
    // 默认是 false, 设置为 true 来启用
    editLinks: true,
    // 默认为 "Edit this page"
    editLinkText: '帮助我改善此页面！',
    nav: [
      {text: '首页', link: '/'},
      {
        text: '文档',
        ariaLabel: '文档',
        items: [
          {text: '3.x文档', link: '/guide/3.x/'},
          {text: '2.x文档', link: '/guide/2.x/'},
        ]
      },
      {text: '常见问题', link: '/issue/'},
      {text: '更新记录', link: 'https://github.com/lei-mu/luch-request/releases', target: '_blank'},
      {
        text: '相关资源',
        ariaLabel: '相关资源',
        items: [
          {text: '相关文章', link: '/resources/article'}
        ]
      },
      {text: '鸣谢', link: '/acknowledgement/'},
      {
        text: 'DCloud',
        ariaLabel: 'DCloud',
        items: [
          {text: '插件市场', link: 'https://ext.dcloud.net.cn/plugin?id=392', target: '_blank'},
          {text: '社区', link: 'https://ask.dcloud.net.cn/question/74922', target: '_blank'}
        ]
      }
    ],
    lastUpdated: 'Last Updated',
  },
  plugins: [
    ['@vuepress/pwa',{
      serviceWorker: true,
      updatePopup: {
        message: '此文档有新的内容', // defaults to 'New content is available.'
        buttonText: '更新' // defaults to 'Refresh'
      }
    }],
    '@vuepress/active-header-links'
  ],
  smoothScroll: true
}
