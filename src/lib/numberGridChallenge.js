export const NUMBER_GRID_CANVAS_SIZE = 5
export const NUMBER_GRID_CELL_COUNT = 9
export const NUMBER_GRID_BANK = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

export const numberGridChallenges = Object.freeze([
  {
    id: '2026-08-10',
    label: '2026／08／10',
    title: '十拿九穩之變形挑戰',
    cells: [
      { id: 'a', row: 0, column: 1 },
      { id: 'b', row: 0, column: 2 },
      { id: 'c', row: 1, column: 1 },
      { id: 'd', row: 1, column: 2 },
      { id: 'e', row: 1, column: 3 },
      { id: 'f', row: 2, column: 1 },
      { id: 'g', row: 2, column: 2 },
      { id: 'h', row: 2, column: 3 },
      { id: 'i', row: 3, column: 3 },
    ],
    circleClues: [
      { row: 1, column: 2, total: 20 },
      { row: 1, column: 3, total: 16 },
      { row: 2, column: 2, total: 28 },
      { row: 3, column: 3, total: 17 },
    ],
    lineClues: [
      { id: 'row-middle', axis: 'row', cellIds: ['c', 'd', 'e'], total: 18, direction: 'left', anchorRow: 1.5, anchorColumn: 4.35 },
      { id: 'row-lower', axis: 'row', cellIds: ['f', 'g', 'h'], total: 15, direction: 'left', anchorRow: 2.5, anchorColumn: 4.35 },
      { id: 'column-middle', axis: 'column', cellIds: ['b', 'd', 'g'], total: 21, direction: 'up', anchorRow: 3.65, anchorColumn: 2.5 },
    ],
    solution: [1, 4, 6, 9, 3, 5, 8, 2, 7],
    explanation: '本題使用 1～9，未使用 10。第二列 6＋9＋3＝18，第三列 5＋8＋2＝15，中間直行 4＋9＋8＝21。四個圓圈依序為 1＋4＋6＋9＝20、4＋9＋3＝16、6＋9＋5＋8＝28，以及 8＋2＋7＝17。',
  },
  {
    id: '2026-08-24',
    label: '2026／08／24',
    title: '十拿九穩之變形挑戰',
    cells: [
      { id: 'a', row: 0, column: 1 },
      { id: 'b', row: 1, column: 0 },
      { id: 'c', row: 1, column: 1 },
      { id: 'd', row: 1, column: 2 },
      { id: 'e', row: 2, column: 0 },
      { id: 'f', row: 2, column: 1 },
      { id: 'g', row: 2, column: 2 },
      { id: 'h', row: 3, column: 0 },
      { id: 'i', row: 3, column: 2 },
    ],
    circleClues: [
      { row: 1, column: 1, total: 11 },
      { row: 2, column: 1, total: 17 },
      { row: 3, column: 1, total: 16 },
      { row: 3, column: 2, total: 14 },
    ],
    lineClues: [
      { id: 'row-upper', axis: 'row', cellIds: ['b', 'c', 'd'], total: 15, direction: 'left', anchorRow: 1.5, anchorColumn: 3.65 },
      { id: 'row-lower', axis: 'row', cellIds: ['e', 'f', 'g'], total: 20, direction: 'left', anchorRow: 2.5, anchorColumn: 3.65 },
      { id: 'column-left', axis: 'column', cellIds: ['b', 'e', 'h'], total: 13, direction: 'up', anchorRow: 4.45, anchorColumn: 0.5 },
      { id: 'column-right', axis: 'column', cellIds: ['d', 'g', 'i'], total: 19, direction: 'up', anchorRow: 4.45, anchorColumn: 2.5 },
    ],
    solution: [6, 2, 3, 10, 7, 5, 8, 4, 1],
    explanation: '本題未使用 9。兩條橫列是 2＋3＋10＝15、7＋5＋8＝20；左右直行是 2＋7＋4＝13、10＋8＋1＝19。四個圓圈依序為 6＋2＋3＝11、2＋3＋7＋5＝17、7＋5＋4＝16、5＋8＋1＝14。',
  },
  {
    id: '2026-08-31',
    label: '2026／08／31',
    title: '十拿九穩之變形挑戰',
    cells: [
      { id: 'a', row: 0, column: 0 },
      { id: 'b', row: 1, column: 0 },
      { id: 'c', row: 1, column: 1 },
      { id: 'd', row: 2, column: 0 },
      { id: 'e', row: 2, column: 1 },
      { id: 'f', row: 2, column: 2 },
      { id: 'g', row: 3, column: 1 },
      { id: 'h', row: 3, column: 2 },
      { id: 'i', row: 4, column: 2 },
    ],
    circleClues: [
      { row: 1, column: 1, total: 20 },
      { row: 2, column: 1, total: 23 },
      { row: 3, column: 2, total: 19 },
      { row: 4, column: 2, total: 21 },
    ],
    lineClues: [
      { id: 'column-right', axis: 'column', cellIds: ['f', 'h', 'i'], total: 16, direction: 'down', anchorRow: 1.65, anchorColumn: 2.5 },
      { id: 'row-middle', axis: 'row', cellIds: ['d', 'e', 'f'], total: 12, direction: 'left', anchorRow: 2.5, anchorColumn: 3.65 },
      { id: 'column-middle', axis: 'column', cellIds: ['c', 'e', 'g'], total: 18, direction: 'up', anchorRow: 4.55, anchorColumn: 1.5 },
    ],
    solution: [4, 9, 7, 6, 1, 5, 10, 3, 8],
    explanation: '本題未使用 2。中間橫列 6＋1＋5＝12；中間直行 7＋1＋10＝18；右側直行 5＋3＋8＝16。四個圓圈依序為 4＋9＋7＝20、9＋7＋6＋1＝23、1＋5＋10＋3＝19、10＋3＋8＝21。',
  },
  {
    id: '2026-09-14',
    label: '2026／09／14',
    title: '十拿九穩之變形挑戰',
    cells: [
      { id: 'a', row: 0, column: 0 },
      { id: 'b', row: 1, column: 0 },
      { id: 'c', row: 1, column: 1 },
      { id: 'd', row: 1, column: 2 },
      { id: 'e', row: 2, column: 0 },
      { id: 'f', row: 2, column: 1 },
      { id: 'g', row: 2, column: 2 },
      { id: 'h', row: 3, column: 0 },
      { id: 'i', row: 3, column: 2 },
    ],
    circleClues: [
      { row: 1, column: 1, total: 12 },
      { row: 2, column: 2, total: 29 },
      { row: 3, column: 1, total: 16 },
    ],
    lineClues: [
      { id: 'row-upper', axis: 'row', cellIds: ['b', 'c', 'd'], total: 15, direction: 'left', anchorRow: 1.5, anchorColumn: 3.65 },
      { id: 'row-lower', axis: 'row', cellIds: ['e', 'f', 'g'], total: 17, direction: 'left', anchorRow: 2.5, anchorColumn: 3.65 },
      { id: 'column-left', axis: 'column', cellIds: ['a', 'b', 'e', 'h'], total: 18, direction: 'up', anchorRow: 4.45, anchorColumn: 0.5 },
      { id: 'column-right', axis: 'column', cellIds: ['d', 'g', 'i'], total: 22, direction: 'up', anchorRow: 4.45, anchorColumn: 2.5 },
    ],
    solution: [7, 1, 4, 10, 2, 6, 9, 8, 3],
    explanation: '本題未使用 5。兩條橫列是 1＋4＋10＝15、2＋6＋9＝17；左右直行是 7＋1＋2＋8＝18、10＋9＋3＝22。三個圓圈依序為 7＋1＋4＝12、4＋10＋6＋9＝29、2＋6＋8＝16。',
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

function valueAt(challenge, values, row, column) {
  const index = challenge.cells.findIndex((cell) => cell.row === row && cell.column === column)
  return index >= 0 ? values[index] : null
}

export function assessNumberGridChallenge(challenge, entries) {
  const values = normalizeNumberGridEntries(entries)
  const filledValues = values.filter((value) => value !== null)
  const complete = filledValues.length === challenge.cells.length
  const unique = new Set(filledValues).size === filledValues.length
  const lineResults = challenge.lineClues.map((clue) => ({
    ...clue,
    target: clue.total,
    actual: sum(clue.cellIds.map((cellId) => {
      const cellIndex = challenge.cells.findIndex((cell) => cell.id === cellId)
      return cellIndex >= 0 ? values[cellIndex] : null
    })),
  }))
  const circleResults = challenge.circleClues.map((clue) => ({
    ...clue,
    target: clue.total,
    actual: sum([
      valueAt(challenge, values, clue.row - 1, clue.column - 1),
      valueAt(challenge, values, clue.row - 1, clue.column),
      valueAt(challenge, values, clue.row, clue.column - 1),
      valueAt(challenge, values, clue.row, clue.column),
    ]),
  }))
  const allCluesCorrect = [...lineResults, ...circleResults]
    .every((result) => result.actual === result.target)
  return {
    complete,
    unique,
    correct: complete && unique && allCluesCorrect,
    lineResults,
    circleResults,
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
