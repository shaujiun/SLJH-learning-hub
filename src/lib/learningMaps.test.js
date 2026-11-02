import { describe, expect, it } from 'vitest'
import {
  filterLearningMaps,
  learningMapFilterOptions,
  learningMapLevelLabel,
  learningMapVolumeNo,
  mapLearningMapRow,
  normalizeLearningMapInput,
  validateLearningMapFile,
} from './learningMaps.js'

const base = {
  subjectCode: 'geography', gradeLevel: 8, semester: 1, volumeNo: 3, chapterNo: 3, sectionNo: 1,
  title: '中國的工業', creatorName: '翻轉地理教室',
  sourceUrl: 'https://example.com/source', storagePath: 'geography/map.jpg',
  mimeType: 'image/jpeg', status: 'published',
}

describe('learningMaps', () => {
  it('整理八上地理章節與資料庫欄位', () => {
    const payload = normalizeLearningMapInput(base)
    expect(payload).toEqual(expect.objectContaining({
      subject_code: 'geography', grade_level: 8, semester: 1, volume_no: 3, chapter_no: 3, section_no: 1,
      title: '中國的工業', status: 'published',
    }))
    expect(learningMapLevelLabel(base)).toBe('第 3 冊・第 3 章・第 1 節')
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
      semester: 1, volume_no: 3, chapter_no: 3, section_no: 2, title: '中國的工業', display_order: 8030,
      status: 'draft',
    })).toEqual(expect.objectContaining({ id: 'map-1', gradeLevel: 8, volumeNo: 3, chapterNo: 3, sectionNo: 2, displayOrder: 8030 }))
  })

  it('舊資料可由年級與學期換算冊別', () => {
    expect(learningMapVolumeNo({ gradeLevel: 8, semester: 1 })).toBe(3)
    expect(learningMapVolumeNo({ gradeLevel: 9, semester: 2 })).toBe(6)
  })

  it('依冊別、章別與節次建立連動選項並篩選', () => {
    const maps = [
      { volumeNo: 3, chapterNo: 3, sectionNo: 1 },
      { volumeNo: 3, chapterNo: 3, sectionNo: 2 },
      { volumeNo: 3, chapterNo: 3, sectionNo: 2 },
      { volumeNo: 3, chapterNo: 4, sectionNo: 1 },
      { volumeNo: 4, chapterNo: 1, sectionNo: 1 },
    ]
    expect(learningMapFilterOptions(maps, { volume: '3', chapter: '3' })).toEqual({
      volumes: [3, 4], chapters: [3, 4], sections: [1, 2],
    })
    expect(filterLearningMaps(maps, { volume: '3', chapter: '3', section: '2' })).toHaveLength(2)
  })
})
