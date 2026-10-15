import { describe, expect, it } from 'vitest'
import {
  atomCountsMatch,
  buildStageOneRound,
  countAtomSymbols,
  describeAtomDifference,
  displayMolecularFormula,
  parseMolecularFormula,
  pointsForAttempt,
  stageOneScore,
} from './chemicalBalance.js'

describe('化學反應平衡站第一關邏輯', () => {
  it('能解析含雙字母元素與右下角數字的分子式', () => {
    expect(parseMolecularFormula('H2O')).toEqual({ H: 2, O: 1 })
    expect(parseMolecularFormula('HCl')).toEqual({ H: 1, Cl: 1 })
    expect(parseMolecularFormula('CO2')).toEqual({ C: 1, O: 2 })
    expect(parseMolecularFormula('2H2O')).toBeNull()
    expect(displayMolecularFormula('H2O2')).toBe('H₂O₂')
  })

  it('比較學生組裝的原子並指出多或少', () => {
    const actual = countAtomSymbols(['H', 'O'])
    expect(atomCountsMatch(actual, { H: 2, O: 1 })).toBe(false)
    expect(describeAtomDifference(actual, { H: 2, O: 1 })).toBe('還少 1 個 H。')
    expect(describeAtomDifference({ H: 3, O: 1 }, { H: 2, O: 1 })).toBe('多了 1 個 H。')
  })

  it('每輪包含組裝、模型辨識與係數概念共 10 題', () => {
    const round = buildStageOneRound(() => 0.42)
    expect(round).toHaveLength(10)
    expect(round.filter((question) => question.mode === 'build')).toHaveLength(4)
    expect(round.filter((question) => question.mode === 'identify')).toHaveLength(4)
    expect(round.filter((question) => question.mode === 'concept')).toHaveLength(2)
  })

  it('依錯誤次數計分並換算百分比', () => {
    expect([0, 1, 2].map(pointsForAttempt)).toEqual([10, 7, 4])
    expect(stageOneScore(87, 10)).toBe(87)
  })
})
