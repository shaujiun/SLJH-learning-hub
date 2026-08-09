import { describe, expect, it } from 'vitest'
import {
  historyQuestionWorkbookHeaders,
  historyWorkbookHeaders,
  parseHistoryQuestionWorksheet,
  parseHistoryWorksheet,
} from './historyWorkbook.js'

function fakeWorksheet(rows) {
  return {
    rowCount: rows.length,
    getRow(rowNumber) {
      const values = rows[rowNumber - 1] || []
      return {
        eachCell(callback) {
          values.forEach((value, index) => callback({ value }, index + 1))
        },
        getCell(columnNumber) {
          return { value: values[columnNumber - 1] }
        },
      }
    },
  }
}

const chapters = [{ id: 'chapter-1', chapterCode: 'hanlin-8-1-01', volumeNo: 3 }]

describe('歷史 Excel 匯入預覽', () => {
  it('解析正確資料並強制維持草稿', () => {
    const row = Object.fromEntries(historyWorkbookHeaders.map((header) => [header, '']))
    Object.assign(row, {
      事件代碼: 'h3c1-test',
      章節代碼: 'hanlin-8-1-01',
      事件名稱: '測試事件',
      開始年份: -221,
      地區代碼: 'china',
      事件類型代碼: 'politics',
      重要程度: 2,
    })
    const worksheet = fakeWorksheet([
      historyWorkbookHeaders,
      historyWorkbookHeaders.map((header) => row[header]),
    ])
    const result = parseHistoryWorksheet(worksheet, chapters)
    expect(result.errors).toEqual([])
    expect(result.rows[0].payload).toMatchObject({ event_code: 'h3c1-test', status: 'draft' })
  })

  it('指出必要欄位缺漏', () => {
    const result = parseHistoryWorksheet(fakeWorksheet([['事件代碼', '事件名稱']]), chapters)
    expect(result.rows).toEqual([])
    expect(result.errors[0]).toContain('缺少必要欄位')
  })

  it('阻止同一檔案重複事件代碼', () => {
    const makeRow = () => historyWorkbookHeaders.map((header) => ({
      事件代碼: 'same-code',
      章節代碼: 'hanlin-8-1-01',
      事件名稱: '重複事件',
      開始年份: '1911',
      地區代碼: 'china',
      事件類型代碼: 'politics',
      重要程度: '2',
    })[header] || '')
    const result = parseHistoryWorksheet(fakeWorksheet([historyWorkbookHeaders, makeRow(), makeRow()]), chapters)
    expect(result.rows).toHaveLength(1)
    expect(result.errors[0]).toContain('事件代碼重複')
  })
})

describe('歷史題庫 Excel 匯入預覽', () => {
  const events = [{ id: 'event-1', eventCode: 'h3c1-test', title: '測試事件' }]

  it('解析教師自編題並強制維持草稿', () => {
    const row = Object.fromEntries(historyQuestionWorkbookHeaders.map((header) => [header, '']))
    Object.assign(row, {
      題目代碼: 'h3c1-test-q01',
      事件代碼: 'h3c1-test',
      題目類型: '教師自編題',
      題目內容: '請說明事件影響。',
      參考答案: '參考答案',
      來源名稱: '石榴國中教師自編',
    })
    const result = parseHistoryQuestionWorksheet(fakeWorksheet([
      historyQuestionWorkbookHeaders,
      historyQuestionWorkbookHeaders.map((header) => row[header]),
    ]), events)

    expect(result.errors).toEqual([])
    expect(result.rows[0].payload).toMatchObject({
      question_code: 'h3c1-test-q01',
      event_id: 'event-1',
      question_type: 'practice',
      status: 'draft',
    })
  })

  it('拒絕不存在的事件代碼與沒有來源的歷屆題', () => {
    const makeRow = (overrides) => historyQuestionWorkbookHeaders.map((header) => ({
      題目代碼: 'history-q01',
      事件代碼: 'h3c1-test',
      題目類型: '歷屆題',
      題目內容: '歷屆題內容',
      參考答案: '答案',
      ...overrides,
    })[header] || '')
    const result = parseHistoryQuestionWorksheet(fakeWorksheet([
      historyQuestionWorkbookHeaders,
      makeRow({ 事件代碼: 'missing-event' }),
      makeRow({ 題目代碼: 'history-q02' }),
    ]), events)

    expect(result.errors[0]).toContain('找不到事件代碼')
    expect(result.errors[1]).toContain('歷屆題必須填寫考試或題目來源')
  })
})
