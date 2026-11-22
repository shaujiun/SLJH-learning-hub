export const IDIOM_DICTIONARY_DATA_VERSION = 'dict_idioms_2020_20260929'

function stringValue(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean).join('\n')
  return String(value || '').trim()
}

export function normalizeDictionaryEntry(entry) {
  const sourceEntryId = Number(entry?.sourceEntryId ?? entry?.id ?? entry?.編號) || null
  return {
    sourceEntryId,
    phrase: stringValue(entry?.phrase ?? entry?.成語).replace(/\s/g, ''),
    zhuyin: stringValue(entry?.zhuyin ?? entry?.注音),
    pinyin: stringValue(entry?.pinyin ?? entry?.漢語拼音),
    definition: stringValue(entry?.definition ?? entry?.釋義),
    source: stringValue(entry?.source ?? entry?.典源或出處),
    story: stringValue(entry?.story ?? entry?.典故說明),
    sourceType: stringValue(entry?.sourceType ?? entry?.['主條成語／非主條成語']),
    sourceUrl: stringValue(entry?.sourceUrl) || (sourceEntryId
      ? `https://dict.idioms.moe.edu.tw/idiomView.jsp?ID=${sourceEntryId}&webMd=2&la=0`
      : 'https://dict.idioms.moe.edu.tw/'),
  }
}

function matchRank(phrase, query) {
  if (phrase === query) return 0
  if (phrase.startsWith(query)) return 1
  if (phrase.includes(query)) return 2
  return 9
}

export function searchIdiomDictionary(entries, query, limit = 20) {
  const keyword = String(query || '').replace(/\s/g, '')
  if (!keyword) return []
  const matches = (entries || [])
    .map(normalizeDictionaryEntry)
    .filter((entry) => entry.phrase && entry.phrase.includes(keyword))
    .sort((left, right) => {
      const rank = matchRank(left.phrase, keyword) - matchRank(right.phrase, keyword)
      if (rank) return rank
      const mainRank = Number(!left.sourceType.includes('主條')) - Number(!right.sourceType.includes('主條'))
      if (mainRank) return mainRank
      return left.phrase.localeCompare(right.phrase, 'zh-TW')
    })
  const unique = []
  const phrases = new Set()
  for (const entry of matches) {
    if (phrases.has(entry.phrase)) continue
    unique.push(entry)
    phrases.add(entry.phrase)
    if (unique.length >= limit) break
  }
  return unique
}

export function speakIdiom(phrase, speech = typeof window === 'undefined' ? null : window.speechSynthesis) {
  if (!speech || typeof SpeechSynthesisUtterance === 'undefined') return false
  speech.cancel()
  const utterance = new SpeechSynthesisUtterance(String(phrase || ''))
  utterance.lang = 'zh-TW'
  utterance.rate = 0.82
  const voices = typeof speech.getVoices === 'function' ? speech.getVoices() : []
  const taiwanVoice = voices.find((voice) => /^zh[-_]TW$/i.test(voice.lang))
    || voices.find((voice) => /^zh/i.test(voice.lang))
  if (taiwanVoice) utterance.voice = taiwanVoice
  speech.speak(utterance)
  return true
}
