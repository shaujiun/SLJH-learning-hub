import questionBank from '../data/yiziQianjinQuestions.json'

export const YIZI_SOURCE = questionBank.source
export const YIZI_DIFFICULTIES = [
  { value: 1, label: '易' },
  { value: 2, label: '中' },
  { value: 3, label: '難' },
]
export const YIZI_GAME_LABELS = {
  remove_part: '去無成字',
  four_sayings: '四說新語',
  component_pairs: '成雙成對',
  idiom_board: '隻字片語',
}
export const YIZI_TIME_OPTIONS = {
  remove_part: [30, 60, 0],
  four_sayings: [40, 60, 0],
  component_pairs: [30, 60, 90, 0],
  idiom_board: [60, 90, 120],
}

const DIRECTIONS = {
  R: [0, 1], L: [0, -1], D: [1, 0], U: [-1, 0],
  DR: [1, 1], UL: [-1, -1], DL: [1, -1], UR: [-1, 1],
}

export const YIZI_DIRECTION_LABELS = {
  R: '向右', L: '向左', D: '向下', U: '向上',
  DR: '右下', UL: '左上', DL: '左下', UR: '右上',
}

export function normalizeChineseAnswer(value) {
  return Array.from(String(value || '').normalize('NFC').replace(/[\s　，、。；：！!？?（）()「」『』]/g, '')).join('')
}

export function shuffleItems(items, random = Math.random) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

export function pickQuestionFromCycle(questions = [], usedQuestionIds = [], random = Math.random) {
  const used = new Set(usedQuestionIds || [])
  const remaining = questions.filter((question) => !used.has(question.id))
  const pool = remaining.length ? remaining : questions
  const question = pool[Math.floor(random() * pool.length)] || null
  return {
    question,
    usedQuestionIds: question
      ? [...(remaining.length ? used : []), question.id]
      : [],
    restarted: Boolean(question && !remaining.length && questions.length > 0),
  }
}

export function arrangeFourSayingsIdioms(question, random = Math.random) {
  const idioms = [...(question?.prompt?.idioms || [])]
  if (Number(question?.difficulty || 1) <= 1 || idioms.length < 2) return idioms
  const shuffled = shuffleItems(idioms, random)
  if (shuffled.every((idiom, index) => idiom === idioms[index])) {
    return [...idioms.slice(1), idioms[0]]
  }
  return shuffled
}

export function updateFourSayingsSelection(selected, selectionOrder, rowIndex, character) {
  const nextSelected = [...selected]
  nextSelected[rowIndex] = character
  const nextOrder = selectionOrder.includes(rowIndex) ? [...selectionOrder] : [...selectionOrder, rowIndex]
  return { selected: nextSelected, selectionOrder: nextOrder }
}

export function orderedFourSayingsAnswer(selected, selectionOrder) {
  return selectionOrder.map((rowIndex) => selected[rowIndex] || '').join('')
}

export function localYiziQuestions(gameType, difficulty = 0) {
  return questionBank.questions
    .filter((question) => question.gameType === gameType && (!difficulty || question.difficulty === Number(difficulty)))
    .map((question) => ({
      id: question.stableKey,
      stableKey: question.stableKey,
      gameType: question.gameType,
      difficulty: question.difficulty,
      prompt: question.prompt,
      answers: question.answers,
      status: 'published',
      isLocal: true,
    }))
}

export function localCommonIdioms() {
  return [...questionBank.commonIdioms]
}

export function acceptedAnswers(question) {
  return [...new Set([
    ...(question?.answers?.accepted || []),
    ...(question?.answers?.extra || []),
  ].map(normalizeChineseAnswer).filter(Boolean))]
}

export function checkYiziAnswer(question, answer) {
  return acceptedAnswers(question).includes(normalizeChineseAnswer(answer))
}

export function scoreFourSayings({ correct, hintUsed }) {
  if (!correct) return 0
  return hintUsed ? 1 : 2
}

export function formatTimeChoice(seconds) {
  return Number(seconds) > 0 ? `${seconds} 秒` : '不限時'
}

export function createIdiomBoard(seedChar = '字') {
  return { '4:6': Array.from(seedChar || '字')[0] || '字' }
}

export function boardKey(row, column) {
  return `${row}:${column}`
}

export function placementCells(phrase, startRow, startColumn, direction) {
  const normalized = normalizeChineseAnswer(phrase)
  const delta = DIRECTIONS[direction]
  if (normalized.length !== 4 || !delta) return []
  return Array.from(normalized).map((character, index) => ({
    row: Number(startRow) + delta[0] * index,
    column: Number(startColumn) + delta[1] * index,
    character,
  }))
}

export function canPlaceIdiom(board, phrase, startRow, startColumn, direction) {
  const cells = placementCells(phrase, startRow, startColumn, direction)
  if (cells.length !== 4 || cells.some((cell) => cell.row < 0 || cell.row > 7 || cell.column < 0 || cell.column > 11)) return false
  let intersects = false
  let addsCharacter = false
  for (const cell of cells) {
    const existing = board?.[boardKey(cell.row, cell.column)]
    if (existing && existing !== cell.character) return false
    if (existing === cell.character) intersects = true
    if (!existing) addsCharacter = true
  }
  return intersects && addsCharacter
}

export function applyIdiomPlacement(board, phrase, startRow, startColumn, direction) {
  if (!canPlaceIdiom(board, phrase, startRow, startColumn, direction)) return null
  const nextBoard = { ...(board || {}) }
  placementCells(phrase, startRow, startColumn, direction).forEach((cell) => {
    nextBoard[boardKey(cell.row, cell.column)] = cell.character
  })
  return nextBoard
}

export function findIdiomPlacements(board, phrase) {
  const normalized = normalizeChineseAnswer(phrase)
  if (normalized.length !== 4) return []
  const existingCells = Object.entries(board || {}).map(([key, character]) => {
    const [row, column] = key.split(':').map(Number)
    return { row, column, character }
  })
  const placements = new Map()
  existingCells.forEach((existing) => {
    Array.from(normalized).forEach((character, characterIndex) => {
      if (character !== existing.character) return
      Object.entries(DIRECTIONS).forEach(([direction, [deltaRow, deltaColumn]]) => {
        const startRow = existing.row - deltaRow * characterIndex
        const startColumn = existing.column - deltaColumn * characterIndex
        if (!canPlaceIdiom(board, normalized, startRow, startColumn, direction)) return
        const key = `${startRow}:${startColumn}:${direction}`
        placements.set(key, { phrase: normalized, startRow, startColumn, direction })
      })
    })
  })
  return [...placements.values()]
}

function placementStrategicScore(board, placement) {
  const cells = placementCells(placement.phrase, placement.startRow, placement.startColumn, placement.direction)
  const newCells = cells.filter((cell) => !board[boardKey(cell.row, cell.column)])
  const edgeDistance = newCells.reduce((sum, cell) => sum + Math.min(cell.row, 7 - cell.row, cell.column, 11 - cell.column), 0)
  const intersections = cells.length - newCells.length
  return intersections * 8 - edgeDistance + newCells.length
}

export function chooseIdiomAiMove({ board, usedIdioms = [], idioms = [], difficulty = 2, random = Math.random }) {
  const used = new Set(usedIdioms)
  const limit = Number(difficulty) === 1 ? 800 : Number(difficulty) === 2 ? 2000 : idioms.length
  const candidates = idioms.slice(0, limit).filter((phrase) => !used.has(phrase))
  const placements = []
  for (const phrase of candidates) {
    const found = findIdiomPlacements(board, phrase)
    found.forEach((placement) => placements.push(placement))
    if (Number(difficulty) === 1 && placements.length >= 40) break
    if (Number(difficulty) === 2 && placements.length >= 160) break
    if (Number(difficulty) === 3 && placements.length >= 400) break
  }
  if (!placements.length) return null
  if (Number(difficulty) === 1) return placements[Math.floor(random() * placements.length)]
  return placements
    .map((placement) => ({ placement, score: placementStrategicScore(board, placement) + random() }))
    .sort((left, right) => right.score - left.score)[0].placement
}

export function yiziQuestionCounts() {
  return questionBank.questions.reduce((counts, question) => ({
    ...counts,
    [question.gameType]: (counts[question.gameType] || 0) + 1,
  }), {})
}
