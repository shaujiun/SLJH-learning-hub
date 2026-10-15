export const particleElementStyles = {
  H: { name: '氫', color: '#f7fbff', border: '#7894aa', text: '#24384a' },
  C: { name: '碳', color: '#344052', border: '#172131', text: '#ffffff' },
  N: { name: '氮', color: '#6e8fe8', border: '#3858aa', text: '#ffffff' },
  O: { name: '氧', color: '#ef6b62', border: '#a93632', text: '#ffffff' },
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

export const chemicalBalanceRoadmap = [
  { stage: 1, title: '分子組裝室', description: '化學式與粒子模型雙向判讀。', status: 'open' },
  { stage: 2, title: '原子守恆天平', description: '用粒子模型讓反應前後原子數相同。', status: 'planned' },
  { stage: 3, title: '係數平衡訓練', description: '從統計表逐步過渡到只看反應式。', status: 'planned' },
  { stage: 4, title: '完整反應式挑戰', description: '先確認化學式，再化為最簡整數係數。', status: 'planned' },
]
