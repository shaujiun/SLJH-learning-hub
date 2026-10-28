import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { DuelSkills } from './FactorClash.jsx'

describe('因式交鋒平衡對戰介面', () => {
  it('顯示五種技能、能量與落後者免費提示', () => {
    const html = renderToStaticMarkup(<DuelSkills
      self={{ skillEnergy: 2, hintTokens: 1, shieldCount: 0, lastSkillQuestion: 0 }}
      opponent={{ nickname: '對手' }}
      questionNumber={3}
      disabled={false}
      onUse={() => {}}
    />)
    expect(html).toContain('技能能量 2／3')
    expect(html).toContain('提示鏡')
    expect(html).toContain('落後補助・免費')
    expect(html).toContain('延長時間')
    expect(html).toContain('再想一次')
    expect(html).toContain('護盾')
    expect(html).toContain('挑戰升級')
  })

  it('同一題已用技能後停用全部技能', () => {
    const html = renderToStaticMarkup(<DuelSkills
      self={{ skillEnergy: 3, hintTokens: 0, shieldCount: 0, lastSkillQuestion: 4 }}
      opponent={{ nickname: '對手' }}
      questionNumber={4}
      disabled={false}
      onUse={() => {}}
    />)
    expect((html.match(/disabled=""/g) || [])).toHaveLength(5)
  })
})
