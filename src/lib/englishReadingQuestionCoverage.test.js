import { describe, expect, it } from 'vitest'
import {
  assessReadingQuestionCoverage,
  buildSupplementalReadingQuestions,
  readingQuestionRequirements,
} from './englishReadingQuestionCoverage.js'

const article = `Millions of people depend on GPS to find their way. Automatic tractors and self-driving cars use these signals.

In November 2025, a powerful solar storm disturbed the signals. GPS locations were suddenly wrong by nearly 10 meters.

The error may send a car into the wrong lane. Scientists are studying how to prevent future problems.`

describe('英語閱讀題量檢查與安全補題', () => {
  it('依文章句數設定基本題型需求', () => {
    expect(readingQuestionRequirements('One sentence. Two sentences.')).toEqual({ sentenceCount: 2, choice: 2, cloze: 1 })
    expect(readingQuestionRequirements(article)).toEqual({ sentenceCount: 6, choice: 3, cloze: 2 })
  })

  it('題型數量達標時明確判定不必補題', () => {
    const assessment = assessReadingQuestionCoverage(article, [
      ...Array.from({ length: 3 }, (_, index) => ({ kind: 'choice', prompt: `Choice ${index}` })),
      ...Array.from({ length: 2 }, (_, index) => ({ kind: 'cloze', prompt: `Cloze ${index}` })),
    ])
    expect(assessment.sufficient).toBe(true)
    expect(assessment.missing).toEqual({ choice: 0, cloze: 0 })
  })

  it('分組限定題目不會誤算成另一組也能使用', () => {
    const assessment = assessReadingQuestionCoverage(article, [
      ...Array.from({ length: 3 }, (_, index) => ({ kind: 'choice', groupScope: 'A', prompt: `A choice ${index}` })),
      ...Array.from({ length: 2 }, (_, index) => ({ kind: 'cloze', groupScope: 'A', prompt: `A cloze ${index}` })),
    ])
    expect(assessment.groupCounts.A).toEqual({ choice: 3, cloze: 2 })
    expect(assessment.groupCounts.B).toEqual({ choice: 0, cloze: 0 })
    expect(assessment.sufficient).toBe(false)
  })

  it('不足時只建立答案可由原文明確驗證的定位題與單字填空', () => {
    const result = buildSupplementalReadingQuestions({
      articleText: article,
      coreWordsText: 'depend 依賴\nsignal 訊號\nprevent 防止',
      questions: [
        { kind: 'choice', position: 1, prompt: 'What is the article about?', answers: ['A'] },
        { kind: 'cloze', position: 2, prompt: 'A solar storm ____ signals.', answers: ['disturbed'] },
      ],
    })

    expect(result.questions).toHaveLength(3)
    expect(result.questions.filter((question) => question.kind === 'choice')).toHaveLength(2)
    expect(result.questions.filter((question) => question.kind === 'cloze')).toHaveLength(1)
    expect(result.questions[0].prompt).toContain('Which paragraph contains this information?')
    expect(result.questions[0].answers[0]).toMatch(/[A-D]/)
    expect(result.questions[0].evidenceSentence).toBeTruthy()
    const cloze = result.questions.find((question) => question.kind === 'cloze')
    expect(cloze.prompt).toContain('____')
    expect(cloze.evidenceSentence.toLowerCase()).toContain(cloze.answers[0].toLowerCase())
    expect(cloze.hintB).toContain('中文線索')
  })

  it('單段文章無法安全建立段落定位題時回報尚缺題數', () => {
    const result = buildSupplementalReadingQuestions({
      articleText: 'Students carefully observe the changing weather. They record every result.',
      questions: [],
    })
    expect(result.unresolved.choice).toBe(2)
    expect(result.questions.every((question) => question.kind === 'cloze')).toBe(true)
  })

  it('再次補題時不會重複使用既有定位題的同一句原文', () => {
    const firstSentence = 'Millions of people depend on GPS to find their way.'
    const result = buildSupplementalReadingQuestions({
      articleText: article,
      questions: [{
        kind: 'choice', position: 1, groupScope: 'all',
        prompt: `Which paragraph contains this information? “${firstSentence}”`,
        options: ['Paragraph 1', 'Paragraph 2', 'Paragraph 3'], answers: ['A'],
      }],
    })
    const generatedChoices = result.questions.filter((question) => question.kind === 'choice')
    expect(generatedChoices).toHaveLength(2)
    expect(generatedChoices.every((question) => !question.prompt.includes(firstSentence))).toBe(true)
  })
})
