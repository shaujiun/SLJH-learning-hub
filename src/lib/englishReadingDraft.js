export const readingSections = [
  { code: 'english', label: '英文文章', language: 'eng', photo: 'article' },
  { code: 'translation', label: '中文翻譯', language: 'chi_tra', photo: 'article' },
  { code: 'grammar', label: '實用文法', language: 'eng+chi_tra', photo: 'exercise' },
  { code: 'coreWords', label: '國中 2000 單', language: 'eng+chi_tra', photo: 'exercise' },
  { code: 'extraWords', label: '補充單字', language: 'eng+chi_tra', photo: 'exercise' },
  { code: 'mindMap', label: '單字心智圖', language: 'eng', photo: 'exercise' },
  { code: 'cloze', label: '小試身手', language: 'eng+chi_tra', photo: 'exercise' },
  { code: 'questions', label: '閱讀能力測驗', language: 'eng', photo: 'exercise' },
]

export function emptyReadingDraft() {
  return {
    title: '', author: '', issueDate: '', source: '聯合報好讀周報',
    english: '', translation: '', grammar: '', coreWords: '', extraWords: '', mindMap: '',
    cloze: '', questions: '', groupAHint: '', groupBHint: '',
  }
}

export function normalizeReadingDraft(input) {
  const empty = emptyReadingDraft()
  return Object.fromEntries(Object.keys(empty).map((key) => [
    key, typeof input?.[key] === 'string' ? input[key] : empty[key],
  ]))
}

export function readingParagraphs(value) {
  return String(value || '').trim().split(/\n\s*\n/).map((part) => part.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
}

export function readingSentences(paragraph) {
  const text = String(paragraph || '').trim()
  if (!text) return []
  if (typeof Intl.Segmenter === 'function') {
    return [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text)]
      .map((item) => item.segment.trim()).filter(Boolean)
  }
  return text.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((part) => part.trim()).filter(Boolean) || [text]
}

export function parseReadingWords(value) {
  return String(value || '').split(/\r?\n/).map((line) => {
    const match = line.trim().match(/^([A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*)*)\s*(?:[:：－–—-]|\s{2,})?\s*([\u3400-\u9fff].*)?$/)
    return match ? { word: match[1].trim(), meaning: (match[2] || '').trim() } : null
  }).filter(Boolean)
}

export function normalizedReadingRect(first, second) {
  if (!first || !second) return null
  const left = Math.max(0, Math.min(first.x, second.x))
  const top = Math.max(0, Math.min(first.y, second.y))
  const right = Math.min(1, Math.max(first.x, second.x))
  const bottom = Math.min(1, Math.max(first.y, second.y))
  return right - left >= 0.03 && bottom - top >= 0.03
    ? { left, top, width: right - left, height: bottom - top }
    : null
}
