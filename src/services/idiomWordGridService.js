import { requireSupabase } from '../lib/supabase.js'
import { buildIdiomPuzzle } from '../lib/idiomWordGrid.js'
import { clearRememberedFocusTask } from '../lib/focusTaskLaunch.js'
import { findPendingFocusTaskId } from './focusTaskRecoveryService.js'
import { getStarterIdiomPuzzles, STARTER_IDIOM_ENTRIES } from '../data/idiomWordGridStarter.js'

const PUZZLE_SELECT = 'id,title,published_on,difficulty,puzzle_data,source_version,illustration_url,is_daily_eligible,status,updated_at'

function isMissingRelation(error) {
  return ['42P01', 'PGRST205', 'PGRST202'].includes(error?.code)
}
export function mapIdiomPuzzle(row) {
  const data = row?.puzzle_data || {}
  return {
    id: String(row?.id || ''),
    title: String(row?.title || '成語填字圖'),
    publishedOn: row?.published_on || '',
    difficulty: row?.difficulty || data.difficulty || 'basic',
    board: data.board || { width: 0, height: 0, cells: [], placements: [] },
    idioms: Array.isArray(data.idioms) ? data.idioms : [],
    givenCellKeys: Array.isArray(data.givenCellKeys) ? data.givenCellKeys : [],
    sourceVersion: row?.source_version || '',
    illustrationUrl: row?.illustration_url || '',
    isDailyEligible: row?.is_daily_eligible !== false,
    status: row?.status || 'published',
  }
}

async function sessionContext(client) {
  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.user) return { userId: '', studentId: '', canManage: false }
  const userId = data.session.user.id
  const [studentResult, manageResult] = await Promise.all([
    client.from('students').select('id').eq('profile_id', userId).eq('is_active', true).maybeSingle(),
    client.rpc('can_manage_word_grid_puzzles'),
  ])
  return {
    userId,
    studentId: studentResult.error ? '' : studentResult.data?.id || '',
    canManage: !manageResult.error && Boolean(manageResult.data),
  }
}

export async function loadIdiomWordGridContext({ guestMode = false } = {}, client = null) {
  if (!client) {
    try { client = requireSupabase() } catch { client = null }
  }
  if (!client) return {
    puzzles: getStarterIdiomPuzzles(), catalog: STARTER_IDIOM_ENTRIES, energy: 0,
    studentId: '', canManage: false, remoteEnabled: false,
  }

  const account = guestMode ? { userId: '', studentId: '', canManage: false } : await sessionContext(client)
  let query = client.from('idiom_word_grid_puzzles').select(PUZZLE_SELECT).order('published_on', { ascending: false })
  if (!account.canManage) query = query.eq('status', 'published')
  const [puzzleResult, catalogResult, walletResult] = await Promise.all([
    query,
    client.from('idiom_entries').select('id,phrase,definition,source_text,story,source_url,illustration_url,stage').eq('is_active', true).order('phrase'),
    account.studentId
      ? client.from('idiom_word_grid_wallets').select('energy').eq('student_id', account.studentId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])
  if (puzzleResult.error && !isMissingRelation(puzzleResult.error)) throw new Error(`無法讀取成語填字圖：${puzzleResult.error.message}`)
  if (puzzleResult.error) return {
    puzzles: getStarterIdiomPuzzles(), catalog: STARTER_IDIOM_ENTRIES, energy: 0,
    studentId: account.studentId, canManage: account.canManage, remoteEnabled: false,
  }
  const catalog = catalogResult.error ? STARTER_IDIOM_ENTRIES : (catalogResult.data || []).map((entry) => ({
    id: entry.id,
    phrase: entry.phrase,
    definition: entry.definition,
    source: entry.source_text,
    story: entry.story,
    sourceUrl: entry.source_url,
    illustrationUrl: entry.illustration_url,
    stage: entry.stage,
  }))
  return {
    puzzles: (puzzleResult.data || []).map(mapIdiomPuzzle),
    catalog,
    energy: Number(walletResult.data?.energy || 0),
    studentId: account.studentId,
    canManage: account.canManage,
    remoteEnabled: true,
  }
}

export async function spendIdiomHint({ puzzleId, kind, cellKey }, client = requireSupabase()) {
  const { data, error } = await client.rpc('spend_idiom_word_grid_hint', {
    p_puzzle_id: puzzleId,
    p_hint_kind: kind,
    p_cell_key: cellKey,
  })
  if (error) throw new Error(error.message === 'idiom_energy_insufficient' ? '能量不足，完成其他關卡後可取得能量。' : `無法使用提示：${error.message}`)
  return { energy: Number(data?.energy || 0) }
}

export async function completeIdiomPuzzle({ puzzleId, hintsUsed = 0, focusTaskId = '' }, client = requireSupabase()) {
  const recoveredTaskId = focusTaskId || await findPendingFocusTaskId({ subjectCode: 'chinese', activityCode: 'idiom_word_grid' }, client)
  const { data, error } = await client.rpc('complete_idiom_word_grid', {
    p_puzzle_id: puzzleId,
    p_hints_used: hintsUsed,
    p_focus_task_id: recoveredTaskId || null,
  })
  if (error) throw new Error(`無法儲存通關紀錄：${error.message}`)
  if (recoveredTaskId) clearRememberedFocusTask(recoveredTaskId)
  return {
    energy: Number(data?.energy || 0),
    energyEarned: Number(data?.energyEarned || 0),
    firstCompletion: Boolean(data?.firstCompletion),
    taskCompleted: Boolean(recoveredTaskId),
  }
}

export async function saveIdiomPuzzle(input, client = requireSupabase()) {
  const puzzle = input.board ? input : buildIdiomPuzzle(input.idioms, input.difficulty)
  if ((puzzle.board?.placements || []).length < 4) throw new Error('至少需要 4 個能互相交錯的成語。')
  const payload = {
    title: String(input.title || '成語填字圖').trim(),
    published_on: input.publishedOn,
    difficulty: puzzle.difficulty,
    puzzle_data: {
      board: puzzle.board,
      idioms: puzzle.idioms,
      givenCellKeys: puzzle.givenCellKeys,
    },
    source_version: input.sourceVersion || 'dict_idioms_2020_20260929',
    illustration_url: String(input.illustrationUrl || '').trim(),
    is_daily_eligible: input.isDailyEligible !== false,
    status: ['draft', 'published', 'archived'].includes(input.status) ? input.status : 'draft',
  }
  const query = input.id
    ? client.from('idiom_word_grid_puzzles').update(payload).eq('id', input.id)
    : client.from('idiom_word_grid_puzzles').insert(payload)
  const { error } = await query
  if (error) throw new Error(`無法儲存成語填字圖：${error.message}`)
}
