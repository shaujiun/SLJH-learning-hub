const DIRECTIONS = {
  across: { row: 0, column: 1 },
  down: { row: 1, column: 0 },
}
export const IDIOM_DIFFICULTIES = {
  beginner: { label: '入門', minWords: 4, givenRatio: 0.5 },
  basic: { label: '基礎', minWords: 5, givenRatio: 0.34 },
  advanced: { label: '進階', minWords: 7, givenRatio: 0.22 },
  challenge: { label: '挑戰', minWords: 9, givenRatio: 0.14 },
}

export const IDIOM_EDITOR_CELL_TYPES = {
  block: 'block',
  empty: 'empty',
  given: 'given',
}

function idiomCharacters(value) {
  return Array.from(String(value || '').replace(/[\s，、；；。．！!？?「」『』（）()]/g, ''))
}

export function normalizeIdiomEntry(entry, index = 0) {
  const phrase = idiomCharacters(entry?.phrase).join('')
  return {
    id: String(entry?.id || `idiom-${index + 1}`),
    phrase,
    definition: String(entry?.definition || '').trim(),
    source: String(entry?.source || '').trim(),
    story: String(entry?.story || '').trim(),
    sourceUrl: String(entry?.sourceUrl || '').trim(),
    illustrationUrl: String(entry?.illustrationUrl || '').trim(),
    stage: String(entry?.stage || 'junior').trim(),
  }
}

function coordinateKey(row, column) {
  return `${row}:${column}`
}

function cellsForPlacement(phrase, row, column, direction) {
  const step = DIRECTIONS[direction]
  return idiomCharacters(phrase).map((character, index) => ({
    row: row + step.row * index,
    column: column + step.column * index,
    character,
  }))
}

function canPlace(board, placement) {
  const cells = cellsForPlacement(placement.phrase, placement.row, placement.column, placement.direction)
  let intersections = 0
  for (const cell of cells) {
    const key = coordinateKey(cell.row, cell.column)
    const existing = board.get(key)
    if (existing && existing.character !== cell.character) return false
    if (existing) intersections += 1

    const direction = DIRECTIONS[placement.direction]
    const sideOffsets = placement.direction === 'across'
      ? [{ row: -1, column: 0 }, { row: 1, column: 0 }]
      : [{ row: 0, column: -1 }, { row: 0, column: 1 }]
    if (!existing && sideOffsets.some((offset) => board.has(coordinateKey(cell.row + offset.row, cell.column + offset.column)))) {
      return false
    }
    if (!direction) return false
  }

  const first = cells[0]
  const last = cells[cells.length - 1]
  const step = DIRECTIONS[placement.direction]
  if (board.has(coordinateKey(first.row - step.row, first.column - step.column))) return false
  if (board.has(coordinateKey(last.row + step.row, last.column + step.column))) return false
  return board.size === 0 || intersections === 1
}

function scorePlacement(board, placement) {
  const cells = cellsForPlacement(placement.phrase, placement.row, placement.column, placement.direction)
  const points = cells.reduce((total, cell) => total + (board.has(coordinateKey(cell.row, cell.column)) ? 20 : 0), 0)
  const rows = cells.map((cell) => cell.row)
  const columns = cells.map((cell) => cell.column)
  const span = Math.max(...rows) - Math.min(...rows) + Math.max(...columns) - Math.min(...columns)
  return points - span - Math.abs(placement.row) * 0.05 - Math.abs(placement.column) * 0.05
}

function findPlacements(board, entry) {
  if (!board.size) return [{ phrase: entry.phrase, row: 0, column: 0, direction: 'across' }]
  const placements = []
  const characters = idiomCharacters(entry.phrase)
  board.forEach((existing, key) => {
    const [row, column] = key.split(':').map(Number)
    characters.forEach((character, characterIndex) => {
      if (character !== existing.character) return
      for (const direction of Object.keys(DIRECTIONS)) {
        if (existing.directions.has(direction)) continue
        const step = DIRECTIONS[direction]
        const candidate = {
          phrase: entry.phrase,
          row: row - step.row * characterIndex,
          column: column - step.column * characterIndex,
          direction,
        }
        if (canPlace(board, candidate)) placements.push(candidate)
      }
    })
  })
  return placements.sort((left, right) => scorePlacement(board, right) - scorePlacement(board, left))
}

function addPlacement(board, placement, idiomId) {
  cellsForPlacement(placement.phrase, placement.row, placement.column, placement.direction).forEach((cell) => {
    const key = coordinateKey(cell.row, cell.column)
    const existing = board.get(key) || {
      character: cell.character,
      idiomIds: new Set(),
      directions: new Set(),
    }
    existing.idiomIds.add(idiomId)
    existing.directions.add(placement.direction)
    board.set(key, existing)
  })
}

export function buildIdiomBoard(rawEntries, options = {}) {
  const entries = (rawEntries || []).map(normalizeIdiomEntry).filter((entry) => entry.phrase.length >= 4)
  if (!entries.length) return { width: 0, height: 0, cells: [], placements: [], omitted: [] }

  const board = new Map()
  const placements = []
  const charactersById = new Map(entries.map((entry) => [entry.id, new Set(idiomCharacters(entry.phrase))]))
  const connectionScore = (entry) => entries.reduce((score, other) => {
    if (entry.id === other.id) return score
    const own = charactersById.get(entry.id)
    return score + idiomCharacters(other.phrase).filter((character) => own.has(character)).length
  }, 0)
  const remaining = [...entries].sort((left, right) => (
    connectionScore(right) - connectionScore(left)
    || right.phrase.length - left.phrase.length
    || left.id.localeCompare(right.id)
  ))

  const first = remaining.shift()
  const firstPlacement = { phrase: first.phrase, row: 0, column: 0, direction: 'across' }
  addPlacement(board, firstPlacement, first.id)
  placements.push({ ...firstPlacement, idiomId: first.id })

  while (remaining.length) {
    const candidates = remaining
      .map((entry, index) => ({ entry, index, placement: findPlacements(board, entry)[0] }))
      .filter((candidate) => candidate.placement)
      .sort((left, right) => (
        scorePlacement(board, right.placement) - scorePlacement(board, left.placement)
        || connectionScore(right.entry) - connectionScore(left.entry)
      ))
    if (!candidates.length) break
    const selected = candidates[0]
    addPlacement(board, selected.placement, selected.entry.id)
    placements.push({ ...selected.placement, idiomId: selected.entry.id })
    remaining.splice(selected.index, 1)
  }

  const omitted = remaining

  const coordinatePairs = [...board.keys()].map((key) => key.split(':').map(Number))
  const minRow = Math.min(...coordinatePairs.map(([row]) => row))
  const maxRow = Math.max(...coordinatePairs.map(([row]) => row))
  const minColumn = Math.min(...coordinatePairs.map(([, column]) => column))
  const maxColumn = Math.max(...coordinatePairs.map(([, column]) => column))
  const height = maxRow - minRow + 1
  const width = maxColumn - minColumn + 1
  if (width > Number(options.maxWidth || 18) || height > Number(options.maxHeight || 18)) {
    return buildIdiomBoard(entries.slice(0, -1), options)
  }

  const cells = [...board.entries()].map(([key, value]) => {
    const [row, column] = key.split(':').map(Number)
    const normalizedRow = row - minRow
    const normalizedColumn = column - minColumn
    return {
      key: coordinateKey(normalizedRow, normalizedColumn),
      row: normalizedRow,
      column: normalizedColumn,
      solution: value.character,
      idiomIds: [...value.idiomIds],
      isIntersection: value.idiomIds.size > 1,
    }
  }).sort((left, right) => left.row - right.row || left.column - right.column)

  return {
    width,
    height,
    cells,
    placements: placements.map((placement) => ({
      ...placement,
      row: placement.row - minRow,
      column: placement.column - minColumn,
    })),
    omitted,
  }
}

function stableScore(value) {
  return Array.from(String(value)).reduce((total, character, index) => total + character.charCodeAt(0) * (index + 7), 0)
}

export function selectGivenCellKeys(board, difficulty = 'basic') {
  const config = IDIOM_DIFFICULTIES[difficulty] || IDIOM_DIFFICULTIES.basic
  const cells = board?.cells || []
  const desired = Math.max(1, Math.round(cells.length * config.givenRatio))
  const chosen = new Set()
  const byIdiom = new Map()
  cells.forEach((cell) => cell.idiomIds.forEach((idiomId) => {
    const group = byIdiom.get(idiomId) || []
    group.push(cell)
    byIdiom.set(idiomId, group)
  }))
  byIdiom.forEach((group, idiomId) => {
    const preferred = [...group].sort((left, right) => (
      Number(left.isIntersection) - Number(right.isIntersection)
      || stableScore(`${idiomId}:${left.key}`) - stableScore(`${idiomId}:${right.key}`)
    ))[0]
    if (preferred) chosen.add(preferred.key)
  })
  cells
    .filter((cell) => !chosen.has(cell.key))
    .sort((left, right) => (
      Number(left.isIntersection) - Number(right.isIntersection)
      || stableScore(left.key) - stableScore(right.key)
    ))
    .slice(0, Math.max(0, desired - chosen.size))
    .forEach((cell) => chosen.add(cell.key))
  return [...chosen]
}

export function buildIdiomPuzzle(rawEntries, difficulty = 'basic', options = {}) {
  const idioms = (rawEntries || []).map(normalizeIdiomEntry).filter((entry) => entry.phrase.length >= 4)
  const board = buildIdiomBoard(idioms, options)
  const usedIds = new Set(board.placements.map((placement) => placement.idiomId))
  const usedIdioms = idioms.filter((entry) => usedIds.has(entry.id))
  return {
    difficulty,
    board,
    idioms: usedIdioms,
    givenCellKeys: selectGivenCellKeys(board, difficulty),
  }
}

function normalizedEditorSize(value, fallback = 8) {
  const number = Number(value)
  return Number.isInteger(number) && number >= 4 && number <= 18 ? number : fallback
}

function normalizedEditorCell(cell = {}) {
  const type = Object.values(IDIOM_EDITOR_CELL_TYPES).includes(cell.type)
    ? cell.type
    : IDIOM_EDITOR_CELL_TYPES.block
  return {
    type,
    value: type === IDIOM_EDITOR_CELL_TYPES.block
      ? ''
      : idiomCharacters(cell.value)[0] || '',
  }
}

export function createIdiomEditorGrid(width = 8, height = 8, source = null) {
  const normalizedWidth = normalizedEditorSize(width)
  const normalizedHeight = normalizedEditorSize(height)
  const existing = Array.isArray(source?.cells) ? source.cells : []
  return {
    width: normalizedWidth,
    height: normalizedHeight,
    cells: Array.from({ length: normalizedWidth * normalizedHeight }, (_, index) => (
      normalizedEditorCell(existing[index])
    )),
  }
}

export function editorGridFromPuzzle(puzzle) {
  const width = normalizedEditorSize(puzzle?.editorGrid?.width || puzzle?.board?.width)
  const height = normalizedEditorSize(puzzle?.editorGrid?.height || puzzle?.board?.height)
  if (Array.isArray(puzzle?.editorGrid?.cells)) {
    return createIdiomEditorGrid(width, height, puzzle.editorGrid)
  }
  const cellsByKey = new Map((puzzle?.board?.cells || []).map((cell) => [cell.key, cell]))
  const given = new Set(puzzle?.givenCellKeys || [])
  return {
    width,
    height,
    cells: Array.from({ length: width * height }, (_, index) => {
      const row = Math.floor(index / width)
      const column = index % width
      const cell = cellsByKey.get(coordinateKey(row, column))
      if (!cell) return { type: IDIOM_EDITOR_CELL_TYPES.block, value: '' }
      return {
        type: given.has(cell.key) ? IDIOM_EDITOR_CELL_TYPES.given : IDIOM_EDITOR_CELL_TYPES.empty,
        value: cell.solution,
      }
    }),
  }
}

function editorCellAt(grid, row, column) {
  if (row < 0 || column < 0 || row >= grid.height || column >= grid.width) return null
  return grid.cells[row * grid.width + column]
}

function findManualPlacement(grid, entry, direction) {
  const step = DIRECTIONS[direction]
  const characters = idiomCharacters(entry.phrase)
  const placements = []
  for (let row = 0; row < grid.height; row += 1) {
    for (let column = 0; column < grid.width; column += 1) {
      const before = editorCellAt(grid, row - step.row, column - step.column)
      if (before && before.type !== IDIOM_EDITOR_CELL_TYPES.block) continue
      const matches = characters.every((character, index) => {
        const cell = editorCellAt(grid, row + step.row * index, column + step.column * index)
        return cell && cell.type !== IDIOM_EDITOR_CELL_TYPES.block && cell.value === character
      })
      if (!matches) continue
      const after = editorCellAt(
        grid,
        row + step.row * characters.length,
        column + step.column * characters.length,
      )
      if (after && after.type !== IDIOM_EDITOR_CELL_TYPES.block) continue
      placements.push({ phrase: entry.phrase, row, column, direction, idiomId: entry.id })
    }
  }
  return placements
}

export function buildManualIdiomPuzzle({ editorGrid, idioms, difficulty = 'basic', stage = 'junior' } = {}) {
  const grid = createIdiomEditorGrid(editorGrid?.width, editorGrid?.height, editorGrid)
  const entries = (idioms || []).map(normalizeIdiomEntry).filter((entry) => entry.phrase.length >= 4)
  const errors = []
  if (entries.length < 4) errors.push('至少選擇 4 個成語。')

  const activeIndexes = grid.cells
    .map((cell, index) => ({ cell, index }))
    .filter(({ cell }) => cell.type !== IDIOM_EDITOR_CELL_TYPES.block)
  if (!activeIndexes.length) errors.push('題目版面尚未建立白格或提示字。')
  if (activeIndexes.some(({ cell }) => !cell.value)) errors.push('完整答案尚有空白，請逐格填入答案。')

  const placements = []
  entries.forEach((entry) => {
    const found = [
      ...findManualPlacement(grid, entry, 'across'),
      ...findManualPlacement(grid, entry, 'down'),
    ]
    if (found.length === 0) errors.push(`答案版面找不到「${entry.phrase}」。`)
    if (found.length > 1) errors.push(`「${entry.phrase}」在版面出現超過一次，請調整格子。`)
    if (found.length === 1) placements.push(found[0])
  })

  const memberships = new Map()
  placements.forEach((placement) => {
    cellsForPlacement(
      placement.phrase,
      placement.row,
      placement.column,
      placement.direction,
    ).forEach((cell) => {
      const key = coordinateKey(cell.row, cell.column)
      const current = memberships.get(key) || new Set()
      current.add(placement.idiomId)
      memberships.set(key, current)
    })
  })
  const uncovered = activeIndexes.filter(({ index }) => {
    const row = Math.floor(index / grid.width)
    const column = index % grid.width
    return !memberships.has(coordinateKey(row, column))
  })
  if (uncovered.length) errors.push(`有 ${uncovered.length} 個白格未屬於所選成語。`)
  if (placements.length >= 2 && ![...memberships.values()].some((ids) => ids.size > 1)) {
    errors.push('成語之間尚未形成交錯字。')
  }

  const boardCells = activeIndexes.map(({ cell, index }) => {
    const row = Math.floor(index / grid.width)
    const column = index % grid.width
    const key = coordinateKey(row, column)
    const idiomIds = [...(memberships.get(key) || [])]
    return {
      key,
      row,
      column,
      solution: cell.value,
      idiomIds,
      isIntersection: idiomIds.length > 1,
    }
  })

  return {
    puzzle: {
      difficulty,
      stage,
      board: {
        width: grid.width,
        height: grid.height,
        cells: boardCells,
        placements,
        omitted: [],
        showBlocks: true,
      },
      idioms: entries,
      givenCellKeys: activeIndexes
        .filter(({ cell }) => cell.type === IDIOM_EDITOR_CELL_TYPES.given)
        .map(({ index }) => coordinateKey(Math.floor(index / grid.width), index % grid.width)),
      editorGrid: grid,
    },
    errors: [...new Set(errors)],
  }
}

export function createIdiomBankTiles(puzzle) {
  const given = new Set(puzzle?.givenCellKeys || [])
  return (puzzle?.board?.cells || [])
    .filter((cell) => !given.has(cell.key))
    .map((cell, index) => ({ id: index, character: cell.solution }))
    .sort((left, right) => stableScore(`${left.character}:${left.id}`) - stableScore(`${right.character}:${right.id}`))
    .map((tile, index) => ({ ...tile, id: index }))
}

export function assessIdiomAssignments(puzzle, assignments = {}) {
  const given = new Set(puzzle?.givenCellKeys || [])
  const tiles = createIdiomBankTiles(puzzle)
  const editable = (puzzle?.board?.cells || []).filter((cell) => !given.has(cell.key))
  const complete = editable.every((cell) => Number.isInteger(assignments[cell.key]) && tiles[assignments[cell.key]])
  if (!complete) return { status: 'incomplete', correct: false }
  const wrongCellKeys = editable
    .filter((cell) => tiles[assignments[cell.key]]?.character !== cell.solution)
    .map((cell) => cell.key)
  return { status: wrongCellKeys.length ? 'incorrect' : 'correct', correct: wrongCellKeys.length === 0, wrongCellKeys }
}

export function chooseHintCell(puzzle, assignments = {}, revealedKeys = [], kind = 'letter', requestedKey = '') {
  const given = new Set([...(puzzle?.givenCellKeys || []), ...(revealedKeys || [])])
  const cells = (puzzle?.board?.cells || []).filter((cell) => !given.has(cell.key))
  const requested = cells.find((cell) => cell.key === requestedKey)
  if (kind === 'letter' && requested) return requested
  const empty = cells.filter((cell) => !Number.isInteger(assignments[cell.key]))
  if (kind === 'cross') return empty.find((cell) => cell.isIntersection) || cells.find((cell) => cell.isIntersection) || null
  return requested || empty[0] || cells[0] || null
}

export function serializeIdiomPuzzle(puzzle) {
  return {
    difficulty: puzzle.difficulty,
    board: puzzle.board,
    idioms: puzzle.idioms,
    givenCellKeys: puzzle.givenCellKeys,
  }
}
