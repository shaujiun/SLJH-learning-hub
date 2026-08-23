function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function describePendingTask(task) {
  if (task.subjectCode === 'focus_training') {
    return '尚未留下與本週任務連結的完成紀錄'
  }
  if (Number.isFinite(Number(task.bestScore))) {
    return `最高 ${Number(task.bestScore)} 分／目標 ${Number(task.targetScore || 0)} 分`
  }
  return `尚未留下達標紀錄／目標 ${Number(task.targetScore || 0)} 分`
}

export function summarizeWeeklyProgress(tasks = [], referenceDate = new Date()) {
  const today = typeof referenceDate === 'string' ? referenceDate : localDateString(referenceDate)
  const dueTasks = tasks.filter((task) => (
    task.status !== 'expired'
    && (!task.assignedDate || task.assignedDate <= today)
  ))
  const completedTasks = dueTasks.filter((task) => task.status === 'completed')
  const pendingTasks = dueTasks.filter((task) => task.status !== 'completed')
  const futureTasks = tasks.filter((task) => (
    task.status !== 'expired'
    && task.assignedDate
    && task.assignedDate > today
  ))
  const percentage = dueTasks.length === 0
    ? 0
    : Math.round((completedTasks.length / dueTasks.length) * 100)
  const subjects = Object.values(dueTasks.reduce((summary, task) => {
    const key = task.subjectCode || task.subjectName
    const current = summary[key] || {
      code: key,
      name: task.subjectName,
      total: 0,
      completed: 0,
    }
    current.total += 1
    if (task.status === 'completed') current.completed += 1
    summary[key] = current
    return summary
  }, {}))

  return {
    completed: completedTasks.length,
    total: dueTasks.length,
    percentage,
    subjects,
    pendingTasks,
    futureCount: futureTasks.length,
  }
}
