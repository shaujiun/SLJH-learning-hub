import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GeographyDetective from './GeographyDetective.jsx'

describe('地理偵探社入口', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: new URL('http://127.0.0.1:4173/?geography=detective'),
      localStorage: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
      scrollTo: vi.fn(),
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('顯示範圍、題數與三階段提示規則', () => {
    const html = renderToString(<GeographyDetective />)
    expect(html).toContain('地理偵探社')
    expect(html).toContain('八上第 1 章')
    expect(html).toContain('八上第 2 章')
    expect(html).toContain('混合挑戰')
    expect(html).toContain('每回合 10 題')
    expect(html).toContain('第 2 次答錯才給提示')
    expect(html).toContain('返回任務頁')
    expect(html).toContain('返回聯絡簿')
  })
})
