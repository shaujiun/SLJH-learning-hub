import { useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Home,
  Lightbulb,
  Link2,
  Minus,
  Move,
  Play,
  Plus,
  RotateCcw,
  Scale,
  Trash2,
  Trophy,
} from 'lucide-react'
import {
  chemicalBalanceRoadmap,
  particleElementStyles,
} from '../data/chemicalBalance.js'
import {
  buildStageOneRound,
  buildStageFourRound,
  buildStageThreeRound,
  buildStageTwoRound,
  collapseRepeatedBonds,
  describeMoleculeBuild,
  describeFormulaSelections,
  displayMolecularFormula,
  describeFormulaOnlyBalance,
  describeReactionBalance,
  evaluateFormulaSelections,
  evaluateReactionCoefficients,
  initialFormulaSelections,
  initialReactionCoefficients,
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
const stageTwoBestScoreKey = 'sljh.chemicalBalance.stageTwo.best.v1'
const stageThreeBestScoreKey = 'sljh.chemicalBalance.stageThree.best.v1'
const stageFourBestScoreKey = 'sljh.chemicalBalance.stageFour.best.v1'

function readStoredScore(key = bestScoreKey) {
  if (typeof window === 'undefined' || !window.localStorage) return 0
  try { return Number(window.localStorage.getItem(key)) || 0 } catch { return 0 }
}

function saveStoredScore(key, score) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try { window.localStorage.setItem(key, String(score)) } catch { /* Keep the lesson usable in private mode. */ }
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

function ParticleModel({ molecule, label = `${molecule.name}的球棒模型`, compact = false }) {
  const bonds = collapseRepeatedBonds(molecule.bonds)
  return (
    <figure className={`balance-particle-model ${compact ? 'is-compact' : ''}`}>
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
      {!compact && <figcaption>不同顏色的球代表原子，球之間的棒代表化學鍵。</figcaption>}
    </figure>
  )
}

function Roadmap({ bestScore, stageTwoBestScore, stageThreeBestScore, stageFourBestScore, onStart }) {
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
              <small>{stage.status === 'open' ? '已開放' : '後續關卡'}</small>
              <h3>{stage.title}</h3>
              <p>{stage.description}</p>
              {stage.status === 'open'
                ? <button type="button" onClick={() => onStart(stage.stage)}><Play aria-hidden="true" />開始第 {stage.stage} 關</button>
                : <span>完成前一關後陸續開放</span>}
            </article>
          ))}
        </div>
        <aside className="balance-rule-note">
          <Lightbulb aria-hidden="true" />
          <div><strong>第一個重要規則</strong><span>右下角數字改變粒子的組成；前方係數只改變粒子的數量。</span></div>
        </aside>
        <div className="balance-best-list">
          <p className="balance-best"><Trophy aria-hidden="true" />第 1 關此裝置最高成績：{bestScore || '尚未完成'}{bestScore ? ' 分' : ''}</p>
          <p className="balance-best"><Scale aria-hidden="true" />第 2 關此裝置最高成績：{stageTwoBestScore || '尚未完成'}{stageTwoBestScore ? ' 分' : ''}</p>
          <p className="balance-best"><CheckCircle2 aria-hidden="true" />第 3 關此裝置最高成績：{stageThreeBestScore || '尚未完成'}{stageThreeBestScore ? ' 分' : ''}</p>
          <p className="balance-best"><FlaskConical aria-hidden="true" />第 4 關此裝置最高成績：{stageFourBestScore || '尚未完成'}{stageFourBestScore ? ' 分' : ''}</p>
        </div>
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

function ReactionTerm({ term, coefficient, side, index, disabled, onChange }) {
  return (
    <article className="balance-reaction-term">
      <div className="balance-coefficient-control">
        <button type="button" disabled={disabled || coefficient <= 1} onClick={() => onChange(side, index, -1)} aria-label={`${term.molecule.name}係數減一`}><Minus aria-hidden="true" /></button>
        <output aria-label={`${term.molecule.name}目前係數`}>{coefficient}</output>
        <button type="button" disabled={disabled || coefficient >= 4} onClick={() => onChange(side, index, 1)} aria-label={`${term.molecule.name}係數加一`}><Plus aria-hidden="true" /></button>
      </div>
      <h3>{coefficient > 1 && <span>{coefficient}</span>}{displayMolecularFormula(term.molecule.formula)}</h3>
      <small>{term.molecule.name}</small>
      <div className="balance-reaction-particles" aria-label={`${coefficient} 個${term.molecule.name}`}>
        {Array.from({ length: coefficient }, (_, particleIndex) => (
          <ParticleModel key={particleIndex} molecule={term.molecule} compact label={`${term.molecule.name}第 ${particleIndex + 1} 個粒子`} />
        ))}
      </div>
    </article>
  )
}

function AtomLedger({ evaluation, title = '原子守恆檢查' }) {
  return (
    <div className="balance-atom-ledger">
      <h2><Scale aria-hidden="true" />{title}</h2>
      <div className="balance-ledger-head"><span>元素</span><span>反應前</span><span>反應後</span></div>
      {evaluation.elements.map((symbol) => {
        const matched = evaluation.reactantTotals[symbol] === evaluation.productTotals[symbol]
        return <div key={symbol} className={matched ? 'is-matched' : 'is-unmatched'}><b>{symbol}</b><span>{evaluation.reactantTotals[symbol] || 0}</span><span>{evaluation.productTotals[symbol] || 0}</span></div>
      })}
    </div>
  )
}

export function StageTwoLesson({ question, coefficients, resolved, feedback, onChange, onSubmit, onNext, questionIndex = 0, totalQuestions = 1 }) {
  const evaluation = evaluateReactionCoefficients(question, coefficients)
  return (
    <section className="balance-lesson balance-stage-two">
      <header>
        <div><p>STAGE 2・原子守恆天平</p><h1>{question.prompt}</h1></div>
        <strong>{questionIndex + 1}<small>／{totalQuestions}</small></strong>
      </header>
      <div className="balance-progress" aria-label={`第 ${questionIndex + 1} 題，共 ${totalQuestions} 題`}><i style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }} /></div>
      <aside className="balance-stage-two-tip"><Lightbulb aria-hidden="true" /><span>{question.tip}</span></aside>
      <div className="balance-reaction-board">
        <section aria-label="反應前">
          <h2>反應前</h2>
          <div>{question.reactants.map((term, index) => <ReactionTerm key={term.moleculeId} term={term} coefficient={coefficients.reactants[index]} side="reactants" index={index} disabled={resolved} onChange={onChange} />)}</div>
        </section>
        <ArrowRight className="balance-reaction-arrow" aria-label="生成" />
        <section aria-label="反應後">
          <h2>反應後</h2>
          <div>{question.products.map((term, index) => <ReactionTerm key={term.moleculeId} term={term} coefficient={coefficients.products[index]} side="products" index={index} disabled={resolved} onChange={onChange} />)}</div>
        </section>
      </div>
      <AtomLedger evaluation={evaluation} />
      {!resolved && <button type="button" className="balance-primary" onClick={onSubmit}><CheckCircle2 aria-hidden="true" />檢查是否守恆</button>}
      {feedback && <div className={`balance-feedback ${resolved ? 'is-correct' : 'is-hint'}`} role="status">{resolved ? <CheckCircle2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}<span>{feedback}</span></div>}
      {resolved && <button type="button" className="balance-next" onClick={onNext}>{questionIndex === totalQuestions - 1 ? '查看本關成果' : '下一題'}<ChevronRight aria-hidden="true" /></button>}
    </section>
  )
}

function FormulaTerm({ term, coefficient, side, index, disabled, onChange }) {
  return (
    <article className="balance-formula-term">
      <div className="balance-coefficient-control">
        <button type="button" disabled={disabled || coefficient <= 1} onClick={() => onChange(side, index, -1)} aria-label={`${term.molecule.name}係數減一`}><Minus aria-hidden="true" /></button>
        <output aria-label={`${term.molecule.name}目前係數`}>{coefficient}</output>
        <button type="button" disabled={disabled || coefficient >= 4} onClick={() => onChange(side, index, 1)} aria-label={`${term.molecule.name}係數加一`}><Plus aria-hidden="true" /></button>
      </div>
      <strong><span className={coefficient === 1 ? 'is-one' : ''} aria-hidden={coefficient === 1}>{coefficient}</span>{displayMolecularFormula(term.molecule.formula)}</strong>
      <small>{term.molecule.name}</small>
    </article>
  )
}

function FormulaSide({ terms, coefficients, side, disabled, onChange }) {
  return (
    <div className="balance-formula-side">
      {terms.map((term, index) => (
        <div className="balance-formula-unit" key={term.moleculeId}>
          {index > 0 && <b className="balance-formula-plus" aria-hidden="true">＋</b>}
          <FormulaTerm term={term} coefficient={coefficients[index]} side={side} index={index} disabled={disabled} onChange={onChange} />
        </div>
      ))}
    </div>
  )
}

export function StageThreeLesson({ question, coefficients, resolved, feedback, revealLedger, onChange, onSubmit, onNext, questionIndex = 0, totalQuestions = 1 }) {
  const evaluation = evaluateReactionCoefficients(question, coefficients)
  const showLedger = question.support === 'live' || revealLedger || resolved
  return (
    <section className="balance-lesson balance-stage-three">
      <header>
        <div><p>STAGE 3・係數平衡訓練</p><h1>{question.prompt}</h1></div>
        <strong>{questionIndex + 1}<small>／{totalQuestions}</small></strong>
      </header>
      <div className="balance-progress" aria-label={`第 ${questionIndex + 1} 題，共 ${totalQuestions} 題`}><i style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }} /></div>
      <aside className={`balance-stage-three-guide is-${question.support}`}>
        <b>{question.supportLabel}</b><span>{question.instruction}</span>
      </aside>
      <div className="balance-formula-equation" aria-label="待配平的化學反應式">
        <FormulaSide terms={question.reactants} coefficients={coefficients.reactants} side="reactants" disabled={resolved} onChange={onChange} />
        <ArrowRight className="balance-formula-arrow" aria-label="生成" />
        <FormulaSide terms={question.products} coefficients={coefficients.products} side="products" disabled={resolved} onChange={onChange} />
      </div>
      {showLedger
        ? <AtomLedger evaluation={evaluation} title={resolved && question.support === 'formula-only' ? '完成後核對' : '原子統計'} />
        : <p className="balance-ledger-placeholder">先自行計算反應前後的原子數，再按「檢查配平」。</p>}
      {!resolved && <button type="button" className="balance-primary" onClick={onSubmit}><CheckCircle2 aria-hidden="true" />檢查配平</button>}
      {feedback && <div className={`balance-feedback ${resolved ? 'is-correct' : 'is-hint'}`} role="status">{resolved ? <CheckCircle2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}<span>{feedback}</span></div>}
      {resolved && <button type="button" className="balance-next" onClick={onNext}>{questionIndex === totalQuestions - 1 ? '查看本關成果' : '下一題'}<ChevronRight aria-hidden="true" /></button>}
    </section>
  )
}

function FormulaSelectionTerm({ term, value, side, index, onChange }) {
  return (
    <article className="balance-formula-selection-term">
      <strong>{term.molecule.name}</strong>
      <label>
        <span className="balance-visually-hidden">選擇{term.molecule.name}的化學式</span>
        <select value={value} onChange={(event) => onChange(side, index, event.target.value)} aria-label={`${term.molecule.name}的化學式`}>
          <option value="">選擇化學式</option>
          {term.formulaOptions.map((formula) => <option key={formula} value={formula}>{displayMolecularFormula(formula)}</option>)}
        </select>
      </label>
    </article>
  )
}

function FormulaSelectionSide({ terms, selections, side, onChange }) {
  return (
    <div className="balance-formula-side">
      {terms.map((term, index) => (
        <div className="balance-formula-unit" key={term.moleculeId}>
          {index > 0 && <b className="balance-formula-plus" aria-hidden="true">＋</b>}
          <FormulaSelectionTerm term={term} value={selections[index]} side={side} index={index} onChange={onChange} />
        </div>
      ))}
    </div>
  )
}

export function StageFourLesson({
  question,
  formulaSelections,
  formulaConfirmed,
  coefficients,
  resolved,
  feedback,
  feedbackKind,
  onFormulaChange,
  onFormulaSubmit,
  onCoefficientChange,
  onCoefficientSubmit,
  onNext,
  questionIndex = 0,
  totalQuestions = 1,
}) {
  const evaluation = evaluateReactionCoefficients(question, coefficients)
  return (
    <section className="balance-lesson balance-stage-four">
      <header>
        <div><p>STAGE 4・完整反應式挑戰</p><h1>{question.prompt}</h1></div>
        <strong>{questionIndex + 1}<small>／{totalQuestions}</small></strong>
      </header>
      <div className="balance-progress" aria-label={`第 ${questionIndex + 1} 題，共 ${totalQuestions} 題`}><i style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }} /></div>
      <div className="balance-stage-four-steps" aria-label="本題作答步驟">
        <span className={formulaConfirmed ? 'is-complete' : 'is-current'}><b>1</b>確認化學式</span>
        <ArrowRight aria-hidden="true" />
        <span className={formulaConfirmed ? 'is-current' : ''}><b>2</b>配平係數</span>
      </div>

      {!formulaConfirmed ? (
        <>
          <p className="balance-stage-four-instruction">先依照物質名稱完成化學式，這一步不處理係數。</p>
          <div className="balance-formula-equation is-selection" aria-label="選擇反應物與生成物的化學式">
            <FormulaSelectionSide terms={question.reactants} selections={formulaSelections.reactants} side="reactants" onChange={onFormulaChange} />
            <ArrowRight className="balance-formula-arrow" aria-label="生成" />
            <FormulaSelectionSide terms={question.products} selections={formulaSelections.products} side="products" onChange={onFormulaChange} />
          </div>
          <button type="button" className="balance-primary" onClick={onFormulaSubmit}><CheckCircle2 aria-hidden="true" />檢查化學式</button>
        </>
      ) : (
        <>
          <p className="balance-stage-four-instruction">化學式已固定。只能調整前方係數，並化成最簡整數比。</p>
          <div className="balance-formula-equation" aria-label="完整化學反應式配平">
            <FormulaSide terms={question.reactants} coefficients={coefficients.reactants} side="reactants" disabled={resolved} onChange={onCoefficientChange} />
            <ArrowRight className="balance-formula-arrow" aria-label="生成" />
            <FormulaSide terms={question.products} coefficients={coefficients.products} side="products" disabled={resolved} onChange={onCoefficientChange} />
          </div>
          {resolved
            ? <AtomLedger evaluation={evaluation} title="完整反應式核對" />
            : <p className="balance-ledger-placeholder">完整挑戰不提供作答中的原子統計；請自行逐項計算。</p>}
          {!resolved && <button type="button" className="balance-primary" onClick={onCoefficientSubmit}><CheckCircle2 aria-hidden="true" />檢查完整反應式</button>}
        </>
      )}

      {feedback && <div className={`balance-feedback ${feedbackKind === 'success' ? 'is-correct' : 'is-hint'}`} role="status">{feedbackKind === 'success' ? <CheckCircle2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}<span>{feedback}</span></div>}
      {resolved && <button type="button" className="balance-next" onClick={onNext}>{questionIndex === totalQuestions - 1 ? '查看本關成果' : '下一題'}<ChevronRight aria-hidden="true" /></button>}
    </section>
  )
}

function ResultPanel({ stage, score, bestScore, onRestart, onBack }) {
  const resultMessage = stage === 1
    ? (score >= 80 ? '你已能區分粒子的組成與數量，可以準備挑戰原子守恆。' : '建議再練一次，特別留意前方係數與右下角數字。')
    : stage === 2
      ? (score >= 80 ? '你已能利用粒子與原子統計完成基礎配平，可以準備進入只看化學式的訓練。' : '建議再練一次，調整係數後逐項核對左右兩側的原子數。')
      : stage === 3
        ? (score >= 80 ? '你已能逐步撤除統計提示並直接配平反應式，可以準備挑戰完整反應式。' : '建議再練一次，先處理較容易判斷的元素，最後再檢查所有係數是否為最簡整數比。')
        : (score >= 80 ? '你已能從物質名稱建立完整化學反應式，並以最簡整數係數完成配平。' : '建議再練一次，先確認每一個化學式，再逐項計算反應前後的原子數。')
  return (
    <section className="balance-result">
      <Trophy aria-hidden="true" />
      <p>STAGE {stage} COMPLETE</p>
      <h1>第 {stage} 關完成</h1>
      <strong>{score} 分</strong>
      <span>{resultMessage}</span>
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
  const [bestScore, setBestScore] = useState(() => readStoredScore(bestScoreKey))
  const question = questions[questionIndex]
  const score = stageOneScore(points, questions.length)
  const [stageTwoQuestions, setStageTwoQuestions] = useState(() => buildStageTwoRound())
  const [stageTwoQuestionIndex, setStageTwoQuestionIndex] = useState(0)
  const stageTwoQuestion = stageTwoQuestions[stageTwoQuestionIndex]
  const [stageTwoCoefficients, setStageTwoCoefficients] = useState(() => initialReactionCoefficients(stageTwoQuestion))
  const [stageTwoMistakes, setStageTwoMistakes] = useState(0)
  const [stageTwoResolved, setStageTwoResolved] = useState(false)
  const [stageTwoFeedback, setStageTwoFeedback] = useState('')
  const [stageTwoPoints, setStageTwoPoints] = useState(0)
  const [stageTwoBestScore, setStageTwoBestScore] = useState(() => readStoredScore(stageTwoBestScoreKey))
  const stageTwoScore = stageOneScore(stageTwoPoints, stageTwoQuestions.length)
  const [stageThreeQuestions, setStageThreeQuestions] = useState(() => buildStageThreeRound())
  const [stageThreeQuestionIndex, setStageThreeQuestionIndex] = useState(0)
  const stageThreeQuestion = stageThreeQuestions[stageThreeQuestionIndex]
  const [stageThreeCoefficients, setStageThreeCoefficients] = useState(() => initialReactionCoefficients(stageThreeQuestion))
  const [stageThreeMistakes, setStageThreeMistakes] = useState(0)
  const [stageThreeResolved, setStageThreeResolved] = useState(false)
  const [stageThreeFeedback, setStageThreeFeedback] = useState('')
  const [stageThreeRevealLedger, setStageThreeRevealLedger] = useState(false)
  const [stageThreePoints, setStageThreePoints] = useState(0)
  const [stageThreeBestScore, setStageThreeBestScore] = useState(() => readStoredScore(stageThreeBestScoreKey))
  const stageThreeScore = stageOneScore(stageThreePoints, stageThreeQuestions.length)
  const [stageFourQuestions, setStageFourQuestions] = useState(() => buildStageFourRound())
  const [stageFourQuestionIndex, setStageFourQuestionIndex] = useState(0)
  const stageFourQuestion = stageFourQuestions[stageFourQuestionIndex]
  const [stageFourFormulaSelections, setStageFourFormulaSelections] = useState(() => initialFormulaSelections(stageFourQuestion))
  const [stageFourFormulaConfirmed, setStageFourFormulaConfirmed] = useState(false)
  const [stageFourCoefficients, setStageFourCoefficients] = useState(() => initialReactionCoefficients(stageFourQuestion))
  const [stageFourMistakes, setStageFourMistakes] = useState(0)
  const [stageFourResolved, setStageFourResolved] = useState(false)
  const [stageFourFeedback, setStageFourFeedback] = useState('')
  const [stageFourFeedbackKind, setStageFourFeedbackKind] = useState('hint')
  const [stageFourPoints, setStageFourPoints] = useState(0)
  const [stageFourBestScore, setStageFourBestScore] = useState(() => readStoredScore(stageFourBestScoreKey))
  const stageFourScore = stageOneScore(stageFourPoints, stageFourQuestions.length)

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

  function startStageOne() {
    setRoundId((value) => value + 1)
    setQuestionIndex(0)
    setPoints(0)
    resetQuestion()
    setView('stage1')
    if (typeof window !== 'undefined') window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  function resetStageTwo(nextQuestion) {
    setStageTwoCoefficients(initialReactionCoefficients(nextQuestion))
    setStageTwoMistakes(0)
    setStageTwoResolved(false)
    setStageTwoFeedback('')
  }

  function startStageTwo() {
    const nextQuestions = buildStageTwoRound()
    setStageTwoQuestions(nextQuestions)
    setStageTwoQuestionIndex(0)
    setStageTwoPoints(0)
    resetStageTwo(nextQuestions[0])
    setView('stage2')
    if (typeof window !== 'undefined') window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  function resetStageThree(nextQuestion) {
    setStageThreeCoefficients(initialReactionCoefficients(nextQuestion))
    setStageThreeMistakes(0)
    setStageThreeResolved(false)
    setStageThreeFeedback('')
    setStageThreeRevealLedger(false)
  }

  function startStageThree() {
    const nextQuestions = buildStageThreeRound()
    setStageThreeQuestions(nextQuestions)
    setStageThreeQuestionIndex(0)
    setStageThreePoints(0)
    resetStageThree(nextQuestions[0])
    setView('stage3')
    if (typeof window !== 'undefined') window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  function resetStageFour(nextQuestion) {
    setStageFourFormulaSelections(initialFormulaSelections(nextQuestion))
    setStageFourFormulaConfirmed(false)
    setStageFourCoefficients(initialReactionCoefficients(nextQuestion))
    setStageFourMistakes(0)
    setStageFourResolved(false)
    setStageFourFeedback('')
    setStageFourFeedbackKind('hint')
  }

  function startStageFour() {
    const nextQuestions = buildStageFourRound()
    setStageFourQuestions(nextQuestions)
    setStageFourQuestionIndex(0)
    setStageFourPoints(0)
    resetStageFour(nextQuestions[0])
    setView('stage4')
    if (typeof window !== 'undefined') window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  function startStage(stage) {
    if (stage === 4) startStageFour()
    else if (stage === 3) startStageThree()
    else if (stage === 2) startStageTwo()
    else startStageOne()
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
      saveStoredScore(bestScoreKey, nextBest)
      setView('stage1-result')
      return
    }
    setQuestionIndex((value) => value + 1)
    resetQuestion()
  }

  function changeStageTwoCoefficient(side, index, delta) {
    setStageTwoCoefficients((current) => ({
      ...current,
      [side]: current[side].map((value, termIndex) => termIndex === index ? Math.max(1, Math.min(4, value + delta)) : value),
    }))
    setStageTwoFeedback('')
  }

  function submitStageTwo() {
    const evaluation = evaluateReactionCoefficients(stageTwoQuestion, stageTwoCoefficients)
    if (evaluation.simplest) {
      setStageTwoResolved(true)
      setStageTwoPoints((value) => value + pointsForAttempt(stageTwoMistakes))
      setStageTwoFeedback(`配平正確！${describeReactionBalance(evaluation)}`)
      return
    }
    setStageTwoMistakes((value) => value + 1)
    setStageTwoFeedback(describeReactionBalance(evaluation))
  }

  function nextStageTwoQuestion() {
    if (stageTwoQuestionIndex === stageTwoQuestions.length - 1) {
      const nextBest = Math.max(stageTwoBestScore, stageTwoScore)
      setStageTwoBestScore(nextBest)
      saveStoredScore(stageTwoBestScoreKey, nextBest)
      setView('stage2-result')
      return
    }
    const nextIndex = stageTwoQuestionIndex + 1
    setStageTwoQuestionIndex(nextIndex)
    resetStageTwo(stageTwoQuestions[nextIndex])
  }

  function changeStageThreeCoefficient(side, index, delta) {
    setStageThreeCoefficients((current) => ({
      ...current,
      [side]: current[side].map((value, termIndex) => termIndex === index ? Math.max(1, Math.min(4, value + delta)) : value),
    }))
    setStageThreeFeedback('')
  }

  function submitStageThree() {
    const evaluation = evaluateReactionCoefficients(stageThreeQuestion, stageThreeCoefficients)
    const message = stageThreeQuestion.support === 'formula-only'
      ? describeFormulaOnlyBalance(evaluation)
      : describeReactionBalance(evaluation)
    if (evaluation.simplest) {
      setStageThreeResolved(true)
      setStageThreePoints((value) => value + pointsForAttempt(stageThreeMistakes))
      setStageThreeFeedback(`配平正確！${message}`)
      return
    }
    setStageThreeMistakes((value) => value + 1)
    if (stageThreeQuestion.support === 'after-check') setStageThreeRevealLedger(true)
    setStageThreeFeedback(message)
  }

  function nextStageThreeQuestion() {
    if (stageThreeQuestionIndex === stageThreeQuestions.length - 1) {
      const nextBest = Math.max(stageThreeBestScore, stageThreeScore)
      setStageThreeBestScore(nextBest)
      saveStoredScore(stageThreeBestScoreKey, nextBest)
      setView('stage3-result')
      return
    }
    const nextIndex = stageThreeQuestionIndex + 1
    setStageThreeQuestionIndex(nextIndex)
    resetStageThree(stageThreeQuestions[nextIndex])
  }

  function changeStageFourFormula(side, index, value) {
    setStageFourFormulaSelections((current) => ({
      ...current,
      [side]: current[side].map((formula, termIndex) => termIndex === index ? value : formula),
    }))
    setStageFourFeedback('')
  }

  function submitStageFourFormulas() {
    const evaluation = evaluateFormulaSelections(stageFourQuestion, stageFourFormulaSelections)
    if (evaluation.correct) {
      setStageFourFormulaConfirmed(true)
      setStageFourFeedbackKind('success')
      setStageFourFeedback(describeFormulaSelections(evaluation))
      return
    }
    setStageFourMistakes((value) => value + 1)
    setStageFourFeedbackKind('hint')
    setStageFourFeedback(describeFormulaSelections(evaluation))
  }

  function changeStageFourCoefficient(side, index, delta) {
    setStageFourCoefficients((current) => ({
      ...current,
      [side]: current[side].map((value, termIndex) => termIndex === index ? Math.max(1, Math.min(4, value + delta)) : value),
    }))
    setStageFourFeedback('')
  }

  function submitStageFourCoefficients() {
    const evaluation = evaluateReactionCoefficients(stageFourQuestion, stageFourCoefficients)
    const message = describeFormulaOnlyBalance(evaluation)
    if (evaluation.simplest) {
      setStageFourResolved(true)
      setStageFourPoints((value) => value + pointsForAttempt(stageFourMistakes))
      setStageFourFeedbackKind('success')
      setStageFourFeedback(`完整反應式正確！${message}`)
      return
    }
    setStageFourMistakes((value) => value + 1)
    setStageFourFeedbackKind('hint')
    setStageFourFeedback(message)
  }

  function nextStageFourQuestion() {
    if (stageFourQuestionIndex === stageFourQuestions.length - 1) {
      const nextBest = Math.max(stageFourBestScore, stageFourScore)
      setStageFourBestScore(nextBest)
      saveStoredScore(stageFourBestScoreKey, nextBest)
      setView('stage4-result')
      return
    }
    const nextIndex = stageFourQuestionIndex + 1
    setStageFourQuestionIndex(nextIndex)
    resetStageFour(stageFourQuestions[nextIndex])
  }

  return (
    <div className="chemical-balance-shell">
      <nav className="balance-floating-nav" aria-label="學習系統導覽">
        {view !== 'roadmap' && <button type="button" onClick={() => setView('roadmap')}><ArrowLeft aria-hidden="true" />返回學習路線</button>}
        <a href={learningHubUrl('?subject=science')}><Home aria-hidden="true" />返回自然科</a>
        <a href={contactBookUrl}><ArrowLeft aria-hidden="true" />返回聯絡簿</a>
      </nav>
      <main>
        {view === 'roadmap' && <Roadmap bestScore={bestScore} stageTwoBestScore={stageTwoBestScore} stageThreeBestScore={stageThreeBestScore} stageFourBestScore={stageFourBestScore} onStart={startStage} />}

        {view === 'stage1' && (
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

        {view === 'stage2' && <StageTwoLesson
          question={stageTwoQuestion}
          coefficients={stageTwoCoefficients}
          resolved={stageTwoResolved}
          feedback={stageTwoFeedback}
          onChange={changeStageTwoCoefficient}
          onSubmit={submitStageTwo}
          onNext={nextStageTwoQuestion}
          questionIndex={stageTwoQuestionIndex}
          totalQuestions={stageTwoQuestions.length}
        />}

        {view === 'stage3' && <StageThreeLesson
          question={stageThreeQuestion}
          coefficients={stageThreeCoefficients}
          resolved={stageThreeResolved}
          feedback={stageThreeFeedback}
          revealLedger={stageThreeRevealLedger}
          onChange={changeStageThreeCoefficient}
          onSubmit={submitStageThree}
          onNext={nextStageThreeQuestion}
          questionIndex={stageThreeQuestionIndex}
          totalQuestions={stageThreeQuestions.length}
        />}

        {view === 'stage4' && <StageFourLesson
          question={stageFourQuestion}
          formulaSelections={stageFourFormulaSelections}
          formulaConfirmed={stageFourFormulaConfirmed}
          coefficients={stageFourCoefficients}
          resolved={stageFourResolved}
          feedback={stageFourFeedback}
          feedbackKind={stageFourFeedbackKind}
          onFormulaChange={changeStageFourFormula}
          onFormulaSubmit={submitStageFourFormulas}
          onCoefficientChange={changeStageFourCoefficient}
          onCoefficientSubmit={submitStageFourCoefficients}
          onNext={nextStageFourQuestion}
          questionIndex={stageFourQuestionIndex}
          totalQuestions={stageFourQuestions.length}
        />}

        {view === 'stage1-result' && <ResultPanel stage={1} score={score} bestScore={bestScore} onRestart={startStageOne} onBack={() => setView('roadmap')} />}
        {view === 'stage2-result' && <ResultPanel stage={2} score={stageTwoScore} bestScore={stageTwoBestScore} onRestart={startStageTwo} onBack={() => setView('roadmap')} />}
        {view === 'stage3-result' && <ResultPanel stage={3} score={stageThreeScore} bestScore={stageThreeBestScore} onRestart={startStageThree} onBack={() => setView('roadmap')} />}
        {view === 'stage4-result' && <ResultPanel stage={4} score={stageFourScore} bestScore={stageFourBestScore} onRestart={startStageFour} onBack={() => setView('roadmap')} />}
      </main>
    </div>
  )
}
