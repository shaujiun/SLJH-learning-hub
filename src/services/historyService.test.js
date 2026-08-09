import { describe, expect, it } from 'vitest'
import { attachHistoryQuestions } from './historyService.js'

describe('history question service mapping', () => {
  it('attaches published question rows to the related event by type', () => {
    const events = [{ id: 'event-1', title: '事件一', pastQuestions: [], practiceQuestions: [] }]
    const result = attachHistoryQuestions(events, [
      {
        id: 'question-1',
        question_code: 'q-001',
        event_id: 'event-1',
        question_type: 'past',
        prompt: '題目',
        answer: '答案',
        source_name: '國中教育會考',
        source_year: '114 年',
        status: 'published',
        display_order: 10,
      },
      {
        id: 'question-2',
        question_code: 'q-002',
        event_id: 'event-1',
        question_type: 'practice',
        prompt: '自編題',
        answer: '答案',
        source_name: '石榴國中教師自編',
        status: 'draft',
        display_order: 20,
      },
    ])

    expect(result[0].pastQuestions).toHaveLength(1)
    expect(result[0].practiceQuestions).toHaveLength(1)
    expect(result[0].pastQuestions[0].source).toBe('114 年｜國中教育會考')
  })
})
