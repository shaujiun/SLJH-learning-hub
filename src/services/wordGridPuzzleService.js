import { requireSupabase } from '../lib/supabase.js'
import {
  gridToRows,
  mapRowsToGrid,
  normalizeWordGrid,
  parseCharacterBank,
  validateWordGridPuzzle,
} from '../lib/wordGridPuzzle.js'

const puzzleSelect = `
  id,
  published_on,
  title,
  source_name,
  designer_name,
  grid_rows,
  character_bank,
  solution_rows,
  previous_answer_label,
  previous_answer_rows,
  status,
  published_at,
  updated_at
`

function optionalRowsToGrid(rows) {
  return Array.isArray(rows) && rows.length === 10 ? mapRowsToGrid(rows) : null
}

export function mapWordGridPuzzle(row) {
  return {
    id: row.id,
    publishedOn: row.published_on,
    title: row.title || '填字圖',
    sourceName: row.source_name || '聯合報好讀周報',
    designerName: row.designer_name || '遲驖川老師',
    grid: mapRowsToGrid(row.grid_rows),
    characterBank: row.character_bank || [],
    solutionGrid: optionalRowsToGrid(row.solution_rows),
    previousAnswerLabel: row.previous_answer_label || '',
    previousAnswerGrid: optionalRowsToGrid(row.previous_answer_rows),
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }
}

export async function loadWordGridPuzzles({ guestMode = false } = {}, client = requireSupabase()) {
  const permissionPromise = guestMode
    ? Promise.resolve({ data: false, error: null })
    : client.rpc('can_manage_word_grid_puzzles')
  const { data: permission, error: permissionError } = await permissionPromise
  const canManage = !permissionError && Boolean(permission)
  let query = client.from('word_grid_puzzles').select(puzzleSelect).order('published_on', { ascending: false })
  if (!canManage) query = query.eq('status', 'published')
  const { data, error } = await query
  if (error) throw new Error(`無法讀取填字圖：${error.message}`)
  return { puzzles: (data || []).map(mapWordGridPuzzle), canManage }
}

async function currentUserId(client) {
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  const userId = data.session?.user?.id
  if (!userId) throw new Error('請先登入管理者帳號。')
  return userId
}

export async function saveWordGridPuzzle(input, client = requireSupabase()) {
  const normalized = validateWordGridPuzzle(input)
  if (normalized.errors.length) throw new Error(normalized.errors.join('\n'))
  const userId = await currentUserId(client)
  const now = new Date().toISOString()
  const payload = {
    published_on: input.publishedOn,
    title: String(input.title || '填字圖').trim(),
    source_name: String(input.sourceName || '聯合報好讀周報').trim(),
    designer_name: String(input.designerName || '遲驖川老師').trim(),
    grid_rows: gridToRows(normalized.grid),
    character_bank: parseCharacterBank(normalized.characterBank),
    solution_rows: input.solutionGrid ? gridToRows(normalizeWordGrid(input.solutionGrid)) : null,
    previous_answer_label: String(input.previousAnswerLabel || '').trim(),
    previous_answer_rows: input.previousAnswerGrid ? gridToRows(normalizeWordGrid(input.previousAnswerGrid)) : null,
    status: ['draft', 'published', 'archived'].includes(input.status) ? input.status : 'draft',
    published_at: input.status === 'published' ? now : null,
    updated_by: userId,
    updated_at: now,
  }
  const query = input.id
    ? client.from('word_grid_puzzles').update(payload).eq('id', input.id)
    : client.from('word_grid_puzzles').insert({ ...payload, created_by: userId })
  const { error } = await query
  if (error) throw new Error(`無法儲存填字圖：${error.code === '23505' ? '這個日期已有題目。' : error.message}`)
}

export async function archiveWordGridPuzzle(id, client = requireSupabase()) {
  const userId = await currentUserId(client)
  const { error } = await client
    .from('word_grid_puzzles')
    .update({ status: 'archived', updated_by: userId, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(`無法封存填字圖：${error.message}`)
}
