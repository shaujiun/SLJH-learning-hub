import { describe, expect, it } from 'vitest'
import {
  assessNewsCrosswordAnswer,
  chineseClueNumbers,
  createEmptyNewsCrosswordClues,
  createEmptyNewsCrosswordGrid,
  newsCrosswordCellTypes,
  newsCrosswordDirections,
  normalizeNewsCrosswordBlockFruits,
  validateNewsCrosswordPuzzle,
} from './newsCrossword.js'

function createPuzzle() {
  const grid = createEmptyNewsCrosswordGrid()
  grid[63] = { type: newsCrosswordCellTypes.block, value: '' }
  const solutionGrid = grid.map((cell) => cell.type === newsCrosswordCellTypes.block
    ? cell
    : { type: newsCrosswordCellTypes.given, value: '甲' })
  const acrossClues = createEmptyNewsCrosswordClues(newsCrosswordDirections.across)
    .map((clue, index) => ({ ...clue, row: index, col: 0, text: `橫式提示 ${index + 1}` }))
  const downClues = createEmptyNewsCrosswordClues(newsCrosswordDirections.down)
    .map((clue, index) => ({ ...clue, row: 0, col: index, text: `直式提示 ${index + 1}` }))
  return { publishedOn: '2026-11-11', status: 'published', grid, solutionGrid, acrossClues, downClues }
}

describe('新聞縱橫填字規則', () => {
  it('只為阻隔格保留管理者選定的水果，未設定時提供固定預設值', () => {
    const grid = createEmptyNewsCrosswordGrid()
    grid[2] = { type: newsCrosswordCellTypes.block, value: '' }
    grid[5] = { type: newsCrosswordCellTypes.block, value: '' }
    expect(normalizeNewsCrosswordBlockFruits({ 2: 'pineapple', 5: 'unknown', 8: 'apple' }, grid)).toEqual({
      2: 'pineapple',
      5: 'strawberry',
    })
  })

  it('橫式使用國字題號，直式使用阿拉伯數字', () => {
    expect(chineseClueNumbers).toEqual(['一', '二', '三', '四', '五', '六', '七', '八'])
  })

  it('發布時驗證 8 組橫式與 8 組直式提示', () => {
    const puzzle = createPuzzle()
    expect(validateNewsCrosswordPuzzle(puzzle).errors).toEqual([])
    puzzle.acrossClues[0].text = ''
    expect(validateNewsCrosswordPuzzle(puzzle).errors).toContain('橫式 一 尚未填寫提示。')
  })

  it('同一格可同時作為橫式與直式起點', () => {
    const puzzle = createPuzzle()
    puzzle.acrossClues[0] = { ...puzzle.acrossClues[0], row: 0, col: 0 }
    puzzle.downClues[0] = { ...puzzle.downClues[0], row: 0, col: 0 }
    expect(validateNewsCrosswordPuzzle(puzzle).errors).toEqual([])
  })

  it('只回報錯誤格，不直接提供答案', () => {
    const puzzle = createPuzzle()
    const answers = Object.fromEntries(
      puzzle.grid.map((cell, index) => [index, cell.type === newsCrosswordCellTypes.block ? '' : '甲']),
    )
    answers[10] = '乙'
    const result = assessNewsCrosswordAnswer(puzzle, answers)
    expect(result.correct).toBe(false)
    expect(result.incorrectIndexes).toEqual([10])
    expect(result).not.toHaveProperty('solution')
  })
})
