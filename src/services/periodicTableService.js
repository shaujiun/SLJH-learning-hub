import { requireSupabase } from '../lib/supabase.js'
import {
  normalizePeriodicLevel,
  parsePeriodicActivityCode,
  periodicLevels,
} from '../lib/periodicTable.js'

function relation(value) {
  return Array.isArray(value) ? value[0] : value
}

function mapLearningLevel(row) {
  const code = normalizePeriodicLevel(row?.current_level)
  return {
    code,
    label: periodicLevels[code].label,
    consecutivePasses: Number(row?.consecutive_passes || 0),
    requiredPasses: periodicLevels[code].requiredPasses,
  }
}

export async function loadPeriodicTableContext(focusTaskId = '', client = requireSupabase()) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError
  const user = sessionData.session?.user
  if (!user) return { authenticated: false }

  const [profileResult, studentResult, systemResult] = await Promise.all([
    client
      .from('contact_book_profiles')
      .select('username,display_name,user_type,approval_status,is_active')
      .eq('id', user.id)
      .maybeSingle(),
    client
      .from('students')
      .select('id,student_id_code,seat_number,full_name,class_id,classes(name)')
      .eq('profile_id', user.id)
      .eq('is_active', true)
      .maybeSingle(),
    client
      .from('learning_systems')
      .select('id,subject_code,subject_name,is_active')
      .eq('subject_code', 'science')
      .maybeSingle(),
  ])

  if (profileResult.error) throw profileResult.error
  if (studentResult.error) throw studentResult.error
  if (systemResult.error) throw new Error(`無法讀取自然科學習系統：${systemResult.error.message}`)

  const profile = profileResult.data
  const student = studentResult.data
  const system = systemResult.data
  if (!system) throw new Error('自然科元素週期表遊戲尚未完成資料庫設定。')

  let level = mapLearningLevel(null)
  if (student) {
    const { data: levelRow, error: levelError } = await client
      .from('student_learning_levels')
      .select('current_level,consecutive_passes')
      .eq('student_id', student.id)
      .eq('learning_system_id', system.id)
      .maybeSingle()
    if (levelError) throw new Error(`無法讀取自然科等級：${levelError.message}`)
    level = mapLearningLevel(levelRow)
  }

  let task = null
  if (focusTaskId) {
    if (!student) throw new Error('只有學生帳號可以進行每日任務。')
    const { data: taskRow, error: taskError } = await client
      .from('student_focus_tasks')
      .select('id,subject_code_snapshot,activity_code_snapshot,activity_name_snapshot,question_count,target_score,status,best_score')
      .eq('id', focusTaskId)
      .maybeSingle()
    if (taskError) throw new Error(`無法讀取每日任務：${taskError.message}`)
    const activity = parsePeriodicActivityCode(taskRow?.activity_code_snapshot)
    if (!taskRow || String(taskRow.subject_code_snapshot).toLowerCase() !== 'science' || !activity) {
      throw new Error('這個每日任務不是元素週期表測驗。')
    }
    task = {
      id: taskRow.id,
      activityName: taskRow.activity_name_snapshot,
      level: activity.level,
      mode: activity.mode,
      questionCount: taskRow.question_count,
      targetScore: taskRow.target_score,
      status: taskRow.status,
      bestScore: taskRow.best_score,
    }
  }

  const classInfo = relation(student?.classes)
  return {
    authenticated: true,
    role: profile?.user_type || 'staff',
    profile: {
      displayName: student?.full_name || profile?.display_name || profile?.username || '老師',
      username: student?.student_id_code || profile?.username || '',
    },
    student: student ? {
      id: student.id,
      seatNumber: student.seat_number,
      className: classInfo?.name || '',
    } : null,
    level,
    task,
  }
}

export async function recordPeriodicTableAttempt({
  focusTaskId,
  score,
  correctCount,
  questionCount,
}, client = requireSupabase()) {
  if (!focusTaskId) return null
  const { data, error } = await client.rpc('record_focus_task_attempt', {
    p_focus_task_id: focusTaskId,
    p_score: Math.max(0, Math.min(100, Math.round(Number(score) || 0))),
    p_correct_count: Number(correctCount),
    p_question_count: Number(questionCount),
  })
  if (error) throw new Error(`無法儲存每日任務成績：${error.message}`)
  return data
}

export async function loadScienceStudentLevels(client = requireSupabase()) {
  const systemResult = await client
    .from('learning_systems')
    .select('id')
    .eq('subject_code', 'science')
    .maybeSingle()
  if (systemResult.error) throw new Error(`無法讀取自然科系統：${systemResult.error.message}`)
  if (!systemResult.data) return []

  const [studentsResult, levelsResult] = await Promise.all([
    client
      .from('students')
      .select('id,student_id_code,seat_number,full_name,class_id,classes(name)')
      .eq('is_active', true)
      .order('seat_number'),
    client
      .from('student_learning_levels')
      .select('student_id,current_level,consecutive_passes,updated_at')
      .eq('learning_system_id', systemResult.data.id),
  ])
  if (studentsResult.error) throw new Error(`無法讀取學生資料：${studentsResult.error.message}`)
  if (levelsResult.error) throw new Error(`無法讀取自然科等級：${levelsResult.error.message}`)

  const levelByStudent = new Map((levelsResult.data || []).map((row) => [row.student_id, row]))
  return (studentsResult.data || []).map((student) => {
    const level = mapLearningLevel(levelByStudent.get(student.id))
    return {
      id: student.id,
      studentId: student.student_id_code,
      seatNumber: student.seat_number,
      name: student.full_name,
      className: relation(student.classes)?.name || '',
      ...level,
    }
  })
}

export async function setStudentScienceLevel({ studentId, level }, client = requireSupabase()) {
  const normalizedLevel = normalizePeriodicLevel(level)
  if (normalizedLevel === 'complete') throw new Error('完整模式不可設為每日任務等級。')
  const { data, error } = await client.rpc('admin_set_student_learning_level', {
    p_student_id: studentId,
    p_subject_code: 'science',
    p_level_code: normalizedLevel,
  })
  if (error) {
    const denied = error.message?.includes('admin_required')
    throw new Error(denied ? '目前帳號沒有調整學生自然科等級的權限。' : `無法調整自然科等級：${error.message}`)
  }
  return data
}
