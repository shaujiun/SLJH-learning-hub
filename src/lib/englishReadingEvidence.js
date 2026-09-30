import { readingSentences } from './englishReadingDraft.js'

export function getReadingEvidenceText(paragraphs, evidenceKey) {
  if (!evidenceKey) return ''
  const [paragraphIndex, sentenceIndex] = String(evidenceKey).split('-').map(Number)
  if (!Number.isInteger(paragraphIndex) || !Number.isInteger(sentenceIndex)) return ''
  return readingSentences(paragraphs?.[paragraphIndex] || '')[sentenceIndex] || ''
}

export function assignReadingEvidence(current, questionId, evidenceKey) {
  if (!questionId || !evidenceKey) return current
  return { ...current, [questionId]: evidenceKey }
}

export function evidencePositionsForSentence(questions, evidenceByQuestion, evidenceKey) {
  return (questions || [])
    .filter((question) => evidenceByQuestion?.[question.id] === evidenceKey)
    .map((question) => question.position)
}
