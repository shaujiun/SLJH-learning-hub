import { describe, expect, it } from 'vitest'
import {
  assessNumberGridChallenge,
  NUMBER_GRID_CANVAS_SIZE,
  numberGridChallenges,
  restoreNumberGridProgress,
  serializeNumberGridProgress,
} from './numberGridChallenge.js'

const challenge = numberGridChallenges[0]

function findSolutions(issue) {
  const cellIndexes = new Map(issue.cells.map((cell, index) => [`${cell.row}-${cell.column}`, index]))
  const clues = [
    ...issue.lineClues.map((clue) => ({
      total: clue.total,
      indexes: clue.cellIds.map((id) => issue.cells.findIndex((cell) => cell.id === id)),
    })),
    ...issue.circleClues.map((clue) => ({
      total: clue.total,
      indexes: [
        [clue.row - 1, clue.column - 1],
        [clue.row - 1, clue.column],
        [clue.row, clue.column - 1],
        [clue.row, clue.column],
      ].map(([row, column]) => cellIndexes.get(`${row}-${column}`)).filter((index) => index !== undefined),
    })),
  ]
  const entries = Array(9).fill(null)
  const solutions = []
  const search = (position, used) => {
    if (solutions.length > 1) return
    if (position === entries.length) {
      solutions.push([...entries])
      return
    }
    for (let value = 1; value <= 10; value += 1) {
      if (used.has(value)) continue
      entries[position] = value
      const possible = clues.every((clue) => {
        const filled = clue.indexes.map((index) => entries[index])
        const total = filled.reduce((sum, number) => sum + (number || 0), 0)
        return total <= clue.total && (filled.includes(null) || total === clue.total)
      })
      if (possible) {
        used.add(value)
        search(position + 1, used)
        used.delete(value)
      }
    }
    entries[position] = null
  }
  search(0, new Set())
  return solutions
}

describe('十拿九穩之變形挑戰', () => {
  it('在 5 × 5 畫布中只定義報紙題目的 9 個可填格', () => {
    expect(challenge.cells).toHaveLength(9)
    expect(challenge.cells.every((cell) => cell.row >= 0 && cell.row < NUMBER_GRID_CANVAS_SIZE)).toBe(true)
    expect(challenge.cells.every((cell) => cell.column >= 0 && cell.column < NUMBER_GRID_CANVAS_SIZE)).toBe(true)
    expect(new Set(challenge.cells.map((cell) => `${cell.row}-${cell.column}`)).size).toBe(9)
    expect(NUMBER_GRID_CANVAS_SIZE ** 2 - challenge.cells.length).toBe(16)
  })

  it('2026／08／10 解答符合照片中的圓圈及箭頭加總', () => {
    const result = assessNumberGridChallenge(challenge, challenge.solution)
    expect(result.correct).toBe(true)
    expect(result.circleResults.map((item) => item.actual)).toEqual([20, 16, 28, 17])
    expect(result.lineResults.map((item) => item.actual)).toEqual([18, 15, 21])
  })

  it('可在 5 × 5 畫布橫向移動，提示仍依題目指定的格子核對', () => {
    const shifted = {
      ...challenge,
      cells: challenge.cells.map((cell) => ({ ...cell, column: cell.column + 1 })),
      circleClues: challenge.circleClues.map((clue) => ({ ...clue, column: clue.column + 1 })),
    }
    expect(assessNumberGridChallenge(shifted, challenge.solution).correct).toBe(true)
  })

  it('未填滿與重複數字都不能過關', () => {
    expect(assessNumberGridChallenge(challenge, challenge.solution.slice(0, 8)).correct).toBe(false)
    expect(assessNumberGridChallenge(challenge, [1, 1, 6, 9, 3, 5, 8, 2, 7]).unique).toBe(false)
  })

  it('照片中的條件只有一組排列能全部通過', () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const triples = (target) => {
      const rows = []
      numbers.forEach((first) => numbers.forEach((second) => numbers.forEach((third) => {
        if (new Set([first, second, third]).size === 3 && first + second + third === target) rows.push([first, second, third])
      })))
      return rows
    }
    const solutions = []
    triples(18).forEach(([c, d, e]) => triples(15).forEach(([f, g, h]) => {
      if (new Set([c, d, e, f, g, h]).size !== 6) return
      numbers.forEach((a) => numbers.forEach((b) => numbers.forEach((i) => {
        const entries = [a, b, c, d, e, f, g, h, i]
        if (new Set(entries).size === 9 && assessNumberGridChallenge(challenge, entries).correct) solutions.push(entries)
      })))
    }))
    expect(solutions).toEqual([challenge.solution])
  })

  it('保存作答與全對解鎖時間', () => {
    const saved = serializeNumberGridProgress(challenge.solution, '2026-09-21T08:00:00.000Z')
    expect(restoreNumberGridProgress(saved)).toEqual({
      entries: challenge.solution,
      perfectCompletedAt: '2026-09-21T08:00:00.000Z',
    })
  })
})

describe('published newspaper issues', () => {
  it.each(numberGridChallenges)('$id uses nine distinct visible cells and has one valid solution', (issue) => {
    expect(issue.cells).toHaveLength(9)
    expect(new Set(issue.cells.map((cell) => `${cell.row}-${cell.column}`)).size).toBe(9)
    expect(issue.cells.every((cell) => cell.row >= 0 && cell.row < 5 && cell.column >= 0 && cell.column < 5)).toBe(true)
    expect(issue.lineClues.every((clue) => clue.cellIds.every((id) => issue.cells.some((cell) => cell.id === id)))).toBe(true)
    expect(issue.lineClues.every((clue) => !issue.cells.some((cell) => cell.row === Math.floor(clue.anchorRow) && cell.column === Math.floor(clue.anchorColumn)))).toBe(true)
    expect(assessNumberGridChallenge(issue, issue.solution).correct).toBe(true)
    expect(findSolutions(issue)).toEqual([issue.solution])
  })
})
