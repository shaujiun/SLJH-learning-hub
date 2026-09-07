import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Atom,
  BookOpenCheck,
  Braces,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Home,
  Keyboard,
  Layers3,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Undo2,
  XCircle,
} from 'lucide-react'
import {
  chemistryIons,
  commonPolyatomicIons,
  ionicCompounds,
  typicalIonElements,
} from '../data/chemicalFormula.js'
import {
  advancedIonClue,
  basicChargeChoices,
  basicTransferChoices,
  buildAdvancedChemistryRound,
  buildAdvancedSteps,
  buildBasicChemistryRound,
  buildFormulaTiles,
  buildPolyatomicRound,
  chemistryScore,
  displayCompoundFormula,
  displayIonFormula,
  evaluateChemistryStep,
  polyatomicQuestionView,
  transferAnswer,
  transferLabel,
} from '../lib/chemicalFormula.js'
import { learningHubUrl } from '../lib/guestPractice.js'
import './chemicalFormulaOutpost.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'
const bestScoreStorageKey = 'sljh.chemicalFormulaOutpost.bestScores.v1'

const modeOptions = [
  {
    id: 'basic',
    label: '基礎',
    title: '電子偵查站',
    description: '觀察質子、中子與電子，判斷原子容易得到或失去幾個電子，以及形成離子的電荷。',
    count: '10 種元素・20 個步驟',
    icon: Atom,
  },
  {
    id: 'general',
    label: '一般',
    title: '根離子辨識站',
    description: '練習 8 種常見根離子的名稱、組成與電荷，建立整組辨認的習慣。',
    count: '每回合 10 題',
    icon: Layers3,
  },
  {
    id: 'advanced',
    label: '進階',
    title: '化學式組裝站',
    description: '從化合物名稱開始，依序找離子、看電荷、配數量，再用積木組成化學式。',
    count: '每回合 5 個案件・20 個步驟',
    icon: Braces,
  },
]

function readBestScores() {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    return JSON.parse(window.localStorage.getItem(bestScoreStorageKey) || '{}')
  } catch {
    return {}
  }
}

function saveBestScore(mode, score, currentScores) {
  const nextScores = { ...currentScores, [mode]: Math.max(Number(currentScores[mode]) || 0, score) }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(bestScoreStorageKey, JSON.stringify(nextScores))
    } catch {
      // The game remains usable when private browsing blocks local storage.
    }
  }
  return nextScores
}

function OutpostNavigation() {
  return (
    <nav className="chemical-floating-nav" aria-label="學習系統導覽">
      <a href={learningHubUrl()}><Home aria-hidden="true" />返回任務頁</a>
      <a href={contactBookUrl}><ArrowLeft aria-hidden="true" />返回聯絡簿</a>
    </nav>
  )
}

function SetupPanel({ mode, onModeChange, onStart, bestScores }) {
  return (
    <>
      <section className="chemical-hero">
        <div>
          <p>CHEMISTRY OUTPOST</p>
          <h1>先看懂離子，再組出化學式</h1>
          <span>這裡是「化學事」桌遊前的訓練基地。一步一步找出電荷如何平衡，不必只靠背答案。</span>
        </div>
        <div className="chemical-hero-art" aria-hidden="true">
          <FlaskConical />
          <i>＋</i><b>－</b>
        </div>
      </section>

      <section className="chemical-setup-panel" aria-labelledby="chemical-mode-title">
        <div className="chemical-section-heading">
          <span><Sparkles aria-hidden="true" /></span>
          <div>
            <p>TRAINING ROUTE</p>
            <h2 id="chemical-mode-title">選擇這次的訓練站</h2>
          </div>
        </div>

        <div className="chemical-mode-grid">
          {modeOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                type="button"
                key={option.id}
                className={mode === option.id ? 'is-selected' : ''}
                onClick={() => onModeChange(option.id)}
                aria-pressed={mode === option.id}
              >
                <span className="chemical-mode-icon"><Icon aria-hidden="true" /></span>
                <small>{option.label}</small>
                <strong>{option.title}</strong>
                <p>{option.description}</p>
                <b>{option.count}</b>
                <em>本機最佳：{bestScores[option.id] == null ? '尚無紀錄' : `${bestScores[option.id]} 分`}</em>
              </button>
            )
          })}
        </div>

        <aside className="chemical-learning-note">
          <Lightbulb aria-hidden="true" />
          <span><strong>答錯不用急：</strong>第一次先重新觀察，第二次出現關鍵提示，第三次才顯示答案與判斷方法。</span>
        </aside>

        <button type="button" className="chemical-primary-button" onClick={onStart}>
          <Play aria-hidden="true" />進入前哨站
        </button>
      </section>
    </>
  )
}

function nucleusPositions(count) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, index) => {
    const radius = 3 + Math.sqrt((index + 0.5) / count) * 35
    const angle = index * goldenAngle
    return { x: 180 + Math.cos(angle) * radius, y: 180 + Math.sin(angle) * radius }
  })
}

function nucleusParticleKinds(protons, neutrons) {
  const kinds = []
  const largestCount = Math.max(protons, neutrons)
  for (let index = 0; index < largestCount; index += 1) {
    if (index < protons) kinds.push('proton')
    if (index < neutrons) kinds.push('neutron')
  }
  return kinds
}

function electronPositions(shells) {
  const radii = shells.length === 4 ? [65, 96, 126, 154] : [72, 112, 150]
  return shells.flatMap((count, shellIndex) => Array.from({ length: count }, (_, index) => {
    const offset = shellIndex % 2 ? Math.PI / Math.max(1, count) : -Math.PI / 2
    const angle = offset + (Math.PI * 2 * index) / count
    return {
      shellIndex,
      x: 180 + Math.cos(angle) * radii[shellIndex],
      y: 180 + Math.sin(angle) * radii[shellIndex],
    }
  }))
}

function AtomModel({ element, ion = false, revealCharge = false }) {
  const shells = ion ? element.ionShells : element.shells
  const electrons = shells.reduce((total, count) => total + count, 0)
  const particleKinds = nucleusParticleKinds(element.atomicNumber, element.neutrons)
  const particles = nucleusPositions(particleKinds.length)
  const electronDots = electronPositions(shells)
  const radii = shells.length === 4 ? [65, 96, 126, 154] : [72, 112, 150]

  return (
    <figure className={`chemical-atom-card ${ion ? 'is-ion' : ''}`}>
      <figcaption>
        <strong>{ion ? '形成的離子' : `${element.name}原子`}</strong>
        <span>{element.atomicNumber} 個質子・{element.neutrons} 個中子・{electrons} 個電子</span>
      </figcaption>
      <svg viewBox="0 0 360 360" role="img" aria-label={`${element.name}${ion ? '離子' : '原子'}：${element.atomicNumber} 個質子、${element.neutrons} 個中子、${electrons} 個電子`}>
        {shells.map((_, index) => <circle key={`shell-${index}`} className="chemical-electron-shell" cx="180" cy="180" r={radii[index]} />)}
        <circle className="chemical-nucleus-halo" cx="180" cy="180" r="45" />
        {particles.map((position, index) => {
          const proton = particleKinds[index] === 'proton'
          return (
            <g key={`particle-${index}`} className={proton ? 'chemical-proton' : 'chemical-neutron'}>
              <circle cx={position.x} cy={position.y} r={particles.length > 34 ? 5.2 : 6.2} />
              <text x={position.x} y={position.y + 2.5}>{proton ? '+' : '0'}</text>
            </g>
          )
        })}
        {electronDots.map((position, index) => (
          <g key={`electron-${index}`} className="chemical-electron">
            <circle cx={position.x} cy={position.y} r="7.2" />
            <text x={position.x} y={position.y + 3}>−</text>
          </g>
        ))}
      </svg>
      {ion && revealCharge && <div className="chemical-ion-answer">{displayIonFormula({ formula: element.symbol, charge: element.charge })}</div>}
    </figure>
  )
}

function ParticleLegend() {
  return (
    <div className="chemical-particle-legend" aria-label="粒子圖例">
      <span><i className="is-proton">＋</i>質子：帶正電</span>
      <span><i className="is-neutron">0</i>中子：不帶電</span>
      <span><i className="is-electron">－</i>電子：帶負電</span>
    </div>
  )
}

function BasicVisual({ element, stepId, resolved }) {
  const showIon = stepId === 'charge'
  return (
    <div className="chemical-basic-visual">
      <div className={showIon ? 'chemical-atom-comparison' : 'chemical-atom-single'}>
        <AtomModel element={element} />
        {showIon && (
          <>
            <div className="chemical-transfer-arrow" aria-label={transferLabel(transferAnswer(element))}>
              <span>{transferLabel(transferAnswer(element))}</span><b>→</b>
            </div>
            <AtomModel element={element} ion revealCharge={resolved} />
          </>
        )}
      </div>
      <ParticleLegend />
      <p className="chemical-isotope-note">此模型採常見同位素呈現；元素種類由質子數決定，中子數不影響離子電荷。</p>
    </div>
  )
}

function ChoiceGrid({ choices, attemptedAnswers, resolved, correctAnswer, onChoose }) {
  return (
    <div className="chemical-choice-grid">
      {choices.map((choice, index) => {
        const attempted = attemptedAnswers.includes(choice.value)
        const correct = resolved && choice.value === correctAnswer
        return (
          <button
            type="button"
            key={`${choice.value}-${index}`}
            className={correct ? 'is-correct' : attempted ? 'is-wrong' : ''}
            disabled={resolved || attempted}
            onClick={() => onChoose(choice.value)}
          >
            <b>{String.fromCharCode(65 + index)}</b>
            <span>{choice.label}</span>
            {correct && <CheckCircle2 aria-hidden="true" />}
            {attempted && !correct && <XCircle aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}

function FormulaBuilder({ tiles, selectedTiles, typedFormula, resolved, onAdd, onRemove, onClear, onType, onSubmit }) {
  const assembled = selectedTiles.map((tile) => tile.label).join('')
  return (
    <div className="chemical-formula-builder">
      <div className="chemical-formula-stage" aria-label="目前組成的化學式">
        {selectedTiles.length === 0
          ? <span>依序點選下方積木</span>
          : selectedTiles.map((tile, index) => (
            <button type="button" key={`${tile.id}-${index}`} onClick={() => onRemove(index)} disabled={resolved} title="點一下移除">
              {tile.label}
            </button>
          ))}
      </div>
      <div className="chemical-builder-tools">
        <button type="button" onClick={onClear} disabled={resolved || selectedTiles.length === 0}><Undo2 aria-hidden="true" />清除積木</button>
        <span>{assembled && `目前：${assembled}`}</span>
      </div>
      <div className="chemical-tile-bank" aria-label="化學式積木">
        {tiles.map((tile) => (
          <button
            type="button"
            key={tile.id}
            disabled={resolved || selectedTiles.some((selected) => selected.id === tile.id)}
            onClick={() => onAdd(tile)}
          >
            {tile.label}
          </button>
        ))}
      </div>
      <label className="chemical-keyboard-input">
        <span><Keyboard aria-hidden="true" />也可用鍵盤輸入；一般數字會自動視為下標</span>
        <input
          type="text"
          value={typedFormula}
          onChange={(event) => onType(event.target.value)}
          placeholder="例如：Ca(OH)2"
          disabled={resolved}
          autoCapitalize="off"
          autoComplete="off"
          spellCheck="false"
        />
      </label>
      <button
        type="button"
        className="chemical-primary-button"
        disabled={resolved || (!typedFormula.trim() && selectedTiles.length === 0)}
        onClick={() => onSubmit(typedFormula.trim() || assembled)}
      >
        <CheckCircle2 aria-hidden="true" />確認化學式
      </button>
    </div>
  )
}

function FeedbackPanel({ feedback, mistakeCount, resolved }) {
  if (!feedback) return null
  return (
    <aside className={`chemical-feedback ${feedback.correct ? 'is-correct' : 'is-wrong'}`} aria-live="polite">
      {feedback.correct ? <CheckCircle2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}
      <div>
        <strong>{feedback.correct ? `本步獲得 ${feedback.points} 分` : resolved ? '完整判斷' : `再判斷一次（已答錯 ${mistakeCount} 次）`}</strong>
        <p>{feedback.message}</p>
      </div>
    </aside>
  )
}

function AdvancedIonClue({ compound, stepId }) {
  const clue = advancedIonClue(compound, stepId)
  if (!clue) return null
  return (
    <aside className="chemical-ion-clue" aria-label={clue.caption}>
      <span>{clue.caption}</span>
      <div>
        <section><small>陽離子</small><strong>{clue.cation}</strong></section>
        <b aria-hidden="true">＋</b>
        <section><small>陰離子</small><strong>{clue.anion}</strong></section>
      </div>
    </aside>
  )
}

function PracticePanel({
  mode,
  currentCase,
  currentStep,
  caseIndex,
  roundLength,
  stepIndex,
  completedSteps,
  totalSteps,
  points,
  mistakeCount,
  attemptedAnswers,
  feedback,
  resolved,
  selectedTiles,
  typedFormula,
  onChoose,
  onAddTile,
  onRemoveTile,
  onClearTiles,
  onTypeFormula,
  onSubmitFormula,
  onNext,
}) {
  const progress = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0
  const modeName = modeOptions.find((option) => option.id === mode)?.title

  return (
    <section className="chemical-practice-shell">
      <div className="chemical-round-status">
        <div><span>{modeName}・案件 {caseIndex + 1}／{roundLength}</span><strong>{points} 分</strong></div>
        <div className="chemical-progress" aria-label={`目前完成 ${progress}%`}><i style={{ width: `${progress}%` }} /></div>
      </div>

      <article className="chemical-question-card">
        <span className="chemical-step-badge">{mode === 'advanced' ? `${stepIndex + 1}／4` : mode === 'basic' ? `${stepIndex + 1}／2` : '根離子'}</span>
        <header>
          <p>{currentStep.title}</p>
          <h1>{currentCase.title}</h1>
        </header>

        {mode === 'basic' && <BasicVisual element={currentCase.element} stepId={currentStep.id} resolved={resolved} />}
        {mode === 'general' && (
          <div className="chemical-root-card" aria-hidden="true">
            <span>ROOT ION</span>
            <strong>{currentCase.questionMode === 'name-to-formula'
              ? '?'
              : currentCase.ion.formula.replace(/\d/g, (digit) => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)])}</strong>
          </div>
        )}
        {mode === 'advanced' && (
          <>
            <div className="chemical-compound-banner">
              <span>待破解的化合物</span>
              <strong>{currentCase.compound.name}</strong>
              {resolved && currentStep.id === 'formula' && <b>{displayCompoundFormula(currentCase.compound.formula)}</b>}
            </div>
            <AdvancedIonClue compound={currentCase.compound} stepId={currentStep.id} />
          </>
        )}

        <div className="chemical-question-copy">
          <span>請判斷</span>
          <h2>{currentStep.prompt}</h2>
        </div>

        {currentStep.formula ? (
          <FormulaBuilder
            tiles={currentCase.formulaTiles}
            selectedTiles={selectedTiles}
            typedFormula={typedFormula}
            resolved={resolved}
            onAdd={onAddTile}
            onRemove={onRemoveTile}
            onClear={onClearTiles}
            onType={onTypeFormula}
            onSubmit={onSubmitFormula}
          />
        ) : (
          <ChoiceGrid
            choices={currentStep.choices}
            attemptedAnswers={attemptedAnswers}
            resolved={resolved}
            correctAnswer={currentStep.answer}
            onChoose={onChoose}
          />
        )}

        <FeedbackPanel feedback={feedback} mistakeCount={mistakeCount} resolved={resolved} />
        {resolved && (
          <button type="button" className="chemical-primary-button chemical-next-button" onClick={onNext}>
            {completedSteps === totalSteps ? '查看訓練成果' : stepIndex < currentCase.steps.length - 1 ? '進入下一步' : '下一個案件'}
            <ChevronRight aria-hidden="true" />
          </button>
        )}
      </article>
    </section>
  )
}

function ResultPanel({ mode, score, points, results, bestScore, onRestart, onBack }) {
  const firstTry = results.filter((result) => result.correct && result.mistakeCount === 0).length
  const modeName = modeOptions.find((option) => option.id === mode)?.title
  return (
    <section className="chemical-result-panel">
      <div className="chemical-result-icon"><Trophy aria-hidden="true" /></div>
      <p>TRAINING COMPLETE</p>
      <h1>前哨站訓練完成</h1>
      <span className="chemical-result-mode">{modeName}</span>
      <div className="chemical-score-ring"><strong>{score}</strong><span>分</span></div>
      <div className="chemical-result-stats">
        <div><strong>{points}</strong><span>訓練積分</span></div>
        <div><strong>{firstTry}／{results.length}</strong><span>一次判斷正確</span></div>
        <div><strong>{bestScore}</strong><span>本機最佳分數</span></div>
      </div>
      <div className="chemical-review-list">
        <h2>訓練紀錄</h2>
        {results.map((result, index) => (
          <details key={`${result.caseId}-${result.stepId}-${index}`}>
            <summary><span>{result.caseTitle}・{result.stepTitle}</span><b>{result.points} 分</b></summary>
            <p>{result.explanation}</p>
          </details>
        ))}
      </div>
      <div className="chemical-result-actions">
        <button type="button" className="chemical-primary-button" onClick={onRestart}><RotateCcw aria-hidden="true" />再練習一次</button>
        <button type="button" className="chemical-secondary-button" onClick={onBack}>更換訓練站</button>
      </div>
    </section>
  )
}

function prepareRound(mode) {
  if (mode === 'basic') {
    return buildBasicChemistryRound(typicalIonElements, 10).map((element) => ({
      id: element.id,
      title: `${element.name}（${element.symbol}）`,
      element,
      steps: [
        {
          id: 'transfer',
          title: '第 1 步：判斷得失電子',
          prompt: `${element.name}原子最外層有 ${element.shells.at(-1)} 個電子，形成穩定離子時，容易怎麼改變？`,
          answer: transferAnswer(element),
          choices: basicTransferChoices(element),
          hint: `先看最外層的 ${element.shells.at(-1)} 個電子，想想得到或失去較少的電子就能接近穩定排列。`,
          explanation: `${element.name}原子容易${transferLabel(transferAnswer(element))}，形成較穩定的電子排列。`,
        },
        {
          id: 'charge',
          title: '第 2 步：判斷離子電荷',
          prompt: `${element.name}原子${transferLabel(transferAnswer(element))}後，形成的離子帶多少電荷？`,
          answer: String(element.charge),
          choices: basicChargeChoices(element),
          hint: `${element.transfer === 'lose' ? '失去負電荷後會帶正電' : '得到負電荷後會帶負電'}，電荷數等於轉移的電子數。`,
          explanation: `${element.name}有 ${element.atomicNumber} 個質子，形成離子後有 ${element.ionShells.reduce((sum, count) => sum + count, 0)} 個電子，因此寫作 ${displayIonFormula({ formula: element.symbol, charge: element.charge })}。`,
        },
      ],
    }))
  }
  if (mode === 'general') {
    return buildPolyatomicRound(commonPolyatomicIons, 10).map((question) => {
      const view = polyatomicQuestionView(question, commonPolyatomicIons)
      return {
        id: question.id,
        title: question.ion.name,
        ion: question.ion,
        questionMode: question.mode,
        steps: [{ id: question.mode, title: '根離子辨識', ...view }],
      }
    })
  }
  return buildAdvancedChemistryRound(ionicCompounds, 5).map((compound) => ({
    id: compound.id,
    title: compound.name,
    compound,
    steps: buildAdvancedSteps(compound, chemistryIons),
    formulaTiles: buildFormulaTiles(compound, chemistryIons),
  }))
}

export default function ChemicalFormulaOutpost() {
  const [phase, setPhase] = useState('setup')
  const [mode, setMode] = useState('basic')
  const [round, setRound] = useState([])
  const [caseIndex, setCaseIndex] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [mistakeCount, setMistakeCount] = useState(0)
  const [attemptedAnswers, setAttemptedAnswers] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [resolved, setResolved] = useState(false)
  const [points, setPoints] = useState(0)
  const [results, setResults] = useState([])
  const [selectedTiles, setSelectedTiles] = useState([])
  const [typedFormula, setTypedFormula] = useState('')
  const [bestScores, setBestScores] = useState(readBestScores)

  const currentCase = round[caseIndex]
  const currentStep = currentCase?.steps[stepIndex]
  const totalSteps = useMemo(() => round.reduce((total, item) => total + item.steps.length, 0), [round])
  const completedSteps = results.length
  const finalScore = chemistryScore(points, totalSteps)
  const bestScore = Math.max(Number(bestScores[mode]) || 0, finalScore)

  const resetStep = () => {
    setMistakeCount(0)
    setAttemptedAnswers([])
    setFeedback(null)
    setResolved(false)
    setSelectedTiles([])
    setTypedFormula('')
  }

  const startRound = () => {
    setRound(prepareRound(mode))
    setCaseIndex(0)
    setStepIndex(0)
    setPoints(0)
    setResults([])
    resetStep()
    setPhase('playing')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const submitAnswer = (answer) => {
    if (!currentCase || !currentStep || resolved) return
    if (!currentStep.formula && attemptedAnswers.includes(answer)) return
    const outcome = evaluateChemistryStep({
      answer,
      expected: currentStep.answer,
      previousMistakes: mistakeCount,
      hint: currentStep.hint,
      explanation: currentStep.explanation,
      formula: currentStep.formula,
    })
    if (!currentStep.formula) setAttemptedAnswers((items) => [...items, answer])
    setFeedback(outcome)
    if (!outcome.correct) setMistakeCount(outcome.mistakeCount)
    if (!outcome.resolved) return
    setResolved(true)
    setPoints((value) => value + outcome.points)
    setResults((items) => [...items, {
      caseId: currentCase.id,
      caseTitle: currentCase.title,
      stepId: currentStep.id,
      stepTitle: currentStep.title,
      explanation: currentStep.explanation,
      correct: outcome.correct,
      mistakeCount: outcome.correct ? mistakeCount : outcome.mistakeCount,
      points: outcome.points,
    }])
  }

  const goNext = () => {
    if (stepIndex < currentCase.steps.length - 1) {
      setStepIndex((value) => value + 1)
      resetStep()
      return
    }
    if (caseIndex < round.length - 1) {
      setCaseIndex((value) => value + 1)
      setStepIndex(0)
      resetStep()
      return
    }
    setBestScores((scores) => saveBestScore(mode, finalScore, scores))
    setPhase('result')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="chemical-shell">
      <OutpostNavigation />
      <header className="chemical-header">
        <a href="?subject=science"><FlaskConical aria-hidden="true" /><span>化學事前哨站</span></a>
        <span>八上第 6 章起適用</span>
      </header>
      <main className="chemical-main">
        {phase === 'setup' && <SetupPanel mode={mode} onModeChange={setMode} onStart={startRound} bestScores={bestScores} />}
        {phase === 'playing' && currentCase && currentStep && (
          <PracticePanel
            mode={mode}
            currentCase={currentCase}
            currentStep={currentStep}
            caseIndex={caseIndex}
            roundLength={round.length}
            stepIndex={stepIndex}
            completedSteps={completedSteps}
            totalSteps={totalSteps}
            points={points}
            mistakeCount={mistakeCount}
            attemptedAnswers={attemptedAnswers}
            feedback={feedback}
            resolved={resolved}
            selectedTiles={selectedTiles}
            typedFormula={typedFormula}
            onChoose={submitAnswer}
            onAddTile={(tile) => {
              setTypedFormula('')
              setSelectedTiles((items) => [...items, tile])
            }}
            onRemoveTile={(index) => setSelectedTiles((items) => items.filter((_, itemIndex) => itemIndex !== index))}
            onClearTiles={() => setSelectedTiles([])}
            onTypeFormula={(value) => {
              setSelectedTiles([])
              setTypedFormula(value)
            }}
            onSubmitFormula={submitAnswer}
            onNext={goNext}
          />
        )}
        {phase === 'result' && (
          <ResultPanel
            mode={mode}
            score={finalScore}
            points={points}
            results={results}
            bestScore={bestScore}
            onRestart={startRound}
            onBack={() => setPhase('setup')}
          />
        )}
      </main>
    </div>
  )
}
