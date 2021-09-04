// import resolve from 'rollup-plugin-node-resolve'
// import babel from 'rollup-plugin-babel'
// import json from 'rollup-plugin-json'
// import commonjs from 'rollup-plugin-commonjs'
// import replace from 'rollup-plugin-replace'
import {eslint} from 'rollup-plugin-eslint'
// import {uglify} from 'rollup-plugin-uglify'
// 配置服务
// import liveServer from 'rollup-plugin-live-server'
import copy from 'rollup-plugin-copy'
// var path = require('path');

const mode = process.env.NODE_ENV
// const isWatch = process.env.ROLLUP_WATCH
// const zip = require('rollup-plugin-zip')

console.log('执行环境：', mode)

// const isProd = mode === 'production'

export default {
  input: 'src/lib/luch-request.js',
  output: {
    file: 'dist/index.js',
    format: 'umd',
    name: 'LuChRequest',
    globals: {},
    sourcemap: true
  },
  external: [],
  plugins: [
    // json(),
    eslint(),
    // replace({
    //   'process.env.NODE_ENV': JSON.stringify(mode)
    // }),
    // resolve(),
    // babel({
    //   runtimeHelpers: true,
    //   exclude       : ['node_modules/**']
    // }),
    // commonjs(),
    // isWatch && liveServer({
    //   port: 3000,
    //   root: 'test',
    //   file: 'index.html',
    //   open: false,
    //   wait: 500
    // }),
    // isProd && uglify({
    //   // comments: ['all'],
    //   output: {
    //     // 最紧凑的输出
    //     // beautify: false,
    //     // 删除所有的注释
    //     // comments: ['all'],
    //   },
    //   warnings: false,
    //   compress: {
    //     // comments: ['all'],
    //     pure_getters: true,
    //     unsafe: true,
    //     unsafe_comps: true,
    //   }
    // })
    copy({
      targets: [
        {src: ['src/lib/utils.js', 'src/lib/core', 'src/lib/helpers', 'src/lib/utils', 'src/lib/adapters'], dest: 'DCloud/luch-request'},
        {src: 'src/lib/luch-request.js', dest: 'DCloud/luch-request', rename: 'index.js'},
        {src: 'src/lib/luch-request.d.ts', dest: 'DCloud/luch-request', rename: 'index.d.ts'},
        {src: ['example/request-demo'], dest: 'DCloud/'},
      ]
    }),
    // zip({
    //   file: 'DCloud/luch-request.zip',
    //   dir: './DCloud/luch-request'
    // })
  ]
}
