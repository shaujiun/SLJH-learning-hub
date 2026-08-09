import { describe, expect, it } from 'vitest'
import { buildOfficialHistoryQuestionPreview } from './historyOfficialQuestions.js'

describe('正式歷史試題匯入預覽', () => {
  const events = [{ id: 'event-1', eventCode: 'h3c1-02', title: '西周封建制度' }]

  it('將正式試題轉成草稿並保留選項與分類信心', () => {
    const result = buildOfficialHistoryQuestionPreview({
      meta: { grade8QuestionCount: 1 },
      questions: [{
        questionCode: 'ka-test-1',
        eventCode: 'h3c1-02',
        questionType: 'past',
        prompt: '題目內容',
        options: [{ key: 'A', text: '選項甲' }, { key: 'B', text: '選項乙' }],
        mediaUrls: ['https://example.com/question.png'],
        tables: [],
        answer: 'B',
        sourceName: '會考',
        sourceYear: '114',
        sourceUrl: 'https://example.com/',
        originalEventIds: ['source-event'],
        mappingConfidence: 99,
        mappingNote: '已複核。',
      }],
    }, events)

    expect(result.errors).toEqual([])
    expect(result.highConfidenceCount).toBe(1)
    expect(result.rows[0].payload).toMatchObject({
      event_id: 'event-1',
      status: 'draft',
      answer: 'B',
      mapping_confidence: 99,
      options: [{ key: 'A', text: '選項甲' }, { key: 'B', text: '選項乙' }],
    })
  })

  it('缺少精確事件時停止該題匯入', () => {
    const result = buildOfficialHistoryQuestionPreview({
      questions: [{ questionCode: 'ka-test-2', eventCode: 'missing', prompt: '題目' }],
    }, events)
    expect(result.rows).toEqual([])
    expect(result.errors[0]).toContain('請先套用題庫資料庫更新')
  })
})
