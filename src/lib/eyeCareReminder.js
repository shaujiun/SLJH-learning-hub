import { summarizeWeeklyProgress } from './weeklyProgress.js'

const ONE_HOUR_MS = 60 * 60 * 1000

function taipeiDateString(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function getEyeCareReminder(tasks = [], referenceDate = new Date(), minimumPending = 5) {
  const now = referenceDate instanceof Date ? referenceDate : new Date(referenceDate)
  if (Number.isNaN(now.getTime())) return null

  const summary = summarizeWeeklyProgress(tasks, now)
  if (summary.pendingTasks.length < minimumPending) return null

  const today = taipeiDateString(now)
  const recentCompletion = tasks
    .filter((task) => task.status === 'completed' && task.completedAt)
    .map((task) => ({ task, completedAt: new Date(task.completedAt) }))
    .filter(({ completedAt }) => (
      !Number.isNaN(completedAt.getTime())
      && taipeiDateString(completedAt) === today
      && now.getTime() >= completedAt.getTime()
      && now.getTime() - completedAt.getTime() < ONE_HOUR_MS
    ))
    .sort((left, right) => right.completedAt.getTime() - left.completedAt.getTime())[0]

  if (!recentCompletion) return null

  const elapsedMs = now.getTime() - recentCompletion.completedAt.getTime()
  return {
    key: `${recentCompletion.task.id}:${recentCompletion.task.completedAt}`,
    pendingCount: summary.pendingTasks.length,
    completedAt: recentCompletion.task.completedAt,
    remainingMinutes: Math.max(1, Math.ceil((ONE_HOUR_MS - elapsedMs) / 60000)),
  }
}
