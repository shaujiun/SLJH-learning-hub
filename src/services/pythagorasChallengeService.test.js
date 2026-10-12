import { describe, expect, it } from 'vitest'
import { loadPythagorasChallengeAccess } from './pythagorasChallengeService.js'

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
    })
  })
})
