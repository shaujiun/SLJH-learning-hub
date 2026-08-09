import { describe, expect, it } from 'vitest'
import {
  filterHistoryEvents,
  formatHistoryDate,
  normalizeHistoryEventInput,
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
})
