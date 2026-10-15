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

export const typicalBondCapacity = { H: 1, C: 4, N: 3, O: 2, Cl: 1 }

export function collapseRepeatedBonds(bonds) {
  const collapsed = new Map()
  bonds.forEach((bond) => {
    const [first, second] = Array.isArray(bond) ? bond : [bond.a, bond.b]
    const key = [first, second].sort((left, right) => left - right).join('-')
    const current = collapsed.get(key) || { a: Math.min(first, second), b: Math.max(first, second), order: 0 }
    current.order += Array.isArray(bond) ? 1 : Number(bond.order || 1)
    collapsed.set(key, current)
  })
  return [...collapsed.values()]
}

function graphSignature(atoms, bonds) {
  const normalizedBonds = collapseRepeatedBonds(bonds)
  return atoms.map((atom, atomIndex) => {
    const neighbours = normalizedBonds
      .filter((bond) => bond.a === atomIndex || bond.b === atomIndex)
      .map((bond) => {
        const neighbourIndex = bond.a === atomIndex ? bond.b : bond.a
        return `${atoms[neighbourIndex]?.symbol || '?'}:${bond.order}`
      })
      .sort()
    return `${atom.symbol}|${neighbours.join(',')}`
  }).sort()
}

export function moleculeGraphMatches(atoms, bonds, molecule) {
  if (!molecule || atoms.length !== molecule.model.length) return false
  const targetAtoms = molecule.model.map((atom) => ({ symbol: atom.symbol }))
  return JSON.stringify(graphSignature(atoms, bonds))
    === JSON.stringify(graphSignature(targetAtoms, molecule.bonds))
}

export function setMoleculeBond(atoms, bonds, firstId, secondId, order) {
  if (firstId === secondId) return { ok: false, bonds, message: '請選擇兩顆不同的原子。' }
  const firstIndex = atoms.findIndex((atom) => atom.id === firstId)
  const secondIndex = atoms.findIndex((atom) => atom.id === secondId)
  if (firstIndex < 0 || secondIndex < 0) return { ok: false, bonds, message: '找不到要鍵結的原子。' }
  const normalizedOrder = Math.max(1, Math.min(3, Number(order) || 1))
  const nextBonds = bonds.filter((bond) => !(
    (bond.a === firstIndex && bond.b === secondIndex)
    || (bond.a === secondIndex && bond.b === firstIndex)
  ))
  nextBonds.push({ a: Math.min(firstIndex, secondIndex), b: Math.max(firstIndex, secondIndex), order: normalizedOrder })
  const usedCapacity = (atomIndex) => nextBonds
    .filter((bond) => bond.a === atomIndex || bond.b === atomIndex)
    .reduce((total, bond) => total + bond.order, 0)
  const overfilled = [firstIndex, secondIndex].find((atomIndex) => usedCapacity(atomIndex) > (typicalBondCapacity[atoms[atomIndex].symbol] || 4))
  if (overfilled != null) {
    const symbol = atoms[overfilled].symbol
    return { ok: false, bonds, message: `${symbol} 在本關最多形成 ${typicalBondCapacity[symbol] || 4} 個鍵，請改用較低鍵級或更換原子。` }
  }
  return { ok: true, bonds: nextBonds, message: `${normalizedOrder === 1 ? '單' : normalizedOrder === 2 ? '雙' : '三'}鍵已建立。` }
}

export function removeMoleculeAtom(atoms, bonds, atomId) {
  const removedIndex = atoms.findIndex((atom) => atom.id === atomId)
  if (removedIndex < 0) return { atoms, bonds }
  return {
    atoms: atoms.filter((_, index) => index !== removedIndex),
    bonds: bonds
      .filter((bond) => bond.a !== removedIndex && bond.b !== removedIndex)
      .map((bond) => ({
        ...bond,
        a: bond.a > removedIndex ? bond.a - 1 : bond.a,
        b: bond.b > removedIndex ? bond.b - 1 : bond.b,
      })),
  }
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

export function describeMoleculeBuild(actual, bonds, molecule) {
  const actualCounts = countAtomSymbols(actual.map((atom) => atom.symbol))
  if (!atomCountsMatch(actualCounts, molecule.atoms)) return describeAtomDifference(actualCounts, molecule.atoms)
  if (moleculeGraphMatches(actual, bonds, molecule)) return '原子種類、數量與鍵結方式都正確。'
  if (!bonds.length) return '原子數量正確，但還沒有建立鍵結。請選擇鍵級，再依序點兩顆原子。'
  return '原子數量正確，但鍵結對象或鍵級還不正確。請檢查單鍵、雙鍵與三鍵。'
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
