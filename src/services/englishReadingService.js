import { requireSupabase } from '../lib/supabase.js'
import { normalizeReadingDraft } from '../lib/englishReadingDraft.js'

const lessonColumns = `
  id, issue_on, title, author_name, source_name, english_text, translation_text,
  grammar_text, core_words, extra_words, mind_map_text, cloze_text, questions_text,
  group_a_hint, group_b_hint, available_from, available_until
`

function taipeiToday() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

export function mapReadingLesson(row) {
  return {
    id: row.id,
    availableFrom: row.available_from,
    availableUntil: row.available_until,
    ...normalizeReadingDraft({
      title: row.title,
      author: row.author_name,
      issueDate: row.issue_on || '',
      source: row.source_name,
      english: row.english_text,
      translation: row.translation_text,
      grammar: row.grammar_text,
      coreWords: row.core_words,
      extraWords: row.extra_words,
      mindMap: row.mind_map_text,
      cloze: row.cloze_text,
      questions: row.questions_text,
      groupAHint: row.group_a_hint,
      groupBHint: row.group_b_hint,
    }),
  }
}

export async function loadStudentReadingLessons(client = requireSupabase()) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError
  const userId = sessionData.session?.user?.id
  if (!userId) return { access: 'login', lessons: [], group: 'B' }

  const { data: allowed, error: permissionError } = await client.rpc('is_active_learning_student')
  if (permissionError) throw new Error(`無法確認學生閱讀權限：${permissionError.message}`)
  if (!allowed) return { access: 'denied', lessons: [], group: 'B' }

  const [studentResult, lessonResult] = await Promise.all([
    client.from('students').select('id').eq('profile_id', userId).eq('is_active', true).maybeSingle(),
    client.from('english_reading_lessons').select(lessonColumns)
      .eq('status', 'published').order('issue_on', { ascending: false }),
  ])
  if (studentResult.error) throw studentResult.error
  if (lessonResult.error) throw new Error(`無法讀取英語閱讀文章：${lessonResult.error.message}`)
  let group = 'B'
  if (studentResult.data?.id) {
    const { data, error } = await client.rpc('resolve_student_learning_group', {
      p_student_id: studentResult.data.id,
      p_subject_code: 'english',
      p_reference_date: taipeiToday(),
    })
    if (error) throw new Error(`無法確認英語分組：${error.message}`)
    if (String(data).toUpperCase() === 'A') group = 'A'
  }
  return { access: 'allowed', lessons: (lessonResult.data || []).map(mapReadingLesson), group }
}

export async function loadAdminReadingLessons(client = requireSupabase()) {
  const { data: allowed, error: permissionError } = await client.rpc('can_manage_english_reading')
  if (permissionError) throw permissionError
  if (!allowed) throw new Error('只有管理者可以編輯英語閱讀文章。')
  const { data, error } = await client.from('english_reading_lessons')
    .select(`${lessonColumns}, status, usage_note`).order('updated_at', { ascending: false })
  if (error) throw new Error(`無法讀取英語閱讀草稿：${error.message}`)
  return (data || []).map((row) => ({
    ...mapReadingLesson(row), status: row.status, usageNote: row.usage_note || '',
  }))
}

export function readingLessonPayload(draft, options = {}) {
  const content = normalizeReadingDraft(draft)
  const status = options.status === 'published' ? 'published' : 'draft'
  const availableFrom = options.availableFrom || null
  const availableUntil = options.availableUntil || null
  const usageNote = String(options.usageNote || '').trim()
  if ((availableFrom || availableUntil) && (!availableFrom || !availableUntil || availableUntil < availableFrom)) {
    throw new Error('開放日期與截止日期必須同時填寫，且截止日期不可早於開放日期。')
  }
  if (status === 'published') {
    if (!content.title.trim() || !content.english.trim()) throw new Error('發布前須校對文章標題與英文內容。')
    if (!availableFrom || !availableUntil || availableUntil < availableFrom) throw new Error('發布前須設定有效的開始與結束日期。')
    if (!usageNote) throw new Error('發布前須記錄本篇文章的教學使用依據或授權範圍。')
  }
  return {
    issue_on: content.issueDate || null,
    title: content.title.trim(), author_name: content.author.trim(), source_name: content.source.trim(),
    english_text: content.english, translation_text: content.translation,
    grammar_text: content.grammar, core_words: content.coreWords, extra_words: content.extraWords,
    mind_map_text: content.mindMap, cloze_text: content.cloze, questions_text: content.questions,
    group_a_hint: content.groupAHint, group_b_hint: content.groupBHint,
    status, available_from: availableFrom, available_until: availableUntil,
    usage_note: usageNote,
    published_at: status === 'published' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }
}

export async function saveAdminReadingLesson(draft, options = {}, client = requireSupabase()) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession()
  if (sessionError) throw sessionError
  const userId = sessionData.session?.user?.id
  if (!userId) throw new Error('請先登入管理者帳號。')
  const payload = { ...readingLessonPayload(draft, options), updated_by: userId }
  const query = options.id
    ? client.from('english_reading_lessons').update(payload).eq('id', options.id).select('id').single()
    : client.from('english_reading_lessons').insert({ ...payload, created_by: userId }).select('id').single()
  const { data, error } = await query
  if (error) throw new Error(`無法儲存英語閱讀文章：${error.message}`)
  return data.id
}
