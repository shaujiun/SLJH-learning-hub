import { requireSupabase } from '../lib/supabase.js'

const errorMessages = {
  approved_profile_required: '目前登入帳號尚未核准，無法進入對戰。',
  battle_room_not_found: '找不到這個房間，請確認 4 位數房間代碼。',
  battle_room_full: '這個房間已滿，請建立或加入其他房間。',
  battle_already_started: '這個房間已經開始對戰。',
  battle_host_required: '只有房主可以執行這項操作。',
  battle_players_incomplete: '人數尚未到齊，可等待同學加入或請 AI 補位。',
  no_ai_seat_available: '目前沒有可由 AI 補上的空位；離線座位會保留 30 秒。',
  player_not_buzzer_eligible: '這一題尚未輪到你搶答。',
  buzzer_closed: '搶答時間尚未開始，或已經有人先搶到。',
  not_active_answerer: '目前不是你的作答回合。',
}

function battleError(error, fallback) {
  const key = Object.keys(errorMessages).find((item) => error?.message?.includes(item))
  return new Error(key ? errorMessages[key] : `${fallback}：${error?.message || '未知錯誤'}`)
}

async function rpc(name, parameters, fallback, client = requireSupabase()) {
  const { data, error } = await client.rpc(name, parameters)
  if (error) throw battleError(error, fallback)
  return data
}

export function createPeriodicBattle({ playerLimit, level, mode, questionCount, questions }, client) {
  return rpc('periodic_battle_create', {
    p_player_limit: Number(playerLimit),
    p_level_code: level,
    p_mode_code: mode,
    p_question_count: Number(questionCount),
    p_questions: questions,
  }, '無法建立對戰房間', client)
}

export function joinPeriodicBattle(roomCode, client) {
  return rpc('periodic_battle_join', { p_room_code: String(roomCode).trim() }, '無法加入對戰房間', client)
}

export function loadPeriodicBattle(roomId, client) {
  return rpc('periodic_battle_snapshot', { p_room_id: roomId }, '無法讀取對戰房間', client)
}

export function heartbeatPeriodicBattle(roomId, client) {
  return rpc('periodic_battle_heartbeat', { p_room_id: roomId }, '無法更新連線狀態', client)
}

export function fillPeriodicBattleAi(roomId, client) {
  return rpc('periodic_battle_fill_ai', { p_room_id: roomId }, '無法加入 AI', client)
}

export function startPeriodicBattle(roomId, client) {
  return rpc('periodic_battle_start', { p_room_id: roomId }, '無法開始對戰', client)
}

export function advancePeriodicBattle(roomId, client) {
  return rpc('periodic_battle_advance', { p_room_id: roomId }, '無法推進對戰', client)
}

export function buzzPeriodicBattle(roomId, client) {
  return rpc('periodic_battle_buzz', { p_room_id: roomId }, '無法搶答', client)
}

export function answerPeriodicBattle(roomId, answer, client) {
  return rpc('periodic_battle_answer', { p_room_id: roomId, p_answer: String(answer) }, '無法送出答案', client)
}

export function subscribePeriodicBattle(roomId, onChange, client = requireSupabase()) {
  const channel = client
    .channel(`periodic-battle-${roomId}`)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'periodic_battle_rooms', filter: `id=eq.${roomId}`,
    }, onChange)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'periodic_battle_players', filter: `room_id=eq.${roomId}`,
    }, onChange)
    .subscribe()
  return () => client.removeChannel(channel)
}

