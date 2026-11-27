import { describe, expect, it } from 'vitest'
import { shouldShowLearningMode } from './LearningProgressPanel.jsx'

describe('個人學習紀錄欄位', () => {
  it('學生不顯示內部模式代碼，管理者仍可用模式欄檢查資料', () => {
    expect(shouldShowLearningMode('student')).toBe(false)
    expect(shouldShowLearningMode('admin')).toBe(true)
  })
})
