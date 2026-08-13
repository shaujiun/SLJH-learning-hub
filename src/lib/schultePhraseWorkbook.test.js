import { describe, expect, it } from 'vitest'
import { normalizePhraseImportRows, splitPhraseContent } from './schultePhraseWorkbook.js'

describe('Schulte phrase workbook', () => {
  it('長句依標點拆成每題最多 20 個正確文字', () => {
    const parts = splitPhraseContent('一二三四五六七八九十，甲乙丙丁戊己庚辛壬癸，春夏秋冬。')
    expect(parts).toEqual(['一二三四五六七八九十，甲乙丙丁戊己庚辛壬癸，', '春夏秋冬。'])
    expect(parts.every((part) => Array.from(part).filter((character) => !'，。'.includes(character)).length <= 20)).toBe(true)
  })

  it('整理匯入欄位並替拆分題目加上序號', () => {
    const result = normalizePhraseImportRows([{
      rowNumber: 2,
      類型: '詩句',
      標題: '長句',
      完整句子: '一二三四五六七八九十，甲乙丙丁戊己庚辛壬癸，春夏秋冬。',
      句義: '測試句義',
      出處: '測試',
      自訂干擾字: '天地人',
      是否啟用: '是',
    }])
    expect(result.errors).toEqual([])
    expect(result.rows).toHaveLength(2)
    expect(result.rows[0].title).toBe('長句（1）')
    expect(result.rows[0].category).toBe('poem')
    expect(result.rows[0].distractorCharacters).toBe('天地人')
  })
})
