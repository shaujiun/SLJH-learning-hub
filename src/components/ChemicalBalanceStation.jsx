import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Atom,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Home,
  Lightbulb,
  Play,
  RotateCcw,
  Trophy,
  X,
} from 'lucide-react'
import {
  chemicalBalanceRoadmap,
  particleElementStyles,
} from '../data/chemicalBalance.js'
import {
  atomCountsMatch,
  buildStageOneRound,
  countAtomSymbols,
  describeAtomDifference,
  displayMolecularFormula,
  pointsForAttempt,
  stageOneScore,
} from '../lib/chemicalBalance.js'
import { learningHubUrl } from '../lib/guestPractice.js'
import './chemicalBalanceStation.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'
const bestScoreKey = 'sljh.chemicalBalance.stageOne.best.v1'

function readBestScore() {
  if (typeof window === 'undefined' || !window.localStorage) return 0
  try { return Number(window.localStorage.getItem(bestScoreKey)) || 0 } catch { return 0 }
}

function saveBestScore(score) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try { window.localStorage.setItem(bestScoreKey, String(score)) } catch { /* Keep the lesson usable in private mode. */ }
}

function ParticleModel({ molecule, label = `${molecule.name}的粒子模型` }) {
  const bonds = molecule.bonds.filter((bond, index, all) => all.findIndex((candidate) => candidate[0] === bond[0] && candidate[1] === bond[1]) === index)
  return (
    <figure className="balance-particle-model">
      <svg viewBox="0 0 100 100" role="img" aria-label={label}>
        {bonds.map(([from, to]) => (
          <line
            key={`${from}-${to}`}
            x1={molecule.model[from].x}
            y1={molecule.model[from].y}
            x2={molecule.model[to].x}
            y2={molecule.model[to].y}
          />
        ))}
        {molecule.model.map((atom, index) => {
          const style = particleElementStyles[atom.symbol]
          return (
            <g key={`${atom.symbol}-${index}`}>
              <circle cx={atom.x} cy={atom.y} r="11" fill={style.color} stroke={style.border} />
              <text x={atom.x} y={atom.y + 3.7} fill={style.text}>{atom.symbol}</text>
            </g>
          )
        })}
      </svg>
      <figcaption>球代表原子，線只用來協助看出同一個粒子。</figcaption>
    </figure>
  )
}

function Roadmap({ bestScore, onStart }) {
  return (
    <>
      <section className="balance-hero">
        <div>
          <p>CHEMICAL EQUATION STATION</p>
          <h1>化學反應平衡站</h1>
          <span>先看懂一個粒子裡有哪些原子，再一步一步走向反應式平衡。</span>
        </div>
        <div className="balance-hero-art" aria-hidden="true"><FlaskConical /><i>H₂O</i></div>
      </section>

      <section className="balance-roadmap" aria-labelledby="balance-roadmap-title">
        <div className="balance-heading">
          <span><Atom aria-hidden="true" /></span>
          <div><p>LEARNING ROUTE</p><h2 id="balance-roadmap-title">四站式學習路線</h2></div>
        </div>
        <div className="balance-stage-grid">
          {chemicalBalanceRoadmap.map((stage) => (
            <article key={stage.stage} className={stage.status === 'open' ? 'is-open' : 'is-planned'}>
              <b>{stage.stage}</b>
              <small>{stage.status === 'open' ? '本次開放' : '後續關卡'}</small>
              <h3>{stage.title}</h3>
              <p>{stage.description}</p>
              {stage.status === 'open'
                ? <button type="button" onClick={onStart}><Play aria-hidden="true" />開始第 1 關</button>
                : <span>完成前一關後陸續開放</span>}
            </article>
          ))}
        </div>
        <aside className="balance-rule-note">
          <Lightbulb aria-hidden="true" />
          <div><strong>第一個重要規則</strong><span>右下角數字改變粒子的組成；前方係數只改變粒子的數量。</span></div>
        </aside>
        <p className="balance-best"><Trophy aria-hidden="true" />第 1 關此裝置最高成績：{bestScore || '尚未完成'}{bestScore ? ' 分' : ''}</p>
      </section>
    </>
  )
}

function AtomBuilder({ selectedAtoms, disabled, onAdd, onRemove, onClear }) {
  return (
    <div className="balance-builder">
      <div className="balance-assembly" aria-label="目前組裝的粒子">
        {selectedAtoms.length === 0
          ? <span>點選下方原子，放進組裝區</span>
          : selectedAtoms.map((symbol, index) => {
            const style = particleElementStyles[symbol]
            return (
              <button
                type="button"
                key={`${symbol}-${index}`}
                style={{ '--atom-fill': style.color, '--atom-border': style.border, '--atom-text': style.text }}
                disabled={disabled}
                onClick={() => onRemove(index)}
                aria-label={`移除 1 個 ${symbol}`}
              >
                {symbol}<X aria-hidden="true" />
              </button>
            )
          })}
      </div>
      <div className="balance-atom-bank" aria-label="可使用的原子">
        {Object.entries(particleElementStyles).map(([symbol, style]) => (
          <button
            type="button"
            key={symbol}
            style={{ '--atom-fill': style.color, '--atom-border': style.border, '--atom-text': style.text }}
            disabled={disabled || selectedAtoms.length >= 8}
            onClick={() => onAdd(symbol)}
          >
            <b>{symbol}</b><span>{style.name}</span>
          </button>
        ))}
      </div>
      <button type="button" className="balance-clear" onClick={onClear} disabled={disabled || selectedAtoms.length === 0}>
        <RotateCcw aria-hidden="true" />清空重組
      </button>
    </div>
  )
}

function ChoiceQuestion({ choices, attempted, resolved, onChoose }) {
  return (
    <div className="balance-choice-grid">
      {choices.map((choice, index) => {
        const wasAttempted = attempted.includes(choice.value)
        return (
          <button
            type="button"
            key={choice.value}
            className={wasAttempted ? 'is-wrong' : ''}
            disabled={resolved || wasAttempted}
            onClick={() => onChoose(choice.value)}
          >
            <b>{String.fromCharCode(65 + index)}</b><span>{choice.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ResultPanel({ score, bestScore, onRestart, onBack }) {
  return (
    <section className="balance-result">
      <Trophy aria-hidden="true" />
      <p>STAGE 1 COMPLETE</p>
      <h1>第 1 關完成</h1>
      <strong>{score} 分</strong>
      <span>{score >= 80 ? '你已能區分粒子的組成與數量，可以準備挑戰原子守恆。' : '建議再練一次，特別留意前方係數與右下角數字。'}</span>
      <small>此裝置最高成績：{bestScore} 分</small>
      <div><button type="button" onClick={onRestart}><RotateCcw aria-hidden="true" />再練一次</button><button type="button" onClick={onBack}>返回學習路線</button></div>
    </section>
  )
}

export default function ChemicalBalanceStation() {
  const [view, setView] = useState('roadmap')
  const [roundId, setRoundId] = useState(0)
  const questions = useMemo(() => buildStageOneRound(), [roundId])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAtoms, setSelectedAtoms] = useState([])
  const [attempted, setAttempted] = useState([])
  const [mistakes, setMistakes] = useState(0)
  const [resolved, setResolved] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [points, setPoints] = useState(0)
  const [bestScore, setBestScore] = useState(readBestScore)
  const question = questions[questionIndex]
  const score = stageOneScore(points, questions.length)

  function resetQuestion() {
    setSelectedAtoms([])
    setAttempted([])
    setMistakes(0)
    setResolved(false)
    setFeedback('')
  }

  function startRound() {
    setRoundId((value) => value + 1)
    setQuestionIndex(0)
    setPoints(0)
    resetQuestion()
    setView('play')
    if (typeof window !== 'undefined') window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  function resolveCorrect(message) {
    setResolved(true)
    setPoints((value) => value + pointsForAttempt(mistakes))
    setFeedback(message)
  }

  function submitBuild() {
    const actual = countAtomSymbols(selectedAtoms)
    if (atomCountsMatch(actual, question.answer)) {
      resolveCorrect(`組裝正確！${question.explanation}`)
      return
    }
    setMistakes((value) => value + 1)
    setFeedback(`${describeAtomDifference(actual, question.answer)}請點原子調整；點組裝區中的原子可以移除。`)
  }

  function chooseAnswer(value) {
    if (value === question.answer) {
      resolveCorrect(`判斷正確！${question.explanation}`)
      return
    }
    setAttempted((values) => [...values, value])
    setMistakes((value) => value + 1)
    setFeedback(question.mode === 'concept'
      ? '再看一次：前方數字會乘上整個化學式，右下角數字只屬於它左邊的元素。'
      : '這個選項的元素種類或原子數不符合模型，請逐顆數一次。')
  }

  function nextQuestion() {
    if (questionIndex === questions.length - 1) {
      const nextBest = Math.max(bestScore, score)
      setBestScore(nextBest)
      saveBestScore(nextBest)
      setView('result')
      return
    }
    setQuestionIndex((value) => value + 1)
    resetQuestion()
  }

  return (
    <div className="chemical-balance-shell">
      <nav className="balance-floating-nav" aria-label="學習系統導覽">
        {view !== 'roadmap' && <button type="button" onClick={() => setView('roadmap')}><ArrowLeft aria-hidden="true" />返回學習路線</button>}
        <a href={learningHubUrl('?subject=science')}><Home aria-hidden="true" />返回自然科</a>
        <a href={contactBookUrl}><ArrowLeft aria-hidden="true" />返回聯絡簿</a>
      </nav>
      <main>
        {view === 'roadmap' && <Roadmap bestScore={bestScore} onStart={startRound} />}

        {view === 'play' && (
          <section className="balance-lesson">
            <header>
              <div><p>STAGE 1・分子組裝室</p><h1>{question.prompt}</h1></div>
              <strong>{questionIndex + 1}<small>／{questions.length}</small></strong>
            </header>
            <div className="balance-progress" aria-label={`第 ${questionIndex + 1} 題，共 ${questions.length} 題`}><i style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>

            {question.mode === 'build' && (
              <>
                <div className="balance-formula-target"><small>目標化學式</small><b>{displayMolecularFormula(question.molecule.formula)}</b><span>{question.molecule.name}</span></div>
                <AtomBuilder
                  selectedAtoms={selectedAtoms}
                  disabled={resolved}
                  onAdd={(symbol) => setSelectedAtoms((values) => [...values, symbol])}
                  onRemove={(index) => setSelectedAtoms((values) => values.filter((_, atomIndex) => atomIndex !== index))}
                  onClear={() => setSelectedAtoms([])}
                />
                {!resolved && <button type="button" className="balance-primary" disabled={!selectedAtoms.length} onClick={submitBuild}><CheckCircle2 aria-hidden="true" />檢查組裝</button>}
              </>
            )}

            {question.mode === 'identify' && <ParticleModel molecule={question.molecule} />}
            {question.mode !== 'build' && <ChoiceQuestion choices={question.choices} attempted={attempted} resolved={resolved} onChoose={chooseAnswer} />}

            {feedback && <div className={`balance-feedback ${resolved ? 'is-correct' : 'is-hint'}`} role="status">
              {resolved ? <CheckCircle2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}<span>{feedback}</span>
            </div>}
            {resolved && <button type="button" className="balance-next" onClick={nextQuestion}>{questionIndex === questions.length - 1 ? '查看本關成果' : '下一題'}<ChevronRight aria-hidden="true" /></button>}
          </section>
        )}

        {view === 'result' && <ResultPanel score={score} bestScore={bestScore} onRestart={startRound} onBack={() => setView('roadmap')} />}
      </main>
    </div>
  )
}
