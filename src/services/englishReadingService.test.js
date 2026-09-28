import { describe, expect, it } from 'vitest'
import {
  loadStudentReadingLessons, mapReadingLesson, readingLessonPayload,
} from './englishReadingService.js'

describe('英語閱讀資料與學生權限', () => {
  it('訪客不查詢文章資料表', async () => {
    const client = {
      auth: { getSession: async () => ({ data: { session: null }, error: null }) },
      rpc: () => { throw new Error('訪客不應執行 RPC') },
      from: () => { throw new Error('訪客不應查詢資料表') },
    }
    expect(await loadStudentReadingLessons(client)).toEqual({ access: 'login', lessons: [], group: 'B', viewerRole: '' })
  })

  it('非有效學生即使有登入也不查詢文章', async () => {
    const client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'staff-id' } } }, error: null }) },
      rpc: async () => ({ data: false, error: null }),
      from: () => { throw new Error('非學生不應查詢資料表') },
    }
    expect(await loadStudentReadingLessons(client)).toEqual({ access: 'denied', lessons: [], group: 'B', viewerRole: '' })
  })

  it('管理者可進入學生閱讀版預覽目前開放文章', async () => {
    const calls = []
    const lessonQuery = {
      eq() { return this }, lte() { return this }, gte() { return this },
      order: async () => ({ data: [{ id: 'l1', title: 'Preview', english_text: 'Text' }], error: null }),
    }
    const client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'admin-1' } } }, error: null }) },
      rpc: async (name) => { calls.push(name); return { data: name === 'can_manage_english_reading', error: null } },
      from: (table) => {
        if (table !== 'english_reading_lessons') throw new Error('管理者預覽不應查詢學生資料')
        return { select: () => lessonQuery }
      },
    }
    const result = await loadStudentReadingLessons(client)
    expect(calls).toEqual(['is_active_learning_student', 'can_manage_english_reading'])
    expect(result).toEqual(expect.objectContaining({ access: 'allowed', viewerRole: 'admin', group: 'B' }))
    expect(result.lessons).toHaveLength(1)
  })

  it('將資料庫文章轉成閱讀頁可使用的欄位', () => {
    expect(mapReadingLesson({
      id: 'lesson-1', title: 'Test', english_text: 'English text',
      issue_on: '2026-09-21', core_words: 'serious 嚴重的', status: 'published',
    })).toEqual(expect.objectContaining({
      id: 'lesson-1', title: 'Test', english: 'English text',
      issueDate: '2026-09-21', coreWords: 'serious 嚴重的',
    }))
  })

  it('發布前要求文章、日期及使用依據', () => {
    const draft = { title: 'Test', english: 'English text' }
    expect(() => readingLessonPayload(draft, { status: 'published' })).toThrow('開始與結束日期')
    expect(() => readingLessonPayload(draft, {
      status: 'published', availableFrom: '2026-09-21', availableUntil: '2026-09-22',
    })).toThrow('教學使用依據')
    expect(readingLessonPayload(draft, {
      status: 'published', availableFrom: '2026-09-21', availableUntil: '2026-09-22', usageNote: '課程使用範圍已確認',
    })).toEqual(expect.objectContaining({ status: 'published', usage_note: '課程使用範圍已確認' }))
  })

  it('英語分組查詢失敗不可默默當成 B 組', async () => {
    const client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } }, error: null }) },
      rpc: async (name) => name === 'is_active_learning_student'
        ? { data: true, error: null }
        : { data: null, error: { message: 'group service unavailable' } },
      from: (table) => ({ select: () => ({ eq: () => table === 'students'
        ? { eq: () => ({ maybeSingle: async () => ({ data: { id: 's1' }, error: null }) }) }
        : { lte: () => ({ gte: () => ({ order: async () => ({ data: [], error: null }) }) }) } }) }),
    }
    await expect(loadStudentReadingLessons(client)).rejects.toThrow('無法確認英語分組')
  })
})
