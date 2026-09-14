export const animalEquationAnimals = [
  { code: 'deer', name: '梅花鹿', score: 20, icon: '🦌' },
  { code: 'octopus', name: '章魚', score: 20, icon: '🐙' },
  { code: 'sloth', name: '樹懶', score: 20, icon: '🦥' },
  { code: 'beluga', name: '白鯨', score: 20, icon: '🐋' },
  { code: 'ostrich', name: '鴕鳥', score: 15, icon: '🪶' },
  { code: 'poodle', name: '紅貴賓', score: 15, icon: '🐩' },
  { code: 'tabby', name: '虎斑貓', score: 15, icon: '🐈' },
  { code: 'dolphin', name: '海豚', score: 15, icon: '🐬' },
  { code: 'beaver', name: '海狸', score: 10, icon: '🦫' },
  { code: 'wallaby', name: '矮袋鼠', score: 10, icon: '🦘' },
  { code: 'pig', name: '粉紅豬', score: 10, icon: '🐷' },
  { code: 'goldfish', name: '金魚', score: 10, icon: '🐠' },
  { code: 'chihuahua', name: '吉娃娃', score: 5, icon: '🐕' },
  { code: 'fox', name: '狐狸', score: 5, icon: '🦊' },
  { code: 'maltese', name: '馬爾濟斯', score: 5, icon: '🐶' },
  { code: 'corgi', name: '柯基犬', score: 5, icon: '🐕‍🦺' },
]

export const animalEquationFunctions = [
  { code: 'tame', name: '馴化', icon: '🤝', quantity: 14, description: '翻開中央一張動物卡，移到自己的得分區。' },
  { code: 'accuse', name: '指控', icon: '📣', quantity: 4, description: '指定對手得分區的一張動物卡，準備將它蓋回桌面。' },
  { code: 'clarify', name: '澄清', icon: '🛡️', quantity: 4, description: '遭到指控時立即打出，使該張動物卡免於被蓋回。' },
  { code: 'tempt', name: '誘惑', icon: '🧲', quantity: 3, description: '指定對手得分區的一張動物卡，準備移到自己的得分區。' },
  { code: 'gender_error', name: '性別錯誤', icon: '🚫', quantity: 3, description: '遭到誘惑時立即打出，使該張動物卡免於被移走。' },
]

// 依《卡牌種類與數量》彙總。四個運算家族各 18 張，連同 28 張功能牌共 100 張。
export const animalEquationRadicals = [
  { code: 'sqrt1', label: '√1', coefficient: 1, radicand: 1, family: 'integer', quantity: 3 },
  { code: 'sqrt4', label: '√4', coefficient: 1, radicand: 4, family: 'integer', quantity: 3 },
  { code: 'sqrt9', label: '√9', coefficient: 1, radicand: 9, family: 'integer', quantity: 3 },
  { code: 'sqrt25', label: '√25', coefficient: 1, radicand: 25, family: 'integer', quantity: 3 },
  { code: 'n', label: 'n', variableCode: 'n', family: 'integer', quantity: 6 },
  { code: 'sqrt2', label: '√2', coefficient: 1, radicand: 2, family: 'sqrt2', quantity: 3 },
  { code: 'sqrt8', label: '√8', coefficient: 1, radicand: 8, family: 'sqrt2', quantity: 3 },
  { code: 'sqrt18', label: '√18', coefficient: 1, radicand: 18, family: 'sqrt2', quantity: 3 },
  { code: 'sqrt50', label: '√50', coefficient: 1, radicand: 50, family: 'sqrt2', quantity: 3 },
  { code: 'nsqrt2', label: 'n√2', variableCode: 'n', radicand: 2, family: 'sqrt2', quantity: 6 },
  { code: 'sqrt3', label: '√3', coefficient: 1, radicand: 3, family: 'sqrt3', quantity: 3 },
  { code: 'sqrt12', label: '√12', coefficient: 1, radicand: 12, family: 'sqrt3', quantity: 3 },
  { code: 'sqrt27', label: '√27', coefficient: 1, radicand: 27, family: 'sqrt3', quantity: 3 },
  { code: 'sqrt75', label: '√75', coefficient: 1, radicand: 75, family: 'sqrt3', quantity: 3 },
  { code: 'nsqrt3', label: 'n√3', variableCode: 'n', radicand: 3, family: 'sqrt3', quantity: 6 },
  { code: 'sqrt6', label: '√6', coefficient: 1, radicand: 6, family: 'sqrt6', quantity: 3 },
  { code: 'sqrt24', label: '√24', coefficient: 1, radicand: 24, family: 'sqrt6', quantity: 3 },
  { code: 'sqrt54', label: '√54', coefficient: 1, radicand: 54, family: 'sqrt6', quantity: 3 },
  { code: 'sqrt96', label: '√96', coefficient: 1, radicand: 96, family: 'sqrt6', quantity: 3 },
  { code: 'nsqrt6', label: 'n√6', variableCode: 'n', radicand: 6, family: 'sqrt6', quantity: 6 },
]

export const animalEquationRuleCards = [
  {
    code: 'flow',
    title: '遊戲流程',
    summary: '定位、發牌、輪流出牌，先收集 4 張動物或取得 40 分。',
    steps: [
      '遊戲固定 4 個座位；可由 1～4 位真人進入，其餘空位在開始時由 AI 自動補滿。',
      '每位玩家取得 6 張私人手牌，中央隨機放置 16 張蓋住的動物卡。',
      '每回合可出根號牌，或使用 1 張功能牌。',
      '完成出牌後自動補回 6 張，再輪到下一位玩家。',
      '牌庫不足時，系統會自動洗回棄牌。',
      '最先收集 4 張動物卡，或動物總分達到 40 分者獲勝。',
    ],
  },
  {
    code: 'radical',
    title: '出根號牌',
    summary: '可出 1 張、2 張同類方根，或用多張牌組成正確等式。',
    steps: [
      '出 1 張任意根號牌。',
      '出 2 張化簡後為同類方根的根號牌。',
      '出多張根號牌時，必須使用四則運算組成正確等式。',
      '被選入等式的每張牌都要使用 1 次，不能漏用或重複使用。',
      '送出後開放其他玩家抓錯，系統會在背景核對等式。',
    ],
  },
  {
    code: 'function',
    title: '功能牌與抓錯',
    summary: '馴化、指控、澄清、誘惑及性別錯誤均由系統執行。',
    steps: [
      ...animalEquationFunctions.map((card) => `${card.name}：${card.description}`),
      '抓錯成功者獲得 3 顆判讀星；抓錯失敗者扣 1 顆。',
      '錯誤等式若無人抓到，系統仍會取消該次出牌，不會讓錯誤得到獎勵。',
      '判讀星只在動物分數與動物張數都相同時作為平手判定。',
    ],
  },
]
