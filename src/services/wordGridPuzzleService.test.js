import { describe, expect, it } from 'vitest'
import { loadWordGridPuzzles, mapWordGridPuzzle } from './wordGridPuzzleService.js'

describe('填字圖資料服務', () => {
  it('把資料庫 10 列題目轉成遊戲格，並允許缺少解答', () => {
    const puzzle = mapWordGridPuzzle({
      id: 'puzzle-1',
      published_on: '2026-08-31',
      title: '填字圖',
      source_name: '聯合報好讀周報',
      designer_name: '遲驖川老師',
      grid_rows: ['.字########', ...Array(9).fill('##########')],
      character_bank: ['人'],
      solution_rows: null,
      answer_explanation: '本期解答說明',
      status: 'published',
    })
    expect(puzzle.grid).toHaveLength(100)
    expect(puzzle.grid[1]).toEqual({ type: 'given', value: '字' })
    expect(puzzle.solutionGrid).toBeNull()
    expect(puzzle.answerExplanation).toBe('本期解答說明')
  })

  it('將登入帳號作為個人作答進度的所有者', async () => {
    const query = {
      select() { return this },
      order() { return this },
      eq() { return this },
      then(resolve) { return Promise.resolve({ data: [], error: null }).then(resolve) },
    }
    const client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'student-1' } } }, error: null }) },
      rpc: async () => ({ data: false, error: null }),
      from: () => query,
    }
    const result = await loadWordGridPuzzles({}, client)
    expect(result.progressOwnerId).toBe('student-1')
  })
})
