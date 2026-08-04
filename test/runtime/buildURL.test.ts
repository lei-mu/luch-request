import { describe, expect, it } from 'vitest'

import {
  buildURL,
  combineURLs
} from '../../src/helpers/buildURL'

describe('buildURL', () => {
  it('支持数组、日期和嵌套对象', () => {
    const url = buildURL(
      '/users#section',
      {
        tags: ['a b', 'c'],
        createdAt: new Date('2026-07-28T00:00:00.000Z'),
        filter: {
          active: true
        },
        empty: null,
        ignored: undefined
      }
    )

    expect(url).toBe(
      '/users?tags[]=a+b&tags[]=c' +
      '&createdAt=2026-07-28T00:00:00.000Z' +
      '&filter=%7B%22active%22:true%7D'
    )
  })

  it('尊重自定义 serializer 并移除多余问号', () => {
    const url = buildURL(
      '/users?lang=zh',
      {
        page: 1
      },
      () => '?cursor=next'
    )

    expect(url).toBe('/users?lang=zh&cursor=next')
  })

  it('不会把绝对或协议相对 URL 与 baseURL 拼接', () => {
    expect(
      combineURLs('https://api.example.com', 'https://cdn.example.com/a')
    ).toBe('https://cdn.example.com/a')
    expect(
      combineURLs('https://api.example.com', '//cdn.example.com/a')
    ).toBe('//cdn.example.com/a')
  })
})
