import { requireSupabase } from '../lib/supabase.js'
import { numberGridChallenges, validateNumberGridPuzzle } from '../lib/numberGridChallenge.js'

const fields = 'id, issue_on, title, source_name, designer_name, cells, circle_clues, line_clues, solution, explanation, status, published_at'

export function mapNumberGridPuzzle(row) {
  return {
    id: row.issue_on,
    recordId: row.id,
    issueOn: row.issue_on,
    label: row.issue_on.replaceAll('-', '／'),
    title: row.title || '十拿九穩之變形挑戰',
    sourceName: row.source_name || '聯合報好讀周報',
    designerName: row.designer_name || '狄運來老師',
    cells: row.cells || [],
    circleClues: row.circle_clues || [],
    lineClues: row.line_clues || [],
    solution: row.solution || Array(9).fill(null),
    explanation: row.explanation || '',
    status: row.status,
    publishedAt: row.published_at,
  }
}

export async function loadNumberGridPuzzles({ guestMode = false } = {}, client = requireSupabase()) {
  const permission = guestMode ? false : await client.rpc('can_manage_word_grid_puzzles')
  const canManage = !guestMode && !permission.error && Boolean(permission.data)
  let query = client.from('number_grid_puzzles').select(fields).order('issue_on', { ascending: true })
  if (!canManage) query = query.eq('status', 'published')
  const { data, error } = await query
  if (error) throw new Error(`無法讀取十拿九穩題庫：${error.message}`)
  const puzzlesByDate = new Map(numberGridChallenges.map((puzzle) => [puzzle.id, {
    ...puzzle,
    issueOn: puzzle.id,
    sourceName: '聯合報好讀周報',
    designerName: '狄運來老師',
    status: 'published',
  }]))
  for (const row of data || []) {
    const puzzle = mapNumberGridPuzzle(row)
    puzzlesByDate.set(puzzle.id, puzzle)
  }
  return { puzzles: [...puzzlesByDate.values()].sort((a, b) => a.id.localeCompare(b.id)), canManage }
}

async function currentUserId(client) {
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  const userId = data.session?.user?.id
  if (!userId) throw new Error('請先登入管理者帳號。')
  return userId
}

export async function saveNumberGridPuzzle(input, client = requireSupabase()) {
  const { errors, solution } = validateNumberGridPuzzle(input)
  if (errors.length) throw new Error(errors.join('\n'))
  const userId = await currentUserId(client)
  const now = new Date().toISOString()
  const payload = {
    issue_on: input.issueOn,
    title: String(input.title || '十拿九穩之變形挑戰').trim(),
    source_name: String(input.sourceName || '聯合報好讀周報').trim(),
    designer_name: String(input.designerName || '狄運來老師').trim(),
    cells: input.cells,
    circle_clues: input.circleClues,
    line_clues: input.lineClues,
    solution: solution.every((value) => value === null) ? null : solution,
    explanation: String(input.explanation || '').trim(),
    status: input.status,
    published_at: input.status === 'published' ? input.publishedAt || now : null,
    updated_by: userId,
    updated_at: now,
  }
  const query = input.recordId
    ? client.from('number_grid_puzzles').update(payload).eq('id', input.recordId)
    : client.from('number_grid_puzzles').insert({ ...payload, created_by: userId })
  const { error } = await query
  if (error) throw new Error(`無法儲存十拿九穩：${error.code === '23505' ? '這個日期已有題目。' : error.message}`)
}
