import { useEffect, useMemo, useRef, useState } from 'react'
import { SafeHandwritingAnswer } from './HandwritingAnswer.jsx'
import {
  applyIdiomPlacement, boardKey, canPlaceIdiom, chooseIdiomAiMove, createIdiomBoard,
  localCommonIdioms, normalizeChineseAnswer, YIZI_DIRECTION_LABELS,
} from '../lib/yiziQianjin.js'
import { buildYiziProgress } from '../lib/activityProgress.js'
import { trackLearningActivityAttempt } from '../services/learningProgressService.js'
import {
  claimNoYiziRoomMove, clearYiziRoomSeat, createYiziRoom, joinYiziRoom, leaveYiziRoom,
  loadAcceptedYiziIdioms, loadYiziRoom, readYiziRoomSeat, recordYiziAttempt,
  startYiziRoom, submitYiziRoomMove,
} from '../services/yiziQianjinService.js'

const directions = Object.keys(YIZI_DIRECTION_LABELS)

function Board({ board, selected, onSelect, disabled = false }) {
  return <div className="yizi-board-wrap"><div className="yizi-board" role="grid" aria-label="隻字片語棋盤">
    {Array.from({ length: 8 }, (_, row) => Array.from({ length: 12 }, (_, column) => {
      const key = boardKey(row, column)
      return <button type="button" role="gridcell" disabled={disabled} key={key}
        className={`${board[key] ? 'is-filled' : ''} ${selected?.row === row && selected?.column === column ? 'is-selected' : ''}`}
        onClick={() => onSelect?.({ row, column })} aria-label={`${row + 1} 列 ${column + 1} 欄${board[key] ? `，${board[key]}` : ''}`}>{board[key] || ''}</button>
    }))}
  </div></div>
}

function MoveComposer({ board, disabled, onSubmit }) {
  const [phrase, setPhrase] = useState('')
  const [inputMode, setInputMode] = useState('keyboard')
  const [start, setStart] = useState(null)
  const [direction, setDirection] = useState('R')
  const [error, setError] = useState('')
  const submit = async () => {
    const normalized = normalizeChineseAnswer(phrase)
    if (normalized.length !== 4) { setError('請輸入四字成語。'); return }
    if (!start) { setError('請先在棋盤點選成語第一字的位置。'); return }
    if (!canPlaceIdiom(board, normalized, start.row, start.column, direction)) {
      setError('此位置無法成立：必須與既有文字交會，且不可覆蓋不同文字。'); return
    }
    try {
      await onSubmit({ phrase: normalized, startRow: start.row, startColumn: start.column, direction })
      setPhrase(''); setStart(null); setError('')
    } catch (submitError) { setError(submitError.message) }
  }
  return <div className="yizi-move-composer">
    <Board board={board} selected={start} onSelect={setStart} disabled={disabled} />
    <div className="yizi-direction-buttons" aria-label="成語方向">
      {directions.map((item) => <button type="button" key={item} disabled={disabled}
        className={direction === item ? 'is-active' : ''} onClick={() => setDirection(item)}>{YIZI_DIRECTION_LABELS[item]}</button>)}
    </div>
    <div className="yizi-input-tabs"><button type="button" className={inputMode === 'keyboard' ? 'is-active' : ''} onClick={() => setInputMode('keyboard')}>輸入</button>
      <button type="button" className={inputMode === 'handwriting' ? 'is-active' : ''} onClick={() => setInputMode('handwriting')}>手寫</button></div>
    {inputMode === 'keyboard'
      ? <label className="yizi-keyboard-answer">四字成語<input value={phrase} maxLength={4} disabled={disabled} onChange={(event) => setPhrase(event.target.value)} /></label>
      : <SafeHandwritingAnswer length={4} value={phrase} onChange={setPhrase} onFallback={() => setInputMode('keyboard')} />}
    <button type="button" className="yizi-submit" disabled={disabled} onClick={submit}>將成語放入棋盤</button>
    {error && <p className="yizi-feedback is-error">{error}</p>}
  </div>
}

function useTurnCountdown(startedAt, limitSeconds, active, onExpire) {
  const [remaining, setRemaining] = useState(limitSeconds)
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire
  useEffect(() => {
    if (!active || !startedAt) { setRemaining(limitSeconds); return undefined }
    const started = typeof startedAt === 'number' ? startedAt : new Date(startedAt).getTime()
    let expired = false
    const tick = () => {
      const next = Math.max(0, Math.ceil((started + limitSeconds * 1000 - Date.now()) / 1000))
      setRemaining(next)
      if (!next && !expired) { expired = true; expireRef.current?.() }
    }
    tick()
    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [active, limitSeconds, startedAt])
  return remaining
}

function SoloIdiomBoard({ context }) {
  const commonIdioms = useMemo(() => localCommonIdioms(), [])
  const [accepted, setAccepted] = useState(new Set(commonIdioms))
  const [loadingLexicon, setLoadingLexicon] = useState(true)
  const [difficulty, setDifficulty] = useState(2)
  const [timeLimit, setTimeLimit] = useState(60)
  const [board, setBoard] = useState(() => createIdiomBoard('心'))
  const [used, setUsed] = useState([])
  const [scores, setScores] = useState({ player: 0, ai: 0 })
  const [turn, setTurn] = useState('idle')
  const [turnStartedAt, setTurnStartedAt] = useState(null)
  const [message, setMessage] = useState('選好時間與 AI 難度後開始新局。')
  const [winner, setWinner] = useState('')
  const sessionStartedAt = useRef(0)
  const recorded = useRef(false)
  const scoresRef = useRef(scores)
  const usedRef = useRef(used)
  const sessionRef = useRef(0)
  useEffect(() => { scoresRef.current = scores }, [scores])
  useEffect(() => { usedRef.current = used }, [used])
  useEffect(() => () => { sessionRef.current += 1 }, [])

  useEffect(() => {
    loadAcceptedYiziIdioms().then((items) => setAccepted(new Set(items))).catch(() => null).finally(() => setLoadingLexicon(false))
  }, [commonIdioms])

  const finish = (winnerCode, reason) => {
    setWinner(winnerCode); setTurn('finished'); setMessage(reason)
    if (recorded.current) return
    recorded.current = true
    const won = winnerCode === 'player'
    const finalScores = scoresRef.current
    const finalUsed = usedRef.current
    const durationMs = Math.max(0, Date.now() - sessionStartedAt.current)
    if (context.remoteEnabled && context.studentId) recordYiziAttempt({
      questionId: null, gameType: 'idiom_board', modeCode: `ai_d${difficulty}_${timeLimit}`,
      answerText: finalUsed.join('、'), correct: won, score: finalScores.player + (won ? 5 : 0), durationMs,
      metadata: { opponent: 'ai', result: won ? 'win' : 'loss', playerScore: finalScores.player, aiScore: finalScores.ai },
    }).catch(() => null)
    trackLearningActivityAttempt(buildYiziProgress({
      gameType: 'idiom_board', modeCode: `ai_d${difficulty}_${timeLimit}`, score: won ? 100 : 0,
      correctCount: finalScores.player, questionCount: Math.max(1, finalScores.player + finalScores.ai), durationMs,
      metadata: { opponent: 'ai', result: won ? 'win' : 'loss' },
    }))
  }
  const start = () => {
    sessionRef.current += 1
    const seedPhrase = commonIdioms[Math.floor(Math.random() * Math.min(800, commonIdioms.length))] || '一心一意'
    const seed = Array.from(seedPhrase)[Math.floor(Math.random() * 4)] || '心'
    usedRef.current = []; scoresRef.current = { player: 0, ai: 0 }
    setBoard(createIdiomBoard(seed)); setUsed([]); setScores({ player: 0, ai: 0 }); setWinner('')
    setTurn('player'); setTurnStartedAt(Date.now()); setMessage(`起始字是「${seed}」，請放入第一句成語。`)
    sessionStartedAt.current = Date.now(); recorded.current = false
  }
  const remaining = useTurnCountdown(turnStartedAt, timeLimit, turn === 'player', () => finish('ai', '你的回合逾時，AI 獲勝。'))
  const playerMove = async (move) => {
    if (!accepted.has(move.phrase)) throw new Error(loadingLexicon ? '成語清單仍在載入，請稍後再試。' : '這個詞不在目前的成語判定清單中。')
    if (used.includes(move.phrase)) throw new Error('這句成語本局已使用過。')
    const nextBoard = applyIdiomPlacement(board, move.phrase, move.startRow, move.startColumn, move.direction)
    if (!nextBoard) throw new Error('這個位置無法成立。')
    const nextUsed = [...used, move.phrase]
    const nextScores = { ...scoresRef.current, player: scoresRef.current.player + 1 }
    const currentSession = sessionRef.current
    usedRef.current = nextUsed; scoresRef.current = nextScores
    setBoard(nextBoard); setUsed(nextUsed); setScores(nextScores); setTurn('ai'); setMessage('AI 正在思考…')
    window.setTimeout(() => {
      if (currentSession !== sessionRef.current) return
      const aiMove = chooseIdiomAiMove({ board: nextBoard, usedIdioms: nextUsed, idioms: commonIdioms, difficulty })
      if (!aiMove) { finish('player', 'AI 已無合法位置，你獲勝！'); return }
      const afterAi = applyIdiomPlacement(nextBoard, aiMove.phrase, aiMove.startRow, aiMove.startColumn, aiMove.direction)
      const afterUsed = [...nextUsed, aiMove.phrase]
      const afterScores = { ...nextScores, ai: nextScores.ai + 1 }
      usedRef.current = afterUsed; scoresRef.current = afterScores
      setBoard(afterAi); setUsed(afterUsed); setScores(afterScores)
      setTurn('player'); setTurnStartedAt(Date.now()); setMessage(`AI 使用「${aiMove.phrase}」，輪到你。`)
    }, 550)
  }
  const claimNoMove = () => {
    const move = chooseIdiomAiMove({ board, usedIdioms: used, idioms: commonIdioms, difficulty: 3 })
    if (move) { setMessage(`盤面仍有可用成語，例如可再想想含「${Object.values(board)[0]}」的成語。`); return }
    finish('ai', '你已無合法位置，AI 獲勝。')
  }
  return <div className="yizi-idiom-mode">
    <div className="yizi-settings"><label>AI 難度<select value={difficulty} disabled={turn === 'player' || turn === 'ai'} onChange={(event) => setDifficulty(Number(event.target.value))}>
      <option value="1">易</option><option value="2">中</option><option value="3">難</option></select></label>
      <label>每回合<select value={timeLimit} disabled={turn === 'player' || turn === 'ai'} onChange={(event) => setTimeLimit(Number(event.target.value))}>
        <option value="60">60 秒</option><option value="90">90 秒</option><option value="120">120 秒</option></select></label></div>
    <div className="yizi-round-bar"><button type="button" className="primary" onClick={start}>開新局</button>
      <strong>你 {scores.player} 句 ／ AI {scores.ai} 句</strong>{turn === 'player' && <strong>本回合 {remaining} 秒</strong>}</div>
    <p className={`yizi-feedback ${winner ? 'is-answer' : ''}`}>{message}</p>
    <MoveComposer board={board} disabled={turn !== 'player'} onSubmit={playerMove} />
    {turn === 'player' && <button type="button" className="yizi-no-move" onClick={claimNoMove}>我沒有合法位置</button>}
  </div>
}

function RoomIdiomBoard({ context }) {
  const [seat, setSeat] = useState(() => readYiziRoomSeat())
  const [snapshot, setSnapshot] = useState(null)
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [timeLimit, setTimeLimit] = useState(60)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const recordedRoom = useRef('')

  const refresh = async (currentSeat = seat) => {
    if (!currentSeat) return
    try { setSnapshot(await loadYiziRoom(currentSeat)); setMessage('') }
    catch (error) { setMessage(error.message) }
  }
  useEffect(() => {
    if (!seat) return undefined
    refresh(seat)
    const timer = window.setInterval(() => refresh(seat), 2000)
    return () => window.clearInterval(timer)
  }, [seat])
  useEffect(() => {
    const room = snapshot?.room
    if (room?.status !== 'finished' || recordedRoom.current === room.roomCode) return
    recordedRoom.current = room.roomCode
    const won = room.winnerSeat === snapshot.meSeat
    const me = snapshot.players?.find((player) => player.seatNo === snapshot.meSeat)
    const opponent = snapshot.players?.find((player) => player.seatNo !== snapshot.meSeat)
    const durationMs = snapshot.moves?.length ? Math.max(0, Date.now() - new Date(snapshot.moves[0].placedAt).getTime()) : 0
    if (context.remoteEnabled && context.studentId) recordYiziAttempt({
      questionId: null, gameType: 'idiom_board', modeCode: `room_${room.timeLimitSeconds}`,
      answerText: '', correct: won, score: Number(me?.score || 0) + (won ? 5 : 0), durationMs,
      metadata: { opponent: 'human', result: won ? 'win' : 'loss', roomCode: room.roomCode },
    }).catch(() => null)
    trackLearningActivityAttempt(buildYiziProgress({
      gameType: 'idiom_board', modeCode: `room_${room.timeLimitSeconds}`, score: won ? 100 : 0,
      correctCount: Number(me?.score || 0), questionCount: Math.max(1, Number(me?.score || 0) + Number(opponent?.score || 0)), durationMs,
      attemptKey: `yizi-room:${room.roomCode}:${snapshot.meSeat}`,
      metadata: { opponent: 'human', result: won ? 'win' : 'loss' },
    }))
  }, [context.remoteEnabled, context.studentId, snapshot])
  const perform = async (action) => {
    setBusy(true); setMessage('')
    try {
      const result = await action()
      if (result?.roomCode && result?.seatToken) { setSeat(result); setRoomCode(result.roomCode) }
      else if (result?.room) setSnapshot(result)
    } catch (error) { setMessage(error.message) }
    finally { setBusy(false) }
  }
  const create = () => perform(() => createYiziRoom(nickname))
  const join = () => perform(() => joinYiziRoom(roomCode, nickname))
  const leave = () => perform(async () => {
    await leaveYiziRoom(seat); clearYiziRoomSeat(); setSeat(null); setSnapshot(null); return null
  })
  const room = snapshot?.room
  const me = snapshot?.players?.find((player) => player.seatNo === snapshot.meSeat)
  const opponent = snapshot?.players?.find((player) => player.seatNo !== snapshot.meSeat)
  const myTurn = room?.status === 'playing' && room.currentSeat === snapshot.meSeat
  const remaining = useTurnCountdown(room?.turnStartedAt, room?.timeLimitSeconds || 60, myTurn, () => refresh())
  if (!seat) return <div className="yizi-room-lobby">
    <h3>建立或加入雙人房間</h3><p>訪客也能使用房間；只有登入學生會保留長期戰績。</p>
    <label>暱稱<input value={nickname} maxLength={12} onChange={(event) => setNickname(event.target.value)} /></label>
    <div className="yizi-room-actions"><button type="button" className="primary" disabled={busy || !nickname.trim()} onClick={create}>建立房間</button>
      <span>或</span><label>6 位數房間代碼<input inputMode="numeric" value={roomCode} maxLength={6} onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, ''))} /></label>
      <button type="button" disabled={busy || !nickname.trim() || roomCode.length !== 6} onClick={join}>加入房間</button></div>
    {message && <p className="yizi-feedback is-error">{message}</p>}
  </div>
  return <div className="yizi-room-game">
    <div className="yizi-room-summary"><strong>房間 {seat.roomCode}</strong><span>你：{me?.nickname || '連線中'}（{me?.score || 0} 句）</span>
      <span>對手：{opponent?.nickname || '等待加入'}（{opponent?.score || 0} 句）</span><button type="button" onClick={leave}>離開房間</button></div>
    {room?.status === 'waiting' && <div className="yizi-room-waiting"><p>{opponent ? '兩位玩家已到齊，房主可以開始。' : '請把房間代碼提供給另一位玩家。'}</p>
      {snapshot?.meSeat === 1 && <><label>每回合<select value={timeLimit} onChange={(event) => setTimeLimit(Number(event.target.value))}>
        <option value="60">60 秒</option><option value="90">90 秒</option><option value="120">120 秒</option></select></label>
        <button type="button" className="primary" disabled={!opponent || busy} onClick={() => perform(() => startYiziRoom(seat, timeLimit))}>開始對戰</button></>}</div>}
    {room?.status === 'playing' && <><p className="yizi-feedback">{myTurn ? `輪到你，剩餘 ${remaining} 秒。` : `等待 ${opponent?.nickname || '對手'} 下棋。`}</p>
      <MoveComposer board={room.board || {}} disabled={!myTurn || busy} onSubmit={(move) => perform(() => submitYiziRoomMove(seat, move))} />
      {myTurn && <button type="button" className="yizi-no-move" onClick={() => perform(() => claimNoYiziRoomMove(seat))}>我沒有合法位置</button>}</>}
    {room?.status === 'finished' && <p className="yizi-feedback is-answer">{room.winnerSeat === snapshot.meSeat ? '你獲勝了！' : '本局由對手獲勝。'} 房間結果已結算。</p>}
    {message && <p className="yizi-feedback is-error">{message}</p>}
  </div>
}

export default function YiziIdiomBoard({ context }) {
  const [mode, setMode] = useState('ai')
  return <section className="yizi-game-card yizi-idiom-board-card">
    <h2>隻字片語</h2>
    <p>在 12 × 8 棋盤放入四字成語，必須和既有文字交會；可橫、直、斜及反向排列。</p>
    <div className="yizi-mode-tabs"><button type="button" className={mode === 'ai' ? 'is-active' : ''} onClick={() => setMode('ai')}>和 AI 對戰</button>
      <button type="button" className={mode === 'room' ? 'is-active' : ''} onClick={() => setMode('room')}>雙人房間</button></div>
    {mode === 'ai' ? <SoloIdiomBoard context={context} /> : <RoomIdiomBoard context={context} />}
  </section>
}
