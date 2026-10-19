import { isSupabaseConfigured, requireSupabase } from '../lib/supabase.js'

const allowedSources = new Set(['free_practice', 'daily_task', 'class_assignment'])

function clampScore(value) {
  if (value === null || value === undefined || value === '') return null
  const score = Number(value)
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score * 100) / 100)) : null
}

function optionalCount(value, minimum = 0) {
  if (value === null || value === undefined || value === '') return null
  const count = Math.trunc(Number(value))
  return Number.isFinite(count) && count >= minimum ? count : null
}

function normalizedCode(value, fallback = 'default') {
  const code = String(value || fallback).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_')
  return code.replace(/^_+|_+$/g, '').slice(0, 80) || fallback
}

export function createLearningAttemptKey(activityCode = 'activity') {
  const randomId = globalThis.crypto?.randomUUID?.()
    || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  return `${normalizedCode(activityCode)}:${randomId}`.slice(0, 160)
}

export async function recordLearningActivityAttempt(payload, client = null) {
  if (!client && !isSupabaseConfigured) return null
  const resolvedClient = client || requireSupabase()
  const { data: sessionData, error: sessionError } = await resolvedClient.auth.getSession()
  if (sessionError) throw sessionError
  if (!sessionData.session?.user) return null

  const activityCode = normalizedCode(payload.activityCode, 'activity')
  const questionCount = optionalCount(payload.questionCount, 1)
  const correctCount = optionalCount(payload.correctCount, 0)
  const source = allowedSources.has(payload.source) ? payload.source : 'free_practice'
  const { data, error } = await resolvedClient.rpc('record_learning_activity_attempt', {
    p_subject_code: normalizedCode(payload.subjectCode, 'general').slice(0, 64),
    p_activity_code: activityCode.slice(0, 64),
    p_activity_name: String(payload.activityName || activityCode).trim().slice(0, 120),
    p_mode_code: normalizedCode(payload.modeCode, 'default'),
    p_source: source,
    p_score: clampScore(payload.score),
    p_correct_count: correctCount,
    p_question_count: questionCount,
    p_completed: payload.completed !== false,
    p_duration_seconds: optionalCount(payload.durationSeconds, 0),
    p_attempt_key: String(payload.attemptKey || createLearningAttemptKey(activityCode)).slice(0, 160),
    p_metadata: payload.metadata && typeof payload.metadata === 'object' && !Array.isArray(payload.metadata)
      ? payload.metadata
      : {},
  })
  if (error) {
    // 管理者試玩沒有 student 資料，這是預期行為，不應干擾遊戲結果。
    if (String(error.message || '').includes('student_required')) return null
    throw error
  }
  return data
}

export function trackLearningActivityAttempt(payload, client = null) {
  return recordLearningActivityAttempt(payload, client).catch((error) => {
    console.warn('學習進度暫時無法同步，遊戲結果仍保留在目前畫面。', error)
    return null
  })
}

function relation(value) {
  return Array.isArray(value) ? value[0] : value
}

function mapProgress(row) {
  const student = relation(row.students)
  return {
    studentId: row.student_id,
    studentCode: student?.student_id_code || '',
    studentName: student?.full_name || '',
    seatNumber: student?.seat_number ?? null,
    classId: student?.class_id || '',
    className: relation(student?.classes)?.name || '',
    subjectCode: row.subject_code,
    activityCode: row.activity_code,
    activityName: row.activity_name,
    modeCode: row.mode_code,
    attemptCount: Number(row.attempt_count || 0),
    completionCount: Number(row.completion_count || 0),
    latestScore: row.latest_score === null ? null : Number(row.latest_score),
    bestScore: row.best_score === null ? null : Number(row.best_score),
    totalCorrect: Number(row.total_correct || 0),
    totalQuestions: Number(row.total_questions || 0),
    lastAttemptedAt: row.last_attempted_at,
  }
}

export async function loadMyLearningProgress(client = requireSupabase()) {
  const { data, error } = await client
    .from('student_activity_progress')
    .select('*')
    .order('last_attempted_at', { ascending: false })
  if (error) throw error
  return (data || []).map(mapProgress)
}

export async function loadAdminLearningProgress(filters = {}, client = requireSupabase()) {
  let query = client
    .from('student_activity_progress')
    .select('*,students!inner(id,student_id_code,seat_number,full_name,class_id,classes(name))')
    .order('last_attempted_at', { ascending: false })
  if (filters.classId) query = query.eq('students.class_id', filters.classId)
  if (filters.studentId) query = query.eq('student_id', filters.studentId)
  if (filters.subjectCode) query = query.eq('subject_code', filters.subjectCode)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapProgress)
}

