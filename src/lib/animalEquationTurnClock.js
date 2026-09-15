export const ADVANCE_RETRY_MS = 3000

export function secondsUntilDeadline(deadline, nowMs = Date.now()) {
  const deadlineMs = new Date(deadline).getTime()
  if (!Number.isFinite(deadlineMs)) return null
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000))
}

export function shouldRequestDeadlineAdvance({ secondsLeft, busy, nowMs, lastAttemptMs }) {
  return secondsLeft === 0 && !busy && nowMs - lastAttemptMs >= ADVANCE_RETRY_MS
}
