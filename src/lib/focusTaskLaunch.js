export const focusTaskLaunchStorageKey = 'sljh.focusTaskLaunch.v1'

const focusTaskContextTtlMs = 4 * 60 * 60 * 1000
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function browserSessionStorage() {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function rememberFocusTaskLaunch(task, storage = browserSessionStorage(), now = Date.now()) {
  if (!storage || !uuidPattern.test(String(task?.id || ''))) return false
  try {
    storage.setItem(focusTaskLaunchStorageKey, JSON.stringify({
      taskId: task.id,
      subjectCode: String(task.subjectCode || '').toLowerCase(),
      activityCode: String(task.activityCode || '').toLowerCase(),
      expiresAt: now + focusTaskContextTtlMs,
    }))
    return true
  } catch {
    return false
  }
}

export function readRememberedFocusTask({
  subjectCode = '',
  activityCode = '',
  activityPrefix = '',
} = {}, storage = browserSessionStorage(), now = Date.now()) {
  if (!storage) return null
  try {
    const saved = JSON.parse(storage.getItem(focusTaskLaunchStorageKey) || 'null')
    if (!saved || !uuidPattern.test(String(saved.taskId || '')) || Number(saved.expiresAt) <= now) {
      storage.removeItem(focusTaskLaunchStorageKey)
      return null
    }
    const expectedSubject = String(subjectCode || '').toLowerCase()
    const expectedActivity = String(activityCode || '').toLowerCase()
    const expectedPrefix = String(activityPrefix || '').toLowerCase()
    const savedSubject = String(saved.subjectCode || '').toLowerCase()
    const savedActivity = String(saved.activityCode || '').toLowerCase()
    if (expectedSubject && savedSubject !== expectedSubject) return null
    if (expectedActivity && savedActivity !== expectedActivity) return null
    if (expectedPrefix && !savedActivity.startsWith(expectedPrefix)) return null
    return saved
  } catch {
    return null
  }
}

export function resolveFocusTaskId(searchParams, expected = {}, storage = browserSessionStorage()) {
  const requestedId = String(searchParams?.get?.('focusTask') || '')
  if (uuidPattern.test(requestedId)) return requestedId
  return readRememberedFocusTask(expected, storage)?.taskId || ''
}

export function clearRememberedFocusTask(taskId = '', storage = browserSessionStorage()) {
  if (!storage) return
  try {
    if (taskId) {
      const saved = JSON.parse(storage.getItem(focusTaskLaunchStorageKey) || 'null')
      if (saved?.taskId !== taskId) return
    }
    storage.removeItem(focusTaskLaunchStorageKey)
  } catch {
    // A blocked sessionStorage must not prevent the learning game from finishing.
  }
}
