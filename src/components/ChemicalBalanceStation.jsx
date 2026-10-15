import { useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Atom,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Home,
  Lightbulb,
  Link2,
  Move,
  Play,
  RotateCcw,
  Trash2,
  Trophy,
} from 'lucide-react'
import {
  chemicalBalanceRoadmap,
  particleElementStyles,
} from '../data/chemicalBalance.js'
import {
  buildStageOneRound,
  collapseRepeatedBonds,
  describeMoleculeBuild,
  displayMolecularFormula,
  moleculeGraphMatches,
  pointsForAttempt,
  removeMoleculeAtom,
  setMoleculeBond,
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

function bondSegments(first, second, order) {
  const dx = second.x - first.x
  const dy = second.y - first.y
  const length = Math.max(1, Math.sqrt(dx ** 2 + dy ** 2))
  const offsets = order === 1 ? [0] : order === 2 ? [-2.1, 2.1] : [-3.2, 0, 3.2]
  return offsets.map((offset) => ({
    x1: first.x + (-dy / length) * offset,
    y1: first.y + (dx / length) * offset,
    x2: second.x + (-dy / length) * offset,
    y2: second.y + (dx / length) * offset,
  }))
}

function ParticleModel({ molecule, label = `${molecule.name}的球棒模型` }) {
  const bonds = collapseRepeatedBonds(molecule.bonds)
  return (
    <figure className="balance-particle-model">
      <svg viewBox="0 0 100 100" role="img" aria-label={label}>
        <defs>
          {Object.entries(particleElementStyles).map(([symbol, style]) => <radialGradient key={symbol} id={`particle-${symbol}`} cx="32%" cy="25%">
            <stop offset="0%" stopColor="#ffffff" /><stop offset="34%" stopColor={style.color} /><stop offset="100%" stopColor={style.border} />
          </radialGradient>)}
        </defs>
        {bonds.flatMap((bond) => bondSegments(molecule.model[bond.a], molecule.model[bond.b], bond.order)
          .map((line, lineIndex) => <line key={`${bond.a}-${bond.b}-${lineIndex}`} {...line} />))}
        {molecule.model.map((atom, index) => {
          const style = particleElementStyles[atom.symbol]
          return (
            <g key={`${atom.symbol}-${index}`}>
              <circle cx={atom.x} cy={atom.y} r="11" fill={`url(#particle-${atom.symbol})`} stroke={style.border} />
              <text x={atom.x} y={atom.y + 3.7} fill={style.text}>{atom.symbol}</text>
            </g>
          )
        })}
      </svg>
      <figcaption>不同顏色的球代表原子，球之間的棒代表化學鍵。</figcaption>
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

const defaultAtomPositions = [
  { x: 50, y: 50 }, { x: 31, y: 32 }, { x: 69, y: 32 }, { x: 31, y: 70 },
  { x: 69, y: 70 }, { x: 50, y: 18 }, { x: 50, y: 82 }, { x: 18, y: 50 },
]

export function AtomBuilder({
  atoms,
  bonds,
  disabled,
  tool,
  bondOrder,
  activeBondAtom,
  builderMessage,
  onAdd,
  onMove,
  onAtomAction,
  onTool,
  onClearBonds,
  onClear,
}) {
  const boardRef = useRef(null)

  function pointerPosition(event) {
    const rectangle = boardRef.current?.getBoundingClientRect()
    if (!rectangle) return null
    return {
      x: Math.max(7, Math.min(93, ((event.clientX - rectangle.left) / rectangle.width) * 100)),
      y: Math.max(10, Math.min(90, ((event.clientY - rectangle.top) / rectangle.height) * 100)),
    }
  }

  function dropAtom(event) {
    event.preventDefault()
    const symbol = event.dataTransfer.getData('text/chemical-element')
    const position = pointerPosition(event)
    if (symbol && position) onAdd(symbol, position)
  }

  return (
    <div className="balance-builder">
      <div className="balance-builder-guide">
        <b>① 拖入原子</b><i>→</i><b>② 選擇鍵級</b><i>→</i><b>③ 依序點兩顆原子</b>
      </div>
      <div className="balance-builder-toolbar" aria-label="模型操作工具">
        <button type="button" className={tool === 'move' ? 'is-active' : ''} aria-pressed={tool === 'move'} disabled={disabled} onClick={() => onTool('move', bondOrder)}><Move aria-hidden="true" />移動</button>
        {[1, 2, 3].map((order) => <button
          type="button"
          key={order}
          className={tool === 'bond' && bondOrder === order ? 'is-active' : ''}
          aria-pressed={tool === 'bond' && bondOrder === order}
          disabled={disabled}
          onClick={() => onTool('bond', order)}
        ><Link2 aria-hidden="true" />{order === 1 ? '單鍵' : order === 2 ? '雙鍵' : '三鍵'}</button>)}
        <button type="button" className={tool === 'delete' ? 'is-active is-delete' : 'is-delete'} aria-pressed={tool === 'delete'} disabled={disabled} onClick={() => onTool('delete', bondOrder)}><Trash2 aria-hidden="true" />刪除</button>
      </div>
      <div
        ref={boardRef}
        className={`balance-assembly is-${tool}`}
        aria-label="分子模型組裝畫布"
        onDragOver={(event) => event.preventDefault()}
        onDrop={dropAtom}
      >
        {atoms.length === 0 && <span>把下方的原子球拖到這裡；平板或手機也可以直接點原子加入。</span>}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {bonds.flatMap((bond) => bondSegments(atoms[bond.a], atoms[bond.b], bond.order)
            .map((line, lineIndex) => <line key={`${bond.a}-${bond.b}-${lineIndex}`} {...line} />))}
        </svg>
        {atoms.map((atom) => {
          const style = particleElementStyles[atom.symbol]
          const selected = activeBondAtom === atom.id
          return (
            <button
              type="button"
              key={atom.id}
              className={selected ? 'is-selected' : ''}
              style={{ left: `${atom.x}%`, top: `${atom.y}%`, '--atom-fill': style.color, '--atom-border': style.border, '--atom-text': style.text }}
              disabled={disabled}
              onClick={() => tool !== 'move' && onAtomAction(atom.id)}
              onPointerDown={(event) => {
                if (tool !== 'move' || disabled) return
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={(event) => {
                if (tool !== 'move' || !event.currentTarget.hasPointerCapture(event.pointerId)) return
                const position = pointerPosition(event)
                if (position) onMove(atom.id, position)
              }}
              aria-label={`${style.name}原子 ${tool === 'bond' ? '，點選以建立鍵結' : tool === 'delete' ? '，點選以刪除' : '，可拖曳移動'}`}
            >
              <span className="balance-visually-hidden">{style.name}原子</span>
            </button>
          )
        })}
      </div>
      <p className="balance-builder-status" aria-live="polite">{builderMessage || (tool === 'move' ? '拖曳球體調整位置。' : tool === 'delete' ? '點一顆原子即可連同相關鍵結刪除。' : `請先點第 1 顆原子，再點第 2 顆原子建立${bondOrder === 1 ? '單' : bondOrder === 2 ? '雙' : '三'}鍵。`)}</p>
      <div className="balance-atom-bank" aria-label="可使用的原子">
        {Object.entries(particleElementStyles).map(([symbol, style]) => (
          <button
            type="button"
            key={symbol}
            style={{ '--atom-fill': style.color, '--atom-border': style.border, '--atom-text': style.text }}
            draggable={!disabled}
            disabled={disabled || atoms.length >= 8}
            onDragStart={(event) => event.dataTransfer.setData('text/chemical-element', symbol)}
            onClick={() => onAdd(symbol, defaultAtomPositions[atoms.length] || { x: 50, y: 50 })}
          >
            <b>{symbol}</b><span>{style.name}</span>
          </button>
        ))}
      </div>
      <div className="balance-builder-reset">
        <button type="button" className="balance-clear" onClick={onClearBonds} disabled={disabled || bonds.length === 0}><Link2 aria-hidden="true" />只清除鍵結</button>
        <button type="button" className="balance-clear" onClick={onClear} disabled={disabled || atoms.length === 0}><RotateCcw aria-hidden="true" />清空重組</button>
      </div>
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
  const [bonds, setBonds] = useState([])
  const [builderTool, setBuilderTool] = useState('move')
  const [bondOrder, setBondOrder] = useState(1)
  const [activeBondAtom, setActiveBondAtom] = useState(null)
  const [builderMessage, setBuilderMessage] = useState('')
  const atomSequence = useRef(0)
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
    setBonds([])
    setBuilderTool('move')
    setBondOrder(1)
    setActiveBondAtom(null)
    setBuilderMessage('')
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
    if (moleculeGraphMatches(selectedAtoms, bonds, question.molecule)) {
      resolveCorrect(`模型正確！${question.explanation}鍵結方式也正確。`)
      return
    }
    setMistakes((value) => value + 1)
    setFeedback(describeMoleculeBuild(selectedAtoms, bonds, question.molecule))
  }

  function addBuilderAtom(symbol, position) {
    atomSequence.current += 1
    setSelectedAtoms((atoms) => [...atoms, { id: `atom-${atomSequence.current}`, symbol, ...position }])
    setBuilderMessage(`${symbol} 原子已加入；可以拖曳調整位置。`)
  }

  function moveBuilderAtom(atomId, position) {
    setSelectedAtoms((atoms) => atoms.map((atom) => atom.id === atomId ? { ...atom, ...position } : atom))
  }

  function useBuilderAtom(atomId) {
    if (builderTool === 'delete') {
      const next = removeMoleculeAtom(selectedAtoms, bonds, atomId)
      setSelectedAtoms(next.atoms)
      setBonds(next.bonds)
      setActiveBondAtom(null)
      setBuilderMessage('原子與連接在它上面的鍵已刪除。')
      return
    }
    if (builderTool !== 'bond') return
    if (!activeBondAtom) {
      setActiveBondAtom(atomId)
      setBuilderMessage('已選第 1 顆原子，請再點第 2 顆原子。')
      return
    }
    const result = setMoleculeBond(selectedAtoms, bonds, activeBondAtom, atomId, bondOrder)
    if (result.ok) setBonds(result.bonds)
    setActiveBondAtom(null)
    setBuilderMessage(result.message)
  }

  function chooseBuilderTool(tool, order) {
    setBuilderTool(tool)
    setBondOrder(order)
    setActiveBondAtom(null)
    setBuilderMessage('')
  }

  function clearBuilder() {
    setSelectedAtoms([])
    setBonds([])
    setActiveBondAtom(null)
    setBuilderMessage('組裝區已清空。')
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
                <div className="balance-formula-target"><small>目標化學式</small><b>{displayMolecularFormula(question.molecule.formula)}</b><span>{question.molecule.name}</span><em>鍵結提示：{question.molecule.bondHint}</em></div>
                <AtomBuilder
                  atoms={selectedAtoms}
                  bonds={bonds}
                  disabled={resolved}
                  tool={builderTool}
                  bondOrder={bondOrder}
                  activeBondAtom={activeBondAtom}
                  builderMessage={builderMessage}
                  onAdd={addBuilderAtom}
                  onMove={moveBuilderAtom}
                  onAtomAction={useBuilderAtom}
                  onTool={chooseBuilderTool}
                  onClearBonds={() => {
                    setBonds([])
                    setActiveBondAtom(null)
                    setBuilderMessage('所有鍵結已清除，原子球仍保留在組裝區。')
                  }}
                  onClear={clearBuilder}
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
