import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AreaChallenge, DuelSkills, areaBoardAspectRatio } from './FactorClash.jsx'
import { areaBoardFor } from '../lib/factorClash.js'

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

  it('天人交戰提供全部擺放按鈕與拖回放置區說明', () => {
    const html = renderToStaticMarkup(<AreaChallenge
      question={{ id: 'area', left: { coefficient: 1, constant: 2 }, right: { coefficient: 1, constant: 3 } }}
      placement={{}}
      setPlacement={() => {}}
      selected=""
      setSelected={() => {}}
    />)
    expect(html).toContain('全部擺放')
    expect(html).toContain('逐一點回或拖回此處')
    expect(html).toContain('aspect-ratio:1')
  })

  it('依棋盤兩軸單位維持 x² 與 1 的正方形比例', () => {
    const squareBoard = areaBoardFor({
      left: { coefficient: 1, constant: 2 },
      right: { coefficient: 1, constant: 3 },
    })
    const wideBoard = areaBoardFor({
      left: { coefficient: 4, constant: 3 },
      right: { coefficient: 1, constant: 5 },
    })

    expect(areaBoardAspectRatio(squareBoard)).toBe(1)
    expect(areaBoardAspectRatio(wideBoard)).toBeCloseTo((4 * 2.2 + 5) / (2.2 + 5))
  })
})
