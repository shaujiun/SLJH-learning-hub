import { describe, expect, it } from 'vitest'
import {
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

  it('A 組整數邊長不超過 100，並確實會出現根號內超過 100 的題目', () => {
    const deck = createPythagorasDeck('A', 500, seededRandom(44))
    expect(deck.some((question) => question.calculationRadicand > 100)).toBe(true)
    deck.forEach((question) => {
      Object.values(question.exactSides).forEach((value) => {
        if (value.kind === 'integer') expect(value.value).toBeLessThanOrEqual(100)
        else expect(value.coefficient).toBeLessThanOrEqual(100)
      })
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
})
