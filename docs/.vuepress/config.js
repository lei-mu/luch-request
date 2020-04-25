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
 ['script', {}, `
            var hm = document.createElement("script");
    hm.src = "https://hm.baidu.com/hm.js?7b23607ef1c743909207973e8e7eae6d";
    var s = document.getElementsByTagName("script")[0]; 
    s.parentNode.insertBefore(hm, s);
        `]
  ],
  themeConfig: {
    nav: [
      {text: 'Home', link: '/'},
      {text: 'Guide', link: '/guide/'},
      {text: 'Github', link: 'https://github.com/lei-mu/luch-request'}
    ]
  }
}
