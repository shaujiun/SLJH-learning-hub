import { animalEquationAnimals, animalEquationFunctions, animalEquationRadicals } from '../data/animalEquationCards.js'
import { functionCardTargets, resolveFunctionCardState } from './animalEquationFunctions.js'

const playerDefinitions = [
  { id: 'you', displayName: '你', seatNumber: 1, isAi: false },
  { id: 'ai-fox', displayName: 'AI 小狐', seatNumber: 2, isAi: true },
  { id: 'ai-dolphin', displayName: 'AI 海豚', seatNumber: 3, isAi: true },
  { id: 'ai-sloth', displayName: 'AI 樹懶', seatNumber: 4, isAi: true },
]

const pick = (items, random) => items[Math.floor(random() * items.length)]

export function shufflePracticeCards(items, random = Math.random) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]]
  }
  return shuffled
}

function buildDeck(random) {
  const definitions = [
    ...animalEquationRadicals.map((card) => ({ ...card, type: 'radical' })),
    ...animalEquationFunctions.map((card) => ({ ...card, type: 'function', label: card.name })),
  ]
  const cards = definitions.flatMap((card) => Array.from({ length: card.quantity }, (_, index) => ({
    ...card, id: `${card.code}-${index + 1}`,
  })))
  return shufflePracticeCards(cards, random)
}

function copyGame(game) {
  return {
    ...game,
    deck: [...game.deck],
    discard: [...game.discard],
    hands: Object.fromEntries(Object.entries(game.hands).map(([id, cards]) => [id, [...cards]])),
    players: game.players.map((player) => ({ ...player })),
    animals: game.animals.map((animal) => ({ ...animal })),
    publicPlays: game.publicPlays.map((play) => ({ ...play })),
    newDrawnCardIds: Object.fromEntries(Object.entries(game.newDrawnCardIds)
      .map(([id, cardIds]) => [id, [...cardIds]])),
  }
}

function refillHand(game, playerId, random) {
  const drawn = []
  while (game.hands[playerId].length < 6) {
    if (!game.deck.length) {
      if (!game.discard.length) break
      game.deck = shufflePracticeCards(game.discard, random)
      game.discard = []
    }
    const card = game.deck.pop()
    game.hands[playerId].push(card)
    drawn.push(card.id)
  }
  return drawn
}

function advanceTurn(game) {
  if (game.winnerPlayerId) {
    game.status = 'finished'
    game.currentPlayerId = null
    return game
  }
  const currentSeat = game.players.find((player) => player.id === game.currentPlayerId)?.seatNumber || 1
  game.currentPlayerId = game.players.find((player) => player.seatNumber === currentSeat % 4 + 1).id
  game.turnNumber += 1
  game.status = 'playing'
  game.pendingPlay = null
  game.pendingFunction = null
  return game
}

function addPublicPlay(game, entry) {
  const id = game.publicPlays.length + 1
  game.publicPlays.push({ id, turnNumber: game.turnNumber, ...entry })
  return id
}

export function createAnimalEquationPractice(random = Math.random) {
  const game = {
    status: 'playing', currentPlayerId: 'you', turnNumber: 1,
    players: playerDefinitions.map((player) => ({
      ...player, animalCount: 0, animalScore: 0, judgementStars: 0,
    })),
    animals: shufflePracticeCards(animalEquationAnimals, random).map((animal, index) => ({
      ...animal, id: `animal-${index + 1}`, position: index + 1, revealed: false, ownerPlayerId: null,
    })),
    deck: buildDeck(random), discard: [],
    hands: Object.fromEntries(playerDefinitions.map((player) => [player.id, []])),
    publicPlays: [], pendingPlay: null, pendingFunction: null, winnerPlayerId: null,
    newDrawnCardIds: Object.fromEntries(playerDefinitions.map((player) => [player.id, []])),
    message: '輪到你。只選自己看得到的手牌出牌；其他玩家只能看到你打出的牌。',
  }
  for (const player of game.players) refillHand(game, player.id, random)
  return game
}

export function relativeSeatPosition(playerSeat, viewerSeat) {
  return ['bottom', 'right', 'top', 'left'][(playerSeat - viewerSeat + 4) % 4]
}

export function practiceTargetForPlayer(animals, functionCode, actorPlayerId, targetPlayerId) {
  return functionCardTargets(animals, functionCode, actorPlayerId)
    .filter((animal) => animal.ownerPlayerId === targetPlayerId)
    .sort((left, right) => right.score - left.score || left.position - right.position)[0] || null
}

export function practicePublicView(game, viewerId) {
  const viewerSeat = game.players.find((player) => player.id === viewerId)?.seatNumber || 1
  return {
    status: game.status,
    currentPlayerId: game.currentPlayerId,
    turnNumber: game.turnNumber,
    winnerPlayerId: game.winnerPlayerId,
    message: game.message,
    players: game.players.map((player) => ({
      ...player,
      seatLabel: String.fromCharCode(64 + player.seatNumber),
      position: relativeSeatPosition(player.seatNumber, viewerSeat),
      handCount: game.hands[player.id].length,
    })),
    hand: game.hands[viewerId],
    newDrawnCardIds: game.newDrawnCardIds[viewerId] || [],
    animals: game.animals.map((animal) => animal.revealed ? animal : ({
      id: animal.id, position: animal.position, revealed: false,
    })),
    publicPlays: game.publicPlays,
    pendingPlay: game.pendingPlay,
    pendingFunction: game.pendingFunction,
    deckCount: game.deck.length,
  }
}

export function submitPracticeRadical(game, cardIds, variableValues = {}) {
  if (game.status !== 'playing' || !game.currentPlayerId) return game
  const selected = cardIds.map((id) => game.hands[game.currentPlayerId].find((card) => card.id === id))
  if (!selected.length || selected.length > 2 || selected.some((card) => !card || card.type !== 'radical')
    || new Set(cardIds).size !== selected.length) {
    return { ...game, message: '請從自己的手牌選擇 1 張根式，或 2 張不同的根式牌。' }
  }
  for (const card of selected.filter((item) => item.variableCode === 'n')) {
    if (!/^[1-9][0-9]*$/.test(String(variableValues[card.id] || ''))) {
      return { ...game, message: `${card.label} 必須先設定正整數 n。` }
    }
  }
  const next = copyGame(game)
  const actor = next.players.find((player) => player.id === game.currentPlayerId)
  const labels = selected.map((card) => card.variableCode === 'n'
    ? card.label.replace('n', String(variableValues[card.id])) : card.label)
  const valid = selected.length === 1 || selected[0].family === selected[1].family
  const playId = addPublicPlay(next, {
    playerId: actor.id, cardLabels: labels, text: labels.join('、'),
    kind: 'radical', result: selected.length === 1 ? '成立' : '等待抓錯',
  })
  next.pendingPlay = { id: playId, playerId: actor.id, cardIds: [...cardIds], isValid: valid }
  next.status = 'review'
  next.message = `${actor.displayName} 打出了 ${labels.join('、')}。${selected.length === 1 ? '單張根式成立。' : '其他玩家有 8 秒可以抓錯。'}`
  return selected.length === 1 ? resolvePracticeReview(next) : next
}

export function resolvePracticeReview(game, challengerPlayerId = null, random = Math.random) {
  if (game.status !== 'review' || !game.pendingPlay) return game
  const next = copyGame(game)
  const play = next.pendingPlay
  if (challengerPlayerId && (challengerPlayerId === play.playerId || !next.hands[challengerPlayerId])) return game
  const actor = next.players.find((player) => player.id === play.playerId)
  const challenger = next.players.find((player) => player.id === challengerPlayerId)
  if (challenger) challenger.judgementStars += play.isValid ? -1 : 3
  let drawn = []
  if (play.isValid) {
    const used = next.hands[actor.id].filter((card) => play.cardIds.includes(card.id))
    next.hands[actor.id] = next.hands[actor.id].filter((card) => !play.cardIds.includes(card.id))
    next.discard.push(...used)
    drawn = refillHand(next, actor.id, random)
  }
  next.newDrawnCardIds[actor.id] = drawn
  const result = challenger
    ? play.isValid ? `${challenger.displayName} 抓錯失敗` : `${challenger.displayName} 抓錯成功`
    : play.isValid ? '出牌成立' : '出牌不成立'
  next.publicPlays.find((entry) => entry.id === play.id).result = result
  next.message = `${actor.displayName} 的牌：${result}。${play.isValid
    ? `${actor.id === 'you' ? '你' : actor.displayName}補進 ${drawn.length} 張牌，手牌回到 ${next.hands[actor.id].length} 張；補牌牌面只給本人看。`
    : '錯誤出牌不棄牌，也不補牌。'}`
  return advanceTurn(next)
}

function resolvePracticeFunction(game, defenseCardId = null, random = Math.random) {
  if (game.status !== 'reaction' || !game.pendingFunction) return game
  const next = copyGame(game)
  const action = next.pendingFunction
  const actorCard = next.hands[action.actorPlayerId].find((card) => card.id === action.cardId)
  const targetAnimal = next.animals.find((animal) => animal.id === action.targetAnimalId)
  const targetPlayerId = targetAnimal.ownerPlayerId
  const expectedDefense = action.functionCode === 'accuse' ? 'clarify' : 'gender_error'
  const defenseCard = defenseCardId
    ? next.hands[targetPlayerId].find((card) => card.id === defenseCardId && card.code === expectedDefense)
    : null
  if (defenseCardId && !defenseCard) return { ...game, message: '這張牌不能用於此次防禦。' }
  const result = resolveFunctionCardState({
    players: next.players, animals: next.animals, actorPlayerId: action.actorPlayerId,
    targetAnimalId: action.targetAnimalId, functionCode: action.functionCode,
    defended: Boolean(defenseCard),
  })
  next.animals = result.animals
  next.players = result.players
  next.winnerPlayerId = result.winnerPlayerId
  next.hands[action.actorPlayerId] = next.hands[action.actorPlayerId].filter((card) => card.id !== actorCard.id)
  next.discard.push(actorCard)
  const actorDrawn = refillHand(next, action.actorPlayerId, random)
  next.newDrawnCardIds[action.actorPlayerId] = actorDrawn
  if (defenseCard) {
    next.hands[targetPlayerId] = next.hands[targetPlayerId].filter((card) => card.id !== defenseCard.id)
    next.discard.push(defenseCard)
    next.newDrawnCardIds[targetPlayerId] = refillHand(next, targetPlayerId, random)
  }
  const resultLabel = defenseCard ? `${defenseCard.label}擋下${actorCard.label}` : `${actorCard.label}成功`
  next.publicPlays.find((entry) => entry.id === action.id).result = resultLabel
  next.publicPlays.find((entry) => entry.id === action.id).defenseLabel = defenseCard?.label || null
  next.message = `${resultLabel}。${next.players.find((player) => player.id === action.actorPlayerId).displayName}補進 ${actorDrawn.length} 張牌（牌面僅本人可見）。`
  return advanceTurn(next)
}

export function submitPracticeFunction(game, cardId, targetAnimalId, random = Math.random) {
  if (game.status !== 'playing' || !game.currentPlayerId) return game
  const card = game.hands[game.currentPlayerId].find((item) => item.id === cardId)
  if (!card || card.type !== 'function' || !['tame', 'accuse', 'tempt'].includes(card.code)) {
    return { ...game, message: '請選擇可在自己回合使用的功能牌。' }
  }
  const targets = functionCardTargets(game.animals, card.code, game.currentPlayerId)
  if (!targets.some((animal) => animal.id === targetAnimalId)) {
    return { ...game, message: '請選擇這張功能牌可以指定的動物。' }
  }
  const next = copyGame(game)
  const actor = next.players.find((player) => player.id === game.currentPlayerId)
  const targetAnimal = next.animals.find((animal) => animal.id === targetAnimalId)
  const playId = addPublicPlay(next, {
    playerId: actor.id, cardLabels: [card.label], kind: 'function',
    text: `${card.label} → ${card.code === 'tame' ? `第 ${targetAnimal.position} 張動物` : targetAnimal.name}`,
    result: card.code === 'tame' ? '成立' : '等待防禦',
  })
  if (card.code === 'tame') {
    const result = resolveFunctionCardState({
      players: next.players, animals: next.animals, actorPlayerId: actor.id,
      targetAnimalId, functionCode: 'tame',
    })
    next.animals = result.animals
    next.players = result.players
    next.winnerPlayerId = result.winnerPlayerId
    next.hands[actor.id] = next.hands[actor.id].filter((item) => item.id !== card.id)
    next.discard.push(card)
    const drawn = refillHand(next, actor.id, random)
    next.newDrawnCardIds[actor.id] = drawn
    next.publicPlays.find((entry) => entry.id === playId).text = `${card.label} → ${targetAnimal.name}`
    next.message = `${actor.displayName}翻到${targetAnimal.name}，獲得 ${targetAnimal.score} 分；補進 ${drawn.length} 張牌（牌面僅本人可見）。`
    return advanceTurn(next)
  }
  next.pendingFunction = {
    id: playId, actorPlayerId: actor.id, cardId: card.id,
    functionCode: card.code, targetAnimalId, targetPlayerId: targetAnimal.ownerPlayerId,
  }
  next.status = 'reaction'
  next.message = `${actor.displayName}使用${card.label}指定${targetAnimal.name}；被指定玩家可在 8 秒內防禦。`
  if (targetAnimal.ownerPlayerId !== 'you') {
    const expected = card.code === 'accuse' ? 'clarify' : 'gender_error'
    const aiDefense = next.hands[targetAnimal.ownerPlayerId].find((item) => item.code === expected)
    return resolvePracticeFunction(next, aiDefense && random() < 0.65 ? aiDefense.id : null, random)
  }
  return next
}

export function respondPracticeFunction(game, defenseCardId = null, random = Math.random) {
  if (game.pendingFunction?.targetPlayerId !== 'you') return game
  return resolvePracticeFunction(game, defenseCardId, random)
}

export function passPracticeTurn(game) {
  if (game.status !== 'playing') return game
  const next = copyGame(game)
  const actor = next.players.find((player) => player.id === game.currentPlayerId)
  next.newDrawnCardIds[actor.id] = []
  addPublicPlay(next, { playerId: actor.id, cardLabels: [], kind: 'pass', text: '略過回合', result: '未出牌' })
  next.message = `${actor.displayName}略過這一回合，手牌沒有變動。`
  return advanceTurn(next)
}

export function takeAiPracticeTurn(game, random = Math.random) {
  if (game.status !== 'playing' || !game.players.find((player) => player.id === game.currentPlayerId)?.isAi) return game
  const hand = game.hands[game.currentPlayerId]
  const usableFunctions = hand.filter((card) => ['tame', 'accuse', 'tempt'].includes(card.code))
    .map((card) => ({ card, targets: functionCardTargets(game.animals, card.code, game.currentPlayerId) }))
    .filter((candidate) => candidate.targets.length)
  if (usableFunctions.length && random() < 0.45) {
    const candidate = pick(usableFunctions, random)
    return submitPracticeFunction(game, candidate.card.id, pick(candidate.targets, random).id, random)
  }
  const radicalCards = hand.filter((card) => card.type === 'radical')
  if (radicalCards.length >= 2 && random() < 0.65) {
    const pairs = radicalCards.flatMap((card, index) => radicalCards.slice(index + 1).map((other) => [card, other]))
    const seekValid = random() < 0.7
    const candidates = pairs.filter(([left, right]) => (left.family === right.family) === seekValid)
    const selected = pick(candidates.length ? candidates : pairs, random)
    const values = Object.fromEntries(selected.filter((card) => card.variableCode === 'n')
      .map((card) => [card.id, String(1 + Math.floor(random() * 5))]))
    return submitPracticeRadical(game, selected.map((card) => card.id), values)
  }
  if (radicalCards.length) {
    const card = pick(radicalCards, random)
    return submitPracticeRadical(game, [card.id], card.variableCode === 'n' ? { [card.id]: '2' } : {})
  }
  if (usableFunctions.length) {
    const candidate = pick(usableFunctions, random)
    return submitPracticeFunction(game, candidate.card.id, pick(candidate.targets, random).id, random)
  }
  return passPracticeTurn(game)
}
