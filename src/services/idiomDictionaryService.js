let dictionaryPromise = null

export function idiomDictionaryAssetUrl(baseUri = typeof document === 'undefined' ? 'http://localhost/' : document.baseURI) {
  return new URL('idiom-dictionary-2020-search.json', baseUri).toString()
}

export async function loadIdiomDictionary(fetchImpl = globalThis.fetch) {
  if (!fetchImpl) throw new Error('目前環境無法下載成語資料。')
  if (!dictionaryPromise) {
    dictionaryPromise = fetchImpl(idiomDictionaryAssetUrl())
      .then((response) => {
        if (!response.ok) throw new Error(`成語資料載入失敗（${response.status}）。`)
        return response.json()
      })
      .then((payload) => {
        if (!Array.isArray(payload?.entries)) throw new Error('成語資料格式不正確。')
        return payload
      })
      .catch((error) => {
        dictionaryPromise = null
        throw error
      })
  }
  return dictionaryPromise
}

export function resetIdiomDictionaryCacheForTest() {
  dictionaryPromise = null
}
