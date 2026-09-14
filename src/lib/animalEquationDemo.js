import { animalEquationAnimals, animalEquationRadicals } from '../data/animalEquationCards.js'
import { resolveFunctionCardState } from './animalEquationFunctions.js'
import { shufflePracticeCards } from './animalEquationPractice.js'

const starterHands = [
  ['sqrt8', 'sqrt18', 'sqrt3', 'nsqrt2', 'sqrt4'],
  ['sqrt12', 'sqrt27', 'sqrt2', 'nsqrt3', 'sqrt9'],
  ['sqrt24', 'sqrt54', 'sqrt3', 'nsqrt6', 'sqrt25'],
]
const familyNames = { integer: '整數', sqrt2: '√2', sqrt3: '√3', sqrt6: '√6' }

const radicalCard = (code) => {
  const definition = animalEquationRadicals.find((card) => card.code === code)
  return { ...definition, id: code, type: 'radical' }
}

export function createAnimalEquationDemo(random = Math.random) {
  const starterCodes = starterHands[Math.floor(random() * starterHands.length)]
  const refillCodes = shufflePracticeCards(
    animalEquationRadicals.filter((card) => !starterCodes.includes(card.code)), random,
  ).slice(0, 2).map((card) => card.code)
  return {
    phase: 'pair',
    turnNumber: 1,
    hand: shufflePracticeCards([
      ...starterCodes.map(radicalCard), { id: 'tame', code: 'tame', type: 'function', label: '馴化' },
    ], random),
    refillCodes,
    players: [
      { id: 'you', displayName: '你', seatNumber: 1, animalCount: 0, animalScore: 0, judgementStars: 0 },
      ...['AI 小狐', 'AI 海豚', 'AI 樹懶'].map((name, index) => ({
        id: `ai-${index}`, displayName: name, seatNumber: index + 2,
        animalCount: 0, animalScore: 0, judgementStars: 0, isAi: true,
      })),
    ],
    animals: shufflePracticeCards(animalEquationAnimals, random).map((animal, index) => ({
      ...animal, id: `tutorial-animal-${index + 1}`, position: index + 1, revealed: false, ownerPlayerId: null,
    })),
    message: '選擇 2 張根式牌，試著找出化簡後同類的牌。',
    lastPlay: '',
  }
}

export function submitDemoPair(room, selectedIds, variableValues = {}) {
  if (room.phase !== 'pair') return room
  const selected = selectedIds.map((id) => room.hand.find((card) => card.id === id))
  if (selected.length !== 2 || selected.some((card) => !card || card.type !== 'radical')
    || selected[0].id === selected[1].id) {
    return { ...room, message: '請選擇 2 張不同的根式牌。' }
  }
  for (const card of selected.filter((item) => item.variableCode === 'n')) {
    if (!/^[1-9][0-9]*$/.test(String(variableValues[card.id] || ''))) {
      return { ...room, message: `使用 ${card.label} 時，請先輸入正整數 n。` }
    }
  }

  const play = selected.map((card) => card.variableCode === 'n'
    ? card.label.replace('n', String(variableValues[card.id])) : card.label).join('、')
  if (selected[0].family !== selected[1].family) {
    return {
      ...room,
      players: room.players.map((player) => player.id === 'ai-0'
        ? { ...player, judgementStars: player.judgementStars + 3 } : player),
      lastPlay: play,
      message: `AI 小狐抓錯成功：${selected[0].label} 與 ${selected[1].label} 化簡後不是同類方根。正式對局會輪到下一位；試玩可重新選牌。`,
    }
  }

  return {
    ...room,
    phase: 'tame',
    turnNumber: 2,
    hand: [...room.hand.filter((card) => !selectedIds.includes(card.id)), ...room.refillCodes.map(radicalCard)],
    lastPlay: play,
    message: `出牌成立：兩張牌化簡後都屬於${familyNames[selected[0].family]}類。試玩略過其他玩家回合，接著使用「馴化」。`,
  }
}

export function tameDemoAnimal(room, animalId) {
  if (room.phase !== 'tame' || !room.hand.some((card) => card.code === 'tame')) return room
  try {
    const result = resolveFunctionCardState({
      players: room.players, animals: room.animals,
      actorPlayerId: 'you', targetAnimalId: animalId, functionCode: 'tame',
    })
    const captured = result.animals.find((animal) => animal.id === animalId)
    return {
      ...room,
      phase: 'complete',
      players: result.players,
      animals: result.animals,
      hand: room.hand.filter((card) => card.code !== 'tame'),
      message: `馴化成功！你翻到${captured.name}，獲得 ${captured.score} 分。正式對局先收集 4 張動物或達到 40 分者獲勝。`,
    }
  } catch {
    return { ...room, message: '請選擇中央尚未翻開的動物牌。' }
  }
}
