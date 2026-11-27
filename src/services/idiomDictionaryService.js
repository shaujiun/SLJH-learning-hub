let dictionaryPromise = null
let appendixPromise = null

export function idiomDictionaryAssetUrl(baseUri = typeof document === 'undefined' ? 'http://localhost/' : document.baseURI) {
  return new URL('idiom-dictionary-2020-search.json', baseUri).toString()
}

export function idiomDictionaryAppendixAssetUrl(baseUri = typeof document === 'undefined' ? 'http://localhost/' : document.baseURI) {
  return new URL('idiom-dictionary-2020-appendix-search.json', baseUri).toString()
}

function fetchDictionaryAsset(url, fetchImpl) {
  return fetchImpl(url)
    .then((response) => {
      if (!response.ok) throw new Error(`成語資料載入失敗（${response.status}）。`)
      return response.json()
    })
    .then((payload) => {
      if (!Array.isArray(payload?.entries)) throw new Error('成語資料格式不正確。')
      return payload
    })
}

export async function loadIdiomDictionary(fetchImpl = globalThis.fetch) {
  if (!fetchImpl) throw new Error('目前環境無法下載成語資料。')
  if (!dictionaryPromise) {
    dictionaryPromise = fetchDictionaryAsset(idiomDictionaryAssetUrl(), fetchImpl)
      .catch((error) => {
        dictionaryPromise = null
        throw error
      })
  }
  return dictionaryPromise
}

export async function loadIdiomDictionaryAppendix(fetchImpl = globalThis.fetch) {
  if (!fetchImpl) throw new Error('目前環境無法下載成語附錄資料。')
  if (!appendixPromise) {
    appendixPromise = fetchDictionaryAsset(idiomDictionaryAppendixAssetUrl(), fetchImpl)
      .catch((error) => {
        appendixPromise = null
        throw error
      })
  }
  return appendixPromise
}

export function resetIdiomDictionaryCacheForTest() {
  dictionaryPromise = null
  appendixPromise = null
}
