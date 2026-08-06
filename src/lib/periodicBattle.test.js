import { describe, expect, it } from 'vitest'
import {
  createPeriodicBattleQuestions,
  getBattleAttemptOrder,
  getInitialBattleSeats,
  isValidBattleQuestionCount,
  pointsForBattleAttempt,
  secondsUntil,
} from './periodicBattle.js'

describe('periodic battle rules', () => {
  it('rotates the four-player opening pairs every four questions', () => {
    expect([1, 2, 3, 4, 5].map((question) => getInitialBattleSeats(4, question))).toEqual([
      [1, 3], [2, 4], [2, 3], [1, 4], [1, 3],
    ])
  })

  it('orders follow-up attempts as opponent, teammate, then remaining player', () => {
    const players = [
      { seatNumber: 1, teamCode: 'A' },
      { seatNumber: 2, teamCode: 'A' },
      { seatNumber: 3, teamCode: 'B' },
      { seatNumber: 4, teamCode: 'B' },
    ]
    expect(getBattleAttemptOrder({ playerLimit: 4, questionPosition: 1, winnerSeat: 1, players })).toEqual([1, 3, 2, 4])
    expect(getBattleAttemptOrder({ playerLimit: 4, questionPosition: 1, winnerSeat: 3, players })).toEqual([3, 1, 4, 2])
  })

  it('uses +3, +2, +1 and -1 scoring', () => {
    expect(pointsForBattleAttempt(1, true)).toBe(3)
    expect(pointsForBattleAttempt(2, true)).toBe(2)
    expect(pointsForBattleAttempt(4, true)).toBe(1)
    expect(pointsForBattleAttempt(1, false)).toBe(-1)
  })

  it('requires four-player question counts to be multiples of four', () => {
    expect(isValidBattleQuestionCount(4, 20)).toBe(true)
    expect(isValidBattleQuestionCount(4, 18)).toBe(false)
    expect(isValidBattleQuestionCount(2, 18)).toBe(true)
  })

  it('creates repeated beginner questions when a battle needs more than 18', () => {
    const questions = createPeriodicBattleQuestions({ level: 'beginner', mode: 'mixed', count: 20, random: () => 0.4 })
    expect(questions).toHaveLength(20)
    expect(questions.every((question) => question.prompt && question.answer)).toBe(true)
  })

  it('rounds countdowns upward and never returns a negative value', () => {
    expect(secondsUntil('2026-08-06T00:00:05.100Z', Date.parse('2026-08-06T00:00:00Z'))).toBe(6)
    expect(secondsUntil('2026-08-05T23:59:59Z', Date.parse('2026-08-06T00:00:00Z'))).toBe(0)
  })
})

