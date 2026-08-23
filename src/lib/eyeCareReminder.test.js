import { describe, expect, it } from 'vitest'
import { getEyeCareReminder } from './eyeCareReminder.js'

function pendingTasks(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `pending-${index + 1}`,
    assignedDate: '2026-08-23',
    status: 'pending',
    subjectCode: 'science',
    subjectName: '自然',
  }))
}

describe('getEyeCareReminder', () => {
  it('剩餘至少五項且最近一小時內完成任務時提醒', () => {
    const reminder = getEyeCareReminder([
      ...pendingTasks(5),
      {
        id: 'completed-1',
        assignedDate: '2026-08-23',
        status: 'completed',
        completedAt: '2026-08-23T11:30:00+08:00',
      },
    ], new Date('2026-08-23T12:00:00+08:00'))

    expect(reminder).toMatchObject({ pendingCount: 5, remainingMinutes: 30 })
  })

  it('未滿五項或完成時間已超過一小時不提醒', () => {
    const recent = {
      id: 'completed-1',
      assignedDate: '2026-08-23',
      status: 'completed',
      completedAt: '2026-08-23T11:30:00+08:00',
    }
    expect(getEyeCareReminder([...pendingTasks(4), recent], new Date('2026-08-23T12:00:00+08:00'))).toBeNull()
    expect(getEyeCareReminder([...pendingTasks(5), recent], new Date('2026-08-23T12:31:00+08:00'))).toBeNull()
  })

  it('午夜後不沿用前一天的提醒', () => {
    const reminder = getEyeCareReminder([
      ...pendingTasks(5).map((task) => ({ ...task, assignedDate: '2026-08-24' })),
      {
        id: 'completed-1',
        assignedDate: '2026-08-23',
        status: 'completed',
        completedAt: '2026-08-23T23:45:00+08:00',
      },
    ], new Date('2026-08-24T00:15:00+08:00'))

    expect(reminder).toBeNull()
  })
})
