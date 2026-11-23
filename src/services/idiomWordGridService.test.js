import { describe, expect, it, vi } from 'vitest'
import { completeIdiomPuzzle, loadIdiomWordGridContext, mapIdiomPuzzle, saveIdiomEntry, saveIdiomPuzzle, spendIdiomHint } from './idiomWordGridService.js'

function result(data, error = null) {
  const promise = Promise.resolve({ data, error })
  promise.select = vi.fn(() => promise)
  promise.eq = vi.fn(() => promise)
  promise.order = vi.fn(() => promise)
  promise.maybeSingle = vi.fn(() => promise)
  promise.single = vi.fn(() => promise)
  promise.upsert = vi.fn(() => promise)
  promise.insert = vi.fn(() => promise)
  promise.update = vi.fn(() => promise)
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

  it('登入學生載入帳號的遠端通關題目，供跨裝置顯示', async () => {
    const client = {
      auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'profile-1' } } }, error: null })) },
      from: vi.fn((table) => {
        if (table === 'students') return result({ id: 'student-1' })
        if (table === 'idiom_word_grid_puzzles') return result([{
          id: 'puzzle-1', title: '測試', published_on: '2026-11-21', difficulty: 'basic',
          puzzle_data: { board: { width: 1, height: 1, cells: [] }, idioms: [], givenCellKeys: [] },
          status: 'published', is_daily_eligible: true,
        }])
        if (table === 'idiom_word_grid_completions') return result([{ puzzle_id: 'puzzle-1' }])
        if (table === 'idiom_word_grid_wallets') return result({ energy: 7 })
        return result([])
      }),
      rpc: vi.fn(async () => ({ data: false, error: null })),
    }

    await expect(loadIdiomWordGridContext({}, client)).resolves.toMatchObject({
      studentId: 'student-1', completedPuzzleIds: ['puzzle-1'], energy: 7, remoteEnabled: true,
    })
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
      illustration_url: '', stage: 'junior', source_entry_id: 520,
      zhuyin: 'ㄧ ㄗˋ ㄑㄧㄢ ㄐㄧㄣ', pinyin: 'yī zì qiān jīn',
    })
    const client = { from: vi.fn(() => query) }

    await expect(saveIdiomEntry({
      phrase: '一鼓作氣', definition: '比喻趁勁頭強時一氣做完。',
      source: '《左傳》', sourceUrl: 'https://dict.idioms.moe.edu.tw/', stage: 'junior',
      sourceEntryId: 520, zhuyin: 'ㄧ ㄗˋ ㄑㄧㄢ ㄐㄧㄣ', pinyin: 'yī zì qiān jīn',
    }, client)).resolves.toMatchObject({ id: 'entry-1', phrase: '一鼓作氣', stage: 'junior', sourceEntryId: 520 })
    expect(query.upsert).toHaveBeenCalledWith(expect.objectContaining({
      phrase: '一鼓作氣', stage: 'junior', source_entry_id: 520,
      zhuyin: 'ㄧ ㄗˋ ㄑㄧㄢ ㄐㄧㄣ', pinyin: 'yī zì qiān jīn', is_active: true,
    }), { onConflict: 'phrase' })
  })

  it('新增成語填字圖使用獨立題目身分，不以題名與日期覆寫舊題', async () => {
    const query = result(null)
    const client = { from: vi.fn(() => query) }
    const puzzle = {
      title: '成語填字圖', publishedOn: '2026-11-23', difficulty: 'basic', stage: 'junior', status: 'draft',
      board: { width: 4, height: 4, cells: [], placements: [{}, {}, {}, {}] },
      idioms: [], givenCellKeys: [], editorGrid: { width: 4, height: 4, cells: [] },
    }
    await expect(saveIdiomPuzzle(puzzle, client)).resolves.toBeUndefined()
    expect(query.insert).toHaveBeenCalledWith(expect.objectContaining({ title: '成語填字圖', published_on: '2026-11-23' }))
    expect(query.upsert).not.toHaveBeenCalled()
  })

  it('舊資料庫尚未移除唯一限制時顯示可理解的中文訊息', async () => {
    const query = result(null, { code: '23505', message: 'duplicate key value violates unique constraint "idiom_word_grid_title_date_unique"' })
    const client = { from: vi.fn(() => query) }
    const puzzle = {
      title: '成語填字圖', publishedOn: '2026-11-23', difficulty: 'basic',
      board: { placements: [{}, {}, {}, {}] }, idioms: [], givenCellKeys: [],
    }
    await expect(saveIdiomPuzzle(puzzle, client)).rejects.toThrow('同一天已有相同題名的舊資料')
  })
})
