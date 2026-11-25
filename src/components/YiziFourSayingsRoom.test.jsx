import { afterEach, describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import YiziFourSayingsRoom from './YiziFourSayingsRoom.jsx'

const originalWindow = globalThis.window
afterEach(() => { globalThis.window = originalWindow })

describe('YiziFourSayingsRoom', () => {
  it('房主可選題數、時間、作答方式、一般或全班房及三種賽制', () => {
    globalThis.window = { localStorage: { getItem: () => null } }
    const html = renderToStaticMarkup(<YiziFourSayingsRoom />)
    for (const text of ['5 題', '10 題', '40 秒', '60 秒', '點選', '鍵盤輸入', '手寫辨識', '最多 8 人', '最多 36 人', '積分賽', '錯 1 題淘汰', '錯 2 題淘汰']) {
      expect(html).toContain(text)
    }
    expect(html).toContain('建立競賽房間')
    expect(html).toContain('加入房間')
    expect(html).toContain('斷線後保留座位 120 秒')
  })
})
