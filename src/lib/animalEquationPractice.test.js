import { describe, expect, it } from 'vitest'
import { animalEquationRadicals } from '../data/animalEquationCards.js'
import {
  createAnimalEquationPractice,
  practicePublicView,
  practiceTargetForPlayer,
  passPracticeTurn,
  relativeSeatPosition,
  resolvePracticeReview,
  respondPracticeFunction,
  submitPracticeFunction,
  submitPracticeRadical,
  takeAiPracticeTurn,
} from './animalEquationPractice.js'

const radical = (code) => ({
  ...animalEquationRadicals.find((card) => card.code === code), id: `${code}-test`, type: 'radical',
})

describe('根式馬戲團自由試玩', () => {
  it('點對手座位時，功能牌優先指定其最高分動物', () => {
    const animals = [
      { id: 'a', position: 1, revealed: true, ownerPlayerId: 'ai-fox', score: 5 },
      { id: 'b', position: 2, revealed: true, ownerPlayerId: 'ai-fox', score: 20 },
      { id: 'c', position: 3, revealed: true, ownerPlayerId: 'ai-sloth', score: 15 },
    ]
    expect(practiceTargetForPlayer(animals, 'accuse', 'you', 'ai-fox')?.id).toBe('b')
    expect(practiceTargetForPlayer(animals, 'tempt', 'you', 'ai-sloth')?.id).toBe('c')
    expect(practiceTargetForPlayer(animals, 'tempt', 'you', 'you')).toBeNull()
  })

  it('每局重洗 100 張牌與 16 張動物，四人各抽 6 張', () => {
    const first = createAnimalEquationPractice(() => 0)
    const second = createAnimalEquationPractice(() => 0.999)
    expect(first.deck).toHaveLength(76)
    expect(first.animals).toHaveLength(16)
    expect(first.animals.map((animal) => animal.code)).not.toEqual(second.animals.map((animal) => animal.code))
    expect(first.hands.you.map((card) => card.id)).not.toEqual(second.hands.you.map((card) => card.id))
    for (const player of first.players) expect(first.hands[player.id]).toHaveLength(6)
  })

  it('每位玩家視角都在下方，並且公開視圖不含別人的手牌與未翻動物名稱', () => {
    expect(relativeSeatPosition(2, 2)).toBe('bottom')
    expect(relativeSeatPosition(3, 2)).toBe('right')
    expect(relativeSeatPosition(4, 2)).toBe('top')
    expect(relativeSeatPosition(1, 2)).toBe('left')
    const game = createAnimalEquationPractice(() => 0.5)
    game.hands['ai-fox'][0] = { id: 'secret', label: '只有 AI 看得到的牌' }
    const view = practicePublicView(game, 'you')
    expect(view.hand).toHaveLength(6)
    expect(view.newDrawnCardIds).toEqual([])
    expect(view.players.find((player) => player.id === 'ai-fox')).toMatchObject({ handCount: 6, position: 'right' })
    expect(JSON.stringify(view)).not.toContain('只有 AI 看得到的牌')
    expect(JSON.stringify(view.animals)).not.toContain(game.animals[0].name)
  })

  it('出牌後公開牌面；成立時棄牌補回 6 張，抓錯時不補牌', () => {
    const game = createAnimalEquationPractice(() => 0.5)
    game.hands.you = [radical('sqrt8'), radical('sqrt18'), ...game.hands.you.slice(2)]
    const review = submitPracticeRadical(game, ['sqrt8-test', 'sqrt18-test'])
    expect(review.status).toBe('review')
    expect(review.publicPlays[0].cardLabels).toEqual(['√8', '√18'])
    const resolved = resolvePracticeReview(review, null, () => 0.5)
    expect(resolved.hands.you).toHaveLength(6)
    expect(resolved.newDrawnCardIds.you).toHaveLength(2)
    expect(practicePublicView(resolved, 'you').newDrawnCardIds).toHaveLength(2)
    expect(practicePublicView(resolved, 'ai-fox').newDrawnCardIds).toEqual([])
    expect(resolved.message).toContain('補進 2 張牌')
    expect(resolved.publicPlays[0].result).toBe('出牌成立')

    game.hands.you = [radical('sqrt8'), radical('sqrt3'), ...game.hands.you.slice(2)]
    const invalid = resolvePracticeReview(
      submitPracticeRadical(game, ['sqrt8-test', 'sqrt3-test']), 'ai-fox', () => 0.5,
    )
    expect(invalid.players[1].judgementStars).toBe(3)
    expect(invalid.hands.you).toHaveLength(6)
    expect(invalid.newDrawnCardIds.you).toEqual([])
    expect(invalid.message).toContain('不補牌')
  })

  it('AI 能自行出牌，且只把打出的牌列入公開紀錄', () => {
    const game = createAnimalEquationPractice(() => 0.5)
    game.currentPlayerId = 'ai-fox'
    game.hands['ai-fox'] = [radical('sqrt8'), ...game.hands['ai-fox'].slice(1)]
    const next = takeAiPracticeTurn(game, () => 0.99)
    expect(next.publicPlays).toHaveLength(1)
    expect(next.publicPlays[0].playerId).toBe('ai-fox')
    expect(next.publicPlays[0].cardLabels).toHaveLength(1)
    expect(next.hands['ai-fox']).toHaveLength(6)
    expect(next.newDrawnCardIds['ai-fox']).toHaveLength(1)
    expect(practicePublicView(next, 'you').newDrawnCardIds).toEqual([])
  })

  it('馴化後公開動物與功能牌，補牌仍只有本人看得到', () => {
    const game = createAnimalEquationPractice(() => 0.5)
    game.hands.you[0] = { id: 'tame-test', code: 'tame', label: '馴化', type: 'function' }
    const next = submitPracticeFunction(game, 'tame-test', game.animals[0].id, () => 0.5)
    expect(next.animals[0]).toMatchObject({ revealed: true, ownerPlayerId: 'you' })
    expect(next.players[0].animalCount).toBe(1)
    expect(next.publicPlays[0].cardLabels).toEqual(['馴化'])
    expect(next.publicPlays[0].text).toContain(next.animals[0].name)
    expect(next.hands.you).toHaveLength(6)
    expect(next.message).toContain('牌面僅本人可見')
  })

  it('連續多回合的 AI 與玩家行動不會卡在等待狀態', () => {
    let seed = 123456789
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
    let game = createAnimalEquationPractice(random)
    for (let action = 0; action < 300 && game.status !== 'finished'; action += 1) {
      if (game.status === 'review') {
        game = resolvePracticeReview(game, null, random)
      } else if (game.status === 'reaction') {
        game = respondPracticeFunction(game, null, random)
      } else if (game.currentPlayerId !== 'you') {
        game = takeAiPracticeTurn(game, random)
      } else {
        const radicalCard = game.hands.you.find((card) => card.type === 'radical')
        const tameCard = game.hands.you.find((card) => card.code === 'tame')
        const hiddenAnimal = game.animals.find((animal) => !animal.revealed)
        if (tameCard && hiddenAnimal) game = submitPracticeFunction(game, tameCard.id, hiddenAnimal.id, random)
        else if (radicalCard) game = submitPracticeRadical(game, [radicalCard.id],
          radicalCard.variableCode === 'n' ? { [radicalCard.id]: '2' } : {})
        else game = passPracticeTurn(game)
      }
    }
    expect(game.status).toBe('finished')
    expect(game.winnerPlayerId).toBeTruthy()
    expect(game.publicPlays.length).toBeGreaterThan(10)
    expect(game.hands.you.length).toBeLessThanOrEqual(6)
  })
})
