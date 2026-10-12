import { describe, expect, it, vi } from 'vitest'
import {
  loadPythagorasChallengeAccess,
  recordPythagorasChallengeAttempt,
} from './pythagorasChallengeService.js'

function queryResult(data) {
  return {
    select() { return this },
    eq() { return this },
    maybeSingle: async () => ({ data, error: null }),
  }
}

describe('畢氏定理挑戰賽分組', () => {
  it('訪客可自行選擇 A／B 組，預設為 B 組', async () => {
    expect(await loadPythagorasChallengeAccess({ guestMode: true })).toEqual({
      role: 'guest', group: 'B', canChooseGroup: true, displayName: '',
    })
  })

  it('學生使用數學科既有分組且不能自行切換', async () => {
    const client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } }, error: null }) },
      from(table) {
        if (table === 'students') return queryResult({ id: 's1', student_id_code: '80601', full_name: '測試學生' })
        return queryResult({ username: 'student', display_name: '測試學生', user_type: 'student' })
      },
      rpc: async (name, params) => {
        expect(name).toBe('resolve_student_learning_group')
        expect(params.p_subject_code).toBe('math')
        return { data: 'A', error: null }
      },
    }
    expect(await loadPythagorasChallengeAccess({}, client)).toEqual({
      role: 'student', group: 'A', canChooseGroup: false, displayName: '測試學生',
      task: null,
    })
  })

  it('每日任務只接受數學科畢氏定理活動', async () => {
    const taskRow = {
      id: 'task-1',
      subject_code_snapshot: 'math',
      activity_code_snapshot: 'pythagoras_challenge',
      activity_name_snapshot: '畢氏定理挑戰賽',
      question_count: 10,
      target_score: 100,
      status: 'pending',
      best_score: null,
    }
    const client = {
      auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } }, error: null }) },
      from(table) {
        if (table === 'students') return queryResult({ id: 's1', student_id_code: '80601', full_name: '測試學生' })
        if (table === 'student_focus_tasks') return queryResult(taskRow)
        return queryResult({ username: 'student', display_name: '測試學生', user_type: 'student' })
      },
      rpc: async () => ({ data: 'B', error: null }),
    }
    const result = await loadPythagorasChallengeAccess({ focusTaskId: 'task-1' }, client)
    expect(result).toMatchObject({
      role: 'student',
      group: 'B',
      task: { id: 'task-1', questionCount: 10, targetScore: 100, status: 'pending' },
    })
  })
})

describe('畢氏定理每日任務成績', () => {
  it('完成挑戰後寫入共用每日任務 RPC', async () => {
    const rpc = vi.fn(async () => ({ data: { passed: true, score: 100 }, error: null }))
    const result = await recordPythagorasChallengeAttempt({
      focusTaskId: 'task-1', score: 100, correctCount: 10, questionCount: 10,
    }, { rpc })
    expect(rpc).toHaveBeenCalledWith('record_focus_task_attempt', {
      p_focus_task_id: 'task-1',
      p_score: 100,
      p_correct_count: 10,
      p_question_count: 10,
    })
    expect(result).toMatchObject({ passed: true, matchedFocusTaskId: 'task-1' })
  })

  it('自由練習沒有任務編號時不寫入資料庫', async () => {
    const rpc = vi.fn()
    await expect(recordPythagorasChallengeAttempt({
      score: 100, correctCount: 10, questionCount: 10,
    }, { rpc })).resolves.toBeNull()
    expect(rpc).not.toHaveBeenCalled()
  })
})
