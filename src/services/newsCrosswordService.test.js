import { describe, expect, it } from 'vitest'
import { mapNewsCrosswordPuzzle, saveNewsCrosswordPuzzle } from './newsCrosswordService.js'
import {
  createEmptyNewsCrosswordClues,
  createEmptyNewsCrosswordGrid,
  newsCrosswordCellTypes,
  newsCrosswordDirections,
} from '../lib/newsCrossword.js'

function row() {
  return {
    id: 'puzzle-1',
    published_on: '2026-11-11',
    title: '新聞縱橫填字',
    source_name: '教師自建題庫',
    designer_name: '',
    grid_rows: ['........', '........', '........', '........', '........', '........', '........', '.......#'],
    solution_rows: [...Array.from({ length: 7 }, () => '甲甲甲甲甲甲甲甲'), '甲甲甲甲甲甲甲#'],
    across_clues: createEmptyNewsCrosswordClues(newsCrosswordDirections.across)
      .map((clue, index) => ({ ...clue, row: index, text: `橫 ${index + 1}` })),
    down_clues: createEmptyNewsCrosswordClues(newsCrosswordDirections.down)
      .map((clue, index) => ({ ...clue, col: index, text: `直 ${index + 1}` })),
    block_style: 'fruit',
    status: 'published',
  }
}

describe('新聞縱橫填字資料服務', () => {
  it('將資料列轉為 8 × 8 題目', () => {
    const mapped = mapNewsCrosswordPuzzle(row())
    expect(mapped.grid).toHaveLength(64)
    expect(mapped.grid[63].type).toBe(newsCrosswordCellTypes.block)
    expect(mapped.acrossClues).toHaveLength(8)
    expect(mapped.downClues).toHaveLength(8)
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
  })
})
