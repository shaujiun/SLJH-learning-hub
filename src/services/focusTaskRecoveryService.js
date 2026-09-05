import { requireSupabase } from '../lib/supabase.js'

function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function findPendingFocusTasks({
  subjectCode,
  activityCode,
  referenceDate = new Date(),
}, client = requireSupabase()) {
  const normalizedSubject = String(subjectCode || '').trim().toLowerCase()
  const normalizedActivity = String(activityCode || '').trim().toLowerCase()
  if (!normalizedSubject || !normalizedActivity) return []

  const { data, error } = await client
    .from('student_focus_tasks')
    .select('id,assigned_date')
    .eq('status', 'pending')
    .eq('subject_code_snapshot', normalizedSubject)
    .eq('activity_code_snapshot', normalizedActivity)
    .lte('assigned_date', localDateString(referenceDate))
    .order('assigned_date', { ascending: true })

  if (error) throw new Error(`無法確認待完成任務：${error.message}`)
  return (data || []).map((task) => ({
    id: String(task.id || ''),
    assignedDate: task.assigned_date,
  }))
}

export async function findPendingFocusTaskId(options, client = requireSupabase()) {
  const normalizedSubject = String(options?.subjectCode || '').trim().toLowerCase()
  const normalizedActivity = String(options?.activityCode || '').trim().toLowerCase()
  if (!normalizedSubject || !normalizedActivity) return ''

  const { data, error } = await client
    .from('student_focus_tasks')
    .select('id,assigned_date')
    .eq('status', 'pending')
    .eq('subject_code_snapshot', normalizedSubject)
    .eq('activity_code_snapshot', normalizedActivity)
    .lte('assigned_date', localDateString(options?.referenceDate))
    .order('assigned_date', { ascending: true })
    .limit(1)

  if (error) throw new Error(`無法確認待完成任務：${error.message}`)
  return String(data?.[0]?.id || '')
}
