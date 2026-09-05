import { describe, expect, it } from 'vitest'
import {
  appendFocusTaskCurriculumScope,
  geographyTaskAllowsSelection,
  getFocusTaskCurriculumScope,
  isGeographyGrade7ReviewTask,
} from './focusTaskCurriculum.js'

describe('focusTaskCurriculum', () => {
  it('第一次段考結束前，地理每日任務只開放八上第 1、2 章', () => {
    expect(getFocusTaskCurriculumScope({
      id: '66fcaa73-1244-4e15-a577-c30ce3d5d301',
      subjectCode: 'geography',
      assignedDate: '2026-09-18',
    })).toMatchObject({
      areaId: 'china',
      chapterIds: ['grade8-upper-l01', 'grade8-upper-l02'],
      label: '八上第 1～2 章',
    })
  })

  it('第一次段考結束後，地理每日任務加入八上第 3、4 章', () => {
    expect(getFocusTaskCurriculumScope({
      id: '66fcaa73-1244-4e15-a577-c30ce3d5d301',
      subjectCode: 'geography',
      assignedDate: '2026-09-19',
    }).chapterIds).toEqual([
      'grade8-upper-l01',
      'grade8-upper-l02',
      'grade8-upper-l03',
      'grade8-upper-l04',
    ])
  })

  it('約五分之一地理任務固定為七上複習，且不含九年級', () => {
    const reviewTask = {
      id: '66fcaa73-1244-4e15-a577-c30ce3d5d300',
      subjectCode: 'geography',
      assignedDate: '2026-09-05',
    }

    expect(isGeographyGrade7ReviewTask(reviewTask)).toBe(true)
    expect(getFocusTaskCurriculumScope(reviewTask)).toMatchObject({
      areaId: 'taiwan',
      label: '七上地理複習',
    })
    expect(getFocusTaskCurriculumScope(reviewTask).chapterIds).toEqual([
      'grade7-upper-l01',
      'grade7-upper-l02',
      'grade7-upper-l03',
      'grade7-upper-l04',
      'grade7-upper-l05',
      'grade7-upper-l06',
    ])
    expect(geographyTaskAllowsSelection(reviewTask, 'world', 'grade9-upper-l01')).toBe(false)
  })

  it('第一次段考前的英語每日任務固定為 B3 第 1、2 課', () => {
    const url = appendFocusTaskCurriculumScope(
      new URL('https://shaujiun.github.io/englishvocabking/'),
      { subjectCode: 'english', assignedDate: '2026-09-05' },
    )

    expect(url.searchParams.get('focusBook')).toBe('B3')
    expect(url.searchParams.get('focusLessons')).toBe('L1,L2')
    expect(url.searchParams.get('focusScopeLabel')).toBe('B3 第 1～2 課')
  })

  it('第一次段考後的英語每日任務加入 B3 第 3、4 課', () => {
    expect(getFocusTaskCurriculumScope({
      subjectCode: 'english',
      assignedDate: '2026-09-19',
    }).lessonIds).toEqual(['L1', 'L2', 'L3', 'L4'])
  })
})
