import { describe, expect, it, vi } from 'vitest'
import {
  createLearningAttemptKey,
  loadAdminLearningProgress,
  recordLearningActivityAttempt,
} from './learningProgressService.js'

describe('learningProgressService', () => {
  it('未登入時不寫入紀錄', async () => {
    const client = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) }, rpc: vi.fn() }
    await expect(recordLearningActivityAttempt({ activityCode: 'test' }, client)).resolves.toBeNull()
    expect(client.rpc).not.toHaveBeenCalled()
  })

  it('正規化資料後呼叫統一紀錄 RPC', async () => {
    const client = {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: { stored: true }, error: null }),
    }
    const result = await recordLearningActivityAttempt({
      subjectCode: 'Science', activityCode: 'Chemical Balance', activityName: '化學反應式平衡',
      modeCode: 'Stage 4', source: 'daily_task', score: 105, correctCount: 4, questionCount: 5,
      attemptKey: 'attempt-1234', metadata: { level: 4 },
    }, client)
    expect(result).toEqual({ stored: true })
    expect(client.rpc).toHaveBeenCalledWith('record_learning_activity_attempt', expect.objectContaining({
      p_subject_code: 'science', p_activity_code: 'chemical_balance', p_mode_code: 'stage_4',
      p_score: 100, p_correct_count: 4, p_question_count: 5, p_attempt_key: 'attempt-1234',
    }))
  })

  it('管理者試玩沒有學生身分時安靜略過', async () => {
    const client = {
      auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'admin' } } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'student_required' } }),
    }
    await expect(recordLearningActivityAttempt({ activityCode: 'test' }, client)).resolves.toBeNull()
  })

  it('產生長度足夠且帶活動代碼的識別碼', () => {
    expect(createLearningAttemptKey('word_grid')).toMatch(/^word_grid:.{8,}$/)
  })

  it('管理者查詢可套用班級、學生與科目篩選', async () => {
    const chain = {
      select: vi.fn(), order: vi.fn(), eq: vi.fn(),
      then(resolve) { resolve({ data: [], error: null }) },
    }
    chain.select.mockReturnValue(chain)
    chain.order.mockReturnValue(chain)
    chain.eq.mockReturnValue(chain)
    const client = { from: vi.fn().mockReturnValue(chain) }
    await loadAdminLearningProgress({ classId: 'c1', studentId: 's1', subjectCode: 'math' }, client)
    expect(chain.eq).toHaveBeenCalledWith('students.class_id', 'c1')
    expect(chain.eq).toHaveBeenCalledWith('student_id', 's1')
    expect(chain.eq).toHaveBeenCalledWith('subject_code', 'math')
  })
})
