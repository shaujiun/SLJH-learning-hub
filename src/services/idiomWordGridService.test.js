import { describe, expect, it, vi } from 'vitest'
import { completeIdiomPuzzle, loadIdiomWordGridContext, mapIdiomPuzzle, saveIdiomEntry, spendIdiomHint } from './idiomWordGridService.js'

function result(data, error = null) {
  const promise = Promise.resolve({ data, error })
  promise.select = vi.fn(() => promise)
  promise.eq = vi.fn(() => promise)
  promise.order = vi.fn(() => promise)
  promise.maybeSingle = vi.fn(() => promise)
  promise.single = vi.fn(() => promise)
  promise.upsert = vi.fn(() => promise)
  return promise
}

describe('成語填字圖服務', () => {
  it('將資料庫題目轉成可變版面', () => {
    expect(mapIdiomPuzzle({
      id: 'p1', title: '測試', published_on: '2026-10-31', difficulty: 'basic',
      puzzle_data: { board: { width: 7, height: 4, cells: [] }, idioms: [], givenCellKeys: ['0:0'], editorGrid: { width: 7, height: 4, cells: [] }, stage: 'elementary' },
      status: 'published', is_daily_eligible: true,
    })).toMatchObject({ id: 'p1', title: '測試', difficulty: 'basic', givenCellKeys: ['0:0'], stage: 'elementary', editorGrid: { width: 7, height: 4 }, board: { width: 7, height: 4 } })
  })

  it('資料表尚未安裝時提供內建題目，訪客仍可遊玩', async () => {
    const puzzleQuery = result(null, { code: 'PGRST205', message: 'missing' })
    const client = {
      auth: { getSession: vi.fn(async () => ({ data: { session: null }, error: null })) },
      from: vi.fn((table) => table === 'idiom_word_grid_puzzles' ? puzzleQuery : result([], { code: 'PGRST205' })),
      rpc: vi.fn(),
    }
    const context = await loadIdiomWordGridContext({ guestMode: true }, client)
    expect(context.remoteEnabled).toBe(false)
    expect(context.puzzles.length).toBeGreaterThanOrEqual(4)
  })

  it('提示與通關交由資料庫原子性扣除及增加能量', async () => {
    const client = { rpc: vi.fn(async (name) => ({ data: name === 'spend_idiom_word_grid_hint' ? { energy: 4 } : { energy: 8, energyEarned: 4, firstCompletion: true }, error: null })) }
    await expect(spendIdiomHint({ puzzleId: 'p1', kind: 'cross', cellKey: '1:2' }, client)).resolves.toEqual({ energy: 4 })
    await expect(completeIdiomPuzzle({ puzzleId: 'p1', hintsUsed: 0, focusTaskId: 'task-1' }, client)).resolves.toMatchObject({ energy: 8, energyEarned: 4, firstCompletion: true })
    expect(client.rpc).toHaveBeenCalledWith('spend_idiom_word_grid_hint', expect.objectContaining({ p_hint_kind: 'cross' }))
    expect(client.rpc).toHaveBeenCalledWith('complete_idiom_word_grid', expect.objectContaining({ p_hints_used: 0 }))
  })

  it('管理者可新增成語釋義與適合階段', async () => {
    const query = result({
      id: 'entry-1', phrase: '一鼓作氣', definition: '比喻趁勁頭強時一氣做完。',
      source_text: '《左傳》', story: '', source_url: 'https://dict.idioms.moe.edu.tw/',
      illustration_url: '', stage: 'junior',
    })
    const client = { from: vi.fn(() => query) }

    await expect(saveIdiomEntry({
      phrase: '一鼓作氣', definition: '比喻趁勁頭強時一氣做完。',
      source: '《左傳》', sourceUrl: 'https://dict.idioms.moe.edu.tw/', stage: 'junior',
    }, client)).resolves.toMatchObject({ id: 'entry-1', phrase: '一鼓作氣', stage: 'junior' })
    expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({
      phrase: '一鼓作氣', stage: 'junior', is_active: true,
    }), { onConflict: 'phrase' })
  })
})
