import { describe, expect, it } from 'vitest'
import { buildDashboardTaskLists, mapMemorizationTask } from './learningService.js'

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
