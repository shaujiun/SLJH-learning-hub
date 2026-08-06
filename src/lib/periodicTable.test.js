import { describe, expect, it } from 'vitest'
import {
  applyPeriodicProgress,
  canCountPeriodicProgress,
  createPeriodicQuestions,
  getElementsForLevel,
  parsePeriodicActivityCode,
  periodicElements,
  periodicLevels,
  resolvePeriodicGameSelection,
  resolvePeriodicTaskLevel,
} from './periodicTable.js'

describe('元素週期表題庫', () => {
  it('保存 118 種不重複元素及正確的基本位置', () => {
    expect(periodicElements).toHaveLength(118)
    expect(new Set(periodicElements.map((element) => element.number)).size).toBe(118)
    expect(new Set(periodicElements.map((element) => element.symbol)).size).toBe(118)
    expect(periodicElements.find((element) => element.number === 1)).toMatchObject({
      symbol: 'H', name: '氫', period: 1, group: 1,
    })
    expect(periodicElements.find((element) => element.number === 113)).toMatchObject({
      symbol: 'Nh', name: '鉨', period: 7, group: 13,
    })
  })

  it('依指定原子序建立四個難度', () => {
    expect(periodicLevels.beginner.numbers).toEqual(Array.from({ length: 18 }, (_, index) => index + 1))
    expect(periodicLevels.advanced.numbers).toHaveLength(44)
    expect(periodicLevels.advanced.numbers).toEqual(expect.arrayContaining([31, 36, 49, 54, 81, 86, 87, 88]))
    expect(periodicLevels.advanced.numbers).not.toContain(21)
    expect(periodicLevels.challenge.numbers).toHaveLength(59)
    expect(periodicLevels.challenge.numbers).toEqual(expect.arrayContaining([
      22, 24, 25, 26, 27, 28, 29, 30, 47, 74, 78, 79, 80, 92, 113,
    ]))
    expect(periodicLevels.complete.numbers).toHaveLength(118)
  })

  it('入門出 10 題，其餘難度預設出 20 題', () => {
    expect(createPeriodicQuestions({ level: 'beginner', random: () => 0.4 })).toHaveLength(10)
    expect(createPeriodicQuestions({ level: 'advanced', random: () => 0.4 })).toHaveLength(20)
    expect(createPeriodicQuestions({ level: 'challenge', random: () => 0.4 })).toHaveLength(20)
    expect(createPeriodicQuestions({ level: 'complete', random: () => 0.4 })).toHaveLength(20)
  })

  it('選擇題固定提供四個不重複選項', () => {
    const [question] = createPeriodicQuestions({
      level: 'beginner', mode: 'name_symbol', count: 1, random: () => 0.25,
    })
    expect(question.choices).toHaveLength(4)
    expect(new Set(question.choices.map((choice) => choice.value)).size).toBe(4)
    expect(question.choices.map((choice) => choice.value)).toContain(question.answer)
  })

  it('錯題重練只從指定元素出題', () => {
    const questions = createPeriodicQuestions({
      level: 'advanced', mode: 'mixed', count: 10, onlyNumbers: [1, 8, 17], random: () => 0.5,
    })
    expect(questions).toHaveLength(3)
    expect(questions.every((question) => [1, 8, 17].includes(question.element.number))).toBe(true)
  })

  it('活動代碼可還原每日任務的難度與題型', () => {
    expect(parsePeriodicActivityCode('periodic_advanced_locate')).toEqual({ level: 'advanced', mode: 'locate' })
    expect(parsePeriodicActivityCode('pronunciation')).toBeNull()
  })
})

describe('自然科個人進階規則', () => {
  it('入門連續 3 次達 80 分後升為進階', () => {
    expect(applyPeriodicProgress({ level: 'beginner', consecutivePasses: 1, score: 80 })).toEqual({
      level: 'beginner', consecutivePasses: 2, leveledUp: false,
    })
    expect(applyPeriodicProgress({ level: 'beginner', consecutivePasses: 2, score: 80 })).toEqual({
      level: 'advanced', consecutivePasses: 0, leveledUp: true,
    })
  })

  it('進階連續 5 次達 80 分後升為挑戰', () => {
    expect(applyPeriodicProgress({ level: 'advanced', consecutivePasses: 3, score: 95 })).toEqual({
      level: 'advanced', consecutivePasses: 4, leveledUp: false,
    })
    expect(applyPeriodicProgress({ level: 'advanced', consecutivePasses: 4, score: 80 })).toEqual({
      level: 'challenge', consecutivePasses: 0, leveledUp: true,
    })
  })

  it('未達 80 分時歸零，挑戰不會自動進入完整模式', () => {
    expect(applyPeriodicProgress({ level: 'advanced', consecutivePasses: 4, score: 79 })).toEqual({
      level: 'advanced', consecutivePasses: 0, leveledUp: false,
    })
    expect(applyPeriodicProgress({ level: 'challenge', consecutivePasses: 8, score: 100 })).toEqual({
      level: 'challenge', consecutivePasses: 0, leveledUp: false,
    })
  })

  it('只提供前 5 個入門任務，第 6 個任務強制改為進階', () => {
    expect(resolvePeriodicTaskLevel({ level: 'beginner', beginnerTasksAssigned: 4 })).toBe('beginner')
    expect(resolvePeriodicTaskLevel({ level: 'beginner', beginnerTasksAssigned: 5 })).toBe('advanced')
    expect(resolvePeriodicTaskLevel({ level: 'advanced', beginnerTasksAssigned: 2 })).toBe('advanced')
  })

  it('完整模式不能成為每日任務等級', () => {
    expect(resolvePeriodicTaskLevel({ level: 'complete', beginnerTasksAssigned: 0 })).toBe('challenge')
  })

  it('每日任務指定的進階難度優先於網址或自由練習選項', () => {
    expect(resolvePeriodicGameSelection({
      task: { level: 'advanced', mode: 'locate' },
      requestedLevel: 'beginner',
      requestedMode: 'name_symbol',
    })).toEqual({ level: 'advanced', mode: 'locate' })
  })

  it('升級後的舊入門任務不計入進階連續達標紀錄', () => {
    expect(canCountPeriodicProgress({ taskLevel: 'beginner', currentLevel: 'advanced' })).toBe(false)
    expect(canCountPeriodicProgress({ taskLevel: 'advanced', currentLevel: 'advanced' })).toBe(true)
  })

  it('各難度只取指定元素', () => {
    expect(getElementsForLevel('beginner').at(-1).number).toBe(18)
    expect(getElementsForLevel('complete')).toHaveLength(118)
  })
})
