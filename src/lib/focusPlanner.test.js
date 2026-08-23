import { describe, expect, it } from 'vitest'
import {
  buildWeeklyDraft,
  selectWeekendCarryover,
  startOfWeek,
} from './focusPlanner.js'

const subjects = [
  {
    code: 'english',
    name: '英語',
    weeklyMinimum: 3,
    weeklyMaximum: 3,
    activities: [
      { code: 'spelling', name: '字母拼拼樂', targetScore: 80 },
      { code: 'sentence', name: '句子重組', targetScore: 80 },
      { code: 'pronunciation', name: 'AI 口說發音王', targetScore: 70 },
    ],
  },
]

describe('focus planner', () => {
  it('以星期一作為每週起點', () => {
    expect(startOfWeek(new Date('2026-08-13T08:00:00'))).toBe('2026-08-10')
  })

  it('A 組每項 20 題，並保留各活動目標分數', () => {
    const tasks = buildWeeklyDraft({
      studentId: 'student-a',
      weekStart: '2026-08-10',
      subjects,
      groupBySubject: { english: 'A' },
    })

    expect(tasks).toHaveLength(3)
    expect(tasks.every((task) => task.questionCount === 20)).toBe(true)
    expect(tasks.find((task) => task.activityCode === 'pronunciation')?.targetScore).toBe(70)
  })

  it('B 組每項 10 題', () => {
    const tasks = buildWeeklyDraft({
      studentId: 'student-b',
      weekStart: '2026-08-10',
      subjects,
      groupBySubject: { english: 'B' },
    })

    expect(tasks.every((task) => task.questionCount === 10)).toBe(true)
  })

  it('每天不超過 3 項任務', () => {
    const manySubjects = Array.from({ length: 6 }, (_, index) => ({
      code: `subject-${index}`,
      name: `科目 ${index}`,
      weeklyMinimum: 3,
      weeklyMaximum: 3,
      activities: [{ code: 'practice', name: '練習' }],
    }))
    const tasks = buildWeeklyDraft({
      studentId: 'student-c',
      weekStart: '2026-08-10',
      subjects: manySubjects,
    })
    const counts = Object.groupBy(tasks, (task) => task.assignedDate)
    expect(Math.max(...Object.values(counts).map((items) => items.length))).toBeLessThanOrEqual(3)
  })

  it('跨多組隨機安排時以每天 2 項最多、1 項其次、3 項最少', () => {
    const mediumSubjects = Array.from({ length: 4 }, (_, index) => ({
      code: `subject-${index}`,
      name: `科目 ${index}`,
      weeklyMinimum: 2,
      weeklyMaximum: 2,
      activities: [{ code: 'practice', name: '練習' }],
    }))
    const loadFrequency = { 1: 0, 2: 0, 3: 0 }

    for (let index = 0; index < 200; index += 1) {
      const tasks = buildWeeklyDraft({
        studentId: `student-random-${index}`,
        weekStart: '2026-08-10',
        subjects: mediumSubjects,
        seed: `distribution-${index}`,
      })
      const counts = Object.groupBy(tasks, (task) => task.assignedDate)
      Object.values(counts).forEach((items) => {
        loadFrequency[items.length] += 1
      })
    }

    expect(loadFrequency[2]).toBeGreaterThan(loadFrequency[1])
    expect(loadFrequency[1]).toBeGreaterThan(loadFrequency[3])
  })

  it('週末保留所有未完成任務，全部完成時不新增任務', () => {
    const pending = Array.from({ length: 10 }, (_, index) => ({ id: index, status: 'pending' }))
    expect(selectWeekendCarryover(pending, 'weekend-seed')).toHaveLength(10)
    expect(selectWeekendCarryover(
      pending.map((task) => ({ ...task, status: 'completed' })),
      'weekend-seed',
    )).toEqual([])
  })
})
