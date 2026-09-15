import { requireSupabase } from '../lib/supabase.js'

const errorMessages = {
  approved_profile_required: '目前登入帳號尚未核准，無法進入對戰。',
  animal_nickname_invalid: '請輸入 1 至 10 個字的玩家名稱。',
  animal_room_not_found: '找不到這個房間，請確認 4 位數房間代碼。',
  animal_room_full: '這個房間已有 4 位玩家。',
  animal_room_started: '這個房間已經開始遊戲。',
  animal_host_required: '只有房主可以開始遊戲。',
  animal_players_incomplete: '必須等本房設定的真人玩家到齊後才能開始。',
  animal_human_count_invalid: '真人玩家人數必須設定為 1 至 4 人。',
  animal_human_slots_full: '這個房間的真人座位已滿。',
  animal_game_settings_invalid: '請選擇基礎或進階玩法，以及 40～60 分的通關分數。',
  animal_advanced_mode_required: '這局是基礎玩法，不能出 3～6 張方程式。',
  animal_equation_requires_three_to_six: '進階方程式必須使用 3～6 張根式牌。',
  animal_room_access_denied: '目前帳號無法讀取這個房間。',
  animal_not_your_turn: '目前還沒有輪到你出牌。',
  animal_turn_expired: '這個出牌回合已結束，正在切換下一位玩家。',
  animal_card_not_in_hand: '出牌內容與目前手牌不符，請重新整理後再送出。',
  animal_card_reused: '同一張牌不能重複使用。',
  animal_selected_cards_once: '每張選取的牌都必須在等式中使用一次。',
  animal_variable_positive_integer_required: '每張 n 牌都必須分別輸入 1～9。',
  animal_expression_incomplete: '等式尚未排列完整。',
  animal_expression_operator_invalid: '等式中含有無法判讀的運算符號。',
  animal_expression_division_by_zero: '算式不能除以 0。',
  animal_review_closed: '抓錯時間已結束。',
  animal_challenge_not_allowed: '出牌者不能抓自己的錯誤。',
  animal_function_reactive_only: '澄清與性別錯誤只能在被指定時作為防禦牌。',
  animal_target_invalid: '找不到指定的動物牌，請重新整理後再試。',
  animal_tame_target_invalid: '馴化只能選擇中央尚未翻開的動物牌。',
  animal_opponent_target_required: '指控與誘惑必須選擇其他玩家已取得的動物牌。',
  animal_function_reaction_closed: '功能牌的防禦時間已結束。',
  animal_function_target_only: '只有被指定的玩家可以決定是否使用防禦牌。',
  animal_defense_card_invalid: '所選牌無法防禦這次功能牌。',
  animal_function_action_invalid: '這次功能牌行動無法判讀，請重新整理後再試。',
}

function roomError(error, fallback) {
  const key = Object.keys(errorMessages).find((item) => error?.message?.includes(item))
  return new Error(key ? errorMessages[key] : `${fallback}：${error?.message || '未知錯誤'}`)
}

async function rpc(name, parameters, fallback, client = requireSupabase()) {
  const { data, error } = await client.rpc(name, parameters)
  if (error) throw roomError(error, fallback)
  return data
}

export function createAnimalEquationRoom(displayName, humanPlayerLimit = 4, client) {
  if (typeof humanPlayerLimit === 'object') {
    client = humanPlayerLimit
    humanPlayerLimit = 4
  }
  return rpc('animal_equation_create_with_mode', {
    p_display_name: String(displayName).trim(),
    p_human_player_limit: Number(humanPlayerLimit),
  }, '無法建立根式馬戲團房間', client)
}

export function joinAnimalEquationRoom(roomCode, displayName, client) {
  return rpc('animal_equation_join', {
    p_room_code: String(roomCode).trim(),
    p_display_name: String(displayName).trim(),
  }, '無法加入根式馬戲團房間', client)
}

export function loadAnimalEquationRoom(roomId, client) {
  return rpc('animal_equation_snapshot_with_ai', { p_room_id: roomId }, '無法讀取根式馬戲團房間', client)
}

export function startAnimalEquationRoom(roomId, gameMode = 'basic', targetScore = 60, client) {
  if (typeof gameMode === 'object') {
    client = gameMode
    gameMode = 'basic'
    targetScore = 60
  }
  return rpc('animal_equation_start_game', {
    p_room_id: roomId,
    p_game_mode: gameMode,
    p_target_score: targetScore,
  }, '無法開始根式馬戲團', client)
}

export function leaveAnimalEquationRoom(roomId, client) {
  return rpc('animal_equation_leave', { p_room_id: roomId }, '無法離開根式馬戲團房間', client)
}

export function heartbeatAnimalEquationRoom(roomId, client) {
  return rpc('animal_equation_heartbeat', { p_room_id: roomId }, '無法更新房間連線狀態', client)
}

export function submitAnimalEquationRadical({
  roomId, mode, selectedCardIds, left = null, right = null, variableValues = {},
}, client) {
  return rpc('animal_equation_submit_radical', {
    p_room_id: roomId,
    p_play_mode: mode,
    p_selected_card_ids: selectedCardIds,
    p_left_expression: left,
    p_right_expression: right,
    p_variable_values: variableValues,
  }, '無法送出根式牌', client)
}

export function challengeAnimalEquation(roomId, client) {
  return rpc('animal_equation_challenge', { p_room_id: roomId }, '無法送出抓錯', client)
}

export function advanceAnimalEquation(roomId, client) {
  return rpc('animal_equation_advance_with_ai', { p_room_id: roomId }, '無法切換遊戲回合', client)
}

export function runAnimalEquationAiTurn(roomId, client) {
  return rpc('animal_equation_run_ai_turn', { p_room_id: roomId }, 'AI 無法完成本回合', client)
}

export function submitAnimalEquationFunction({ roomId, functionCardId, targetAnimalId }, client) {
  return rpc('animal_equation_submit_function', {
    p_room_id: roomId,
    p_function_card_id: functionCardId,
    p_target_animal_id: targetAnimalId,
  }, '無法使用功能牌', client)
}

export function respondAnimalEquationFunction(roomId, defenseCardId = null, client) {
  return rpc('animal_equation_respond_function', {
    p_room_id: roomId,
    p_defense_card_id: defenseCardId,
  }, '無法送出功能牌防禦', client)
}

export function subscribeAnimalEquationRoom(roomId, onChange, client = requireSupabase()) {
  const channel = client
    .channel(`animal-equation-${roomId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'animal_equation_rooms', filter: `id=eq.${roomId}`,
    }, onChange)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'animal_equation_players', filter: `room_id=eq.${roomId}`,
    }, onChange)
    .subscribe()
  return () => client.removeChannel(channel)
}
