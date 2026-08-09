import { normalizeHistoryQuestionInput } from './historyAtlas.js'

export function buildOfficialHistoryQuestionPreview(snapshot, events = []) {
  const questions = Array.isArray(snapshot?.questions) ? snapshot.questions : []
  const eventByCode = new Map(events.map((event) => [String(event.eventCode || '').toLowerCase(), event]))
  const rows = []
  const errors = []

  questions.forEach((question, index) => {
    const rowNumber = index + 1
    const eventCode = String(question.eventCode || '').toLowerCase()
    const relatedEvent = eventByCode.get(eventCode)
    if (!relatedEvent) {
      errors.push(`第 ${rowNumber} 題：找不到對應事件「${question.eventCode}」。請先套用題庫資料庫更新。`)
      return
    }
    const input = { ...question, eventId: relatedEvent.id, status: 'draft' }
    try {
      rows.push({
        rowNumber,
        eventCode,
        input,
        payload: normalizeHistoryQuestionInput(input, events),
      })
    } catch (error) {
      errors.push(`第 ${rowNumber} 題：${error.message}`)
    }
  })

  return {
    rows,
    errors,
    meta: snapshot?.meta || {},
    highConfidenceCount: rows.filter((row) => row.input.mappingConfidence >= 90).length,
    reviewCount: rows.filter((row) => row.input.mappingConfidence < 90).length,
    mediaCount: rows.filter((row) => row.input.mediaUrls?.length > 0).length,
    tableCount: rows.filter((row) => row.input.tables?.length > 0).length,
  }
}

export async function loadOfficialHistoryQuestionPreview(events = []) {
  const module = await import('../data/historyOfficialQuestions.json')
  return buildOfficialHistoryQuestionPreview(module.default || module, events)
}
