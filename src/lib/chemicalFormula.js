const subscriptMap = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
}

const fullWidthDigitMap = {
  '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
  '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
}

export function shuffleChemistryItems(items, random = Math.random) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

export function normalizeChemicalFormula(value = '') {
  return String(value)
    .trim()
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (digit) => subscriptMap[digit])
    .replace(/[０１２３４５６７８９]/g, (digit) => fullWidthDigitMap[digit])
    .replace(/[［【]/g, '[')
    .replace(/[］】]/g, ']')
    .replace(/\s+/g, '')
}

export function isChemicalFormulaCorrect(answer, expected) {
  return normalizeChemicalFormula(answer) === normalizeChemicalFormula(expected)
}

export function toSubscript(value) {
  return String(value).replace(/\d/g, (digit) => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)])
}

export function displayIonFormula(ion) {
  const magnitude = Math.abs(ion.charge)
  const sign = ion.charge > 0 ? '⁺' : '⁻'
  const charge = magnitude === 1 ? sign : `${'⁰¹²³⁴⁵⁶⁷⁸⁹'[magnitude]}${sign}`
  return `${ion.formula.replace(/\d/g, (digit) => toSubscript(digit))}${charge}`
}

export function displayCompoundFormula(formula) {
  return String(formula).replace(/\d/g, (digit) => toSubscript(digit))
}

export function advancedIonClue(compound, stepId) {
  if (stepId === 'charges') {
    return {
      caption: '已找出的離子符號',
      cation: displayCompoundFormula(compound.cation.formula),
      anion: displayCompoundFormula(compound.anion.formula),
    }
  }
  if (stepId === 'counts') {
    return {
      caption: '離子符號與電荷',
      cation: displayIonFormula(compound.cation),
      anion: displayIonFormula(compound.anion),
    }
  }
  return null
}

export function transferAnswer(element) {
  return `${element.transfer}-${element.transferCount}`
}

export function transferLabel(value) {
  const [action, count] = String(value).split('-')
  return `${action === 'lose' ? '失去' : '得到'} ${count} 個電子`
}

function pickAlternatives(correct, source, count, random) {
  const alternatives = shuffleChemistryItems(source.filter((item) => item !== correct), random).slice(0, count)
  return shuffleChemistryItems([correct, ...alternatives], random)
}

export function buildBasicChemistryRound(elements, count = 10, random = Math.random) {
  return shuffleChemistryItems(elements, random).slice(0, Math.min(count, elements.length))
}

export function basicTransferChoices(element, random = Math.random) {
  const correct = transferAnswer(element)
  const all = ['lose-1', 'lose-2', 'lose-3', 'gain-1', 'gain-2', 'gain-3']
  return pickAlternatives(correct, all, 3, random).map((value) => ({ value, label: transferLabel(value) }))
}

export function basicChargeChoices(element, random = Math.random) {
  const correct = String(element.charge)
  return pickAlternatives(correct, ['1', '2', '3', '-1', '-2', '-3'], 3, random)
    .map((value) => ({ value, label: `${Number(value) > 0 ? '+' : ''}${value}` }))
}

const polyatomicQuestionModes = ['name-to-formula', 'formula-to-name', 'charge']

export function buildPolyatomicRound(ions, count = 10, random = Math.random) {
  const firstPass = shuffleChemistryItems(ions, random).map((ion, index) => ({
    ion,
    mode: polyatomicQuestionModes[index % polyatomicQuestionModes.length],
  }))
  const extraPool = ions.flatMap((ion) => polyatomicQuestionModes.map((mode) => ({ ion, mode })))
    .filter((candidate) => !firstPass.some((first) => first.ion.id === candidate.ion.id && first.mode === candidate.mode))
  return [...firstPass, ...shuffleChemistryItems(extraPool, random)]
    .slice(0, count)
    .map((question) => ({ ...question, id: `${question.ion.id}-${question.mode}` }))
}

export function polyatomicQuestionView(question, ions, random = Math.random) {
  const { ion, mode } = question
  if (mode === 'name-to-formula') {
    const options = pickAlternatives(ion, ions, 3, random)
    return {
      prompt: `「${ion.name}」的離子符號是？`,
      answer: ion.id,
      choices: options.map((option) => ({ value: option.id, label: displayIonFormula(option) })),
      hint: `先辨認組成原子，再注意右上角的${ion.charge > 0 ? '正' : '負'}電荷。`,
      explanation: `${ion.name}寫作 ${displayIonFormula(ion)}，帶 ${Math.abs(ion.charge)} 價${ion.charge > 0 ? '正' : '負'}電。`,
    }
  }
  if (mode === 'formula-to-name') {
    const options = pickAlternatives(ion, ions, 3, random)
    return {
      prompt: `離子符號「${displayIonFormula(ion)}」稱為什麼？`,
      answer: ion.id,
      choices: options.map((option) => ({ value: option.id, label: option.name })),
      hint: `觀察 ${ion.formula.replace(/\d/g, (digit) => toSubscript(digit))} 中有哪些元素。`,
      explanation: `${displayIonFormula(ion)} 是${ion.name}，整個原子團要視為一個單位。`,
    }
  }
  const chargeOptions = pickAlternatives(
    String(ion.charge),
    ['1', '2', '3', '-1', '-2', '-3'],
    3,
    random,
  )
  return {
    prompt: `${ion.name}「${ion.formula.replace(/\d/g, (digit) => toSubscript(digit))}」帶多少電荷？`,
    answer: String(ion.charge),
    choices: chargeOptions.map((value) => ({ value, label: `${Number(value) > 0 ? '+' : ''}${value}` })),
    hint: `${ion.name}是${ion.charge > 0 ? '正根離子' : '負根離子'}。`,
    explanation: `${ion.name}寫作 ${displayIonFormula(ion)}，因此帶 ${Math.abs(ion.charge)} 價${ion.charge > 0 ? '正' : '負'}電。`,
  }
}

export function buildAdvancedChemistryRound(compounds, count = 5, random = Math.random) {
  return shuffleChemistryItems(compounds, random).slice(0, Math.min(count, compounds.length))
}

function ionPairLabel(cation, anion) {
  return `陽離子：${cation.name}；陰離子：${anion.name}`
}

function chargePairLabel(cation, anion) {
  return `陽離子 +${cation.charge}；陰離子 ${anion.charge}`
}

function countPairLabel(cationCount, anionCount) {
  return `陽離子 ${cationCount} 個；陰離子 ${anionCount} 個`
}

function uniquePairChoices(correct, distractors, labelFor, random) {
  const seen = new Set([correct.value])
  const selected = [correct]
  for (const distractor of shuffleChemistryItems(distractors, random)) {
    if (seen.has(distractor.value)) continue
    seen.add(distractor.value)
    selected.push(distractor)
    if (selected.length === 4) break
  }
  return shuffleChemistryItems(selected, random).map((item) => ({ ...item, label: labelFor(item) }))
}

export function buildAdvancedSteps(compound, allIons, random = Math.random) {
  const cations = allIons.filter((ion) => ion.kind === 'cation')
  const anions = allIons.filter((ion) => ion.kind === 'anion')
  const correctIonPair = { value: `${compound.cation.id}|${compound.anion.id}`, cation: compound.cation, anion: compound.anion }
  const ionDistractors = [
    ...cations.filter((ion) => ion.id !== compound.cation.id).map((cation) => ({ value: `${cation.id}|${compound.anion.id}`, cation, anion: compound.anion })),
    ...anions.filter((ion) => ion.id !== compound.anion.id).map((anion) => ({ value: `${compound.cation.id}|${anion.id}`, cation: compound.cation, anion })),
  ]

  const correctCharge = { value: `${compound.cation.charge}|${compound.anion.charge}`, positive: compound.cation.charge, negative: compound.anion.charge }
  const chargeDistractors = [1, 2, 3].flatMap((positive) => [-1, -2, -3].map((negative) => ({
    value: `${positive}|${negative}`,
    positive,
    negative,
  })))

  const correctCount = { value: `${compound.cationCount}|${compound.anionCount}`, cationCount: compound.cationCount, anionCount: compound.anionCount }
  const countDistractors = [1, 2, 3].flatMap((cationCount) => [1, 2, 3].map((anionCount) => ({
    value: `${cationCount}|${anionCount}`,
    cationCount,
    anionCount,
  })))

  const neutralCharge = compound.cationCount * compound.cation.charge
  return [
    {
      id: 'ions',
      title: '第 1 步：拆出離子',
      prompt: `「${compound.name}」是由哪一組陽離子與陰離子組成？`,
      answer: correctIonPair.value,
      choices: uniquePairChoices(correctIonPair, ionDistractors, (item) => ionPairLabel(item.cation, item.anion), random),
      hint: '化合物中文名稱通常先說負離子的名稱，再說正離子的名稱。',
      explanation: `${compound.name}由${compound.cation.name}和${compound.anion.name}組成。`,
    },
    {
      id: 'charges',
      title: '第 2 步：確認電荷',
      prompt: '這兩種離子各帶多少電荷？',
      answer: correctCharge.value,
      choices: uniquePairChoices(correctCharge, chargeDistractors, (item) => chargePairLabel({ charge: item.positive }, { charge: item.negative }), random),
      hint: `${compound.cation.name}寫作 ${displayIonFormula(compound.cation)}；${compound.anion.name}寫作 ${displayIonFormula(compound.anion)}。`,
      explanation: `${compound.cation.name}帶 +${compound.cation.charge}，${compound.anion.name}帶 ${compound.anion.charge}。`,
    },
    {
      id: 'counts',
      title: '第 3 步：讓總電量歸零',
      prompt: '兩種離子各需要幾個，才能讓化合物不帶電？',
      answer: correctCount.value,
      choices: uniquePairChoices(correctCount, countDistractors, (item) => countPairLabel(item.cationCount, item.anionCount), random),
      hint: `正電與負電的總量要相等；這題兩側都要湊成 ${neutralCharge}。`,
      explanation: `${compound.cationCount} 個${compound.cation.name}提供 ${neutralCharge} 單位正電，${compound.anionCount} 個${compound.anion.name}提供 ${neutralCharge} 單位負電，合計為 0。`,
    },
    {
      id: 'formula',
      title: '第 4 步：組合化學式',
      prompt: `最後，請組成「${compound.name}」的化學式。`,
      answer: compound.formula,
      choices: [],
      hint: compound.cation.polyatomic && compound.cationCount > 1 || compound.anion.polyatomic && compound.anionCount > 1
        ? '根離子團超過一個時，要先加括號，再把數量寫成右下標。'
        : '離子數量寫在右下角；數量只有 1 時不用寫。',
      explanation: `${compound.name}的正確化學式是 ${displayCompoundFormula(compound.formula)}。`,
      formula: true,
    },
  ]
}

function formulaSideTokens(ion, count) {
  const formula = displayCompoundFormula(ion.formula)
  if (count === 1) return [formula]
  return ion.polyatomic ? ['(', formula, ')', toSubscript(count)] : [formula, toSubscript(count)]
}

export function correctFormulaTokens(compound) {
  return [
    ...formulaSideTokens(compound.cation, compound.cationCount),
    ...formulaSideTokens(compound.anion, compound.anionCount),
  ]
}

export function buildFormulaTiles(compound, allIons, random = Math.random) {
  const correct = correctFormulaTokens(compound)
  const otherCation = shuffleChemistryItems(allIons.filter((ion) => ion.kind === 'cation' && ion.id !== compound.cation.id), random)[0]
  const otherAnion = shuffleChemistryItems(allIons.filter((ion) => ion.kind === 'anion' && ion.id !== compound.anion.id), random)[0]
  const decoys = [
    otherCation ? displayCompoundFormula(otherCation.formula) : '',
    otherAnion ? displayCompoundFormula(otherAnion.formula) : '',
    '2',
    '3',
    '₂',
    '₃',
    '(',
    ')',
  ].filter(Boolean)
  const labels = [...new Set([...correct, ...decoys])]
  return shuffleChemistryItems(labels, random).map((label, index) => ({ id: `${label}-${index}`, label }))
}

export function evaluateChemistryStep({ answer, expected, previousMistakes = 0, hint, explanation, formula = false }) {
  const correct = formula ? isChemicalFormulaCorrect(answer, expected) : String(answer) === String(expected)
  if (correct) {
    const points = previousMistakes === 0 ? 10 : previousMistakes === 1 ? 7 : 4
    return { correct: true, resolved: true, points, message: explanation }
  }
  const mistakeCount = previousMistakes + 1
  if (mistakeCount === 1) {
    return { correct: false, resolved: false, points: 0, mistakeCount, message: '還差一點，先回頭觀察題目中的粒子、電荷或離子名稱。' }
  }
  if (mistakeCount === 2) {
    return { correct: false, resolved: false, points: 0, mistakeCount, message: hint }
  }
  return {
    correct: false,
    resolved: true,
    points: 0,
    mistakeCount,
    message: `${explanation} 請把這個判斷方法一起記起來。`,
  }
}

export function chemistryScore(points, totalSteps) {
  if (!totalSteps) return 0
  return Math.round((Math.max(0, points) / (totalSteps * 10)) * 100)
}
