export const learningMapSubjects = [
  { value: 'science', label: '自然' },
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
  return learningMapSubjects.find((subject) => subject.value === subjectCode)?.label || '學科'
}

export function semesterLabel(semester) {
  return Number(semester) === 2 ? '下學期' : '上學期'
}

export function learningMapVolumeNo(item) {
  const explicitVolume = Number(item.volumeNo ?? item.volume_no)
  if (Number.isInteger(explicitVolume) && explicitVolume > 0) return explicitVolume
  const gradeLevel = Number(item.gradeLevel ?? item.grade_level)
  const semester = Number(item.semester)
  if (![7, 8, 9].includes(gradeLevel) || ![1, 2].includes(semester)) return 0
  return (gradeLevel - 7) * 2 + semester
}

export function learningMapLevelLabel(item) {
  const volumeNo = learningMapVolumeNo(item)
  const chapterNo = Number(item.chapterNo ?? item.chapter_no)
  const sectionNo = Number(item.sectionNo ?? item.section_no)
  return [
    volumeNo ? `第 ${volumeNo} 冊` : '',
    chapterNo ? `第 ${chapterNo} 章` : '',
    sectionNo ? `第 ${sectionNo} 節` : '',
  ].filter(Boolean).join('・')
}

function numericOptions(values) {
  return [...new Set(values.map(Number).filter((value) => Number.isInteger(value) && value > 0))].sort((a, b) => a - b)
}

export function learningMapFilterOptions(maps, { volume = 'all', chapter = 'all' } = {}) {
  const byVolume = volume === 'all' ? maps : maps.filter((item) => learningMapVolumeNo(item) === Number(volume))
  const byChapter = chapter === 'all' ? byVolume : byVolume.filter((item) => Number(item.chapterNo) === Number(chapter))
  return {
    volumes: numericOptions(maps.map(learningMapVolumeNo)),
    chapters: numericOptions(byVolume.map((item) => item.chapterNo)),
    sections: numericOptions(byChapter.map((item) => item.sectionNo)),
  }
}

export function filterLearningMaps(maps, { volume = 'all', chapter = 'all', section = 'all' } = {}) {
  return maps.filter((item) => (
    (volume === 'all' || learningMapVolumeNo(item) === Number(volume))
    && (chapter === 'all' || Number(item.chapterNo) === Number(chapter))
    && (section === 'all' || Number(item.sectionNo) === Number(section))
  ))
}

export function mapLearningMapRow(row) {
  return {
    id: row.id,
    mapCode: row.map_code,
    subjectCode: row.subject_code,
    gradeLevel: Number(row.grade_level),
    semester: Number(row.semester),
    volumeNo: Number(row.volume_no) || learningMapVolumeNo(row),
    chapterNo: Number(row.chapter_no),
    sectionNo: row.section_no == null ? null : Number(row.section_no),
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
  const isScience = subjectCode === 'science'
  return {
    id: '', mapCode: '', subjectCode, gradeLevel: 8, semester: 1, volumeNo: 3, chapterNo: 1, sectionNo: 1,
    title: '', description: '', creatorName: isScience ? '陳少軍老師' : '翻轉地理教室',
    sourceName: isScience ? 'AI 輔助製作' : '翻轉地理教室',
    sourceUrl: isScience ? 'https://shaujiun.github.io/SLJH-learning-hub/' : 'https://eduforeveryone123.wixsite.com/flippinggeography',
    usageNote: isScience ? '由陳少軍老師請 AI 生成，供學生登入學習系統後閱讀。' : '製作老師透過 LINE 官方帳號提供自由下載使用；本站僅供已核准學生登入閱讀。',
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
  const volumeNo = Number(input.volumeNo) || learningMapVolumeNo(input)
  const chapterNo = Number(input.chapterNo)
  const sectionNo = Number(input.sectionNo)
  const title = String(input.title || '').trim()
  const creatorName = String(input.creatorName || '').trim()
  const sourceUrl = String(input.sourceUrl || '').trim()
  const status = String(input.status || 'draft')

  if (!learningMapSubjects.some((subject) => subject.value === subjectCode)) throw new Error('請選擇自然、歷史、地理或公民。')
  if (![7, 8, 9].includes(gradeLevel)) throw new Error('請選擇 7～9 年級。')
  if (![1, 2].includes(semester)) throw new Error('請選擇上學期或下學期。')
  if (!Number.isInteger(volumeNo) || volumeNo < 1 || volumeNo > 6) throw new Error('冊別必須是 1～6。')
  if (!Number.isInteger(chapterNo) || chapterNo < 1 || chapterNo > 30) throw new Error('章節必須是 1～30。')
  if (!Number.isInteger(sectionNo) || sectionNo < 1 || sectionNo > 30) throw new Error('節次必須是 1～30。')
  if (!title) throw new Error('請輸入學習地圖標題。')
  if (!creatorName) throw new Error('請填寫製作者。')
  if (!/^https:\/\//i.test(sourceUrl)) throw new Error('請填寫以 https:// 開頭的來源網址。')
  if (!learningMapStatuses.some((item) => item.value === status)) throw new Error('發布狀態不正確。')
  if (status === 'published' && !String(input.storagePath || '').trim()) throw new Error('發布前必須先上傳學習地圖檔案。')

  return {
    subject_code: subjectCode,
    grade_level: gradeLevel,
    semester,
    volume_no: volumeNo,
    chapter_no: chapterNo,
    section_no: sectionNo,
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
