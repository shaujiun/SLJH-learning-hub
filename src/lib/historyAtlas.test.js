import { describe, expect, it } from 'vitest'
import {
  filterHistoryEvents,
  formatHistoryDate,
  historyQuestionSourceLabel,
  historyQuestionAnswerLabel,
  normalizeHistoryEventInput,
  normalizeHistoryQuestionInput,
  parseHistoryQuestionOptions,
  parseListCell,
} from './historyAtlas.js'

const chapters = [{ id: 'chapter-1', chapterCode: 'hanlin-8-1-01', volumeNo: 3 }]

describe('歷史時光地圖資料工具', () => {
  it('顯示西元前與跨年事件', () => {
    expect(formatHistoryDate({ startYear: -221 })).toBe('西元前 221 年')
    expect(formatHistoryDate({ startYear: 1937, endYear: 1945 })).toBe('西元 1937 年～西元 1945 年')
    expect(formatHistoryDate({ startYear: 1911, displayDate: '民國前一年' })).toBe('民國前一年')
  })

  it('依冊次、地區與關鍵字篩選', () => {
    const events = [
      { title: '秦統一中國', startYear: -221, region: 'china', category: 'dynasty', chapter: chapters[0] },
      { title: '明治維新', startYear: 1868, region: 'japan', category: 'politics', chapter: { volumeNo: 3 } },
    ]
    expect(filterHistoryEvents(events, { volumeNo: 3, regions: ['japan'], keyword: '明治' })).toHaveLength(1)
    expect(filterHistoryEvents(events, { keyword: '秦' })[0].title).toBe('秦統一中國')
  })

  it('整理匯入欄位並驗證章節', () => {
    const payload = normalizeHistoryEventInput({
      eventCode: ' H3C1-99 ',
      chapterCode: 'hanlin-8-1-01',
      title: '測試事件',
      startYear: '-200',
      endYear: '',
      region: 'china',
      category: 'politics',
      importance: '2',
      people: '人物甲、人物乙',
      keywords: '制度,改革',
      status: 'draft',
    }, chapters)
    expect(payload).toMatchObject({ event_code: 'h3c1-99', chapter_id: 'chapter-1', start_year: -200 })
    expect(payload.people).toEqual(['人物甲', '人物乙'])
    expect(parseListCell('甲；乙|丙')).toEqual(['甲', '乙', '丙'])
  })

  it('清楚標示教師自編題與歷屆題來源', () => {
    expect(historyQuestionSourceLabel({ questionType: 'practice', sourceName: '石榴國中教師自編' })).toBe('石榴國中教師自編')
    expect(historyQuestionSourceLabel({ questionType: 'past', sourceName: '國中教育會考', sourceYear: '114 年' })).toBe('114 年｜國中教育會考')
  })

  it('歷屆題必須保留來源，自編題會補上自編單位', () => {
    const events = [{ id: 'event-1', title: '測試事件' }]
    expect(normalizeHistoryQuestionInput({
      questionCode: 'h3c1-01-q01',
      eventId: 'event-1',
      questionType: 'practice',
      prompt: '請說明事件影響。',
      answer: '參考答案',
      status: 'draft',
    }, events)).toMatchObject({ source_name: '石榴國中教師自編', question_type: 'practice' })

    expect(() => normalizeHistoryQuestionInput({
      questionCode: 'h3c1-01-q02',
      eventId: 'event-1',
      questionType: 'past',
      prompt: '歷屆題',
      answer: '答案',
      status: 'draft',
    }, events)).toThrow('歷屆題必須填寫考試或題目來源')
  })

  it('保留選擇題選項、媒體與自動章節配對資訊', () => {
    const events = [{ id: 'event-1', title: '測試事件' }]
    const payload = normalizeHistoryQuestionInput({
      questionCode: 'official-q01',
      eventId: 'event-1',
      questionType: 'past',
      prompt: '下列何者正確？',
      options: 'A｜選項甲\nB｜選項乙',
      mediaUrls: 'https://example.com/question.png',
      tables: '[]',
      answer: 'B',
      sourceName: '國中教育會考',
      originalEventIds: 'source-event',
      mappingConfidence: 99,
      mappingNote: '已複核。',
      status: 'draft',
    }, events)

    expect(payload.options).toEqual([{ key: 'A', text: '選項甲' }, { key: 'B', text: '選項乙' }])
    expect(payload.media_urls).toEqual(['https://example.com/question.png'])
    expect(payload.original_event_ids).toEqual(['source-event'])
    expect(payload.mapping_confidence).toBe(99)
    expect(parseHistoryQuestionOptions('甲\n乙')).toEqual([{ key: 'A', text: '甲' }, { key: 'B', text: '乙' }])
    expect(historyQuestionAnswerLabel({ answer: 'B', options: payload.options })).toBe('B｜選項乙')
  })
})
