import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, BookOpen, CheckCircle2, Clock3, ExternalLink, HelpCircle,
  Home, RotateCcw, Sparkles, Target, Trophy, Users,
} from 'lucide-react'
import {
  FACTOR_CLASH_ROUND_SIZE,
  areaBoardFor,
  areaPiecesFor,
  createFactorQuestion,
  crossCardsFor,
  factorClashDifficulties,
  factorClashModes,
  pointsForSubmission,
  questionExplanation,
  validateAreaPlacement,
  validateCrossAnswer,
} from '../lib/factorClash.js'
import { resolveFocusTaskId } from '../lib/focusTaskLaunch.js'
import { loadFactorClashAccess, recordFactorClashRound } from '../services/factorClashService.js'
import {
  clearFactorClashSeat, createFactorClashRoom, joinFactorClashRoom, leaveFactorClashRoom,
  loadFactorClashRoom, readFactorClashSeat, releaseFactorClashSeat,
  reportFactorClashQuestion, startFactorClashRoom,
} from '../services/factorClashRoomService.js'
import './factorClash.css'

const tutorialKey = 'sljh.factorClash.hideTutorial.v1'
const videoUrl = 'https://www.youtube.com/watch?v=hJD48t1VUYI&list=PLkNQUBglz8EyGuT67Gw9Vl_0aRzZomr4a&index=12'
const emptyCross = {
  firstCoefficient: null,
  firstConstant: null,
  secondCoefficient: null,
  secondConstant: null,
}

function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds))
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

function Piece({ piece, selected, onSelect }) {
  const label = piece.type === 'x2' ? 'x²' : piece.type === 'x' ? 'x' : '1'
  return (
    <button
      type="button"
      className={`factor-tile tile-${piece.type} ${piece.orientation || ''} ${selected ? 'selected' : ''}`}
      draggable
      onDragStart={(event) => event.dataTransfer.setData('text/factor-piece', piece.id)}
      onClick={() => onSelect(piece.id)}
      aria-pressed={selected}
    >{label}</button>
  )
}

function AreaChallenge({ question, placement, setPlacement, selected, setSelected }) {
  const board = useMemo(() => areaBoardFor(question), [question])
  const [pieces] = useState(() => areaPiecesFor(question))
  const usedIds = new Set(Object.values(placement).map((piece) => piece?.id).filter(Boolean))
  const available = pieces.filter((piece) => !usedIds.has(piece.id))
  const place = (slot, pieceId) => {
    const piece = pieces.find((item) => item.id === pieceId)
    if (!piece) return
    if (piece.type !== slot.type || (slot.type === 'x' && piece.orientation !== slot.orientation)) {
      setSelected(pieceId)
      return
    }
    setPlacement((current) => ({ ...current, [slot.id]: piece }))
    setSelected('')
  }
  const templateColumns = board.columns.map((segment) => segment.kind === 'x' ? 'minmax(52px, 2.2fr)' : 'minmax(30px, 1fr)').join(' ')
  const templateRows = board.rows.map((segment) => segment.kind === 'x' ? 'minmax(52px, 2.2fr)' : 'minmax(30px, 1fr)').join(' ')

  return (
    <div className="factor-workspace">
      <div className="factor-area-panel">
        <p className="factor-board-capacity">固定棋盤上限：<strong>{board.frameText}</strong></p>
        <div className="factor-area-shell">
          <div className="factor-top-labels" style={{ gridTemplateColumns: templateColumns }}>
            {board.columns.map((segment, index) => <span key={`${segment.key}-${index}`}>{segment.kind === 'x' ? 'x' : '1'}</span>)}
          </div>
          <div className="factor-area-body">
            <div className="factor-side-labels" style={{ gridTemplateRows: templateRows }}>
              {board.rows.map((segment, index) => <span key={`${segment.key}-${index}`}>{segment.kind === 'x' ? 'x' : '1'}</span>)}
            </div>
            <div className="factor-area-board" style={{ gridTemplateColumns: templateColumns, gridTemplateRows: templateRows }}>
              {board.slots.map((slot) => {
                const piece = placement[slot.id]
                return (
                  <button
                    type="button"
                    key={slot.id}
                    data-factor-slot={slot.id}
                    className={`factor-area-slot slot-${slot.type}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => place(slot, event.dataTransfer.getData('text/factor-piece'))}
                    onClick={() => piece
                      ? setPlacement((current) => ({ ...current, [slot.id]: undefined }))
                      : selected && place(slot, selected)}
                    aria-label={`${slot.type} 放置格${piece ? '，點選可取回' : ''}`}
                  >{piece && <span className={`placed-${piece.type}`}>{piece.type === 'x2' ? 'x²' : piece.type === 'x' ? 'x' : '1'}</span>}</button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      <section className="factor-tray" aria-label="面積板卡片區">
        <h3>面積板</h3>
        <p>不是每張都要使用。請自行判斷數量，從棋盤左上角開始拼；右側與下方不需要的格子保持空白。</p>
        <div className="factor-piece-list">
          {available.map((piece) => <Piece key={piece.id} piece={piece} selected={selected === piece.id} onSelect={setSelected} />)}
          {!available.length && <span className="factor-tray-empty">卡片都已放上棋盤</span>}
        </div>
      </section>
    </div>
  )
}

function cardText(card) {
  if (!card) return '？'
  if (card.kind === 'linear') return card.value === 1 ? 'x' : `${card.value}x`
  return card.value > 0 ? `＋${card.value}` : `−${Math.abs(card.value)}`
}

function CrossChallenge({ question, answer, setAnswer, selected, setSelected }) {
  const [cards] = useState(() => crossCardsFor(question))
  const usedIds = new Set(Object.values(answer).map((card) => card?.id).filter(Boolean))
  const available = cards.filter((card) => !usedIds.has(card.id))
  const slots = [
    ['firstCoefficient', 'linear', '第一因式的 x 項'],
    ['firstConstant', 'constant', '第一因式的常數'],
    ['secondCoefficient', 'linear', '第二因式的 x 項'],
    ['secondConstant', 'constant', '第二因式的常數'],
  ]
  const place = (field, kind, cardId) => {
    const card = cards.find((item) => item.id === cardId)
    if (!card || card.kind !== kind) return
    setAnswer((current) => ({ ...current, [field]: card }))
    setSelected('')
  }
  return (
    <div className="factor-cross-workspace">
      <div className="factor-cross-answer" aria-label="因式分解作答區">
        {[0, 2].map((offset) => (
          <div className="factor-parenthesis" key={offset}>
            <span>(</span>
            {slots.slice(offset, offset + 2).map(([field, kind, label]) => (
              <button
                type="button"
                key={field}
                className={`factor-card-slot ${answer[field] ? 'filled' : ''}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => place(field, kind, event.dataTransfer.getData('text/factor-card'))}
                onClick={() => answer[field]
                  ? setAnswer((current) => ({ ...current, [field]: null }))
                  : selected && place(field, kind, selected)}
                aria-label={label}
              >{cardText(answer[field])}</button>
            ))}
            <span>)</span>
          </div>
        ))}
      </div>
      <section className="factor-card-bank">
        <h3>係數與常數卡</h3>
        <p>先放 x 項，再放正、負常數。兩個因式前後交換也算正確。</p>
        <div className="factor-card-list">
          {available.map((card) => (
            <button
              type="button"
              key={card.id}
              draggable
              className={`factor-number-card ${card.kind} ${selected === card.id ? 'selected' : ''}`}
              onDragStart={(event) => event.dataTransfer.setData('text/factor-card', card.id)}
              onClick={() => setSelected(card.id)}
            >{cardText(card)}</button>
          ))}
        </div>
      </section>
    </div>
  )
}

function Tutorial({ onClose }) {
  const [hideNextTime, setHideNextTime] = useState(false)
  const close = () => {
    if (hideNextTime) window.localStorage.setItem(tutorialKey, '1')
    onClose()
  }
  return (
    <div className="factor-modal-backdrop" role="presentation">
      <section className="factor-tutorial" role="dialog" aria-modal="true" aria-labelledby="factor-tutorial-title">
        <div className="factor-modal-heading"><div><p>PLAY GUIDE</p><h2 id="factor-tutorial-title">先看懂，再開始交鋒</h2></div><button type="button" onClick={close}>關閉</button></div>
        <div className="factor-tutorial-grid">
          <article><div className="factor-demo-tiles"><span>x²</span><span>x</span><span>1</span></div><h3>天人交戰</h3><p>依據題目思考判斷，需要多少面積板，用相關數量的面積板在棋盤中排出長方形。</p></article>
          <article><div className="factor-demo-cross"><b>( x ＋ 2 )</b><b>( x ＋ 3 )</b></div><h3>十字交戰</h3><p>把展開式還原成兩個一次因式。<strong>前後交換仍是同一答案</strong>。</p></article>
          <article><div className="factor-demo-score"><b>＋3</b><b>＋1</b><b>0</b></div><h3>兩次機會</h3><p>第一次答對得 3 分，第二次答對得 1 分；兩次都錯或時間到才公布答案。</p></article>
          <article><div className="factor-demo-level"><b>基礎 2:00</b><b>進階 3～4:00</b></div><h3>難度與時間</h3><p>進階題會加入 2x、3x、4x。切換分頁時倒數仍會繼續。</p></article>
        </div>
        <a className="factor-video-link" href={videoUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />觀看三師爸影片教學</a>
        <label className="factor-hide-tutorial"><input type="checkbox" checked={hideNextTime} onChange={(event) => setHideNextTime(event.target.checked)} />下次進入時不再自動顯示（仍可按「玩法說明」開啟）</label>
        <button className="factor-primary" type="button" onClick={close}>我了解了，開始設定</button>
      </section>
    </div>
  )
}

function RoomMatch({ seat, snapshot, refresh, onLeave }) {
  const { room, self, opponent } = snapshot
  const question = self.questions?.[self.progress]
  const [placement, setPlacement] = useState({})
  const [crossAnswer, setCrossAnswer] = useState(emptyCross)
  const [selected, setSelected] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [resolved, setResolved] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [earned, setEarned] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [remaining, setRemaining] = useState(question?.seconds || 0)
  const [sending, setSending] = useState(false)
  const [syncError, setSyncError] = useState('')
  const startedAtRef = useRef(Date.now())
  const deadlineRef = useRef(0)

  useEffect(() => {
    setPlacement({}); setCrossAnswer(emptyCross); setSelected(''); setAttempts(0)
    setResolved(false); setFeedback(''); setEarned(0); setTimedOut(false); setSyncError('')
    startedAtRef.current = Date.now()
    if (question) { deadlineRef.current = Date.now() + question.seconds * 1000; setRemaining(question.seconds) }
  }, [question?.id])

  useEffect(() => {
    if (!question || resolved || room.status !== 'playing') return undefined
    const timer = window.setInterval(() => {
      const next = Math.max(0, (deadlineRef.current - Date.now()) / 1000)
      setRemaining(next)
      if (next <= 0) {
        window.clearInterval(timer); setTimedOut(true); setResolved(true)
        setFeedback('時間到，本題不加分。看完解析後繼續下一題。')
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [question, resolved, room.status])

  if (room.status === 'playing' && !question) return <section className="factor-room-result"><CheckCircle2 aria-hidden="true" /><p>你的 10 題已完成</p><h2>等待對手完成</h2><div><strong>{self.nickname}　{self.score} 分</strong><strong>{opponent?.nickname || '對手'}　{opponent?.score || 0} 分</strong></div><p>請保留此頁，系統會自動更新最後結果。</p></section>
  if (room.status === 'finished') {
    const opponentForfeited = opponent?.status === 'forfeited'
    const selfForfeited = self.status === 'forfeited'
    const compare = self.score - (opponent?.score || 0)
      || self.firstTryCorrect - (opponent?.firstTryCorrect || 0)
      || (opponent?.totalElapsedMs || 0) - self.totalElapsedMs
    const result = opponentForfeited ? '對手中離，你獲勝' : selfForfeited ? '你已中離，本局判負'
      : !opponent ? '對手已離開' : compare > 0 ? '你獲勝' : compare < 0 ? '對手獲勝' : '平手'
    return <section className="factor-room-result"><Trophy aria-hidden="true" /><p>對戰結束</p><h2>{result}</h2><div><strong>{self.nickname}　{self.score} 分</strong><strong>{opponent?.nickname || '對手'}　{opponent?.score || 0} 分</strong></div><p>同分時依序比較第一次答對題數，再比較總作答時間。</p><button className="factor-primary" type="button" onClick={onLeave}>離開房間</button></section>
  }

  const submit = () => {
    const correct = room.mode === 'area' ? validateAreaPlacement(question, placement)
      : validateCrossAnswer(question, Object.fromEntries(Object.entries(crossAnswer).map(([field, card]) => [field, card?.value])))
    const attempt = attempts + 1
    setAttempts(attempt)
    if (correct) {
      const score = pointsForSubmission(attempt, true); setEarned(score); setResolved(true)
      setFeedback(`答對了，本題獲得 ${score} 分。`)
    } else if (attempt === 1) setFeedback('還有一次機會，倒數不會重新開始。')
    else { setEarned(0); setResolved(true); setFeedback('兩次都未答對，本題不加分。') }
  }
  const advance = async () => {
    setSending(true)
    try {
      await reportFactorClashQuestion(seat, {
        questionNumber: self.progress + 1, points: earned, firstTry: earned === 3,
        elapsedMs: Math.max(0, Date.now() - startedAtRef.current), timedOut,
      })
      await refresh()
    } catch (error) { setSyncError(error.message || '無法同步本題進度。') } finally { setSending(false) }
  }
  return <section className="factor-room-match">
    <div className="factor-versus-score"><article className="self"><small>你・第 {Math.min(10, self.progress + 1)}／10 題</small><strong>{self.nickname}　{self.score} 分</strong></article><b>VS</b><article><small>{opponent?.online ? '作答中' : '暫時離線'}・第 {Math.min(10, (opponent?.progress || 0) + 1)}／10 題</small><strong>{opponent?.nickname || '等待對手'}　{opponent?.score || 0} 分</strong></article></div>
    <div className="factor-statusbar"><span>{factorClashModes[room.mode].name}・{factorClashDifficulties[room.difficulty].name}</span><span className={remaining <= 20 ? 'danger' : remaining <= 60 ? 'warning' : ''}><Clock3 aria-hidden="true" />{formatTime(remaining)}</span></div>
    <article className="factor-question"><p>{room.mode === 'area' ? '在固定棋盤中，從左上角拼出題目需要的長方形' : '將多項式分解成兩個一次因式'}</p><h2>{room.mode === 'area' ? `${question.factoredText} ＝ ${question.expandedText}` : `${question.expandedText} ＝ ？`}</h2></article>
    {room.mode === 'area' ? <AreaChallenge key={question.id} question={question} placement={placement} setPlacement={setPlacement} selected={selected} setSelected={setSelected} /> : <CrossChallenge key={question.id} question={question} answer={crossAnswer} setAnswer={setCrossAnswer} selected={selected} setSelected={setSelected} />}
    <div className={`factor-feedback ${resolved ? 'resolved' : ''}`}>{feedback || '對手看不到你的題目與棋盤，只會看到分數和進度。'}{resolved && <div className="factor-explanation"><strong>正確答案：{question.factoredText}</strong><span>{questionExplanation(question)}</span></div>}</div>
    {syncError && <p className="factor-room-error">{syncError}</p>}
    <div className="factor-actions">{resolved ? <button className="factor-primary" type="button" disabled={sending} onClick={advance}>{sending ? '同步中……' : self.progress === 9 ? '送出最後一題' : '下一題'}</button> : <button className="factor-primary" type="button" onClick={submit}><CheckCircle2 aria-hidden="true" />確認答案</button>}</div>
  </section>
}

function FactorClashRoom({ onBack }) {
  const [seat, setSeat] = useState(null)
  const [savedSeat] = useState(() => readFactorClashSeat())
  const [snapshot, setSnapshot] = useState(null)
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [joinMode, setJoinMode] = useState('create')
  const [mode, setMode] = useState('area')
  const [difficulty, setDifficulty] = useState('basic')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = useCallback(async (activeSeat = seat) => {
    if (!activeSeat) return
    const data = await loadFactorClashRoom(activeSeat)
    setSnapshot(data)
  }, [seat])
  useEffect(() => {
    if (!seat) return undefined
    refresh(seat).catch((error) => setMessage(error.message))
    const timer = window.setInterval(() => refresh(seat).catch(() => {}), 2000)
    return () => window.clearInterval(timer)
  }, [refresh, seat])

  const enter = async () => {
    setBusy(true); setMessage('')
    try {
      const nextSeat = joinMode === 'create'
        ? await createFactorClashRoom(nickname)
        : await joinFactorClashRoom(roomCode, nickname)
      setSeat(nextSeat)
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  const leave = async () => {
    try { if (seat) await leaveFactorClashRoom(seat) } catch { /* Room may already be closed. */ }
    clearFactorClashSeat(); setSeat(null); setSnapshot(null); onBack()
  }
  if (!seat) return <section className="factor-room-entry">
    <button className="factor-text-button" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" />返回單人練習</button>
    <h2>雙人對戰房間</h2><p>不必登入。房主建立 6 位數代碼，另一位同學輸入相同代碼即可加入。</p>
    {savedSeat && <button type="button" className="factor-reconnect" onClick={() => setSeat(savedSeat)}>重新連回房間 {savedSeat.roomCode}</button>}
    <div className="factor-room-tabs"><button className={joinMode === 'create' ? 'active' : ''} type="button" onClick={() => setJoinMode('create')}>建立房間</button><button className={joinMode === 'join' ? 'active' : ''} type="button" onClick={() => setJoinMode('join')}>加入房間</button></div>
    <label>暱稱<input value={nickname} maxLength={10} onChange={(event) => setNickname(event.target.value)} placeholder="例如：小明" /></label>
    {joinMode === 'join' && <label>6 位數房間代碼<input inputMode="numeric" value={roomCode} maxLength={6} onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" /></label>}
    {message && <p className="factor-room-error">{message}</p>}
    <button className="factor-primary" type="button" disabled={busy || !nickname.trim() || (joinMode === 'join' && roomCode.length !== 6)} onClick={enter}>{busy ? '連線中……' : joinMode === 'create' ? '產生房間代碼' : '加入對戰'}</button>
  </section>
  if (!snapshot) return <section className="factor-room-entry"><p>正在連接房間 {seat.roomCode}……</p></section>
  if (snapshot.room.status !== 'waiting') return <RoomMatch seat={seat} snapshot={snapshot} refresh={refresh} onLeave={leave} />
  return <section className="factor-room-lobby">
    <button className="factor-text-button" type="button" onClick={leave}>離開房間</button><p>房間代碼</p><h2>{seat.roomCode}</h2><div className="factor-lobby-players"><strong>① {snapshot.self.nickname}（你）</strong><strong>② {snapshot.opponent?.nickname || '等待同學加入……'}</strong></div>
    {snapshot.isHost ? <><div className="factor-lobby-settings"><label>玩法<select value={mode} onChange={(event) => setMode(event.target.value)}><option value="area">天人交戰</option><option value="cross">十字交戰</option></select></label><label>難度<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="basic">基礎</option><option value="advanced">進階</option></select></label></div><button className="factor-primary" type="button" disabled={!snapshot.opponent || busy} onClick={async () => { setBusy(true); try { await startFactorClashRoom(seat, mode, difficulty); await refresh() } catch (error) { setMessage(error.message) } finally { setBusy(false) } }}>{busy ? '準備題目中……' : '開始 10 題對戰'}</button><button className="factor-text-button" type="button" onClick={async () => { try { await releaseFactorClashSeat(seat); await refresh() } catch (error) { setMessage(error.message) } }}>釋放離線超過 3 分鐘的座位</button></> : <p>房主開始後，兩人會收到不同題目。</p>}
    {message && <p className="factor-room-error">{message}</p>}
  </section>
}

export default function FactorClash() {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const focusTaskId = resolveFocusTaskId(query, { subjectCode: 'math', activityCode: 'factor_clash_solo' })
  const guestMode = query.get('guest') === '1'
  const [showTutorial, setShowTutorial] = useState(() => query.get('tutorial') !== '0' && window.localStorage.getItem(tutorialKey) !== '1')
  const [screen, setScreen] = useState(() => query.get('versus') === '1' ? 'room' : 'setup')
  const [mode, setMode] = useState('area')
  const [difficulty, setDifficulty] = useState('basic')
  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [placement, setPlacement] = useState({})
  const [crossAnswer, setCrossAnswer] = useState(emptyCross)
  const [selected, setSelected] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [points, setPoints] = useState(0)
  const [firstTryCorrect, setFirstTryCorrect] = useState(0)
  const [secondTryCorrect, setSecondTryCorrect] = useState(0)
  const [resolved, setResolved] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [remaining, setRemaining] = useState(0)
  const [awayCount, setAwayCount] = useState(0)
  const [awaySeconds, setAwaySeconds] = useState(0)
  const [timeoutCount, setTimeoutCount] = useState(0)
  const [access, setAccess] = useState(null)
  const [accessMessage, setAccessMessage] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const deadlineRef = useRef(0)
  const hiddenAtRef = useRef(0)
  const autoStartedRef = useRef(false)
  const savedRoundRef = useRef(false)
  const question = questions[questionIndex]

  const finishQuestion = useCallback((message) => {
    setResolved(true)
    setFeedback(message)
  }, [])

  useEffect(() => {
    if (screen !== 'play' || !question || resolved) return undefined
    deadlineRef.current = Date.now() + question.seconds * 1000
    setRemaining(question.seconds)
    const timer = window.setInterval(() => {
      const next = Math.max(0, (deadlineRef.current - Date.now()) / 1000)
      setRemaining(next)
      if (next <= 0) {
        window.clearInterval(timer)
        setTimeoutCount((value) => value + 1)
        finishQuestion('時間到，本題不加分。請先看解析，再進入下一題。')
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [finishQuestion, question, resolved, screen])

  useEffect(() => {
    const trackVisibility = () => {
      if (document.hidden) hiddenAtRef.current = Date.now()
      else if (hiddenAtRef.current) {
        setAwayCount((value) => value + 1)
        setAwaySeconds((value) => value + Math.round((Date.now() - hiddenAtRef.current) / 1000))
        hiddenAtRef.current = 0
      }
    }
    document.addEventListener('visibilitychange', trackVisibility)
    return () => document.removeEventListener('visibilitychange', trackVisibility)
  }, [])

  useEffect(() => {
    let active = true
    loadFactorClashAccess({ guestMode, focusTaskId })
      .then((result) => {
        if (!active) return
        setAccess(result)
        setDifficulty(result.difficulty)
      })
      .catch((error) => {
        if (!active) return
        setAccess({ role: 'guest', group: 'B', difficulty: 'basic', canChooseDifficulty: true, task: null })
        setAccessMessage(error.message || '目前無法讀取帳號分組，先以訪客模式練習。')
      })
    return () => { active = false }
  }, [focusTaskId, guestMode])

  const resetAnswer = () => {
    setPlacement({})
    setCrossAnswer(emptyCross)
    setSelected('')
    setAttempts(0)
    setResolved(false)
    setFeedback('')
  }

  const startRound = (requestedMode = mode, requestedDifficulty = difficulty) => {
    const usedKeys = new Set()
    const nextQuestions = Array.from({ length: FACTOR_CLASH_ROUND_SIZE }, () => {
      const item = createFactorQuestion({ mode: requestedMode, difficulty: requestedDifficulty, usedKeys })
      usedKeys.add(item.key)
      return item
    })
    setMode(requestedMode)
    setDifficulty(requestedDifficulty)
    setQuestions(nextQuestions)
    setQuestionIndex(0)
    setPoints(0)
    setFirstTryCorrect(0)
    setSecondTryCorrect(0)
    setAwayCount(0)
    setAwaySeconds(0)
    setTimeoutCount(0)
    setSaveMessage('')
    savedRoundRef.current = false
    resetAnswer()
    setScreen('play')
  }

  useEffect(() => {
    if (!access?.task || autoStartedRef.current || showTutorial) return
    autoStartedRef.current = true
    startRound(access.task.mode, access.difficulty)
  }, [access, showTutorial])

  useEffect(() => {
    if (screen !== 'summary' || !access || savedRoundRef.current) return
    savedRoundRef.current = true
    if (access.role !== 'student') {
      setSaveMessage('訪客練習不會寫入學生個人進度。')
      return
    }
    setSaveMessage('正在儲存本輪進度……')
    recordFactorClashRound({
      access, focusTaskId, mode, difficulty, questionCount: questions.length, points,
      firstTryCorrect, secondTryCorrect, timeoutCount, awayCount, awaySeconds,
    }).then((result) => setSaveMessage(result?.taskCompleted ? '進度已儲存，本次每日任務已完成。' : '本輪進度已儲存。'))
      .catch((error) => setSaveMessage(error.message || '本輪已完成，但目前無法儲存進度。'))
  }, [access, awayCount, awaySeconds, difficulty, firstTryCorrect, focusTaskId, mode, points, questionIndex, questions.length, screen, secondTryCorrect, timeoutCount])

  const submit = () => {
    if (!question || resolved) return
    const correct = mode === 'area'
      ? validateAreaPlacement(question, placement)
      : validateCrossAnswer(question, Object.fromEntries(Object.entries(crossAnswer).map(([field, card]) => [field, card?.value])))
    const attemptNumber = attempts + 1
    setAttempts(attemptNumber)
    if (correct) {
      const gained = pointsForSubmission(attemptNumber, true)
      setPoints((value) => value + gained)
      if (attemptNumber === 1) setFirstTryCorrect((value) => value + 1)
      else setSecondTryCorrect((value) => value + 1)
      finishQuestion(`答對了，本題獲得 ${gained} 分。`)
    } else if (attemptNumber === 1) {
      setFeedback('還有一次機會。檢查每一格的面積，或重新做一次交叉相乘。')
    } else {
      finishQuestion('兩次機會已用完，本題不加分。請比較自己的排法與正確答案。')
    }
  }

  const nextQuestion = () => {
    if (questionIndex + 1 >= questions.length) setScreen('summary')
    else {
      setQuestionIndex((value) => value + 1)
      resetAnswer()
    }
  }

  const timeClass = remaining <= 20 ? 'danger' : remaining <= 60 ? 'warning' : ''
  const hubUrl = './?subject=math'
  return (
    <main className="factor-page">
      <nav className="factor-nav"><a href={hubUrl}><ArrowLeft aria-hidden="true" />返回數學科</a><button type="button" onClick={() => setShowTutorial(true)}><HelpCircle aria-hidden="true" />玩法說明</button></nav>
      <header className="factor-hero"><div><p>ALGEBRA TILE BATTLE</p><h1>因式交鋒：天人 × 十字</h1><span>從面積模型走向十字交乘，不只記口訣。</span></div><div className="factor-hero-equation">x² ＋ 5x ＋ 6<br /><b>＝ (x＋2)(x＋3)</b></div></header>

      {accessMessage && <p className="factor-system-message">{accessMessage}</p>}

      {screen === 'setup' && <section className="factor-setup">
        <div className="factor-mode-grid">
          {Object.values(factorClashModes).map((item) => <button key={item.code} type="button" className={mode === item.code ? 'active' : ''} onClick={() => setMode(item.code)}><span>{item.code === 'area' ? '▦' : '×'}</span><h2>{item.name}</h2><p>{item.description}</p></button>)}
        </div>
        <div className="factor-difficulty">
          <h2>選擇難度</h2>
          {Object.values(factorClashDifficulties).map((item) => <button key={item.code} type="button" disabled={access?.role === 'student'} className={difficulty === item.code ? 'active' : ''} onClick={() => setDifficulty(item.code)}><strong>{item.name}</strong><small>{item.code === 'basic' ? 'x 的係數為 1' : '加入 2x、3x、4x'}</small><span>{mode === 'area' ? item.areaSeconds / 60 : item.crossSeconds / 60} 分鐘／題</span></button>)}
        </div>
        {access?.role === 'student' && <p className="factor-group-note">已依數學 {access.group} 組自動設定為「{factorClashDifficulties[difficulty].name}」。每日任務會直接進入系統指定的玩法。</p>}
        <div className="factor-start-row"><button className="factor-primary" type="button" onClick={() => startRound()}><Sparkles aria-hidden="true" />開始 5 題單人練習</button><button className="factor-versus" type="button" onClick={() => setScreen('room')}><Users aria-hidden="true" />建立或加入雙人房間</button></div>
      </section>}

      {screen === 'room' && <FactorClashRoom onBack={() => setScreen('setup')} />}

      {screen === 'play' && question && <section className="factor-game">
        <div className="factor-statusbar"><span><Target aria-hidden="true" />第 {questionIndex + 1}／{questions.length} 題</span><span>得分 <b>{points}</b>／15</span><span className={timeClass}><Clock3 aria-hidden="true" />{formatTime(remaining)}</span></div>
        <article className="factor-question">
          <p>{mode === 'area' ? '在固定棋盤中，從左上角拼出題目需要的長方形' : '將多項式分解成兩個一次因式'}</p>
          <h2>{mode === 'area' ? `${question.factoredText} ＝ ${question.expandedText}` : `${question.expandedText} ＝ ？`}</h2>
        </article>
        {mode === 'area'
          ? <AreaChallenge key={question.id} question={question} placement={placement} setPlacement={setPlacement} selected={selected} setSelected={setSelected} />
          : <CrossChallenge key={question.id} question={question} answer={crossAnswer} setAnswer={setCrossAnswer} selected={selected} setSelected={setSelected} />}
        <div className={`factor-feedback ${resolved ? 'resolved' : ''}`} aria-live="polite">
          {feedback || (mode === 'area' ? '只放需要的面積板，其餘格子留白；完成後按「確認答案」。' : '完成排放後按「確認答案」。第一次答對可得 3 分。')}
          {resolved && <div className="factor-explanation"><strong>正確答案：{question.factoredText}</strong><span>{questionExplanation(question)}</span></div>}
        </div>
        <div className="factor-actions"><button type="button" onClick={resetAnswer} disabled={resolved}><RotateCcw aria-hidden="true" />重新排放</button>{resolved ? <button className="factor-primary" type="button" onClick={nextQuestion}>{questionIndex + 1 === questions.length ? '查看本輪結果' : '下一題'}</button> : <button className="factor-primary" type="button" onClick={submit}><CheckCircle2 aria-hidden="true" />確認答案</button>}</div>
      </section>}

      {screen === 'summary' && <section className="factor-summary"><Trophy aria-hidden="true" /><p>本輪完成</p><h2>{points}／15 分</h2><div><span>第一次答對<strong>{firstTryCorrect} 題</strong></span><span>第二次答對<strong>{secondTryCorrect} 題</strong></span><span>離開頁面<strong>{awayCount} 次・{awaySeconds} 秒</strong></span></div><p>每日任務以完成 5 題為準，不要求滿分；分數用來觀察熟練度。</p>{saveMessage && <p className="factor-save-message">{saveMessage}</p>}<div className="factor-summary-actions"><button className="factor-primary" type="button" onClick={() => startRound()}><RotateCcw aria-hidden="true" />再練一輪</button><a href={hubUrl}><Home aria-hidden="true" />返回數學科</a></div></section>}
      <footer className="factor-credit"><BookOpen aria-hidden="true" />線上學習活動・陳少軍老師規劃</footer>
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
    </main>
  )
}
