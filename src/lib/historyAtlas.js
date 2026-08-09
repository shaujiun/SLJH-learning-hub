export const historyRegions = [
  { value: 'china', label: '中國', shortLabel: '中' },
  { value: 'taiwan', label: '臺灣', shortLabel: '臺' },
  { value: 'japan', label: '日本', shortLabel: '日' },
  { value: 'korea', label: '朝鮮半島', shortLabel: '韓' },
  { value: 'world', label: '世界', shortLabel: '世' },
]

export const historyCategories = [
  { value: 'dynasty', label: '朝代與政權' },
  { value: 'politics', label: '政治與制度' },
  { value: 'war', label: '戰爭與衝突' },
  { value: 'diplomacy', label: '外交與交流' },
  { value: 'economy', label: '經濟與建設' },
  { value: 'society', label: '社會與文化' },
]

export const historyStatuses = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已發布' },
  { value: 'archived', label: '已封存' },
]

export const historyQuestionTypes = [
  { value: 'practice', label: '教師自編題' },
  { value: 'past', label: '歷屆題' },
]

export function historyRegionLabel(value) {
  return historyRegions.find((item) => item.value === value)?.label || value
}

export function historyCategoryLabel(value) {
  return historyCategories.find((item) => item.value === value)?.label || value
}

export function historyStatusLabel(value) {
  return historyStatuses.find((item) => item.value === value)?.label || value
}

export function historyQuestionTypeLabel(value) {
  return historyQuestionTypes.find((item) => item.value === value)?.label || value
}

export function historyQuestionSourceLabel(question = {}) {
  if (question.source) return String(question.source).trim()
  const sourceName = String(question.sourceName || '').trim()
  const sourceYear = String(question.sourceYear || '').trim()
  if (sourceName && sourceYear) return `${sourceYear}｜${sourceName}`
  if (sourceName) return sourceName
  return question.questionType === 'past' ? '歷屆題來源尚待補充' : '教師自編'
}

export function formatHistoryYear(year) {
  const number = Number(year)
  if (!Number.isFinite(number)) return ''
  return number < 0 ? `西元前 ${Math.abs(number)} 年` : `西元 ${number} 年`
}

export function formatHistoryDate(event = {}) {
  if (event.displayDate) return event.displayDate
  const start = formatHistoryYear(event.startYear)
  if (!event.endYear || Number(event.endYear) === Number(event.startYear)) return start
  return `${start}～${formatHistoryYear(event.endYear)}`
}

export function sortHistoryEvents(events = []) {
  return [...events].sort((left, right) => (
    Number(left.startYear) - Number(right.startYear)
    || Number(left.endYear || left.startYear) - Number(right.endYear || right.startYear)
    || Number(left.displayOrder || 0) - Number(right.displayOrder || 0)
    || String(left.title).localeCompare(String(right.title), 'zh-Hant')
  ))
}

export function filterHistoryEvents(events = [], filters = {}) {
  const keyword = String(filters.keyword || '').trim().toLocaleLowerCase('zh-Hant')
  const regions = new Set(filters.regions || [])
  const categories = new Set(filters.categories || [])

  return sortHistoryEvents(events.filter((event) => {
    if (filters.volumeNo && Number(event.chapter?.volumeNo) !== Number(filters.volumeNo)) return false
    if (filters.chapterId && event.chapterId !== filters.chapterId) return false
    if (regions.size > 0 && !regions.has(event.region)) return false
    if (categories.size > 0 && !categories.has(event.category)) return false
    if (!keyword) return true
    const searchText = [
      event.title,
      event.summary,
      event.causeText,
      event.processText,
      event.impactText,
      ...(event.people || []),
      ...(event.keywords || []),
      event.startYear,
      event.endYear,
    ].join(' ').toLocaleLowerCase('zh-Hant')
    return searchText.includes(keyword)
  }))
}

export function parseListCell(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean)
  return String(value || '')
    .split(/[、,，;；|]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeHistoryEventInput(input = {}, chapters = []) {
  const eventCode = String(input.eventCode || '').trim().toLowerCase()
  const chapterCode = String(input.chapterCode || input.chapter?.chapterCode || '').trim().toLowerCase()
  const chapter = chapters.find((item) => String(item.chapterCode).toLowerCase() === chapterCode)
  const title = String(input.title || '').trim()
  const startYear = Number.parseInt(input.startYear, 10)
  const endYear = input.endYear === '' || input.endYear == null
    ? null
    : Number.parseInt(input.endYear, 10)

  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(eventCode)) throw new Error('事件代碼須為 3～64 個小寫英文字母、數字、底線或連字號。')
  if (!chapter) throw new Error('找不到指定的章節代碼。')
  if (!title) throw new Error('請輸入事件名稱。')
  if (!Number.isInteger(startYear) || startYear === 0 || startYear < -5000 || startYear > 2200) throw new Error('開始年份須介於西元前 5000 年至西元 2200 年，且不使用西元 0 年。')
  if (endYear != null && (!Number.isInteger(endYear) || endYear === 0 || endYear < startYear || endYear > 2200)) throw new Error('結束年份不可早於開始年份，且不使用西元 0 年。')
  if (!historyRegions.some((item) => item.value === input.region)) throw new Error('請選擇正確的地區。')
  if (!historyCategories.some((item) => item.value === input.category)) throw new Error('請選擇正確的事件類型。')
  if (!historyStatuses.some((item) => item.value === input.status)) throw new Error('請選擇正確的發布狀態。')

  const importance = Number.parseInt(input.importance || 2, 10)
  if (![1, 2, 3].includes(importance)) throw new Error('重要程度須為 1、2 或 3。')

  return {
    event_code: eventCode,
    chapter_id: chapter.id,
    title,
    start_year: startYear,
    end_year: endYear,
    display_date: String(input.displayDate || '').trim(),
    region: input.region,
    category: input.category,
    importance,
    summary: String(input.summary || '').trim(),
    cause_text: String(input.causeText || '').trim(),
    process_text: String(input.processText || '').trim(),
    impact_text: String(input.impactText || '').trim(),
    people: parseListCell(input.people),
    keywords: parseListCell(input.keywords),
    image_url: String(input.imageUrl || '').trim(),
    image_source: String(input.imageSource || '').trim(),
    image_source_url: String(input.imageSourceUrl || '').trim(),
    resource_url: String(input.resourceUrl || '').trim(),
    source_note: String(input.sourceNote || '').trim(),
    display_order: Number.parseInt(input.displayOrder || 0, 10) || 0,
    status: input.status,
  }
}

export function parseHistoryQuestionOptions(value) {
  const rows = Array.isArray(value) ? value : String(value || '').split(/\r?\n/)
  return rows.map((item, index) => {
    if (item && typeof item === 'object') {
      return { key: String(item.key || '').trim(), text: String(item.text || '').trim() }
    }
    const text = String(item || '').trim()
    if (!text) return null
    const matched = text.match(/^([A-Za-z0-9]+)\s*[｜|：:、.)）]\s*(.+)$/)
    return matched
      ? { key: matched[1].toUpperCase(), text: matched[2].trim() }
      : { key: String.fromCharCode(65 + index), text }
  }).filter((item) => item?.key && item?.text)
}

export function parseHistoryQuestionMedia(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  return String(value || '').split(/[\r\n、；;]+/).map((item) => item.trim()).filter(Boolean)
}

export function parseHistoryQuestionTables(value) {
  if (Array.isArray(value)) return value
  const text = String(value || '').trim()
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    throw new Error('題目表格必須是正確的 JSON 陣列格式。')
  }
}

export function historyQuestionAnswerLabel(question = {}) {
  const answer = String(question.answer || '').trim()
  const option = parseHistoryQuestionOptions(question.options).find((item) => item.key === answer.toUpperCase())
  return option ? `${option.key}｜${option.text}` : answer
}

export function normalizeHistoryQuestionInput(input = {}, events = []) {
  const questionCode = String(input.questionCode || '').trim().toLowerCase()
  const eventId = String(input.eventId || '').trim()
  const event = events.find((item) => item.id === eventId)
  const questionType = String(input.questionType || 'practice').trim()
  const prompt = String(input.prompt || '').trim()
  const answer = String(input.answer || '').trim()
  const explanation = String(input.explanation || '').trim()
  const sourceName = String(input.sourceName || '').trim()
  const sourceYear = String(input.sourceYear || '').trim()
  const sourceUrl = String(input.sourceUrl || '').trim()
  const status = String(input.status || 'draft').trim()
  const options = parseHistoryQuestionOptions(input.options)
  const mediaUrls = parseHistoryQuestionMedia(input.mediaUrls)
  const questionTables = parseHistoryQuestionTables(input.tables)
  const mappingConfidence = Math.max(0, Math.min(100, Number.parseInt(input.mappingConfidence || 0, 10) || 0))

  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(questionCode)) throw new Error('題目代碼須為 3～64 個小寫英文字母、數字、底線或連字號。')
  if (!event) throw new Error('請選擇題目對應的歷史事件。')
  if (!historyQuestionTypes.some((item) => item.value === questionType)) throw new Error('請選擇正確的題目類型。')
  if (!prompt) throw new Error('請輸入題目內容。')
  if (!answer) throw new Error('請輸入參考答案。')
  if (questionType === 'past' && !sourceName) throw new Error('歷屆題必須填寫考試或題目來源。')
  if (!historyStatuses.some((item) => item.value === status)) throw new Error('請選擇正確的發布狀態。')

  return {
    question_code: questionCode,
    event_id: event.id,
    question_type: questionType,
    prompt,
    options,
    media_urls: mediaUrls,
    question_tables: questionTables,
    answer,
    explanation,
    source_name: sourceName || '石榴國中教師自編',
    source_year: sourceYear,
    source_url: sourceUrl,
    original_event_ids: parseListCell(input.originalEventIds),
    mapping_confidence: mappingConfidence,
    mapping_note: String(input.mappingNote || '').trim(),
    display_order: Number.parseInt(input.displayOrder || 0, 10) || 0,
    status,
  }
}
