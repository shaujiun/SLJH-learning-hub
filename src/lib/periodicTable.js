const rawElements = [
  [1, 'H', '氫', 1, 1], [2, 'He', '氦', 1, 18],
  [3, 'Li', '鋰', 2, 1], [4, 'Be', '鈹', 2, 2], [5, 'B', '硼', 2, 13], [6, 'C', '碳', 2, 14], [7, 'N', '氮', 2, 15], [8, 'O', '氧', 2, 16], [9, 'F', '氟', 2, 17], [10, 'Ne', '氖', 2, 18],
  [11, 'Na', '鈉', 3, 1], [12, 'Mg', '鎂', 3, 2], [13, 'Al', '鋁', 3, 13], [14, 'Si', '矽', 3, 14], [15, 'P', '磷', 3, 15], [16, 'S', '硫', 3, 16], [17, 'Cl', '氯', 3, 17], [18, 'Ar', '氬', 3, 18],
  [19, 'K', '鉀', 4, 1], [20, 'Ca', '鈣', 4, 2], [21, 'Sc', '鈧', 4, 3], [22, 'Ti', '鈦', 4, 4], [23, 'V', '釩', 4, 5], [24, 'Cr', '鉻', 4, 6], [25, 'Mn', '錳', 4, 7], [26, 'Fe', '鐵', 4, 8], [27, 'Co', '鈷', 4, 9], [28, 'Ni', '鎳', 4, 10], [29, 'Cu', '銅', 4, 11], [30, 'Zn', '鋅', 4, 12], [31, 'Ga', '鎵', 4, 13], [32, 'Ge', '鍺', 4, 14], [33, 'As', '砷', 4, 15], [34, 'Se', '硒', 4, 16], [35, 'Br', '溴', 4, 17], [36, 'Kr', '氪', 4, 18],
  [37, 'Rb', '銣', 5, 1], [38, 'Sr', '鍶', 5, 2], [39, 'Y', '釔', 5, 3], [40, 'Zr', '鋯', 5, 4], [41, 'Nb', '鈮', 5, 5], [42, 'Mo', '鉬', 5, 6], [43, 'Tc', '鎝', 5, 7], [44, 'Ru', '釕', 5, 8], [45, 'Rh', '銠', 5, 9], [46, 'Pd', '鈀', 5, 10], [47, 'Ag', '銀', 5, 11], [48, 'Cd', '鎘', 5, 12], [49, 'In', '銦', 5, 13], [50, 'Sn', '錫', 5, 14], [51, 'Sb', '銻', 5, 15], [52, 'Te', '碲', 5, 16], [53, 'I', '碘', 5, 17], [54, 'Xe', '氙', 5, 18],
  [55, 'Cs', '銫', 6, 1], [56, 'Ba', '鋇', 6, 2],
  [57, 'La', '鑭', 6, null, 'lanthanide'], [58, 'Ce', '鈰', 6, null, 'lanthanide'], [59, 'Pr', '鐠', 6, null, 'lanthanide'], [60, 'Nd', '釹', 6, null, 'lanthanide'], [61, 'Pm', '鉕', 6, null, 'lanthanide'], [62, 'Sm', '釤', 6, null, 'lanthanide'], [63, 'Eu', '銪', 6, null, 'lanthanide'], [64, 'Gd', '釓', 6, null, 'lanthanide'], [65, 'Tb', '鋱', 6, null, 'lanthanide'], [66, 'Dy', '鏑', 6, null, 'lanthanide'], [67, 'Ho', '鈥', 6, null, 'lanthanide'], [68, 'Er', '鉺', 6, null, 'lanthanide'], [69, 'Tm', '銩', 6, null, 'lanthanide'], [70, 'Yb', '鐿', 6, null, 'lanthanide'], [71, 'Lu', '鎦', 6, null, 'lanthanide'],
  [72, 'Hf', '鉿', 6, 4], [73, 'Ta', '鉭', 6, 5], [74, 'W', '鎢', 6, 6], [75, 'Re', '錸', 6, 7], [76, 'Os', '鋨', 6, 8], [77, 'Ir', '銥', 6, 9], [78, 'Pt', '鉑', 6, 10], [79, 'Au', '金', 6, 11], [80, 'Hg', '汞', 6, 12], [81, 'Tl', '鉈', 6, 13], [82, 'Pb', '鉛', 6, 14], [83, 'Bi', '鉍', 6, 15], [84, 'Po', '釙', 6, 16], [85, 'At', '砈', 6, 17], [86, 'Rn', '氡', 6, 18],
  [87, 'Fr', '鍅', 7, 1], [88, 'Ra', '鐳', 7, 2],
  [89, 'Ac', '錒', 7, null, 'actinide'], [90, 'Th', '釷', 7, null, 'actinide'], [91, 'Pa', '鏷', 7, null, 'actinide'], [92, 'U', '鈾', 7, null, 'actinide'], [93, 'Np', '錼', 7, null, 'actinide'], [94, 'Pu', '鈽', 7, null, 'actinide'], [95, 'Am', '鋂', 7, null, 'actinide'], [96, 'Cm', '鋦', 7, null, 'actinide'], [97, 'Bk', '錇', 7, null, 'actinide'], [98, 'Cf', '鉲', 7, null, 'actinide'], [99, 'Es', '鑀', 7, null, 'actinide'], [100, 'Fm', '鐨', 7, null, 'actinide'], [101, 'Md', '鍆', 7, null, 'actinide'], [102, 'No', '鍩', 7, null, 'actinide'], [103, 'Lr', '鐒', 7, null, 'actinide'],
  [104, 'Rf', '鑪', 7, 4], [105, 'Db', '𨧀', 7, 5], [106, 'Sg', '𨭎', 7, 6], [107, 'Bh', '𨨏', 7, 7], [108, 'Hs', '𨭆', 7, 8], [109, 'Mt', '䥑', 7, 9], [110, 'Ds', '鐽', 7, 10], [111, 'Rg', '錀', 7, 11], [112, 'Cn', '鎶', 7, 12], [113, 'Nh', '鉨', 7, 13], [114, 'Fl', '鈇', 7, 14], [115, 'Mc', '鏌', 7, 15], [116, 'Lv', '鉝', 7, 16], [117, 'Ts', '鿬', 7, 17], [118, 'Og', '鿫', 7, 18],
]

function blockFor(group, series) {
  if (series) return 'f'
  if (group <= 2) return 's'
  if (group <= 12) return 'd'
  return 'p'
}

export const periodicElements = rawElements.map(([
  number,
  symbol,
  name,
  period,
  group,
  series = '',
]) => ({
  number,
  symbol,
  name,
  period,
  group,
  series,
  block: blockFor(group, series),
}))

const range = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index)

const advancedNumbers = [
  ...range(1, 18),
  19, 20, ...range(31, 38),
  37, 38, ...range(49, 56),
  55, 56, ...range(81, 88),
]

const challengeExtras = [22, ...range(24, 30), 47, 74, 78, 79, 80, 92, 113]

export const periodicLevels = {
  beginner: {
    code: 'beginner',
    label: '入門',
    description: '第一週期至第三週期，共 18 種元素',
    numbers: range(1, 18),
    questionCount: 10,
    requiredPasses: 3,
  },
  advanced: {
    code: 'advanced',
    label: '進階',
    description: '第一週期至第六週期主族元素，再加上鍅與鐳',
    numbers: [...new Set(advancedNumbers)].sort((left, right) => left - right),
    questionCount: 20,
    requiredPasses: 5,
  },
  challenge: {
    code: 'challenge',
    label: '挑戰',
    description: '進階內容加上指定過渡元素、鈾與鉨',
    numbers: [...new Set([...advancedNumbers, ...challengeExtras])].sort((left, right) => left - right),
    questionCount: 20,
    requiredPasses: null,
  },
  complete: {
    code: 'complete',
    label: '完整',
    description: '原子序 1～118，只供自由練習',
    numbers: range(1, 118),
    questionCount: 20,
    requiredPasses: null,
  },
}

export const periodicModes = {
  name_symbol: { code: 'name_symbol', label: '中文名稱選符號' },
  symbol_name: { code: 'symbol_name', label: '元素符號選名稱' },
  locate: { code: 'locate', label: '週期表定位' },
  mixed: { code: 'mixed', label: '混合挑戰' },
}

export function normalizePeriodicLevel(value, fallback = 'beginner') {
  return Object.hasOwn(periodicLevels, value) ? value : fallback
}

export function normalizePeriodicMode(value, fallback = 'mixed') {
  return Object.hasOwn(periodicModes, value) ? value : fallback
}

export function getElementsForLevel(level) {
  const normalized = normalizePeriodicLevel(level)
  const allowed = new Set(periodicLevels[normalized].numbers)
  return periodicElements.filter((element) => allowed.has(element.number))
}

export function shuffleItems(items, random = Math.random) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]]
  }
  return shuffled
}

function buildChoiceQuestion(element, mode, pool, random) {
  const valueFor = mode === 'name_symbol'
    ? (item) => item.symbol
    : (item) => item.name
  const alternatives = shuffleItems(
    pool.filter((item) => item.number !== element.number),
    random,
  ).slice(0, 3)
  const choices = shuffleItems([element, ...alternatives], random).map((item) => ({
    key: item.number,
    value: valueFor(item),
  }))
  return {
    element,
    mode,
    prompt: mode === 'name_symbol'
      ? `「${element.name}」的元素符號是？`
      : `元素符號「${element.symbol}」代表哪個元素？`,
    answer: valueFor(element),
    choices,
  }
}

export function createPeriodicQuestions({
  level = 'beginner',
  mode = 'mixed',
  count,
  random = Math.random,
  onlyNumbers = null,
} = {}) {
  const normalizedLevel = normalizePeriodicLevel(level)
  const normalizedMode = normalizePeriodicMode(mode)
  const levelElements = getElementsForLevel(normalizedLevel)
  const requestedNumbers = Array.isArray(onlyNumbers) && onlyNumbers.length > 0
    ? new Set(onlyNumbers)
    : null
  const questionPool = requestedNumbers
    ? levelElements.filter((element) => requestedNumbers.has(element.number))
    : levelElements
  const questionCount = Math.min(
    Math.max(1, Number.parseInt(count, 10) || periodicLevels[normalizedLevel].questionCount),
    questionPool.length,
  )
  const selected = shuffleItems(questionPool, random).slice(0, questionCount)
  const singleModes = ['name_symbol', 'symbol_name', 'locate']

  return selected.map((element) => {
    const questionMode = normalizedMode === 'mixed'
      ? singleModes[Math.floor(random() * singleModes.length)]
      : normalizedMode
    if (questionMode === 'locate') {
      return {
        element,
        mode: questionMode,
        prompt: `請在週期表中找出「${element.name}」`,
        answer: element.number,
        choices: [],
      }
    }
    return buildChoiceQuestion(element, questionMode, levelElements, random)
  })
}

export function applyPeriodicProgress({ level, consecutivePasses = 0, score }) {
  const normalizedLevel = normalizePeriodicLevel(level)
  if (normalizedLevel === 'complete') {
    return { level: 'complete', consecutivePasses: 0, leveledUp: false }
  }
  if (Number(score) < 80) {
    return { level: normalizedLevel, consecutivePasses: 0, leveledUp: false }
  }
  if (normalizedLevel === 'challenge') {
    return { level: 'challenge', consecutivePasses: 0, leveledUp: false }
  }
  const required = periodicLevels[normalizedLevel].requiredPasses
  const nextPasses = Number(consecutivePasses) + 1
  if (nextPasses < required) {
    return { level: normalizedLevel, consecutivePasses: nextPasses, leveledUp: false }
  }
  return {
    level: normalizedLevel === 'beginner' ? 'advanced' : 'challenge',
    consecutivePasses: 0,
    leveledUp: true,
  }
}

export function resolvePeriodicTaskLevel({ level, beginnerTasksAssigned = 0 }) {
  const normalizedLevel = normalizePeriodicLevel(level)
  if (normalizedLevel === 'beginner' && Number(beginnerTasksAssigned) >= 5) {
    return 'advanced'
  }
  return normalizedLevel === 'complete' ? 'challenge' : normalizedLevel
}

export function resolvePeriodicGameSelection({ task, requestedLevel, requestedMode }) {
  if (task) {
    return {
      level: normalizePeriodicLevel(task.level),
      mode: normalizePeriodicMode(task.mode),
    }
  }
  return {
    level: normalizePeriodicLevel(requestedLevel),
    mode: normalizePeriodicMode(requestedMode),
  }
}

export function canCountPeriodicProgress({ taskLevel, currentLevel }) {
  return normalizePeriodicLevel(taskLevel) === normalizePeriodicLevel(currentLevel)
}

export function parsePeriodicActivityCode(activityCode = '') {
  const match = String(activityCode).match(/^periodic_(beginner|advanced|challenge)_(name_symbol|symbol_name|locate|mixed)$/)
  if (!match) return null
  return { level: match[1], mode: match[2] }
}
