import { requireSupabase } from '../lib/supabase.js'
import { clearRememberedFocusTask } from '../lib/focusTaskLaunch.js'
import { findPendingFocusTaskId } from './focusTaskRecoveryService.js'

export async function loadAnimalEquationTask(focusTaskId = '', client = requireSupabase()) {
  if (!focusTaskId) return null

  const { data, error } = await client
    .from('student_focus_tasks')
    .select('id,subject_code_snapshot,activity_code_snapshot,activity_name_snapshot,status')
    .eq('id', focusTaskId)
    .maybeSingle()
  if (error) throw new Error(`無法讀取根式馬戲團每日任務：${error.message}`)
  if (!data
    || String(data.subject_code_snapshot).toLowerCase() !== 'math'
    || String(data.activity_code_snapshot).toLowerCase() !== 'animal_equation_solo') {
    throw new Error('這個每日任務不是根式馬戲團單人對戰。')
  }
  return {
    id: data.id,
    activityName: data.activity_name_snapshot,
    status: data.status,
  }
}

export async function recordAnimalEquationTask({
  focusTaskId = '',
  finished = false,
  validRadicalPlays = 0,
}, client = requireSupabase()) {
  if (!finished) return null
  const recoveredTaskId = focusTaskId || await findPendingFocusTaskId({
    subjectCode: 'math',
    activityCode: 'animal_equation_solo',
  }, client)
  if (!recoveredTaskId) return null

  const passed = Number(validRadicalPlays) >= 1
  const { data, error } = await client.rpc('record_focus_task_attempt', {
    p_focus_task_id: recoveredTaskId,
    p_score: passed ? 100 : 0,
    p_correct_count: passed ? 1 : 0,
    p_question_count: 1,
  })
  if (error) throw new Error(`無法儲存根式馬戲團每日任務：${error.message}`)
  if (data?.passed) clearRememberedFocusTask(recoveredTaskId)
  return {
    ...data,
    matchedFocusTaskId: recoveredTaskId,
    recoveredFocusTask: !focusTaskId,
  }
}
