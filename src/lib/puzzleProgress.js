export function accountPuzzleProgressKey(game, accountId, puzzleId) {
  const normalizedGame = String(game || '').trim()
  const normalizedAccountId = String(accountId || '').trim()
  const normalizedPuzzleId = String(puzzleId || '').trim()
  if (!normalizedGame || !normalizedAccountId || !normalizedPuzzleId) return ''
  return `sljh-${normalizedGame}-progress-v2:${encodeURIComponent(normalizedAccountId)}:${encodeURIComponent(normalizedPuzzleId)}`
}
