import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Compass,
  FileSearch,
  Home,
  Lightbulb,
  Play,
  RotateCcw,
  Search,
  ShieldQuestion,
  Trophy,
  XCircle,
} from 'lucide-react'
import {
  geographyDetectiveChapterOptions,
  geographyDetectiveQuestions,
} from '../data/geographyDetective.js'
import {
  buildGeographyDetectiveRound,
  evaluateGeographyDetectiveAnswer,
  geographyDetectiveScore,
} from '../lib/geographyDetective.js'
import './geographyDetective.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'
const bestScoreStorageKey = 'sljh.geographyDetective.bestScores.v1'

function learningHubUrl() {
  if (typeof window === 'undefined') return './'
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  return url.toString()
}

function readBestScores() {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    return JSON.parse(window.localStorage.getItem(bestScoreStorageKey) || '{}')
  } catch {
    return {}
  }
}

function saveBestScore(chapterId, score, currentScores) {
  const nextScores = {
    ...currentScores,
    [chapterId]: Math.max(Number(currentScores[chapterId]) || 0, score),
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(bestScoreStorageKey, JSON.stringify(nextScores))
    } catch {
      // Private browsing or a full device store should not stop the practice round.
    }
  }
  return nextScores
}

function DetectiveNavigation() {
  return (
    <nav className="detective-floating-nav" aria-label="學習系統導覽">
      <a href={learningHubUrl()}><Home aria-hidden="true" />返回任務頁</a>
      <a href={contactBookUrl}><ArrowLeft aria-hidden="true" />返回聯絡簿</a>
    </nav>
  )
}

function SetupPanel({ chapterId, onChapterChange, onStart, bestScores, chapterCounts }) {
  return (
    <>
      <section className="detective-hero">
        <div>
          <p>GEOGRAPHY DETECTIVE AGENCY</p>
          <h1>從線索找出地理答案</h1>
          <span>不只記住地名，也要能用地勢、氣候與人類活動說明自己的判斷。</span>
        </div>
        <div className="detective-hero-art" aria-hidden="true">
          <Search />
          <i />
        </div>
      </section>

      <section className="detective-setup-card" aria-labelledby="detective-chapter-title">
        <div className="detective-section-heading">
          <div className="detective-section-icon"><FileSearch aria-hidden="true" /></div>
          <div>
            <p>CHOOSE A CASE FILE</p>
            <h2 id="detective-chapter-title">選擇這次要調查的範圍</h2>
          </div>
        </div>

        <div className="detective-chapter-grid">
          {geographyDetectiveChapterOptions.map((chapter) => (
            <button
              type="button"
              key={chapter.id}
              className={chapterId === chapter.id ? 'is-selected' : ''}
              onClick={() => onChapterChange(chapter.id)}
              aria-pressed={chapterId === chapter.id}
            >
              <span>{chapter.name}</span>
              <small>{chapter.description}</small>
              <b>題庫 {chapterCounts[chapter.id]} 題・本機最佳：{bestScores[chapter.id] ?? '尚無紀錄'}{bestScores[chapter.id] != null ? ' 分' : ''}</b>
            </button>
          ))}
        </div>

        <div className="detective-rule-grid">
          <article><ShieldQuestion aria-hidden="true" /><div><strong>每回合 10 題</strong><span>每題都有兩條案件線索與四個選項。</span></div></article>
          <article><Lightbulb aria-hidden="true" /><div><strong>提示逐步出現</strong><span>第 2 次答錯才給提示，第 3 次答錯公布答案。</span></div></article>
          <article><BookOpenCheck aria-hidden="true" /><div><strong>理解判斷依據</strong><span>每題結束都會說明答案，不只看對錯。</span></div></article>
        </div>

        <button type="button" className="detective-primary-button" onClick={onStart}>
          <Play aria-hidden="true" />開始調查
        </button>
      </section>
    </>
  )
}

function CasePanel({
  currentCase,
  questionIndex,
  questionCount,
  points,
  mistakeCount,
  attemptedAnswers,
  feedback,
  resolved,
  selectedAnswer,
  onAnswer,
  onNext,
}) {
  const progress = Math.round(((questionIndex + (resolved ? 1 : 0)) / questionCount) * 100)

  return (
    <section className="detective-case-shell" aria-labelledby="detective-case-title">
      <div className="detective-round-status">
        <div>
          <span>案件 {questionIndex + 1}／{questionCount}</span>
          <strong>{points} 分</strong>
        </div>
        <div className="detective-progress" aria-label={`目前進度 ${progress}%`}>
          <i style={{ width: `${progress}%` }} />
        </div>
      </div>

      <article className="detective-case-card">
        <div className="detective-file-tab">CASE {String(questionIndex + 1).padStart(2, '0')}</div>
        <header>
          <p>案件名稱</p>
          <h1 id="detective-case-title">{currentCase.title}</h1>
        </header>

        <div className="detective-clue-board">
          <strong><Compass aria-hidden="true" />已知線索</strong>
          <ol>
            {currentCase.clues.map((clue) => <li key={clue}>{clue}</li>)}
          </ol>
        </div>

        <div className="detective-question">
          <span>請作出判斷</span>
          <h2>{currentCase.question}</h2>
        </div>

        <div className="detective-choice-grid">
          {currentCase.choices.map((choice, choiceIndex) => {
            const isAttempted = attemptedAnswers.includes(choice)
            const isCorrect = resolved && choice === currentCase.answer
            const isWrong = isAttempted && choice !== currentCase.answer
            return (
              <button
                type="button"
                key={choice}
                className={[isCorrect ? 'is-correct' : '', isWrong ? 'is-wrong' : '', selectedAnswer === choice ? 'is-latest' : ''].filter(Boolean).join(' ')}
                onClick={() => onAnswer(choice)}
                disabled={resolved || isAttempted}
              >
                <b>{String.fromCharCode(65 + choiceIndex)}</b>
                <span>{choice}</span>
                {isCorrect && <CheckCircle2 aria-hidden="true" />}
                {isWrong && <XCircle aria-hidden="true" />}
              </button>
            )
          })}
        </div>

        {feedback && (
          <aside className={`detective-feedback ${feedback.correct ? 'is-correct' : 'is-wrong'}`} aria-live="polite">
            {feedback.correct ? <CheckCircle2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}
            <div>
              <strong>{feedback.correct ? `本題獲得 ${feedback.points} 分` : mistakeCount >= 3 ? '案件解答' : `再調查一次（已答錯 ${mistakeCount} 次）`}</strong>
              <p>{feedback.message}</p>
              {resolved && <p className="detective-reason"><b>判斷依據：</b>{currentCase.reasoning}</p>}
            </div>
          </aside>
        )}

        {resolved && (
          <button type="button" className="detective-primary-button detective-next-button" onClick={onNext}>
            {questionIndex === questionCount - 1 ? '查看調查成果' : '下一個案件'}<ChevronRight aria-hidden="true" />
          </button>
        )}
      </article>
    </section>
  )
}

function ResultPanel({ chapterName, results, points, score, bestScore, onRestart, onBack }) {
  const solvedCount = results.filter((result) => result.correct).length
  const firstTryCount = results.filter((result) => result.correct && result.mistakeCount === 0).length

  return (
    <section className="detective-result-panel" aria-labelledby="detective-result-title">
      <div className="detective-result-medal"><Trophy aria-hidden="true" /></div>
      <p>CASE CLOSED</p>
      <h1 id="detective-result-title">本次調查完成</h1>
      <span className="detective-result-scope">{chapterName}</span>
      <div className="detective-score-ring"><strong>{score}</strong><span>分</span></div>

      <div className="detective-result-stats">
        <div><strong>{points}</strong><span>調查積分</span></div>
        <div><strong>{solvedCount}／{results.length}</strong><span>自行找出答案</span></div>
        <div><strong>{firstTryCount}</strong><span>一次判斷正確</span></div>
        <div><strong>{bestScore}</strong><span>本機最佳分數</span></div>
      </div>

      <div className="detective-review-list">
        <h2>案件複盤</h2>
        {results.map((result, index) => (
          <details key={result.id}>
            <summary>
              <span>{index + 1}. {result.title}</span>
              <b className={result.correct ? 'is-correct' : 'is-wrong'}>{result.points} 分</b>
            </summary>
            <p><strong>答案：</strong>{result.answer}</p>
            <p><strong>判斷依據：</strong>{result.reasoning}</p>
          </details>
        ))}
      </div>

      <div className="detective-result-actions">
        <button type="button" className="detective-primary-button" onClick={onRestart}><RotateCcw aria-hidden="true" />再挑戰一次</button>
        <button type="button" className="detective-secondary-button" onClick={onBack}>更換調查範圍</button>
      </div>
    </section>
  )
}

export default function GeographyDetective() {
  const [phase, setPhase] = useState('setup')
  const [chapterId, setChapterId] = useState('grade8-upper-l01')
  const [round, setRound] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [mistakeCount, setMistakeCount] = useState(0)
  const [attemptedAnswers, setAttemptedAnswers] = useState([])
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [resolved, setResolved] = useState(false)
  const [points, setPoints] = useState(0)
  const [results, setResults] = useState([])
  const [bestScores, setBestScores] = useState(readBestScores)

  const chapter = geographyDetectiveChapterOptions.find((option) => option.id === chapterId)
    || geographyDetectiveChapterOptions[0]
  const currentCase = round[questionIndex]
  const finalScore = geographyDetectiveScore(points, round.length)
  const bestScore = Math.max(Number(bestScores[chapterId]) || 0, finalScore)

  const chapterCounts = useMemo(() => Object.fromEntries(
    geographyDetectiveChapterOptions.map((option) => [
      option.id,
      option.id === 'mixed'
        ? geographyDetectiveQuestions.length
        : geographyDetectiveQuestions.filter((question) => question.chapterId === option.id).length,
    ]),
  ), [])

  const resetQuestion = () => {
    setMistakeCount(0)
    setAttemptedAnswers([])
    setSelectedAnswer('')
    setFeedback(null)
    setResolved(false)
  }

  const startRound = () => {
    const nextRound = buildGeographyDetectiveRound(geographyDetectiveQuestions, chapterId, 10)
    setRound(nextRound)
    setQuestionIndex(0)
    setPoints(0)
    setResults([])
    resetQuestion()
    setPhase('playing')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const answerCase = (answer) => {
    if (!currentCase || resolved || attemptedAnswers.includes(answer)) return
    const outcome = evaluateGeographyDetectiveAnswer(currentCase, answer, mistakeCount)
    if (!outcome) return
    setSelectedAnswer(answer)
    setAttemptedAnswers((answers) => [...answers, answer])
    setFeedback(outcome)
    if (!outcome.correct) setMistakeCount(outcome.mistakeCount)
    if (!outcome.resolved) return

    setResolved(true)
    setPoints((value) => value + outcome.points)
    setResults((items) => [...items, {
      id: currentCase.id,
      title: currentCase.title,
      answer: currentCase.answer,
      reasoning: currentCase.reasoning,
      correct: outcome.correct,
      mistakeCount: outcome.correct ? mistakeCount : outcome.mistakeCount,
      points: outcome.points,
    }])
  }

  const nextCase = () => {
    if (questionIndex < round.length - 1) {
      setQuestionIndex((value) => value + 1)
      resetQuestion()
      return
    }
    setBestScores((scores) => saveBestScore(chapterId, finalScore, scores))
    setPhase('result')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="detective-shell">
      <DetectiveNavigation />
      <header className="detective-header">
        <a href="?subject=geography"><Search aria-hidden="true" /><span>地理偵探社</span></a>
        <span>翰林八上第 1～2 章</span>
      </header>

      <main className="detective-main">
        {phase === 'setup' && (
          <SetupPanel
            chapterId={chapterId}
            onChapterChange={setChapterId}
            onStart={startRound}
            bestScores={bestScores}
            chapterCounts={chapterCounts}
          />
        )}
        {phase === 'playing' && currentCase && (
          <CasePanel
            currentCase={currentCase}
            questionIndex={questionIndex}
            questionCount={round.length}
            points={points}
            mistakeCount={mistakeCount}
            attemptedAnswers={attemptedAnswers}
            feedback={feedback}
            resolved={resolved}
            selectedAnswer={selectedAnswer}
            onAnswer={answerCase}
            onNext={nextCase}
          />
        )}
        {phase === 'result' && (
          <ResultPanel
            chapterName={chapter.name}
            results={results}
            points={points}
            score={finalScore}
            bestScore={bestScore}
            onRestart={startRound}
            onBack={() => setPhase('setup')}
          />
        )}
      </main>
    </div>
  )
}
