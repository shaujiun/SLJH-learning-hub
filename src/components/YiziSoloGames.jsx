import { useEffect, useMemo, useRef, useState } from 'react'
import { SafeHandwritingAnswer } from './HandwritingAnswer.jsx'
import YiziFourSayingsRoom from './YiziFourSayingsRoom.jsx'
import YiziWordCompetitionRoom from './YiziWordCompetitionRoom.jsx'
import {
  acceptedAnswers, arrangeFourSayingsIdioms, checkYiziAnswer, formatTimeChoice,
  normalizeChineseAnswer, orderedFourSayingsAnswer, scoreFourSayings, shuffleItems,
  pickQuestionFromCycle,
  updateFourSayingsSelection, YIZI_DIFFICULTIES, YIZI_TIME_OPTIONS,
} from '../lib/yiziQianjin.js'
import { buildYiziProgress } from '../lib/activityProgress.js'
import { trackLearningActivityAttempt } from '../services/learningProgressService.js'
import { recordYiziAttempt } from '../services/yiziQianjinService.js'

function useRoundTimer(seconds, running, onExpire) {
  const [remaining, setRemaining] = useState(Number(seconds) || 0)
  const expireRef = useRef(onExpire)
  expireRef.current = onExpire
  useEffect(() => {
    setRemaining(Number(seconds) || 0)
    if (!running || !Number(seconds)) return undefined
    const deadline = Date.now() + Number(seconds) * 1000
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(next)
      if (next === 0) expireRef.current?.()
    }
    const timer = window.setInterval(tick, 250)
    tick()
    return () => window.clearInterval(timer)
  }, [running, seconds])
  return remaining
}

function pickQuestion(questions, previousId = '') {
  const pool = questions.filter((question) => question.id !== previousId)
  const choices = pool.length ? pool : questions
  return choices[Math.floor(Math.random() * choices.length)] || null
}

function ModeSettings({ gameType, difficulty, setDifficulty, timeLimit, setTimeLimit, disabled }) {
  return <div className="yizi-settings">
    <label>難度<select value={difficulty} disabled={disabled} onChange={(event) => setDifficulty(Number(event.target.value))}>
      <option value="0">混合</option>{YIZI_DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </select></label>
    <label>時間<select value={timeLimit} disabled={disabled} onChange={(event) => setTimeLimit(Number(event.target.value))}>
      {YIZI_TIME_OPTIONS[gameType].map((seconds) => <option key={seconds} value={seconds}>{formatTimeChoice(seconds)}</option>)}
    </select></label>
  </div>
}

function AnswerInput({ length, value, onChange, inputMode, setInputMode, allowClick = false, resetKey = '', children }) {
  return <div className="yizi-answer-area">
    <div className="yizi-input-tabs" role="tablist" aria-label="作答方式">
      {allowClick && <button type="button" className={inputMode === 'click' ? 'is-active' : ''} onClick={() => setInputMode('click')}>點選</button>}
      <button type="button" className={inputMode === 'keyboard' ? 'is-active' : ''} onClick={() => setInputMode('keyboard')}>輸入</button>
      <button type="button" className={inputMode === 'handwriting' ? 'is-active' : ''} onClick={() => setInputMode('handwriting')}>手寫</button>
    </div>
    {inputMode === 'click' && children}
    {inputMode === 'keyboard' && <label className="yizi-keyboard-answer">輸入答案
      <input value={value} maxLength={length} autoComplete="off" onChange={(event) => onChange(event.target.value)} />
    </label>}
    {inputMode === 'handwriting' && <SafeHandwritingAnswer resetKey={resetKey} length={length} value={value} onChange={onChange}
      onFallback={() => setInputMode('keyboard')} />}
  </div>
}

function feedbackClass(feedback) {
  return feedback?.type ? `yizi-feedback is-${feedback.type}` : 'yizi-feedback'
}

async function persistResult({ context, question, gameType, timeLimit, answer, correct, score, progressScore = null, correctCount = null, questionCount = 1, startedAt, metadata = {} }) {
  const durationMs = Math.max(0, Date.now() - startedAt)
  const modeCode = `${timeLimit ? `timed_${timeLimit}` : 'untimed'}_d${question?.difficulty || 0}`
  if (context.remoteEnabled && context.studentId) {
    recordYiziAttempt({ questionId: question?.id, gameType, modeCode, answerText: answer, correct, score, durationMs, metadata }).catch(() => null)
  }
  trackLearningActivityAttempt(buildYiziProgress({
    gameType, modeCode,
    score: progressScore ?? (gameType === 'four_sayings' ? score * 50 : correct ? 100 : 0),
    correctCount: correctCount ?? (correct ? 1 : 0), questionCount, durationMs,
    metadata: { difficulty: question?.difficulty || null, ...metadata },
  }))
}

function SoloRemovePartGame({ questions, context }) {
  const [difficulty, setDifficulty] = useState(0)
  const [timeLimit, setTimeLimit] = useState(30)
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [inputMode, setInputMode] = useState('handwriting')
  const [running, setRunning] = useState(false)
  const [wrongCount, setWrongCount] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const startedAt = useRef(0)
  const pool = useMemo(() => questions.filter((item) => !difficulty || item.difficulty === difficulty), [difficulty, questions])
  const displayedParts = useMemo(() => shuffleItems(question?.prompt?.parts || []), [question])
  const expire = () => {
    if (!question || !running) return
    setRunning(false)
    setFeedback({ type: 'answer', text: `時間到。可接受答案：${acceptedAnswers(question).join('、')}` })
    persistResult({ context, question, gameType: 'remove_part', timeLimit, answer, correct: false, score: 0, startedAt: startedAt.current })
  }
  const remaining = useRoundTimer(timeLimit, running, expire)
  const start = () => {
    const next = pickQuestion(pool, question?.id)
    setQuestion(next); setAnswer(''); setWrongCount(0); setFeedback(null); setRunning(Boolean(next)); startedAt.current = Date.now()
  }
  const submit = () => {
    if (!running || !question) return
    const normalized = normalizeChineseAnswer(answer)
    if (normalized.length !== 1) { setFeedback({ type: 'error', text: '請手寫或輸入一個國字。' }); return }
    const correct = checkYiziAnswer(question, normalized)
    if (correct) {
      setRunning(false); setFeedback({ type: 'success', text: `答對了！${normalized}` })
      persistResult({ context, question, gameType: 'remove_part', timeLimit, answer: normalized, correct: true, score: 1, startedAt: startedAt.current })
      return
    }
    const nextWrong = wrongCount + 1
    setWrongCount(nextWrong)
    if (nextWrong >= 2) {
      setRunning(false); setFeedback({ type: 'answer', text: `這題先到這裡。可接受答案：${acceptedAnswers(question).join('、')}` })
      persistResult({ context, question, gameType: 'remove_part', timeLimit, answer: normalized, correct: false, score: 0, startedAt: startedAt.current, metadata: { attempts: nextWrong } })
    } else setFeedback({ type: 'error', text: '還不正確，請重新旋轉、排列三個保留部件再試一次。' })
  }
  return <section className="yizi-game-card">
    <h2>去無成字</h2><p>四個部件中去除一個，將保留的三個部件重新組成一字。你不必指出去掉哪個部件。</p>
    <ModeSettings gameType="remove_part" {...{ difficulty, setDifficulty, timeLimit, setTimeLimit }} disabled={running} />
    <div className="yizi-round-bar"><button type="button" className="primary" onClick={start}>{question ? '下一題' : '開始出題'}</button>
      {running && timeLimit > 0 && <strong>剩餘 {remaining} 秒</strong>}</div>
    {question && <>
      <div className="yizi-parts-stage">{displayedParts.map((part, index) => <span key={`${part}-${index}`} style={{ '--part-angle': `${[-14, 9, -5, 16][index % 4]}deg` }}>{part}</span>)}</div>
      <AnswerInput length={1} value={answer} onChange={setAnswer} inputMode={inputMode} setInputMode={setInputMode} />
      <button type="button" className="yizi-submit" disabled={!running} onClick={submit}>送出答案</button>
    </>}
    {feedback && <p className={feedbackClass(feedback)}>{feedback.text}</p>}
  </section>
}

export function RemovePartGame({ questions, context }) {
  const [playMode, setPlayMode] = useState('solo')
  return <>
    <div className="yizi-four-mode-switch" role="tablist" aria-label="去無成字遊玩模式">
      <button type="button" role="tab" aria-selected={playMode === 'solo'} className={playMode === 'solo' ? 'is-active' : ''} onClick={() => setPlayMode('solo')}>單人練習</button>
      <button type="button" role="tab" aria-selected={playMode === 'competition'} className={playMode === 'competition' ? 'is-active' : ''} onClick={() => setPlayMode('competition')}>多人競賽</button>
    </div>
    {playMode === 'solo' ? <SoloRemovePartGame questions={questions} context={context} /> : <YiziWordCompetitionRoom gameType="remove_part" context={context} />}
  </>
}

function ClickSequenceAnswer({ characters, onClear }) {
  return <div className="yizi-reorder">
    <p>請依答案順序點選；第 1 個點的字會放在第 1 格。</p>
    <div>{Array.from({ length: 4 }, (_, index) => <span key={index}>{characters[index] || '？'}</span>)}</div>
    <button type="button" onClick={onClear}>清除重選</button>
  </div>
}

function SoloFourSayingsGame({ questions, context }) {
  const [difficulty, setDifficulty] = useState(0)
  const [timeLimit, setTimeLimit] = useState(40)
  const [question, setQuestion] = useState(null)
  const [displayedIdioms, setDisplayedIdioms] = useState([])
  const [selected, setSelected] = useState(['', '', '', ''])
  const [selectionOrder, setSelectionOrder] = useState([])
  const [answer, setAnswer] = useState('')
  const [inputMode, setInputMode] = useState('click')
  const [running, setRunning] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [wrongCount, setWrongCount] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [currentScore, setCurrentScore] = useState(Number(context?.scoreByGame?.four_sayings || 0))
  const [usedQuestionIds, setUsedQuestionIds] = useState([])
  const startedAt = useRef(0)
  const pool = useMemo(() => questions.filter((item) => !difficulty || item.difficulty === difficulty), [difficulty, questions])
  const revealHint = () => setHintUsed(true)
  const expire = () => {
    if (!question || !running) return
    setRunning(false); setFeedback({ type: 'answer', text: `時間到。答案：${acceptedAnswers(question).join('、')}` })
    persistResult({ context, question, gameType: 'four_sayings', timeLimit, answer, correct: false, score: 0, startedAt: startedAt.current, metadata: { hintUsed } })
  }
  const remaining = useRoundTimer(timeLimit, running, expire)
  useEffect(() => {
    if (running && timeLimit > 0 && remaining > 0 && remaining <= Math.floor(timeLimit / 2)) setHintUsed(true)
  }, [remaining, running, timeLimit])
  const clickAnswer = orderedFourSayingsAnswer(selected, selectionOrder)
  useEffect(() => { if (inputMode === 'click') setAnswer(clickAnswer) }, [clickAnswer, inputMode])
  useEffect(() => { setUsedQuestionIds([]) }, [difficulty])
  const start = () => {
    const cycle = pickQuestionFromCycle(pool, usedQuestionIds)
    const next = cycle.question
    setUsedQuestionIds(cycle.usedQuestionIds)
    setQuestion(next); setDisplayedIdioms(arrangeFourSayingsIdioms(next)); setSelected(['', '', '', '']); setSelectionOrder([]); setAnswer('')
    setHintUsed(false); setWrongCount(0); setFeedback(null); setRunning(Boolean(next)); startedAt.current = Date.now()
  }
  const selectCharacter = (rowIndex, character) => {
    const next = updateFourSayingsSelection(selected, selectionOrder, rowIndex, character)
    setSelected(next.selected); setSelectionOrder(next.selectionOrder)
  }
  const changeInputMode = (mode) => {
    setInputMode(mode); setFeedback(null)
    setAnswer(mode === 'click' ? clickAnswer : '')
  }
  const clearClickAnswer = () => {
    setSelected(['', '', '', '']); setSelectionOrder([]); setAnswer('')
  }
  const giveUp = () => {
    if (!running || !question) return
    setRunning(false)
    setFeedback({ type: 'answer', text: `已放棄本題。答案：${acceptedAnswers(question).join('、')}。本題不計分，之後仍可能再次出現。` })
    persistResult({ context, question, gameType: 'four_sayings', timeLimit, answer, correct: false, score: 0,
      startedAt: startedAt.current, metadata: { hintUsed, abandoned: true } })
  }
  const submit = () => {
    if (!running || !question) return
    const normalized = normalizeChineseAnswer(inputMode === 'click' ? clickAnswer : answer)
    if (normalized.length !== 4) { setFeedback({ type: 'error', text: '請完成四個字後再送出。' }); return }
    const correct = checkYiziAnswer(question, normalized)
    const score = scoreFourSayings({ correct, hintUsed })
    if (correct) {
      setRunning(false); setFeedback({ type: 'success', text: `答對了！本題獲得 ${score} 分。` })
      setCurrentScore((value) => value + score)
      persistResult({ context, question, gameType: 'four_sayings', timeLimit, answer: normalized, correct, score, startedAt: startedAt.current, metadata: { hintUsed } })
      return
    }
    const nextWrong = wrongCount + 1; setWrongCount(nextWrong)
    if (nextWrong >= 2) {
      setRunning(false); setFeedback({ type: 'answer', text: `這題先到這裡。答案：${acceptedAnswers(question).join('、')}` })
      persistResult({ context, question, gameType: 'four_sayings', timeLimit, answer: normalized, correct: false, score: 0, startedAt: startedAt.current, metadata: { hintUsed, attempts: nextWrong } })
    } else setFeedback({ type: 'error', text: '四字都取自題目，但排列仍不正確；請換一個取字方式或重新排列。' })
  }
  const correctAnswer = acceptedAnswers(question)[0] || ''
  return <section className="yizi-game-card">
    <h2>四說新語</h2><p>每句成語各取一字，再重新排列成第五句成語。預設使用點選作答。</p>
    <ModeSettings gameType="four_sayings" {...{ difficulty, setDifficulty, timeLimit, setTimeLimit }} disabled={running} />
    <div className="yizi-round-bar"><button type="button" className="primary" onClick={start}>{question ? '下一題' : '開始出題'}</button>
      <strong className="yizi-current-score">目前 {currentScore} 分</strong>
      {running && timeLimit > 0 && <strong>剩餘 {remaining} 秒</strong>}</div>
    {question && <>
      <div className="yizi-sayings">{displayedIdioms.map((idiom, rowIndex) => <div key={`${idiom}-${rowIndex}`}>
        <span>第 {rowIndex + 1} 句</span>{Array.from(idiom).map((character, index) => <button type="button" disabled={!running || inputMode !== 'click'}
          className={selected[rowIndex] === character ? 'is-selected' : ''} key={`${character}-${index}`} onClick={() => selectCharacter(rowIndex, character)}>{character}</button>)}
      </div>)}</div>
      {hintUsed && <p className="yizi-hint">提示：答案中包含「{Array.from(correctAnswer)[0] || '？'}」。本題答對最高 1 分。</p>}
      {!hintUsed && running && <button type="button" className="yizi-hint-button" onClick={revealHint}>顯示一字提示</button>}
      <AnswerInput length={4} value={answer} onChange={setAnswer} inputMode={inputMode} setInputMode={changeInputMode}
        resetKey={question.id} allowClick>
        <ClickSequenceAnswer characters={Array.from(clickAnswer)} onClear={clearClickAnswer} />
      </AnswerInput>
      <div className="yizi-submit-row"><button type="button" className="yizi-submit" disabled={!running} onClick={submit}>送出答案</button>
        <button type="button" className="yizi-give-up" disabled={!running} onClick={giveUp}>放棄，直接看答案</button></div>
    </>}
    {feedback && <p className={feedbackClass(feedback)}>{feedback.text}</p>}
  </section>
}

export function FourSayingsGame({ questions, context }) {
  const [playMode, setPlayMode] = useState('solo')
  return <>
    <div className="yizi-four-mode-switch" role="tablist" aria-label="四說新語遊玩模式">
      <button type="button" role="tab" aria-selected={playMode === 'solo'} className={playMode === 'solo' ? 'is-active' : ''}
        onClick={() => setPlayMode('solo')}>單人練習</button>
      <button type="button" role="tab" aria-selected={playMode === 'duel'} className={playMode === 'duel' ? 'is-active' : ''}
        onClick={() => setPlayMode('duel')}>多人競賽</button>
    </div>
    {playMode === 'solo'
      ? <SoloFourSayingsGame questions={questions} context={context} />
      : <YiziFourSayingsRoom context={context} />}
  </>
}

function SoloComponentPairsGame({ questions, context }) {
  const [difficulty, setDifficulty] = useState(0)
  const [timeLimit, setTimeLimit] = useState(30)
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [inputMode, setInputMode] = useState('handwriting')
  const [found, setFound] = useState([])
  const [running, setRunning] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const startedAt = useRef(0)
  const pool = useMemo(() => questions.filter((item) => !difficulty || item.difficulty === difficulty), [difficulty, questions])
  const finish = (reason = '本局完成。') => {
    if (!question || !running) return
    setRunning(false)
    const all = acceptedAnswers(question)
    setFeedback({ type: 'answer', text: `${reason}你找到 ${found.length} 字；可接受答案：${all.join('、')}` })
    const percentage = all.length ? Math.round(found.length / all.length * 100) : 0
    persistResult({
      context, question, gameType: 'component_pairs', timeLimit,
      answer: found.join('、'), correct: found.length > 0, score: found.length,
      progressScore: percentage, correctCount: found.length, questionCount: all.length,
      startedAt: startedAt.current, metadata: { foundCount: found.length, answerCount: all.length, percentage },
    })
  }
  const remaining = useRoundTimer(timeLimit, running, () => finish('時間到。'))
  const start = () => {
    const next = pickQuestion(pool, question?.id)
    setQuestion(next); setAnswer(''); setFound([]); setFeedback(null); setRunning(Boolean(next)); startedAt.current = Date.now()
  }
  const submit = () => {
    if (!running || !question) return
    const normalized = normalizeChineseAnswer(answer)
    if (normalized.length !== 1) { setFeedback({ type: 'error', text: '請手寫或輸入一個國字。' }); return }
    if (found.includes(normalized)) { setFeedback({ type: 'error', text: `「${normalized}」已經答過。` }); return }
    if (!checkYiziAnswer(question, normalized)) { setFeedback({ type: 'error', text: `「${normalized}」不在本題可接受答案中，請換一個字。` }); return }
    const next = [...found, normalized]; setFound(next); setAnswer(''); setFeedback({ type: 'success', text: `「${normalized}」正確，目前 ${next.length} 分。` })
    if (next.length === acceptedAnswers(question).length) {
      setRunning(false)
      persistResult({
        context, question, gameType: 'component_pairs', timeLimit,
        answer: next.join('、'), correct: true, score: next.length,
        progressScore: 100, correctCount: next.length, questionCount: next.length,
        startedAt: startedAt.current, metadata: { foundCount: next.length, answerCount: next.length, percentage: 100 },
      })
      setFeedback({ type: 'success', text: `全部找到了！共 ${next.length} 分。` })
    }
  }
  return <section className="yizi-game-card">
    <h2>成雙成對</h2><p>觀察 16 個部件，任取兩個組成國字。部件可重複搭配，但同一答案不能重複。</p>
    <ModeSettings gameType="component_pairs" {...{ difficulty, setDifficulty, timeLimit, setTimeLimit }} disabled={running} />
    <div className="yizi-round-bar"><button type="button" className="primary" onClick={start}>{question ? '下一題' : '開始出題'}</button>
      {running && timeLimit > 0 && <strong>剩餘 {remaining} 秒</strong>}</div>
    {question && <>
      <div className="yizi-component-grid">{(question.prompt.parts || []).map((part, index) => <span key={`${part}-${index}`}>{part}</span>)}</div>
      {found.length > 0 && <div className="yizi-found"><strong>已找到：</strong>{found.map((item) => <span key={item}>{item}</span>)}</div>}
      <AnswerInput length={1} value={answer} onChange={setAnswer} inputMode={inputMode} setInputMode={setInputMode} />
      <div className="yizi-submit-row"><button type="button" className="yizi-submit" disabled={!running} onClick={submit}>送出一字</button>
        {timeLimit === 0 && <button type="button" disabled={!running} onClick={() => finish('你已結束作答。')}>結束並看答案</button>}</div>
    </>}
    {feedback && <p className={feedbackClass(feedback)}>{feedback.text}</p>}
  </section>
}

export function ComponentPairsGame({ questions, context }) {
  const [playMode, setPlayMode] = useState('solo')
  return <>
    <div className="yizi-four-mode-switch" role="tablist" aria-label="成雙成對遊玩模式">
      <button type="button" role="tab" aria-selected={playMode === 'solo'} className={playMode === 'solo' ? 'is-active' : ''} onClick={() => setPlayMode('solo')}>單人練習</button>
      <button type="button" role="tab" aria-selected={playMode === 'competition'} className={playMode === 'competition' ? 'is-active' : ''} onClick={() => setPlayMode('competition')}>多人競賽</button>
    </div>
    {playMode === 'solo' ? <SoloComponentPairsGame questions={questions} context={context} /> : <YiziWordCompetitionRoom gameType="component_pairs" context={context} />}
  </>
}
