import { describe, expect, it } from 'vitest'
import {
  applyMemorizationSequenceStep,
  applyPhraseSchulteTap,
  applySchulteTap,
  applyShapeSchulteTap,
  bestDynamicSchulteRecord,
  bestShapeSchulteRecord,
  bestSchulteRecord,
  calculateDynamicSchulteResult,
  calculatePhraseSchulteResult,
  calculateShapeSchulteResult,
  calculateSchulteResult,
  createDynamicSchulteLayout,
  createPhraseSchulteLayout,
  createShapeSchulteLayout,
  formatSchulteDuration,
  phraseProgress,
  schulteTaskSizeForCompletions,
  shuffleSchulteNumbers,
} from './schulte.js'

describe('phrase Schulte layout', () => {
  it('標點不成為選項，重複文字仍有各自的順序編號', () => {
    const layout = createPhraseSchulteLayout('人人為我，我為人人。', '', () => 0.6)
    expect(layout.totalCharacters).toBe(8)
    expect(layout.tiles).toHaveLength(25)
    expect(layout.tiles.filter((tile) => tile.isAnswer).map((tile) => tile.character).sort()).toEqual(
      ['人', '人', '人', '人', '我', '我', '為', '為'].sort(),
    )
  })

  it('相同文字可互換選取，錯誤文字會回到第一個字', () => {
    expect(applyPhraseSchulteTap({ expectedCharacter: '處', tappedCharacter: '處', expectedIndex: 1, totalCharacters: 3 }))
      .toEqual({ correct: true, completed: false, nextExpectedIndex: 2 })
    expect(applyPhraseSchulteTap({ expectedCharacter: '處', tappedCharacter: '外', expectedIndex: 1, totalCharacters: 3 }))
      .toEqual({ correct: false, completed: false, nextExpectedIndex: 0 })
  })

  it('春曉中的兩個處皆屬於答案，任一個都可先選', () => {
    const layout = createPhraseSchulteLayout('處處聞啼鳥。', '處外烏', () => 0.4)
    const matchingTiles = layout.tiles.filter((tile) => tile.character === '處')
    expect(matchingTiles).toHaveLength(2)
    expect(matchingTiles.every((tile) => tile.isAnswer)).toBe(true)
    expect(applyPhraseSchulteTap({
      expectedCharacter: '處',
      tappedCharacter: matchingTiles[1].character,
      expectedIndex: 0,
      totalCharacters: layout.totalCharacters,
    }).correct).toBe(true)
  })

  it('作答區自動保留標點並逐字顯示進度', () => {
    expect(phraseProgress('學而時習之，不亦說乎。', 2)).toBe('學而＿＿＿，＿＿＿＿。')
  })
})

describe('Friday memorization sequence', () => {
  it('returns to the first saying after any wrong answer', () => {
    expect(applyMemorizationSequenceStep({
      phraseIndex: 3,
      totalPhrases: 5,
      phraseCompleted: false,
      correct: false,
    })).toEqual({ phraseIndex: 0, resetPhrase: true, completed: false })
  })

  it('advances only after a complete saying and passes after all five', () => {
    expect(applyMemorizationSequenceStep({
      phraseIndex: 1,
      totalPhrases: 5,
      phraseCompleted: true,
      correct: true,
    })).toEqual({ phraseIndex: 2, resetPhrase: true, completed: false })
    expect(applyMemorizationSequenceStep({
      phraseIndex: 4,
      totalPhrases: 5,
      phraseCompleted: true,
      correct: true,
    })).toEqual({ phraseIndex: 4, resetPhrase: false, completed: true })
  })
})

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

describe('dynamic Schulte layout', () => {
  it.each([
    [20, [4, 6, 9]],
    [35, [6, 11, 17]],
    [50, [8, 16, 25]],
  ])('建立中心固定為 1 的 %i 題三圈版面', (itemCount, ringCounts) => {
    const layout = createDynamicSchulteLayout(itemCount, () => 0.75)
    const visibleNumbers = [layout.center, ...layout.rings.flat()]

    expect(layout.center).toBe(1)
    expect(layout.rings.map((ring) => ring.length)).toEqual(ringCounts)
    expect(visibleNumbers).toHaveLength(itemCount)
    expect([...visibleNumbers].sort((left, right) => left - right)).toEqual(
      Array.from({ length: itemCount }, (_, index) => index + 1),
    )
    expect(layout.direction).toBe('counterclockwise')
  })

  it('每局可隨機決定順時針方向', () => {
    expect(createDynamicSchulteLayout(20, () => 0.25).direction).toBe('clockwise')
  })
})

describe('shape Schulte layout', () => {
  it('建立 5 種圖形各 5 個，並指定一個仍須點選的提示格', () => {
    const layout = createShapeSchulteLayout(() => 0.4)
    const counts = layout.tiles.reduce((result, tile) => ({
      ...result,
      [tile.shapeCode]: (result[tile.shapeCode] || 0) + 1,
    }), {})

    expect(layout.tiles).toHaveLength(25)
    expect(Object.values(counts)).toEqual([5, 5, 5, 5, 5])
    expect(layout.totalMatches).toBe(5)
    expect(layout.tiles.find((tile) => tile.id === layout.hintTileId)?.shapeCode)
      .toBe(layout.targetShapeCode)
  })

  it('點到目標圖形會累積，點錯則從頭開始', () => {
    expect(applyShapeSchulteTap({
      targetShapeCode: 'star',
      tappedShapeCode: 'star',
      matchedCount: 4,
      totalMatches: 5,
    })).toEqual({ correct: true, completed: true, nextMatchedCount: 5 })
    expect(applyShapeSchulteTap({
      targetShapeCode: 'star',
      tappedShapeCode: 'circle',
      matchedCount: 3,
      totalMatches: 5,
    })).toEqual({ correct: false, completed: false, nextMatchedCount: 0 })
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

  it('計算動態模式結果並找出同題數最佳紀錄', () => {
    expect(calculateDynamicSchulteResult({
      itemCount: 20,
      durationMs: 40000,
      errorCount: 2,
    })).toEqual({
      mode: 'dynamic',
      size: 20,
      totalNumbers: 20,
      durationMs: 40000,
      errorCount: 2,
      averageTapMs: 2000,
    })
    expect(bestDynamicSchulteRecord([
      { mode: 'dynamic', size: 20, durationMs: 36000 },
      { mode: 'dynamic', size: 35, durationMs: 30000 },
      { mode: 'dynamic', size: 20, durationMs: 28000 },
      { size: 20, durationMs: 10000 },
    ], 20)?.durationMs).toBe(28000)
  })

  it('計算圖形模式結果並找出個人最佳紀錄', () => {
    expect(calculateShapeSchulteResult({ durationMs: 12500, errorCount: 1 })).toEqual({
      mode: 'shape',
      size: 5,
      totalNumbers: 5,
      durationMs: 12500,
      errorCount: 1,
      averageTapMs: 2500,
    })
    expect(bestShapeSchulteRecord([
      { mode: 'shape', durationMs: 18000 },
      { mode: 'dynamic', durationMs: 9000 },
      { mode: 'shape', durationMs: 14000 },
    ])?.durationMs).toBe(14000)
  })

  it('計算詩句與名言模式的平均點按時間', () => {
    expect(calculatePhraseSchulteResult({
      content: '學而時習之，不亦說乎。',
      durationMs: 18000,
      errorCount: 1,
    })).toEqual({
      mode: 'sentence',
      size: 9,
      totalNumbers: 9,
      durationMs: 18000,
      errorCount: 1,
      averageTapMs: 2000,
    })
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
