export const learningMapSubjects = [
  { value: 'history', label: '歷史' },
  { value: 'geography', label: '地理' },
  { value: 'civics', label: '公民' },
]

export const learningMapStatuses = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已發布' },
  { value: 'archived', label: '已封存' },
]

export const learningMapMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

export const learningMapMaxFileSize = 15 * 1024 * 1024

export function subjectLabel(subjectCode) {
  return learningMapSubjects.find((subject) => subject.value === subjectCode)?.label || '社會'
}

export function semesterLabel(semester) {
  return Number(semester) === 2 ? '下學期' : '上學期'
}

export function learningMapLevelLabel(item) {
  return `${Number(item.gradeLevel)} 年級${semesterLabel(item.semester)}・CH${Number(item.chapterNo)}`
}

export function mapLearningMapRow(row) {
  return {
    id: row.id,
    mapCode: row.map_code,
    subjectCode: row.subject_code,
    gradeLevel: Number(row.grade_level),
    semester: Number(row.semester),
    chapterNo: Number(row.chapter_no),
    title: row.title || '',
    description: row.description || '',
    creatorName: row.creator_name || '',
    sourceName: row.source_name || '',
    sourceUrl: row.source_url || '',
    usageNote: row.usage_note || '',
    storagePath: row.storage_path || '',
    originalFileName: row.original_file_name || '',
    mimeType: row.mime_type || '',
    displayOrder: Number(row.display_order) || 0,
    status: row.status || 'draft',
    publishedAt: row.published_at || null,
    updatedAt: row.updated_at || null,
    signedUrl: row.signedUrl || '',
  }
}

export function blankLearningMap(subjectCode = 'geography') {
  return {
    id: '', mapCode: '', subjectCode, gradeLevel: 8, semester: 1, chapterNo: 1,
    title: '', description: '', creatorName: '翻轉地理教室',
    sourceName: '翻轉地理教室',
    sourceUrl: 'https://eduforeveryone123.wixsite.com/flippinggeography',
    usageNote: '製作老師透過 LINE 官方帳號提供自由下載使用；本站僅供已核准學生登入閱讀。',
    storagePath: '', originalFileName: '', mimeType: '', displayOrder: 0,
    status: 'draft', signedUrl: '',
  }
}

export function validateLearningMapFile(file) {
  if (!file) return
  if (!learningMapMimeTypes.includes(file.type)) throw new Error('檔案僅支援 JPG、PNG、WebP 或 PDF。')
  if (file.size > learningMapMaxFileSize) throw new Error('單一檔案不可超過 15 MB。')
}

export function normalizeLearningMapInput(input) {
  const subjectCode = String(input.subjectCode || '').trim()
  const gradeLevel = Number(input.gradeLevel)
  const semester = Number(input.semester)
  const chapterNo = Number(input.chapterNo)
  const title = String(input.title || '').trim()
  const creatorName = String(input.creatorName || '').trim()
  const sourceUrl = String(input.sourceUrl || '').trim()
  const status = String(input.status || 'draft')

  if (!learningMapSubjects.some((subject) => subject.value === subjectCode)) throw new Error('請選擇歷史、地理或公民。')
  if (![7, 8, 9].includes(gradeLevel)) throw new Error('請選擇 7～9 年級。')
  if (![1, 2].includes(semester)) throw new Error('請選擇上學期或下學期。')
  if (!Number.isInteger(chapterNo) || chapterNo < 1 || chapterNo > 30) throw new Error('章節必須是 1～30。')
  if (!title) throw new Error('請輸入學習地圖標題。')
  if (!creatorName) throw new Error('請填寫製作者。')
  if (!/^https:\/\//i.test(sourceUrl)) throw new Error('請填寫以 https:// 開頭的來源網址。')
  if (!learningMapStatuses.some((item) => item.value === status)) throw new Error('發布狀態不正確。')
  if (status === 'published' && !String(input.storagePath || '').trim()) throw new Error('發布前必須先上傳學習地圖檔案。')

  return {
    subject_code: subjectCode,
    grade_level: gradeLevel,
    semester,
    chapter_no: chapterNo,
    title,
    description: String(input.description || '').trim(),
    creator_name: creatorName,
    source_name: String(input.sourceName || creatorName).trim(),
    source_url: sourceUrl,
    usage_note: String(input.usageNote || '').trim(),
    storage_path: String(input.storagePath || '').trim(),
    original_file_name: String(input.originalFileName || '').trim(),
    mime_type: String(input.mimeType || '').trim(),
    display_order: Number(input.displayOrder) || (gradeLevel * 1000 + semester * 100 + chapterNo),
    status,
  }
}
