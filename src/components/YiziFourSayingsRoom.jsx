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
const competitionLabels = { points: '積分賽', eliminate_1: '一錯淘汰', eliminate_2: '兩錯淘汰' }

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
    <span>賽制：<strong>{competitionLabels[room.competitionMode] || '積分賽'}</strong></span>
    <span>房間上限：<strong>{room.playerLimit || 2}</strong> 人</span>
  </div>
}

function PlayerScoreboard({ players = [], winnerSeat = null, meSeat = null }) {
  return <div className="yizi-competition-scoreboard">{players.map((player, index) => <article
    key={player.seatNo}
    className={`${player.seatNo === winnerSeat ? 'is-winner' : ''} ${player.seatNo === meSeat ? 'is-me' : ''} ${player.status === 'eliminated' ? 'is-eliminated' : ''}`}>
    <b>第 {index + 1} 名</b><strong>{player.nickname}{player.seatNo === meSeat ? '（你）' : ''}</strong>
    <span>{player.score} 分</span>
    <small>{player.status === 'eliminated' ? `已淘汰・錯 ${player.failedCount} 題` : player.status === 'forfeited' ? '已離場' : `錯 ${player.failedCount || 0} 題・答對 ${player.correctCount || 0} 題`}</small>
  </article>)}</div>
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
  const [playerLimit, setPlayerLimit] = useState(8)
  const [competitionMode, setCompetitionMode] = useState('points')
  const [answer, setAnswer] = useState('')
  const [selected, setSelected] = useState(['', '', '', ''])
  const [selectionOrder, setSelectionOrder] = useState([])
  const [message, setMessage] = useState('')
  const [syncError, setSyncError] = useState('')
  const [busy, setBusy] = useState(false)
  const recordedRef = useRef('')

  const refresh = async (currentSeat = seat) => {
    if (!currentSeat) return
    try { setSnapshot(await loadYiziFourSayingsRoom(currentSeat)); setSyncError('') }
    catch (error) { setSyncError(error.message) }
  }
  useEffect(() => {
    if (!seat) return undefined
    refresh(seat)
    const timer = window.setInterval(() => refresh(seat), snapshot?.room?.playerLimit === 36 ? 3000 : 1500)
    return () => window.clearInterval(timer)
  }, [seat?.roomCode, seat?.seatToken, snapshot?.room?.playerLimit])

  const questionKey = `${snapshot?.room?.roomCode || ''}:${snapshot?.room?.currentRound || 0}`
  const idioms = useMemo(() => arrangeFourSayingsIdioms(snapshot?.currentQuestion, seededRandom(questionKey)), [snapshot?.currentQuestion?.id, questionKey])
  useEffect(() => {
    setAnswer(''); setSelected(['', '', '', '']); setSelectionOrder([])
  }, [questionKey])

  const me = snapshot?.players?.find((player) => player.seatNo === snapshot.meSeat)
  const roundActive = snapshot?.room?.status === 'playing' && me?.status === 'connected' && snapshot?.myRound?.status === 'active'
  const clickAnswer = orderedFourSayingsAnswer(selected, selectionOrder)
  const effectiveMode = snapshot?.room?.inputMode
  useEffect(() => { if (effectiveMode === 'click') setAnswer(clickAnswer) }, [clickAnswer, effectiveMode])
  const remaining = useCountdown(snapshot?.room?.roundStartedAt, snapshot?.room?.timeLimitSeconds, roundActive, refresh)

  useEffect(() => {
    const room = snapshot?.room
    if (room?.status !== 'finished' || !me || recordedRef.current === room.roomCode) return
    recordedRef.current = room.roomCode
    const maximum = Math.max(1, Number(room.questionCount) * 2)
    const rank = Math.max(1, snapshot.players.findIndex((player) => player.seatNo === snapshot.meSeat) + 1)
    trackLearningActivityAttempt(buildYiziProgress({
      gameType: 'four_sayings', modeCode: `multiplayer_${room.competitionMode}_${room.inputMode}_${room.questionCount}q_${room.timeLimitSeconds}s`,
      score: Math.round(Number(me.score || 0) / maximum * 100), correctCount: Number(me.correctCount || 0),
      questionCount: Number(room.questionCount), durationMs: Number(me.totalDurationMs || 0),
      attemptKey: `yizi-four-sayings-multiplayer:${room.roomCode}:${snapshot.meSeat}`,
      metadata: { roomCode: room.roomCode, points: Number(me.score || 0), rank, playerCount: snapshot.players.length, competitionMode: room.competitionMode, result: room.winnerSeat === null ? 'tie' : room.winnerSeat === snapshot.meSeat ? 'win' : 'loss' },
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
    const next = await createYiziFourSayingsRoom({ nickname, inputMode, timeLimitSeconds, questionCount, playerLimit, competitionMode })
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
    <h2>四說新語多人競賽</h2><p>所有玩家同時作答相同題目；房主可建立一般房或全班房，並選擇積分或淘汰賽制。</p>
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
        <label>房間規模<select value={playerLimit} onChange={(event) => setPlayerLimit(Number(event.target.value))}>
          <option value="8">一般房（最多 8 人）</option><option value="36">全班房（最多 36 人）</option></select></label>
        <label>勝負模式<select value={competitionMode} onChange={(event) => setCompetitionMode(event.target.value)}>
          <option value="points">積分賽</option><option value="eliminate_1">錯 1 題淘汰</option><option value="eliminate_2">錯 2 題淘汰</option></select></label>
        <button type="button" className="primary" disabled={busy || !nickname.trim()} onClick={createRoom}>建立競賽房間</button>
      </div>
      <div className="yizi-room-join"><label>房間代碼<input inputMode="numeric" maxLength="6" value={roomCode}
        onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 位數" /></label>
        <button type="button" disabled={busy || !nickname.trim() || roomCode.length !== 6} onClick={joinRoom}>加入房間</button></div>
    </div>
    <p className="yizi-feedback">至少 2 人即可開始。答對且未用提示得 2 分，使用提示後得 1 分；淘汰者可留在房間觀戰。斷線後保留座位 120 秒，同一裝置重新開啟可繼續。</p>
    {message && <p className="yizi-feedback is-error">{message}</p>}
  </section>

  if (!snapshot) return <section className="yizi-game-card"><p>正在讀取房間……</p>{syncError && <p className="yizi-feedback is-error">{syncError}</p>}{message && <p className="yizi-feedback is-error">{message}</p>}</section>
  const room = snapshot.room
  if (room.status === 'waiting') return <section className="yizi-game-card">
    <h2>四說新語多人競賽</h2><div className="yizi-room-summary"><strong>房間代碼：{room.roomCode}</strong><span>將代碼提供給參賽者；至少 2 人即可開始。</span><span>目前 {snapshot.players.length}／{room.playerLimit} 人</span></div>
    <LockedSettings room={room} /><div className="yizi-room-waiting">
      <div className="yizi-waiting-player-list">{snapshot.players.map((player) => <span key={player.seatNo}>{player.seatNo === 1 ? '房主' : `第 ${player.seatNo} 位`}：<strong>{player.nickname}</strong></span>)}</div>
      {snapshot.meSeat === 1 && <button type="button" className="primary" disabled={busy || snapshot.players.length < 2}
        onClick={() => run(() => startYiziFourSayingsRoom(seat))}>開始 {room.questionCount} 題競賽</button>}
    </div><button type="button" className="yizi-give-up" disabled={busy} onClick={leaveRoom}>離開房間</button>
    {syncError && <p className="yizi-feedback is-error">房間同步失敗：{syncError}</p>}
    {message && <p className="yizi-feedback is-error">{message}</p>}
  </section>

  if (room.status === 'finished') return <section className="yizi-game-card yizi-competition-finished">
    <h2>{room.winnerSeat === null ? '本場並列' : room.winnerSeat === snapshot.meSeat ? '你獲勝了' : `${snapshot.players.find((player) => player.seatNo === room.winnerSeat)?.nickname || '其他玩家'}獲勝`}</h2>
    <LockedSettings room={room} /><PlayerScoreboard players={snapshot.players} winnerSeat={room.winnerSeat} meSeat={snapshot.meSeat} />
    {snapshot.lastRound?.answer && <p className="yizi-feedback is-answer">最後一題答案：{snapshot.lastRound.answer}</p>}
    <button type="button" className="primary" onClick={leaveRoom}>返回競賽大廳</button>{syncError && <p className="yizi-feedback is-error">房間同步失敗：{syncError}</p>}{message && <p className="yizi-feedback is-error">{message}</p>}
  </section>

  return <section className="yizi-game-card yizi-competition-round">
    <div className="yizi-room-summary"><strong>第 {room.currentRound}／{room.questionCount} 題</strong>
      <span>{me?.nickname}：{me?.score || 0} 分</span><span>參賽者 {snapshot.players.filter((player) => player.status === 'connected').length} 人</span><strong>剩餘 {remaining} 秒</strong></div>
    <LockedSettings room={room} />
    <PlayerScoreboard players={snapshot.players} winnerSeat={room.winnerSeat} meSeat={snapshot.meSeat} />
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
          preferredCharacters={idioms.join('')} />}</>}
    {snapshot.currentQuestion?.hintCharacter && <p className="yizi-hint">提示：答案包含「{snapshot.currentQuestion.hintCharacter}」。本題答對最高 1 分。</p>}
    {roundActive && !snapshot.myRound?.hintUsed && <button type="button" disabled={busy}
      onClick={() => run(() => useYiziFourSayingsRoomHint(seat))}>顯示一字提示</button>}
    <div className="yizi-submit-row"><button type="button" className="yizi-submit" disabled={busy || !roundActive} onClick={submit}>送出答案</button>
      <button type="button" className="yizi-give-up" disabled={busy || !roundActive}
        onClick={() => run(() => giveUpYiziFourSayingsRoomRound(seat))}>放棄本題</button>
      <button type="button" disabled={busy} onClick={() => refresh()}>更新房間</button></div>
    {me?.status === 'eliminated'
      ? <p className="yizi-feedback is-error">你已被淘汰，目前為觀戰模式；可以繼續查看排行榜與題目進度。</p>
      : !roundActive && <p className="yizi-feedback">你已完成本題，正在等待其他玩家。</p>}
    {snapshot.myRound?.attemptCount === 1 && roundActive && <p className="yizi-feedback is-error">第一次答案不正確，還有一次作答機會。</p>}
    {syncError && <p className="yizi-feedback is-error">房間同步失敗：{syncError}</p>}
    {message && <p className="yizi-feedback is-error">{message}</p>}
  </section>
}
