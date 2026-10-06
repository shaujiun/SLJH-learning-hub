import { describe, expect, it } from 'vitest'
import {
  learningMapLevelLabel,
  mapLearningMapRow,
  normalizeLearningMapInput,
  validateLearningMapFile,
} from './learningMaps.js'

const base = {
  subjectCode: 'geography', gradeLevel: 8, semester: 1, chapterNo: 3,
  title: '中國的工業', creatorName: '翻轉地理教室',
  sourceUrl: 'https://example.com/source', storagePath: 'geography/map.jpg',
  mimeType: 'image/jpeg', status: 'published',
}

describe('learningMaps', () => {
  it('整理八上地理章節與資料庫欄位', () => {
    const payload = normalizeLearningMapInput(base)
    expect(payload).toEqual(expect.objectContaining({
      subject_code: 'geography', grade_level: 8, semester: 1, chapter_no: 3,
      title: '中國的工業', status: 'published',
    }))
    expect(learningMapLevelLabel(base)).toBe('8 年級上學期・CH3')
  })

  it('發布前要求檔案、製作者與來源', () => {
    expect(() => normalizeLearningMapInput({ ...base, storagePath: '' })).toThrow('必須先上傳')
    expect(() => normalizeLearningMapInput({ ...base, creatorName: '' })).toThrow('製作者')
    expect(() => normalizeLearningMapInput({ ...base, sourceUrl: '' })).toThrow('https://')
  })

  it('只接受圖片與 PDF，且限制 15 MB', () => {
    expect(() => validateLearningMapFile({ type: 'image/png', size: 1024 })).not.toThrow()
    expect(() => validateLearningMapFile({ type: 'text/plain', size: 1024 })).toThrow('JPG')
    expect(() => validateLearningMapFile({ type: 'application/pdf', size: 16 * 1024 * 1024 })).toThrow('15 MB')
  })

  it('將資料庫欄位轉成前端格式', () => {
    expect(mapLearningMapRow({
      id: 'map-1', map_code: 'geo-8-1-3', subject_code: 'geography', grade_level: 8,
      semester: 1, chapter_no: 3, title: '中國的工業', display_order: 8030,
      status: 'draft',
    })).toEqual(expect.objectContaining({ id: 'map-1', gradeLevel: 8, chapterNo: 3, displayOrder: 8030 }))
  })
})
