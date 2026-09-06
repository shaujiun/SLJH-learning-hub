import { describe, expect, it } from 'vitest'
import {
  chemistryIons,
  commonPolyatomicIons,
  ionicCompounds,
  typicalIonElements,
} from '../data/chemicalFormula.js'
import {
  advancedIonClue,
  basicChargeChoices,
  basicTransferChoices,
  buildAdvancedChemistryRound,
  buildAdvancedSteps,
  buildFormulaTiles,
  buildPolyatomicRound,
  correctFormulaTokens,
  displayCompoundFormula,
  displayIonFormula,
  evaluateChemistryStep,
  isChemicalFormulaCorrect,
} from './chemicalFormula.js'

describe('化學事前哨站遊戲邏輯', () => {
  it('基礎模式的得失電子與電荷選項都包含答案', () => {
    typicalIonElements.forEach((element) => {
      const transferChoices = basicTransferChoices(element, () => 0.4)
      const chargeChoices = basicChargeChoices(element, () => 0.4)
      expect(transferChoices).toHaveLength(4)
      expect(transferChoices.map((choice) => choice.value)).toContain(`${element.transfer}-${element.transferCount}`)
      expect(chargeChoices.map((choice) => choice.value)).toContain(String(element.charge))
    })
  })

  it('一般模式每回合十題並涵蓋八種根離子', () => {
    const round = buildPolyatomicRound(commonPolyatomicIons, 10, () => 0.37)
    expect(round).toHaveLength(10)
    expect(new Set(round.map((question) => question.ion.id)).size).toBe(8)
    expect(new Set(round.map((question) => question.id)).size).toBe(10)
  })

  it('進階模式由大題庫抽五種化合物，每種有四個引導步驟', () => {
    const round = buildAdvancedChemistryRound(ionicCompounds, 5, () => 0.23)
    expect(round).toHaveLength(5)
    expect(new Set(round.map((compound) => compound.id)).size).toBe(5)
    round.forEach((compound) => {
      const steps = buildAdvancedSteps(compound, chemistryIons, () => 0.32)
      expect(steps).toHaveLength(4)
      steps.filter((step) => !step.formula).forEach((step) => {
        expect(step.choices).toHaveLength(4)
        expect(step.choices.map((choice) => choice.value)).toContain(step.answer)
      })
    })
  })

  it('一般數字與下標數字都可判定為相同化學式', () => {
    expect(isChemicalFormulaCorrect('Ca(OH)2', 'Ca(OH)2')).toBe(true)
    expect(isChemicalFormulaCorrect('Ca(OH)₂', 'Ca(OH)2')).toBe(true)
    expect(isChemicalFormulaCorrect('Al₂(SO₄)₃', 'Al2(SO4)3')).toBe(true)
    expect(isChemicalFormulaCorrect('CaOH2', 'Ca(OH)2')).toBe(false)
    expect(displayCompoundFormula('Al2(SO4)3')).toBe('Al₂(SO₄)₃')
    expect(displayIonFormula(commonPolyatomicIons.find((ion) => ion.id === 'sulfate'))).toBe('SO₄²⁻')
  })

  it('化學式積木包含正確順序、括號、下標與干擾用一般數字', () => {
    const compound = ionicCompounds.find((item) => item.id === 'aluminum-sulfate')
    expect(correctFormulaTokens(compound)).toEqual(['Al', '₂', '(', 'SO₄', ')', '₃'])
    const labels = buildFormulaTiles(compound, chemistryIons, () => 0.4).map((tile) => tile.label)
    expect(labels).toEqual(expect.arrayContaining(['Al', '₂', '(', 'SO₄', ')', '₃', '2', '3']))
  })

  it('進階第 2 步只顯示離子符號，第 3 步才顯示電荷', () => {
    const compound = ionicCompounds.find((item) => item.id === 'sodium-nitrate')
    expect(advancedIonClue(compound, 'ions')).toBeNull()
    expect(advancedIonClue(compound, 'charges')).toEqual({
      caption: '已找出的離子符號',
      cation: 'Na',
      anion: 'NO₃',
    })
    expect(advancedIonClue(compound, 'counts')).toEqual({
      caption: '離子符號與電荷',
      cation: 'Na⁺',
      anion: 'NO₃⁻',
    })
  })

  it('第一次答錯只提醒，第二次提示，第三次顯示解析', () => {
    const input = { answer: 'wrong', expected: 'right', hint: '提示內容', explanation: '完整解析' }
    expect(evaluateChemistryStep({ ...input, previousMistakes: 0 })).toMatchObject({ resolved: false, mistakeCount: 1 })
    expect(evaluateChemistryStep({ ...input, previousMistakes: 1 })).toMatchObject({ resolved: false, mistakeCount: 2, message: '提示內容' })
    expect(evaluateChemistryStep({ ...input, previousMistakes: 2 })).toMatchObject({ resolved: true, mistakeCount: 3, points: 0 })
    expect(evaluateChemistryStep({ ...input, answer: 'right', previousMistakes: 0 })).toMatchObject({ resolved: true, correct: true, points: 10 })
  })
})
