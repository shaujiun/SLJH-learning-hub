import { describe, expect, it } from 'vitest'
import {
  assessIdiomAssignments,
  assessIdiomProgress,
  applyRevealedIdiomCells,
  buildIdiomBoard,
  buildIdiomLevelNavigation,
  buildIdiomPuzzle,
  buildManualIdiomPuzzle,
  chooseAllCrossHintCells,
  chooseHintCell,
  chooseIdiomHintCells,
  createIdiomBankTiles,
  editorGridFromPuzzle,
  assignIdiomTile,
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

  it('成語填完後會整句判色，任一字錯誤時整句都標為錯誤', () => {
    const puzzle = buildIdiomPuzzle(entries, 'beginner')
    const tiles = createIdiomBankTiles(puzzle)
    const assignments = {}
    puzzle.board.cells
      .filter((cell) => !puzzle.givenCellKeys.includes(cell.key))
      .forEach((cell) => {
        assignments[cell.key] = tiles.findIndex((tile, index) => tile.character === cell.solution
          && !Object.values(assignments).includes(index))
      })

    const correct = assessIdiomProgress(puzzle, assignments)
    expect(correct.idioms.every((idiom) => idiom.status === 'correct')).toBe(true)

    const targetCell = puzzle.board.cells.find((cell) => !puzzle.givenCellKeys.includes(cell.key))
    const wrongTile = tiles.find((tile) => tile.character !== targetCell.solution)
    const incorrect = assessIdiomProgress(puzzle, { ...assignments, [targetCell.key]: wrongTile.id })
    const affectedIdioms = incorrect.idioms.filter((idiom) => targetCell.idiomIds.includes(idiom.id))
    expect(affectedIdioms.every((idiom) => idiom.status === 'incorrect')).toBe(true)
    affectedIdioms.forEach((idiom) => {
      idiom.cellKeys.forEach((key) => {
        expect(incorrect.cellFeedback[key].some((feedback) => feedback.status === 'incorrect')).toBe(true)
      })
    })
  })

  it('交錯提示優先選取同時屬於兩個成語的空格', () => {
    const puzzle = buildIdiomPuzzle(entries, 'challenge')
    const cell = chooseHintCell(puzzle, {}, [], 'cross')
    expect(cell?.isIntersection).toBe(true)
  })

  it('完整成語提示以所選非交錯格判斷目標，交錯格有歧義時不直接猜測', () => {
    const puzzle = buildIdiomPuzzle(entries, 'challenge')
    const crossCell = puzzle.board.cells.find((cell) => cell.isIntersection)
    expect(chooseIdiomHintCells(puzzle, {}, [], crossCell.key).status).toBe('ambiguous')

    const ordinaryCell = puzzle.board.cells.find((cell) => !cell.isIntersection && !puzzle.givenCellKeys.includes(cell.key))
    const target = chooseIdiomHintCells(puzzle, {}, [], ordinaryCell.key)
    expect(target.status).toBe('ready')
    expect(target.cellKeys).toContain(ordinaryCell.key)
    expect(target.cellKeys.length).toBeGreaterThan(1)
  })

  it('所有交錯字提示會排除已提示格，字卡可直接移入所選方格', () => {
    const puzzle = buildIdiomPuzzle(entries, 'challenge')
    const crossCells = chooseAllCrossHintCells(puzzle)
    expect(crossCells.length).toBeGreaterThan(0)
    expect(chooseAllCrossHintCells(puzzle, [crossCells[0].key])).toHaveLength(crossCells.length - 1)

    const assigned = assignIdiomTile({ '0:0': 2, '1:1': 3 }, '2:2', 2)
    expect(assigned).toEqual({ '1:1': 3, '2:2': 2 })
  })

  it('揭示提示字時同步占用正確字卡，完成檢查不會留下無法填入的字', () => {
    const puzzle = buildIdiomPuzzle(entries, 'challenge')
    const tiles = createIdiomBankTiles(puzzle)
    const target = puzzle.board.cells.find((cell) => !puzzle.givenCellKeys.includes(cell.key))
    const assignments = applyRevealedIdiomCells(puzzle, {}, [target.key])
    const assignedTileId = assignments[target.key]

    expect(Number.isInteger(assignedTileId)).toBe(true)
    expect(tiles[assignedTileId].character).toBe(target.solution)
    expect(new Set(Object.values(assignments)).size).toBe(1)

    const crossKeys = chooseAllCrossHintCells(puzzle).map((cell) => cell.key)
    const allCrossAssignments = applyRevealedIdiomCells(puzzle, {}, crossKeys)
    expect(Object.keys(allCrossAssignments)).toHaveLength(crossKeys.length)
    expect(new Set(Object.values(allCrossAssignments)).size).toBe(crossKeys.length)
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
