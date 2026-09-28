import { describe, expect, it } from 'vitest'
import { normalizeAiReadingQuestion, normalizeAiReadingResult } from './englishReadingAi.js'
import { parseReadingMindMap } from './englishReadingDraft.js'

describe('英語閱讀 AI 建稿資料', () => {
  it('把 AI 題目限制為現有題型與可儲存格式', () => {
    expect(normalizeAiReadingQuestion({
      position: '2', kind: 'cloze', prompt: 'stop ___ ___', answers: ['people', 'falling'], options: ['ignored'],
    })).toEqual(expect.objectContaining({ position: 2, kind: 'cloze', options: [], blankCount: 2 }))
  })

  it('把心智圖結構轉為資料庫文字但不影響視覺解析', () => {
    const result = normalizeAiReadingResult({ lesson: {
      title: 'Solar Storm', mindMap: { center: 'GPS', branches: [{ title: 'Cause', keywords: ['burst'] }] },
    }, questions: [{ kind: 'choice', prompt: 'What happened?', options: ['A', 'B'], answers: ['B'] }] })
    expect(parseReadingMindMap(result.lesson.mindMap)).toEqual(expect.objectContaining({ center: 'GPS' }))
    expect(result.questions[0]).toEqual(expect.objectContaining({ prompt: 'What happened?', answers: ['B'] }))
  })
})
