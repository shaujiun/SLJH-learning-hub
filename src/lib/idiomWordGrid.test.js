import { describe, expect, it } from 'vitest'
import {
  assessIdiomAssignments,
  buildIdiomBoard,
  buildIdiomPuzzle,
  chooseHintCell,
  createIdiomBankTiles,
} from './idiomWordGrid.js'

const entries = [
  { id: 'a', phrase: '一心一意' },
  { id: 'b', phrase: '心平氣和' },
  { id: 'c', phrase: '和氣生財' },
  { id: 'd', phrase: '財源廣進' },
]

describe('成語填字圖核心', () => {
  it('依共同文字排成可變大小的交錯版面', () => {
    const board = buildIdiomBoard(entries)
    expect(board.placements).toHaveLength(4)
    expect(board.cells.some((cell) => cell.isIntersection)).toBe(true)
    expect(board.width).toBeGreaterThan(0)
    expect(board.height).toBeGreaterThan(0)
    expect(board.width === 10 && board.height === 10).toBe(false)
  })

  it('字庫只包含未直接提示的格子且可判斷交換後的錯誤', () => {
    const puzzle = buildIdiomPuzzle(entries, 'beginner')
    const tiles = createIdiomBankTiles(puzzle)
    const assignments = {}
    puzzle.board.cells
      .filter((cell) => !puzzle.givenCellKeys.includes(cell.key))
      .forEach((cell) => {
        assignments[cell.key] = tiles.findIndex((tile, index) => tile.character === cell.solution
          && !Object.values(assignments).includes(index))
      })
    expect(assessIdiomAssignments(puzzle, assignments).correct).toBe(true)
    const keys = Object.keys(assignments)
    if (keys.length > 1) {
      const next = { ...assignments, [keys[0]]: assignments[keys[1]], [keys[1]]: assignments[keys[0]] }
      if (tiles[assignments[keys[0]]].character !== tiles[assignments[keys[1]]].character) {
        expect(assessIdiomAssignments(puzzle, next).correct).toBe(false)
      }
    }
  })

  it('交錯提示優先選取同時屬於兩個成語的空格', () => {
    const puzzle = buildIdiomPuzzle(entries, 'challenge')
    const cell = chooseHintCell(puzzle, {}, [], 'cross')
    expect(cell?.isIntersection).toBe(true)
  })
})
