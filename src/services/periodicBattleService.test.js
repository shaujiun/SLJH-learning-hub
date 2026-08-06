import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  answerPeriodicBattle,
  createPeriodicBattle,
  joinPeriodicBattle,
} from './periodicBattleService.js'

function clientWithRpc(data = { id: 'room-id' }) {
  return { rpc: vi.fn().mockResolvedValue({ data, error: null }) }
}

describe('periodic battle service', () => {
  let client

  beforeEach(() => { client = clientWithRpc() })

  it('creates rooms with typed values and generated questions', async () => {
    const questions = [{ mode: 'locate', prompt: '找出氫', answer: '1', choices: [] }]
    await createPeriodicBattle({ playerLimit: '4', level: 'beginner', mode: 'mixed', questionCount: '20', questions }, client)
    expect(client.rpc).toHaveBeenCalledWith('periodic_battle_create', {
      p_player_limit: 4,
      p_level_code: 'beginner',
      p_mode_code: 'mixed',
      p_question_count: 20,
      p_questions: questions,
    })
  })

  it('keeps leading zeroes in a room code', async () => {
    await joinPeriodicBattle(' 0624 ', client)
    expect(client.rpc).toHaveBeenCalledWith('periodic_battle_join', { p_room_code: '0624' })
  })

  it('sends locate answers as strings', async () => {
    await answerPeriodicBattle('room-id', 18, client)
    expect(client.rpc).toHaveBeenCalledWith('periodic_battle_answer', {
      p_room_id: 'room-id',
      p_answer: '18',
    })
  })

  it('maps database rule errors to a student-facing message', async () => {
    client.rpc.mockResolvedValue({ data: null, error: { message: 'not_active_answerer' } })
    await expect(answerPeriodicBattle('room-id', 'H', client)).rejects.toThrow('目前不是你的作答回合')
  })
})
