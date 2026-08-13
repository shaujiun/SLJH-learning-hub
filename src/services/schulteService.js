import { isSupabaseConfigured, requireSupabase } from '../lib/supabase.js'
import {
  calculateDynamicSchulteResult,
  calculatePhraseSchulteResult,
  calculateShapeSchulteResult,
  calculateSchulteResult,
  defaultSchultePhrases,
  mergeSchulteRecords,
} from '../lib/schulte.js'

const localStorageKeys = {
  static: 'sljh-schulte-static-records-v1',
  dynamic: 'sljh-schulte-dynamic-records-v1',
  shape: 'sljh-schulte-shape-records-v1',
  sentence: 'sljh-schulte-sentence-records-v1',
}

function storageKeyForMode(mode) {
  return localStorageKeys[mode] || localStorageKeys.static
}

export function loadLocalSchulteRecords(storage = window.localStorage, mode = 'static') {
  try {
    const records = JSON.parse(storage.getItem(storageKeyForMode(mode)) || '[]')
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

export function saveLocalSchulteRecord(record, storage = window.localStorage, mode = 'static') {
  const records = loadLocalSchulteRecords(storage, mode)
  const nextRecords = [record, ...records].slice(0, 100)
  storage.setItem(storageKeyForMode(mode), JSON.stringify(nextRecords))
  return nextRecords
}

export async function loadSchulteRecords(mode = 'static') {
  const normalizedMode = ['dynamic', 'shape', 'sentence'].includes(mode) ? mode : 'static'
  const localRecords = loadLocalSchulteRecords(window.localStorage, normalizedMode)
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
    .eq('mode', normalizedMode)
    .order('completed_at', { ascending: false })
    .limit(100)

  // 第一階段本機驗收期間，資料庫遷移尚未套用時仍可使用本機紀錄。
  if (error) return localRecords

  const remoteRecords = (data || []).map((row) => ({
    id: row.id,
    mode: normalizedMode,
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

export async function recordDynamicSchulteCompletion({
  focusTaskId = '',
  itemCount,
  durationMs,
  errorCount,
}) {
  const result = calculateDynamicSchulteResult({ itemCount, durationMs, errorCount })
  const localRecord = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...result,
    completedAt: new Date().toISOString(),
  }
  const localRecords = saveLocalSchulteRecord(localRecord, window.localStorage, 'dynamic')

  if (!isSupabaseConfigured) {
    return { record: localRecord, records: localRecords, storedRemotely: false }
  }

  const client = requireSupabase()
  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session?.user) {
    return { record: localRecord, records: localRecords, storedRemotely: false }
  }

  const { data, error } = await client.rpc('record_dynamic_schulte_attempt', {
    p_focus_task_id: focusTaskId || null,
    p_item_count: result.size,
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

export async function recordShapeSchulteCompletion({
  focusTaskId = '',
  durationMs,
  errorCount,
}) {
  const result = calculateShapeSchulteResult({ durationMs, errorCount })
  const localRecord = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...result,
    completedAt: new Date().toISOString(),
  }
  const localRecords = saveLocalSchulteRecord(localRecord, window.localStorage, 'shape')

  if (!isSupabaseConfigured) {
    return { record: localRecord, records: localRecords, storedRemotely: false }
  }

  const client = requireSupabase()
  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session?.user) {
    return { record: localRecord, records: localRecords, storedRemotely: false }
  }

  const { data, error } = await client.rpc('record_shape_schulte_attempt', {
    p_focus_task_id: focusTaskId || null,
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

export async function loadSchultePhrases({ includeInactive = false } = {}) {
  if (!isSupabaseConfigured) return defaultSchultePhrases
  const client = requireSupabase()
  let query = client
    .from('schulte_phrase_items')
    .select('id,category,title,content,meaning,source,distractor_characters,is_active,created_at,updated_at')
    .order('category')
    .order('title')
  if (!includeInactive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) {
    if (includeInactive) throw error
    return defaultSchultePhrases
  }
  if (!data?.length) return includeInactive ? [] : defaultSchultePhrases
  return data.map((row) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    content: row.content,
    meaning: row.meaning,
    source: row.source,
    distractorCharacters: row.distractor_characters || '',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function loadSchulteContentManagerAccess() {
  if (!isSupabaseConfigured) return false
  const client = requireSupabase()
  const { data, error } = await client.rpc('can_manage_focus_content')
  return !error && Boolean(data)
}

export async function saveSchultePhrase(item) {
  const client = requireSupabase()
  const payload = {
    category: item.category === 'poem' ? 'poem' : 'quote',
    title: item.title.trim(),
    content: item.content.trim(),
    meaning: item.meaning.trim(),
    source: item.source.trim(),
    distractor_characters: String(item.distractorCharacters || '').trim(),
    is_active: item.isActive !== false,
    updated_at: new Date().toISOString(),
  }
  const query = item.id
    ? client.from('schulte_phrase_items').update(payload).eq('id', item.id)
    : client.from('schulte_phrase_items').insert(payload)
  const { error } = await query
  if (error) throw error
}

export async function importSchultePhrases(items) {
  const client = requireSupabase()
  const payload = items.map((item) => ({
    category: item.category === 'poem' ? 'poem' : 'quote',
    title: item.title.trim(),
    content: item.content.trim(),
    meaning: item.meaning.trim(),
    source: String(item.source || '').trim(),
    distractor_characters: String(item.distractorCharacters || '').trim(),
    is_active: item.isActive !== false,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await client
    .from('schulte_phrase_items')
    .upsert(payload, { onConflict: 'content' })
  if (error) throw error
  return { imported: payload.length }
}

export async function removeSchultePhrase(id) {
  const client = requireSupabase()
  const { error } = await client.from('schulte_phrase_items').delete().eq('id', id)
  if (error) throw error
}

export async function recordPhraseSchulteCompletion({
  focusTaskId = '',
  phraseId = '',
  content,
  durationMs,
  errorCount,
}) {
  const result = calculatePhraseSchulteResult({ content, durationMs, errorCount })
  const localRecord = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...result,
    completedAt: new Date().toISOString(),
  }
  const localRecords = saveLocalSchulteRecord(localRecord, window.localStorage, 'sentence')
  if (!isSupabaseConfigured) {
    return { record: localRecord, records: localRecords, storedRemotely: false }
  }

  const client = requireSupabase()
  const { data: sessionData } = await client.auth.getSession()
  if (!sessionData.session?.user) {
    return { record: localRecord, records: localRecords, storedRemotely: false }
  }
  const remotePhraseId = String(phraseId).startsWith('default-') ? null : phraseId || null
  const { data, error } = await client.rpc('record_phrase_schulte_attempt', {
    p_focus_task_id: focusTaskId || null,
    p_phrase_id: remotePhraseId,
    p_character_count: result.size,
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
