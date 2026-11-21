import { describe, expect, it, vi } from 'vitest'
import { MAX_FACTOR_CLASH_AWAY_SECONDS } from '../lib/factorClashAwayTime.js'
import { recordFactorClashRound } from './factorClashService.js'

describe('因式交鋒練習紀錄', () => {
  it('寫入資料庫前會攔截不合理的離開秒數', async () => {
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
