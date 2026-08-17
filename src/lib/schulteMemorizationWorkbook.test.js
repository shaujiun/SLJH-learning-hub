import { describe, expect, it } from 'vitest'
import { normalizeMemorizationImportRows } from './schulteMemorizationWorkbook.js'

const fiveRows = (testDate = '2026/08/21') => Array.from({ length: 5 }, (_, index) => ({
  名言佳句: `第${index + 1}句名言`,
  測驗日期: testDate,
  釋義: `第${index + 1}句的釋義`,
  出處: '測試出處',
  rowNumber: index + 2,
}))

describe('週五名言佳句匯入', () => {
  it('同一測驗日期剛好五句時建立一批', () => {
    const result = normalizeMemorizationImportRows(fiveRows())
    expect(result.errors).toEqual([])
    expect(result.batches).toHaveLength(1)
    expect(result.batches[0]).toMatchObject({ testDate: '2026-08-21' })
    expect(result.batches[0].items).toHaveLength(5)
  })

  it('接受 Excel 自動省略前導零的日期文字', () => {
    const result = normalizeMemorizationImportRows(fiveRows('2026/8/21'))
    expect(result.errors).toEqual([])
    expect(result.batches[0]).toMatchObject({ testDate: '2026-08-21' })
  })

  it('接受 Excel 儲存為日期型別的儲存格', () => {
    const result = normalizeMemorizationImportRows(fiveRows(new Date(2026, 7, 21)))
    expect(result.errors).toEqual([])
    expect(result.batches[0]).toMatchObject({ testDate: '2026-08-21' })
  })

  it('每個測驗日期都必須剛好五句', () => {
    const result = normalizeMemorizationImportRows(fiveRows().slice(0, 4))
    expect(result.errors).toContain('2026-08-21 必須剛好有 5 句，目前為 4 句。')
  })

  it('支援一次匯入兩個測驗日期共十句', () => {
    const result = normalizeMemorizationImportRows([
      ...fiveRows('2026/08/21'),
      ...fiveRows('2026-09-04').map((row, index) => ({ ...row, 名言佳句: `第${index + 6}句名言`, rowNumber: index + 7 })),
    ])
    expect(result.errors).toEqual([])
    expect(result.batches.map((batch) => batch.testDate)).toEqual(['2026-08-21', '2026-09-04'])
  })

  it('日期留空時只加入一般練習', () => {
    const result = normalizeMemorizationImportRows([
      { 名言佳句: '讀萬卷書行萬里路', 測驗日期: '', 釋義: '閱讀也要配合實際經驗', 出處: '古語' },
    ])
    expect(result.errors).toEqual([])
    expect(result.batches).toEqual([])
    expect(result.generalRows).toHaveLength(1)
  })

  it('同一份檔案可混合週五背誦與一般練習', () => {
    const result = normalizeMemorizationImportRows([
      ...fiveRows(),
      { 名言佳句: '學海無涯勤是岸', 測驗日期: '', 釋義: '勤奮是求學的重要方法', 出處: '古語', rowNumber: 7 },
    ])
    expect(result.errors).toEqual([])
    expect(result.batches).toHaveLength(1)
    expect(result.generalRows).toHaveLength(1)
    expect(result.rows).toHaveLength(6)
  })

  it('拒絕沒有完整西元年份的日期', () => {
    const result = normalizeMemorizationImportRows(fiveRows('8/21'))
    expect(result.errors[0]).toContain('測驗日期請使用完整西元 YYYY/MM/DD')
  })
})
