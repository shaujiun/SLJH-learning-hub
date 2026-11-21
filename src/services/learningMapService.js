import { requireSupabase } from '../lib/supabase.js'
import {
  mapLearningMapRow,
  normalizeLearningMapInput,
  validateLearningMapFile,
} from '../lib/learningMaps.js'
import { bundledLearningMapsFor } from '../data/scienceLearningMaps.js'

const bucketName = 'learning-map-assets'
const learningMapSelect = `
  id,
  map_code,
  subject_code,
  grade_level,
  semester,
  volume_no,
  chapter_no,
  section_no,
  title,
  description,
  creator_name,
  source_name,
  source_url,
  usage_note,
  storage_path,
  original_file_name,
  mime_type,
  display_order,
  status,
  published_at,
  updated_at
`

function safeSegment(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'map'
}

async function currentUserId(client) {
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) throw new Error('登入已逾時，請重新登入後再試。')
  return data.user.id
}

async function signedUrlByPath(rows, client) {
  const paths = [...new Set(rows.map((row) => row.storage_path).filter(Boolean))]
  if (paths.length === 0) return new Map()
  const { data, error } = await client.storage.from(bucketName).createSignedUrls(paths, 60 * 60)
  if (error) throw new Error(`無法開啟學習地圖：${error.message}`)
  return new Map((data || []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]))
}

export async function loadLearningMaps(subjectCode = 'geography', client = requireSupabase()) {
  const { data: authData, error: authError } = await client.auth.getUser()
  if (authError) throw authError
  if (!authData.user) return { access: 'login', canManage: false, maps: [] }

  const [managerResult, studentResult] = await Promise.all([
    client.rpc('can_manage_learning_maps'),
    client.rpc('is_active_learning_student'),
  ])
  const canManage = !managerResult.error && Boolean(managerResult.data)
  const isStudent = !studentResult.error && Boolean(studentResult.data)
  if (!canManage && !isStudent) return { access: 'denied', canManage: false, maps: [] }

  let query = client
    .from('learning_maps')
    .select(learningMapSelect)
    .eq('subject_code', subjectCode)
    .order('volume_no')
    .order('chapter_no')
    .order('section_no')
    .order('display_order')
  if (!canManage) query = query.eq('status', 'published')
  const { data, error } = await query
  if (error) throw new Error(`無法讀取學習地圖：${error.message}`)

  const rows = data || []
  const signedUrls = await signedUrlByPath(rows, client)
  const databaseMaps = rows.map((row) => mapLearningMapRow({ ...row, signedUrl: signedUrls.get(row.storage_path) || '' }))
  const databaseCodes = new Set(databaseMaps.map((item) => item.mapCode))
  const bundledMaps = bundledLearningMapsFor(subjectCode).filter((item) => !databaseCodes.has(item.mapCode))
  return {
    access: 'allowed',
    canManage,
    maps: [...databaseMaps, ...bundledMaps].sort((left, right) => (
      left.volumeNo - right.volumeNo
      || left.chapterNo - right.chapterNo
      || (left.sectionNo || 0) - (right.sectionNo || 0)
      || left.displayOrder - right.displayOrder
    )),
  }
}

function storagePathFor(input, file, userId) {
  const extension = file.name.split('.').pop()?.toLowerCase() || (file.type === 'application/pdf' ? 'pdf' : 'jpg')
  const chapter = String(Number(input.chapterNo) || 1).padStart(2, '0')
  const section = String(Number(input.sectionNo) || 1).padStart(2, '0')
  const volume = String(Number(input.volumeNo) || 1).padStart(2, '0')
  const stamp = `${Date.now()}-${crypto.getRandomValues(new Uint32Array(1))[0]}`
  return `${safeSegment(input.subjectCode)}/book${volume}/ch${chapter}/sec${section}/${userId}/${stamp}.${extension}`
}

export async function saveLearningMap(input, file, client = requireSupabase()) {
  validateLearningMapFile(file)
  const userId = await currentUserId(client)
  let uploadedPath = ''
  let nextInput = { ...input }

  if (file) {
    uploadedPath = storagePathFor(input, file, userId)
    const { error } = await client.storage.from(bucketName).upload(uploadedPath, file, {
      contentType: file.type,
      upsert: false,
    })
    if (error) throw new Error(`學習地圖上傳失敗：${error.message}`)
    nextInput = {
      ...nextInput,
      storagePath: uploadedPath,
      originalFileName: file.name,
      mimeType: file.type,
    }
  }

  let payload
  try {
    payload = normalizeLearningMapInput(nextInput)
  } catch (error) {
    if (uploadedPath) await client.storage.from(bucketName).remove([uploadedPath])
    throw error
  }

  const now = new Date().toISOString()
  const writePayload = {
    ...payload,
    updated_by: userId,
    updated_at: now,
    published_at: payload.status === 'published' ? (input.publishedAt || now) : null,
  }
  if (!input.id) {
    writePayload.map_code = input.mapCode || `${safeSegment(payload.subject_code)}-book${String(payload.volume_no).padStart(2, '0')}-ch${String(payload.chapter_no).padStart(2, '0')}-sec${String(payload.section_no).padStart(2, '0')}-${Date.now()}`
    writePayload.created_by = userId
  }

  const query = input.id
    ? client.from('learning_maps').update(writePayload).eq('id', input.id)
    : client.from('learning_maps').insert(writePayload)
  const { data, error } = await query.select(learningMapSelect).single()
  if (error) {
    if (uploadedPath) await client.storage.from(bucketName).remove([uploadedPath])
    throw new Error(`無法儲存學習地圖：${error.message}`)
  }

  if (uploadedPath && input.storagePath && input.storagePath !== uploadedPath) {
    const removal = await client.storage.from(bucketName).remove([input.storagePath])
    if (removal.error) console.warn('舊學習地圖檔案未能移除。', removal.error)
  }
  return mapLearningMapRow(data)
}
