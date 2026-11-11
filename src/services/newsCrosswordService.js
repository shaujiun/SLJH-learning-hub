import { requireSupabase } from '../lib/supabase.js'
import {
  newsCrosswordGridToRows,
  newsCrosswordRowsToGrid,
  normalizeNewsCrosswordClues,
  normalizeNewsCrosswordGrid,
  newsCrosswordDirections,
  validateNewsCrosswordPuzzle,
} from '../lib/newsCrossword.js'

const puzzleSelect = `
  id,
  published_on,
  title,
  source_name,
  designer_name,
  grid_rows,
  solution_rows,
  across_clues,
  down_clues,
  block_style,
  status,
  published_at,
  updated_at
`

export function mapNewsCrosswordPuzzle(row) {
  return {
    id: row.id,
    publishedOn: row.published_on,
    title: row.title || '新聞縱橫填字',
    sourceName: row.source_name || '教師自建題庫',
    designerName: row.designer_name || '',
    grid: newsCrosswordRowsToGrid(row.grid_rows),
    solutionGrid: Array.isArray(row.solution_rows) ? newsCrosswordRowsToGrid(row.solution_rows) : null,
    acrossClues: normalizeNewsCrosswordClues(row.across_clues, newsCrosswordDirections.across),
    downClues: normalizeNewsCrosswordClues(row.down_clues, newsCrosswordDirections.down),
    blockStyle: row.block_style === 'solid' ? 'solid' : 'fruit',
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }
}

export async function loadNewsCrosswordPuzzles({ guestMode = false } = {}, client = requireSupabase()) {
  const permissionPromise = guestMode
    ? Promise.resolve({ data: false, error: null })
    : client.rpc('can_manage_word_grid_puzzles')
  const sessionPromise = guestMode
    ? Promise.resolve({ data: { session: null }, error: null })
    : client.auth.getSession()
  const [permissionResult, sessionResult] = await Promise.all([permissionPromise, sessionPromise])
  const canManage = !permissionResult.error && Boolean(permissionResult.data)
  const progressOwnerId = sessionResult.error ? '' : sessionResult.data.session?.user?.id || ''
  let query = client.from('news_crossword_puzzles').select(puzzleSelect).order('published_on', { ascending: false })
  if (!canManage) query = query.eq('status', 'published')
  const { data, error } = await query
  if (error) throw new Error(`無法讀取新聞縱橫填字：${error.message}`)
  return { puzzles: (data || []).map(mapNewsCrosswordPuzzle), canManage, progressOwnerId }
}

async function currentUserId(client) {
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  const userId = data.session?.user?.id
  if (!userId) throw new Error('請先登入管理者帳號。')
  return userId
}

export async function saveNewsCrosswordPuzzle(input, client = requireSupabase()) {
  const normalized = validateNewsCrosswordPuzzle(input)
  if (normalized.errors.length) throw new Error(normalized.errors.join('\n'))
  const userId = await currentUserId(client)
  const now = new Date().toISOString()
  const payload = {
    published_on: input.publishedOn,
    title: String(input.title || '新聞縱橫填字').trim(),
    source_name: String(input.sourceName || '教師自建題庫').trim(),
    designer_name: String(input.designerName || '').trim(),
    grid_rows: newsCrosswordGridToRows(normalized.grid),
    solution_rows: normalized.solutionGrid ? newsCrosswordGridToRows(normalizeNewsCrosswordGrid(normalized.solutionGrid)) : null,
    across_clues: normalized.acrossClues,
    down_clues: normalized.downClues,
    block_style: input.blockStyle === 'solid' ? 'solid' : 'fruit',
    status: ['draft', 'published', 'archived'].includes(input.status) ? input.status : 'draft',
    published_at: input.status === 'published' ? now : null,
    updated_by: userId,
    updated_at: now,
  }
  const query = input.id
    ? client.from('news_crossword_puzzles').update(payload).eq('id', input.id)
    : client.from('news_crossword_puzzles').insert({ ...payload, created_by: userId })
  const { error } = await query
  if (error) throw new Error(`無法儲存新聞縱橫填字：${error.code === '23505' ? '這個日期已有題目。' : error.message}`)
}

export async function archiveNewsCrosswordPuzzle(id, client = requireSupabase()) {
  const userId = await currentUserId(client)
  const { error } = await client
    .from('news_crossword_puzzles')
    .update({ status: 'archived', updated_by: userId, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`無法封存新聞縱橫填字：${error.message}`)
}

