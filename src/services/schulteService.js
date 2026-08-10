import { isSupabaseConfigured, requireSupabase } from '../lib/supabase.js'
import { calculateSchulteResult, mergeSchulteRecords } from '../lib/schulte.js'

const localStorageKey = 'sljh-schulte-static-records-v1'

export function loadLocalSchulteRecords(storage = window.localStorage) {
  try {
    const records = JSON.parse(storage.getItem(localStorageKey) || '[]')
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

export function saveLocalSchulteRecord(record, storage = window.localStorage) {
  const records = loadLocalSchulteRecords(storage)
  const nextRecords = [record, ...records].slice(0, 100)
  storage.setItem(localStorageKey, JSON.stringify(nextRecords))
  return nextRecords
}

export async function loadSchulteRecords() {
  const localRecords = loadLocalSchulteRecords()
  if (!isSupabaseConfigured) return localRecords

  const client = requireSupabase()
  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session?.user) return localRecords

  const { data: student } = await client
    .from('students')
    .select('id')
    .eq('profile_id', sessionData.session.user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (!student?.id) return localRecords

  const { data, error } = await client
    .from('schulte_attempts')
    .select('id,grid_size,duration_ms,error_count,average_tap_ms,completed_at')
    .eq('student_id', student.id)
    .eq('mode', 'static')
    .order('completed_at', { ascending: false })
    .limit(100)

  // 第一階段本機驗收期間，資料庫遷移尚未套用時仍可使用本機紀錄。
  if (error) return localRecords

  const remoteRecords = (data || []).map((row) => ({
    id: row.id,
    size: row.grid_size,
    durationMs: row.duration_ms,
    errorCount: row.error_count,
    averageTapMs: row.average_tap_ms,
    completedAt: row.completed_at,
  }))
  return mergeSchulteRecords(localRecords, remoteRecords)
}

export async function recordSchulteCompletion({
  focusTaskId = '',
  size,
  durationMs,
  errorCount,
}) {
  const result = calculateSchulteResult({ size, durationMs, errorCount })
  const localRecord = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...result,
    completedAt: new Date().toISOString(),
  }
  const localRecords = saveLocalSchulteRecord(localRecord)

  if (!isSupabaseConfigured) {
    return { record: localRecord, records: localRecords, storedRemotely: false }
  }

  const client = requireSupabase()
  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session?.user) {
    return { record: localRecord, records: localRecords, storedRemotely: false }
  }

  const { data, error } = await client.rpc('record_schulte_attempt', {
    p_focus_task_id: focusTaskId || null,
    p_grid_size: result.size,
    p_duration_ms: result.durationMs,
    p_error_count: result.errorCount,
  })

  if (error) {
    return {
      record: localRecord,
      records: localRecords,
      storedRemotely: false,
      remoteError: focusTaskId ? error.message : '',
    }
  }

  return {
    record: localRecord,
    records: localRecords,
    storedRemotely: true,
    taskCompleted: Boolean(data?.taskCompleted),
    personalBestMs: data?.personalBestMs || result.durationMs,
  }
}
