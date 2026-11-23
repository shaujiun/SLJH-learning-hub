import { afterEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import YiziFourSayingsRoom from './YiziFourSayingsRoom.jsx'

const originalWindow = globalThis.window
afterEach(() => { globalThis.window = originalWindow })

describe('YiziFourSayingsRoom', () => {
  it('房主可選 5 或 10 題、40 或 60 秒及三種作答方式', () => {
    globalThis.window = { localStorage: { getItem: () => null } }
    const html = renderToStaticMarkup(<YiziFourSayingsRoom />)
    for (const text of ['5 題', '10 題', '40 秒', '60 秒', '點選', '鍵盤輸入', '手寫辨識']) {
      expect(html).toContain(text)
    }
    expect(html).toContain('建立競賽房間')
    expect(html).toContain('加入房間')
  })
})
