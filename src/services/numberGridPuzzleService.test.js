import { describe, expect, it } from 'vitest'
import { createNumberGridDraft } from '../lib/numberGridChallenge.js'
import { loadNumberGridPuzzles, mapNumberGridPuzzle, saveNumberGridPuzzle } from './numberGridPuzzleService.js'

function fakeClient(rows, canManage = false) {
  let statusFilter = null
  const query = {
    select() { return this },
    order() { return this },
    eq(column, value) { if (column === 'status') statusFilter = value; return this },
    then(resolve) {
      return Promise.resolve({ data: statusFilter ? rows.filter((row) => row.status === statusFilter) : rows, error: null }).then(resolve)
    },
  }
  return {
    rpc: async () => ({ data: canManage, error: null }),
    from: () => query,
  }
}

describe('number-grid puzzle service', () => {
  const draft = createNumberGridDraft('2026-09-21')
  const row = {
    id: 'record-1', issue_on: '2026-09-21', title: draft.title, source_name: draft.sourceName,
    designer_name: draft.designerName, cells: draft.cells, circle_clues: [], line_clues: [],
    solution: null, explanation: '', status: 'draft',
  }

  it('maps database rows to the 5x5 game model', () => {
    expect(mapNumberGridPuzzle(row)).toMatchObject({ id: '2026-09-21', recordId: 'record-1', cells: draft.cells, status: 'draft' })
  })

  it('shows drafts only to managers while retaining the four built-in issues', async () => {
    const manager = await loadNumberGridPuzzles({}, fakeClient([row], true))
    expect(manager.canManage).toBe(true)
    expect(manager.puzzles).toHaveLength(5)
    expect(manager.puzzles.at(-1).status).toBe('draft')
    const guest = await loadNumberGridPuzzles({ guestMode: true }, fakeClient([row]))
    expect(guest.canManage).toBe(false)
    expect(guest.puzzles).toHaveLength(4)
  })

  it('does not send an unconfirmed published puzzle to the database', async () => {
    await expect(saveNumberGridPuzzle({ ...draft, status: 'published' }, {})).rejects.toThrow('發布前須設定')
  })

  it('saves a new question as a draft with nine editable positions', async () => {
    let inserted = null
    const client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'admin-1' } } }, error: null }) },
      from: () => ({ insert: async (payload) => { inserted = payload; return { error: null } } }),
    }
    await saveNumberGridPuzzle(draft, client)
    expect(inserted).toMatchObject({ issue_on: '2026-09-21', status: 'draft', created_by: 'admin-1' })
    expect(inserted.cells).toHaveLength(9)
    expect(inserted.solution).toBeNull()
  })
})
