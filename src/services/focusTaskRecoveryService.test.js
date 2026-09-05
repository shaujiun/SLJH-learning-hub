import { describe, expect, it, vi } from 'vitest'
import { findPendingFocusTaskId, findPendingFocusTasks } from './focusTaskRecoveryService.js'

function createClient(result) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(async () => result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return {
    from: vi.fn(() => query),
    query,
  }
}

describe('findPendingFocusTaskId', () => {
  it('依科目與活動代碼找出最早尚未完成的任務', async () => {
    const client = createClient({
      data: [{ id: 'task-science-1', assigned_date: '2026-08-21' }],
      error: null,
    })

    const taskId = await findPendingFocusTaskId({
      subjectCode: 'SCIENCE',
      activityCode: 'PERIODIC_INTRO_MIXED',
      referenceDate: new Date(2026, 7, 23, 12),
    }, client)

    expect(taskId).toBe('task-science-1')
    expect(client.from).toHaveBeenCalledWith('student_focus_tasks')
    expect(client.query.eq).toHaveBeenCalledWith('status', 'pending')
    expect(client.query.eq).toHaveBeenCalledWith('subject_code_snapshot', 'science')
    expect(client.query.eq).toHaveBeenCalledWith('activity_code_snapshot', 'periodic_intro_mixed')
    expect(client.query.lte).toHaveBeenCalledWith('assigned_date', '2026-08-23')
    expect(client.query.order).toHaveBeenCalledWith('assigned_date', { ascending: true })
  })

  it('可取得所有待完成任務，供遊戲依課程範圍挑選可補登項目', async () => {
    const client = createClient({
      data: [
        { id: 'task-1', assigned_date: '2026-09-01' },
        { id: 'task-2', assigned_date: '2026-09-03' },
      ],
      error: null,
    })

    await expect(findPendingFocusTasks({
      subjectCode: 'geography',
      activityCode: 'geography_round',
    }, client)).resolves.toEqual([
      { id: 'task-1', assignedDate: '2026-09-01' },
      { id: 'task-2', assignedDate: '2026-09-03' },
    ])
  })

  it('沒有相符任務時回傳空字串', async () => {
    const client = createClient({ data: [], error: null })
    await expect(findPendingFocusTaskId({
      subjectCode: 'focus_training',
      activityCode: 'schulte_static_4',
    }, client)).resolves.toBe('')
  })

  it('查詢失敗時提供可理解的錯誤訊息', async () => {
    const client = createClient({ data: null, error: { message: 'network error' } })
    await expect(findPendingFocusTaskId({
      subjectCode: 'science',
      activityCode: 'periodic_intro_mixed',
    }, client)).rejects.toThrow('無法確認待完成任務')
  })
})
