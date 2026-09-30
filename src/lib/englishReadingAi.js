import { serializeReadingMindMap } from './englishReadingDraft.js'

export function normalizeAiReadingQuestion(question, position = 1) {
  const kind = question?.kind === 'cloze' ? 'cloze' : 'choice'
  const options = kind === 'choice' && Array.isArray(question?.options)
    ? question.options.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 4)
    : []
  const answers = Array.isArray(question?.answers)
    ? question.answers.map((item) => String(item || '').trim()).filter(Boolean)
    : []
  return {
    id: typeof question?.id === 'string' ? question.id : '',
    position: Number(question?.position) || position,
    kind,
    groupScope: ['all', 'A', 'B'].includes(question?.groupScope) ? question.groupScope : 'all',
    prompt: String(question?.prompt || '').trim(),
    options,
    blankCount: kind === 'cloze' ? Math.max(1, Math.min(6, answers.length || Number(question?.blankCount) || 1)) : 1,
    answers: kind === 'choice' ? [String(answers[0] || 'A').toUpperCase()] : answers,
    explanation: String(question?.explanation || '').trim(),
    evidenceSentence: String(question?.evidenceSentence || '').trim(),
    hintA: String(question?.hintA || '').trim(),
    hintB: String(question?.hintB || '').trim(),
  }
}

export function normalizeAiReadingResult(input) {
  const lesson = input?.lesson || {}
  const mindMap = lesson.mindMap && typeof lesson.mindMap === 'object'
    ? serializeReadingMindMap(lesson.mindMap)
    : String(lesson.mindMap || '')
  const questions = Array.isArray(input?.questions)
    ? input.questions.map((question, index) => normalizeAiReadingQuestion(question, index + 1)).filter((question) => question.prompt)
    : []
  return {
    lesson: {
      title: String(lesson.title || '').trim(), author: String(lesson.author || '').trim(),
      issueDate: String(lesson.issueDate || '').trim(), source: String(lesson.source || '聯合報好讀周報').trim(),
      english: String(lesson.english || '').trim(), translation: String(lesson.translation || '').trim(),
      grammar: String(lesson.grammar || '').trim(), coreWords: String(lesson.coreWords || '').trim(),
      extraWords: String(lesson.extraWords || '').trim(), mindMap,
      groupAHint: String(lesson.groupAHint || '').trim(), groupBHint: String(lesson.groupBHint || '').trim(),
    },
    questions,
    decision: input?.decision === 'enough' ? 'enough' : 'generated',
    message: String(input?.message || '').trim(),
  }
}
