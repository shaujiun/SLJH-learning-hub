import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChemicalFormulaOutpost from './ChemicalFormulaOutpost.jsx'

describe('化學事前哨站入口', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: new URL('http://127.0.0.1:4173/?game=chemical-formula'),
      localStorage: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      scrollTo: vi.fn(),
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('顯示正確名稱、課程範圍與三種訓練模式', () => {
    const html = renderToString(<ChemicalFormulaOutpost />)
    expect(html).toContain('化學事前哨站')
    expect(html).toContain('八上第 6 章起適用')
    expect(html).toContain('電子偵查站')
    expect(html).toContain('根離子辨識站')
    expect(html).toContain('化學式組裝站')
    expect(html).toContain('每回合 5 個案件')
    expect(html).toContain('返回任務頁')
    expect(html).toContain('返回聯絡簿')
  })
})
