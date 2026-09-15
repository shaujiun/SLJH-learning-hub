import { describe, expect, it } from 'vitest'
import { validateRadicalEquation } from './radicalEquation.js'

const cards = [
  { id: 'a', coefficient: 1, radicand: 2 },
  { id: 'b', coefficient: 1, radicand: 8 },
  { id: 'c', coefficient: 3, radicand: 2 },
]
const card = (cardId) => ({ type: 'card', cardId })
const operation = (operator, left, right) => ({ type: 'operation', operator, left, right })

describe('根式等式檢查', () => {
  it('接受每張牌恰好使用一次的正確等式', () => {
    const result = validateRadicalEquation({
      selectedCardIds: ['a', 'b', 'c'],
      left: operation('+', card('a'), card('b')),
      right: card('c'),
      cards,
    })
    expect(result.valid).toBe(true)
  })

  it('拒絕選取後未使用的牌', () => {
    const result = validateRadicalEquation({
      selectedCardIds: ['a', 'b', 'c'],
      left: card('a'),
      right: card('b'),
      cards,
    })
    expect(result).toMatchObject({ valid: false, reason: '所有選取的牌都必須在等式中使用 1 次。' })
  })

  it('拒絕同一張牌重複出現在等式', () => {
    const result = validateRadicalEquation({
      selectedCardIds: ['a', 'b', 'c'],
      left: operation('+', card('a'), card('a')),
      right: card('b'),
      cards,
    })
    expect(result).toMatchObject({ valid: false, reason: '同一張牌在等式中只能使用 1 次。' })
  })

  it('n 系列牌尚未輸入 n 值時不直接判分', () => {
    const variableCards = [
      { id: 'a', variableCode: 'n', radicand: 2 },
      { id: 'b', coefficient: 1, radicand: 8 },
      { id: 'c', coefficient: 1, radicand: 2 },
    ]
    const result = validateRadicalEquation({
      selectedCardIds: ['a', 'b', 'c'],
      left: operation('+', card('a'), card('c')),
      right: card('b'),
      cards: variableCards,
    })
    expect(result).toMatchObject({
      valid: false,
      reason: '使用 n 系列牌時，每張牌的 n 必須分別輸入 1～9。',
    })
  })

  it('允許每張 n 系列牌分別使用正整數', () => {
    const variableCards = [
      { id: 'a', variableCode: 'n', radicand: 2 },
      { id: 'b', coefficient: 1, radicand: 8 },
      { id: 'c', coefficient: 1, radicand: 2 },
    ]
    const result = validateRadicalEquation({
      selectedCardIds: ['a', 'b', 'c'],
      left: operation('+', card('a'), card('c')),
      right: card('b'),
      cards: variableCards,
      variableValues: { a: 1 },
    })
    expect(result).toMatchObject({ valid: true })
  })

  it('n 值不能為 0、負數或小數', () => {
    const variableCards = [
      { id: 'a', variableCode: 'n', radicand: 2 },
      { id: 'b', coefficient: 1, radicand: 8 },
      { id: 'c', coefficient: 1, radicand: 2 },
    ]
    for (const invalidValue of [0, -2, 1.5]) {
      const result = validateRadicalEquation({
        selectedCardIds: ['a', 'b', 'c'], left: operation('+', card('a'), card('c')),
        right: card('b'), cards: variableCards,
        variableValues: { a: invalidValue },
      })
      expect(result).toMatchObject({ valid: false, reason: '使用 n 系列牌時，每張牌的 n 必須分別輸入 1～9。' })
    }
  })

  it('精確計算根式的乘法與除法', () => {
    const exactCards = [
      { id: 'two', coefficient: 1, radicand: 2 },
      { id: 'eight', coefficient: 1, radicand: 8 },
      { id: 'four', coefficient: 1, radicand: 4 },
    ]
    const exact = validateRadicalEquation({ selectedCardIds: ['two', 'eight', 'four'],
      left: operation('/', card('eight'), card('two')), right: card('four'),
      cards: exactCards })
    expect(exact.valid).toBe(true)
    const multiply = validateRadicalEquation({ selectedCardIds: ['two', 'eight', 'four'],
      left: operation('*', card('two'), card('eight')), right: card('four'), cards: exactCards })
    expect(multiply.valid).toBe(false)
  })

  it('同一等式中的 n 牌可各自填不同的 1～9', () => {
    const variableCards = [
      { id: 'left', variableCode: 'n', radicand: 2 },
      { id: 'middle', coefficient: 1, radicand: 2 },
      { id: 'right', variableCode: 'n', radicand: 2 },
    ]
    const result = validateRadicalEquation({
      selectedCardIds: ['left', 'middle', 'right'],
      left: operation('+', card('left'), card('middle')),
      right: card('right'), cards: variableCards,
      variableValues: { left: 3, right: 4 },
    })
    expect(result.valid).toBe(true)
  })
})
