import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import SchulteShapeGame from './SchulteShapeGame.jsx'

const originalWindow = globalThis.window

afterEach(() => {
  globalThis.window = originalWindow
})

describe('SchulteShapeGame', () => {
  it('顯示圖形入門規則與導覽', () => {
    globalThis.window = {
      location: new URL('http://127.0.0.1:4174/?game=schulte-shape'),
    }

    const html = renderToString(<SchulteShapeGame />)

    expect(html).toContain('圖形舒爾特專注力訓練')
    expect(html).toContain('5 種圖形，每種各 5 個')
    expect(html).toContain('提示格一起點選')
    expect(html).toContain('開始圖形練習')
    expect(html).toContain('返回任務頁')
    expect(html).toContain('返回聯絡簿')
  })
})
