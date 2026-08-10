export const schulteSizes = {
  4: {
    size: 4,
    label: '入門',
    rangeLabel: '1～16',
    description: '先熟悉由小到大的搜尋節奏。',
  },
  5: {
    size: 5,
    label: '標準',
    rangeLabel: '1～25',
    description: '練習穩定移動視線與維持專注。',
  },
  6: {
    size: 6,
    label: '挑戰',
    rangeLabel: '1～36',
    description: '在更多資訊中維持搜尋順序。',
  },
}

export function normalizeSchulteSize(value) {
  const parsed = Number(value)
  return schulteSizes[parsed] ? parsed : 4
}

export function schulteTaskSizeForCompletions(completedCount) {
  const normalizedCount = Math.max(0, Math.floor(Number(completedCount) || 0))
  if (normalizedCount < 5) return 4
  if (normalizedCount < 10) return 5
  return 6
}

export function shuffleSchulteNumbers(size, random = Math.random) {
  const normalizedSize = normalizeSchulteSize(size)
  const numbers = Array.from(
    { length: normalizedSize * normalizedSize },
    (_, index) => index + 1,
  )

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]]
  }

  return numbers
}

export function applySchulteTap({ expectedNumber, tappedNumber, totalNumbers }) {
  if (tappedNumber !== expectedNumber) {
    return {
      correct: false,
      completed: false,
      nextExpectedNumber: 1,
    }
  }

  const completed = expectedNumber === totalNumbers
  return {
    correct: true,
    completed,
    nextExpectedNumber: completed ? totalNumbers + 1 : expectedNumber + 1,
  }
}

export function calculateSchulteResult({ size, durationMs, errorCount }) {
  const normalizedSize = normalizeSchulteSize(size)
  const totalNumbers = normalizedSize * normalizedSize
  const safeDuration = Math.max(0, Math.round(Number(durationMs) || 0))
  const safeErrors = Math.max(0, Math.round(Number(errorCount) || 0))

  return {
    size: normalizedSize,
    totalNumbers,
    durationMs: safeDuration,
    errorCount: safeErrors,
    averageTapMs: totalNumbers > 0 ? Math.round(safeDuration / totalNumbers) : 0,
  }
}

export function formatSchulteDuration(durationMs) {
  const totalTenths = Math.max(0, Math.round(Number(durationMs) / 100))
  const minutes = Math.floor(totalTenths / 600)
  const seconds = Math.floor((totalTenths % 600) / 10)
  const tenths = totalTenths % 10
  return minutes > 0
    ? `${minutes} 分 ${String(seconds).padStart(2, '0')}.${tenths} 秒`
    : `${seconds}.${tenths} 秒`
}

export function mergeSchulteRecords(localRecords = [], remoteRecords = []) {
  const byKey = new Map()
  for (const record of [...remoteRecords, ...localRecords]) {
    const key = record.id || [
      record.size,
      record.durationMs,
      record.errorCount,
      record.completedAt,
    ].join(':')
    if (!byKey.has(key)) byKey.set(key, record)
  }
  return [...byKey.values()]
    .sort((left, right) => String(right.completedAt).localeCompare(String(left.completedAt)))
}

export function bestSchulteRecord(records, size) {
  const normalizedSize = normalizeSchulteSize(size)
  return records
    .filter((record) => Number(record.size) === normalizedSize)
    .sort((left, right) => left.durationMs - right.durationMs)[0] || null
}
