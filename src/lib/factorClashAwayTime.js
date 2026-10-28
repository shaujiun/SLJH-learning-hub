export const MAX_FACTOR_CLASH_AWAY_SECONDS = 24 * 60 * 60

export function normalizeFactorClashAwaySeconds(value) {
  const seconds = Number(value)
  if (!Number.isFinite(seconds) || seconds <= 0) return 0
  return Math.min(MAX_FACTOR_CLASH_AWAY_SECONDS, Math.round(seconds))
}

export function calculateFactorClashAwaySeconds(hiddenAtMs, visibleAtMs = Date.now()) {
  const hiddenAt = Number(hiddenAtMs)
  const visibleAt = Number(visibleAtMs)
  if (!Number.isFinite(hiddenAt) || !Number.isFinite(visibleAt) || hiddenAt <= 0 || visibleAt < hiddenAt) return 0
  return normalizeFactorClashAwaySeconds((visibleAt - hiddenAt) / 1000)
}
