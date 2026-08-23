import { describe, expect, it, vi } from 'vitest'
import {
  recordPeriodicTableAttempt,
  setStudentScienceLevel,
} from './periodicTableService.js'

function createTaskAwareClient({ taskRows = [], rpcResult }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(async () => ({ data: taskRows, error: null })),
  }
  return {
    from: vi.fn(() => query),
    rpc: vi.fn(async () => ({ data: rpcResult, error: null })),
  }
}

describe('recordPeriodicTableAttempt', () => {
  it('將每日任務成績限制在 0～100 後送至共用 RPC', async () => {
    const rpc = vi.fn(async () => ({
      data: { passed: true, learningLevel: 'advanced' },
      error: null,
    }))

    const result = await recordPeriodicTableAttempt({
      focusTaskId: 'task-1',
      score: 104.6,
      correctCount: 10,
      questionCount: 10,
    }, { rpc })

    expect(rpc).toHaveBeenCalledWith('record_focus_task_attempt', {
      p_focus_task_id: 'task-1',
      p_score: 100,
      p_correct_count: 10,
      p_question_count: 10,
    })
    expect(result.learningLevel).toBe('advanced')
  })

  it('學生的新入門自由練習會寫入逐族進度', async () => {
    const client = createTaskAwareClient({
      rpcResult: { learningLevel: 'intro', introGroup: 2 },
    })
    await recordPeriodicTableAttempt({
      focusTaskId: '',
      level: 'intro',
      mode: 'mixed',
      introGroup: 1,
      trackStudentProgress: true,
      score: 100,
      correctCount: 7,
      questionCount: 7,
    }, client)
    expect(client.rpc).toHaveBeenCalledWith('record_periodic_intro_attempt', {
      p_score: 100,
      p_intro_group: 1,
      p_correct_count: 7,
      p_question_count: 7,
    })
  })

  it('網址任務識別碼遺失時，自動找回完全相符的自然科待完成任務', async () => {
    const client = createTaskAwareClient({
      taskRows: [{ id: 'recovered-task-1', assigned_date: '2026-08-22' }],
      rpcResult: { passed: true, score: 90 },
    })

    const result = await recordPeriodicTableAttempt({
      focusTaskId: '',
      level: 'intro',
      mode: 'mixed',
      introGroup: 1,
      trackStudentProgress: true,
      score: 90,
      correctCount: 9,
      questionCount: 10,
    }, client)

    expect(client.rpc).toHaveBeenCalledWith('record_focus_task_attempt', {
      p_focus_task_id: 'recovered-task-1',
      p_score: 90,
      p_correct_count: 9,
      p_question_count: 10,
    })
    expect(result).toMatchObject({
      passed: true,
      matchedFocusTaskId: 'recovered-task-1',
      recoveredFocusTask: true,
    })
  })

  it('教師自由練習沒有每日任務編號時不寫入進度', async () => {
    const rpc = vi.fn()
    await expect(recordPeriodicTableAttempt({
      focusTaskId: '',
      level: 'intro',
      score: 100,
      correctCount: 20,
      questionCount: 20,
    }, { rpc })).resolves.toBeNull()
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('setStudentScienceLevel', () => {
  it('管理者調整自然科等級時使用固定的 science 科目代碼', async () => {
    const rpc = vi.fn(async () => ({ data: { learningLevel: 'advanced' }, error: null }))

    await setStudentScienceLevel({ studentId: 'student-1', level: 'advanced' }, { rpc })

    expect(rpc).toHaveBeenCalledWith('admin_set_student_learning_level', {
      p_student_id: 'student-1',
      p_subject_code: 'science',
      p_level_code: 'advanced',
    })
  })

  it('不允許把完整模式設為每日任務等級', async () => {
    const rpc = vi.fn()
    await expect(setStudentScienceLevel({
      studentId: 'student-1',
      level: 'complete',
    }, { rpc })).rejects.toThrow('完整模式不可設為每日任務等級')
    expect(rpc).not.toHaveBeenCalled()
  })
})
