import { describe, expect, it } from 'vitest'
import { geographyDetectiveQuestions } from '../data/geographyDetective.js'
import {
  buildGeographyDetectiveRound,
  evaluateGeographyDetectiveAnswer,
  geographyDetectiveScore,
} from './geographyDetective.js'

describe('geographyDetective', () => {
  it('依章節建立 10 題且不重複的回合', () => {
    const round = buildGeographyDetectiveRound(geographyDetectiveQuestions, 'grade8-upper-l01', 10, () => 0.42)
    expect(round).toHaveLength(10)
    expect(new Set(round.map((question) => question.id)).size).toBe(10)
    expect(round.every((question) => question.chapterId === 'grade8-upper-l01')).toBe(true)
  })

  it('第一次答錯只提醒，第二次提供提示，第三次公布答案', () => {
    const question = geographyDetectiveQuestions[0]
    const wrongAnswer = question.choices.find((choice) => choice !== question.answer)
    expect(evaluateGeographyDetectiveAnswer(question, wrongAnswer, 0)).toMatchObject({ resolved: false, mistakeCount: 1, revealAnswer: false })
    expect(evaluateGeographyDetectiveAnswer(question, wrongAnswer, 1)).toMatchObject({ resolved: false, mistakeCount: 2, message: question.hint })
    expect(evaluateGeographyDetectiveAnswer(question, wrongAnswer, 2)).toMatchObject({ resolved: true, mistakeCount: 3, revealAnswer: true })
  })

  it('依作答次數給分並換算百分制', () => {
    const question = geographyDetectiveQuestions[0]
    expect(evaluateGeographyDetectiveAnswer(question, question.answer, 0).points).toBe(10)
    expect(evaluateGeographyDetectiveAnswer(question, question.answer, 1).points).toBe(7)
    expect(evaluateGeographyDetectiveAnswer(question, question.answer, 2).points).toBe(4)
    expect(geographyDetectiveScore(87, 10)).toBe(87)
  })
})
