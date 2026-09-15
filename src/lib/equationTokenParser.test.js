import { describe, expect, it } from 'vitest'
import { equationTokenLabel, parseEquationTokens } from './equationTokenParser.js'

const card = (cardId) => ({ type: 'card', cardId })
const operator = (value) => ({ type: 'operator', value })

describe('根式等式牌片排列', () => {
  it('依先乘除後加減建立算式樹', () => {
    const result = parseEquationTokens([
      card('a'), operator('+'), card('b'), operator('*'), card('c'), { type: 'equals' }, card('d'),
    ])
    expect(result.left).toEqual({
      type: 'operation', operator: '+', left: card('a'),
      right: { type: 'operation', operator: '*', left: card('b'), right: card('c') },
    })
  })

  it('支援括號改變運算順序', () => {
    const result = parseEquationTokens([
      { type: 'paren', value: '(' }, card('a'), operator('+'), card('b'), { type: 'paren', value: ')' },
      operator('*'), card('c'), { type: 'equals' }, card('d'),
    ])
    expect(result.left.left).toEqual({ type: 'operation', operator: '+', left: card('a'), right: card('b') })
  })

  it('缺少等號或運算元時拒絕送出', () => {
    expect(() => parseEquationTokens([card('a'), operator('+'), card('b')])).toThrow('equals_required')
    expect(() => parseEquationTokens([card('a'), operator('+'), { type: 'equals' }, card('b')])).toThrow('missing_operand')
  })

  it('顯示每張牌各自代入的 n 值', () => {
    const cards = new Map([['a', { id: 'a', label: 'n√2', variableCode: 'n' }]])
    expect(equationTokenLabel(card('a'), cards, { a: 3 })).toBe('3√2')
  })
})
