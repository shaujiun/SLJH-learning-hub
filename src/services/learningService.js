import { requireSupabase } from '../lib/supabase.js'
import { startOfWeek, toLocalDateString } from '../lib/focusPlanner.js'
import {
  getLearningAudienceLabel,
  isLearningSystemVisible,
  normalizeLearningAudience,
} from '../lib/learningAudiences.js'

function relation(value) {
  return Array.isArray(value) ? value[0] : value
}

function mapSystem(row) {
  return {
    id: row.id,
    code: row.subject_code,
    name: row.subject_name,
    description: row.description,
    launchUrl: row.launch_url,
    weeklyMinimum: row.weekly_minimum,
    weeklyMaximum: row.weekly_maximum,
    audienceScope: normalizeLearningAudience(row.audience_scope),
    audienceLabel: getLearningAudienceLabel(row.audience_scope),
    activities: (row.learning_activities || [])
      .filter((activity) => activity.is_active)
      .sort((left, right) => left.display_order - right.display_order)
      .map((activity) => ({
        id: activity.id,
        code: activity.activity_code,
        name: activity.activity_name,
        targetScore: activity.target_score,
      })),
  }
}

function mapTask(row) {
  return {
    id: row.id,
    assignedDate: row.assigned_date,
    subjectCode: row.subject_code,
    subjectName: row.subject_name,
    activityCode: row.activity_code,
    activityName: row.activity_name,
    launchUrl: row.launch_url,
    groupCode: row.group_code,
    questionCount: row.question_count,
    targetScore: row.target_score,
    status: row.status,
    bestScore: row.best_score,
    completedAt: row.completed_at,
    isWeekendCarryover: row.is_weekend_carryover,
  }
}

export function mapMemorizationTask(batch, assignedDate, currentUrl = window.location.href) {
  if (!batch?.setId) return null
  const launchUrl = new URL(currentUrl)
  launchUrl.search = 'game=schulte-memorization'
  launchUrl.hash = ''
  const passed = batch.passed === true
  return {
    id: `schulte-memorization:${batch.setId}`,
    assignedDate,
    subjectCode: 'focus_training',
    subjectName: '專注力訓練',
    activityCode: 'schulte_memorization',
    activityName: `週五名言佳句背誦（${batch.items?.length || 5} 句）`,
    launchUrl: launchUrl.toString(),
    groupCode: 'COMMON',
    questionCount: 5,
    targetScore: 100,
    status: passed ? 'completed' : 'pending',
    bestScore: passed ? 100 : null,
    completedAt: null,
    attemptCount: Number(batch.attemptCount || 0),
    isWeekendCarryover: true,
  }
}

export function buildDashboardTaskLists(dailyTasks, weeklyTasks, memorizationTask) {
  return {
    tasks: dailyTasks,
    weeklyTasks: memorizationTask ? [memorizationTask, ...weeklyTasks] : weeklyTasks,
  }
}

export async function loadLearningDashboard(referenceDate = new Date()) {
  const client = requireSupabase()
  const date = typeof referenceDate === 'string'
    ? referenceDate
    : toLocalDateString(referenceDate)

  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError
  if (!sessionData.session?.user) return { authenticated: false }

  const userId = sessionData.session.user.id
  const [profileResult, studentResult, systemsResult] = await Promise.all([
    client
      .from('contact_book_profiles')
      .select('username,display_name,user_type,approval_status,is_active')
      .eq('id', userId)
      .maybeSingle(),
    client
      .from('students')
      .select('id,student_id_code,seat_number,full_name,class_id,classes!inner(name,grade_level,class_number)')
      .eq('profile_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
    client
      .from('learning_systems')
      .select('id,subject_code,subject_name,description,launch_url,display_order,weekly_minimum,weekly_maximum,audience_scope,is_active,learning_activities(id,activity_code,activity_name,target_score,display_order,is_active)')
      .eq('is_active', true)
      .order('display_order'),
  ])

  if (profileResult.error) throw profileResult.error
  if (studentResult.error) throw studentResult.error
  if (systemsResult.error) {
    const error = new Error('專注任務資料庫尚未安裝，請先完成第一階段資料庫設定。')
    error.cause = systemsResult.error
    throw error
  }

  const profile = profileResult.data
  const student = studentResult.data
  const systems = (systemsResult.data || []).map(mapSystem)

  if (!student) {
    return {
      authenticated: true,
      role: profile?.user_type || 'staff',
      profile: {
        displayName: profile?.display_name || profile?.username || '老師',
        username: profile?.username || '',
      },
      systems,
      tasks: [],
      weeklyTasks: [],
    }
  }

  const [taskResult, mathGroupResult, englishGroupResult, memorizationResult] = await Promise.all([
    client.rpc('prepare_student_focus_tasks', { p_reference_date: date }),
    client.rpc('resolve_student_learning_group', {
      p_student_id: student.id,
      p_subject_code: 'math',
      p_reference_date: date,
    }),
    client.rpc('resolve_student_learning_group', {
      p_student_id: student.id,
      p_subject_code: 'english',
      p_reference_date: date,
    }),
    client.rpc('get_my_schulte_memorization_batch', { p_reference_date: date }),
  ])
  const { data: taskRows, error: taskError } = taskResult
  if (taskError) throw new Error(`無法建立今日專注任務：${taskError.message}`)
  if (mathGroupResult.error || englishGroupResult.error) {
    const groupError = mathGroupResult.error || englishGroupResult.error
    throw new Error(`無法確認學生分組：${groupError.message}`)
  }
  if (memorizationResult.error) throw new Error(`無法確認週五背誦任務：${memorizationResult.error.message}`)

  const weekStart = startOfWeek(new Date(`${date}T12:00:00`))
  const { data: weeklyRows, error: weeklyError } = await client
    .from('student_focus_tasks')
    .select('id,status,subject_code_snapshot,subject_name_snapshot,activity_name_snapshot,group_code_snapshot,question_count,target_score,best_score,assigned_date')
    .eq('student_id', student.id)
    .eq('week_start', weekStart)
    .order('assigned_date')
  if (weeklyError) throw weeklyError

  const classInfo = relation(student.classes)
  const groupBySubject = {
    math: String(mathGroupResult.data || 'B').toUpperCase(),
    english: String(englishGroupResult.data || 'B').toUpperCase(),
  }
  const visibleSystems = systems.filter((system) => isLearningSystemVisible(system, groupBySubject))
  const visibleSystemCodes = new Set(visibleSystems.map((system) => system.code))
  const visibleTaskRows = (taskRows || []).filter((row) => visibleSystemCodes.has(row.subject_code))
  const visibleWeeklyRows = (weeklyRows || []).filter((row) => visibleSystemCodes.has(row.subject_code_snapshot))
  const mappedTasks = visibleTaskRows.map(mapTask)
  const memorizationBatch = memorizationResult.data
  const memorizationTask = memorizationBatch && visibleSystemCodes.has('focus_training')
    ? mapMemorizationTask(memorizationBatch, date)
    : null

  const mappedWeeklyTasks = visibleWeeklyRows.map((row) => ({
    id: row.id,
    status: row.status,
    subjectCode: row.subject_code_snapshot,
    subjectName: row.subject_name_snapshot,
    activityName: row.activity_name_snapshot,
    groupCode: row.group_code_snapshot,
    questionCount: row.question_count,
    targetScore: row.target_score,
    bestScore: row.best_score,
    assignedDate: row.assigned_date,
  }))
  const taskLists = buildDashboardTaskLists(mappedTasks, mappedWeeklyTasks, memorizationTask)

  return {
    authenticated: true,
    role: 'student',
    profile: {
      displayName: student.full_name,
      username: student.student_id_code,
    },
    student: {
      id: student.id,
      seatNumber: student.seat_number,
      className: classInfo?.name || '',
    },
    systems: visibleSystems,
    groupBySubject,
    tasks: taskLists.tasks,
    weeklyTasks: taskLists.weeklyTasks,
  }
}

export async function signOutEverywhere() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export function buildTaskLaunchUrl(task) {
  const url = new URL(task.launchUrl)
  url.searchParams.set('focusTask', task.id)
  url.searchParams.set('focusActivity', task.activityCode)
  url.searchParams.set('focusQuestions', String(task.questionCount))
  url.searchParams.set('focusTarget', String(task.targetScore))
  url.searchParams.set('focusSource', 'daily-task')
  return url.toString()
}
