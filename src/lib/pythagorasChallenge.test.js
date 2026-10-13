import { describe, expect, it } from 'vitest'
import {
  calculatePythagorasTriangleSize,
  createPythagorasDeck,
  isPythagorasAnswerCorrect,
  parsePythagorasAnswer,
  pythagorasValueNumber,
  questionSatisfiesPythagoreanTheorem,
} from './pythagorasChallenge.js'

function seededRandom(seed = 123456789) {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 4294967296
  }
}

describe('畢氏定理挑戰賽題目生成', () => {
  it('每副題組的求斜邊與求股長數量接近一比一', () => {
    for (const group of ['A', 'B']) {
      const deck = createPythagorasDeck(group, 40, seededRandom(group === 'A' ? 11 : 22))
      const hypotenuseCount = deck.filter((question) => question.kind === 'hypotenuse').length
      expect(Math.abs(hypotenuseCount - (deck.length - hypotenuseCount))).toBeLessThanOrEqual(2)
    }
  })

  it('B 組限制整數邊長不超過 30，顯示的根號內不超過 100', () => {
    const deck = createPythagorasDeck('B', 500, seededRandom(33))
    deck.forEach((question) => {
      Object.values(question.exactSides).forEach((value) => {
        if (value.kind === 'integer') expect(value.value).toBeLessThanOrEqual(30)
        else {
          expect(value.coefficient).toBeLessThanOrEqual(30)
          expect(value.radicand).toBeLessThanOrEqual(100)
        }
      })
      expect(questionSatisfiesPythagoreanTheorem(question)).toBe(true)
    })
  })

  it('A 組整數邊長不超過 100，答案的根號內介於 1 到 1000', () => {
    const deck = createPythagorasDeck('A', 500, seededRandom(44))
    expect(deck.some((question) => question.answer.kind === 'radical' && question.answer.radicand > 100)).toBe(true)
    deck.forEach((question) => {
      Object.values(question.exactSides).forEach((value) => {
        if (value.kind === 'integer') expect(value.value).toBeLessThanOrEqual(100)
        else expect(value.coefficient).toBeLessThanOrEqual(100)
      })
      if (question.answer.kind === 'radical') {
        expect(question.answer.radicand).toBeLessThanOrEqual(1000)
      }
      expect(questionSatisfiesPythagoreanTheorem(question)).toBe(true)
    })
  })

  it('B 組特殊邊長關係題占多數', () => {
    const deck = createPythagorasDeck('B', 1000, seededRandom(55))
    const specialCount = deck.filter((question) => question.relation.startsWith('special-')).length
    expect(specialCount / deck.length).toBeGreaterThan(0.5)
  })

  it('所有答案都對應題目的第三邊', () => {
    const deck = createPythagorasDeck('A', 200, seededRandom(66))
    deck.forEach((question) => {
      expect(isPythagorasAnswerCorrect(question.answerText, question)).toBe(true)
      expect(pythagorasValueNumber(question.answer)).toBeGreaterThan(0)
    })
  })
})

describe('畢氏定理答案輸入', () => {
  it('接受整數、小數、根號與根號係數', () => {
    expect(parsePythagorasAnswer('5')).toBe(5)
    expect(parsePythagorasAnswer('√41')).toBeCloseTo(Math.sqrt(41))
    expect(parsePythagorasAnswer('sqrt(41)')).toBeCloseTo(Math.sqrt(41))
    expect(parsePythagorasAnswer('2√3')).toBeCloseTo(2 * Math.sqrt(3))
    expect(parsePythagorasAnswer('2*sqrt(3)')).toBeCloseTo(2 * Math.sqrt(3))
  })

  it('答案為整數時，也接受數值相等的根號表示法', () => {
    const question = createPythagorasDeck('B', 200, seededRandom(77))
      .find((item) => item.answerText === '17')
    expect(question).toBeDefined()
    expect(isPythagorasAnswerCorrect('√289', question)).toBe(true)
  })
})

describe('畢氏定理三角形比例', () => {
  it('一般邊長使用同一縮放倍率維持比例', () => {
    const threeFour = calculatePythagorasTriangleSize(3, 4)
    expect(threeFour.width / threeFour.height).toBeCloseTo(3 / 4)
    expect(threeFour.preservedRatio).toBe(true)

    const equalLegs = calculatePythagorasTriangleSize(12, 12)
    expect(equalLegs.width).toBeCloseTo(equalLegs.height)
  })

  it('極端比例只放大過短邊，避免數字與圖形無法閱讀', () => {
    const extreme = calculatePythagorasTriangleSize(1, 100)
    expect(extreme.width).toBe(48)
    expect(extreme.height).toBeCloseTo(220)
    expect(extreme.preservedRatio).toBe(false)
  })
})
