// 根式牌均屬 Q(√2, √3)；以四基底有理數計算，完全不靠小數容差。
const gcd = (a, b) => {
  a = a < 0n ? -a : a
  b = b < 0n ? -b : b
  while (b) [a, b] = [b, a % b]
  return a || 1n
}
function rational(n, d = 1n) {
  if (!d) throw new Error('division_by_zero')
  if (d < 0n) return rational(-n, -d)
  const g = gcd(n, d)
  return { n: n / g, d: d / g }
}
const sum = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d)
const opposite = (a) => rational(-a.n, a.d)
const product = (a, b) => rational(a.n * b.n, a.d * b.d)
const quotient = (a, b) => rational(a.n * b.d, a.d * b.n)
const zeros = () => Array.from({ length: 4 }, () => rational(0n))
const addVectors = (a, b) => a.map((x, i) => sum(x, b[i]))
function multiplyVectors(a, b) {
  const result = zeros()
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) {
    const common = i & j
    const factor = BigInt((common & 1 ? 2 : 1) * (common & 2 ? 3 : 1))
    result[i ^ j] = sum(result[i ^ j], product(product(a[i], b[j]), rational(factor)))
  }
  return result
}
function divideVectors(a, b) {
  if (b.every((x) => !x.n)) throw new Error('division_by_zero')
  const c3 = [b[0], b[1], opposite(b[2]), opposite(b[3])]
  const partial = multiplyVectors(b, c3)
  const c2 = [partial[0], opposite(partial[1]), rational(0n), rational(0n)]
  const norm = multiplyVectors(partial, c2)[0]
  return multiplyVectors(a, multiplyVectors(c3, c2)).map((x) => quotient(x, norm))
}
function cardValue(card, variableValues) {
  let coefficient
  if (card?.variableCode === 'n') {
    const value = String(variableValues[String(card.id)] ?? '')
    if (!/^[1-9]$/.test(value)) throw new Error('variable_card_value_required')
    coefficient = BigInt(value)
  } else {
    if (!Number.isInteger(Number(card?.coefficient))) throw new Error('invalid_radical_card')
    coefficient = BigInt(card.coefficient)
  }
  let radicand = Number(card?.radicand ?? 1)
  if (!Number.isInteger(radicand) || radicand < 1) throw new Error('invalid_radical_card')
  let outside = 1
  for (let k = 2; k * k <= radicand; k += 1) while (radicand % (k * k) === 0) {
    outside *= k
    radicand /= k * k
  }
  const basis = ({ 1: 0, 2: 1, 3: 2, 6: 3 })[radicand]
  if (basis === undefined) throw new Error('invalid_radical_card')
  const result = zeros()
  result[basis] = rational(coefficient * BigInt(outside))
  return result
}
export function collectEquationCardIds(node, result = []) {
  if (!node || typeof node !== 'object') return result
  if (node.type === 'card') {
    result.push(String(node.cardId || ''))
    return result
  }
  collectEquationCardIds(node.left, result)
  collectEquationCardIds(node.right, result)
  return result
}
export function evaluateRadicalExpression(node, cardsById, variableValues = {}) {
  if (!node || typeof node !== 'object') throw new Error('invalid_expression')
  if (node.type === 'card') {
    const card = cardsById.get(String(node.cardId || ''))
    if (!card) throw new Error('card_not_found')
    return cardValue(card, variableValues)
  }
  if (node.type !== 'operation' || !['+', '-', '*', '/'].includes(node.operator)) throw new Error('invalid_operator')
  const left = evaluateRadicalExpression(node.left, cardsById, variableValues)
  const right = evaluateRadicalExpression(node.right, cardsById, variableValues)
  if (node.operator === '+') return addVectors(left, right)
  if (node.operator === '-') return addVectors(left, right.map(opposite))
  if (node.operator === '*') return multiplyVectors(left, right)
  return divideVectors(left, right)
}
const approximate = (v) => v.reduce((total, x, i) => total + Number(x.n) / Number(x.d) * Math.sqrt([1, 2, 3, 6][i]), 0)
export function validateRadicalEquation({ selectedCardIds, left, right, cards, variableValues = {} }) {
  const selected = (selectedCardIds || []).map(String)
  const selectedSet = new Set(selected)
  if (selected.length < 3 || selected.length > 6) return { valid: false, reason: '進階等式必須使用 3～6 張牌。' }
  if (selectedSet.size !== selected.length) return { valid: false, reason: '同一張牌不能重複選取。' }
  const used = [...collectEquationCardIds(left), ...collectEquationCardIds(right)]
  const usedSet = new Set(used)
  if (used.length !== usedSet.size) return { valid: false, reason: '同一張牌在等式中只能使用 1 次。' }
  if (used.length !== selected.length || used.some((id) => !selectedSet.has(id))
    || selected.some((id) => !usedSet.has(id))) {
    return { valid: false, reason: '所有選取的牌都必須在等式中使用 1 次。' }
  }
  try {
    const byId = new Map((cards || []).map((card) => [String(card.id), card]))
    const l = evaluateRadicalExpression(left, byId, variableValues)
    const r = evaluateRadicalExpression(right, byId, variableValues)
    const valid = l.every((x, i) => x.n === r[i].n && x.d === r[i].d)
    return { valid, reason: valid ? '' : '等號左右兩邊的值不相等。',
      leftValue: approximate(l), rightValue: approximate(r) }
  } catch (error) {
    const messages = {
      card_not_found: '等式中含有不在手牌裡的牌。',
      division_by_zero: '算式不能除以 0。',
      invalid_operator: '算式包含不支援的運算符號。',
      variable_card_value_required: '使用 n 系列牌時，每張牌的 n 必須分別輸入 1～9。',
    }
    return { valid: false, reason: messages[error.message] || '算式格式不完整。' }
  }
}
