export function resolveSelectedFocusTask(pendingTasks, selectedTaskId = '') {
  if (!Array.isArray(pendingTasks) || pendingTasks.length === 0) return null
  return pendingTasks.find((task) => task.id === selectedTaskId) || pendingTasks[0]
}
