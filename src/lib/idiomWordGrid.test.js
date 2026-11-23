import { describe, expect, it } from 'vitest'
import {
  assessIdiomAssignments,
  buildIdiomBoard,
  buildIdiomLevelNavigation,
  buildIdiomPuzzle,
  buildManualIdiomPuzzle,
  chooseHintCell,
  createIdiomBankTiles,
  editorGridFromPuzzle,
  pickPreferredIdiomLevel,
} from './idiomWordGrid.js'

const entries = [
  { id: 'a', phrase: '一心一意' },
  { id: 'b', phrase: '心平氣和' },
  { id: 'c', phrase: '和氣生財' },
  { id: 'd', phrase: '財源廣進' },
]

describe('成語填字圖核心', () => {
  it('依難度建立固定關卡編號，並把已通關題目留在回顧清單', () => {
    const puzzles = [
      { id: 'new', difficulty: 'beginner', createdAt: '2026-11-23T02:00:00Z' },
      { id: 'old', difficulty: 'beginner', createdAt: '2026-11-22T02:00:00Z' },
      { id: 'basic', difficulty: 'basic', createdAt: '2026-11-21T02:00:00Z' },
    ]
    const levels = buildIdiomLevelNavigation(puzzles, ['old'], 'beginner')

    expect(levels.map((level) => level.puzzle.id)).toEqual(['old', 'new'])
    expect(levels.map((level) => level.levelLabel)).toEqual(['入門第 1 關', '入門第 2 關'])
    expect(levels.map((level) => level.completed)).toEqual([true, false])
    expect(pickPreferredIdiomLevel(levels)?.puzzle.id).toBe('new')
  })

  it('該難度全部通關時預設停在最新一關，發布新題後改為新題', () => {
    const completed = [
      { id: 'one', difficulty: 'advanced', createdAt: '2026-11-20T02:00:00Z' },
      { id: 'two', difficulty: 'advanced', createdAt: '2026-11-21T02:00:00Z' },
    ]
    const completedIds = completed.map((puzzle) => puzzle.id)
    expect(pickPreferredIdiomLevel(buildIdiomLevelNavigation(completed, completedIds, 'advanced'))?.puzzle.id).toBe('two')

    const withNewPuzzle = [...completed, { id: 'three', difficulty: 'advanced', createdAt: '2026-11-23T02:00:00Z' }]
    expect(pickPreferredIdiomLevel(buildIdiomLevelNavigation(withNewPuzzle, completedIds, 'advanced'))?.puzzle.id).toBe('three')
  })

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

  it('可將教師手動編輯的黑格、白格、提示字與答案建成題目', () => {
    const generated = buildIdiomPuzzle(entries, 'beginner')
    const editorGrid = editorGridFromPuzzle(generated)
    const result = buildManualIdiomPuzzle({
      editorGrid,
      idioms: entries,
      difficulty: 'advanced',
      stage: 'junior',
    })

    expect(result.errors).toEqual([])
    expect(result.puzzle.board.placements).toHaveLength(4)
    expect(result.puzzle.board.showBlocks).toBe(true)
    expect(result.puzzle.editorGrid.cells).toHaveLength(editorGrid.width * editorGrid.height)
    expect(result.puzzle.stage).toBe('junior')
  })

  it('完整答案留白或成語未放入版面時不允許發布', () => {
    const generated = buildIdiomPuzzle(entries, 'basic')
    const editorGrid = editorGridFromPuzzle(generated)
    const firstAnswer = editorGrid.cells.find((cell) => cell.type !== 'block')
    firstAnswer.value = ''
    const result = buildManualIdiomPuzzle({ editorGrid, idioms: entries })

    expect(result.errors).toContain('完整答案尚有空白，請逐格填入答案。')
    expect(result.errors.some((message) => message.includes('答案版面找不到'))).toBe(true)
  })
})
