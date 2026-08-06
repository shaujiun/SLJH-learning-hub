import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bot,
  Check,
  Clock3,
  Copy,
  Crown,
  DoorOpen,
  LoaderCircle,
  LogIn,
  Radio,
  Swords,
  Users,
  WifiOff,
  X,
} from 'lucide-react'
import {
  battleDefaultQuestionCount,
  createPeriodicBattleQuestions,
  secondsUntil,
} from '../lib/periodicBattle.js'
import {
  getElementsForLevel,
  periodicLevels,
  periodicModes,
} from '../lib/periodicTable.js'
import {
  advancePeriodicBattle,
  answerPeriodicBattle,
  buzzPeriodicBattle,
  createPeriodicBattle,
  fillPeriodicBattleAi,
  heartbeatPeriodicBattle,
  joinPeriodicBattle,
  loadPeriodicBattle,
  startPeriodicBattle,
  subscribePeriodicBattle,
} from '../services/periodicBattleService.js'
import PeriodicTableGrid from './PeriodicTableGrid.jsx'

const questionCountOptions = {
  2: [10, 20, 30, 40],
  4: [8, 12, 16, 20, 24, 28, 32, 36, 40],
}

function Countdown({ deadline, label }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 150)
    return () => window.clearInterval(timer)
  }, [])
  return <span className="battle-countdown"><Clock3 aria-hidden="true" />{label} {secondsUntil(deadline, now)} 秒</span>
}

function PlayerCard({ player, isMe, isHost, active, buzzer }) {
  return (
    <article className={`battle-player ${isMe ? 'is-me' : ''} ${active ? 'is-active' : ''}`}>
      <span className="battle-player-avatar">{player.isAi ? <Bot aria-hidden="true" /> : player.displayName.slice(0, 1)}</span>
      <div>
        <strong>{player.displayName}{isMe ? '（你）' : ''}</strong>
        <small>
          {player.teamCode ? `${player.teamCode} 隊・` : ''}第 {player.seatNumber} 位
          {!player.connected && !player.isAi ? '・暫時離線' : ''}
        </small>
      </div>
      {isHost && <Crown aria-label="房主" />}
      {buzzer && <Radio className="battle-buzzer-mark" aria-label="搶答者" />}
    </article>
  )
}

function BattleMenu({ context, onRoom }) {
  const [menu, setMenu] = useState('choose')
  const [playerLimit, setPlayerLimit] = useState(2)
  const [level, setLevel] = useState(context.student ? context.level.code : 'beginner')
  const [mode, setMode] = useState('mixed')
  const [questionCount, setQuestionCount] = useState(battleDefaultQuestionCount)
  const [roomCode, setRoomCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (action) => {
    setBusy(true)
    setError('')
    try {
      onRoom(await action())
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(false)
    }
  }

  const createRoom = () => run(() => {
    const questions = createPeriodicBattleQuestions({ level, mode, count: questionCount })
    return createPeriodicBattle({ playerLimit, level, mode, questionCount, questions })
  })

  const updatePlayerLimit = (value) => {
    const next = Number(value)
    setPlayerLimit(next)
    if (!questionCountOptions[next].includes(questionCount)) setQuestionCount(20)
  }

  if (menu === 'choose') {
    return (
      <section className="battle-menu-card">
        <p className="periodic-eyebrow">REALTIME BATTLE</p>
        <h2>選擇對戰方式</h2>
        <p>房間採即時搶答，分數可低於 0 分；對戰不計入每日任務與個人升級紀錄。</p>
        <div className="battle-menu-actions">
          <button type="button" onClick={() => setMenu('create')}><DoorOpen aria-hidden="true" /><strong>建立房間</strong><span>設定人數、等級與題數</span></button>
          <button type="button" onClick={() => setMenu('join')}><LogIn aria-hidden="true" /><strong>輸入代碼</strong><span>加入同學建立的房間</span></button>
        </div>
      </section>
    )
  }

  return (
    <section className="battle-menu-card battle-form-card">
      <button className="battle-text-button" type="button" onClick={() => { setMenu('choose'); setError('') }}>返回選擇</button>
      <p className="periodic-eyebrow">{menu === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}</p>
      <h2>{menu === 'create' ? '建立元素對戰房間' : '加入元素對戰房間'}</h2>
      {menu === 'create' ? (
        <div className="battle-form-grid">
          <label>對戰人數<select value={playerLimit} onChange={(event) => updatePlayerLimit(event.target.value)}><option value={2}>2 人對戰</option><option value={4}>4 人團隊對戰</option></select></label>
          <label>題目等級<select value={level} onChange={(event) => setLevel(event.target.value)}>{Object.values(periodicLevels).map((item) => <option value={item.code} key={item.code}>{item.label}</option>)}</select></label>
          <label>題目模式<select value={mode} onChange={(event) => setMode(event.target.value)}>{Object.values(periodicModes).map((item) => <option value={item.code} key={item.code}>{item.label}</option>)}</select></label>
          <label>總題數<select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>{questionCountOptions[playerLimit].map((count) => <option value={count} key={count}>{count} 題{count === 20 ? '（建議）' : ''}</option>)}</select></label>
          <button className="periodic-primary-button battle-submit" type="button" disabled={busy} onClick={createRoom}>{busy ? <LoaderCircle className="spin-icon" /> : <Swords />}產生 4 位數代碼</button>
        </div>
      ) : (
        <div className="battle-join-form">
          <label htmlFor="battle-room-code">4 位數房間代碼</label>
          <input id="battle-room-code" inputMode="numeric" maxLength={4} value={roomCode} onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="例如：0624" />
          <button className="periodic-primary-button" type="button" disabled={busy || roomCode.length !== 4} onClick={() => run(() => joinPeriodicBattle(roomCode))}>{busy ? <LoaderCircle className="spin-icon" /> : <LogIn />}加入房間</button>
        </div>
      )}
      {error && <p className="battle-error" role="alert">{error}</p>}
    </section>
  )
}

function BattleLobby({ room, onUpdate }) {
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const full = room.players.length === room.playerLimit

  const run = async (key, action) => {
    setBusy(key)
    setNotice('')
    try { onUpdate(await action()) } catch (error) { setNotice(error.message) } finally { setBusy('') }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code)
      setNotice('房間代碼已複製。')
    } catch {
      setNotice(`請將房間代碼 ${room.code} 告訴同學。`)
    }
  }

  return (
    <section className="battle-room-card">
      <div className="battle-room-heading">
        <div><p className="periodic-eyebrow">WAITING ROOM</p><h2>等待同學加入</h2></div>
        <button className="battle-code" type="button" onClick={copyCode}><span>房間代碼</span><strong>{room.code}</strong><Copy aria-hidden="true" /></button>
      </div>
      <div className={`battle-player-grid players-${room.playerLimit}`}>
        {Array.from({ length: room.playerLimit }, (_, index) => {
          const player = room.players.find((item) => item.seatNumber === index + 1)
          return player
            ? <PlayerCard player={player} isMe={player.id === room.mePlayerId} isHost={index === 0 && room.isHost} key={player.id} />
            : <article className="battle-player empty-player" key={index}><span><Users /></span><strong>等待加入</strong></article>
        })}
      </div>
      <div className="battle-room-settings">
        <span>{room.playerLimit} 人對戰</span><span>{periodicLevels[room.level]?.label}</span><span>{periodicModes[room.mode]?.label}</span><span>{room.questionCount} 題</span>
      </div>
      {room.isHost ? (
        <div className="battle-lobby-actions">
          {!full && <button className="periodic-secondary-button" type="button" disabled={Boolean(busy)} onClick={() => run('ai', () => fillPeriodicBattleAi(room.id))}>{busy === 'ai' ? <LoaderCircle className="spin-icon" /> : <Bot />}AI 補上一個空位</button>}
          <button className="periodic-primary-button" type="button" disabled={!full || Boolean(busy)} onClick={() => run('start', () => startPeriodicBattle(room.id))}>{busy === 'start' ? <LoaderCircle className="spin-icon" /> : <Swords />}開始對戰</button>
        </div>
      ) : <p className="battle-wait-note"><LoaderCircle className="spin-icon" />人數到齊後，由房主開始對戰。</p>}
      {notice && <p className="battle-notice" role="status">{notice}</p>}
    </section>
  )
}

function BattleScoreboard({ room }) {
  const teams = ['A', 'B'].map((code) => ({
    code,
    score: code === 'A' ? room.teamAScore : room.teamBScore,
    players: room.players.filter((player) => player.teamCode === code),
  }))
  return <div className="battle-scoreboard">{teams.map((team) => <article className={`team-${team.code.toLowerCase()}`} key={team.code}><span>{room.playerLimit === 2 ? team.players[0]?.displayName : `${team.code} 隊`}</span><strong>{team.score}</strong><small>{room.playerLimit === 4 ? team.players.map((player) => player.displayName).join('、') : '分'}</small></article>)}</div>
}

function BattlePlaying({ room, onUpdate }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const me = room.players.find((player) => player.id === room.mePlayerId)
  const active = room.players.find((player) => player.id === room.activePlayerId)
  const allowedNumbers = useMemo(() => getElementsForLevel(room.level).map((element) => element.number), [room.level])
  const canBuzz = room.status === 'buzzing' && room.eligibleBuzzerSeats.includes(me?.seatNumber) && !me?.isAi
  const canAnswer = room.status === 'answering' && room.activePlayerId === room.mePlayerId
  const canReplaceDisconnected = room.isHost && room.players.some((player) => !player.isAi && !player.connected && player.id !== room.mePlayerId)

  const submit = async (action) => {
    if (busy) return
    setBusy(true)
    setError('')
    try { onUpdate(await action()) } catch (nextError) { setError(nextError.message) } finally { setBusy(false) }
  }

  if (room.status === 'finished') {
    const result = room.teamAScore === room.teamBScore ? '雙方平手' : room.teamAScore > room.teamBScore ? 'A 方獲勝' : 'B 方獲勝'
    return <section className="battle-room-card battle-finished"><Swords aria-hidden="true" /><p className="periodic-eyebrow">FINAL RESULT</p><h2>{result}</h2><BattleScoreboard room={room} /><p>本次對戰屬於自由練習，不影響每日任務與個人等級。</p></section>
  }

  return (
    <section className="battle-room-card battle-playing-card">
      <BattleScoreboard room={room} />
      <div className="battle-progress"><span>第 {room.currentQuestion}／{room.questionCount} 題</span><div><i style={{ width: `${(room.currentQuestion / room.questionCount) * 100}%` }} /></div></div>
      <div className="battle-question-heading"><p>{room.question?.prompt}</p>{room.status === 'thinking' && <Countdown deadline={room.phaseDeadline} label="思考時間" />}{room.status === 'answering' && <Countdown deadline={room.phaseDeadline} label="作答時間" />}</div>

      {room.status === 'thinking' && <div className="battle-phase-message"><Clock3 /><strong>先想答案，倒數結束後才會開放搶答。</strong></div>}
      {room.status === 'buzzing' && (
        canBuzz
          ? <button className="battle-buzzer-button" type="button" disabled={busy} onClick={() => submit(() => buzzPeriodicBattle(room.id))}><Radio />搶答</button>
          : <div className="battle-phase-message"><Users /><strong>{room.eligibleBuzzerSeats.includes(me?.seatNumber) ? '等待同學搶答…' : '這一回合由其他同學搶答。'}</strong></div>
      )}
      {room.status === 'answering' && canAnswer && room.question?.mode === 'locate' && <PeriodicTableGrid allowedNumbers={allowedNumbers} targetNumber={null} selectedNumber={null} answered={busy} onSelect={(answer) => submit(() => answerPeriodicBattle(room.id, answer))} />}
      {room.status === 'answering' && canAnswer && room.question?.mode !== 'locate' && <div className="periodic-answer-grid battle-answer-grid">{room.question?.choices?.map((choice) => <button type="button" disabled={busy} onClick={() => submit(() => answerPeriodicBattle(room.id, choice.value))} key={choice.key}>{choice.value}</button>)}</div>}
      {room.status === 'answering' && !canAnswer && <div className="battle-phase-message"><Radio /><strong>{active?.displayName || '同學'}正在作答</strong><span>若答錯或超時，系統會依補答順序交給下一位。</span></div>}
      {room.status === 'resolved' && <div className={`battle-result-message ${room.lastResult?.isCorrect ? 'correct' : 'wrong'}`}>{room.lastResult?.isCorrect ? <Check /> : <X />}<div><strong>{room.lastResult?.isCorrect ? `${room.lastResult.displayName} 答對了` : '本題無人答對'}</strong><span>正確答案：{room.lastResult?.correctAnswer}　{room.lastResult?.scoreDelta > 0 ? `＋${room.lastResult.scoreDelta}` : room.lastResult?.scoreDelta} 分</span></div></div>}
      <div className="battle-live-players">{room.players.map((player) => <PlayerCard player={player} isMe={player.id === room.mePlayerId} isHost={room.isHost && player.id === room.mePlayerId} active={player.id === room.activePlayerId} buzzer={player.id === room.buzzerPlayerId} key={player.id} />)}</div>
      {canReplaceDisconnected && <button className="periodic-secondary-button battle-replace-button" type="button" disabled={busy} onClick={() => submit(() => fillPeriodicBattleAi(room.id))}><Bot />以 AI 接替已離線超過 30 秒的座位</button>}
      {error && <p className="battle-error" role="alert">{error}</p>}
      {!me?.connected && <p className="battle-error"><WifiOff />連線暫時中斷，座位會保留 30 秒。</p>}
    </section>
  )
}

export default function PeriodicBattle({ context, onExit }) {
  const [room, setRoom] = useState(null)
  const [error, setError] = useState('')
  const advancing = useRef(false)

  useEffect(() => {
    if (!room?.id) return undefined
    const refresh = async () => {
      try { setRoom(await loadPeriodicBattle(room.id)) } catch (nextError) { setError(nextError.message) }
    }
    return subscribePeriodicBattle(room.id, refresh)
  }, [room?.id])

  useEffect(() => {
    if (!room?.id) return undefined
    const heartbeat = window.setInterval(async () => {
      try { setRoom(await heartbeatPeriodicBattle(room.id)) } catch { /* 下一次心跳再重試 */ }
    }, 10000)
    return () => window.clearInterval(heartbeat)
  }, [room?.id])

  useEffect(() => {
    if (!room?.id || room.status === 'lobby' || room.status === 'finished' || room.status === 'closed') return undefined
    const timer = window.setInterval(async () => {
      if (advancing.current) return
      advancing.current = true
      try { setRoom(await advancePeriodicBattle(room.id)) } catch { /* 其他裝置可能已先推進 */ } finally { advancing.current = false }
    }, 500)
    return () => window.clearInterval(timer)
  }, [room?.id, room?.status])

  return (
    <>
      <div className="battle-top-actions"><button className="periodic-secondary-button" type="button" onClick={onExit}>返回單人練習</button>{room && <span><Radio />即時房間 {room.code}</span>}</div>
      {!room ? <BattleMenu context={context} onRoom={setRoom} /> : room.status === 'lobby' ? <BattleLobby room={room} onUpdate={setRoom} /> : <BattlePlaying room={room} onUpdate={setRoom} />}
      {error && <p className="battle-error" role="alert">{error}</p>}
    </>
  )
}
