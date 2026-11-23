import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createYiziFourSayingsRoom, joinYiziFourSayingsRoom, loadYiziContext, mapYiziQuestion, summarizeYiziScores,
} from './yiziQianjinService.js'

const originalWindow = globalThis.window

afterEach(() => { globalThis.window = originalWindow })

function roomClient(result) {
  return { rpc: vi.fn(async () => ({ data: result, error: null })) }
}

function useMemoryStorage() {
  const values = new Map()
  globalThis.window = { localStorage: {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  } }
}

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

  it('建立競賽房間會傳送房主固定的 5／10 題、時間與作答方式', async () => {
    useMemoryStorage()
    const client = roomClient({ roomCode: '123456', seatToken: 'host-token', seatNo: 1 })
    await createYiziFourSayingsRoom({ nickname: '小明', inputMode: 'handwriting', timeLimitSeconds: 60, questionCount: 10 }, client)
    expect(client.rpc).toHaveBeenCalledWith('yizi_four_sayings_create_room', {
      p_nickname: '小明', p_input_mode: 'handwriting', p_time_limit_seconds: 60, p_question_count: 10,
    })
  })

  it('加入競賽房間只需暱稱與 6 位數房號，不能改房主設定', async () => {
    useMemoryStorage()
    const client = roomClient({ roomCode: '654321', seatToken: 'guest-token', seatNo: 2 })
    await joinYiziFourSayingsRoom('65-43-21', '小華', client)
    expect(client.rpc).toHaveBeenCalledWith('yizi_four_sayings_join_room', { p_room_code: '654321', p_nickname: '小華' })
  })
})
