import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import SchultePhraseGame from './SchultePhraseGame.jsx'

const originalWindow = globalThis.window

afterEach(() => {
  globalThis.window = originalWindow
})

describe('SchultePhraseGame', () => {
  it('顯示語音、句義、標點與錯誤重來規則', () => {
    globalThis.window = {
      location: new URL('http://127.0.0.1:4174/?game=schulte-phrase'),
    }

    const html = renderToString(<SchultePhraseGame />)

    expect(html).toContain('詩句與名言重組')
    expect(html).toContain('隨機使用語音或句義提示')
    expect(html).toContain('標點符號會自動放回')
    expect(html).toContain('沿用原排列從頭開始')
    expect(html).toContain('返回任務頁')
    expect(html).toContain('返回聯絡簿')
  })
})
