import { buildReadingGuidanceDraft } from './englishReadingGuidance.js'
import { parseReadingWords, readingParagraphs, readingSentences } from './englishReadingDraft.js'

const fallbackStopWords = new Set([
  'about', 'after', 'again', 'also', 'and', 'are', 'because', 'been', 'before', 'being', 'but', 'can',
  'could', 'did', 'does', 'doing', 'for', 'from', 'had', 'has', 'have', 'how', 'into', 'its', 'may',
  'more', 'most', 'not', 'of', 'on', 'only', 'or', 'our', 'should', 'than', 'that', 'the', 'their',
  'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'was', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
])

function sentenceRecords(articleText) {
  return readingParagraphs(articleText).flatMap((paragraph, paragraphIndex) =>
    readingSentences(paragraph).map((sentence, sentenceIndex) => ({
      sentence,
      paragraph: paragraphIndex + 1,
      sentenceIndex: sentenceIndex + 1,
    })))
}

export function readingQuestionRequirements(articleText) {
  const sentenceCount = sentenceRecords(articleText).length
  if (sentenceCount <= 4) return { sentenceCount, choice: 2, cloze: 1 }
  if (sentenceCount <= 8) return { sentenceCount, choice: 3, cloze: 2 }
  return { sentenceCount, choice: 4, cloze: 3 }
}

export function assessReadingQuestionCoverage(articleText, questions = []) {
  const requirements = readingQuestionRequirements(articleText)
  const groupCounts = (questions || []).reduce((current, question) => {
    if (!String(question?.prompt || '').trim() || !['choice', 'cloze'].includes(question?.kind)) return current
    const scope = ['A', 'B'].includes(question.groupScope) ? question.groupScope : 'all'
    const groups = scope === 'all' ? ['A', 'B'] : [scope]
    groups.forEach((group) => { current[group][question.kind] += 1 })
    return current
  }, { A: { choice: 0, cloze: 0 }, B: { choice: 0, cloze: 0 } })
  const counts = {
    choice: Math.min(groupCounts.A.choice, groupCounts.B.choice),
    cloze: Math.min(groupCounts.A.cloze, groupCounts.B.cloze),
  }
  const missing = {
    choice: Math.max(0, requirements.choice - counts.choice),
    cloze: Math.max(0, requirements.cloze - counts.cloze),
  }
  return {
    requirements,
    counts,
    groupCounts,
    missing,
    sufficient: missing.choice === 0 && missing.cloze === 0,
  }
}

function emptyQuestion(position, kind) {
  return {
    id: '', position, kind, groupScope: 'all', prompt: '', options: kind === 'choice' ? [] : [],
    answers: [], explanation: '', evidenceSentence: '', hintA: '', hintB: '',
  }
}

function withGuidance(articleText, question) {
  const { match: _match, ...guidance } = buildReadingGuidanceDraft(articleText, question)
  return { ...question, ...guidance }
}

function normalizedPrompt(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function choiceParagraphOptions(correctParagraph, paragraphCount) {
  const available = Array.from({ length: paragraphCount }, (_, index) => index + 1)
  const selected = paragraphCount <= 4
    ? available
    : [...available.filter((paragraph) => paragraph !== correctParagraph).slice(0, 3), correctParagraph].sort((a, b) => a - b)
  return {
    options: selected.map((paragraph) => `Paragraph ${paragraph}`),
    answer: 'ABCD'[selected.indexOf(correctParagraph)],
  }
}

function supplementalChoiceQuestions(articleText, count, startPosition, existingPrompts) {
  const paragraphs = readingParagraphs(articleText)
  if (paragraphs.length < 2 || count < 1) return []
  const candidates = sentenceRecords(articleText)
    .filter(({ sentence }) => sentence.length >= 35 && sentence.length <= 220)
    .filter(({ sentence }) => !existingPrompts.has(normalizedPrompt(sentence)))
    .sort((left, right) => left.paragraph - right.paragraph || right.sentence.length - left.sentence.length)
  const usedParagraphs = new Set()
  const selected = []
  for (const candidate of candidates) {
    if (selected.length >= count) break
    if (usedParagraphs.has(candidate.paragraph) && candidates.some((item) => !usedParagraphs.has(item.paragraph))) continue
    usedParagraphs.add(candidate.paragraph)
    selected.push(candidate)
  }

  return selected.map((candidate, index) => {
    const choice = choiceParagraphOptions(candidate.paragraph, paragraphs.length)
    const question = {
      ...emptyQuestion(startPosition + index, 'choice'),
      prompt: `Which paragraph contains this information? “${candidate.sentence}”`,
      options: choice.options,
      answers: [choice.answer],
      evidenceSentence: candidate.sentence,
    }
    return withGuidance(articleText, question)
  })
}

function escapedRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function vocabularyCandidates(articleText, coreWordsText, extraWordsText, existingAnswers) {
  const article = String(articleText || '')
  const listed = [...parseReadingWords(coreWordsText), ...parseReadingWords(extraWordsText)]
    .map(({ word, meaning }) => ({ word: word.replace(/\s*\([^)]*\)\s*/g, '').trim(), meaning }))
    .filter(({ word }) => word.length >= 3)
    .filter(({ word }) => new RegExp(`\\b${escapedRegExp(word)}\\b`, 'i').test(article))
  const fallback = (article.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [])
    .filter((word) => word.length >= 5 && !fallbackStopWords.has(word))
    .map((word) => ({ word, meaning: '' }))
  const unique = new Map()
  for (const entry of [...listed, ...fallback]) {
    const key = entry.word.toLowerCase()
    if (!existingAnswers.has(key) && !unique.has(key)) unique.set(key, entry)
  }
  return [...unique.values()]
}

function supplementalClozeQuestions(articleText, coreWordsText, extraWordsText, count, startPosition, existingAnswers) {
  if (count < 1) return []
  const records = sentenceRecords(articleText)
  const vocabulary = vocabularyCandidates(articleText, coreWordsText, extraWordsText, existingAnswers)
  const questions = []
  for (const entry of vocabulary) {
    if (questions.length >= count) break
    const matcher = new RegExp(`\\b${escapedRegExp(entry.word)}\\b`, 'i')
    const record = records.find(({ sentence }) => matcher.test(sentence))
    if (!record) continue
    const prompt = record.sentence.replace(matcher, '____')
    if (questions.some((question) => normalizedPrompt(question.prompt) === normalizedPrompt(prompt))) continue
    const question = {
      ...emptyQuestion(startPosition + questions.length, 'cloze'),
      prompt,
      answers: [entry.word],
      blankCount: 1,
      evidenceSentence: record.sentence,
    }
    const guided = withGuidance(articleText, question)
    if (entry.meaning) guided.hintB = `${guided.hintB}\n中文線索：${entry.meaning}`
    questions.push(guided)
  }
  return questions
}

export function buildSupplementalReadingQuestions({
  articleText = '', coreWordsText = '', extraWordsText = '', questions = [], startPosition,
} = {}) {
  const assessment = assessReadingQuestionCoverage(articleText, questions)
  if (assessment.sufficient) return { assessment, questions: [], unresolved: { choice: 0, cloze: 0 } }

  const existingPrompts = new Set((questions || []).map((question) => normalizedPrompt(question.prompt)))
  const existingAnswers = new Set((questions || []).flatMap((question) => question.kind === 'cloze'
    ? (question.answers || []).map((answer) => String(answer || '').split('|')[0].trim().toLowerCase())
    : []).filter(Boolean))
  const largestPosition = (questions || []).reduce((largest, question) => Math.max(largest, Number(question.position) || 0), 0)
  const firstPosition = Number(startPosition) || largestPosition + 1
  const choiceQuestions = supplementalChoiceQuestions(
    articleText, assessment.missing.choice, firstPosition, existingPrompts,
  )
  const clozeQuestions = supplementalClozeQuestions(
    articleText, coreWordsText, extraWordsText, assessment.missing.cloze,
    firstPosition + choiceQuestions.length, existingAnswers,
  )
  return {
    assessment,
    questions: [...choiceQuestions, ...clozeQuestions],
    unresolved: {
      choice: Math.max(0, assessment.missing.choice - choiceQuestions.length),
      cloze: Math.max(0, assessment.missing.cloze - clozeQuestions.length),
    },
  }
}
