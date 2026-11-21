import { describe, expect, it } from 'vitest'
import { STARTER_IDIOM_ENTRIES, getStarterIdiomPuzzles } from './idiomWordGridStarter.js'

describe('成語填字圖正式起始資料', () => {
  it('保留教育部《成語典》釋義與可查證網址', () => {
    expect(STARTER_IDIOM_ENTRIES).toHaveLength(24)
    expect(STARTER_IDIOM_ENTRIES.every((entry) => entry.definition && entry.sourceUrl)).toBe(true)
    expect(STARTER_IDIOM_ENTRIES.every((entry) => entry.licenseVersion === 'dict_idioms_2020_20260929')).toBe(true)
  })

  it('提供四個漸進難度且可實際交錯的題組', () => {
    const puzzles = getStarterIdiomPuzzles()
    expect(puzzles.map((puzzle) => puzzle.difficulty)).toEqual(['beginner', 'basic', 'advanced', 'challenge'])
    expect(puzzles.every((puzzle) => puzzle.board.placements.length >= 4)).toBe(true)
    expect(puzzles.every((puzzle) => puzzle.board.width !== 10 || puzzle.board.height !== 10)).toBe(true)
  })
})
