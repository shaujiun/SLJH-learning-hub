import { describe, expect, it } from 'vitest'
import { loadYiziContext, mapYiziQuestion, summarizeYiziScores } from './yiziQianjinService.js'

describe('yiziQianjinService', () => {
  it('可轉換遠端題目格式', () => {
    expect(mapYiziQuestion({
      id: 'q1', stable_key: 'stable-1', game_type: 'remove_part', difficulty: 2,
      prompt_data: { parts: ['木', '目', '心', '口'] }, answer_data: { accepted: ['想'] }, status: 'published',
    })).toMatchObject({ id: 'q1', stableKey: 'stable-1', gameType: 'remove_part', difficulty: 2 })
  })

  it('未設定資料庫時仍提供完整本機題庫', async () => {
    const context = await loadYiziContext({ guestMode: true }, null)
    expect(context.questions).toHaveLength(473)
    expect(context.commonIdioms.length).toBe(3306)
    expect(context.remoteEnabled).toBe(false)
    expect(context.scoreByGame).toEqual({})
  })

  it('依遊戲累加登入學生已保存的分數', () => {
    expect(summarizeYiziScores([
      { game_type: 'four_sayings', score: 2 },
      { game_type: 'four_sayings', score: 1 },
      { game_type: 'remove_part', score: 1 },
    ])).toEqual({ four_sayings: 3, remove_part: 1 })
  })
})
