export const typicalIonElements = [
  { id: 'sodium', name: '鈉', symbol: 'Na', atomicNumber: 11, neutrons: 12, shells: [2, 8, 1], ionShells: [2, 8], transfer: 'lose', transferCount: 1, charge: 1 },
  { id: 'magnesium', name: '鎂', symbol: 'Mg', atomicNumber: 12, neutrons: 12, shells: [2, 8, 2], ionShells: [2, 8], transfer: 'lose', transferCount: 2, charge: 2 },
  { id: 'aluminum', name: '鋁', symbol: 'Al', atomicNumber: 13, neutrons: 14, shells: [2, 8, 3], ionShells: [2, 8], transfer: 'lose', transferCount: 3, charge: 3 },
  { id: 'potassium', name: '鉀', symbol: 'K', atomicNumber: 19, neutrons: 20, shells: [2, 8, 8, 1], ionShells: [2, 8, 8], transfer: 'lose', transferCount: 1, charge: 1 },
  { id: 'calcium', name: '鈣', symbol: 'Ca', atomicNumber: 20, neutrons: 20, shells: [2, 8, 8, 2], ionShells: [2, 8, 8], transfer: 'lose', transferCount: 2, charge: 2 },
  { id: 'nitrogen', name: '氮', symbol: 'N', atomicNumber: 7, neutrons: 7, shells: [2, 5], ionShells: [2, 8], transfer: 'gain', transferCount: 3, charge: -3 },
  { id: 'oxygen', name: '氧', symbol: 'O', atomicNumber: 8, neutrons: 8, shells: [2, 6], ionShells: [2, 8], transfer: 'gain', transferCount: 2, charge: -2 },
  { id: 'fluorine', name: '氟', symbol: 'F', atomicNumber: 9, neutrons: 10, shells: [2, 7], ionShells: [2, 8], transfer: 'gain', transferCount: 1, charge: -1 },
  { id: 'sulfur', name: '硫', symbol: 'S', atomicNumber: 16, neutrons: 16, shells: [2, 8, 6], ionShells: [2, 8, 8], transfer: 'gain', transferCount: 2, charge: -2 },
  { id: 'chlorine', name: '氯', symbol: 'Cl', atomicNumber: 17, neutrons: 18, shells: [2, 8, 7], ionShells: [2, 8, 8], transfer: 'gain', transferCount: 1, charge: -1 },
]

export const chemistryIons = [
  { id: 'lithium-ion', name: '鋰離子', formula: 'Li', charge: 1, kind: 'cation', polyatomic: false },
  { id: 'sodium-ion', name: '鈉離子', formula: 'Na', charge: 1, kind: 'cation', polyatomic: false },
  { id: 'potassium-ion', name: '鉀離子', formula: 'K', charge: 1, kind: 'cation', polyatomic: false },
  { id: 'magnesium-ion', name: '鎂離子', formula: 'Mg', charge: 2, kind: 'cation', polyatomic: false },
  { id: 'calcium-ion', name: '鈣離子', formula: 'Ca', charge: 2, kind: 'cation', polyatomic: false },
  { id: 'aluminum-ion', name: '鋁離子', formula: 'Al', charge: 3, kind: 'cation', polyatomic: false },
  { id: 'ammonium', name: '銨根', formula: 'NH4', charge: 1, kind: 'cation', polyatomic: true, commonRoot: true },
  { id: 'chloride-ion', name: '氯離子', formula: 'Cl', charge: -1, kind: 'anion', polyatomic: false },
  { id: 'oxide-ion', name: '氧離子', formula: 'O', charge: -2, kind: 'anion', polyatomic: false },
  { id: 'hydroxide', name: '氫氧根', formula: 'OH', charge: -1, kind: 'anion', polyatomic: true, commonRoot: true },
  { id: 'carbonate', name: '碳酸根', formula: 'CO3', charge: -2, kind: 'anion', polyatomic: true, commonRoot: true },
  { id: 'bicarbonate', name: '碳酸氫根', formula: 'HCO3', charge: -1, kind: 'anion', polyatomic: true, commonRoot: true },
  { id: 'sulfate', name: '硫酸根', formula: 'SO4', charge: -2, kind: 'anion', polyatomic: true, commonRoot: true },
  { id: 'acetate', name: '醋酸根', formula: 'CH3COO', charge: -1, kind: 'anion', polyatomic: true, commonRoot: true },
  { id: 'nitrate', name: '硝酸根', formula: 'NO3', charge: -1, kind: 'anion', polyatomic: true, commonRoot: true },
  { id: 'chromate', name: '鉻酸根', formula: 'CrO4', charge: -2, kind: 'anion', polyatomic: true, commonRoot: true },
]

export const commonPolyatomicIons = chemistryIons.filter((ion) => ion.commonRoot)

const compoundDefinitions = [
  ['lithium-chloride', '氯化鋰', 'lithium-ion', 'chloride-ion'],
  ['sodium-chloride', '氯化鈉', 'sodium-ion', 'chloride-ion'],
  ['potassium-chloride', '氯化鉀', 'potassium-ion', 'chloride-ion'],
  ['magnesium-chloride', '氯化鎂', 'magnesium-ion', 'chloride-ion'],
  ['calcium-chloride', '氯化鈣', 'calcium-ion', 'chloride-ion'],
  ['aluminum-chloride', '氯化鋁', 'aluminum-ion', 'chloride-ion'],
  ['ammonium-chloride', '氯化銨', 'ammonium', 'chloride-ion'],
  ['lithium-oxide', '氧化鋰', 'lithium-ion', 'oxide-ion'],
  ['sodium-oxide', '氧化鈉', 'sodium-ion', 'oxide-ion'],
  ['potassium-oxide', '氧化鉀', 'potassium-ion', 'oxide-ion'],
  ['magnesium-oxide', '氧化鎂', 'magnesium-ion', 'oxide-ion'],
  ['calcium-oxide', '氧化鈣', 'calcium-ion', 'oxide-ion'],
  ['aluminum-oxide', '氧化鋁', 'aluminum-ion', 'oxide-ion'],
  ['sodium-hydroxide', '氫氧化鈉', 'sodium-ion', 'hydroxide'],
  ['potassium-hydroxide', '氫氧化鉀', 'potassium-ion', 'hydroxide'],
  ['magnesium-hydroxide', '氫氧化鎂', 'magnesium-ion', 'hydroxide'],
  ['calcium-hydroxide', '氫氧化鈣', 'calcium-ion', 'hydroxide'],
  ['aluminum-hydroxide', '氫氧化鋁', 'aluminum-ion', 'hydroxide'],
  ['sodium-carbonate', '碳酸鈉', 'sodium-ion', 'carbonate'],
  ['potassium-carbonate', '碳酸鉀', 'potassium-ion', 'carbonate'],
  ['magnesium-carbonate', '碳酸鎂', 'magnesium-ion', 'carbonate'],
  ['calcium-carbonate', '碳酸鈣', 'calcium-ion', 'carbonate'],
  ['ammonium-carbonate', '碳酸銨', 'ammonium', 'carbonate'],
  ['sodium-bicarbonate', '碳酸氫鈉', 'sodium-ion', 'bicarbonate'],
  ['potassium-bicarbonate', '碳酸氫鉀', 'potassium-ion', 'bicarbonate'],
  ['calcium-bicarbonate', '碳酸氫鈣', 'calcium-ion', 'bicarbonate'],
  ['sodium-sulfate', '硫酸鈉', 'sodium-ion', 'sulfate'],
  ['potassium-sulfate', '硫酸鉀', 'potassium-ion', 'sulfate'],
  ['magnesium-sulfate', '硫酸鎂', 'magnesium-ion', 'sulfate'],
  ['calcium-sulfate', '硫酸鈣', 'calcium-ion', 'sulfate'],
  ['aluminum-sulfate', '硫酸鋁', 'aluminum-ion', 'sulfate'],
  ['ammonium-sulfate', '硫酸銨', 'ammonium', 'sulfate'],
  ['sodium-nitrate', '硝酸鈉', 'sodium-ion', 'nitrate'],
  ['potassium-nitrate', '硝酸鉀', 'potassium-ion', 'nitrate'],
  ['magnesium-nitrate', '硝酸鎂', 'magnesium-ion', 'nitrate'],
  ['calcium-nitrate', '硝酸鈣', 'calcium-ion', 'nitrate'],
  ['aluminum-nitrate', '硝酸鋁', 'aluminum-ion', 'nitrate'],
  ['ammonium-nitrate', '硝酸銨', 'ammonium', 'nitrate'],
  ['sodium-chromate', '鉻酸鈉', 'sodium-ion', 'chromate'],
  ['potassium-chromate', '鉻酸鉀', 'potassium-ion', 'chromate'],
  ['calcium-chromate', '鉻酸鈣', 'calcium-ion', 'chromate'],
  ['calcium-acetate', '醋酸鈣', 'calcium-ion', 'acetate'],
]

const ionById = new Map(chemistryIons.map((ion) => [ion.id, ion]))

function greatestCommonDivisor(left, right) {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b) [a, b] = [b, a % b]
  return a || 1
}

function ionCountPair(cation, anion) {
  const commonCharge = Math.abs(cation.charge * anion.charge) / greatestCommonDivisor(cation.charge, anion.charge)
  return {
    cationCount: commonCharge / Math.abs(cation.charge),
    anionCount: commonCharge / Math.abs(anion.charge),
  }
}

function formulaPart(ion, count) {
  if (count === 1) return ion.formula
  return `${ion.polyatomic ? `(${ion.formula})` : ion.formula}${count}`
}

export const ionicCompounds = compoundDefinitions.map(([id, name, cationId, anionId]) => {
  const cation = ionById.get(cationId)
  const anion = ionById.get(anionId)
  const counts = ionCountPair(cation, anion)
  return {
    id,
    name,
    cation,
    anion,
    ...counts,
    formula: `${formulaPart(cation, counts.cationCount)}${formulaPart(anion, counts.anionCount)}`,
  }
})

