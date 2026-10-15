import { coefficientConceptQuestions, stageOneMolecules } from '../data/chemicalBalance.js'

const subscriptDigits = '₀₁₂₃₄₅₆₇₈₉'

export function displayMolecularFormula(formula) {
  return String(formula).replace(/\d/g, (digit) => subscriptDigits[Number(digit)])
}

export function parseMolecularFormula(formula) {
  const source = String(formula || '').trim()
  if (!source) return null
  const counts = {}
  const expression = /([A-Z][a-z]?)(\d*)/g
  let consumed = ''
  let match = expression.exec(source)
  while (match) {
    consumed += match[0]
    counts[match[1]] = (counts[match[1]] || 0) + Number(match[2] || 1)
    match = expression.exec(source)
  }
  return consumed === source ? counts : null
}

export function countAtomSymbols(symbols) {
  return symbols.reduce((counts, symbol) => ({ ...counts, [symbol]: (counts[symbol] || 0) + 1 }), {})
}

export function atomCountsMatch(actual, expected) {
  const elements = new Set([...Object.keys(actual || {}), ...Object.keys(expected || {})])
  return [...elements].every((symbol) => Number(actual?.[symbol] || 0) === Number(expected?.[symbol] || 0))
}

export function describeAtomDifference(actual, expected) {
  const elements = [...new Set([...Object.keys(expected || {}), ...Object.keys(actual || {})])]
  const messages = []
  elements.forEach((symbol) => {
    const difference = Number(expected?.[symbol] || 0) - Number(actual?.[symbol] || 0)
    if (difference > 0) messages.push(`還少 ${difference} 個 ${symbol}`)
    if (difference < 0) messages.push(`多了 ${Math.abs(difference)} 個 ${symbol}`)
  })
  return messages.length ? `${messages.join('；')}。` : '原子數量正確。'
}

export function shuffleBalanceItems(items, random = Math.random) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

function identifyQuestion(molecule, molecules, random) {
  const distractors = shuffleBalanceItems(molecules.filter((item) => item.id !== molecule.id), random).slice(0, 3)
  return {
    id: `identify-${molecule.id}`,
    mode: 'identify',
    molecule,
    prompt: '這個粒子模型應該用哪一個化學式表示？',
    answer: molecule.formula,
    choices: shuffleBalanceItems([molecule, ...distractors], random)
      .map((item) => ({ value: item.formula, label: displayMolecularFormula(item.formula) })),
    explanation: `${molecule.name}含有${Object.entries(molecule.atoms).map(([symbol, count]) => ` ${count} 個 ${symbol}`).join('、')}，所以化學式是 ${displayMolecularFormula(molecule.formula)}。`,
  }
}

export function buildStageOneRound(random = Math.random) {
  const molecules = shuffleBalanceItems(stageOneMolecules, random)
  const buildQuestions = molecules.slice(0, 4).map((molecule) => ({
    id: `build-${molecule.id}`,
    mode: 'build',
    molecule,
    prompt: `請依照 ${displayMolecularFormula(molecule.formula)} 組裝 1 個${molecule.name}。`,
    answer: molecule.atoms,
    explanation: `${displayMolecularFormula(molecule.formula)} 由${Object.entries(molecule.atoms).map(([symbol, count]) => ` ${count} 個 ${symbol}`).join('、')}組成。`,
  }))
  const identifyQuestions = molecules.slice(4, 8).map((molecule) => identifyQuestion(molecule, stageOneMolecules, random))
  return [...buildQuestions, ...identifyQuestions, ...coefficientConceptQuestions]
}

export function pointsForAttempt(mistakes) {
  if (mistakes === 0) return 10
  if (mistakes === 1) return 7
  return 4
}

export function stageOneScore(points, totalQuestions) {
  return totalQuestions ? Math.round((points / (totalQuestions * 10)) * 100) : 0
}
