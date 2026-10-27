import { clearRememberedFocusTask } from '../lib/focusTaskLaunch.js'
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase.js'

function taipeiToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function dailyMode(taskId) {
  const checksum = String(taskId || '').replaceAll('-', '').split('')
    .reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return checksum % 2 === 0 ? 'area' : 'cross'
}

export async function loadFactorClashAccess({ guestMode = false, focusTaskId = '' } = {}, client = null) {
  if (guestMode || (!client && !isSupabaseConfigured)) {
    return { role: 'guest', group: 'B', difficulty: 'basic', canChooseDifficulty: true, task: null }
  }
  const resolvedClient = client || requireSupabase()
  const { data: sessionData, error: sessionError } = await resolvedClient.auth.getSession()
  if (sessionError) throw sessionError
  const userId = sessionData.session?.user?.id
  if (!userId) return { role: 'guest', group: 'B', difficulty: 'basic', canChooseDifficulty: true, task: null }

  const [profileResult, studentResult] = await Promise.all([
    resolvedClient.from('contact_book_profiles').select('username,display_name,user_type').eq('id', userId).maybeSingle(),
    resolvedClient.from('students').select('id,student_id_code,full_name').eq('profile_id', userId).eq('is_active', true).maybeSingle(),
  ])
  if (profileResult.error) throw profileResult.error
  if (studentResult.error) throw studentResult.error
  if (!studentResult.data) {
    return {
      role: profileResult.data?.user_type || 'staff', group: 'B', difficulty: 'basic',
      canChooseDifficulty: true, task: null,
    }
  }

  const student = studentResult.data
  const { data: groupData, error: groupError } = await resolvedClient.rpc('resolve_student_learning_group', {
    p_student_id: student.id, p_subject_code: 'math', p_reference_date: taipeiToday(),
  })
  if (groupError) throw new Error(`無法確認數學分組：${groupError.message}`)
  const group = String(groupData || 'B').toUpperCase() === 'A' ? 'A' : 'B'
  let task = null
  if (focusTaskId) {
    const { data, error } = await resolvedClient.from('student_focus_tasks')
      .select('id,activity_code_snapshot,activity_name_snapshot,question_count,status')
      .eq('id', focusTaskId).maybeSingle()
    if (error) throw new Error(`無法讀取每日任務：${error.message}`)
    if (!data || String(data.activity_code_snapshot || '').toLowerCase() !== 'factor_clash_solo') {
      throw new Error('這個每日任務不是因式交鋒。')
    }
    task = { id: data.id, name: data.activity_name_snapshot, mode: dailyMode(data.id), status: data.status }
  }
  return {
    role: 'student', studentId: student.id, displayName: student.full_name || student.student_id_code || '',
    group, difficulty: group === 'A' ? 'advanced' : 'basic', canChooseDifficulty: false, task,
  }
}

export async function recordFactorClashRound({
  access, focusTaskId = '', mode, difficulty, questionCount, points,
  firstTryCorrect, secondTryCorrect, timeoutCount = 0, awayCount = 0, awaySeconds = 0,
}, client = requireSupabase()) {
  if (access?.role !== 'student' || !access.studentId) return null
  const { error: sessionError } = await client.from('factor_clash_sessions').insert({
    student_id: access.studentId,
    mode,
    difficulty,
    question_count: questionCount,
    total_points: points,
    first_try_correct: firstTryCorrect,
    second_try_correct: secondTryCorrect,
    timeout_count: timeoutCount,
    away_count: awayCount,
    away_seconds: awaySeconds,
  })
  if (sessionError) throw new Error(`無法儲存因式交鋒練習紀錄：${sessionError.message}`)

  const effectiveTaskId = focusTaskId
  if (!effectiveTaskId || questionCount < 5) return { saved: true, taskCompleted: false }
  const score = Math.max(0, Math.min(100, Math.round((Number(points) || 0) / 15 * 100)))
  const { data, error } = await client.rpc('record_focus_task_attempt', {
    p_focus_task_id: effectiveTaskId,
    p_score: score,
    p_correct_count: Number(firstTryCorrect) + Number(secondTryCorrect),
    p_question_count: questionCount,
  })
  if (error) throw new Error(`練習已儲存，但每日任務無法完成：${error.message}`)
  if (data?.passed) clearRememberedFocusTask(effectiveTaskId)
  return { saved: true, taskCompleted: Boolean(data?.passed), matchedFocusTaskId: effectiveTaskId }
}
