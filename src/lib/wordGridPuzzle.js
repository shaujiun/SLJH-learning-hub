export const WORD_GRID_SIZE = 10
export const WORD_GRID_CELL_COUNT = WORD_GRID_SIZE * WORD_GRID_SIZE

export const wordGridCellTypes = {
  empty: 'empty',
  block: 'block',
  given: 'given',
}

export function createEmptyWordGrid() {
  return Array.from({ length: WORD_GRID_CELL_COUNT }, () => ({ type: wordGridCellTypes.empty, value: '' }))
}

export function normalizeGridCell(cell) {
  const type = Object.values(wordGridCellTypes).includes(cell?.type) ? cell.type : wordGridCellTypes.empty
  const value = type === wordGridCellTypes.given ? String(cell?.value || '').trim().slice(0, 1) : ''
  return { type: type === wordGridCellTypes.given && !value ? wordGridCellTypes.empty : type, value }
}

export function normalizeWordGrid(grid) {
  return Array.from({ length: WORD_GRID_CELL_COUNT }, (_, index) => normalizeGridCell(grid?.[index]))
}

export function parseCharacterBank(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return Array.from(String(value || '').replace(/[\s,，、；;｜|]/g, '')).filter(Boolean)
}

export function editableCellIndexes(grid) {
  return normalizeWordGrid(grid)
    .map((cell, index) => (cell.type === wordGridCellTypes.empty ? index : -1))
    .filter((index) => index >= 0)
}

export function validateWordGridPuzzle(input) {
  const grid = normalizeWordGrid(input?.grid)
  const characterBank = parseCharacterBank(input?.characterBank)
  const editableCount = editableCellIndexes(grid).length
  const errors = []
  if (!String(input?.publishedOn || '').trim()) errors.push('請填寫期數日期。')
  if (grid.every((cell) => cell.type === wordGridCellTypes.empty)) errors.push('請設定黑格或提示字。')
  if (characterBank.length !== editableCount) {
    errors.push(`可填字數為 ${characterBank.length}，但白格共有 ${editableCount} 格。`)
  }
  const solution = input?.solutionGrid ? normalizeWordGrid(input.solutionGrid) : null
  if (solution) {
    const missingSolution = editableCellIndexes(grid).some((index) => !solution[index]?.value)
    if (missingSolution) errors.push('完整解答仍有空白格。')
    if (!missingSolution) {
      const solutionCharacters = editableCellIndexes(grid).map((index) => solution[index].value).sort()
      const bankCharacters = [...characterBank].sort()
      if (solutionCharacters.join('') !== bankCharacters.join('')) {
        errors.push('可填文字與完整解答使用的文字不一致。')
      }
    }
  }
  if (input?.status === 'published' && !solution) errors.push('答案確認並收錄完整解答後，才能發布題目。')
  return { grid, characterBank, solutionGrid: solution, errors }
}

export function createBankTiles(characterBank) {
  return parseCharacterBank(characterBank).map((character, index) => ({ id: index, character }))
}

export function serializeAssignments(assignments = {}) {
  return Object.fromEntries(Object.entries(assignments)
    .map(([cellIndex, bankIndex]) => [String(Number(cellIndex)), Number(bankIndex)])
    .filter(([cellIndex, bankIndex]) => Number.isInteger(Number(cellIndex)) && Number.isInteger(bankIndex)))
}

export function restoreWordGridProgress(value, grid, characterBank) {
  const saved = value && typeof value === 'object' ? value : {}
  const serializedAssignments = saved.assignments && typeof saved.assignments === 'object'
    ? saved.assignments
    : saved
  return {
    assignments: restoreAssignments(serializedAssignments, grid, characterBank),
    perfectCompletedAt: typeof saved.perfectCompletedAt === 'string' ? saved.perfectCompletedAt : '',
  }
}

export function serializeWordGridProgress(assignments = {}, perfectCompletedAt = '') {
  return {
    assignments: serializeAssignments(assignments),
    perfectCompletedAt: typeof perfectCompletedAt === 'string' ? perfectCompletedAt : '',
  }
}

export function restoreAssignments(value, grid, characterBank) {
  const tiles = createBankTiles(characterBank)
  const validCells = new Set(editableCellIndexes(grid))
  const usedTiles = new Set()
  const restored = {}
  Object.entries(value || {}).forEach(([rawCellIndex, rawBankIndex]) => {
    const cellIndex = Number(rawCellIndex)
    const bankIndex = Number(rawBankIndex)
    if (!validCells.has(cellIndex) || !tiles[bankIndex] || usedTiles.has(bankIndex)) return
    restored[cellIndex] = bankIndex
    usedTiles.add(bankIndex)
  })
  return restored
}

export function assessWordGridAnswer(puzzle, assignments = {}) {
  const grid = normalizeWordGrid(puzzle?.grid)
  const tiles = createBankTiles(puzzle?.characterBank)
  const editableIndexes = editableCellIndexes(grid)
  const complete = editableIndexes.every((index) => tiles[assignments[index]])
  if (!complete) return { status: 'incomplete', complete: false, correct: false }
  if (!puzzle?.solutionGrid) return { status: 'practice-complete', complete: true, correct: null }

  const solution = normalizeWordGrid(puzzle.solutionGrid)
  const correct = editableIndexes.every((index) => tiles[assignments[index]]?.character === solution[index]?.value)
  return { status: correct ? 'correct' : 'incorrect', complete: true, correct }
}

export function mapRowsToGrid(rows) {
  if (!Array.isArray(rows) || rows.length !== WORD_GRID_SIZE) throw new Error('題目必須有 10 列。')
  const grid = []
  rows.forEach((row) => {
    const cells = Array.from(row)
    if (cells.length !== WORD_GRID_SIZE) throw new Error('每列必須有 10 格。')
    cells.forEach((value) => {
      if (value === '#') grid.push({ type: wordGridCellTypes.block, value: '' })
      else if (value === '.') grid.push({ type: wordGridCellTypes.empty, value: '' })
      else grid.push({ type: wordGridCellTypes.given, value })
    })
  })
  return grid
}

export function gridToRows(grid) {
  const normalized = normalizeWordGrid(grid)
  return Array.from({ length: WORD_GRID_SIZE }, (_, rowIndex) => normalized
    .slice(rowIndex * WORD_GRID_SIZE, (rowIndex + 1) * WORD_GRID_SIZE)
    .map((cell) => {
      if (cell.type === wordGridCellTypes.block) return '#'
      if (cell.type === wordGridCellTypes.given) return cell.value
      return '.'
    })
    .join(''))
}
