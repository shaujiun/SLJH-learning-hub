import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AnimalEquationPractice from './AnimalEquationPractice.jsx'

describe('AnimalEquationPractice 牌桌', () => {
  it('其他玩家沒有手牌背面，而有出牌區與得分區', () => {
    const html = renderToStaticMarkup(<AnimalEquationPractice />)
    expect(html).not.toContain('animal-practice-card-backs')
    expect(html).toContain('只有你看得到自己的手牌')
    expect((html.match(/出牌區/g) || []).length).toBeGreaterThanOrEqual(4)
    expect((html.match(/得分區/g) || []).length).toBeGreaterThanOrEqual(4)
    expect(html).toContain('棄牌 0 張')
  })
})
