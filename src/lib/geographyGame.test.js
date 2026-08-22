import { describe, expect, it } from 'vitest'
import {
  buildGeographyChoices,
  buildGeographyRound,
  geographyDifficultyLabel,
  geographyFeedback,
} from './geographyGame.js'

const items = Array.from({ length: 12 }, (_, index) => ({
  id: `item-${index}`,
  name: `項目 ${index}`,
  hint: `提示 ${index}`,
  reason: `依據 ${index}`,
}))

describe('地理填圖回合', () => {
  it('每回合最多選出 10 個不重複項目', () => {
    const round = buildGeographyRound(items, 10, () => 0.4)
    expect(round).toHaveLength(10)
    expect(new Set(round.map((item) => item.id)).size).toBe(10)
  })

  it('選擇題包含正解及三個干擾選項', () => {
    const choices = buildGeographyChoices(items[0], items, 4, () => 0.3)
    expect(choices).toHaveLength(4)
    expect(choices).toContainEqual(items[0])
  })

  it('依第一次、第二次與第三次錯誤逐步提供訊息', () => {
    expect(geographyFeedback(items[0], 1)).toMatchObject({ level: 'retry', revealAnswer: false })
    expect(geographyFeedback(items[0], 2)).toMatchObject({ level: 'hint', message: '提示 0', revealAnswer: false })
    expect(geographyFeedback(items[0], 3)).toMatchObject({ level: 'answer', revealAnswer: true })
  })

  it('依答對率標示個人練習難度', () => {
    expect(geographyDifficultyLabel(5, 10)).toBe('入門')
    expect(geographyDifficultyLabel(7, 10)).toBe('基礎')
    expect(geographyDifficultyLabel(9, 10)).toBe('進階')
  })
})
