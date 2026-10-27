export const FACTOR_CLASH_ROUND_SIZE = 5

export const factorClashModes = {
  area: {
    code: 'area',
    name: '天人交戰',
    description: '依照兩個一次因式，用 x²、x、1 面積板拼出完整長方形。',
  },
  cross: {
    code: 'cross',
    name: '十字交戰',
    description: '從展開式反推兩個一次因式，拖曳係數與常數卡完成答案。',
  },
}

export const factorClashDifficulties = {
  basic: { code: 'basic', name: '基礎', areaSeconds: 120, crossSeconds: 120 },
  advanced: { code: 'advanced', name: '進階', areaSeconds: 240, crossSeconds: 180 },
}

export function factorQuestionSeconds(mode, difficulty) {
  const config = factorClashDifficulties[difficulty] || factorClashDifficulties.basic
  return mode === 'area' ? config.areaSeconds : config.crossSeconds
}

export function gcd(left, right) {
  let a = Math.abs(Number(left) || 0)
  let b = Math.abs(Number(right) || 0)
  while (b) [a, b] = [b, a % b]
  return a
}

function randomInteger(random, minimum, maximum) {
  return minimum + Math.floor(random() * (maximum - minimum + 1))
}

function pick(items, random) {
  return items[Math.floor(random() * items.length)]
}

export function shuffle(items, random = Math.random) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

function signedConstant(random, maximum = 5, allowPositive = true) {
  const magnitude = randomInteger(random, 1, maximum)
  if (!allowPositive) return -magnitude
  return random() < 0.5 ? magnitude : -magnitude
}

function primitiveConstant(coefficient, maximum, random, signed = false) {
  const values = []
  for (let value = 1; value <= maximum; value += 1) {
    if (gcd(coefficient, value) === 1) values.push(value)
  }
  const magnitude = pick(values, random)
  return signed && random() < 0.5 ? -magnitude : magnitude
}

function leadingPair(random) {
  const roll = random()
  if (roll < 0.25) return [2, 1]
  if (roll < 0.5) return [3, 1]
  if (roll < 0.85) return [2, 2]
  return [4, 1]
}

export function expandFactors(left, right) {
  return {
    quadratic: left.coefficient * right.coefficient,
    linear: left.coefficient * right.constant + left.constant * right.coefficient,
    constant: left.constant * right.constant,
  }
}

function coefficientText(coefficient) {
  if (coefficient === 1) return 'x'
  if (coefficient === -1) return '−x'
  return `${coefficient}x`
}

export function formatLinearFactor({ coefficient, constant }) {
  const first = coefficientText(coefficient)
  if (constant === 0) return first
  return `${first} ${constant > 0 ? '＋' : '−'} ${Math.abs(constant)}`
}

export function formatFactoredExpression(left, right) {
  return `(${formatLinearFactor(left)})(${formatLinearFactor(right)})`
}

function appendPolynomialTerm(parts, coefficient, symbol) {
  if (coefficient === 0) return
  const absolute = Math.abs(coefficient)
  const body = `${absolute === 1 && symbol ? '' : absolute}${symbol}`
  if (parts.length === 0) parts.push(coefficient < 0 ? `−${body}` : body)
  else parts.push(`${coefficient < 0 ? '−' : '＋'} ${body}`)
}

export function formatExpandedExpression(expanded) {
  const parts = []
  appendPolynomialTerm(parts, expanded.quadratic, 'x²')
  appendPolynomialTerm(parts, expanded.linear, 'x')
  appendPolynomialTerm(parts, expanded.constant, '')
  return parts.join(' ') || '0'
}

export function factorQuestionKey(question) {
  const expanded = question.expanded || expandFactors(question.left, question.right)
  return `${expanded.quadratic}:${expanded.linear}:${expanded.constant}`
}

function createBasicFactors(mode, random) {
  if (mode === 'area') {
    const first = randomInteger(random, 1, 5)
    const second = randomInteger(random, 1, 5)
    return [{ coefficient: 1, constant: first }, { coefficient: 1, constant: second }]
  }
  return [
    { coefficient: 1, constant: signedConstant(random) },
    { coefficient: 1, constant: signedConstant(random) },
  ]
}

function createAdvancedFactors(mode, random) {
  const [firstCoefficient, secondCoefficient] = leadingPair(random)
  const firstMaximum = firstCoefficient === 4 ? 3 : 5
  const secondMaximum = secondCoefficient === 4 ? 3 : 5
  const signed = mode === 'cross'
  let firstConstant = primitiveConstant(firstCoefficient, firstMaximum, random, signed)
  let secondConstant = primitiveConstant(secondCoefficient, secondMaximum, random, signed)
  if (signed && firstConstant > 0 && secondConstant > 0 && random() < 0.7) {
    if (random() < 0.5) firstConstant *= -1
    else secondConstant *= -1
  }
  return [
    { coefficient: firstCoefficient, constant: firstConstant },
    { coefficient: secondCoefficient, constant: secondConstant },
  ]
}

export function createFactorQuestion({
  mode = 'area', difficulty = 'basic', random = Math.random, usedKeys = new Set(),
} = {}) {
  let left
  let right
  let key = ''
  for (let attempt = 0; attempt < 80; attempt += 1) {
    ;[left, right] = difficulty === 'advanced'
      ? createAdvancedFactors(mode, random)
      : createBasicFactors(mode, random)
    const candidate = { left, right, expanded: expandFactors(left, right) }
    key = factorQuestionKey(candidate)
    if (!usedKeys.has(key)) break
  }
  const expanded = expandFactors(left, right)
  return {
    id: `${mode}-${difficulty}-${key}-${Math.floor(random() * 1e9)}`,
    key,
    mode,
    difficulty,
    left,
    right,
    expanded,
    expandedText: formatExpandedExpression(expanded),
    factoredText: formatFactoredExpression(left, right),
    seconds: factorQuestionSeconds(mode, difficulty),
  }
}

function segmentsForFactor(factor) {
  return [
    ...Array.from({ length: factor.coefficient }, (_, index) => ({ kind: 'x', key: `x-${index}` })),
    ...Array.from({ length: Math.abs(factor.constant) }, (_, index) => ({ kind: 'one', key: `one-${index}` })),
  ]
}

export function areaBoardFor(question) {
  if (question.left.constant < 0 || question.right.constant < 0) {
    throw new Error('面積模式只支援正數常數。')
  }
  const columns = segmentsForFactor(question.left)
  const rows = segmentsForFactor(question.right)
  const slots = rows.flatMap((row, rowIndex) => columns.map((column, columnIndex) => {
    const type = row.kind === 'x' && column.kind === 'x'
      ? 'x2'
      : row.kind === 'one' && column.kind === 'one' ? 'one' : 'x'
    const orientation = type !== 'x' ? '' : column.kind === 'x' ? 'horizontal' : 'vertical'
    return {
      id: `slot-${rowIndex}-${columnIndex}`,
      row: rowIndex,
      column: columnIndex,
      rowKind: row.kind,
      columnKind: column.kind,
      type,
      orientation,
    }
  }))
  return { columns, rows, slots }
}

export function areaPiecesFor(question, random = Math.random) {
  return shuffle(areaBoardFor(question).slots.map((slot, index) => ({
    id: `piece-${question.id}-${index}`,
    type: slot.type,
    orientation: slot.orientation,
  })), random)
}

export function validateAreaPlacement(question, placement = {}) {
  return areaBoardFor(question).slots.every((slot) => {
    const piece = placement[slot.id]
    return piece?.type === slot.type && (slot.type !== 'x' || piece.orientation === slot.orientation)
  })
}

function addRequiredCopies(pool, values) {
  const result = []
  values.forEach((value) => result.push(value))
  pool.forEach((value) => {
    if (result.length < values.length + 3) result.push(value)
  })
  return result
}

export function crossCardsFor(question, random = Math.random) {
  const linearPool = question.difficulty === 'advanced' ? [1, 2, 3, 4] : [1]
  const constantPool = shuffle([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5], random)
  const linearValues = addRequiredCopies(
    shuffle(linearPool.filter((value) => ![question.left.coefficient, question.right.coefficient].includes(value)), random),
    [question.left.coefficient, question.right.coefficient],
  )
  const constantValues = addRequiredCopies(
    constantPool.filter((value) => ![question.left.constant, question.right.constant].includes(value)),
    [question.left.constant, question.right.constant],
  )
  return shuffle([
    ...linearValues.map((value, index) => ({ id: `linear-${index}-${value}`, kind: 'linear', value })),
    ...constantValues.map((value, index) => ({ id: `constant-${index}-${value}`, kind: 'constant', value })),
  ], random)
}

export function validateCrossAnswer(question, answer = {}) {
  const firstCoefficient = Number(answer.firstCoefficient)
  const firstConstant = Number(answer.firstConstant)
  const secondCoefficient = Number(answer.secondCoefficient)
  const secondConstant = Number(answer.secondConstant)
  if (![firstCoefficient, firstConstant, secondCoefficient, secondConstant].every(Number.isFinite)) return false
  const submitted = expandFactors(
    { coefficient: firstCoefficient, constant: firstConstant },
    { coefficient: secondCoefficient, constant: secondConstant },
  )
  return submitted.quadratic === question.expanded.quadratic
    && submitted.linear === question.expanded.linear
    && submitted.constant === question.expanded.constant
    && gcd(firstCoefficient, firstConstant) === 1
    && gcd(secondCoefficient, secondConstant) === 1
}

export function pointsForSubmission(attemptNumber, correct) {
  if (!correct) return 0
  return attemptNumber <= 1 ? 3 : 1
}

export function questionExplanation(question) {
  const { quadratic, linear, constant } = question.expanded
  const crossOne = question.left.coefficient * question.right.constant
  const crossTwo = question.left.constant * question.right.coefficient
  return `${question.factoredText}：首項相乘為 ${quadratic}x²，交叉相乘為 ${crossOne}x 與 ${crossTwo}x，合併得到 ${linear}x，常數相乘為 ${constant}。`
}
