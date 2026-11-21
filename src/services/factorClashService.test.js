import { describe, expect, it, vi } from 'vitest'
import { MAX_FACTOR_CLASH_AWAY_SECONDS } from '../lib/factorClashAwayTime.js'
import { loadFactorClashAccess, recordFactorClashRound } from './factorClashService.js'

function singleRowQuery(data, error = null) {
  return {
    select() { return this },
    eq() { return this },
    maybeSingle: async () => ({ data, error }),
  }
}

function accessClient({ role = 'student', student = null, group = 'B' } = {}) {
  const rpc = vi.fn(async (name, params) => {
    expect(name).toBe('resolve_student_learning_group')
    expect(params).toMatchObject({ p_student_id: student?.id, p_subject_code: 'math' })
    return { data: group, error: null }
  })
  return {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { user: { id: 'profile-1' } } }, error: null,
      })),
    },
    from: vi.fn((table) => {
      if (table === 'contact_book_profiles') {
        return singleRowQuery({ username: 'viewer', display_name: '測試者', user_type: role })
      }
      if (table === 'students') return singleRowQuery(student)
      throw new Error(`未預期查詢資料表：${table}`)
    }),
    rpc,
  }
}

describe('因式交鋒角色與分組存取', () => {
  it('訪客預設進入 B 組基礎題，並可自行選擇難度', async () => {
    await expect(loadFactorClashAccess({ guestMode: true })).resolves.toEqual({
      role: 'guest', group: 'B', difficulty: 'basic', canChooseDifficulty: true, task: null,
    })
  })

  it.each([
    ['A', 'advanced'],
    ['B', 'basic'],
  ])('學生依數學 %s 組直接進入對應難度', async (group, difficulty) => {
    const client = accessClient({
      role: 'student',
      student: { id: 'student-1', student_id_code: '80601', full_name: '學生甲' },
      group,
    })
    await expect(loadFactorClashAccess({}, client)).resolves.toMatchObject({
      role: 'student', studentId: 'student-1', group, difficulty,
      canChooseDifficulty: false, displayName: '學生甲', task: null,
    })
    expect(client.rpc).toHaveBeenCalledTimes(1)
  })

  it.each(['teacher', 'admin'])('%s 沒有學生資料時只可試玩，不綁定學生', async (role) => {
    const client = accessClient({ role, student: null })
    await expect(loadFactorClashAccess({}, client)).resolves.toEqual({
      role, group: 'B', difficulty: 'basic', canChooseDifficulty: true, task: null,
    })
    expect(client.rpc).not.toHaveBeenCalled()
  })
})

describe('因式交鋒練習紀錄', () => {
  it('非學生試玩不寫入學生練習紀錄', async () => {
    const client = { from: vi.fn(), rpc: vi.fn() }
    await expect(recordFactorClashRound({
      access: { role: 'admin' }, mode: 'area', difficulty: 'basic', questionCount: 5,
      points: 15, firstTryCorrect: 5, secondTryCorrect: 0,
    }, client)).resolves.toBeNull()
    expect(client.from).not.toHaveBeenCalled()
    expect(client.rpc).not.toHaveBeenCalled()
  })

  it('異常離頁秒數會限制在合理上限', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const client = { from: vi.fn(() => ({ insert })) }
    const result = await recordFactorClashRound({
      access: { role: 'student', studentId: 'student-1' },
      mode: 'area', difficulty: 'basic', questionCount: 1, points: 0,
      firstTryCorrect: 0, secondTryCorrect: 0, awayCount: 2, awaySeconds: 3_586_331_293,
    }, client)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      away_count: 2,
      away_seconds: MAX_FACTOR_CLASH_AWAY_SECONDS,
    }))
    expect(result).toEqual({ saved: true, taskCompleted: false })
  })
})
