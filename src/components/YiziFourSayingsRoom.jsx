import { useEffect, useMemo, useRef, useState } from 'react'
import { SafeHandwritingAnswer } from './HandwritingAnswer.jsx'
import { arrangeFourSayingsIdioms, normalizeChineseAnswer, orderedFourSayingsAnswer, updateFourSayingsSelection } from '../lib/yiziQianjin.js'
import { buildYiziProgress } from '../lib/activityProgress.js'
import { trackLearningActivityAttempt } from '../services/learningProgressService.js'
import {
  clearYiziFourSayingsRoomSeat, createYiziFourSayingsRoom, giveUpYiziFourSayingsRoomRound,
  joinYiziFourSayingsRoom, leaveYiziFourSayingsRoom, loadYiziFourSayingsRoom,
  readYiziFourSayingsRoomSeat, startYiziFourSayingsRoom, submitYiziFourSayingsRoomAnswer,
  useYiziFourSayingsRoomHint,
} from '../services/yiziQianjinService.js'

const modeLabels = { click: '點選', keyboard: '鍵盤輸入', handwriting: '手寫辨識' }

function seededRandom(text) {
  let seed = Array.from(String(text || '')).reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 2166136261)
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
}

function useCountdown(startedAt, seconds, running, onExpire) {
  const [remaining, setRemaining] = useState(Number(seconds) || 0)
  const expireRef = useRef(onExpire)
  const expiredRef = useRef(false)
  expireRef.current = onExpire
  useEffect(() => {
    expiredRef.current = false
    if (!running || !startedAt) { setRemaining(Number(seconds) || 0); return undefined }
    const deadline = new Date(startedAt).getTime() + Number(seconds) * 1000
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(next)
      if (next === 0 && !expiredRef.current) { expiredRef.current = true; expireRef.current?.() }
    }
    tick()
    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [running, seconds, startedAt])
  return remaining
}

function LockedSettings({ room }) {
  return <div className="yizi-room-locked-settings">
    <span>共 <strong>{room.questionCount}</strong> 題</span>
    <span>每題 <strong>{room.timeLimitSeconds}</strong> 秒</span>
    <span>作答方式：<strong>{modeLabels[room.inputMode]}</strong></span>
  </div>
}

function SayingsRows({ idioms, selected = [], disabled = true, onSelect = null }) {
  return <div className={`yizi-sayings ${onSelect ? '' : 'yizi-sayings-readonly'}`}>{idioms.map((idiom, rowIndex) => <div key={`${idiom}-${rowIndex}`}>
    <span>第 {rowIndex + 1} 句</span>{Array.from(idiom).map((character, index) => onSelect
      ? <button type="button" disabled={disabled} className={selected[rowIndex] === character ? 'is-selected' : ''}
        key={`${character}-${index}`} onClick={() => onSelect(rowIndex, character)}>{character}</button>
      : <b key={`${character}-${index}`}>{character}</b>)}</div>)}</div>
}

export default function YiziFourSayingsRoom() {
  const [seat, setSeat] = useState(() => readYiziFourSayingsRoomSeat())
  const [snapshot, setSnapshot] = useState(null)
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [inputMode, setInputMode] = useState('click')
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(40)
  const [questionCount, setQuestionCount] = useState(5)
  const [answer, setAnswer] = useState('')
  const [selected, setSelected] = useState(['', '', '', ''])
  const [selectionOrder, setSelectionOrder] = useState([])
  const [handwritingFallback, setHandwritingFallback] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const recordedRef = useRef('')

  const refresh = async (currentSeat = seat) => {
    if (!currentSeat) return
    try { setSnapshot(await loadYiziFourSayingsRoom(currentSeat)); setMessage('') }
    catch (error) { setMessage(error.message) }
  }
  useEffect(() => {
    if (!seat) return undefined
    refresh(seat)
    const timer = window.setInterval(() => refresh(seat), 1500)
    return () => window.clearInterval(timer)
  }, [seat?.roomCode, seat?.seatToken])

  const questionKey = `${snapshot?.room?.roomCode || ''}:${snapshot?.room?.currentRound || 0}`
  const idioms = useMemo(() => arrangeFourSayingsIdioms(snapshot?.currentQuestion, seededRandom(questionKey)), [snapshot?.currentQuestion?.id, questionKey])
  useEffect(() => {
    setAnswer(''); setSelected(['', '', '', '']); setSelectionOrder([]); setHandwritingFallback(false)
  }, [questionKey])

  const me = snapshot?.players?.find((player) => player.seatNo === snapshot.meSeat)
  const opponent = snapshot?.players?.find((player) => player.seatNo !== snapshot.meSeat)
  const roundActive = snapshot?.room?.status === 'playing' && snapshot?.myRound?.status === 'active'
  const clickAnswer = orderedFourSayingsAnswer(selected, selectionOrder)
  const effectiveMode = snapshot?.room?.inputMode === 'handwriting' && handwritingFallback ? 'keyboard' : snapshot?.room?.inputMode
  useEffect(() => { if (effectiveMode === 'click') setAnswer(clickAnswer) }, [clickAnswer, effectiveMode])
  const remaining = useCountdown(snapshot?.room?.roundStartedAt, snapshot?.room?.timeLimitSeconds, roundActive, refresh)

  useEffect(() => {
    const room = snapshot?.room
    if (room?.status !== 'finished' || !me || recordedRef.current === room.roomCode) return
    recordedRef.current = room.roomCode
    const maximum = Math.max(1, Number(room.questionCount) * 2)
    trackLearningActivityAttempt(buildYiziProgress({
      gameType: 'four_sayings', modeCode: `duel_${room.inputMode}_${room.questionCount}q_${room.timeLimitSeconds}s`,
      score: Math.round(Number(me.score || 0) / maximum * 100), correctCount: Number(me.correctCount || 0),
      questionCount: Number(room.questionCount), durationMs: Number(me.totalDurationMs || 0),
      attemptKey: `yizi-four-sayings-duel:${room.roomCode}:${snapshot.meSeat}`,
      metadata: { roomCode: room.roomCode, points: Number(me.score || 0), result: room.winnerSeat === null ? 'tie' : room.winnerSeat === snapshot.meSeat ? 'win' : 'loss' },
    }))
  }, [snapshot?.room?.status, snapshot?.room?.roomCode, snapshot?.room?.winnerSeat, me?.score])

  const run = async (action) => {
    if (busy) return
    setBusy(true)
    try { const result = await action(); if (result?.room) setSnapshot(result); setMessage('') }
    catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  const createRoom = () => run(async () => {
    const next = await createYiziFourSayingsRoom({ nickname, inputMode, timeLimitSeconds, questionCount })
    setSeat(next); setRoomCode(next.roomCode)
  })
  const joinRoom = () => run(async () => { const next = await joinYiziFourSayingsRoom(roomCode, nickname); setSeat(next) })
  const leaveRoom = () => run(async () => {
    if (seat) await leaveYiziFourSayingsRoom(seat)
    clearYiziFourSayingsRoomSeat(); setSeat(null); setSnapshot(null)
  })
  const selectCharacter = (rowIndex, character) => {
    const next = updateFourSayingsSelection(selected, selectionOrder, rowIndex, character)
    setSelected(next.selected); setSelectionOrder(next.selectionOrder)
  }
  const clearSelection = () => { setSelected(['', '', '', '']); setSelectionOrder([]); setAnswer('') }
  const submit = () => {
    const normalized = normalizeChineseAnswer(effectiveMode === 'click' ? clickAnswer : answer)
    if (normalized.length !== 4) { setMessage('請完成四個字後再送出。'); return }
    run(() => submitYiziFourSayingsRoomAnswer(seat, normalized))
  }

  if (!seat) return <section className="yizi-game-card">
    <h2>四說新語雙人競賽</h2><p>雙方作答同一組題目；房主建立房間時固定題數、作答方式與每題時間。</p>
    <div className="yizi-room-lobby">
      <label className="yizi-room-nickname">玩家暱稱<input maxLength="12" value={nickname}
        onChange={(event) => setNickname(event.target.value)} placeholder="1～12 個字" /></label>
      <div className="yizi-room-create-settings">
        <label>題數<select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
          <option value="5">5 題</option><option value="10">10 題</option></select></label>
        <label>每題時間<select value={timeLimitSeconds} onChange={(event) => setTimeLimitSeconds(Number(event.target.value))}>
          <option value="40">40 秒</option><option value="60">60 秒</option></select></label>
        <label>作答方式<select value={inputMode} onChange={(event) => setInputMode(event.target.value)}>
          <option value="click">點選</option><option value="keyboard">鍵盤輸入</option><option value="handwriting">手寫辨識</option></select></label>
        <button type="button" className="primary" disabled={busy || !nickname.trim()} onClick={createRoom}>建立競賽房間</button>
      </div>
      <div className="yizi-room-join"><label>房間代碼<input inputMode="numeric" maxLength="6" value={roomCode}
        onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 位數" /></label>
        <button type="button" disabled={busy || !nickname.trim() || roomCode.length !== 6} onClick={joinRoom}>加入房間</button></div>
    </div>
    <p className="yizi-feedback">答對且未用提示得 2 分，使用提示後答對得 1 分；同分時以總作答時間較短者獲勝。</p>
    {message && <p className="yizi-feedback is-error">{message}</p>}
  </section>

  if (!snapshot) return <section className="yizi-game-card"><p>正在讀取房間……</p>{message && <p className="yizi-feedback is-error">{message}</p>}</section>
  const room = snapshot.room
  if (room.status === 'waiting') return <section className="yizi-game-card">
    <h2>四說新語雙人競賽</h2><div className="yizi-room-summary"><strong>房間代碼：{room.roomCode}</strong><span>請將代碼提供給另一位玩家。</span></div>
    <LockedSettings room={room} /><div className="yizi-room-waiting">
      <p>房主：{snapshot.players.find((player) => player.seatNo === 1)?.nickname || '等待中'}</p>
      <p>第 2 位玩家：{snapshot.players.find((player) => player.seatNo === 2)?.nickname || '等待加入'}</p>
      {snapshot.meSeat === 1 && <button type="button" className="primary" disabled={busy || snapshot.players.length < 2}
        onClick={() => run(() => startYiziFourSayingsRoom(seat))}>開始 {room.questionCount} 題競賽</button>}
    </div><button type="button" className="yizi-give-up" disabled={busy} onClick={leaveRoom}>離開房間</button>
    {message && <p className="yizi-feedback is-error">{message}</p>}
  </section>

  if (room.status === 'finished') return <section className="yizi-game-card yizi-competition-finished">
    <h2>{room.winnerSeat === null ? '本場平手' : room.winnerSeat === snapshot.meSeat ? '你獲勝了' : '對手獲勝'}</h2>
    <LockedSettings room={room} /><div className="yizi-competition-scoreboard">{snapshot.players.map((player) => <article
      key={player.seatNo} className={player.seatNo === room.winnerSeat ? 'is-winner' : ''}><strong>{player.nickname}</strong>
      <span>{player.score} 分</span><small>總作答時間 {(player.totalDurationMs / 1000).toFixed(1)} 秒</small></article>)}</div>
    {snapshot.lastRound?.answer && <p className="yizi-feedback is-answer">最後一題答案：{snapshot.lastRound.answer}</p>}
    <button type="button" className="primary" onClick={leaveRoom}>返回競賽大廳</button>{message && <p className="yizi-feedback is-error">{message}</p>}
  </section>

  return <section className="yizi-game-card yizi-competition-round">
    <div className="yizi-room-summary"><strong>第 {room.currentRound}／{room.questionCount} 題</strong>
      <span>{me?.nickname}：{me?.score || 0} 分</span><span>{opponent?.nickname || '對手'}：{opponent?.score || 0} 分</span><strong>剩餘 {remaining} 秒</strong></div>
    <LockedSettings room={room} />
    {snapshot.lastRound?.roundNo === room.currentRound - 1 && <p className="yizi-feedback is-answer">上一題答案：{snapshot.lastRound.answer}</p>}
    {effectiveMode === 'click' ? <>
      <SayingsRows idioms={idioms} selected={selected} disabled={!roundActive} onSelect={selectCharacter} />
      <div className="yizi-reorder"><p>依答案順序點選；第 1 個點的字會放在第 1 格。</p>
        <div>{Array.from({ length: 4 }, (_, index) => <span key={index}>{Array.from(clickAnswer)[index] || '？'}</span>)}</div>
        <button type="button" disabled={!roundActive} onClick={clearSelection}>清除重選</button></div></>
      : <><SayingsRows idioms={idioms} />{effectiveMode === 'keyboard'
        ? <label className="yizi-keyboard-answer">輸入四字答案<input value={answer} maxLength="4" disabled={!roundActive}
          onChange={(event) => setAnswer(event.target.value)} /></label>
        : <SafeHandwritingAnswer resetKey={questionKey} length={4} value={answer} onChange={setAnswer}
          onFallback={() => setHandwritingFallback(true)} />}
        {handwritingFallback && <p className="yizi-feedback">手寫辨識暫時失敗，已保留本題並改用鍵盤備援。</p>}</>}
    {snapshot.currentQuestion?.hintCharacter && <p className="yizi-hint">提示：答案包含「{snapshot.currentQuestion.hintCharacter}」。本題答對最高 1 分。</p>}
    {roundActive && !snapshot.myRound?.hintUsed && <button type="button" disabled={busy}
      onClick={() => run(() => useYiziFourSayingsRoomHint(seat))}>顯示一字提示</button>}
    <div className="yizi-submit-row"><button type="button" className="yizi-submit" disabled={busy || !roundActive} onClick={submit}>送出答案</button>
      <button type="button" className="yizi-give-up" disabled={busy || !roundActive}
        onClick={() => run(() => giveUpYiziFourSayingsRoomRound(seat))}>放棄本題</button>
      <button type="button" disabled={busy} onClick={() => refresh()}>更新房間</button></div>
    {!roundActive && <p className="yizi-feedback">你已完成本題，正在等待對手。</p>}
    {snapshot.myRound?.attemptCount === 1 && roundActive && <p className="yizi-feedback is-error">第一次答案不正確，還有一次作答機會。</p>}
    {message && <p className="yizi-feedback is-error">{message}</p>}
  </section>
}
