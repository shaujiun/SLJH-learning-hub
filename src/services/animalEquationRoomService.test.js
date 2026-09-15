import { describe, expect, it, vi } from 'vitest'
import {
  advanceAnimalEquation,
  challengeAnimalEquation,
  createAnimalEquationRoom,
  joinAnimalEquationRoom,
  leaveAnimalEquationRoom,
  respondAnimalEquationFunction,
  runAnimalEquationAiTurn,
  startAnimalEquationRoom,
  submitAnimalEquationFunction,
  submitAnimalEquationRadical,
} from './animalEquationRoomService.js'

function clientWith(data = { id: 'room-1' }, error = null) {
  return { rpc: vi.fn().mockResolvedValue({ data, error }) }
}

describe('animalEquationRoomService', () => {
  it('建立房間時會修剪玩家名稱', async () => {
    const client = clientWith()
    await createAnimalEquationRoom('  小安  ', client)
    expect(client.rpc).toHaveBeenCalledWith('animal_equation_create_with_mode', {
      p_display_name: '小安', p_human_player_limit: 4,
    })
  })

  it('建立房間時可指定真人玩家人數', async () => {
    const client = clientWith()
    await createAnimalEquationRoom('小安', 2, client)
    expect(client.rpc).toHaveBeenCalledWith('animal_equation_create_with_mode', {
      p_display_name: '小安', p_human_player_limit: 2,
    })
  })

  it('加入房間時會傳送房號與玩家名稱', async () => {
    const client = clientWith()
    await joinAnimalEquationRoom(' 0624 ', ' 小美 ', client)
    expect(client.rpc).toHaveBeenCalledWith('animal_equation_join', {
      p_room_code: '0624', p_display_name: '小美',
    })
  })

  it('房主可要求開始遊戲', async () => {
    const client = clientWith()
    await startAnimalEquationRoom('room-1', 'advanced', 55, client)
    expect(client.rpc).toHaveBeenCalledWith('animal_equation_start_game', {
      p_room_id: 'room-1', p_game_mode: 'advanced', p_target_score: 55,
    })
  })

  it('離開房間以伺服器身分記錄', async () => {
    const client = clientWith({ id: 'room-1', closed: false })
    await leaveAnimalEquationRoom('room-1', client)
    expect(client.rpc).toHaveBeenCalledWith('animal_equation_leave', { p_room_id: 'room-1' })
  })

  it('將資料庫錯誤轉成學生可理解的訊息', async () => {
    const client = clientWith(null, { message: 'animal_room_full' })
    await expect(joinAnimalEquationRoom('0624', '小美', client)).rejects.toThrow('已有 4 位玩家')
  })

  it('根式出牌會傳送所有牌與每張獨立的 n 值', async () => {
    const client = clientWith()
    await submitAnimalEquationRadical({
      roomId: 'room-1', mode: 'equation', selectedCardIds: ['a', 'b'],
      left: { type: 'card', cardId: 'a' }, right: { type: 'card', cardId: 'b' },
      variableValues: { a: 2 },
    }, client)
    expect(client.rpc).toHaveBeenCalledWith('animal_equation_submit_radical', expect.objectContaining({
      p_room_id: 'room-1', p_play_mode: 'equation', p_selected_card_ids: ['a', 'b'],
      p_variable_values: { a: 2 },
    }))
  })

  it('抓錯與回合推進皆由伺服器處理', async () => {
    const client = clientWith()
    await challengeAnimalEquation('room-1', client)
    await advanceAnimalEquation('room-1', client)
    expect(client.rpc).toHaveBeenNthCalledWith(1, 'animal_equation_challenge', { p_room_id: 'room-1' })
    expect(client.rpc).toHaveBeenNthCalledWith(2, 'animal_equation_advance_with_ai', { p_room_id: 'room-1' })
  })

  it('AI 回合由伺服器執行', async () => {
    const client = clientWith()
    await runAnimalEquationAiTurn('room-1', client)
    expect(client.rpc).toHaveBeenCalledWith('animal_equation_run_ai_turn', { p_room_id: 'room-1' })
  })

  it('功能牌會傳送所選手牌與目標動物', async () => {
    const client = clientWith()
    await submitAnimalEquationFunction({
      roomId: 'room-1', functionCardId: 'function-1', targetAnimalId: 'animal-4',
    }, client)
    expect(client.rpc).toHaveBeenCalledWith('animal_equation_submit_function', {
      p_room_id: 'room-1', p_function_card_id: 'function-1', p_target_animal_id: 'animal-4',
    })
  })

  it('被指定者可打出防禦牌或直接放棄防禦', async () => {
    const client = clientWith()
    await respondAnimalEquationFunction('room-1', 'defense-1', client)
    await respondAnimalEquationFunction('room-1', null, client)
    expect(client.rpc).toHaveBeenNthCalledWith(1, 'animal_equation_respond_function', {
      p_room_id: 'room-1', p_defense_card_id: 'defense-1',
    })
    expect(client.rpc).toHaveBeenNthCalledWith(2, 'animal_equation_respond_function', {
      p_room_id: 'room-1', p_defense_card_id: null,
    })
  })
})
