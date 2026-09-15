const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 }

function parseSide(tokens) {
  const output = []
  const operators = []
  let expectsOperand = true
  for (const token of tokens) {
    if (token.type === 'card') {
      if (!expectsOperand) throw new Error('missing_operator')
      output.push({ type: 'card', cardId: String(token.cardId) })
      expectsOperand = false
      continue
    }
    if (token.type === 'paren' && token.value === '(') {
      if (!expectsOperand) throw new Error('missing_operator')
      operators.push(token)
      continue
    }
    if (token.type === 'paren' && token.value === ')') {
      if (expectsOperand) throw new Error('missing_operand')
      while (operators.length && operators.at(-1).value !== '(') output.push(operators.pop())
      if (!operators.length) throw new Error('parentheses_mismatch')
      operators.pop()
      expectsOperand = false
      continue
    }
    if (token.type !== 'operator' || !Object.hasOwn(precedence, token.value)) throw new Error('invalid_operator')
    if (expectsOperand) throw new Error('missing_operand')
    while (operators.length
      && operators.at(-1).type === 'operator'
      && precedence[operators.at(-1).value] >= precedence[token.value]) output.push(operators.pop())
    operators.push(token)
    expectsOperand = true
  }
  if (expectsOperand) throw new Error('missing_operand')
  while (operators.length) {
    const operator = operators.pop()
    if (operator.type === 'paren') throw new Error('parentheses_mismatch')
    output.push(operator)
  }
  const stack = []
  for (const token of output) {
    if (token.type === 'card') stack.push(token)
    else {
      const right = stack.pop()
      const left = stack.pop()
      if (!left || !right) throw new Error('missing_operand')
      stack.push({ type: 'operation', operator: token.value, left, right })
    }
  }
  if (stack.length !== 1) throw new Error('invalid_expression')
  return stack[0]
}

export function parseEquationTokens(tokens = []) {
  const equalsPositions = tokens.reduce((items, token, index) => token.type === 'equals' ? [...items, index] : items, [])
  if (equalsPositions.length !== 1) throw new Error('equals_required')
  const equalsIndex = equalsPositions[0]
  return {
    left: parseSide(tokens.slice(0, equalsIndex)),
    right: parseSide(tokens.slice(equalsIndex + 1)),
  }
}

export function equationTokenLabel(token, cardsById, variableValues = {}) {
  if (token.type === 'operator') return ({ '*': '×', '/': '÷' })[token.value] || token.value
  if (token.type === 'equals') return '='
  if (token.type === 'paren') return token.value
  const card = cardsById.get(String(token.cardId))
  if (!card) return '?'
  const n = variableValues[String(card.id)]
  return card.variableCode === 'n' && n ? `${card.label.replace('n', n)}` : card.label
}
