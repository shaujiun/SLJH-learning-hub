import { describe, expect, it } from 'vitest'
import {
  assessNumberGridChallenge,
  numberGridChallenges,
  restoreNumberGridProgress,
  serializeNumberGridProgress,
} from './numberGridChallenge.js'

const challenge = numberGridChallenges[0]

describe('十拿九穩之變形挑戰', () => {
  it('正確答案同時符合橫列、直行與圓圈加總', () => {
    const result = assessNumberGridChallenge(challenge, challenge.solution)
    expect(result.correct).toBe(true)
    expect(result.rowResults.map((item) => item.actual)).toEqual(challenge.rowSums)
    expect(result.columnResults.map((item) => item.actual)).toEqual(challenge.columnSums)
    expect(result.blockResults.map((item) => item.actual)).toEqual(challenge.blockSums.map((item) => item.total))
  })

  it('未填滿與重複數字都不能過關', () => {
    expect(assessNumberGridChallenge(challenge, challenge.solution.slice(0, 8)).correct).toBe(false)
    expect(assessNumberGridChallenge(challenge, [4, 4, 1, 9, 2, 10, 3, 8, 6]).unique).toBe(false)
  })

  it('第一題只有一組排列能同時通過所有條件', () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const matchingRows = challenge.rowSums.map((target) => {
      const rows = []
      numbers.forEach((first) => numbers.forEach((second) => numbers.forEach((third) => {
        if (new Set([first, second, third]).size === 3 && first + second + third === target) rows.push([first, second, third])
      })))
      return rows
    })
    const solutions = []
    matchingRows[0].forEach((firstRow) => matchingRows[1].forEach((secondRow) => {
      if (new Set([...firstRow, ...secondRow]).size !== 6) return
      matchingRows[2].forEach((thirdRow) => {
        const entries = [...firstRow, ...secondRow, ...thirdRow]
        if (new Set(entries).size === 9 && assessNumberGridChallenge(challenge, entries).correct) solutions.push(entries)
      })
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
