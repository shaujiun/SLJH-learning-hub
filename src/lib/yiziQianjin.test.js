import { describe, expect, it } from 'vitest'
import {
  applyIdiomPlacement,
  arrangeFourSayingsIdioms,
  canPlaceIdiom,
  checkYiziAnswer,
  chooseIdiomAiMove,
  createIdiomBoard,
  findIdiomPlacements,
  localYiziQuestions,
  orderedFourSayingsAnswer,
  scoreFourSayings,
  updateFourSayingsSelection,
  yiziQuestionCounts,
} from './yiziQianjin.js'

describe('yiziQianjin', () => {
  it('保留上游三類題庫數量與多答案判定', () => {
    expect(yiziQuestionCounts()).toEqual({ remove_part: 290, four_sayings: 153, component_pairs: 30 })
    const question = { answers: { accepted: ['甲'], extra: ['乙'] } }
    expect(checkYiziAnswer(question, ' 乙 ')).toBe(true)
    expect(checkYiziAnswer(question, '丙')).toBe(false)
  })

  it('可依難度取得題目並計算四說新語分數', () => {
    expect(localYiziQuestions('four_sayings', 1).length).toBeGreaterThan(0)
    expect(scoreFourSayings({ correct: true, hintUsed: false })).toBe(2)
    expect(scoreFourSayings({ correct: true, hintUsed: true })).toBe(1)
  })

  it('四說新語易級保留順序，中難級打亂，答案依點選順序組合', () => {
    const prompt = { idioms: ['春風化雨', '袖手旁觀', '清風明月', '手舞足蹈'] }
    expect(arrangeFourSayingsIdioms({ difficulty: 1, prompt }, () => 0)).toEqual(prompt.idioms)
    expect(arrangeFourSayingsIdioms({ difficulty: 2, prompt }, () => 0)).not.toEqual(prompt.idioms)
    let state = updateFourSayingsSelection(['', '', '', ''], [], 2, '旁')
    state = updateFourSayingsSelection(state.selected, state.selectionOrder, 0, '袖')
    state = updateFourSayingsSelection(state.selected, state.selectionOrder, 3, '觀')
    state = updateFourSayingsSelection(state.selected, state.selectionOrder, 1, '手')
    expect(orderedFourSayingsAnswer(state.selected, state.selectionOrder)).toBe('旁袖觀手')
  })

  it('只允許四字成語與既有文字交會且不能衝突', () => {
    const board = createIdiomBoard('心')
    expect(canPlaceIdiom(board, '一心一意', 4, 5, 'R')).toBe(true)
    expect(canPlaceIdiom(board, '一心一意', 0, 0, 'R')).toBe(false)
    const next = applyIdiomPlacement(board, '一心一意', 4, 5, 'R')
    expect(next['4:5']).toBe('一')
    expect(next['4:6']).toBe('心')
  })

  it('能找出合法位置並讓 AI 選擇一步', () => {
    const board = createIdiomBoard('心')
    expect(findIdiomPlacements(board, '一心一意').length).toBeGreaterThan(0)
    expect(chooseIdiomAiMove({ board, idioms: ['一心一意'], difficulty: 1, random: () => 0 })).toMatchObject({ phrase: '一心一意' })
  })
})
