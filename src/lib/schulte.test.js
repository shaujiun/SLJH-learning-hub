import { describe, expect, it } from 'vitest'
import {
  applySchulteTap,
  bestSchulteRecord,
  calculateSchulteResult,
  formatSchulteDuration,
  schulteTaskSizeForCompletions,
  shuffleSchulteNumbers,
} from './schulte.js'

describe('shuffleSchulteNumbers', () => {
  it('建立不重複且完整的矩陣數字', () => {
    const values = [0.1, 0.9, 0.3, 0.7]
    let index = 0
    const numbers = shuffleSchulteNumbers(4, () => values[(index += 1) % values.length])
    expect(numbers).toHaveLength(16)
    expect([...numbers].sort((left, right) => left - right)).toEqual(
      Array.from({ length: 16 }, (_, numberIndex) => numberIndex + 1),
    )
  })
})

describe('applySchulteTap', () => {
  it('點對時前進，最後一個數字完成遊戲', () => {
    expect(applySchulteTap({ expectedNumber: 4, tappedNumber: 4, totalNumbers: 16 }))
      .toEqual({ correct: true, completed: false, nextExpectedNumber: 5 })
    expect(applySchulteTap({ expectedNumber: 16, tappedNumber: 16, totalNumbers: 16 }))
      .toEqual({ correct: true, completed: true, nextExpectedNumber: 17 })
  })

  it('點錯時回到 1，但不改動矩陣', () => {
    expect(applySchulteTap({ expectedNumber: 8, tappedNumber: 9, totalNumbers: 16 }))
      .toEqual({ correct: false, completed: false, nextExpectedNumber: 1 })
  })
})

describe('Schulte results', () => {
  it('計算完成時間、錯誤次數與平均點按時間', () => {
    expect(calculateSchulteResult({ size: 5, durationMs: 25000, errorCount: 2 }))
      .toEqual({ size: 5, totalNumbers: 25, durationMs: 25000, errorCount: 2, averageTapMs: 1000 })
    expect(formatSchulteDuration(65430)).toBe('1 分 05.4 秒')
  })

  it('找出同尺寸的最快紀錄', () => {
    const best = bestSchulteRecord([
      { size: 4, durationMs: 30000 },
      { size: 5, durationMs: 22000 },
      { size: 4, durationMs: 18000 },
    ], 4)
    expect(best.durationMs).toBe(18000)
  })
})

describe('schulteTaskSizeForCompletions', () => {
  it('每完成 5 次後提升每日任務矩陣', () => {
    expect(schulteTaskSizeForCompletions(0)).toBe(4)
    expect(schulteTaskSizeForCompletions(4)).toBe(4)
    expect(schulteTaskSizeForCompletions(5)).toBe(5)
    expect(schulteTaskSizeForCompletions(9)).toBe(5)
    expect(schulteTaskSizeForCompletions(10)).toBe(6)
  })
})
