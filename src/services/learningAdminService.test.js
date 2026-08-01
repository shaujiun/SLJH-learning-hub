import { describe, expect, it, vi } from 'vitest'
import {
  normalizeLearningSystemInput,
  reorderLearningSystems,
} from './learningAdminService.js'

describe('normalizeLearningSystemInput', () => {
  it('整理並驗證可儲存的科目連結', () => {
    const result = normalizeLearningSystemInput({
      subjectCode: ' Math_Game ',
      subjectName: '數學遊戲',
      description: '依分組提供數學練習。',
      launchUrl: 'https://example.com/math',
      displayOrder: '20',
      weeklyMinimum: '1',
      weeklyMaximum: '3',
      isActive: true,
    })

    expect(result).toMatchObject({
      subject_code: 'math_game',
      subject_name: '數學遊戲',
      launch_url: 'https://example.com/math',
      display_order: 20,
      weekly_minimum: 1,
      weekly_maximum: 3,
      is_active: true,
    })
  })

  it.each([
    [{ subjectCode: '數學' }, '科目代碼'],
    [{ launchUrl: 'javascript:alert(1)' }, 'HTTP'],
    [{ weeklyMinimum: 3, weeklyMaximum: 1 }, '最多次數'],
  ])('拒絕不合法的設定', (override, expectedMessage) => {
    const input = {
      subjectCode: 'math',
      subjectName: '數學',
      description: '',
      launchUrl: 'https://example.com/math',
      displayOrder: 10,
      weeklyMinimum: 1,
      weeklyMaximum: 3,
      ...override,
    }
    expect(() => normalizeLearningSystemInput(input)).toThrow(expectedMessage)
  })
})

describe('reorderLearningSystems', () => {
  it('依目前畫面順序寫入 10、20、30', async () => {
    const updates = []
    const client = {
      from: vi.fn(() => ({
        update: vi.fn((payload) => ({
          eq: vi.fn(async (_field, id) => {
            updates.push({ id, order: payload.display_order })
            return { error: null }
          }),
        })),
      })),
    }

    await reorderLearningSystems(['a', 'b', 'c'], client)
    expect(updates).toEqual([
      { id: 'a', order: 10 },
      { id: 'b', order: 20 },
      { id: 'c', order: 30 },
    ])
  })
})
