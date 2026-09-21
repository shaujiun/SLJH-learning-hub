export const NUMBER_GRID_SIZE = 3
export const NUMBER_GRID_CELL_COUNT = NUMBER_GRID_SIZE * NUMBER_GRID_SIZE
export const NUMBER_GRID_BANK = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

export const numberGridChallenges = Object.freeze([
  {
    id: 'practice-1',
    label: '練習題 1',
    title: '四方加總挑戰',
    rowSums: [12, 21, 17],
    columnSums: [16, 17, 17],
    blockSums: [
      { row: 0, column: 0, total: 22 },
      { row: 0, column: 1, total: 20 },
      { row: 1, column: 0, total: 22 },
      { row: 1, column: 1, total: 26 },
    ],
    solution: [4, 7, 1, 9, 2, 10, 3, 8, 6],
    explanation: '從 1～10 選出 9 個數字，每個數字只能使用一次。本題未使用 5。橫列合計依序為 12、21、17；直行合計依序為 16、17、17；四個圓圈則分別核對周圍四格的合計 22、20、22、26。',
  },
])

export function normalizeNumberGridEntries(entries) {
  return Array.from({ length: NUMBER_GRID_CELL_COUNT }, (_, index) => {
    const value = Number(entries?.[index])
    return NUMBER_GRID_BANK.includes(value) ? value : null
  })
}

function sum(values) {
  return values.reduce((total, value) => total + (value || 0), 0)
}

export function assessNumberGridChallenge(challenge, entries) {
  const values = normalizeNumberGridEntries(entries)
  const filledValues = values.filter((value) => value !== null)
  const complete = filledValues.length === NUMBER_GRID_CELL_COUNT
  const unique = new Set(filledValues).size === filledValues.length
  const rowResults = challenge.rowSums.map((target, row) => ({
    target,
    actual: sum(values.slice(row * NUMBER_GRID_SIZE, row * NUMBER_GRID_SIZE + NUMBER_GRID_SIZE)),
  }))
  const columnResults = challenge.columnSums.map((target, column) => ({
    target,
    actual: sum([values[column], values[column + NUMBER_GRID_SIZE], values[column + NUMBER_GRID_SIZE * 2]]),
  }))
  const blockResults = challenge.blockSums.map((clue) => {
    const topLeft = clue.row * NUMBER_GRID_SIZE + clue.column
    return {
      ...clue,
      target: clue.total,
      actual: sum([
        values[topLeft],
        values[topLeft + 1],
        values[topLeft + NUMBER_GRID_SIZE],
        values[topLeft + NUMBER_GRID_SIZE + 1],
      ]),
    }
  })
  const allCluesCorrect = [...rowResults, ...columnResults, ...blockResults]
    .every((result) => result.actual === result.target)
  return {
    complete,
    unique,
    correct: complete && unique && allCluesCorrect,
    rowResults,
    columnResults,
    blockResults,
  }
}

export function restoreNumberGridProgress(value) {
  const saved = value && typeof value === 'object' ? value : {}
  return {
    entries: normalizeNumberGridEntries(saved.entries),
    perfectCompletedAt: typeof saved.perfectCompletedAt === 'string' ? saved.perfectCompletedAt : '',
  }
}

export function serializeNumberGridProgress(entries, perfectCompletedAt = '') {
  return {
    entries: normalizeNumberGridEntries(entries),
    perfectCompletedAt: typeof perfectCompletedAt === 'string' ? perfectCompletedAt : '',
  }
}
