import { describe, expect, it } from 'vitest'
import { createAnimalEquationDemo, submitDemoPair, tameDemoAnimal } from './animalEquationDemo.js'

describe('根式馬戲團免登入試玩', () => {
  it('同類方根出牌後補牌，並進入馴化步驟', () => {
    const room = submitDemoPair(createAnimalEquationDemo(() => 0), ['sqrt8', 'sqrt18'])
    expect(room.phase).toBe('tame')
    expect(room.hand).toHaveLength(6)
    expect(room.hand.some((card) => card.id === 'sqrt8')).toBe(false)
    expect(room.lastPlay).toBe('√8、√18')
  })

  it('不同類方根被 AI 抓錯，不棄牌且可以重試', () => {
    const room = submitDemoPair(createAnimalEquationDemo(() => 0), ['sqrt8', 'sqrt3'])
    expect(room.phase).toBe('pair')
    expect(room.players[1].judgementStars).toBe(3)
    expect(room.hand).toHaveLength(6)
    expect(room.message).toContain('正式對局會輪到下一位')
  })

  it('n 牌必須先輸入正整數', () => {
    const initial = createAnimalEquationDemo(() => 0)
    expect(submitDemoPair(initial, ['nsqrt2', 'sqrt8']).phase).toBe('pair')
    expect(submitDemoPair(initial, ['nsqrt2', 'sqrt8'], { nsqrt2: '2' }).phase).toBe('tame')
  })

  it('馴化翻開動物並以真實分值更新得分', () => {
    const room = submitDemoPair(createAnimalEquationDemo(() => 0), ['sqrt8', 'sqrt18'])
    const target = room.animals[0]
    const finished = tameDemoAnimal(room, target.id)
    expect(finished.phase).toBe('complete')
    expect(finished.players[0]).toMatchObject({ animalCount: 1, animalScore: target.score })
    expect(finished.animals.find((animal) => animal.id === target.id)).toMatchObject({ revealed: true, ownerPlayerId: 'you' })
    expect(tameDemoAnimal(finished, room.animals[1].id)).toBe(finished)
  })

  it('教學每次仍有同類配對，但起手牌與動物位置會變化', () => {
    const first = createAnimalEquationDemo(() => 0)
    const second = createAnimalEquationDemo(() => 0.999)
    expect(first.hand.map((card) => card.code)).not.toEqual(second.hand.map((card) => card.code))
    expect(first.animals.map((animal) => animal.code)).not.toEqual(second.animals.map((animal) => animal.code))
  })
})
