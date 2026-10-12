import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Home,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import {
  calculatePythagorasTriangleSize,
  createPythagorasDeck,
  isPythagorasAnswerCorrect,
  normalizePythagorasGroup,
  pythagorasValueNumber,
  pythagorasValueText,
} from '../lib/pythagorasChallenge.js'
import { resolveFocusTaskId } from '../lib/focusTaskLaunch.js'
import { isGuestMode, learningHubUrl } from '../lib/guestPractice.js'
import {
  loadPythagorasChallengeAccess,
  recordPythagorasChallengeAttempt,
} from '../services/pythagorasChallengeService.js'
import './pythagorasChallenge.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'
const defaultTargetCorrectCount = 10

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`
}

function scoreStorageKey(group) {
  return `sljh.pythagorasChallenge.${normalizePythagorasGroup(group)}.topFive.v1`
}

function readScores(group) {
  try {
    const rows = JSON.parse(window.localStorage.getItem(scoreStorageKey(group)) || '[]')
    return Array.isArray(rows) ? rows.slice(0, 5) : []
  } catch {
    return []
  }
}

function writeScore(group, row) {
  const rows = [...readScores(group), row]
    .sort((left, right) => right.score - left.score || left.seconds - right.seconds || left.attempts - right.attempts)
    .slice(0, 5)
  window.localStorage.setItem(scoreStorageKey(group), JSON.stringify(rows))
  return rows
}

function RadicalValue({ value }) {
  if (!value) return <span className="pythagoras-unknown">？</span>
  if (value.kind === 'integer') return <span>{value.value}</span>
  return (
    <span className="pythagoras-radical" aria-label={pythagorasValueText(value)}>
      {value.coefficient !== 1 && <span className="pythagoras-radical-coefficient">{value.coefficient}</span>}
      <span className="pythagoras-root-symbol">√</span>
      <span className="pythagoras-radicand">{value.radicand}</span>
    </span>
  )
}

function TriangleValue({ x, y, value, label }) {
  return (
    <foreignObject x={x - 58} y={y - 25} width="116" height="50">
      <div className="pythagoras-side-value" title={`${label}：${pythagorasValueText(value)}`}>
        <RadicalValue value={value} />
      </div>
    </foreignObject>
  )
}

function TriangleDiagram({ question }) {
  const numericA = pythagorasValueNumber(question.exactSides.a)
  const numericB = pythagorasValueNumber(question.exactSides.b)
  const { width, height, preservedRatio } = calculatePythagorasTriangleSize(numericA, numericB)
  const x0 = (560 - width) / 2
  const y0 = 270
  const x1 = x0 + width
  const y1 = y0 - height
  const hypotenuseMidX = (x0 + x1) / 2 + 24
  const hypotenuseMidY = (y0 + y1) / 2 - 13
  return (
    <div className="pythagoras-diagram-wrap">
      <svg viewBox="0 0 560 310" role="img" aria-label="直角三角形邊長示意圖">
        <defs>
          <linearGradient id="pythagoras-fill" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#dff7f0" />
            <stop offset="1" stopColor="#dfe9ff" />
          </linearGradient>
        </defs>
        <polygon points={`${x0},${y0} ${x1},${y0} ${x0},${y1}`} fill="url(#pythagoras-fill)" stroke="#244563" strokeWidth="5" strokeLinejoin="round" />
        <path d={`M ${x0} ${y0 - 25} L ${x0 + 25} ${y0 - 25} L ${x0 + 25} ${y0}`} fill="none" stroke="#d6782f" strokeWidth="4" />
        <TriangleValue x={(x0 + x1) / 2} y={y0 + 22} value={question.sides.a} label="股長" />
        <TriangleValue x={x0 - 33} y={(y0 + y1) / 2} value={question.sides.b} label="股長" />
        <TriangleValue x={hypotenuseMidX} y={hypotenuseMidY} value={question.sides.c} label="斜邊" />
      </svg>
      <small>{preservedRatio
        ? '直角以橘色標示；圖形已依邊長比例縮放。'
        : '直角以橘色標示；此題比例差距較大，短邊已略微放大以便閱讀。'}</small>
    </div>
  )
}

function ScoreList({ scores }) {
  if (!scores.length) return <p className="pythagoras-empty-score">完成挑戰後，本裝置前五名會顯示在這裡。</p>
  return (
    <ol className="pythagoras-score-list">
      {scores.map((row, index) => (
        <li key={`${row.name}-${row.savedAt}-${index}`}>
          <span className="pythagoras-rank">{index + 1}</span>
          <span><strong>{row.name}</strong><small>{row.group} 組・嘗試 {row.attempts} 題</small></span>
          <b>{formatTime(row.seconds)}</b>
        </li>
      ))}
    </ol>
  )
}

export default function PythagorasChallenge() {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const guestMode = isGuestMode()
  const focusTaskId = guestMode ? '' : resolveFocusTaskId(query, {
    subjectCode: 'math',
    activityCode: 'pythagoras_challenge',
  })
  const [access, setAccess] = useState(() => (guestMode
    ? { role: 'guest', group: 'B', canChooseGroup: true, displayName: '' }
    : null))
  const [loadError, setLoadError] = useState('')
  const [group, setGroup] = useState('B')
  const [phase, setPhase] = useState('start')
  const [deck, setDeck] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [scores, setScores] = useState(() => readScores('B'))
  const [playerName, setPlayerName] = useState('')
  const [saved, setSaved] = useState(false)
  const [challengeTarget, setChallengeTarget] = useState(defaultTargetCorrectCount)
  const [taskSaveState, setTaskSaveState] = useState({ status: 'idle', message: '' })
  const inputRef = useRef(null)

  useEffect(() => {
    let active = true
    loadPythagorasChallengeAccess({ guestMode, focusTaskId })
      .then((result) => {
        if (!active) return
        setAccess(result)
        setGroup(result.group)
        setScores(readScores(result.group))
        setPlayerName(result.displayName || '')
        const nextTarget = Math.max(1, Number(result.task?.questionCount) || defaultTargetCorrectCount)
        setChallengeTarget(nextTarget)
        if (result.role === 'student') startChallenge(result.group, nextTarget)
      })
      .catch((error) => { if (active) setLoadError(error.message || '無法讀取數學分組。') })
    return () => { active = false }
  }, [guestMode, focusTaskId])

  useEffect(() => {
    if (phase !== 'playing' || !startedAt) return undefined
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250)
    return () => window.clearInterval(timer)
  }, [phase, startedAt])

  const question = deck[questionIndex]
  const progress = Math.min(100, (correctCount / challengeTarget) * 100)
  const score = Math.min(100, Math.round((correctCount / challengeTarget) * 100))

  function chooseGroup(nextGroup) {
    if (!access?.canChooseGroup || phase !== 'start') return
    const normalized = normalizePythagorasGroup(nextGroup)
    setGroup(normalized)
    setScores(readScores(normalized))
  }

  function startChallenge(nextGroup = group, nextTarget = challengeTarget) {
    const normalizedGroup = normalizePythagorasGroup(nextGroup)
    const normalizedTarget = Math.max(1, Number(nextTarget) || defaultTargetCorrectCount)
    setGroup(normalizedGroup)
    setChallengeTarget(normalizedTarget)
    setDeck(createPythagorasDeck(normalizedGroup, Math.max(24, normalizedTarget * 2)))
    setQuestionIndex(0)
    setAnswer('')
    setFeedback(null)
    setCorrectCount(0)
    setAttempts(0)
    setElapsed(0)
    setStartedAt(Date.now())
    setSaved(false)
    setTaskSaveState({ status: 'idle', message: '' })
    setPhase('playing')
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function submitAnswer(event) {
    event.preventDefault()
    if (!answer.trim() || feedback || !question) return
    const correct = isPythagorasAnswerCorrect(answer, question)
    setAttempts((value) => value + 1)
    if (correct) {
      const nextCorrect = correctCount + 1
      setCorrectCount(nextCorrect)
      setFeedback({ correct: true, message: '答對了！這一步判斷得很準確。' })
    } else {
      setFeedback({ correct: false, revealed: false, message: '這次還沒答對。先確認題目問的是斜邊還是股長。' })
    }
  }

  function revealAnswer() {
    if (!feedback || feedback.correct) return
    setFeedback({
      ...feedback,
      revealed: true,
      message: `本題答案是 ${question.answerText}。${question.explain}。`,
    })
  }

  async function finishChallenge() {
    const finalElapsed = Math.floor((Date.now() - startedAt) / 1000)
    setElapsed(finalElapsed)
    setPhase('complete')
    if (access?.role !== 'student' || !focusTaskId) return

    setTaskSaveState({ status: 'saving', message: '正在儲存每日任務完成紀錄……' })
    try {
      const result = await recordPythagorasChallengeAttempt({
        focusTaskId,
        trackStudentProgress: true,
        score: 100,
        correctCount: challengeTarget,
        questionCount: challengeTarget,
      })
      setTaskSaveState({
        status: result?.passed ? 'saved' : 'not-passed',
        message: result?.passed ? '每日任務已完成並儲存。' : '本次紀錄已儲存，但尚未達到任務標準。',
      })
    } catch (error) {
      setTaskSaveState({ status: 'error', message: error.message || '無法儲存每日任務。' })
    }
  }

  function nextQuestion() {
    if (!feedback || (!feedback.correct && !feedback.revealed)) return
    if (correctCount >= challengeTarget) {
      finishChallenge()
      return
    }
    let nextDeck = deck
    let nextIndex = questionIndex + 1
    if (nextIndex >= nextDeck.length) {
      nextDeck = [...nextDeck, ...createPythagorasDeck(group, 24)]
      setDeck(nextDeck)
    }
    setQuestionIndex(nextIndex)
    setAnswer('')
    setFeedback(null)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function insertRoot() {
    const input = inputRef.current
    if (!input || feedback) return
    const start = input.selectionStart ?? answer.length
    const end = input.selectionEnd ?? start
    const next = `${answer.slice(0, start)}√${answer.slice(end)}`
    setAnswer(next)
    window.setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + 1, start + 1)
    }, 0)
  }

  function saveResult() {
    if (saved) return
    const nextScores = writeScore(group, {
      name: playerName.trim().slice(0, 18) || '匿名玩家',
      group,
      score,
      attempts,
      seconds: elapsed,
      savedAt: new Date().toISOString(),
    })
    setScores(nextScores)
    setSaved(true)
  }

  if (!access && !loadError) {
    return <main className="pythagoras-center"><div className="pythagoras-loader" /><h1>正在準備挑戰題目</h1></main>
  }

  return (
    <div className="pythagoras-page">
      <nav className="pythagoras-nav" aria-label="學習系統導覽">
        <a href={learningHubUrl('?subject=math')}><Home aria-hidden="true" />返回數學學習區</a>
        <a href={contactBookUrl}><ArrowLeft aria-hidden="true" />返回聯絡簿</a>
      </nav>

      <header className="pythagoras-hero">
        <div>
          <p>PYTHAGOREAN QUEST</p>
          <h1>畢氏定理挑戰賽 <span>（測驗類）</span></h1>
          <p className="pythagoras-credit">由鍾育潤老師設計</p>
        </div>
        <div className="pythagoras-hero-mark" aria-hidden="true"><span>a²</span><b>＋</b><span>b²</span><b>＝</b><span>c²</span></div>
      </header>

      {loadError && <div className="pythagoras-load-warning" role="status">無法自動讀取分組，暫以 B 組開放預覽：{loadError}</div>}

      {phase === 'start' && <main className="pythagoras-start-layout">
        <section className="pythagoras-start-card">
          <div className="pythagoras-start-icon"><Target aria-hidden="true" /></div>
          <p className="pythagoras-kicker">已知兩邊，找出第三邊</p>
          <h2>準備好辨認斜邊與股長了嗎？</h2>
          <p>完成 10 題正確答案即可通關。題目會交錯出現求斜邊、求股長、特殊邊長關係與容易混淆平方和、平方差的題型。</p>

          <div className="pythagoras-group-picker" aria-label="難度分組">
            {['A', 'B'].map((option) => (
              <button
                type="button"
                key={option}
                aria-label={`${option} 組`}
                className={group === option ? 'is-selected' : ''}
                onClick={() => chooseGroup(option)}
                disabled={!access?.canChooseGroup}
                aria-pressed={group === option}
              >
                <strong>{option} 組</strong>
              </button>
            ))}
          </div>
          {!access?.canChooseGroup && <p className="pythagoras-assigned-group">系統已依你的數學分組設定為 {group} 組。</p>}
          <button className="pythagoras-primary" type="button" onClick={() => startChallenge()}><Play aria-hidden="true" />開始挑戰</button>
        </section>

        <aside className="pythagoras-rule-card">
          <h2><Lightbulb aria-hidden="true" />作答提醒</h2>
          <div className="pythagoras-formula">a² ＋ b² ＝ c²</div>
          <ul>
            <li>斜邊一定在直角的對面，也是三邊中最長的一邊。</li>
            <li>求斜邊使用平方和；求其中一股使用平方差。</li>
            <li><strong>算其中一股長時，可以用平方差公式，會更快喔！</strong></li>
            <li>根號答案可輸入 <code>√41</code>、<code>2√3</code>、<code>sqrt(41)</code> 或小數近似值。</li>
          </ul>
          <h3><Trophy aria-hidden="true" />{group} 組本裝置紀錄</h3>
          <ScoreList scores={scores} />
        </aside>
      </main>}

      {phase === 'playing' && question && <main className="pythagoras-game-layout">
        <section className="pythagoras-question-card">
          <div className="pythagoras-question-heading">
            <div><p>第 {questionIndex + 1} 題</p><h2>{question.prompt}</h2></div>
            <span>{question.kind === 'hypotenuse' ? '求斜邊' : '求股長'}</span>
          </div>
          {question.angleHint && <div className="pythagoras-angle-hint">已知：{question.angleHint}</div>}
          <TriangleDiagram question={question} />
          <form className="pythagoras-answer-form" onSubmit={submitAnswer}>
            <label htmlFor="pythagoras-answer">第三邊長度</label>
            <div>
              <input
                ref={inputRef}
                id="pythagoras-answer"
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="輸入整數、根號或小數"
                disabled={Boolean(feedback)}
                autoComplete="off"
              />
              <button type="button" className="pythagoras-root-key" onClick={insertRoot} disabled={Boolean(feedback)}>√</button>
              <button type="submit" className="pythagoras-primary" disabled={Boolean(feedback) || !answer.trim()}>確認答案</button>
            </div>
          </form>

          {feedback && <div className={`pythagoras-feedback ${feedback.correct ? 'is-correct' : 'is-wrong'}`} role="status">
            <strong>{feedback.correct ? <CheckCircle2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}{feedback.message}</strong>
            {feedback.revealed && question.commonMistake && <p>{question.commonMistake}</p>}
          </div>}
          <div className="pythagoras-question-actions">
            <button type="button" onClick={revealAnswer} disabled={!feedback || feedback.correct || feedback.revealed}>查看答案並略過</button>
            <button type="button" className="pythagoras-primary" onClick={nextQuestion} disabled={!feedback || (!feedback.correct && !feedback.revealed)}>
              {feedback?.correct && correctCount >= challengeTarget ? '查看結果' : '下一題'}
            </button>
          </div>
        </section>

        <aside className="pythagoras-progress-card">
          <div className="pythagoras-stats">
            <span><b>{score}</b>目前得分</span>
            <span><b>{correctCount}／{challengeTarget}</b>已答對</span>
            <span><b><Clock3 aria-hidden="true" />{formatTime(elapsed)}</b>經過時間</span>
          </div>
          <div className="pythagoras-progress-track"><span style={{ width: `${progress}%` }} /></div>
          <div className="pythagoras-mini-reminder"><Sparkles aria-hidden="true" /><span><strong>快速判斷</strong>求斜邊用加法；求股長用減法。平方差可以幫你更快算出股長。</span></div>
        </aside>
      </main>}

      {phase === 'complete' && <main className="pythagoras-complete-card">
        <Trophy aria-hidden="true" />
        <p className="pythagoras-kicker">CHALLENGE COMPLETE</p>
        <h2>{group} 組挑戰完成！</h2>
        <p>你答對了 {correctCount} 題，獲得 {score} 分；總共嘗試 {attempts} 題，用時 {formatTime(elapsed)}。</p>
        {taskSaveState.status !== 'idle' && <p className={`pythagoras-task-save is-${taskSaveState.status}`} role="status">{taskSaveState.message}</p>}
        <label htmlFor="pythagoras-player-name">姓名或暱稱</label>
        <div className="pythagoras-save-row">
          <input id="pythagoras-player-name" value={playerName} onChange={(event) => setPlayerName(event.target.value)} maxLength="18" disabled={saved} />
          <button type="button" className="pythagoras-primary" onClick={saveResult} disabled={saved}>{saved ? '已儲存' : '儲存本機紀錄'}</button>
        </div>
        <ScoreList scores={scores} />
        <div className="pythagoras-complete-actions">
          <button type="button" onClick={() => startChallenge()}><RotateCcw aria-hidden="true" />同組再挑戰</button>
          <button type="button" onClick={() => setPhase('start')}>返回難度說明</button>
        </div>
      </main>}
    </div>
  )
}
