import { requireSupabase } from '../lib/supabase.js'

const questionColumns = 'id, lesson_id, position, kind, group_scope, prompt, options, blank_count, hint_a, hint_b'

export function mapReadingQuestion(row) {
  return {
    id: row.id, lessonId: row.lesson_id, position: row.position,
    kind: row.kind, groupScope: row.group_scope, prompt: row.prompt,
    options: row.options || [], blankCount: row.blank_count,
    hintA: row.hint_a || '', hintB: row.hint_b || '',
  }
}

export async function loadStudentReadingQuestions(lessonId, client = requireSupabase()) {
  if (!lessonId) return []
  const { data, error } = await client.from('english_reading_questions')
    .select(questionColumns).eq('lesson_id', lessonId).order('position', { ascending: true })
  if (error) throw new Error(`無法讀取閱讀題目：${error.message}`)
  return (data || []).map(mapReadingQuestion)
}

export async function loadAdminReadingQuestions(lessonId, client = requireSupabase()) {
  if (!lessonId) return []
  const questionResult = await client.from('english_reading_questions')
    .select(questionColumns).eq('lesson_id', lessonId).order('position', { ascending: true })
  if (questionResult.error) throw new Error(`無法讀取閱讀題目：${questionResult.error.message}`)
  if (!questionResult.data?.length) return []
  const keyResult = await client.from('english_reading_answer_keys')
    .select('question_id, answers, explanation, evidence_sentence')
    .in('question_id', questionResult.data.map((row) => row.id))
  if (keyResult.error) throw new Error(`無法讀取題目正解：${keyResult.error.message}`)
  const keys = new Map((keyResult.data || []).map((row) => [row.question_id, row]))
  return (questionResult.data || []).map((row) => {
    const key = keys.get(row.id)
    return { ...mapReadingQuestion(row), answers: key?.answers || [],
      explanation: key?.explanation || '', evidenceSentence: key?.evidence_sentence || '' }
  })
}

export function readingQuestionPayload(question, lessonId) {
  if (!lessonId) throw new Error('請先將文章存入資料庫草稿。')
  const kind = question.kind === 'cloze' ? 'cloze' : 'choice'
  const prompt = String(question.prompt || '').trim()
  const options = kind === 'choice' ? (question.options || []).map((item) => String(item).trim()) : []
  while (options.length && !options.at(-1)) options.pop()
  const answers = kind === 'choice'
    ? [String(question.answers?.[0] || '').trim().toUpperCase()]
    : (question.answers || []).map((item) => String(item).trim()).filter(Boolean)
  if (!prompt) throw new Error('請輸入題目。')
  if (kind === 'choice' && (options.length < 2 || options.length > 4 || options.some((item) => !item) || !'ABCD'.slice(0, options.length).includes(answers[0]))) {
    throw new Error('選擇題需要 2 至 4 個選項，並指定有效的正解代號。')
  }
  if (kind === 'cloze' && (answers.length < 1 || answers.length > 6)) {
    throw new Error('填空題需要 1 至 6 個答案；每行對應一個空格。')
  }
  return {
    p_lesson_id: lessonId, p_question_id: question.id || null,
    p_position: Number(question.position) || 1, p_kind: kind,
    p_group_scope: ['all', 'A', 'B'].includes(question.groupScope) ? question.groupScope : 'all',
    p_prompt: prompt, p_options: options, p_answers: answers,
    p_explanation: String(question.explanation || '').trim(),
    p_evidence_sentence: String(question.evidenceSentence || '').trim(),
    p_hint_a: String(question.hintA || '').trim(), p_hint_b: String(question.hintB || '').trim(),
  }
}

export async function saveAdminReadingQuestion(question, lessonId, client = requireSupabase()) {
  const payload = readingQuestionPayload(question, lessonId)
  const { data, error } = await client.rpc('save_english_reading_question', payload)
  if (error) throw new Error(`無法儲存閱讀題目：${error.message}`)
  return data
}

export async function deleteAdminReadingQuestion(questionId, client = requireSupabase()) {
  const { error } = await client.rpc('delete_english_reading_question', { p_question_id: questionId })
  if (error) throw new Error(error.message.includes('last_published_question')
    ? '已發布文章至少需保留一題；請先將文章改為草稿，才能刪除最後一題。'
    : `無法刪除閱讀題目：${error.message}`)
}

export async function submitStudentReadingAnswer(questionId, answers, evidenceText = '', client = requireSupabase()) {
  const { data, error } = await client.rpc('submit_english_reading_answer', {
    p_question_id: questionId, p_answers: answers.map((answer) => String(answer).trim()),
    p_evidence_text: evidenceText,
  })
  if (error) throw new Error(`無法送出答案：${error.message}`)
  return data
}
