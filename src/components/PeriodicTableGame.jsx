import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Atom,
  Check,
  ChevronRight,
  CircleAlert,
  FlaskConical,
  Home,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Swords,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import {
  createPeriodicQuestions,
  getElementsForLevel,
  normalizePeriodicLevel,
  normalizePeriodicMode,
  periodicElements,
  periodicLevels,
  periodicModes,
  resolvePeriodicGameSelection,
} from '../lib/periodicTable.js'
import {
  loadPeriodicTableContext,
  recordPeriodicTableAttempt,
} from '../services/periodicTableService.js'
import PeriodicBattle from './PeriodicBattle.jsx'
import PeriodicTableGrid from './PeriodicTableGrid.jsx'
import './periodicTableGame.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

function learningHubUrl() {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  return url.toString()
}

function LoadingGame() {
  return (
    <main className="periodic-center-screen">
      <div className="periodic-loader"><Atom aria-hidden="true" /></div>
      <h1>正在準備元素週期表</h1>
      <p>先深呼吸，一次完成一題就好。</p>
    </main>
  )
}

function GameNavigation() {
  return (
    <nav className="game-floating-nav" aria-label="學習系統導覽">
      <a href={learningHubUrl()}><Home aria-hidden="true" />返回任務頁</a>
      <a href={contactBookUrl}><ArrowLeft aria-hidden="true" />返回聯絡簿</a>
    </nav>
  )
}

export default function PeriodicTableGame() {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const focusTaskId = query.get('focusTask') || ''
  const [context, setContext] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [phase, setPhase] = useState('loading')
  const [level, setLevel] = useState(normalizePeriodicLevel(query.get('level')))
  const [mode, setMode] = useState(normalizePeriodicMode(query.get('mode')))
  const [questions, setQuestions] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongNumbers, setWrongNumbers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answerCorrect, setAnswerCorrect] = useState(null)
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  const load = async () => {
    setPhase('loading')
    setLoadError('')
    try {
      const nextContext = await loadPeriodicTableContext(focusTaskId)
      setContext(nextContext)
      const selection = resolvePeriodicGameSelection({
        task: nextContext.task,
        requestedLevel: nextContext.student ? nextContext.level.code : level,
        requestedMode: mode,
      })
      setLevel(selection.level)
      setMode(selection.mode)
      setPhase('setup')
    } catch (error) {
      setLoadError(error.message || '無法載入元素週期表遊戲。')
      setPhase('error')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const currentQuestion = questions[questionIndex]
  const allowedElements = useMemo(() => getElementsForLevel(level), [level])

  const startQuiz = ({ onlyNumbers = null, isReview = false } = {}) => {
    const count = onlyNumbers?.length
      || context?.task?.questionCount
      || periodicLevels[level].questionCount
    const nextQuestions = createPeriodicQuestions({ level, mode, count, onlyNumbers })
    setQuestions(nextQuestions)
    setQuestionIndex(0)
    setCorrectCount(0)
    setWrongNumbers([])
    setSelectedAnswer(null)
    setAnswerCorrect(null)
    setResult(null)
    setReviewing(isReview)
    setPhase('playing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const chooseAnswer = (answer) => {
    if (!currentQuestion || answerCorrect !== null) return
    const correct = answer === currentQuestion.answer
    setSelectedAnswer(answer)
    setAnswerCorrect(correct)
    if (correct) setCorrectCount((value) => value + 1)
    else setWrongNumbers((items) => [...items, currentQuestion.element.number])
  }

  const finishQuiz = async () => {
    const score = Math.round((correctCount / questions.length) * 100)
    setSaving(true)
    try {
      const progress = await recordPeriodicTableAttempt({
        focusTaskId,
        score,
        correctCount,
        questionCount: questions.length,
      })
      setResult({ score, progress, wrongNumbers })
      setPhase('result')
    } catch (error) {
      setResult({ score, progress: null, wrongNumbers, saveError: error.message })
      setPhase('result')
    } finally {
      setSaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goNext = () => {
    if (questionIndex >= questions.length - 1) {
      finishQuiz()
      return
    }
    setQuestionIndex((value) => value + 1)
    setSelectedAnswer(null)
    setAnswerCorrect(null)
  }

  if (phase === 'loading') return <LoadingGame />

  if (phase === 'error') {
    return (
      <main className="periodic-center-screen">
        <CircleAlert aria-hidden="true" />
        <h1>元素週期表暫時無法載入</h1>
        <p>{loadError}</p>
        <button type="button" onClick={load}><RefreshCw aria-hidden="true" />重新讀取</button>
        <GameNavigation />
      </main>
    )
  }

  if (!context?.authenticated) {
    return (
      <main className="periodic-center-screen">
        <Atom aria-hidden="true" />
        <h1>請先登入線上聯絡簿</h1>
        <p>登入後即可保留個人自然科等級與每日任務進度。</p>
        <a className="periodic-primary-button" href={contactBookUrl}>前往聯絡簿登入</a>
      </main>
    )
  }

  const levelInfo = periodicLevels[level]
  const modeInfo = periodicModes[mode]

  return (
    <div className="periodic-game-shell">
      <header className="periodic-game-header">
        <a href={learningHubUrl()} className="periodic-brand">
          <span><Atom aria-hidden="true" /></span>
          <div><small>SCIENCE LAB</small><strong>元素週期表測驗</strong></div>
        </a>
        <div className="periodic-identity">
          <strong>{context.profile.displayName}</strong>
          <span>{context.student ? `${context.student.className}・${context.student.seatNumber} 號` : '教師／管理者自由練習'}</span>
        </div>
      </header>

      <main className="periodic-game-main">
        {phase === 'setup' && (
          <>
            <section className="periodic-hero">
              <div>
                <p className="periodic-eyebrow">FOCUS CHEMISTRY</p>
                <h1>今天，一次認識一個元素</h1>
                <p>沒有倒數計時。看清楚、想一想，再選擇答案。</p>
              </div>
              <div className="atom-model" aria-hidden="true"><span /><span /><span /><b /></div>
            </section>

            {context.student && (
              <section className="personal-level-card">
                <div><Target aria-hidden="true" /><span>目前個人等級</span><strong>{context.level.label}</strong></div>
                <div><Trophy aria-hidden="true" /><span>升級進度</span><strong>{context.level.requiredPasses
                  ? `${context.level.consecutivePasses}／${context.level.requiredPasses}`
                  : '最高每日等級'}</strong></div>
              </section>
            )}

            <section className="periodic-setup-card">
              <div className="periodic-section-heading">
                <div><p className="periodic-eyebrow">SELECT LEVEL</p><h2>{context.task ? '今日任務設定' : '選擇練習方式'}</h2></div>
                {context.task && <span className="focus-task-lock">每日任務・設定已鎖定</span>}
              </div>

              <fieldset disabled={Boolean(context.task)}>
                <legend>難度</legend>
                <div className="level-choice-grid">
                  {Object.values(periodicLevels).map((item) => (
                    <button
                      className={level === item.code ? 'selected' : ''}
                      type="button"
                      onClick={() => setLevel(item.code)}
                      key={item.code}
                    >
                      <span>{item.label}</span>
                      <small>{item.description}</small>
                      <b>{item.questionCount} 題{item.code === 'complete' ? '・不列入每日任務' : ''}</b>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset disabled={Boolean(context.task)}>
                <legend>題型</legend>
                <div className="mode-choice-grid">
                  {Object.values(periodicModes).map((item) => (
                    <button
                      className={mode === item.code ? 'selected' : ''}
                      type="button"
                      onClick={() => setMode(item.code)}
                      key={item.code}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="setup-summary">
                <FlaskConical aria-hidden="true" />
                <div><strong>{levelInfo.label}・{modeInfo.label}</strong><span>{context.task?.questionCount || levelInfo.questionCount} 題，達到 {context.task?.targetScore || 80} 分完成</span></div>
                <button className="periodic-primary-button" type="button" onClick={() => startQuiz()}>
                  開始測驗<ChevronRight aria-hidden="true" />
                </button>
              </div>
            </section>

            {!focusTaskId && (
              <section className="battle-entry-card">
                <div><Swords aria-hidden="true" /><span><strong>即時元素對戰</strong><small>建立 2 人或 4 人房間，和同學進行限時搶答。</small></span></div>
                <button className="periodic-primary-button" type="button" onClick={() => setPhase('battle')}><Swords aria-hidden="true" />進入對戰模式</button>
              </section>
            )}
          </>
        )}

        {phase === 'battle' && <PeriodicBattle context={context} onExit={() => setPhase('setup')} />}

        {phase === 'playing' && currentQuestion && (
          <section className="periodic-question-card">
            <div className="question-progress-row">
              <span>{reviewing ? '錯題重練' : `${levelInfo.label}・${modeInfo.label}`}</span>
              <strong>{questionIndex + 1}／{questions.length}</strong>
            </div>
            <div className="question-progress-track"><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>

            <div className="question-prompt">
              <small>第 {questionIndex + 1} 題</small>
              <h1>{currentQuestion.prompt}</h1>
            </div>

            {currentQuestion.mode === 'locate' ? (
              <PeriodicTableGrid
                allowedNumbers={allowedElements.map((element) => element.number)}
                targetNumber={currentQuestion.element.number}
                selectedNumber={selectedAnswer}
                answered={answerCorrect !== null}
                onSelect={chooseAnswer}
              />
            ) : (
              <div className="periodic-answer-grid">
                {currentQuestion.choices.map((choice) => {
                  const isSelected = selectedAnswer === choice.value
                  const isCorrect = answerCorrect !== null && choice.value === currentQuestion.answer
                  const classNames = [isSelected ? 'selected' : '', isCorrect ? 'correct' : '', isSelected && answerCorrect === false ? 'wrong' : ''].filter(Boolean).join(' ')
                  return (
                    <button className={classNames} type="button" disabled={answerCorrect !== null} onClick={() => chooseAnswer(choice.value)} key={choice.key}>
                      {choice.value}
                    </button>
                  )
                })}
              </div>
            )}

            {answerCorrect !== null && (
              <div className={`answer-feedback ${answerCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
                <div>{answerCorrect ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}</div>
                <p>{answerCorrect
                  ? '答對了，保持這個節奏！'
                  : `正確答案是：${currentQuestion.element.name}（${currentQuestion.element.symbol}）`}</p>
                <button type="button" onClick={goNext} disabled={saving}>
                  {saving ? <RefreshCw className="spin-icon" aria-hidden="true" /> : questionIndex === questions.length - 1 ? <Trophy aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
                  {questionIndex === questions.length - 1 ? '查看結果' : '下一題'}
                </button>
              </div>
            )}
          </section>
        )}

        {phase === 'result' && result && (
          <section className="periodic-result-card">
            <div className={`result-orb ${result.score >= 80 ? 'passed' : ''}`}><Trophy aria-hidden="true" /></div>
            <p className="periodic-eyebrow">RESULT</p>
            <h1>{result.score >= 80 ? '完成這次挑戰！' : '再整理一次就會更熟'}</h1>
            <strong className="result-score">{result.score}<small>分</small></strong>
            <p>答對 {correctCount}／{questions.length} 題・目標 {context.task?.targetScore || 80} 分</p>

            {result.progress?.leveledUp && (
              <div className="level-up-message"><Sparkles aria-hidden="true" />恭喜升級為「{periodicLevels[result.progress.learningLevel]?.label || result.progress.learningLevel}」！</div>
            )}
            {result.progress && !result.progress.leveledUp && result.progress.requiredPasses && (
              <div className="result-progress-message">
                個人升級進度：{result.progress.consecutivePasses}／{result.progress.requiredPasses}
              </div>
            )}
            {result.saveError && <p className="result-save-error">{result.saveError}</p>}

            {result.wrongNumbers.length > 0 && (
              <div className="wrong-element-list">
                <h2>這次需要再看一眼</h2>
                <div>{result.wrongNumbers.map((number) => {
                  const element = periodicElements.find((item) => item.number === number)
                  return <span key={number}>{element.name}・{element.symbol}</span>
                })}</div>
              </div>
            )}

            <div className="result-actions">
              {result.wrongNumbers.length > 0 && (
                <button className="periodic-primary-button" type="button" onClick={() => startQuiz({ onlyNumbers: result.wrongNumbers, isReview: true })}>
                  <RotateCcw aria-hidden="true" />重練錯題
                </button>
              )}
              <button className="periodic-secondary-button" type="button" onClick={() => startQuiz()}>
                <RefreshCw aria-hidden="true" />再練一回合
              </button>
              <a className="periodic-secondary-button" href={learningHubUrl()}><Home aria-hidden="true" />返回任務頁</a>
            </div>
          </section>
        )}
      </main>
      <GameNavigation />
    </div>
  )
}
