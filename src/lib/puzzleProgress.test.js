import { describe, expect, it } from 'vitest'
import { accountPuzzleProgressKey } from './puzzleProgress.js'

describe('益智遊戲個人作答儲存鍵', () => {
  it('同一題在不同帳號使用不同儲存鍵', () => {
    const teacherKey = accountPuzzleProgressKey('word-grid', 'teacher-1', 'puzzle-1')
    const studentKey = accountPuzzleProgressKey('word-grid', 'student-1', 'puzzle-1')
    expect(teacherKey).not.toBe(studentKey)
    expect(teacherKey).toContain('teacher-1')
    expect(studentKey).toContain('student-1')
  })

  it('填字圖與十拿九穩不共用進度', () => {
    expect(accountPuzzleProgressKey('word-grid', 'student-1', 'issue-1'))
      .not.toBe(accountPuzzleProgressKey('number-grid', 'student-1', 'issue-1'))
  })

  it('未登入時不建立可持久化的共用進度', () => {
    expect(accountPuzzleProgressKey('word-grid', '', 'puzzle-1')).toBe('')
  })
})
