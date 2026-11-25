import { useEffect, useRef, useState } from 'react'
import { SafeHandwritingAnswer } from './HandwritingAnswer.jsx'
import { buildYiziProgress } from '../lib/activityProgress.js'
import { normalizeChineseAnswer, YIZI_DIFFICULTIES, YIZI_GAME_LABELS } from '../lib/yiziQianjin.js'
import { trackLearningActivityAttempt } from '../services/learningProgressService.js'
import {
  clearYiziWordCompetitionSeat, createYiziWordCompetitionRoom, giveUpYiziWordCompetitionRound,
  joinYiziWordCompetitionRoom, leaveYiziWordCompetitionRoom, loadYiziWordCompetitionRoom,
  readYiziWordCompetitionSeat, startYiziWordCompetitionRoom, submitYiziWordCompetitionAnswer,
} from '../services/yiziQianjinService.js'

const competitionLabels = { points: '積分制', turns: '輪流答題制' }
const inputLabels = { keyboard: '鍵盤輸入', handwriting: '手寫辨識' }

function useRoomCountdown(startedAt, seconds, running, onExpire) {
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
  const difficulty = YIZI_DIFFICULTIES.find((item) => item.value === room.difficulty)?.label || '混合'
  return <div className="yizi-room-locked-settings">
    <span>{YIZI_GAME_LABELS[room.gameType]}</span><span>難度：<strong>{difficulty}</strong></span>
    <span>共 <strong>{room.questionCount}</strong> 題</span><span>每回合 <strong>{room.timeLimitSeconds}</strong> 秒</span>
    <span>作答：<strong>{inputLabels[room.inputMode]}</strong></span>
    <span>賽制：<strong>{competitionLabels[room.competitionMode]}</strong></span>
    <span>上限：<strong>{room.playerLimit}</strong> 人</span>
  </div>
}

function Scoreboard({ players = [], winnerSeat = null, meSeat = null, currentTurnSeat = null }) {
  return <div className="yizi-competition-scoreboard">{players.map((player, index) => <article
    key={player.seatNo}
    className={`${player.seatNo === winnerSeat ? 'is-winner' : ''} ${player.seatNo === meSeat ? 'is-me' : ''} ${player.roundStatus === 'eliminated' || player.roundStatus === 'timed_out' ? 'is-eliminated' : ''}`}>
    <b>第 {index + 1} 名</b><strong>{player.nickname}{player.seatNo === meSeat ? '（你）' : ''}</strong>
    <span>{player.score} 分</span>
    <small>{player.seatNo === currentTurnSeat ? '目前作答者' : player.status === 'forfeited' ? '已離場' : ['eliminated', 'timed_out'].includes(player.roundStatus) ? '本題已退出' : `本題 ${player.roundScore || 0} 分`}</small>
  </article>)}</div>
}

export default function YiziWordCompetitionRoom({ gameType, context }) {
  const [seat, setSeat] = useState(() => readYiziWordCompetitionSeat(gameType))
  const [snapshot, setSnapshot] = useState(null)
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [difficulty, setDifficulty] = useState(0)
  const [inputMode, setInputMode] = useState('keyboard')
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(gameType === 'component_pairs' ? 60 : 30)
  const [questionCount, setQuestionCount] = useState(5)
  const [playerLimit, setPlayerLimit] = useState(8)
  const [competitionMode, setCompetitionMode] = useState('points')
  const [answer, setAnswer] = useState('')
  const [message, setMessage] = useState('')
  const [syncError, setSyncError] = useState('')
  const [busy, setBusy] = useState(false)
  const recordedRef = useRef('')

  const refresh = async (currentSeat = seat) => {
    if (!currentSeat) return
    try { setSnapshot(await loadYiziWordCompetitionRoom(currentSeat)); setSyncError('') }
    catch (error) { setSyncError(error.message) }
  }
  useEffect(() => {
    if (!seat) return undefined
    refresh(seat)
    const timer = window.setInterval(() => refresh(seat), snapshot?.room?.playerLimit === 36 ? 3000 : 1500)
    return () => window.clearInterval(timer)
  }, [seat?.roomCode, seat?.seatToken, snapshot?.room?.playerLimit])

  const room = snapshot?.room
  const me = snapshot?.players?.find((player) => player.seatNo === snapshot.meSeat)
  const isTurns = room?.competitionMode === 'turns'
  const effectiveInputMode = room?.inputMode
  const isMyTurn = !isTurns || room?.currentTurnSeat === snapshot?.meSeat
  const canAnswer = room?.status === 'playing' && me?.status === 'connected' && snapshot?.myRound?.status === 'active' && isMyTurn
  const timerStartedAt = isTurns ? room?.turnStartedAt : room?.roundStartedAt
  const timerRunning = room?.status === 'playing' && (isTurns ? Boolean(room?.currentTurnSeat) : true)
  const remaining = useRoomCountdown(timerStartedAt, room?.timeLimitSeconds, timerRunning, refresh)
  const questionKey = `${room?.roomCode || ''}:${room?.currentRound || 0}`
  useEffect(() => { setAnswer(''); setMessage('') }, [questionKey, room?.currentTurnSeat])

  useEffect(() => {
    if (room?.status !== 'finished' || !me || recordedRef.current === room.roomCode) return
    recordedRef.current = room.roomCode
    const maximum = Math.max(1, ...snapshot.players.map((player) => Number(player.score || 0)))
    const rank = Math.max(1, snapshot.players.findIndex((player) => player.seatNo === snapshot.meSeat) + 1)
    trackLearningActivityAttempt(buildYiziProgress({
      gameType: room.gameType,
      modeCode: `multiplayer_${room.competitionMode}_${room.questionCount}q_${room.timeLimitSeconds}s`,
      score: Math.round(Number(me.score || 0) / maximum * 100), correctCount: Number(me.score || 0),
      questionCount: Number(room.questionCount), durationMs: 0,
      attemptKey: `yizi-${room.gameType}-multiplayer:${room.roomCode}:${snapshot.meSeat}`,
      metadata: { roomCode: room.roomCode, points: Number(me.score || 0), rank, playerCount: snapshot.players.length, competitionMode: room.competitionMode },
    }))
  }, [room?.status, room?.roomCode, me?.score])

  const run = async (action) => {
    if (busy) return null
    setBusy(true)
    try {
      const result = await action()
      if (result?.room) setSnapshot(result)
      setMessage('')
      return result
    } catch (error) { setMessage(error.message); return null }
    finally { setBusy(false) }
  }
  const createRoom = () => run(async () => {
    const next = await createYiziWordCompetitionRoom({ nickname, gameType, competitionMode, inputMode, difficulty, timeLimitSeconds, questionCount, playerLimit })
    setSeat(next); setRoomCode(next.roomCode)
  })
  const joinRoom = () => run(async () => {
    const next = await joinYiziWordCompetitionRoom(roomCode, nickname)
    setSeat(next)
  })
  const leaveRoom = () => run(async () => {
    if (seat) await leaveYiziWordCompetitionRoom(seat)
    clearYiziWordCompetitionSeat(); setSeat(null); setSnapshot(null)
  })
  const submit = async () => {
    const normalized = normalizeChineseAnswer(answer)
    if (normalized.length !== 1) { setMessage('請手寫或輸入一個國字。'); return }
    const result = await run(() => submitYiziWordCompetitionAnswer(seat, normalized))
    if (!result) return
    const nextMe = result.players?.find((player) => player.seatNo === result.meSeat)
    const nextRound = result.myRound
    if (nextRound?.lastAnswerCorrect) setMessage(`「${normalized}」正確，目前 ${nextMe?.score || 0} 分。`)
    else if (room?.gameType === 'remove_part' && nextRound?.status === 'active') setMessage('還不正確，剩最後一次機會。')
    else if (isTurns) setMessage(`「${normalized}」不正確或已被答過，本題退出。`)
    else setMessage(`「${normalized}」不正確或已經答過。`)
    setAnswer('')
  }

  if (!seat) return <section className="yizi-game-card">
    <h2>{YIZI_GAME_LABELS[gameType]}多人競賽</h2>
    <p>{gameType === 'remove_part' ? '全員同題同步作答，答對一題得 1 分。' : '可選全員同步積分，或共用答案清單的輪流答題制。'}</p>
    <div className="yizi-room-lobby"><label className="yizi-room-nickname">玩家暱稱<input maxLength="12" value={nickname} onChange={(event) => setNickname(event.target.value)} /></label>
      <div className="yizi-room-create-settings">
        <label>難度<select value={difficulty} onChange={(event) => setDifficulty(Number(event.target.value))}><option value="0">混合</option>{YIZI_DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>題數<select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}><option value="5">5 題</option><option value="10">10 題</option></select></label>
        <label>{gameType === 'component_pairs' && competitionMode === 'turns' ? '每人回合時間' : '每題時間'}<select value={timeLimitSeconds} onChange={(event) => setTimeLimitSeconds(Number(event.target.value))}>
          <option value="30">30 秒</option><option value="60">60 秒</option>{gameType === 'component_pairs' && <option value="90">90 秒</option>}</select></label>
        <label>作答方式<select value={inputMode} onChange={(event) => setInputMode(event.target.value)}><option value="keyboard">鍵盤輸入</option><option value="handwriting">手寫辨識</option></select></label>
        {gameType === 'component_pairs'
          ? <label>競賽方式<select value={competitionMode} onChange={(event) => setCompetitionMode(event.target.value)}><option value="points">積分制</option><option value="turns">輪流答題制</option></select></label>
          : <span className="yizi-fixed-setting">競賽方式：<strong>積分制</strong></span>}
        <label>房間規模<select value={playerLimit} onChange={(event) => setPlayerLimit(Number(event.target.value))}><option value="8">一般房（最多 8 人）</option><option value="36">全班房（最多 36 人）</option></select></label>
        <button type="button" className="primary" disabled={busy || !nickname.trim()} onClick={createRoom}>建立競賽房間</button>
      </div>
      <div className="yizi-room-join"><label>房間代碼<input inputMode="numeric" maxLength="6" value={roomCode} onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
        <button type="button" disabled={busy || !nickname.trim() || roomCode.length !== 6} onClick={joinRoom}>加入房間</button></div>
    </div><p className="yizi-feedback">斷線後保留座位 120 秒，同一裝置重新開啟可繼續。</p>{message && <p className="yizi-feedback is-error">{message}</p>}
  </section>

  if (!snapshot) return <section className="yizi-game-card"><p>正在讀取房間……</p>{syncError && <p className="yizi-feedback is-error">{syncError}</p>}{message && <p className="yizi-feedback is-error">{message}</p>}</section>
  if (room.status === 'waiting') return <section className="yizi-game-card">
    <h2>{YIZI_GAME_LABELS[room.gameType]}多人競賽</h2>
    <div className="yizi-room-summary"><strong>房間代碼：{room.roomCode}</strong><span>目前 {snapshot.players.length}／{room.playerLimit} 人</span></div>
    <LockedSettings room={room} />
    <div className="yizi-waiting-player-list">{snapshot.players.map((player) => <span key={player.seatNo}>{player.seatNo === 1 ? '房主' : `第 ${player.seatNo} 位`}：<strong>{player.nickname}</strong></span>)}</div>
    {snapshot.meSeat === 1 && <button type="button" className="primary" disabled={busy || snapshot.players.length < 2} onClick={() => run(() => startYiziWordCompetitionRoom(seat))}>開始競賽</button>}
    <button type="button" className="yizi-give-up" disabled={busy} onClick={leaveRoom}>離開房間</button>
    {syncError && <p className="yizi-feedback is-error">房間同步失敗：{syncError}</p>}
    {message && <p className="yizi-feedback is-error">{message}</p>}
  </section>

  if (room.status === 'finished') return <section className="yizi-game-card yizi-competition-finished">
    <h2>{room.winnerSeat === null ? '本場並列' : room.winnerSeat === snapshot.meSeat ? '你獲勝了' : `${snapshot.players.find((player) => player.seatNo === room.winnerSeat)?.nickname || '其他玩家'}獲勝`}</h2>
    <LockedSettings room={room} /><Scoreboard players={snapshot.players} winnerSeat={room.winnerSeat} meSeat={snapshot.meSeat} />
    {snapshot.lastRound?.answers?.length > 0 && <p className="yizi-feedback is-answer">最後一題可接受答案：{snapshot.lastRound.answers.join('、')}</p>}
    <button type="button" className="primary" onClick={leaveRoom}>返回競賽大廳</button>
    {syncError && <p className="yizi-feedback is-error">房間同步失敗：{syncError}</p>}
    {message && <p className="yizi-feedback is-error">{message}</p>}
  </section>

  const parts = snapshot.currentQuestion?.prompt?.parts || []
  return <section className="yizi-game-card yizi-competition-round">
    <div className="yizi-room-summary"><strong>第 {room.currentRound}／{room.questionCount} 題</strong><span>{me?.nickname}：{me?.score || 0} 分</span>
      {isTurns && <span>輪到：{snapshot.players.find((player) => player.seatNo === room.currentTurnSeat)?.nickname || '換題中'}</span>}
      <strong>剩餘 {remaining} 秒</strong></div>
    <LockedSettings room={room} /><Scoreboard players={snapshot.players} meSeat={snapshot.meSeat} currentTurnSeat={room.currentTurnSeat} />
    {snapshot.lastRound?.roundNo === room.currentRound - 1 && <p className="yizi-feedback is-answer">上一題可接受答案：{snapshot.lastRound.answers.join('、')}</p>}
    <div className={room.gameType === 'component_pairs' ? 'yizi-component-grid' : 'yizi-parts-stage'}>{parts.map((part, index) => <span key={`${part}-${index}`}>{part}</span>)}</div>
    {room.gameType === 'component_pairs' && room.competitionMode === 'turns' && (room.roundFoundAnswers || []).length > 0 && <div className="yizi-found"><strong>全房已答：</strong>{room.roundFoundAnswers.map((item) => <span key={item}>{item}</span>)}</div>}
    {room.gameType === 'component_pairs' && room.competitionMode === 'points' && snapshot.myRound?.foundAnswers?.length > 0 && <div className="yizi-found"><strong>你已答對：</strong>{snapshot.myRound.foundAnswers.map((item) => <span key={item}>{item}</span>)}</div>}
    {effectiveInputMode === 'keyboard' ? <label className="yizi-keyboard-answer">輸入一個國字<input maxLength="1" value={answer} disabled={!canAnswer} onChange={(event) => setAnswer(event.target.value)} /></label>
      : canAnswer ? <SafeHandwritingAnswer resetKey={`${questionKey}:${room.currentTurnSeat || 0}`} length={1} value={answer} onChange={setAnswer} /> : null}
    <div className="yizi-submit-row"><button type="button" className="yizi-submit" disabled={busy || !canAnswer} onClick={submit}>送出答案</button>
      <button type="button" className="yizi-give-up" disabled={busy || !canAnswer} onClick={() => run(() => giveUpYiziWordCompetitionRound(seat))}>{isTurns ? '本題想不到' : '結束本題'}</button></div>
    {!canAnswer && <p className="yizi-feedback">{isTurns && snapshot.myRound?.status === 'active' ? '等待輪到你。' : '你已完成或退出本題，等待其他玩家。'}</p>}
    {syncError && <p className="yizi-feedback is-error">房間同步失敗：{syncError}</p>}
    {message && <p className={`yizi-feedback ${String(message).includes('正確') ? 'is-success' : 'is-error'}`}>{message}</p>}
  </section>
}
