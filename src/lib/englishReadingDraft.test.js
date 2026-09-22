import { describe, expect, it } from 'vitest'
import {
  emptyReadingDraft, normalizeReadingDraft, normalizedReadingRect, parseReadingWords, readingParagraphs, readingSentences,
} from './englishReadingDraft.js'

describe('英文閱讀照片草稿', () => {
  it('只接受既定欄位，避免匯入未知資料', () => {
    expect(normalizeReadingDraft({ title: '測試', english: 5, unknown: 'x' }))
      .toEqual({ ...emptyReadingDraft(), title: '測試' })
  })
  it('保留段落而合併同段的辨識換行', () => {
    expect(readingParagraphs('First line\ncontinues.\n\nSecond paragraph.'))
      .toEqual(['First line continues.', 'Second paragraph.'])
  })
  it('可把英文段落拆成可點選的句子', () => {
    expect(readingSentences('The Sun can cause trouble. GPS can be affected.'))
      .toEqual(['The Sun can cause trouble.', 'GPS can be affected.'])
  })
  it('分開國中 2000 單與中文詞義供點按發音', () => {
    expect(parseReadingWords('serious 嚴重的\ndepend 依賴\nburst：爆發'))
      .toEqual([{ word: 'serious', meaning: '嚴重的' }, { word: 'depend', meaning: '依賴' }, { word: 'burst', meaning: '爆發' }])
  })
  it('選區不受拖曳方向影響，排除誤觸', () => {
    expect(normalizedReadingRect({ x: .8, y: .7 }, { x: .2, y: .1 }))
      .toEqual({ left: .2, top: .1, width: .6000000000000001, height: .6 })
    expect(normalizedReadingRect({ x: .2, y: .1 }, { x: .21, y: .12 })).toBeNull()
  })
})
