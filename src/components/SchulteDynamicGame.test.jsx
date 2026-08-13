import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import SchulteDynamicGame from './SchulteDynamicGame.jsx'

const originalWindow = globalThis.window

afterEach(() => {
  globalThis.window = originalWindow
})

describe('SchulteDynamicGame', () => {
  it('顯示三個動態難度、導覽與橫向使用提示', () => {
    globalThis.window = {
      location: new URL('http://127.0.0.1:4174/?game=schulte-dynamic'),
    }

    const html = renderToString(<SchulteDynamicGame />)

    expect(html).toContain('動態舒爾特專注力訓練')
    expect(html).toContain('1～20')
    expect(html).toContain('1～35')
    expect(html).toContain('1～50')
    expect(html).toContain('手機或平板轉成橫向')
    expect(html).toContain('返回任務頁')
    expect(html).toContain('返回聯絡簿')
  })
})
