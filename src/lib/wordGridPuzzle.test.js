import { describe, expect, it } from 'vitest'
import {
  assessWordGridAnswer,
  createBankTiles,
  gridToRows,
  mapRowsToGrid,
  parseCharacterBank,
  restoreAssignments,
  validateWordGridPuzzle,
} from './wordGridPuzzle.js'

const grid = mapRowsToGrid([
  '字.########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
])

describe('填字圖資料與判定', () => {
  it('把文字逐字轉成可重複使用的獨立字卡', () => {
    expect(parseCharacterBank('人人、中')).toEqual(['人', '人', '中'])
    expect(createBankTiles('人人中')).toEqual([
      { id: 0, character: '人' },
      { id: 1, character: '人' },
      { id: 2, character: '中' },
    ])
  })

  it('可在 10 列文字與編輯格之間往返', () => {
    expect(gridToRows(grid)[0]).toBe('字.########')
  })

  it('要求字卡數量與白格數相同', () => {
    expect(validateWordGridPuzzle({ publishedOn: '2026-09-19', grid, characterBank: '人' }).errors).toEqual([])
    expect(validateWordGridPuzzle({ publishedOn: '2026-09-19', grid, characterBank: '人人' }).errors[0])
      .toContain('白格共有 1 格')
  })

  it('沒有解答時只標記練習完成，不假裝判定正確', () => {
    expect(assessWordGridAnswer({ grid, characterBank: '人' }, { 1: 0 })).toEqual({
      status: 'practice-complete', complete: true, correct: null,
    })
  })

  it('有解答時逐格判定', () => {
    const solutionGrid = grid.map((cell, index) => (index === 1 ? { type: 'given', value: '人' } : cell))
    expect(assessWordGridAnswer({ grid, characterBank: '人', solutionGrid }, { 1: 0 }).correct).toBe(true)
  })

  it('還原本機進度時忽略重複字卡與非白格', () => {
    expect(restoreAssignments({ 0: 0, 1: 0, 2: 9 }, grid, '人')).toEqual({ 1: 0 })
  })
})
