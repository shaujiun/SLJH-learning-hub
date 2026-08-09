import { requireSupabase } from '../lib/supabase.js'
import { normalizeHistoryEventInput } from '../lib/historyAtlas.js'

const chapterSelect = `
  id,
  chapter_code,
  curriculum_edition,
  school_year_label,
  grade_level,
  semester,
  volume_no,
  chapter_no,
  title,
  start_page,
  display_order,
  is_active
`

const eventSelect = `
  id,
  event_code,
  chapter_id,
  title,
  start_year,
  end_year,
  display_date,
  region,
  category,
  importance,
  summary,
  cause_text,
  process_text,
  impact_text,
  people,
  keywords,
  image_url,
  image_source,
  image_source_url,
  resource_url,
  source_note,
  display_order,
  status,
  published_at,
  updated_at
`

function mapChapter(row) {
  return {
    id: row.id,
    chapterCode: row.chapter_code,
    curriculumEdition: row.curriculum_edition,
    schoolYearLabel: row.school_year_label,
    gradeLevel: row.grade_level,
    semester: row.semester,
    volumeNo: row.volume_no,
    chapterNo: row.chapter_no,
    title: row.title,
    startPage: row.start_page,
    displayOrder: row.display_order,
    isActive: row.is_active,
  }
}

function mapEvent(row, chapterById) {
  return {
    id: row.id,
    eventCode: row.event_code,
    chapterId: row.chapter_id,
    chapter: chapterById.get(row.chapter_id) || null,
    title: row.title,
    startYear: row.start_year,
    endYear: row.end_year,
    displayDate: row.display_date || '',
    region: row.region,
    category: row.category,
    importance: row.importance,
    summary: row.summary || '',
    causeText: row.cause_text || '',
    processText: row.process_text || '',
    impactText: row.impact_text || '',
    people: row.people || [],
    keywords: row.keywords || [],
    imageUrl: row.image_url || '',
    imageSource: row.image_source || '',
    imageSourceUrl: row.image_source_url || '',
    resourceUrl: row.resource_url || '',
    sourceNote: row.source_note || '',
    pastQuestions: [],
    practiceQuestions: [],
    displayOrder: row.display_order,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }
}

export async function loadHistoryAtlas(client = requireSupabase()) {
  const [chapterResult, permissionResult, positionResult] = await Promise.all([
    client.from('history_chapters').select(chapterSelect).order('display_order'),
    client.rpc('can_manage_history_content'),
    client.from('history_reader_positions').select('chapter_id,event_id,volume_no,focus_mode').maybeSingle(),
  ])

  if (chapterResult.error) throw new Error(`無法讀取歷史章節：${chapterResult.error.message}`)
  const chapters = (chapterResult.data || []).map(mapChapter)
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]))
  const eventResult = await client
    .from('history_events')
    .select(eventSelect)
    .order('start_year')
    .order('display_order')
  if (eventResult.error) throw new Error(`無法讀取歷史事件：${eventResult.error.message}`)

  return {
    chapters,
    events: (eventResult.data || []).map((row) => mapEvent(row, chapterById)),
    canManage: permissionResult.error ? false : Boolean(permissionResult.data),
    position: positionResult.error ? null : positionResult.data,
  }
}

async function currentUserId(client) {
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new Error('登入已逾時，請重新登入後再試。')
  return data.user.id
}

export async function saveHistoryEvent(input, chapters, client = requireSupabase()) {
  const payload = normalizeHistoryEventInput(input, chapters)
  const userId = await currentUserId(client)
  const writePayload = {
    ...payload,
    updated_by: userId,
    updated_at: new Date().toISOString(),
    published_at: payload.status === 'published' ? new Date().toISOString() : null,
  }

  const query = input.id
    ? client.from('history_events').update(writePayload).eq('id', input.id)
    : client.from('history_events').insert({ ...writePayload, created_by: userId })
  const { data, error } = await query.select(eventSelect).single()
  if (error) {
    const message = error.code === '23505' ? '這個事件代碼已經存在。' : error.message
    throw new Error(`無法儲存歷史事件：${message}`)
  }
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]))
  return mapEvent(data, chapterById)
}

export async function setHistoryEventStatus(id, status, client = requireSupabase()) {
  const userId = await currentUserId(client)
  const { error } = await client
    .from('history_events')
    .update({
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(`無法更新事件狀態：${error.message}`)
}

export async function saveHistoryReaderPosition({ chapterId, eventId, volumeNo, focusMode }, client = requireSupabase()) {
  const userId = await currentUserId(client)
  const { error } = await client.from('history_reader_positions').upsert({
    profile_id: userId,
    chapter_id: chapterId || null,
    event_id: eventId || null,
    volume_no: volumeNo || null,
    focus_mode: Boolean(focusMode),
    updated_at: new Date().toISOString(),
  })
  if (error) console.warn('無法儲存歷史閱讀位置。', error)
}

export async function uploadHistoryImage(file, client = requireSupabase()) {
  if (!file) throw new Error('請先選擇圖片。')
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) throw new Error('圖片僅支援 JPG、PNG 或 WebP。')
  if (file.size > 5 * 1024 * 1024) throw new Error('圖片大小不可超過 5 MB。')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const userId = await currentUserId(client)
  const path = `${userId}/${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}.${extension}`
  const { error } = await client.storage.from('history-media').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error(`圖片上傳失敗：${error.message}`)
  return client.storage.from('history-media').getPublicUrl(path).data.publicUrl
}

export async function importHistoryEventRows(rows, mode = 'update', client = requireSupabase()) {
  if (!Array.isArray(rows) || rows.length === 0) return { imported: 0, skipped: 0 }
  const userId = await currentUserId(client)
  let writeRows = rows.map((row) => ({
    ...row.payload,
    status: 'draft',
    published_at: null,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }))
  let skipped = 0

  if (mode === 'skip') {
    const codes = writeRows.map((row) => row.event_code)
    const { data, error } = await client.from('history_events').select('event_code').in('event_code', codes)
    if (error) throw new Error(`無法比對既有事件：${error.message}`)
    const existing = new Set((data || []).map((row) => String(row.event_code).toLowerCase()))
    skipped = writeRows.filter((row) => existing.has(String(row.event_code).toLowerCase())).length
    writeRows = writeRows.filter((row) => !existing.has(String(row.event_code).toLowerCase()))
  }

  if (writeRows.length === 0) return { imported: 0, skipped }
  const query = mode === 'update'
    ? client.from('history_events').upsert(writeRows, { onConflict: 'event_code' })
    : client.from('history_events').insert(writeRows.map((row) => ({ ...row, created_by: userId })))
  const { error } = await query
  if (error) throw new Error(`歷史事件匯入失敗：${error.message}`)
  return { imported: writeRows.length, skipped }
}
