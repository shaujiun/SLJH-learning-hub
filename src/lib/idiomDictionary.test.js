import { describe, expect, it } from 'vitest'
import { normalizeDictionaryEntry, searchIdiomDictionary } from './idiomDictionary.js'

describe('教育部成語典搜尋', () => {
  const entries = [
    { sourceEntryId: 2, phrase: '一字不苟', zhuyin: 'ㄧ ㄗˋ ㄅㄨˋ ㄍㄡˇ', definition: '測試二', sourceType: '主條成語' },
    { sourceEntryId: 1, phrase: '一字千金', zhuyin: 'ㄧ ㄗˋ ㄑㄧㄢ ㄐㄧㄣ', definition: '測試一', sourceType: '主條成語' },
    { sourceEntryId: 3, phrase: '一字千金', definition: '重複條目', sourceType: '非主條成語' },
  ]

  it('完全符合優先，並以成語名稱去除重複結果', () => {
    const results = searchIdiomDictionary(entries, '一字千金')
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({ sourceEntryId: 1, phrase: '一字千金', definition: '測試一' })
  })

  it('部分文字可搜尋多筆候選', () => {
    expect(searchIdiomDictionary(entries, '一字').map((entry) => entry.phrase)).toEqual(['一字千金', '一字不苟'])
  })

  it('補上教育部條目網址但不改寫官方欄位', () => {
    expect(normalizeDictionaryEntry(entries[1])).toMatchObject({
      phrase: '一字千金',
      zhuyin: 'ㄧ ㄗˋ ㄑㄧㄢ ㄐㄧㄣ',
      sourceUrl: 'https://dict.idioms.moe.edu.tw/idiomView.jsp?ID=1&webMd=2&la=0',
    })
  })
})
