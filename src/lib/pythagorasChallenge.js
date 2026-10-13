const INTEGER_SPECIAL_TRIPLES = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [9, 40, 41],
]

const MISCONCEPTION_LEG_PAIRS = [
  [4, 5],
  [5, 6],
  [6, 7],
  [5, 13],
  [8, 17],
  [7, 25],
  [9, 41],
]

export const PYTHAGORAS_GROUP_RULES = {
  A: {
    label: 'A 組',
    integerLimit: 100,
    radicandLimit: 1000,
    description: '整數邊長不超過 100；答案保留根號時，根號內不超過 1000，混合一般題、特殊關係與易錯題。',
  },
  B: {
    label: 'B 組',
    integerLimit: 30,
    radicandLimit: 100,
    description: '整數邊長不超過 30；答案保留根號時，根號內不超過 100；特殊邊長關係題比例較高。',
  },
}

export function normalizePythagorasGroup(group) {
  return String(group || '').toUpperCase() === 'A' ? 'A' : 'B'
}

function randomInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function shufflePythagoras(values, rng = Math.random) {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export function simplifyRadical(radicand) {
  const safeRadicand = Math.max(1, Math.round(Number(radicand) || 1))
  let coefficient = 1
  let remainder = safeRadicand
  for (let factor = 2; factor * factor <= remainder; factor += 1) {
    const square = factor * factor
    while (remainder % square === 0) {
      coefficient *= factor
      remainder /= square
    }
  }
  if (remainder === 1) return { kind: 'integer', value: coefficient }
  return { kind: 'radical', coefficient, radicand: remainder }
}

export function integerValue(value) {
  return { kind: 'integer', value: Math.round(value) }
}

export function scaledRadicalValue(coefficient, radicand) {
  const simplified = simplifyRadical(coefficient * coefficient * radicand)
  return simplified.kind === 'integer'
    ? simplified
    : { ...simplified, sourceCoefficient: coefficient, sourceRadicand: radicand }
}

export function pythagorasValueNumber(value) {
  if (!value) return 0
  if (value.kind === 'integer') return value.value
  return value.coefficient * Math.sqrt(value.radicand)
}

export function pythagorasValueText(value) {
  if (!value) return '?'
  if (value.kind === 'integer') return String(value.value)
  return `${value.coefficient === 1 ? '' : value.coefficient}√${value.radicand}`
}

export function calculatePythagorasTriangleSize(a, b, {
  maxWidth = 360,
  maxHeight = 220,
  minimumVisibleLeg = 48,
} = {}) {
  const safeA = Math.max(0.001, Number(a) || 0.001)
  const safeB = Math.max(0.001, Number(b) || 0.001)
  const scale = Math.min(maxWidth / safeA, maxHeight / safeB)
  return {
    width: Math.max(minimumVisibleLeg, safeA * scale),
    height: Math.max(minimumVisibleLeg, safeB * scale),
    preservedRatio: safeA * scale >= minimumVisibleLeg && safeB * scale >= minimumVisibleLeg,
  }
}

function expressionText(value) {
  return pythagorasValueText(value)
}

function makeQuestion({ a, b, c, target, relation, angleHint = '', commonMistake = '', calculationRadicand }) {
  const answer = { a, b, c }[target]
  const known = {
    a: target === 'a' ? null : a,
    b: target === 'b' ? null : b,
    c: target === 'c' ? null : c,
  }
  const kind = target === 'c' ? 'hypotenuse' : 'leg'
  const knownLeg = target === 'a' ? b : a
  const rawRadicand = calculationRadicand ?? (kind === 'hypotenuse'
    ? Math.round(pythagorasValueNumber(a) ** 2 + pythagorasValueNumber(b) ** 2)
    : Math.round(pythagorasValueNumber(c) ** 2 - pythagorasValueNumber(knownLeg) ** 2))
  const explain = kind === 'hypotenuse'
    ? `斜邊 = √(${expressionText(a)}² + ${expressionText(b)}²) = ${expressionText(c)}`
    : `缺少的股長 = √(${expressionText(c)}² − ${expressionText(knownLeg)}²) = ${expressionText(answer)}`

  return {
    id: `${target}:${pythagorasValueText(a)}:${pythagorasValueText(b)}:${pythagorasValueText(c)}:${angleHint}`,
    kind,
    target,
    relation,
    sides: known,
    exactSides: { a, b, c },
    answer,
    answerText: pythagorasValueText(answer),
    calculationRadicand: rawRadicand,
    angleHint,
    commonMistake,
    prompt: kind === 'hypotenuse'
      ? '已知兩股長，請計算斜邊長度。'
      : '已知斜邊與一股長，請計算另一股長。',
    explain,
  }
}

function availableIntegerSpecials(group) {
  const limit = PYTHAGORAS_GROUP_RULES[normalizePythagorasGroup(group)].integerLimit
  const triples = []
  INTEGER_SPECIAL_TRIPLES.forEach(([a, b, c], baseIndex) => {
    const scalable = baseIndex < 3
    const maxScale = scalable ? Math.floor(limit / c) : (c <= limit ? 1 : 0)
    for (let scale = 1; scale <= maxScale; scale += 1) {
      triples.push([a * scale, b * scale, c * scale])
    }
  })
  return triples
}

function specialIntegerQuestion(group, kind, rng) {
  const triples = availableIntegerSpecials(group)
  const [a, b, c] = triples[randomInt(0, triples.length - 1, rng)]
  const target = kind === 'hypotenuse' ? 'c' : (rng() < 0.5 ? 'a' : 'b')
  return makeQuestion({
    a: integerValue(a),
    b: integerValue(b),
    c: integerValue(c),
    target,
    relation: 'special-integer',
  })
}

function specialRadicalQuestion(group, kind, rng) {
  const limit = PYTHAGORAS_GROUP_RULES[normalizePythagorasGroup(group)].integerLimit
  const family = rng() < 0.5 ? '30-60-90' : '45-45-90'
  if (family === '45-45-90') {
    const scale = randomInt(1, Math.max(1, Math.floor(limit / Math.sqrt(2))), rng)
    const target = kind === 'hypotenuse' ? 'c' : (rng() < 0.5 ? 'a' : 'b')
    return makeQuestion({
      a: integerValue(scale),
      b: integerValue(scale),
      c: scaledRadicalValue(scale, 2),
      target,
      relation: 'special-45-45-90',
      angleHint: rng() < 0.35 ? '其中一個銳角是 45°' : '',
      calculationRadicand: target === 'c' ? 2 * scale * scale : scale * scale,
    })
  }

  const scale = randomInt(1, Math.max(1, Math.floor(limit / 2)), rng)
  const target = kind === 'hypotenuse'
    ? 'c'
    : (rng() < 0.5 ? 'a' : 'b')
  const angle = rng() < 0.35 ? (rng() < 0.5 ? '其中一個銳角是 30°' : '其中一個銳角是 60°') : ''
  return makeQuestion({
    a: integerValue(scale),
    b: scaledRadicalValue(scale, 3),
    c: integerValue(2 * scale),
    target,
    relation: 'special-30-60-90',
    angleHint: angle,
    calculationRadicand: target === 'b' ? 3 * scale * scale : (target === 'a' ? scale * scale : 4 * scale * scale),
  })
}

function specialQuestion(group, kind, rng) {
  return rng() < (normalizePythagorasGroup(group) === 'B' ? 0.35 : 0.25)
    ? specialRadicalQuestion(group, kind, rng)
    : specialIntegerQuestion(group, kind, rng)
}

function misconceptionQuestion(group, rng) {
  const rules = PYTHAGORAS_GROUP_RULES[normalizePythagorasGroup(group)]
  const pairs = MISCONCEPTION_LEG_PAIRS.filter(([smaller, larger]) => (
    larger <= rules.integerLimit && smaller * smaller + larger * larger <= rules.radicandLimit
  ))
  const [a, b] = pairs[randomInt(0, pairs.length - 1, rng)]
  const radicand = a * a + b * b
  const mistakenDifference = Math.sqrt(b * b - a * a)
  const mistakenText = Number.isInteger(mistakenDifference)
    ? String(mistakenDifference)
    : pythagorasValueText(simplifyRadical(b * b - a * a))
  return makeQuestion({
    a: integerValue(a),
    b: integerValue(b),
    c: simplifyRadical(radicand),
    target: 'c',
    relation: 'misconception',
    commonMistake: `兩個已知數都是股長，要用平方和；若誤用平方差，容易寫成 ${mistakenText}。`,
    calculationRadicand: radicand,
  })
}

function generalHypotenuseQuestion(group, rng) {
  const normalizedGroup = normalizePythagorasGroup(group)
  const limit = PYTHAGORAS_GROUP_RULES[normalizedGroup].integerLimit
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const minimum = normalizedGroup === 'A' && rng() < 0.65 ? 10 : 1
    const maximum = normalizedGroup === 'B' ? 9 : limit
    const a = randomInt(minimum, maximum, rng)
    const b = randomInt(minimum, maximum, rng)
    const radicand = a * a + b * b
    if (radicand > PYTHAGORAS_GROUP_RULES[normalizedGroup].radicandLimit) continue
    if (Number.isInteger(Math.sqrt(radicand))) continue
    return makeQuestion({
      a: integerValue(Math.min(a, b)),
      b: integerValue(Math.max(a, b)),
      c: simplifyRadical(radicand),
      target: 'c',
      relation: 'general',
      calculationRadicand: radicand,
    })
  }
  return misconceptionQuestion(group, rng)
}

function generalLegQuestion(group, rng) {
  const normalizedGroup = normalizePythagorasGroup(group)
  const limit = PYTHAGORAS_GROUP_RULES[normalizedGroup].integerLimit
  const radicandLimit = PYTHAGORAS_GROUP_RULES[normalizedGroup].radicandLimit
  for (let attempt = 0; attempt < 500; attempt += 1) {
    const c = randomInt(normalizedGroup === 'A' ? 10 : 3, limit, rng)
    const knownLeg = randomInt(1, c - 1, rng)
    const radicand = c * c - knownLeg * knownLeg
    if (radicand > radicandLimit || Number.isInteger(Math.sqrt(radicand))) continue
    const missingIsA = rng() < 0.5
    return makeQuestion({
      a: missingIsA ? simplifyRadical(radicand) : integerValue(knownLeg),
      b: missingIsA ? integerValue(knownLeg) : simplifyRadical(radicand),
      c: integerValue(c),
      target: missingIsA ? 'a' : 'b',
      relation: 'general',
      calculationRadicand: radicand,
    })
  }
  return specialIntegerQuestion(group, 'leg', rng)
}

export function generatePythagorasQuestion(group = 'B', kind = 'hypotenuse', rng = Math.random) {
  const normalizedGroup = normalizePythagorasGroup(group)
  const normalizedKind = kind === 'leg' ? 'leg' : 'hypotenuse'
  const roll = rng()
  if (normalizedKind === 'hypotenuse') {
    const misconceptionCutoff = normalizedGroup === 'B' ? 0.25 : 0.18
    const specialCutoff = normalizedGroup === 'B' ? 0.82 : 0.45
    if (roll < misconceptionCutoff) return misconceptionQuestion(normalizedGroup, rng)
    if (roll < specialCutoff) return specialQuestion(normalizedGroup, normalizedKind, rng)
    return generalHypotenuseQuestion(normalizedGroup, rng)
  }
  const specialCutoff = normalizedGroup === 'B' ? 0.68 : 0.35
  return roll < specialCutoff
    ? specialQuestion(normalizedGroup, normalizedKind, rng)
    : generalLegQuestion(normalizedGroup, rng)
}

export function createPythagorasDeck(group = 'B', count = 24, rng = Math.random) {
  const safeCount = Math.max(2, Math.round(Number(count) || 24))
  const offset = randomInt(-1, 1, rng)
  const hypotenuseCount = Math.max(1, Math.min(safeCount - 1, Math.round(safeCount / 2) + offset))
  const kinds = shufflePythagoras([
    ...Array.from({ length: hypotenuseCount }, () => 'hypotenuse'),
    ...Array.from({ length: safeCount - hypotenuseCount }, () => 'leg'),
  ], rng)
  const seen = new Set()
  return kinds.map((kind) => {
    let question = generatePythagorasQuestion(group, kind, rng)
    for (let attempt = 0; attempt < 30 && seen.has(question.id); attempt += 1) {
      question = generatePythagorasQuestion(group, kind, rng)
    }
    seen.add(question.id)
    return question
  })
}

export function parsePythagorasAnswer(rawValue) {
  const text = String(rawValue || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '')
    .replace(/×/g, '*')
  if (!text) return Number.NaN
  const radicalMatch = text.match(/^([+-]?\d*\.?\d*)(?:\*?)(?:√\(?([0-9]+)\)?|sqrt\(?([0-9]+)\)?)$/i)
  if (radicalMatch) {
    const coefficientText = radicalMatch[1]
    const coefficient = coefficientText === '' || coefficientText === '+'
      ? 1
      : (coefficientText === '-' ? -1 : Number(coefficientText))
    const radicand = Number(radicalMatch[2] || radicalMatch[3])
    if (Number.isFinite(coefficient) && Number.isFinite(radicand) && radicand >= 0) {
      return coefficient * Math.sqrt(radicand)
    }
  }
  const numeric = Number(text)
  return Number.isFinite(numeric) ? numeric : Number.NaN
}

export function isPythagorasAnswerCorrect(rawValue, question, tolerance = 0.015) {
  const parsed = parsePythagorasAnswer(rawValue)
  if (!Number.isFinite(parsed) || !question?.answer) return false
  return Math.abs(parsed - pythagorasValueNumber(question.answer)) <= tolerance
}

export function questionSatisfiesPythagoreanTheorem(question, tolerance = 0.0001) {
  const a = pythagorasValueNumber(question?.exactSides?.a)
  const b = pythagorasValueNumber(question?.exactSides?.b)
  const c = pythagorasValueNumber(question?.exactSides?.c)
  return Math.abs(a * a + b * b - c * c) <= tolerance
}
