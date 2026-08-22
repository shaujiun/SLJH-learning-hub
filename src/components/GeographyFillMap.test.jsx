import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import GeographyFillMap from './GeographyFillMap.jsx'

const originalWindow = globalThis.window

afterEach(() => {
  globalThis.window = originalWindow
})

describe('GeographyFillMap', () => {
  it('先顯示正式課本章節，再顯示目前章節的主題與練習方式', () => {
    globalThis.window = {
      location: new URL('http://127.0.0.1:4173/?geography=maps'),
      scrollTo: () => {},
    }

    const html = renderToString(<GeographyFillMap />)

    expect(html).toContain('地理填圖學習系統')
    expect(html).toContain('臺灣地理')
    expect(html).toContain('中國地理')
    expect(html).toContain('世界地理')
    expect(html).toContain('八上第 1 章　中國的地形')
    expect(html).toContain('八上第 2 章　中國的氣候')
    expect(html).not.toContain('八上第 3 章　中國的傳統農業區')
    expect(html).toContain('地勢三級階梯')
    expect(html).toContain('行政區填圖')
    expect(html).toContain('地形與山脈')
    expect(html).not.toContain('<em>翰林八上 L03</em>')
    expect(html).toContain('看名稱找位置')
    expect(html).toContain('看位置選名稱')
    expect(html).toContain('標籤填圖')
    expect(html).toContain('混合挑戰')
    expect(html).toContain('返回任務頁')
    expect(html).toContain('返回聯絡簿')
  })
})
