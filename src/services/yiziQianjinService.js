import { requireSupabase } from '../lib/supabase.js'
import { localCommonIdioms, localYiziQuestions, normalizeChineseAnswer, YIZI_SOURCE } from '../lib/yiziQianjin.js'

const roomStorageKey = 'sljh.yizi.idiomRoomSeat.v1'
const errorMessages = {
  student_required: '管理者與訪客的試玩不會寫入學生進度。',
  yizi_nickname_invalid: '暱稱請輸入 1～12 個字。',
  yizi_room_code_unavailable: '目前無法產生房間代碼，請稍後再試。',
  yizi_room_not_found: '找不到這個房間，請確認 6 位數代碼。',
  yizi_room_started: '這個房間已經開始或結束。',
  yizi_room_full: '這個房間已有 2 位玩家。',
  yizi_duplicate_nickname: '同一房間不能使用相同暱稱。',
  yizi_seat_invalid: '找不到這個座位，請重新加入。',
  yizi_host_required: '只有房主可以開始對戰。',
  yizi_players_incomplete: '請等待第 2 位玩家加入。',
  yizi_time_limit_invalid: '請選擇 60、90 或 120 秒。',
  yizi_room_not_playing: '這一局目前不能下棋。',
  yizi_not_your_turn: '目前不是你的回合。',
  yizi_turn_timed_out: '本回合已逾時。',
  yizi_idiom_invalid: '這個詞不在目前的成語判定清單中。',
  yizi_idiom_used: '這句成語本局已經使用過。',
  yizi_move_invalid: '成語必須與盤面文字交會，且不可覆蓋不同文字。',
  yizi_legal_move_exists: '盤面仍有可使用的常見成語。',
}

function isMissingRelation(error) {
  return ['42P01', 'PGRST205', 'PGRST202'].includes(error?.code)
}

function translatedError(error, fallback) {
  const key = Object.keys(errorMessages).find((item) => String(error?.message || '').includes(item))
  return new Error(key ? errorMessages[key] : `${fallback}：${error?.message || '未知錯誤'}`)
}

export function mapYiziQuestion(row) {
  return {
    id: String(row?.id || row?.stable_key || ''),
    stableKey: String(row?.stable_key || row?.id || ''),
    gameType: row?.game_type || '',
    difficulty: Number(row?.difficulty || 1),
    prompt: row?.prompt_data || {},
    answers: row?.answer_data || {},
    status: row?.status || 'draft',
    sourceLabel: row?.source_label || '',
    sourceUrl: row?.source_url || '',
    sourceCommit: row?.source_commit || '',
    updatedAt: row?.updated_at || '',
  }
}

async function accountContext(client) {
  const { data, error } = await client.auth.getSession()
  if (error || !data.session?.user) return { studentId: '', canManage: false }
  const userId = data.session.user.id
  const [studentResult, managerResult] = await Promise.all([
    client.from('students').select('id').eq('profile_id', userId).eq('is_active', true).maybeSingle(),
    client.rpc('can_manage_yizi_questions'),
  ])
  return {
    studentId: studentResult.error ? '' : studentResult.data?.id || '',
    canManage: !managerResult.error && Boolean(managerResult.data),
  }
}

export async function loadYiziContext({ guestMode = false } = {}, client = undefined) {
  if (client === undefined) {
    try { client = requireSupabase() } catch { client = null }
  }
  const fallback = {
    questions: ['remove_part', 'four_sayings', 'component_pairs'].flatMap((type) => localYiziQuestions(type)),
    commonIdioms: localCommonIdioms(), studentId: '', canManage: false, remoteEnabled: false,
  }
  if (!client) return fallback
  const account = guestMode ? { studentId: '', canManage: false } : await accountContext(client)
  let query = client.from('yizi_questions').select('*').order('game_type').order('difficulty').order('updated_at', { ascending: false })
  if (!account.canManage) query = query.eq('status', 'published')
  const { data, error } = await query
  if (error && !isMissingRelation(error)) throw new Error(`無法讀取一字千金題庫：${error.message}`)
  if (error) return { ...fallback, studentId: account.studentId, canManage: account.canManage }
  return {
    questions: (data || []).map(mapYiziQuestion),
    commonIdioms: localCommonIdioms(),
    studentId: account.studentId,
    canManage: account.canManage,
    remoteEnabled: true,
  }
}

export async function saveYiziQuestion(input, client = requireSupabase()) {
  if (!['remove_part', 'four_sayings', 'component_pairs'].includes(input.gameType)) throw new Error('請選擇題型。')
  const accepted = [...new Set((input.answers?.accepted || []).map(normalizeChineseAnswer).filter(Boolean))]
  if (!accepted.length) throw new Error('至少需要一個正確答案。')
  const stableKey = input.stableKey || `custom-${input.gameType}-${globalThis.crypto?.randomUUID?.() || Date.now()}`
  const payload = {
    stable_key: stableKey,
    game_type: input.gameType,
    difficulty: Math.max(1, Math.min(3, Number(input.difficulty || 1))),
    prompt_data: input.prompt || {},
    answer_data: {
      accepted,
      extra: [...new Set((input.answers?.extra || []).map(normalizeChineseAnswer).filter(Boolean))],
    },
    status: ['draft', 'published', 'archived'].includes(input.status) ? input.status : 'draft',
    source_label: input.sourceLabel || '教師自建題目',
    source_url: input.sourceUrl || '',
    source_commit: input.sourceCommit || '',
    updated_at: new Date().toISOString(),
  }
  const query = input.id && !String(input.id).startsWith('yzqj-')
    ? client.from('yizi_questions').update(payload).eq('id', input.id)
    : client.from('yizi_questions').upsert(payload, { onConflict: 'stable_key' })
  const { data, error } = await query.select('*').single()
  if (error) throw new Error(`無法儲存題目：${error.message}`)
  return mapYiziQuestion(data)
}

export async function recordYiziAttempt(input, client = requireSupabase()) {
  const { data, error } = await client.rpc('record_yizi_attempt', {
    p_question_id: input.questionId && !String(input.questionId).startsWith('yzqj-') ? input.questionId : null,
    p_game_type: input.gameType,
    p_mode_code: input.modeCode || 'untimed',
    p_answer_text: input.answerText || '',
    p_is_correct: Boolean(input.correct),
    p_score: Math.max(0, Number(input.score || 0)),
    p_duration_ms: Math.max(0, Math.round(Number(input.durationMs || 0))),
    p_metadata: input.metadata || {},
  })
  if (error) {
    if (String(error.message || '').includes('student_required') || isMissingRelation(error)) return null
    throw translatedError(error, '無法儲存作答紀錄')
  }
  return data
}

export async function loadAcceptedYiziIdioms() {
  const response = await fetch(`${import.meta.env.BASE_URL}yizi-idioms.json`)
  if (!response.ok) throw new Error('完整成語判定清單載入失敗。')
  const data = await response.json()
  return Array.isArray(data.idioms) ? data.idioms : []
}

async function roomRpc(name, parameters, fallback, client = requireSupabase()) {
  const { data, error } = await client.rpc(name, parameters)
  if (error) throw translatedError(error, fallback)
  return data
}

export function rememberYiziRoomSeat(seat) {
  window.localStorage.setItem(roomStorageKey, JSON.stringify(seat))
}

export function readYiziRoomSeat() {
  try {
    const seat = JSON.parse(window.localStorage.getItem(roomStorageKey) || 'null')
    return seat?.roomCode && seat?.seatToken ? seat : null
  } catch { return null }
}

export function clearYiziRoomSeat() {
  window.localStorage.removeItem(roomStorageKey)
}

export async function createYiziRoom(nickname, client) {
  const seat = await roomRpc('yizi_create_room', { p_nickname: nickname.trim() }, '無法建立房間', client)
  rememberYiziRoomSeat(seat)
  return seat
}

export async function joinYiziRoom(roomCode, nickname, client) {
  const seat = await roomRpc('yizi_join_room', {
    p_room_code: String(roomCode).replace(/\D/g, '').slice(0, 6), p_nickname: nickname.trim(),
  }, '無法加入房間', client)
  rememberYiziRoomSeat(seat)
  return seat
}

export function loadYiziRoom(seat, client) {
  return roomRpc('yizi_room_snapshot', { p_room_code: seat.roomCode, p_seat_token: seat.seatToken }, '無法讀取房間', client)
}

export function startYiziRoom(seat, timeLimitSeconds, client) {
  return roomRpc('yizi_start_room', {
    p_room_code: seat.roomCode, p_seat_token: seat.seatToken, p_time_limit_seconds: Number(timeLimitSeconds),
  }, '無法開始對戰', client)
}

export function submitYiziRoomMove(seat, move, client) {
  return roomRpc('yizi_submit_room_move', {
    p_room_code: seat.roomCode, p_seat_token: seat.seatToken,
    p_phrase: move.phrase, p_start_row: move.startRow, p_start_column: move.startColumn, p_direction: move.direction,
  }, '無法送出成語', client)
}

export function claimNoYiziRoomMove(seat, client) {
  return roomRpc('yizi_claim_no_room_move', { p_room_code: seat.roomCode, p_seat_token: seat.seatToken }, '無法確認盤面', client)
}

export function leaveYiziRoom(seat, client) {
  return roomRpc('yizi_leave_room', { p_room_code: seat.roomCode, p_seat_token: seat.seatToken }, '無法離開房間', client)
}

export { YIZI_SOURCE }
