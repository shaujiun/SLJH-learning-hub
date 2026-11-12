import { describe, expect, it } from 'vitest'
import {
  loadNewsCrosswordPuzzles,
  mapNewsCrosswordPuzzle,
  saveNewsCrosswordPuzzle,
  taipeiDateValue,
} from './newsCrosswordService.js'
import {
  createEmptyNewsCrosswordClues,
  createEmptyNewsCrosswordGrid,
  newsCrosswordCellTypes,
  newsCrosswordDirections,
} from '../lib/newsCrossword.js'

function row() {
  const acrossClues = createEmptyNewsCrosswordClues(newsCrosswordDirections.across)
    .map((clue, index) => ({ ...clue, row: index, text: `橫 ${index + 1}` }))
  acrossClues[0].acceptedAnswers = ['乙甲甲甲甲甲甲甲']
  acrossClues[0].commonMistakes = [{ answer: '丙甲甲甲甲甲甲甲', hint: '請檢查第一個字。' }]
  return {
    id: 'puzzle-1',
    published_on: '2026-11-11',
    title: '新聞縱橫填字',
    source_name: '教師自建題庫',
    designer_name: '',
    grid_rows: ['........', '........', '........', '........', '........', '........', '........', '.......#'],
    solution_rows: [...Array.from({ length: 7 }, () => '甲甲甲甲甲甲甲甲'), '甲甲甲甲甲甲甲#'],
    across_clues: acrossClues,
    down_clues: createEmptyNewsCrosswordClues(newsCrosswordDirections.down)
      .map((clue, index) => ({ ...clue, col: index, text: `直 ${index + 1}` })),
    block_style: 'fruit',
    block_fruits: { 63: 'pineapple' },
    status: 'published',
  }
}

describe('新聞縱橫填字資料服務', () => {
  it('以臺灣日期判斷學生可見題目', () => {
    expect(taipeiDateValue(new Date('2026-11-15T16:30:00.000Z'))).toBe('2026-11-16')
  })

  it('學生只查詢已到公開日期的已發布題目', async () => {
    const filters = []
    const query = {
      select: () => query,
      order: () => query,
      eq: (...args) => { filters.push(['eq', ...args]); return query },
      lte: (...args) => { filters.push(['lte', ...args]); return query },
      then: (resolve) => Promise.resolve({ data: [], error: null }).then(resolve),
    }
    const client = {
      rpc: async () => ({ data: false, error: null }),
      auth: { getSession: async () => ({ data: { session: { user: { id: 'student-1' } } }, error: null }) },
      from: () => query,
    }
    await loadNewsCrosswordPuzzles({ today: '2026-11-12' }, client)
    expect(filters).toEqual([
      ['eq', 'status', 'published'],
      ['lte', 'published_on', '2026-11-12'],
    ])
  })

  it('將資料列轉為 8 × 8 題目', () => {
    const mapped = mapNewsCrosswordPuzzle(row())
    expect(mapped.grid).toHaveLength(64)
    expect(mapped.grid[63].type).toBe(newsCrosswordCellTypes.block)
    expect(mapped.acrossClues).toHaveLength(8)
    expect(mapped.downClues).toHaveLength(8)
    expect(mapped.blockFruits[63]).toBe('pineapple')
    expect(mapped.acrossClues[0].acceptedAnswers).toEqual(['乙甲甲甲甲甲甲甲'])
    expect(mapped.acrossClues[0].commonMistakes).toEqual([{ answer: '丙甲甲甲甲甲甲甲', hint: '請檢查第一個字。' }])
  })

  it('儲存時保留橫式與直式提示及水果外觀', async () => {
    const source = row()
    const puzzle = mapNewsCrosswordPuzzle(source)
    const inserted = []
    const client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'admin-1' } } }, error: null }) },
      from: () => ({
        insert: (payload) => {
          inserted.push(payload)
          return Promise.resolve({ error: null })
        },
      }),
    }
    await saveNewsCrosswordPuzzle({ ...puzzle, id: '' }, client)
    expect(inserted[0].grid_rows).toHaveLength(8)
    expect(inserted[0].across_clues).toHaveLength(8)
    expect(inserted[0].down_clues).toHaveLength(8)
    expect(inserted[0].block_style).toBe('fruit')
    expect(inserted[0].block_fruits).toEqual({ 63: 'pineapple' })
    expect(inserted[0].across_clues[0].acceptedAnswers).toEqual(['乙甲甲甲甲甲甲甲'])
    expect(inserted[0].across_clues[0].commonMistakes).toEqual([{ answer: '丙甲甲甲甲甲甲甲', hint: '請檢查第一個字。' }])
  })
})
