import { isSupabaseConfigured, requireSupabase } from '../lib/supabase.js'
import { clearRememberedFocusTask } from '../lib/focusTaskLaunch.js'
import { findPendingFocusTaskId } from './focusTaskRecoveryService.js'

function taipeiToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export async function loadPythagorasChallengeAccess({ guestMode = false, focusTaskId = '' } = {}, client = null) {
  if (guestMode || (!client && !isSupabaseConfigured)) {
    return { role: 'guest', group: 'B', canChooseGroup: true, displayName: '' }
  }

  const resolvedClient = client || requireSupabase()
  const { data: sessionData, error: sessionError } = await resolvedClient.auth.getSession()
  if (sessionError) throw sessionError
  const userId = sessionData.session?.user?.id
  if (!userId) return { role: 'guest', group: 'B', canChooseGroup: true, displayName: '' }

  const [profileResult, studentResult] = await Promise.all([
    resolvedClient
      .from('contact_book_profiles')
      .select('username,display_name,user_type')
      .eq('id', userId)
      .maybeSingle(),
    resolvedClient
      .from('students')
      .select('id,student_id_code,full_name')
      .eq('profile_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
  ])
  if (profileResult.error) throw profileResult.error
  if (studentResult.error) throw studentResult.error

  const student = studentResult.data
  const profile = profileResult.data
  if (!student) {
    return {
      role: profile?.user_type || 'staff',
      group: 'B',
      canChooseGroup: true,
      displayName: profile?.display_name || profile?.username || '',
    }
  }

  const { data: groupData, error: groupError } = await resolvedClient.rpc('resolve_student_learning_group', {
    p_student_id: student.id,
    p_subject_code: 'math',
    p_reference_date: taipeiToday(),
  })
  if (groupError) throw new Error(`無法確認數學分組：${groupError.message}`)

  let task = null
  if (focusTaskId) {
    const { data: taskRow, error: taskError } = await resolvedClient
      .from('student_focus_tasks')
      .select('id,subject_code_snapshot,activity_code_snapshot,activity_name_snapshot,question_count,target_score,status,best_score')
      .eq('id', focusTaskId)
      .maybeSingle()
    if (taskError) throw new Error(`無法讀取每日任務：${taskError.message}`)
    if (!taskRow
      || String(taskRow.subject_code_snapshot || '').toLowerCase() !== 'math'
      || String(taskRow.activity_code_snapshot || '').toLowerCase() !== 'pythagoras_challenge') {
      throw new Error('這個每日任務不是畢氏定理挑戰賽。')
    }
    task = {
      id: taskRow.id,
      activityName: taskRow.activity_name_snapshot,
      questionCount: Number(taskRow.question_count) || 10,
      targetScore: Number(taskRow.target_score) || 100,
      status: taskRow.status,
      bestScore: taskRow.best_score,
    }
  }

  return {
    role: 'student',
    group: String(groupData || 'B').toUpperCase() === 'A' ? 'A' : 'B',
    canChooseGroup: false,
    displayName: student.full_name || student.student_id_code || '',
    task,
  }
}

export async function recordPythagorasChallengeAttempt({
  focusTaskId = '',
  trackStudentProgress = false,
  score,
  correctCount,
  questionCount,
}, client = requireSupabase()) {
  const recoveredTaskId = !focusTaskId && trackStudentProgress
    ? await findPendingFocusTaskId({ subjectCode: 'math', activityCode: 'pythagoras_challenge' }, client)
    : ''
  const effectiveFocusTaskId = focusTaskId || recoveredTaskId
  if (!effectiveFocusTaskId) return null

  const normalizedScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)))
  const { data, error } = await client.rpc('record_focus_task_attempt', {
    p_focus_task_id: effectiveFocusTaskId,
    p_score: normalizedScore,
    p_correct_count: Number(correctCount) || 0,
    p_question_count: Math.max(1, Number(questionCount) || 1),
  })
  if (error) throw new Error(`無法儲存畢氏定理任務進度：${error.message}`)
  if (data?.passed) clearRememberedFocusTask(effectiveFocusTaskId)
  return {
    ...data,
    matchedFocusTaskId: effectiveFocusTaskId,
    recoveredFocusTask: Boolean(recoveredTaskId),
  }
}
