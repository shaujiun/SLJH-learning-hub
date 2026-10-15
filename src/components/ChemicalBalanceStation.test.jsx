import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChemicalBalanceStation, { AtomBuilder } from './ChemicalBalanceStation.jsx'

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

  it('提供可拖曳原子、選擇鍵級與清除鍵結的球棒模型工具', () => {
    const html = renderToStaticMarkup(<AtomBuilder
      atoms={[{ id: 'c1', symbol: 'C', x: 50, y: 50 }]}
      bonds={[]}
      disabled={false}
      tool="bond"
      bondOrder={1}
      activeBondAtom="c1"
      builderMessage="已選第 1 顆原子"
      onAdd={() => {}}
      onMove={() => {}}
      onAtomAction={() => {}}
      onTool={() => {}}
      onClearBonds={() => {}}
      onClear={() => {}}
    />)
    expect(html).toContain('分子模型組裝畫布')
    expect(html).toContain('單鍵')
    expect(html).toContain('雙鍵')
    expect(html).toContain('三鍵')
    expect(html).toContain('只清除鍵結')
    expect(html).toContain('已選第 1 顆原子')
    expect(html).toContain('draggable="true"')
    expect(html).not.toContain('<span>C</span>')
    expect(html).toContain('碳原子')
  })
})
