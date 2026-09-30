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

const defaultMindMapBranches = [
  { title: '關鍵概念', keywords: [] },
  { title: '事件發展', keywords: [] },
  { title: '影響結果', keywords: [] },
  { title: '延伸思考', keywords: [] },
]

export function emptyReadingMindMap(center = '') {
  return { center: String(center || '').trim(), branches: defaultMindMapBranches.map((branch) => ({ ...branch })) }
}

function normalizeMindMapBranch(branch, index) {
  const fallback = defaultMindMapBranches[index] || { title: `重點 ${index + 1}`, keywords: [] }
  const keywords = Array.isArray(branch?.keywords)
    ? branch.keywords
    : String(branch?.keywords || '').split(/[、,，／/]/)
  return {
    title: String(branch?.title || fallback.title).trim(),
    keywords: keywords.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 5),
  }
}

export function parseReadingMindMap(value, fallbackCenter = '') {
  const text = String(value || '').trim()
  if (!text) return emptyReadingMindMap(fallbackCenter)
  try {
    const parsed = JSON.parse(text)
    if (parsed && typeof parsed === 'object') {
      const branches = Array.isArray(parsed.branches) ? parsed.branches : []
      return {
        center: String(parsed.center || fallbackCenter || '').trim(),
        branches: [...branches, ...defaultMindMapBranches]
          .slice(0, Math.max(4, Math.min(6, branches.length || 4)))
          .map(normalizeMindMapBranch),
      }
    }
  } catch {
    // 舊資料是一般文字，繼續以箭頭或換行解析。
  }
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const parsedBranches = lines.map((line, index) => {
    const parts = line.split(/\s*(?:→|｜|\||:|：)\s*/).filter(Boolean)
    return normalizeMindMapBranch({ title: parts[0], keywords: parts.slice(1) }, index)
  })
  return {
    center: String(fallbackCenter || parsedBranches[0]?.title || '文章主題').trim(),
    branches: [...parsedBranches, ...defaultMindMapBranches]
      .slice(0, Math.max(4, Math.min(6, parsedBranches.length || 4)))
      .map(normalizeMindMapBranch),
  }
}

export function serializeReadingMindMap(mindMap) {
  const center = String(mindMap?.center || '').trim()
  const branches = (mindMap?.branches || []).map(normalizeMindMapBranch)
    .filter((branch) => branch.title || branch.keywords.length)
  if (!center && !branches.some((branch) => branch.keywords.length)) return ''
  return JSON.stringify({ center, branches })
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
