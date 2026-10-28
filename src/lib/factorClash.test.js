import { describe, expect, it } from 'vitest'
import {
  adaptiveQuestionAt, areaBoardFor, areaPiecesFor, createAdaptiveQuestionSet, createFactorQuestion, expandFactors,
  factorChallengeDifficulty, factorChallengeSeconds, factorClashHint, factorQuestionSeconds, formatExpandedExpression, formatFactoredExpression,
  gcd, pointsForSubmission, validateAreaPlacement, validateCrossAnswer,
} from './factorClash.js'

function sequenceRandom(values) {
  let index = 0
  return () => values[index++ % values.length]
}

describe('因式交鋒數學核心', () => {
  it('正確展開並使用學生熟悉的算式格式', () => {
    const expanded = expandFactors({ coefficient: 2, constant: 1 }, { coefficient: 1, constant: 2 })
    expect(expanded).toEqual({ quadratic: 2, linear: 5, constant: 2 })
    expect(formatExpandedExpression(expanded)).toBe('2x² ＋ 5x ＋ 2')
    expect(formatFactoredExpression({ coefficient: 2, constant: 1 }, { coefficient: 1, constant: -2 }))
      .toBe('(2x ＋ 1)(x − 2)')
  })

  it('基礎天人交戰只產生 1 到 5 的正數因式', () => {
    const question = createFactorQuestion({ mode: 'area', difficulty: 'basic', random: sequenceRandom([0, .99, .2]) })
    expect(question.left).toEqual({ coefficient: 1, constant: 1 })
    expect(question.right).toEqual({ coefficient: 1, constant: 5 })
    expect(question.seconds).toBe(120)
  })

  it('進階時間依操作量區分', () => {
    expect(factorQuestionSeconds('area', 'advanced')).toBe(240)
    expect(factorQuestionSeconds('cross', 'advanced')).toBe(180)
    expect(factorQuestionSeconds('cross', 'basic')).toBe(120)
  })

  it('雙人平衡題庫每題準備 5 個挑戰層級，並依目前層級取題', () => {
    const questions = createAdaptiveQuestionSet({ mode: 'cross', count: 3 })
    expect(questions).toHaveLength(3)
    expect(questions.every((entry) => entry.variants.length === 5)).toBe(true)
    expect(questions[0].variants.map((question) => question.challengeTier)).toEqual([1, 2, 3, 4, 5])
    expect(adaptiveQuestionAt(questions, 0, 5).challengeTier).toBe(5)
    expect(factorChallengeDifficulty(2)).toBe('basic')
    expect(factorChallengeDifficulty(3)).toBe('advanced')
    expect(factorChallengeSeconds('area', 5)).toBe(240)
    expect(factorChallengeSeconds('cross', 3)).toBe(150)
  })

  it('提示鏡依玩法提供面積板數量或十字交乘方向', () => {
    const area = createFactorQuestion({ mode: 'area', challengeTier: 1, random: sequenceRandom([0, .5, .2]) })
    const cross = createFactorQuestion({ mode: 'cross', challengeTier: 2, random: sequenceRandom([0, .2, .7, .3]) })
    expect(factorClashHint(area)).toContain('這題需要 x²')
    expect(factorClashHint(area)).toContain('橫躺 x')
    expect(factorClashHint(cross)).toContain('交叉相乘後合併')
  })

  it('進階因式保持完全分解，4x 的常數不超過 3', () => {
    for (let index = 0; index < 80; index += 1) {
      const question = createFactorQuestion({ mode: 'area', difficulty: 'advanced' })
      expect([2, 3, 4]).toContain(question.expanded.quadratic)
      expect(gcd(question.left.coefficient, question.left.constant)).toBe(1)
      expect(gcd(question.right.coefficient, question.right.constant)).toBe(1)
      if (question.left.coefficient === 4) expect(question.left.constant).toBeLessThanOrEqual(3)
      if (question.right.coefficient === 4) expect(question.right.constant).toBeLessThanOrEqual(3)
    }
  })

  it('基礎面積棋盤固定為 (x＋5)(x＋5)，學生只使用題目需要的面積板', () => {
    const question = {
      id: 'basic', left: { coefficient: 1, constant: 2 }, right: { coefficient: 1, constant: 3 },
    }
    const board = areaBoardFor(question)
    expect(board.frameText).toBe('(x ＋ 5)(x ＋ 5)')
    expect(board.slots.filter((slot) => slot.type === 'x2')).toHaveLength(1)
    expect(board.slots.filter((slot) => slot.type === 'x' && slot.orientation === 'vertical')).toHaveLength(5)
    expect(board.slots.filter((slot) => slot.type === 'x' && slot.orientation === 'horizontal')).toHaveLength(5)
    expect(board.slots.filter((slot) => slot.type === 'one')).toHaveLength(25)
    expect(board.slots.filter((slot) => slot.required)).toHaveLength(12)
    expect(areaPiecesFor(question, () => .5)).toHaveLength(36)
  })

  it('進階面積棋盤把 x 面積板維持在 5 的倍數階梯', () => {
    const question = {
      id: 'q', left: { coefficient: 2, constant: 1 }, right: { coefficient: 1, constant: 2 },
    }
    const board = areaBoardFor(question)
    expect(board.frameText).toBe('(2x ＋ 5)(x ＋ 5)')
    expect(board.columns).toHaveLength(7)
    expect(board.rows).toHaveLength(6)
    expect(board.slots.filter((slot) => slot.type === 'x2')).toHaveLength(2)
    expect(board.slots.filter((slot) => slot.type === 'x' && slot.orientation === 'vertical')).toHaveLength(5)
    expect(board.slots.filter((slot) => slot.type === 'x' && slot.orientation === 'horizontal')).toHaveLength(10)
    expect(board.slots.filter((slot) => slot.type === 'one')).toHaveLength(25)
    const pieces = areaPiecesFor({ ...question, id: 'q' }, () => .5)
    const unused = [...pieces]
    const placement = Object.fromEntries(board.slots.filter((slot) => slot.required).map((slot) => {
      const pieceIndex = unused.findIndex((piece) => piece.type === slot.type && piece.orientation === slot.orientation)
      return [slot.id, unused.splice(pieceIndex, 1)[0]]
    }))
    expect(validateAreaPlacement(question, placement)).toBe(true)
    const optionalSlot = board.slots.find((slot) => !slot.required)
    expect(validateAreaPlacement(question, { ...placement, [optionalSlot.id]: { type: optionalSlot.type, orientation: optionalSlot.orientation } })).toBe(false)
  })

  it('十字交戰接受交換律，但拒絕未完全分解的形式', () => {
    const question = {
      expanded: { quadratic: 2, linear: 5, constant: 2 },
      left: { coefficient: 2, constant: 1 }, right: { coefficient: 1, constant: 2 },
    }
    expect(validateCrossAnswer(question, {
      firstCoefficient: 1, firstConstant: 2, secondCoefficient: 2, secondConstant: 1,
    })).toBe(true)
    expect(validateCrossAnswer(question, {
      firstCoefficient: 2, firstConstant: 2, secondCoefficient: 1, secondConstant: 1,
    })).toBe(false)
  })

  it('依兩次作答規則給分', () => {
    expect(pointsForSubmission(1, true)).toBe(3)
    expect(pointsForSubmission(2, true)).toBe(1)
    expect(pointsForSubmission(1, false)).toBe(0)
  })
})
