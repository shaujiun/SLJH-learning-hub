export const NEWS_CROSSWORD_SIZE = 8
export const NEWS_CROSSWORD_CELL_COUNT = NEWS_CROSSWORD_SIZE * NEWS_CROSSWORD_SIZE
export const NEWS_CROSSWORD_CLUE_COUNT = 8

export const newsCrosswordCellTypes = {
  empty: 'empty',
  block: 'block',
  given: 'given',
}

export const newsCrosswordDirections = {
  across: 'across',
  down: 'down',
}

export const chineseClueNumbers = ['一', '二', '三', '四', '五', '六', '七', '八']

export const newsCrosswordFruitOptions = [
  { id: 'apple', symbol: '🍎', label: '蘋果' },
  { id: 'orange', symbol: '🍊', label: '橘子' },
  { id: 'lemon', symbol: '🍋', label: '檸檬' },
  { id: 'watermelon', symbol: '🍉', label: '西瓜' },
  { id: 'grapes', symbol: '🍇', label: '葡萄' },
  { id: 'strawberry', symbol: '🍓', label: '草莓' },
  { id: 'kiwi', symbol: '🥝', label: '奇異果' },
  { id: 'pineapple', symbol: '🍍', label: '鳳梨' },
]

const newsCrosswordFruitIds = new Set(newsCrosswordFruitOptions.map((fruit) => fruit.id))

export function defaultNewsCrosswordFruitId(index) {
  return newsCrosswordFruitOptions[Number(index) % newsCrosswordFruitOptions.length].id
}

export function createEmptyNewsCrosswordGrid() {
  return Array.from({ length: NEWS_CROSSWORD_CELL_COUNT }, () => ({ type: newsCrosswordCellTypes.empty, value: '' }))
}

export function normalizeNewsCrosswordCell(cell) {
  const type = Object.values(newsCrosswordCellTypes).includes(cell?.type)
    ? cell.type
    : newsCrosswordCellTypes.empty
  const value = type === newsCrosswordCellTypes.given
    ? Array.from(String(cell?.value || '').trim()).slice(0, 1).join('')
    : ''
  return {
    type: type === newsCrosswordCellTypes.given && !value ? newsCrosswordCellTypes.empty : type,
    value,
  }
}

export function normalizeNewsCrosswordGrid(grid) {
  return Array.from(
    { length: NEWS_CROSSWORD_CELL_COUNT },
    (_, index) => normalizeNewsCrosswordCell(grid?.[index]),
  )
}

export function normalizeNewsCrosswordBlockFruits(value, grid) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return normalizeNewsCrosswordGrid(grid).reduce((result, cell, index) => {
    if (cell.type !== newsCrosswordCellTypes.block) return result
    const fruitId = String(source[index] || '')
    result[index] = newsCrosswordFruitIds.has(fruitId) ? fruitId : defaultNewsCrosswordFruitId(index)
    return result
  }, {})
}

export function createEmptyNewsCrosswordClues(direction) {
  return Array.from({ length: NEWS_CROSSWORD_CLUE_COUNT }, (_, index) => ({
    number: index + 1,
    row: 0,
    col: 0,
    text: '',
    direction,
    acceptedAnswers: [],
    commonMistakes: [],
  }))
}

function normalizeAnswerList(value) {
  const source = Array.isArray(value) ? value : []
  return [...new Set(source.map((answer) => String(answer || '').trim()).filter(Boolean))]
}

function normalizeCommonMistakes(value) {
  const source = Array.isArray(value) ? value : []
  const byAnswer = new Map()
  source.forEach((item) => {
    const answer = String(item?.answer || '').trim()
    if (!answer) return
    byAnswer.set(answer, {
      answer,
      hint: String(item?.hint || '').trim(),
    })
  })
  return [...byAnswer.values()]
}

export function normalizeNewsCrosswordClues(value, direction) {
  const byNumber = new Map((Array.isArray(value) ? value : []).map((clue) => [Number(clue?.number), clue]))
  return createEmptyNewsCrosswordClues(direction).map((fallback) => {
    const clue = byNumber.get(fallback.number) || fallback
    return {
      number: fallback.number,
      row: Math.min(NEWS_CROSSWORD_SIZE - 1, Math.max(0, Number(clue.row) || 0)),
      col: Math.min(NEWS_CROSSWORD_SIZE - 1, Math.max(0, Number(clue.col) || 0)),
      text: String(clue.text || '').trim(),
      direction,
      acceptedAnswers: normalizeAnswerList(clue.acceptedAnswers),
      commonMistakes: normalizeCommonMistakes(clue.commonMistakes),
    }
  })
}

export function clueDisplayNumber(clue) {
  return clue?.direction === newsCrosswordDirections.across
    ? chineseClueNumbers[Number(clue.number) - 1] || ''
    : String(clue?.number || '')
}

export function clueStartIndex(clue) {
  return Number(clue.row) * NEWS_CROSSWORD_SIZE + Number(clue.col)
}

export function cellsForClue(grid, clue) {
  const normalized = normalizeNewsCrosswordGrid(grid)
  const indexes = []
  let row = Number(clue?.row)
  let col = Number(clue?.col)
  const rowStep = clue?.direction === newsCrosswordDirections.down ? 1 : 0
  const colStep = clue?.direction === newsCrosswordDirections.across ? 1 : 0
  while (row >= 0 && row < NEWS_CROSSWORD_SIZE && col >= 0 && col < NEWS_CROSSWORD_SIZE) {
    const index = row * NEWS_CROSSWORD_SIZE + col
    if (normalized[index].type === newsCrosswordCellTypes.block) break
    indexes.push(index)
    row += rowStep
    col += colStep
  }
  return indexes
}

export function answerForClue(grid, solutionGrid, clue) {
  if (!solutionGrid) return ''
  const solution = normalizeNewsCrosswordGrid(solutionGrid)
  return cellsForClue(grid, clue).map((index) => solution[index]?.value || '').join('')
}

export function syncNewsCrosswordSolution(grid, previousSolution = null) {
  const normalizedGrid = normalizeNewsCrosswordGrid(grid)
  const normalizedSolution = previousSolution ? normalizeNewsCrosswordGrid(previousSolution) : createEmptyNewsCrosswordGrid()
  return normalizedGrid.map((cell, index) => {
    if (cell.type === newsCrosswordCellTypes.block) return { type: newsCrosswordCellTypes.block, value: '' }
    if (cell.type === newsCrosswordCellTypes.given) return { type: newsCrosswordCellTypes.given, value: cell.value }
    const previousValue = normalizedSolution[index]?.value || ''
    return previousValue
      ? { type: newsCrosswordCellTypes.given, value: previousValue }
      : { type: newsCrosswordCellTypes.empty, value: '' }
  })
}

export function newsCrosswordGridToRows(grid) {
  const normalized = normalizeNewsCrosswordGrid(grid)
  return Array.from({ length: NEWS_CROSSWORD_SIZE }, (_, rowIndex) => normalized
    .slice(rowIndex * NEWS_CROSSWORD_SIZE, (rowIndex + 1) * NEWS_CROSSWORD_SIZE)
    .map((cell) => {
      if (cell.type === newsCrosswordCellTypes.block) return '#'
      if (cell.type === newsCrosswordCellTypes.given) return cell.value
      return '.'
    })
    .join(''))
}

export function newsCrosswordRowsToGrid(rows) {
  if (!Array.isArray(rows) || rows.length !== NEWS_CROSSWORD_SIZE) throw new Error('題目必須有 8 列。')
  return rows.flatMap((row) => {
    const cells = Array.from(String(row))
    if (cells.length !== NEWS_CROSSWORD_SIZE) throw new Error('每列必須有 8 格。')
    return cells.map((value) => {
      if (value === '#') return { type: newsCrosswordCellTypes.block, value: '' }
      if (value === '.') return { type: newsCrosswordCellTypes.empty, value: '' }
      return { type: newsCrosswordCellTypes.given, value }
    })
  })
}

function validateClues(clues, grid, direction, requireComplete, solutionGrid) {
  const errors = []
  const normalized = normalizeNewsCrosswordClues(clues, direction)
  const starts = new Set()
  normalized.forEach((clue) => {
    const label = `${direction === newsCrosswordDirections.across ? '橫式' : '直式'} ${clueDisplayNumber(clue)}`
    if (!requireComplete && !clue.text) return
    const start = clueStartIndex(clue)
    if (starts.has(start)) errors.push(`${label} 與同方向其他題目使用了相同起始格。`)
    starts.add(start)
    if (grid[start]?.type === newsCrosswordCellTypes.block) errors.push(`${label} 的起始格不能是阻隔格。`)
    if (requireComplete && !clue.text) errors.push(`${label} 尚未填寫提示。`)
    const clueIndexes = cellsForClue(grid, clue)
    if (requireComplete && clueIndexes.length < 2) errors.push(`${label} 從起始格起至少需要 2 個白格。`)
    if (!solutionGrid || !clue.text) return
    const standardAnswer = answerForClue(grid, solutionGrid, clue)
    clue.acceptedAnswers = clue.acceptedAnswers.filter((answer) => answer !== standardAnswer)
    clue.acceptedAnswers.forEach((answer) => {
      if (Array.from(answer).length !== clueIndexes.length) errors.push(`${label} 的可接受答案「${answer}」字數必須是 ${clueIndexes.length} 字。`)
      clueIndexes.forEach((cellIndex, answerIndex) => {
        if (grid[cellIndex]?.type === newsCrosswordCellTypes.given && Array.from(answer)[answerIndex] !== grid[cellIndex].value) {
          errors.push(`${label} 的可接受答案「${answer}」與題目提示字衝突。`)
        }
      })
    })
    clue.commonMistakes.forEach((mistake) => {
      if (mistake.answer === standardAnswer || clue.acceptedAnswers.includes(mistake.answer)) {
        errors.push(`${label} 的常見誤答「${mistake.answer}」不能同時是正確答案。`)
      }
      if (Array.from(mistake.answer).length !== clueIndexes.length) errors.push(`${label} 的常見誤答「${mistake.answer}」字數必須是 ${clueIndexes.length} 字。`)
      if (requireComplete && !mistake.hint) errors.push(`${label} 的常見誤答「${mistake.answer}」尚未填寫提示。`)
    })
  })
  return { clues: normalized, errors }
}

export function validateNewsCrosswordPuzzle(input) {
  const grid = normalizeNewsCrosswordGrid(input?.grid)
  const blockFruits = normalizeNewsCrosswordBlockFruits(input?.blockFruits, grid)
  const solutionGrid = input?.solutionGrid ? syncNewsCrosswordSolution(grid, input.solutionGrid) : null
  const requireComplete = input?.status === 'published'
  const errors = []
  if (!String(input?.publishedOn || '').trim()) errors.push('請設定題目日期。')
  if (grid.every((cell) => cell.type === newsCrosswordCellTypes.empty)) errors.push('請設定阻隔格或提示字。')
  if (grid.every((cell) => cell.type === newsCrosswordCellTypes.block)) errors.push('題目至少需要 1 個白格。')

  const acrossResult = validateClues(input?.acrossClues, grid, newsCrosswordDirections.across, requireComplete, solutionGrid)
  const downResult = validateClues(input?.downClues, grid, newsCrosswordDirections.down, requireComplete, solutionGrid)
  errors.push(...acrossResult.errors, ...downResult.errors)

  if (requireComplete && !solutionGrid) errors.push('建立完整答案後才能發布題目。')
  if (solutionGrid) {
    grid.forEach((cell, index) => {
      if (cell.type !== newsCrosswordCellTypes.block && !solutionGrid[index]?.value) {
        errors.push('完整答案仍有空白格。')
      }
      if (cell.type === newsCrosswordCellTypes.given && solutionGrid[index]?.value !== cell.value) {
        errors.push('題目提示字與完整答案不一致。')
      }
    })
  }

  return {
    grid,
    blockFruits,
    solutionGrid,
    acrossClues: acrossResult.clues,
    downClues: downResult.clues,
    errors: [...new Set(errors)],
  }
}

export function assessNewsCrosswordAnswer(puzzle, answers = {}) {
  const grid = normalizeNewsCrosswordGrid(puzzle?.grid)
  const playableIndexes = grid
    .map((cell, index) => (cell.type === newsCrosswordCellTypes.block ? -1 : index))
    .filter((index) => index >= 0)
  const complete = playableIndexes.every((index) => {
    const value = grid[index].type === newsCrosswordCellTypes.given ? grid[index].value : answers[index]
    return Boolean(String(value || '').trim())
  })
  if (!complete) return { status: 'incomplete', complete: false, correct: false, incorrectIndexes: [] }
  if (!puzzle?.solutionGrid) return { status: 'practice-complete', complete: true, correct: null, incorrectIndexes: [] }
  const solution = normalizeNewsCrosswordGrid(puzzle.solutionGrid)
  const answerAt = (index) => String(grid[index].type === newsCrosswordCellTypes.given ? grid[index].value : answers[index] || '').trim()
  const incorrectIndexes = new Set()
  const assessedIndexes = new Set()
  const mistakeFeedback = []
  const clues = [
    ...normalizeNewsCrosswordClues(puzzle?.acrossClues, newsCrosswordDirections.across),
    ...normalizeNewsCrosswordClues(puzzle?.downClues, newsCrosswordDirections.down),
  ].filter((clue) => clue.text)
  let allCluesCorrect = true
  clues.forEach((clue) => {
    const indexes = cellsForClue(grid, clue)
    indexes.forEach((index) => assessedIndexes.add(index))
    const enteredAnswer = indexes.map(answerAt).join('')
    const standardAnswer = indexes.map((index) => solution[index]?.value || '').join('')
    const acceptedAnswers = [standardAnswer, ...clue.acceptedAnswers]
    const valid = acceptedAnswers.includes(enteredAnswer)
    if (valid) return
    allCluesCorrect = false
    indexes.forEach((index, answerIndex) => {
      if (answerAt(index) !== Array.from(standardAnswer)[answerIndex]) incorrectIndexes.add(index)
    })
    const mistake = clue.commonMistakes.find((item) => item.answer === enteredAnswer)
    if (mistake?.hint) {
      mistakeFeedback.push({
        direction: clue.direction,
        number: clue.number,
        label: `${clue.direction === newsCrosswordDirections.across ? '橫式' : '直式'} ${clueDisplayNumber(clue)}`,
        hint: mistake.hint,
      })
    }
  })
  playableIndexes.forEach((index) => {
    if (!assessedIndexes.has(index) && answerAt(index) !== solution[index]?.value) incorrectIndexes.add(index)
  })
  const sortedIncorrectIndexes = [...incorrectIndexes].sort((a, b) => a - b)
  const correct = allCluesCorrect && sortedIncorrectIndexes.length === 0
  return {
    status: correct ? 'correct' : 'incorrect',
    complete: true,
    correct,
    incorrectIndexes: sortedIncorrectIndexes,
    mistakeFeedback,
  }
}

export function restoreNewsCrosswordProgress(value, grid) {
  const normalizedGrid = normalizeNewsCrosswordGrid(grid)
  const rawAnswers = value?.answers && typeof value.answers === 'object' ? value.answers : {}
  const answers = {}
  Object.entries(rawAnswers).forEach(([rawIndex, rawValue]) => {
    const index = Number(rawIndex)
    if (!Number.isInteger(index) || normalizedGrid[index]?.type !== newsCrosswordCellTypes.empty) return
    const character = Array.from(String(rawValue || '').trim()).slice(0, 1).join('')
    if (character) answers[index] = character
  })
  return {
    answers,
    perfectCompletedAt: typeof value?.perfectCompletedAt === 'string' ? value.perfectCompletedAt : '',
  }
}

