import { describe, expect, it } from 'vitest'
import {
  atomCountsMatch,
  buildStageOneRound,
  collapseRepeatedBonds,
  countAtomSymbols,
  describeAtomDifference,
  describeMoleculeBuild,
  displayMolecularFormula,
  moleculeGraphMatches,
  parseMolecularFormula,
  pointsForAttempt,
  removeMoleculeAtom,
  setMoleculeBond,
  stageOneScore,
} from './chemicalBalance.js'
import { stageOneMolecules } from '../data/chemicalBalance.js'

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

  it('將重複的鍵線轉為單鍵、雙鍵與三鍵', () => {
    expect(collapseRepeatedBonds([[0, 1], [0, 1], [1, 2]])).toEqual([
      { a: 0, b: 1, order: 2 },
      { a: 1, b: 2, order: 1 },
    ])
  })

  it('甲烷必須由碳分別和四顆氫形成單鍵', () => {
    const methane = stageOneMolecules.find((molecule) => molecule.id === 'methane')
    const atoms = methane.model.map((atom, index) => ({ id: `a${index}`, symbol: atom.symbol }))
    const correctBonds = collapseRepeatedBonds(methane.bonds)
    expect(moleculeGraphMatches(atoms, correctBonds, methane)).toBe(true)
    expect(moleculeGraphMatches(atoms, [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 2, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
    ], methane)).toBe(false)
  })

  it('限制典型鍵結數，刪除原子時也清除並重排相關鍵', () => {
    const atoms = [
      { id: 'h1', symbol: 'H' },
      { id: 'c1', symbol: 'C' },
      { id: 'h2', symbol: 'H' },
    ]
    const firstBond = setMoleculeBond(atoms, [], 'h1', 'c1', 1)
    expect(firstBond.ok).toBe(true)
    expect(setMoleculeBond(atoms, firstBond.bonds, 'h1', 'h2', 1).ok).toBe(false)
    expect(removeMoleculeAtom(atoms, [{ a: 1, b: 2, order: 1 }], 'h1')).toEqual({
      atoms: atoms.slice(1),
      bonds: [{ a: 0, b: 1, order: 1 }],
    })
  })

  it('原子數正確但未鍵結時不算完成', () => {
    const water = stageOneMolecules.find((molecule) => molecule.id === 'water')
    const atoms = water.model.map((atom, index) => ({ id: `a${index}`, symbol: atom.symbol }))
    expect(describeMoleculeBuild(atoms, [], water)).toContain('還沒有建立鍵結')
    expect(describeMoleculeBuild(atoms, collapseRepeatedBonds(water.bonds), water)).toContain('都正確')
  })
})
