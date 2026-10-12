import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PythagorasChallenge from './PythagorasChallenge.jsx'

describe('畢氏定理挑戰賽介面', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: new URL('http://127.0.0.1:4173/?game=pythagoras-challenge&guest=1'),
      localStorage: { getItem: vi.fn(() => null), setItem: vi.fn() },
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('顯示測驗名稱、設計者、簡潔分組與平方差提醒', () => {
    const html = renderToString(<PythagorasChallenge />)
    expect(html).toContain('畢氏定理挑戰賽')
    expect(html).toContain('測驗類')
    expect(html).toContain('鍾育潤老師設計')
    expect(html).toContain('aria-label="A 組"')
    expect(html).toContain('aria-label="B 組"')
    expect(html).not.toContain('根號內數字不限')
    expect(html).not.toContain('特殊邊長關係題比例較高')
    expect(html).toContain('算其中一股長時，可以用平方差公式，會更快喔！')
  })
})
