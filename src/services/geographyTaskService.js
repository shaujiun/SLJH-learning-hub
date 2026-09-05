import { requireSupabase } from '../lib/supabase.js'
import { clearRememberedFocusTask } from '../lib/focusTaskLaunch.js'
import { geographyTaskAllowsSelection } from '../lib/focusTaskCurriculum.js'
import { findPendingFocusTasks } from './focusTaskRecoveryService.js'

function mapTask(row) {
  if (!row) return null
  return {
    id: row.id,
    activityName: row.activity_name_snapshot,
    assignedDate: row.assigned_date,
    questionCount: Number(row.question_count || 10),
    targetScore: Number(row.target_score || 80),
    status: row.status,
    bestScore: row.best_score,
  }
}

export async function loadGeographyContext(focusTaskId = '', client = requireSupabase()) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw new Error(`無法確認登入狀態：${sessionError.message}`)
  const user = sessionData.session?.user
  if (!user) return { authenticated: false, student: null, task: null }

  const { data: student, error: studentError } = await client
    .from('students')
    .select('id,student_id_code,full_name')
    .eq('profile_id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (studentError) throw new Error(`無法確認學生資料：${studentError.message}`)

  if (!focusTaskId) {
    return { authenticated: true, student: student || null, task: null }
  }
  if (!student) throw new Error('只有學生帳號可以進行地理每日任務。')

  const { data: taskRow, error: taskError } = await client
    .from('student_focus_tasks')
    .select('id,student_id,assigned_date,subject_code_snapshot,activity_code_snapshot,activity_name_snapshot,question_count,target_score,status,best_score')
    .eq('id', focusTaskId)
    .maybeSingle()
  if (taskError) throw new Error(`無法讀取地理每日任務：${taskError.message}`)
  if (!taskRow
    || taskRow.student_id !== student.id
    || String(taskRow.subject_code_snapshot).toLowerCase() !== 'geography'
    || String(taskRow.activity_code_snapshot).toLowerCase() !== 'geography_round') {
    throw new Error('這個每日任務不是目前學生的地理填圖練習。')
  }

  return { authenticated: true, student, task: mapTask(taskRow) }
}

export async function recordGeographyAttempt({
  focusTaskId = '',
  allowRecovery = false,
  areaId = '',
  chapterId = '',
  score,
  correctCount,
  questionCount,
}, client = requireSupabase()) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)))
  const pendingTasks = !focusTaskId && allowRecovery
    ? await findPendingFocusTasks({
        subjectCode: 'geography',
        activityCode: 'geography_round',
      }, client)
    : []
  const recoveredTaskId = pendingTasks.find((task) => (
    geographyTaskAllowsSelection(task, areaId, chapterId)
  ))?.id || ''
  const effectiveFocusTaskId = focusTaskId || recoveredTaskId

  if (!effectiveFocusTaskId) return null
  const { data, error } = await client.rpc('record_focus_task_attempt', {
    p_focus_task_id: effectiveFocusTaskId,
    p_score: normalizedScore,
    p_correct_count: Number(correctCount),
    p_question_count: Number(questionCount),
  })
  if (error) throw new Error(`無法儲存地理每日任務：${error.message}`)
  if (data?.passed) clearRememberedFocusTask(effectiveFocusTaskId)
  return {
    ...data,
    matchedFocusTaskId: effectiveFocusTaskId,
    recoveredFocusTask: Boolean(recoveredTaskId),
  }
}
