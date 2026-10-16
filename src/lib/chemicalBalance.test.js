import { describe, expect, it } from 'vitest'
import {
  atomCountsMatch,
  buildStageFourRound,
  buildStageOneRound,
  buildStageThreeRound,
  buildStageTwoRound,
  collapseRepeatedBonds,
  countAtomSymbols,
  describeAtomDifference,
  describeFormulaSelections,
  describeMoleculeBuild,
  describeFormulaOnlyBalance,
  describeReactionBalance,
  displayMolecularFormula,
  evaluateFormulaSelections,
  evaluateReactionCoefficients,
  initialFormulaSelections,
  initialReactionCoefficients,
  moleculeGraphMatches,
  parseMolecularFormula,
  pointsForAttempt,
  removeMoleculeAtom,
  setMoleculeBond,
  stageOneScore,
} from './chemicalBalance.js'
import { stageFourReactionIds, stageOneMolecules, stageThreeProgression, stageTwoReactions } from '../data/chemicalBalance.js'

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

  it('擴充題庫只使用六種指定元素，且每個分子的模型都能通過結構判定', () => {
    expect(stageOneMolecules).toHaveLength(21)
    const usedElements = new Set(stageOneMolecules.flatMap((molecule) => Object.keys(molecule.atoms)))
    expect([...usedElements].sort()).toEqual(['C', 'Cl', 'H', 'N', 'O', 'S'])
    stageOneMolecules.forEach((molecule) => {
      const atoms = molecule.model.map((atom, index) => ({ id: `a${index}`, symbol: atom.symbol }))
      expect(parseMolecularFormula(molecule.formula), molecule.formula).toEqual(molecule.atoms)
      expect(countAtomSymbols(atoms.map((atom) => atom.symbol)), molecule.formula).toEqual(molecule.atoms)
      const targetBonds = collapseRepeatedBonds(molecule.bonds)
      expect(moleculeGraphMatches(atoms, targetBonds, molecule), molecule.formula).toBe(true)
      const builtBonds = targetBonds.reduce((currentBonds, bond) => {
        const result = setMoleculeBond(atoms, currentBonds, atoms[bond.a].id, atoms[bond.b].id, bond.order)
        expect(result.ok, `${molecule.formula} 無法由學生操作建立`).toBe(true)
        return result.bonds
      }, [])
      expect(moleculeGraphMatches(atoms, builtBonds, molecule), molecule.formula).toBe(true)
    })
  })
})

describe('化學反應平衡站第二關邏輯', () => {
  it('建立七題並補上可顯示的分子模型', () => {
    const round = buildStageTwoRound(() => 0.999)
    expect(round).toHaveLength(7)
    round.forEach((reaction) => {
      ;[...reaction.reactants, ...reaction.products].forEach((term) => {
        expect(term.molecule.id).toBe(term.moleculeId)
        expect(term.molecule.model.length).toBeGreaterThan(0)
      })
    })
  })

  it('能判斷未守恆、已守恆但未約分，以及最簡整數比', () => {
    const water = buildStageTwoRound(() => 0.999).find((reaction) => reaction.id === 'water-formation')
    const initial = evaluateReactionCoefficients(water, initialReactionCoefficients(water))
    const doubled = evaluateReactionCoefficients(water, { reactants: [4, 2], products: [4] })
    const simplest = evaluateReactionCoefficients(water, water.answer)

    expect(initial.balanced).toBe(false)
    expect(describeReactionBalance(initial)).toContain('還沒有守恆')
    expect(doubled.balanced).toBe(true)
    expect(doubled.simplest).toBe(false)
    expect(describeReactionBalance(doubled)).toContain('最簡整數比')
    expect(simplest.simplest).toBe(true)
  })

  it('每一題的參考係數都在操作範圍內且為最簡守恆解', () => {
    const round = buildStageTwoRound(() => 0.999)
    expect(stageTwoReactions).toHaveLength(7)
    round.forEach((reaction) => {
      expect(evaluateReactionCoefficients(reaction, reaction.answer).simplest, reaction.id).toBe(true)
      expect([...reaction.answer.reactants, ...reaction.answer.products].every((value) => value >= 1 && value <= 4), reaction.id).toBe(true)
    })
  })
})

describe('化學反應平衡站第三關邏輯', () => {
  it('依序提供兩題統計輔助、三題檢查後提示與兩題反應式挑戰', () => {
    const round = buildStageThreeRound()
    expect(round).toHaveLength(7)
    expect(stageThreeProgression.map((step) => step.support)).toEqual([
      'live', 'live',
      'after-check', 'after-check', 'after-check',
      'formula-only', 'formula-only',
    ])
    expect(round.map((question) => question.support)).toEqual(stageThreeProgression.map((step) => step.support))
  })

  it('每題都有完整分子資料，且參考答案為最簡守恆解', () => {
    buildStageThreeRound().forEach((reaction) => {
      ;[...reaction.reactants, ...reaction.products].forEach((term) => {
        expect(term.molecule.id).toBe(term.moleculeId)
      })
      expect(evaluateReactionCoefficients(reaction, reaction.answer).simplest, reaction.id).toBe(true)
    })
  })

  it('反應式挑戰只指出未守恆元素，不直接提供左右原子數', () => {
    const methane = buildStageThreeRound().find((reaction) => reaction.id === 'methane-combustion')
    const evaluation = evaluateReactionCoefficients(methane, initialReactionCoefficients(methane))
    const message = describeFormulaOnlyBalance(evaluation)
    expect(message).toContain('尚未守恆的元素')
    expect(message).toContain('H')
    expect(message).not.toMatch(/\d/)
  })
})

describe('化學反應平衡站第四關邏輯', () => {
  it('建立七題完整反應式，每個物質都有三個不重複的化學式選項', () => {
    const round = buildStageFourRound(() => 0.999)
    expect(round).toHaveLength(7)
    expect(round.map((reaction) => reaction.id)).toEqual(stageFourReactionIds)
    round.forEach((reaction) => {
      ;[...reaction.reactants, ...reaction.products].forEach((term) => {
        expect(term.formulaOptions).toHaveLength(3)
        expect(new Set(term.formulaOptions).size).toBe(3)
        expect(term.formulaOptions).toContain(term.molecule.formula)
      })
    })
  })

  it('能分別判斷化學式選擇與係數配平', () => {
    const reaction = buildStageFourRound(() => 0.999)[0]
    const blankEvaluation = evaluateFormulaSelections(reaction, initialFormulaSelections(reaction))
    const correctSelections = {
      reactants: reaction.reactants.map((term) => term.molecule.formula),
      products: reaction.products.map((term) => term.molecule.formula),
    }
    const formulaEvaluation = evaluateFormulaSelections(reaction, correctSelections)

    expect(blankEvaluation.correct).toBe(false)
    expect(describeFormulaSelections(blankEvaluation)).toContain('化學式尚未正確')
    expect(formulaEvaluation).toEqual({ correct: true, incorrectTerms: [] })
    expect(evaluateReactionCoefficients(reaction, reaction.answer).simplest).toBe(true)
  })
})
