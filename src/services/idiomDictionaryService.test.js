import { describe, expect, it, vi } from 'vitest'
import {
  idiomDictionaryAppendixAssetUrl,
  idiomDictionaryAssetUrl,
  loadIdiomDictionary,
  loadIdiomDictionaryAppendix,
  resetIdiomDictionaryCacheForTest,
} from './idiomDictionaryService.js'

describe('教育部成語典資料服務', () => {
  it('從目前網站根目錄載入管理者搜尋索引', () => {
    expect(idiomDictionaryAssetUrl('https://example.test/SLJH-learning-hub/?puzzle=word-grid')).toBe(
      'https://example.test/SLJH-learning-hub/idiom-dictionary-2020-search.json',
    )
  })

  it('同一頁只下載一次索引', async () => {
    resetIdiomDictionaryCacheForTest()
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ entries: [{ phrase: '一字千金' }] }) }))
    await loadIdiomDictionary(fetchImpl)
    await loadIdiomDictionary(fetchImpl)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('附錄採獨立網址並只在需要時下載一次', async () => {
    expect(idiomDictionaryAppendixAssetUrl('https://example.test/SLJH-learning-hub/?puzzle=word-grid')).toBe(
      'https://example.test/SLJH-learning-hub/idiom-dictionary-2020-appendix-search.json',
    )
    resetIdiomDictionaryCacheForTest()
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ entries: [{ phrase: '三心二意' }] }) }))
    await loadIdiomDictionaryAppendix(fetchImpl)
    await loadIdiomDictionaryAppendix(fetchImpl)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })
})
