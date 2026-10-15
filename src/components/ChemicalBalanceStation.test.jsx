import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChemicalBalanceStation from './ChemicalBalanceStation.jsx'

describe('化學反應平衡站', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: new URL('http://127.0.0.1:4173/?game=chemical-balance&guest=1'),
      localStorage: { getItem: vi.fn(() => null), setItem: vi.fn() },
      scrollTo: vi.fn(),
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('呈現四關路線，且目前只開放分子組裝室', () => {
    const html = renderToStaticMarkup(<ChemicalBalanceStation />)
    expect(html).toContain('化學反應平衡站')
    expect(html).toContain('分子組裝室')
    expect(html).toContain('原子守恆天平')
    expect(html).toContain('係數平衡訓練')
    expect(html).toContain('完整反應式挑戰')
    expect(html).toContain('開始第 1 關')
    expect(html).toContain('右下角數字改變粒子的組成')
    expect(html).toContain('?subject=science&amp;guest=1')
  })
})
