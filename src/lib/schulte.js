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

export const dynamicSchulteLevels = {
  20: {
    itemCount: 20,
    label: '入門',
    rangeLabel: '1～20',
    description: '先熟悉緩慢轉動中的視覺搜尋。',
    ringCounts: [4, 6, 9],
  },
  35: {
    itemCount: 35,
    label: '進階',
    rangeLabel: '1～35',
    description: '在更多移動目標中維持搜尋順序。',
    ringCounts: [6, 11, 17],
  },
  50: {
    itemCount: 50,
    label: '挑戰',
    rangeLabel: '1～50',
    description: '練習長時間穩定搜尋與注意力切換。',
    ringCounts: [8, 16, 25],
  },
}

export const shapeSchulteConfig = {
  size: 5,
  copiesPerShape: 5,
  shapes: [
    { code: 'circle', label: '圓形' },
    { code: 'triangle', label: '三角形' },
    { code: 'square', label: '正方形' },
    { code: 'star', label: '星形' },
    { code: 'heart', label: '愛心' },
  ],
}

const phrasePunctuationPattern = /[\s，。！？、；：「」『』（）《》〈〉…—,.!?;:'"()[\]{}-]/u
const defaultPhraseDistractors = Array.from('天地山水日月風雨花草人物大小上下左右前後多少你我他學習知心力行春夏秋冬東南西北紅黃藍綠黑白')
const phraseConfusionMap = {
  處: ['外', '虎'],
  鳥: ['烏', '島'],
  己: ['已', '巳'],
  已: ['己', '巳'],
  未: ['末', '朱'],
  人: ['入', '八'],
  土: ['士', '王'],
  日: ['目', '白'],
  木: ['本', '禾'],
  天: ['夭', '夫'],
  說: ['悅', '脫'],
  聞: ['問', '間'],
  學: ['覺', '字'],
  生: ['王', '牛'],
  心: ['必', '忄'],
}

export const defaultSchultePhrases = [
  {
    id: 'default-analects-1',
    category: 'quote',
    title: '學而時習之',
    content: '學而時習之，不亦說乎。',
    meaning: '學到知識後常常溫習，也是一件令人喜悅的事。',
    source: '《論語・學而》',
    isActive: true,
  },
  {
    id: 'default-mencius-1',
    category: 'quote',
    title: '天將降大任',
    content: '生於憂患，死於安樂。',
    meaning: '保持警覺並面對磨練，能幫助人成長；沉溺安逸可能帶來危機。',
    source: '《孟子・告子下》',
    isActive: true,
  },
  {
    id: 'default-spring-dawn',
    category: 'poem',
    title: '春曉',
    content: '春眠不覺曉，處處聞啼鳥。',
    meaning: '春夜睡得安穩，不知不覺天亮了，到處都聽得到鳥叫聲。',
    source: '唐・孟浩然',
    isActive: true,
  },
]

export function isPhrasePunctuation(character) {
  return phrasePunctuationPattern.test(String(character || ''))
}

export function phraseCharacters(content) {
  return Array.from(String(content || '')).filter((character) => !isPhrasePunctuation(character))
}

export function createPhraseSchulteLayout(content, customDistractors = '', random = Math.random) {
  const answerCharacters = phraseCharacters(content)
  if (answerCharacters.length > 25) throw new Error('phrase_exceeds_5x5_grid')
  const answerSet = new Set(answerCharacters)
  const requestedDistractors = Array.from(String(customDistractors || ''))
    .filter((character) => !isPhrasePunctuation(character) && !answerSet.has(character))
  const similarDistractors = answerCharacters.flatMap((character) => phraseConfusionMap[character] || [])
    .filter((character) => !answerSet.has(character))
  const fallbackDistractors = defaultPhraseDistractors.filter((character) => !answerSet.has(character))
  const distractorPool = [...new Set([
    ...requestedDistractors,
    ...similarDistractors,
    ...fallbackDistractors,
  ])]
  const distractorCount = 25 - answerCharacters.length
  const tiles = answerCharacters.map((character, index) => ({
    id: `answer-${index}-${character.codePointAt(0)}`,
    character,
    isAnswer: true,
  }))
  for (let index = 0; index < distractorCount; index += 1) {
    const character = distractorPool[index % distractorPool.length]
    tiles.push({
      id: `distractor-${index}-${character.codePointAt(0)}`,
      character,
      isAnswer: false,
    })
  }

  for (let index = tiles.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]]
  }
  return { tiles, totalCharacters: answerCharacters.length, gridSize: 5 }
}

export function applyPhraseSchulteTap({ expectedCharacter, tappedCharacter, expectedIndex, tappedTargetIndex, totalCharacters }) {
  const matched = expectedCharacter == null
    ? tappedTargetIndex === expectedIndex
    : tappedCharacter === expectedCharacter
  if (!matched) {
    return { correct: false, completed: false, nextExpectedIndex: 0 }
  }
  const nextExpectedIndex = expectedIndex + 1
  return {
    correct: true,
    completed: nextExpectedIndex === totalCharacters,
    nextExpectedIndex,
  }
}

export function phraseProgress(content, selectedCount) {
  let characterIndex = 0
  return Array.from(String(content || '')).map((character) => {
    if (isPhrasePunctuation(character)) return character
    const visible = characterIndex < selectedCount
    characterIndex += 1
    return visible ? character : '＿'
  }).join('')
}

export function normalizeDynamicSchulteCount(value) {
  const parsed = Number(value)
  return dynamicSchulteLevels[parsed] ? parsed : 20
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

export function createDynamicSchulteLayout(itemCount, random = Math.random) {
  const normalizedCount = normalizeDynamicSchulteCount(itemCount)
  const level = dynamicSchulteLevels[normalizedCount]
  const numbers = Array.from({ length: normalizedCount - 1 }, (_, index) => index + 2)

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[numbers[index], numbers[swapIndex]] = [numbers[swapIndex], numbers[index]]
  }

  let offset = 0
  const rings = level.ringCounts.map((ringCount) => {
    const ring = numbers.slice(offset, offset + ringCount)
    offset += ringCount
    return ring
  })

  return {
    center: 1,
    rings,
    direction: random() < 0.5 ? 'clockwise' : 'counterclockwise',
  }
}

export function createShapeSchulteLayout(random = Math.random) {
  const tiles = shapeSchulteConfig.shapes.flatMap((shape) => (
    Array.from({ length: shapeSchulteConfig.copiesPerShape }, (_, copyIndex) => ({
      id: `${shape.code}-${copyIndex + 1}`,
      shapeCode: shape.code,
      shapeLabel: shape.label,
    }))
  ))

  for (let index = tiles.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[tiles[index], tiles[swapIndex]] = [tiles[swapIndex], tiles[index]]
  }

  const targetIndex = Math.min(
    shapeSchulteConfig.shapes.length - 1,
    Math.floor(random() * shapeSchulteConfig.shapes.length),
  )
  const target = shapeSchulteConfig.shapes[targetIndex]
  const matchingTiles = tiles.filter((tile) => tile.shapeCode === target.code)
  const hintIndex = Math.min(
    matchingTiles.length - 1,
    Math.floor(random() * matchingTiles.length),
  )

  return {
    tiles,
    targetShapeCode: target.code,
    targetShapeLabel: target.label,
    hintTileId: matchingTiles[hintIndex].id,
    totalMatches: matchingTiles.length,
  }
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

export function applyShapeSchulteTap({
  targetShapeCode,
  tappedShapeCode,
  matchedCount,
  totalMatches,
}) {
  if (tappedShapeCode !== targetShapeCode) {
    return {
      correct: false,
      completed: false,
      nextMatchedCount: 0,
    }
  }

  const nextMatchedCount = Math.min(totalMatches, matchedCount + 1)
  return {
    correct: true,
    completed: nextMatchedCount === totalMatches,
    nextMatchedCount,
  }
}

export function calculateDynamicSchulteResult({ itemCount, durationMs, errorCount }) {
  const normalizedCount = normalizeDynamicSchulteCount(itemCount)
  const safeDuration = Math.max(0, Math.round(Number(durationMs) || 0))
  const safeErrors = Math.max(0, Math.round(Number(errorCount) || 0))

  return {
    mode: 'dynamic',
    size: normalizedCount,
    totalNumbers: normalizedCount,
    durationMs: safeDuration,
    errorCount: safeErrors,
    averageTapMs: Math.round(safeDuration / normalizedCount),
  }
}

export function calculateShapeSchulteResult({ durationMs, errorCount }) {
  const safeDuration = Math.max(0, Math.round(Number(durationMs) || 0))
  const safeErrors = Math.max(0, Math.round(Number(errorCount) || 0))

  return {
    mode: 'shape',
    size: shapeSchulteConfig.size,
    totalNumbers: shapeSchulteConfig.copiesPerShape,
    durationMs: safeDuration,
    errorCount: safeErrors,
    averageTapMs: Math.round(safeDuration / shapeSchulteConfig.copiesPerShape),
  }
}

export function calculatePhraseSchulteResult({ content, durationMs, errorCount }) {
  const totalCharacters = phraseCharacters(content).length
  const safeDuration = Math.max(0, Math.round(Number(durationMs) || 0))
  const safeErrors = Math.max(0, Math.round(Number(errorCount) || 0))
  return {
    mode: 'sentence',
    size: totalCharacters,
    totalNumbers: totalCharacters,
    durationMs: safeDuration,
    errorCount: safeErrors,
    averageTapMs: totalCharacters > 0 ? Math.round(safeDuration / totalCharacters) : 0,
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

export function bestDynamicSchulteRecord(records, itemCount) {
  const normalizedCount = normalizeDynamicSchulteCount(itemCount)
  return records
    .filter((record) => (
      record.mode === 'dynamic'
      && Number(record.size) === normalizedCount
    ))
    .sort((left, right) => left.durationMs - right.durationMs)[0] || null
}

export function bestShapeSchulteRecord(records) {
  return records
    .filter((record) => record.mode === 'shape')
    .sort((left, right) => left.durationMs - right.durationMs)[0] || null
}


export function bestPhraseSchulteRecord(records) {
  return records
    .filter((record) => record.mode === 'sentence')
    .sort((left, right) => left.durationMs - right.durationMs)[0] || null
}
