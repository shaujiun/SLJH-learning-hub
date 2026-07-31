const DAY_MS = 24 * 60 * 60 * 1000

export function toLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function startOfWeek(input = new Date()) {
  const date = new Date(input)
  date.setHours(12, 0, 0, 0)
  const mondayOffset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - mondayOffset)
  return toLocalDateString(date)
}

export function addDays(dateString, count) {
  const date = new Date(`${dateString}T12:00:00`)
  return toLocalDateString(new Date(date.getTime() + count * DAY_MS))
}

export function createSeededRandom(seedText) {
  let seed = 2166136261
  for (const char of String(seedText)) {
    seed ^= char.charCodeAt(0)
    seed = Math.imul(seed, 16777619)
  }
  return () => {
    seed += 0x6d2b79f5
    let value = seed
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function randomInteger(random, minimum, maximum) {
  return minimum + Math.floor(random() * (maximum - minimum + 1))
}

function shuffled(items, random) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function questionCountFor(activity, groupCode) {
  if (String(groupCode).toUpperCase() === 'A') {
    return activity.questionCountA ?? 20
  }
  return activity.questionCountB ?? 10
}

/**
 * 建立一週的專注任務草稿。
 * 每科先決定 1～3 次的週目標，再分配到週一至週五；每天最多 4 項。
 */
export function buildWeeklyDraft({
  studentId,
  weekStart,
  subjects,
  groupBySubject = {},
  dailyMaximum = 4,
  seed = `${studentId}:${weekStart}`,
}) {
  const random = createSeededRandom(seed)
  const tasks = []
  const dailyCounts = new Map(Array.from({ length: 5 }, (_, index) => [index, 0]))

  for (const subject of subjects.filter((item) => item.isActive !== false)) {
    const activities = subject.activities?.filter((item) => item.isActive !== false) || []
    if (activities.length === 0) continue

    const weeklyMinimum = Math.max(1, subject.weeklyMinimum ?? 1)
    const weeklyMaximum = Math.max(weeklyMinimum, Math.min(3, subject.weeklyMaximum ?? 3))
    const weeklyTarget = randomInteger(random, weeklyMinimum, weeklyMaximum)
    const activityBag = shuffled(activities, random)

    for (let taskIndex = 0; taskIndex < weeklyTarget; taskIndex += 1) {
      const availableDays = shuffled(
        Array.from(dailyCounts.entries())
          .filter(([, count]) => count < dailyMaximum)
          .map(([day]) => day),
        random,
      )
      if (availableDays.length === 0) break

      const minimumLoad = Math.min(...availableDays.map((day) => dailyCounts.get(day)))
      const balancedDays = availableDays.filter((day) => dailyCounts.get(day) <= minimumLoad + 1)
      const dayOffset = balancedDays[Math.floor(random() * balancedDays.length)]
      const activity = activityBag[taskIndex % activityBag.length]
      const groupCode = groupBySubject[subject.code] || 'B'

      dailyCounts.set(dayOffset, dailyCounts.get(dayOffset) + 1)
      tasks.push({
        clientKey: `${subject.code}:${taskIndex + 1}`,
        assignedDate: addDays(weekStart, dayOffset),
        subjectCode: subject.code,
        subjectName: subject.name,
        activityCode: activity.code,
        activityName: activity.name,
        launchUrl: activity.launchUrl || subject.launchUrl,
        groupCode,
        questionCount: questionCountFor(activity, groupCode),
        targetScore: activity.targetScore ?? 80,
      })
    }
  }

  return tasks.sort((left, right) => (
    left.assignedDate.localeCompare(right.assignedDate)
      || left.subjectCode.localeCompare(right.subjectCode)
  ))
}

/**
 * 週末不新增任務，只從未完成的平日任務中保留約 70％。
 */
export function selectWeekendCarryover(tasks, seed) {
  const unfinished = tasks.filter((task) => task.status !== 'completed')
  if (unfinished.length === 0) return []

  const random = createSeededRandom(seed)
  const carryCount = Math.max(1, Math.round(unfinished.length * 0.7))
  return shuffled(unfinished, random).slice(0, carryCount)
}

export function tasksForDate(tasks, referenceDate, weekStart, seed) {
  const date = typeof referenceDate === 'string' ? referenceDate : toLocalDateString(referenceDate)
  const dayIndex = Math.round((new Date(`${date}T12:00:00`) - new Date(`${weekStart}T12:00:00`)) / DAY_MS)
  if (dayIndex >= 5 && dayIndex <= 6) {
    return selectWeekendCarryover(tasks, `${seed}:weekend`)
  }
  return tasks.filter((task) => task.assignedDate === date)
}
