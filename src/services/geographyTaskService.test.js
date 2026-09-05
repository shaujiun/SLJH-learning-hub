import { describe, expect, it, vi } from 'vitest'
import { loadGeographyContext, recordGeographyAttempt } from './geographyTaskService.js'

function queryResult(result) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
  }
  return query
}

describe('geographyTaskService', () => {
  it('學生可讀取自己的地理每日任務與門檻', async () => {
    const studentQuery = queryResult({
      data: { id: 'student-1', student_id_code: '114101', full_name: '測試學生' },
      error: null,
    })
    const taskQuery = queryResult({
      data: {
        id: 'task-1',
        student_id: 'student-1',
        assigned_date: '2026-09-05',
        subject_code_snapshot: 'geography',
        activity_code_snapshot: 'geography_round',
        activity_name_snapshot: '地理填圖任選一回合',
        question_count: 10,
        target_score: 80,
        status: 'pending',
        best_score: null,
      },
      error: null,
    })
    const client = {
      auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'profile-1' } } }, error: null })) },
      from: vi.fn((table) => (table === 'students' ? studentQuery : taskQuery)),
    }

    await expect(loadGeographyContext('task-1', client)).resolves.toMatchObject({
      student: { id: 'student-1' },
      task: { id: 'task-1', assignedDate: '2026-09-05', questionCount: 10, targetScore: 80 },
    })
  })

  it('任課人員自由練習時不會被當成學生任務', async () => {
    const studentQuery = queryResult({ data: null, error: null })
    const client = {
      auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'staff-1' } } }, error: null })) },
      from: vi.fn(() => studentQuery),
    }

    await expect(loadGeographyContext('', client)).resolves.toEqual({
      authenticated: true,
      student: null,
      task: null,
    })
  })

  it('完成一回合後以百分制記錄任務', async () => {
    const client = { rpc: vi.fn(async () => ({ data: { passed: true }, error: null })) }
    const result = await recordGeographyAttempt({
      focusTaskId: 'task-1',
      score: 83.6,
      correctCount: 5,
      questionCount: 6,
    }, client)

    expect(client.rpc).toHaveBeenCalledWith('record_focus_task_attempt', {
      p_focus_task_id: 'task-1',
      p_score: 84,
      p_correct_count: 5,
      p_question_count: 6,
    })
    expect(result.passed).toBe(true)
  })

  it('未確認為學生時不會自動搜尋其他人的待完成任務', async () => {
    const client = { rpc: vi.fn() }
    await expect(recordGeographyAttempt({
      allowRecovery: false,
      score: 100,
      correctCount: 10,
      questionCount: 10,
    }, client)).resolves.toBeNull()
    expect(client.rpc).not.toHaveBeenCalled()
  })

  it('自由練習只補登與年級及章節範圍相符的地理任務', async () => {
    const pendingResult = {
      data: [
        { id: '66fcaa73-1244-4e15-a577-c30ce3d5d301', assigned_date: '2026-09-04' },
        { id: '66fcaa73-1244-4e15-a577-c30ce3d5d300', assigned_date: '2026-09-05' },
      ],
      error: null,
    }
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      lte: vi.fn(() => query),
      order: vi.fn(() => query),
      then: (resolve, reject) => Promise.resolve(pendingResult).then(resolve, reject),
    }
    const client = {
      from: vi.fn(() => query),
      rpc: vi.fn(async () => ({ data: { passed: true }, error: null })),
    }

    const result = await recordGeographyAttempt({
      allowRecovery: true,
      areaId: 'taiwan',
      chapterId: 'grade7-upper-l03',
      score: 90,
      correctCount: 9,
      questionCount: 10,
    }, client)

    expect(client.rpc).toHaveBeenCalledWith('record_focus_task_attempt', expect.objectContaining({
      p_focus_task_id: '66fcaa73-1244-4e15-a577-c30ce3d5d300',
    }))
    expect(result.recoveredFocusTask).toBe(true)
  })
})
