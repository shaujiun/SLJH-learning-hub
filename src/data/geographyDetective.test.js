import { describe, expect, it } from 'vitest'
import { geographyDetectiveQuestions } from './geographyDetective.js'

describe('geographyDetectiveQuestions', () => {
  it('八上第 1、2 章各有足夠題目支援 10 題不重複回合', () => {
    const counts = geographyDetectiveQuestions.reduce((result, question) => {
      result[question.chapterId] = (result[question.chapterId] || 0) + 1
      return result
    }, {})
    expect(counts['grade8-upper-l01']).toBeGreaterThanOrEqual(10)
    expect(counts['grade8-upper-l02']).toBeGreaterThanOrEqual(10)
  })

  it('每題都有四個不重複選項、正確答案、提示與判斷依據', () => {
    geographyDetectiveQuestions.forEach((question) => {
      expect(question.choices).toHaveLength(4)
      expect(new Set(question.choices).size).toBe(4)
      expect(question.choices).toContain(question.answer)
      expect(question.clues.length).toBeGreaterThanOrEqual(2)
      expect(question.hint.length).toBeGreaterThan(8)
      expect(question.reasoning.length).toBeGreaterThan(15)
    })
  })
})
