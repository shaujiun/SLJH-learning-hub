import { describe, expect, it } from 'vitest'
import {
  areaBoardFor, areaPiecesFor, createFactorQuestion, expandFactors,
  factorQuestionSeconds, formatExpandedExpression, formatFactoredExpression,
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

  it('面積棋盤依因式動態生成，並驗證每一塊的種類與方向', () => {
    const question = {
      id: 'q', left: { coefficient: 2, constant: 1 }, right: { coefficient: 1, constant: 2 },
    }
    const board = areaBoardFor(question)
    expect(board.columns).toHaveLength(3)
    expect(board.rows).toHaveLength(3)
    expect(board.slots.filter((slot) => slot.type === 'x2')).toHaveLength(2)
    expect(board.slots.filter((slot) => slot.type === 'x')).toHaveLength(5)
    expect(board.slots.filter((slot) => slot.type === 'one')).toHaveLength(2)
    const pieces = areaPiecesFor({ ...question, id: 'q' }, () => .5)
    const placement = Object.fromEntries(board.slots.map((slot) => [slot.id,
      pieces.find((piece) => piece.type === slot.type && piece.orientation === slot.orientation)]))
    expect(validateAreaPlacement(question, placement)).toBe(true)
    expect(validateAreaPlacement(question, { ...placement, [board.slots[0].id]: { type: 'one' } })).toBe(false)
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
