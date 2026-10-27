import { createFactorQuestion } from '../lib/factorClash.js'
import { requireSupabase } from '../lib/supabase.js'

const roomStorageKey = 'sljh.factorClash.roomSeat.v1'
const messages = {
  factor_nickname_invalid: '暱稱請輸入 1～10 個字。',
  factor_room_not_found: '找不到這個房間，請確認 6 位數代碼。',
  factor_room_full: '這個房間已經有 2 位玩家。',
  factor_room_started: '這個房間已經開始對戰。',
  factor_duplicate_nickname: '同一房間不能使用相同暱稱。',
  factor_seat_invalid: '找不到這個座位，請重新加入房間。',
  factor_host_required: '只有房主可以開始對戰。',
  factor_players_incomplete: '請等第 2 位玩家加入後再開始。',
  factor_submission_order_invalid: '題目進度不同步，請重新整理房間。',
  factor_settings_invalid: '房間玩法或題目設定不完整。',
  factor_submission_invalid: '本題成績資料不正確，請重新整理後再試。',
}

function translate(error, fallback) {
  const key = Object.keys(messages).find((item) => error?.message?.includes(item))
  return new Error(key ? messages[key] : `${fallback}：${error?.message || '未知錯誤'}`)
}

async function rpc(name, parameters, fallback, client = requireSupabase()) {
  const { data, error } = await client.rpc(name, parameters)
  if (error) throw translate(error, fallback)
  return data
}

function makeQuestionSet(mode, difficulty, count = 10) {
  const usedKeys = new Set()
  return Array.from({ length: count }, () => {
    const question = createFactorQuestion({ mode, difficulty, usedKeys })
    usedKeys.add(question.key)
    return question
  })
}

export function rememberFactorClashSeat(seat) {
  window.localStorage.setItem(roomStorageKey, JSON.stringify(seat))
}

export function readFactorClashSeat() {
  try {
    const seat = JSON.parse(window.localStorage.getItem(roomStorageKey) || 'null')
    return seat?.roomCode && seat?.seatToken ? seat : null
  } catch {
    return null
  }
}

export function clearFactorClashSeat() {
  window.localStorage.removeItem(roomStorageKey)
}

export async function createFactorClashRoom(nickname, client) {
  const data = await rpc('factor_clash_create_room', { p_nickname: String(nickname).trim() }, '無法建立房間', client)
  const seat = { roomCode: data.roomCode, seatToken: data.seatToken }
  rememberFactorClashSeat(seat)
  return seat
}

export async function joinFactorClashRoom(roomCode, nickname, client) {
  const data = await rpc('factor_clash_join_room', {
    p_room_code: String(roomCode).replace(/\D/g, '').slice(0, 6),
    p_nickname: String(nickname).trim(),
  }, '無法加入房間', client)
  const seat = { roomCode: data.roomCode, seatToken: data.seatToken }
  rememberFactorClashSeat(seat)
  return seat
}

export function loadFactorClashRoom(seat, client) {
  return rpc('factor_clash_room_snapshot', {
    p_room_code: seat.roomCode, p_seat_token: seat.seatToken,
  }, '無法讀取房間', client)
}

export function startFactorClashRoom(seat, mode, difficulty, client) {
  return rpc('factor_clash_start_room', {
    p_room_code: seat.roomCode,
    p_seat_token: seat.seatToken,
    p_mode: mode,
    p_difficulty: difficulty,
    p_host_questions: makeQuestionSet(mode, difficulty),
    p_guest_questions: makeQuestionSet(mode, difficulty),
  }, '無法開始對戰', client)
}

export function reportFactorClashQuestion(seat, { questionNumber, points, firstTry, elapsedMs, timedOut }, client) {
  return rpc('factor_clash_report_question', {
    p_room_code: seat.roomCode,
    p_seat_token: seat.seatToken,
    p_question_number: questionNumber,
    p_points: points,
    p_first_try: firstTry,
    p_elapsed_ms: elapsedMs,
    p_timed_out: timedOut,
  }, '無法更新對戰進度', client)
}

export function leaveFactorClashRoom(seat, client) {
  return rpc('factor_clash_leave_room', {
    p_room_code: seat.roomCode, p_seat_token: seat.seatToken,
  }, '無法離開房間', client)
}

export function releaseFactorClashSeat(seat, client) {
  return rpc('factor_clash_release_offline_seat', {
    p_room_code: seat.roomCode, p_seat_token: seat.seatToken,
  }, '目前無法釋放座位', client)
}
