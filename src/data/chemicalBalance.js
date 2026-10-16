export const particleElementStyles = {
  H: { name: '氫', color: '#f7fbff', border: '#7894aa', text: '#24384a' },
  C: { name: '碳', color: '#344052', border: '#172131', text: '#ffffff' },
  N: { name: '氮', color: '#6e8fe8', border: '#3858aa', text: '#ffffff' },
  O: { name: '氧', color: '#ef6b62', border: '#a93632', text: '#ffffff' },
  S: { name: '硫', color: '#f3c744', border: '#9b7614', text: '#3f3006' },
  Cl: { name: '氯', color: '#62bd77', border: '#287940', text: '#173b22' },
}

export const stageOneMolecules = [
  {
    id: 'hydrogen', name: '氫分子', formula: 'H2', atoms: { H: 2 }, bondHint: '兩顆 H 之間建立 1 個單鍵。',
    model: [{ symbol: 'H', x: 39, y: 50 }, { symbol: 'H', x: 61, y: 50 }],
    bonds: [[0, 1]],
  },
  {
    id: 'oxygen', name: '氧分子', formula: 'O2', atoms: { O: 2 }, bondHint: '兩顆 O 之間建立 1 個雙鍵。',
    model: [{ symbol: 'O', x: 38, y: 50 }, { symbol: 'O', x: 62, y: 50 }],
    bonds: [[0, 1], [0, 1]],
  },
  {
    id: 'nitrogen', name: '氮分子', formula: 'N2', atoms: { N: 2 }, bondHint: '兩顆 N 之間建立 1 個三鍵。',
    model: [{ symbol: 'N', x: 38, y: 50 }, { symbol: 'N', x: 62, y: 50 }],
    bonds: [[0, 1], [0, 1], [0, 1]],
  },
  {
    id: 'water', name: '水分子', formula: 'H2O', atoms: { H: 2, O: 1 }, bondHint: 'O 放中央，分別和兩顆 H 建立單鍵。',
    model: [{ symbol: 'O', x: 50, y: 54 }, { symbol: 'H', x: 31, y: 35 }, { symbol: 'H', x: 69, y: 35 }],
    bonds: [[0, 1], [0, 2]],
  },
  {
    id: 'carbon-dioxide', name: '二氧化碳分子', formula: 'CO2', atoms: { C: 1, O: 2 }, bondHint: 'C 放中央，分別和兩顆 O 建立雙鍵。',
    model: [{ symbol: 'O', x: 25, y: 50 }, { symbol: 'C', x: 50, y: 50 }, { symbol: 'O', x: 75, y: 50 }],
    bonds: [[0, 1], [0, 1], [1, 2], [1, 2]],
  },
  {
    id: 'ammonia', name: '氨分子', formula: 'NH3', atoms: { N: 1, H: 3 }, bondHint: 'N 放中央，分別和三顆 H 建立單鍵。',
    model: [{ symbol: 'N', x: 50, y: 48 }, { symbol: 'H', x: 50, y: 22 }, { symbol: 'H', x: 27, y: 70 }, { symbol: 'H', x: 73, y: 70 }],
    bonds: [[0, 1], [0, 2], [0, 3]],
  },
  {
    id: 'methane', name: '甲烷分子', formula: 'CH4', atoms: { C: 1, H: 4 }, bondHint: 'C 放中央，分別和四顆 H 建立單鍵。',
    model: [{ symbol: 'C', x: 50, y: 50 }, { symbol: 'H', x: 50, y: 19 }, { symbol: 'H', x: 50, y: 81 }, { symbol: 'H', x: 19, y: 50 }, { symbol: 'H', x: 81, y: 50 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
  },
  {
    id: 'hydrogen-chloride', name: '氯化氫分子', formula: 'HCl', atoms: { H: 1, Cl: 1 }, bondHint: 'H 和 Cl 之間建立 1 個單鍵。',
    model: [{ symbol: 'H', x: 37, y: 50 }, { symbol: 'Cl', x: 63, y: 50 }],
    bonds: [[0, 1]],
  },
  {
    id: 'chlorine', name: '氯分子', formula: 'Cl2', atoms: { Cl: 2 }, bondHint: '兩顆 Cl 之間建立 1 個單鍵。',
    model: [{ symbol: 'Cl', x: 38, y: 50 }, { symbol: 'Cl', x: 62, y: 50 }],
    bonds: [[0, 1]],
  },
  {
    id: 'hydrogen-peroxide', name: '過氧化氫分子', formula: 'H2O2', atoms: { H: 2, O: 2 }, bondHint: '依照 H－O－O－H 的順序建立單鍵。',
    model: [{ symbol: 'H', x: 18, y: 39 }, { symbol: 'O', x: 39, y: 54 }, { symbol: 'O', x: 61, y: 46 }, { symbol: 'H', x: 82, y: 61 }],
    bonds: [[0, 1], [1, 2], [2, 3]],
  },
  {
    id: 'formaldehyde', name: '甲醛分子', formula: 'CH2O', atoms: { C: 1, H: 2, O: 1 }, bondHint: 'C 放中央，和 O 建立雙鍵，再分別和兩顆 H 建立單鍵。',
    model: [{ symbol: 'C', x: 48, y: 50 }, { symbol: 'O', x: 73, y: 50 }, { symbol: 'H', x: 30, y: 30 }, { symbol: 'H', x: 30, y: 70 }],
    bonds: [[0, 1], [0, 1], [0, 2], [0, 3]],
  },
  {
    id: 'chloromethane', name: '氯甲烷分子', formula: 'CH3Cl', atoms: { C: 1, H: 3, Cl: 1 }, bondHint: 'C 放中央，分別和三顆 H、一顆 Cl 建立單鍵。',
    model: [{ symbol: 'C', x: 50, y: 50 }, { symbol: 'Cl', x: 78, y: 50 }, { symbol: 'H', x: 35, y: 25 }, { symbol: 'H', x: 35, y: 75 }, { symbol: 'H', x: 22, y: 50 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
  },
  {
    id: 'methanol', name: '甲醇分子', formula: 'CH3OH', atoms: { C: 1, H: 4, O: 1 }, bondHint: 'C 和三顆 H、O 建立單鍵；O 再和另一顆 H 建立單鍵。',
    model: [{ symbol: 'C', x: 39, y: 50 }, { symbol: 'O', x: 64, y: 50 }, { symbol: 'H', x: 25, y: 27 }, { symbol: 'H', x: 25, y: 73 }, { symbol: 'H', x: 15, y: 50 }, { symbol: 'H', x: 84, y: 50 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5]],
  },
  {
    id: 'ethyne', name: '乙炔分子', formula: 'C2H2', atoms: { C: 2, H: 2 }, bondHint: '兩顆 C 之間建立三鍵，兩端再各連接一顆 H。',
    model: [{ symbol: 'C', x: 40, y: 50 }, { symbol: 'C', x: 60, y: 50 }, { symbol: 'H', x: 17, y: 50 }, { symbol: 'H', x: 83, y: 50 }],
    bonds: [[0, 1], [0, 1], [0, 1], [0, 2], [1, 3]],
  },
  {
    id: 'ethene', name: '乙烯分子', formula: 'C2H4', atoms: { C: 2, H: 4 }, bondHint: '兩顆 C 之間建立雙鍵，每顆 C 再分別連接兩顆 H。',
    model: [{ symbol: 'C', x: 42, y: 50 }, { symbol: 'C', x: 58, y: 50 }, { symbol: 'H', x: 24, y: 27 }, { symbol: 'H', x: 24, y: 73 }, { symbol: 'H', x: 76, y: 27 }, { symbol: 'H', x: 76, y: 73 }],
    bonds: [[0, 1], [0, 1], [0, 2], [0, 3], [1, 4], [1, 5]],
  },
  {
    id: 'ethane', name: '乙烷分子', formula: 'C2H6', atoms: { C: 2, H: 6 }, bondHint: '兩顆 C 之間建立單鍵，每顆 C 再分別連接三顆 H。',
    model: [{ symbol: 'C', x: 42, y: 50 }, { symbol: 'C', x: 58, y: 50 }, { symbol: 'H', x: 27, y: 25 }, { symbol: 'H', x: 22, y: 50 }, { symbol: 'H', x: 27, y: 75 }, { symbol: 'H', x: 73, y: 25 }, { symbol: 'H', x: 78, y: 50 }, { symbol: 'H', x: 73, y: 75 }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [1, 6], [1, 7]],
  },
  {
    id: 'hydrogen-sulfide', name: '硫化氫分子', formula: 'H2S', atoms: { H: 2, S: 1 }, bondHint: 'S 放中央，分別和兩顆 H 建立單鍵。',
    model: [{ symbol: 'S', x: 50, y: 55 }, { symbol: 'H', x: 31, y: 35 }, { symbol: 'H', x: 69, y: 35 }],
    bonds: [[0, 1], [0, 2]],
  },
  {
    id: 'sulfur-dioxide', name: '二氧化硫分子', formula: 'SO2', atoms: { S: 1, O: 2 }, bondHint: 'S 放中央，分別和兩顆 O 建立雙鍵。',
    model: [{ symbol: 'S', x: 50, y: 57 }, { symbol: 'O', x: 27, y: 37 }, { symbol: 'O', x: 73, y: 37 }],
    bonds: [[0, 1], [0, 1], [0, 2], [0, 2]],
  },
  {
    id: 'sulfur-trioxide', name: '三氧化硫分子', formula: 'SO3', atoms: { S: 1, O: 3 }, bondHint: 'S 放中央，分別和三顆 O 建立雙鍵。',
    model: [{ symbol: 'S', x: 50, y: 50 }, { symbol: 'O', x: 50, y: 20 }, { symbol: 'O', x: 24, y: 70 }, { symbol: 'O', x: 76, y: 70 }],
    bonds: [[0, 1], [0, 1], [0, 2], [0, 2], [0, 3], [0, 3]],
  },
  {
    id: 'sulfurous-acid', name: '亞硫酸分子', formula: 'H2SO3', atoms: { H: 2, S: 1, O: 3 }, bondHint: 'S 和一顆 O 建立雙鍵，再和兩個 O－H 結構建立單鍵。',
    model: [{ symbol: 'S', x: 50, y: 50 }, { symbol: 'O', x: 50, y: 18 }, { symbol: 'O', x: 29, y: 65 }, { symbol: 'O', x: 71, y: 65 }, { symbol: 'H', x: 13, y: 80 }, { symbol: 'H', x: 87, y: 80 }],
    bonds: [[0, 1], [0, 1], [0, 2], [0, 3], [2, 4], [3, 5]],
  },
  {
    id: 'sulfuric-acid', name: '硫酸分子', formula: 'H2SO4', atoms: { H: 2, S: 1, O: 4 }, bondHint: 'S 和兩顆 O 建立雙鍵，再和兩個 O－H 結構建立單鍵。',
    model: [{ symbol: 'S', x: 50, y: 50 }, { symbol: 'O', x: 50, y: 18 }, { symbol: 'O', x: 50, y: 82 }, { symbol: 'O', x: 27, y: 50 }, { symbol: 'O', x: 73, y: 50 }, { symbol: 'H', x: 10, y: 50 }, { symbol: 'H', x: 90, y: 50 }],
    bonds: [[0, 1], [0, 1], [0, 2], [0, 2], [0, 3], [0, 4], [3, 5], [4, 6]],
  },
]

export const coefficientConceptQuestions = [
  {
    id: 'coefficient-two-water',
    mode: 'concept',
    prompt: '2H₂O 表示什麼？',
    answer: 'two-water-particles',
    choices: [
      { value: 'two-water-particles', label: '2 個水分子，共有 4 個 H、2 個 O' },
      { value: 'one-peroxide-particle', label: '1 個過氧化氫分子，共有 2 個 H、2 個 O' },
      { value: 'two-hydrogen-one-oxygen', label: '只有 2 個 H、1 個 O' },
    ],
    explanation: '前方的 2 會乘上整個 H₂O，所以共有 4 個 H 原子與 2 個 O 原子。',
  },
  {
    id: 'subscript-peroxide',
    mode: 'concept',
    prompt: '哪一個式子表示「1 個粒子中有 2 個 H 與 2 個 O」？',
    answer: 'H2O2',
    choices: [
      { value: '2H2O', label: '2H₂O' },
      { value: 'H2O2', label: 'H₂O₂' },
      { value: 'H2O', label: 'H₂O' },
    ],
    explanation: 'H₂O₂ 的兩個右下角數字都屬於同一個粒子；2H₂O 則代表 2 個水分子。',
  },
]

export const stageTwoReactions = [
  {
    id: 'hydrogen-chloride-formation',
    prompt: '讓氫氣與氯氣生成氯化氫，使反應前後原子數相同。',
    tip: '左側的 H 與 Cl 都是兩個一組，右側也要出現相同數量。',
    reactants: [{ moleculeId: 'hydrogen' }, { moleculeId: 'chlorine' }],
    products: [{ moleculeId: 'hydrogen-chloride' }],
    answer: { reactants: [1, 1], products: [2] },
  },
  {
    id: 'water-formation',
    prompt: '讓氫氣與氧氣生成水，使反應前後原子數相同。',
    tip: '先看 O₂ 的兩顆氧，右側需要幾個水分子？',
    reactants: [{ moleculeId: 'hydrogen' }, { moleculeId: 'oxygen' }],
    products: [{ moleculeId: 'water' }],
    answer: { reactants: [2, 1], products: [2] },
  },
  {
    id: 'ammonia-formation',
    prompt: '讓氮氣與氫氣生成氨，使反應前後原子數相同。',
    tip: '先讓右側有兩個 N，再調整 H 的數量。',
    reactants: [{ moleculeId: 'nitrogen' }, { moleculeId: 'hydrogen' }],
    products: [{ moleculeId: 'ammonia' }],
    answer: { reactants: [1, 3], products: [2] },
  },
  {
    id: 'methane-combustion',
    prompt: '讓甲烷完全燃燒生成二氧化碳與水。',
    tip: '依序平衡 C、H，最後再調整 O。',
    reactants: [{ moleculeId: 'methane' }, { moleculeId: 'oxygen' }],
    products: [{ moleculeId: 'carbon-dioxide' }, { moleculeId: 'water' }],
    answer: { reactants: [1, 2], products: [1, 2] },
  },
  {
    id: 'hydrogen-peroxide-decomposition',
    prompt: '讓過氧化氫分解生成水與氧氣。',
    tip: '先把過氧化氫與水的係數調成相同，再檢查剩下的氧。',
    reactants: [{ moleculeId: 'hydrogen-peroxide' }],
    products: [{ moleculeId: 'water' }, { moleculeId: 'oxygen' }],
    answer: { reactants: [2], products: [2, 1] },
  },
  {
    id: 'sulfur-trioxide-formation',
    prompt: '讓二氧化硫與氧氣生成三氧化硫。',
    tip: '先讓左右兩側的 S 相同，再檢查 O。',
    reactants: [{ moleculeId: 'sulfur-dioxide' }, { moleculeId: 'oxygen' }],
    products: [{ moleculeId: 'sulfur-trioxide' }],
    answer: { reactants: [2, 1], products: [2] },
  },
  {
    id: 'hydrogen-sulfide-combustion',
    prompt: '讓硫化氫燃燒生成二氧化硫與水。',
    tip: '先平衡 H 與 S，最後再數兩側的 O。',
    reactants: [{ moleculeId: 'hydrogen-sulfide' }, { moleculeId: 'oxygen' }],
    products: [{ moleculeId: 'sulfur-dioxide' }, { moleculeId: 'water' }],
    answer: { reactants: [2, 3], products: [2, 2] },
  },
]

export const stageThreeProgression = [
  {
    reactionId: 'hydrogen-chloride-formation',
    support: 'live',
    supportLabel: '統計輔助',
    instruction: '原子統計會隨係數同步變化。先觀察數字，再找出最簡整數比。',
  },
  {
    reactionId: 'water-formation',
    support: 'live',
    supportLabel: '統計輔助',
    instruction: '先平衡只出現在一種物質中的元素，再處理另一種元素。',
  },
  {
    reactionId: 'ammonia-formation',
    support: 'after-check',
    supportLabel: '檢查後提示',
    instruction: '先自行計算；第一次檢查後，若尚未守恆才會開啟原子統計。',
  },
  {
    reactionId: 'hydrogen-peroxide-decomposition',
    support: 'after-check',
    supportLabel: '檢查後提示',
    instruction: '不要更改化學式的右下角數字，只能調整各物質前方的係數。',
  },
  {
    reactionId: 'sulfur-trioxide-formation',
    support: 'after-check',
    supportLabel: '檢查後提示',
    instruction: '先處理硫，再用氧原子數檢查是否完整守恆。',
  },
  {
    reactionId: 'methane-combustion',
    support: 'formula-only',
    supportLabel: '反應式挑戰',
    instruction: '依序平衡 C、H、O；作答期間不再提供原子統計表。',
  },
  {
    reactionId: 'hydrogen-sulfide-combustion',
    support: 'formula-only',
    supportLabel: '反應式挑戰',
    instruction: '依序平衡 H、S、O，最後確認所有係數已是最簡整數比。',
  },
]

export const formulaChoicesByMoleculeId = {
  hydrogen: ['H', 'H2O'],
  chlorine: ['Cl', 'HCl'],
  'hydrogen-chloride': ['H2Cl', 'HCl2'],
  oxygen: ['O', 'O3'],
  water: ['H2O2', 'HO2'],
  nitrogen: ['N', 'NH3'],
  ammonia: ['NH2', 'N3H'],
  methane: ['CH3', 'C2H4'],
  'carbon-dioxide': ['CO', 'C2O'],
  'hydrogen-peroxide': ['H2O', 'HO2'],
  'sulfur-dioxide': ['SO', 'SO3'],
  'sulfur-trioxide': ['SO2', 'H2SO3'],
  'hydrogen-sulfide': ['HS', 'H2SO3'],
}

export const stageFourReactionIds = [
  'hydrogen-chloride-formation',
  'water-formation',
  'ammonia-formation',
  'hydrogen-peroxide-decomposition',
  'sulfur-trioxide-formation',
  'methane-combustion',
  'hydrogen-sulfide-combustion',
]

export const chemicalBalanceRoadmap = [
  { stage: 1, title: '分子組裝室', description: '化學式與粒子模型雙向判讀。', status: 'open' },
  { stage: 2, title: '原子守恆天平', description: '用粒子模型讓反應前後原子數相同。', status: 'open' },
  { stage: 3, title: '係數平衡訓練', description: '從統計表逐步過渡到只看反應式。', status: 'open' },
  { stage: 4, title: '完整反應式挑戰', description: '先確認化學式，再化為最簡整數係數。', status: 'open' },
]
