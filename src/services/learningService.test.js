import { describe, expect, it } from 'vitest'
import {
  buildDashboardTaskLists,
  buildTaskLaunchUrl,
  isApprovedActiveAdmin,
  mapLearningTask,
  mapMemorizationTask,
} from './learningService.js'

describe('量測實驗室管理者測試權限', () => {
  it('僅允許已核准且啟用的管理者', () => {
    expect(isApprovedActiveAdmin({ user_type: 'admin', approval_status: 'approved', is_active: true })).toBe(true)
    expect(isApprovedActiveAdmin({ user_type: 'admin', approval_status: 'pending', is_active: true })).toBe(false)
    expect(isApprovedActiveAdmin({ user_type: 'admin', approval_status: 'approved', is_active: false })).toBe(false)
    expect(isApprovedActiveAdmin({ user_type: 'teacher', approval_status: 'approved', is_active: true })).toBe(false)
    expect(isApprovedActiveAdmin({ user_type: 'student', approval_status: 'approved', is_active: true })).toBe(false)
    expect(isApprovedActiveAdmin(null)).toBe(false)
  })
})

const batch = {
  setId: '7a7dfad4-2c64-4b72-b808-4e170cb41793',
  passed: true,
  attemptCount: 4,
  items: Array.from({ length: 5 }, (_, index) => ({ id: `phrase-${index}` })),
}

describe('mapMemorizationTask', () => {
  it('maps a passed memorization batch as a completed weekly task', () => {
    const task = mapMemorizationTask(
      batch,
      '2026-08-20',
      'https://shaujiun.github.io/SLJH-learning-hub/?from=contact-book',
    )

    expect(task.status).toBe('completed')
    expect(task.bestScore).toBe(100)
    expect(task.attemptCount).toBe(4)
    expect(task.launchUrl).toBe('https://shaujiun.github.io/SLJH-learning-hub/?game=schulte-memorization')
  })

  it('keeps an unpassed memorization batch pending in weekly progress', () => {
    const task = mapMemorizationTask(
      { ...batch, passed: false, attemptCount: 2 },
      '2026-08-20',
      'https://shaujiun.github.io/SLJH-learning-hub/',
    )

    expect(task.status).toBe('pending')
    expect(task.attemptCount).toBe(2)
  })

  it('keeps Friday memorization out of daily tasks without hiding existing scheduled tasks', () => {
    const dailyTasks = Array.from({ length: 5 }, (_, index) => ({ id: `daily-${index + 1}` }))
    const weeklyTasks = [{ id: 'weekly-1', status: 'completed' }]
    const memorizationTask = mapMemorizationTask(
      { ...batch, passed: false },
      '2026-08-20',
      'https://shaujiun.github.io/SLJH-learning-hub/',
    )

    const result = buildDashboardTaskLists(dailyTasks, weeklyTasks, memorizationTask)

    expect(result.tasks.map((task) => task.id)).toEqual([
      'daily-1',
      'daily-2',
      'daily-3',
      'daily-4',
      'daily-5',
    ])
    expect(result.tasks).not.toContain(memorizationTask)
    expect(result.weeklyTasks[0]).toBe(memorizationTask)
  })
})

describe('mapLearningTask', () => {
  it('maps a student geography task with its curriculum scope label', () => {
    expect(mapLearningTask({
      id: '66fcaa73-1244-4e15-a577-c30ce3d5d3bb',
      assigned_date: '2026-09-05',
      subject_code: 'geography',
      subject_name: '地理',
      activity_code: 'geography_round',
      activity_name: '地理填圖任選一回合',
      launch_url: 'https://shaujiun.github.io/SLJH-learning-hub/?geography=maps',
      group_code: 'B',
      question_count: 10,
      target_score: 80,
      status: 'pending',
      best_score: null,
      completed_at: null,
      is_weekend_carryover: false,
    })).toMatchObject({
      subjectCode: 'geography',
      curriculumScopeLabel: '八上第 1～2 章',
    })
  })
})

describe('buildTaskLaunchUrl', () => {
  it('第一次段考前替地理每日任務帶入八上第 1、2 章範圍', () => {
    const result = new URL(buildTaskLaunchUrl({
      id: '66fcaa73-1244-4e15-a577-c30ce3d5d3bb',
      assignedDate: '2026-09-05',
      subjectCode: 'geography',
      activityCode: 'geography_round',
      questionCount: 10,
      targetScore: 80,
      launchUrl: 'https://shaujiun.github.io/SLJH-learning-hub/?geography=maps',
    }))

    expect(result.searchParams.get('focusArea')).toBe('china')
    expect(result.searchParams.get('focusChapters')).toBe('grade8-upper-l01,grade8-upper-l02')
  })

  it('第一次段考前替英語每日任務帶入 B3 第 1、2 課範圍', () => {
    const result = new URL(buildTaskLaunchUrl({
      id: '66fcaa73-1244-4e15-a577-c30ce3d5d3bb',
      assignedDate: '2026-09-05',
      subjectCode: 'english',
      activityCode: 'sentence',
      questionCount: 20,
      targetScore: 80,
      launchUrl: 'https://shaujiun.github.io/englishvocabking/',
    }))

    expect(result.searchParams.get('focusBook')).toBe('B3')
    expect(result.searchParams.get('focusLessons')).toBe('L1,L2')
  })
})
