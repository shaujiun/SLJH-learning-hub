import { describe, expect, it } from 'vitest'
import {
  getLearningAudienceLabel,
  isLearningSystemVisible,
  normalizeLearningAudience,
} from './learningAudiences.js'

describe('learning audiences', () => {
  it('未知或舊資料預設為共同對象', () => {
    expect(normalizeLearningAudience()).toBe('common')
    expect(normalizeLearningAudience('legacy')).toBe('common')
    expect(getLearningAudienceLabel('legacy')).toBe('共同（所有學生）')
  })

  it.each([
    ['common', { math: 'B', english: 'B' }, true],
    ['math_a', { math: 'A', english: 'B' }, true],
    ['math_b', { math: 'A', english: 'B' }, false],
    ['english_a', { math: 'B', english: 'A' }, true],
    ['english_b', { math: 'B', english: 'A' }, false],
  ])('依 %s 與學生分組決定是否顯示', (audienceScope, groups, expected) => {
    expect(isLearningSystemVisible({ audienceScope }, groups)).toBe(expected)
  })
})
