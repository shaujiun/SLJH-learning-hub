import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleAlert,
  Eraser,
  ImagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  X,
} from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { accountPuzzleProgressKey } from '../lib/puzzleProgress.js'
import {
  NEWS_CROSSWORD_SIZE,
  answerForClue,
  assessNewsCrosswordAnswer,
  cellsForClue,
  chineseClueNumbers,
  clueStartIndex,
  createEmptyNewsCrosswordClues,
  createEmptyNewsCrosswordGrid,
  newsCrosswordCellTypes,
  newsCrosswordDirections,
  newsCrosswordFruitOptions,
  normalizeNewsCrosswordClues,
  normalizeNewsCrosswordBlockFruits,
  normalizeNewsCrosswordGrid,
  restoreNewsCrosswordProgress,
  syncNewsCrosswordSolution,
  validateNewsCrosswordPuzzle,
} from '../lib/newsCrossword.js'
import {
  archiveNewsCrosswordPuzzle,
  loadNewsCrosswordPuzzles,
  saveNewsCrosswordPuzzle,
} from '../services/newsCrosswordService.js'
import './wordGridPuzzle.css'
import './newsCrossword.css'

const fruitById = new Map(newsCrosswordFruitOptions.map((fruit) => [fruit.id, fruit]))

function fruitForCell(puzzle, index) {
  return fruitById.get(puzzle.blockFruits?.[index]) || newsCrosswordFruitOptions[index % newsCrosswordFruitOptions.length]
}

function todayDateValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const defaultPuzzle = {
  id: '',
  publishedOn: '',
  title: '新聞縱橫填字',
  sourceName: '教師自建題庫',
  designerName: '',
  grid: createEmptyNewsCrosswordGrid(),
  solutionGrid: null,
  acrossClues: createEmptyNewsCrosswordClues(newsCrosswordDirections.across),
  downClues: createEmptyNewsCrosswordClues(newsCrosswordDirections.down),
  blockStyle: 'fruit',
  blockFruits: {},
  status: 'draft',
}

function formatIssueDate(value) {
  if (!value) return '日期未定'
  const [year, month, day] = value.split('-')
  return `${year}／${month}／${day}`
}

function issueDateParts(value) {
  const [year = '', month = '', day = ''] = String(value || '').split('-')
  return { year, month, day }
}

function PuzzleDateSelects({ puzzles, selectedId, onSelect }) {
  const selected = puzzles.find((puzzle) => puzzle.id === selectedId) || puzzles[0]
  if (!selected) return null
  const selectedDate = issueDateParts(selected.publishedOn)
  const years = [...new Set(puzzles.map((puzzle) => issueDateParts(puzzle.publishedOn).year))]
    .sort((a, b) => Number(b) - Number(a))
  const months = [...new Set(puzzles
    .filter((puzzle) => issueDateParts(puzzle.publishedOn).year === selectedDate.year)
    .map((puzzle) => issueDateParts(puzzle.publishedOn).month))]
    .sort((a, b) => Number(b) - Number(a))
  const days = puzzles
    .filter((puzzle) => {
      const date = issueDateParts(puzzle.publishedOn)
      return date.year === selectedDate.year && date.month === selectedDate.month
    })
    .sort((a, b) => b.publishedOn.localeCompare(a.publishedOn))
  const chooseFirst = (matches) => {
    const next = [...matches].sort((a, b) => b.publishedOn.localeCompare(a.publishedOn))[0]
    if (next) onSelect(next.id)
  }
  return (
    <fieldset className="word-grid-date-fields is-student-picker">
      <legend>選擇題目</legend>
      <label>年<select value={selectedDate.year} onChange={(event) => chooseFirst(puzzles.filter((puzzle) => issueDateParts(puzzle.publishedOn).year === event.target.value))}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
      <label>月<select value={selectedDate.month} onChange={(event) => chooseFirst(puzzles.filter((puzzle) => { const date = issueDateParts(puzzle.publishedOn); return date.year === selectedDate.year && date.month === event.target.value }))}>{months.map((month) => <option key={month} value={month}>{Number(month)}</option>)}</select></label>
      <label>日<select value={selected.id} onChange={(event) => onSelect(event.target.value)}>{days.map((puzzle) => <option key={puzzle.id} value={puzzle.id}>{Number(issueDateParts(puzzle.publishedOn).day)}{puzzle.status !== 'published' ? `（${puzzle.status === 'draft' ? '草稿' : '封存'}）` : ''}</option>)}</select></label>
    </fieldset>
  )
}

function startLabelsFor(puzzle) {
  const labels = new Map()
  puzzle.acrossClues.forEach((clue) => {
    if (!clue.text) return
    const index = clueStartIndex(clue)
    labels.set(index, { ...(labels.get(index) || {}), across: chineseClueNumbers[clue.number - 1] })
  })
  puzzle.downClues.forEach((clue) => {
    if (!clue.text) return
    const index = clueStartIndex(clue)
    labels.set(index, { ...(labels.get(index) || {}), down: String(clue.number) })
  })
  return labels
}

function CrosswordBoard({ puzzle, answers = {}, onAnswer, answerMode = false, activeIndexes = [] }) {
  const grid = answerMode ? puzzle.solutionGrid : puzzle.grid
  const labels = useMemo(() => startLabelsFor(puzzle), [puzzle])
  const activeSet = useMemo(() => new Set(activeIndexes), [activeIndexes])
  const inputRefs = useRef({})
  useEffect(() => {
    const first = activeIndexes.find((index) => puzzle.grid[index]?.type === newsCrosswordCellTypes.empty)
    if (first != null) inputRefs.current[first]?.focus()
  }, [activeIndexes, puzzle.grid])
  return (
    <div className={`news-crossword-board is-${puzzle.blockStyle || 'fruit'}`} role="grid" aria-label={answerMode ? '新聞縱橫填字完整答案' : '新聞縱橫填字題目'}>
      {grid.map((cell, index) => {
        const sourceCell = puzzle.grid[index]
        const isBlock = sourceCell.type === newsCrosswordCellTypes.block
        const value = answerMode
          ? cell.value
          : sourceCell.type === newsCrosswordCellTypes.given ? sourceCell.value : answers[index] || ''
        const labelsAtCell = labels.get(index)
        if (isBlock) {
          return (
            <div className="news-crossword-cell is-block" role="gridcell" key={index} aria-label="阻隔格">
              {puzzle.blockStyle !== 'solid' && <span className="news-crossword-fruit" aria-hidden="true">{fruitForCell(puzzle, index).symbol}</span>}
            </div>
          )
        }
        return (
          <label className={`news-crossword-cell ${sourceCell.type === newsCrosswordCellTypes.given ? 'is-given' : ''} ${activeSet.has(index) ? 'is-active' : ''}`} key={index}>
            <span className="sr-only">第 {Math.floor(index / NEWS_CROSSWORD_SIZE) + 1} 列第 {(index % NEWS_CROSSWORD_SIZE) + 1} 格</span>
            {labelsAtCell?.across && <span className="news-crossword-number is-across" aria-hidden="true">{labelsAtCell.across}</span>}
            {labelsAtCell?.down && <span className="news-crossword-number is-down" aria-hidden="true">{labelsAtCell.down}</span>}
            {answerMode || sourceCell.type === newsCrosswordCellTypes.given ? (
              <span className="news-crossword-value">{value}</span>
            ) : (
              <input
                ref={(node) => { inputRefs.current[index] = node }}
                value={value}
                maxLength={1}
                inputMode="text"
                autoComplete="off"
                onChange={(event) => onAnswer?.(index, Array.from(event.target.value).slice(-1)[0] || '')}
              />
            )}
          </label>
        )
      })}
    </div>
  )
}

function ClueList({ title, clues, onSelect, activeClue }) {
  return (
    <section className="news-crossword-clue-list">
      <h3>{title}</h3>
      <ol>
        {clues.map((clue) => {
          const label = clue.direction === newsCrosswordDirections.across ? chineseClueNumbers[clue.number - 1] : clue.number
          const active = activeClue?.direction === clue.direction && activeClue?.number === clue.number
          return (
            <li key={`${clue.direction}-${clue.number}`}>
              <button type="button" className={active ? 'is-active' : ''} onClick={() => onSelect(clue)}>
                <strong>{label}</strong><span>{clue.text}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function loadSavedProgress(puzzle, progressOwnerId) {
  if (!puzzle?.id || typeof window === 'undefined') return { answers: {}, perfectCompletedAt: '' }
  const key = accountPuzzleProgressKey('news-crossword', progressOwnerId, puzzle.id)
  if (!key) return { answers: {}, perfectCompletedAt: '' }
  try {
    return restoreNewsCrosswordProgress(JSON.parse(window.localStorage.getItem(key) || '{}'), puzzle.grid)
  } catch {
    return { answers: {}, perfectCompletedAt: '' }
  }
}

function AnswerPanel({ puzzle, unlocked }) {
  return (
    <aside className={`word-grid-answer-panel ${unlocked ? '' : 'is-locked'}`}>
      {unlocked ? (
        <details>
          <summary><span><span className="eyebrow">ANSWER</span><strong>完整答案</strong></span><span className="word-grid-answer-summary-hint">已解鎖，可展開查看</span></summary>
          <div className="news-crossword-answer-content"><CrosswordBoard puzzle={puzzle} answerMode /></div>
        </details>
      ) : (
        <div className="word-grid-answer-lock"><span><span className="eyebrow">ANSWER</span><strong>完整答案尚未解鎖</strong></span><span className="word-grid-answer-summary-hint">完成一輪並全部答對後解鎖</span></div>
      )}
    </aside>
  )
}

function PlayArea({ puzzle, progressOwnerId }) {
  const initial = useMemo(() => loadSavedProgress(puzzle, progressOwnerId), [puzzle, progressOwnerId])
  const [answers, setAnswers] = useState(initial.answers)
  const [perfectCompletedAt, setPerfectCompletedAt] = useState(initial.perfectCompletedAt)
  const [activeClue, setActiveClue] = useState(null)
  const [message, setMessage] = useState('')
  const [mistakeFeedback, setMistakeFeedback] = useState([])
  const storageKey = useMemo(() => accountPuzzleProgressKey('news-crossword', progressOwnerId, puzzle.id), [progressOwnerId, puzzle.id])
  const activeIndexes = activeClue ? cellsForClue(puzzle.grid, activeClue) : []

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, JSON.stringify({ answers, perfectCompletedAt }))
  }, [answers, perfectCompletedAt, storageKey])

  const updateAnswer = (index, value) => {
    setAnswers((current) => {
      const next = { ...current }
      if (value) next[index] = value
      else delete next[index]
      return next
    })
    setMessage('')
    setMistakeFeedback([])
  }
  const check = () => {
    const result = assessNewsCrosswordAnswer(puzzle, answers)
    setMistakeFeedback(result.mistakeFeedback || [])
    if (result.status === 'incomplete') setMessage('仍有白格尚未填寫。')
    else if (result.status === 'practice-complete') setMessage('已填完；本題尚未收錄答案，暫時無法核對。')
    else if (result.correct) {
      setPerfectCompletedAt((current) => current || new Date().toISOString())
      setMessage('全部答對，完整答案已解鎖。')
    } else {
      setMessage(`目前有 ${result.incorrectIndexes.length} 格不正確，請依提示再檢查；系統不會直接顯示答案。`)
    }
  }
  const clear = () => {
    setAnswers({})
    setMistakeFeedback([])
    setMessage('已清除本題輸入。')
  }
  return (
    <>
      <section className="word-grid-play">
        <div className="news-crossword-play-layout">
          <div className="news-crossword-board-column">
            <p className="word-grid-hint">點選橫式或直式提示可標示對應範圍，再於白格輸入答案。水果格是阻隔格，不需填寫。</p>
            <CrosswordBoard puzzle={puzzle} answers={answers} onAnswer={updateAnswer} activeIndexes={activeIndexes} />
            <div className="word-grid-actions">
              <button type="button" className="secondary-button" onClick={clear}><RotateCcw aria-hidden="true" />清除重填</button>
              <button type="button" className="primary-button" onClick={check}><Check aria-hidden="true" />核對答案</button>
            </div>
            {message && <p className="word-grid-message" role="status">{message}</p>}
            {mistakeFeedback.length > 0 && (
              <div className="news-crossword-mistake-feedback" role="status">
                <strong>常見誤答提示</strong>
                <ul>{mistakeFeedback.map((item) => <li key={`${item.direction}-${item.number}`}><span>{item.label}</span>{item.hint}</li>)}</ul>
              </div>
            )}
          </div>
          <div className="news-crossword-clues">
            <ClueList title="橫式（一～八）" clues={puzzle.acrossClues} onSelect={setActiveClue} activeClue={activeClue} />
            <ClueList title="直式（1～8）" clues={puzzle.downClues} onSelect={setActiveClue} activeClue={activeClue} />
          </div>
        </div>
      </section>
      <AnswerPanel puzzle={puzzle} unlocked={Boolean(perfectCompletedAt)} />
    </>
  )
}

function GridEditor({ puzzle, grid, mode, selectedFruit, onChange, onBlockFruitsChange }) {
  const labels = startLabelsFor(puzzle)
  const updateValue = (index, value) => {
    const next = [...grid]
    next[index] = value
      ? { type: newsCrosswordCellTypes.given, value: Array.from(value).slice(-1)[0] }
      : { type: newsCrosswordCellTypes.empty, value: '' }
    onChange(next)
  }
  const updateCell = (index) => {
    const next = [...grid]
    next[index] = { type: mode, value: '' }
    onChange(next)
    if (onBlockFruitsChange) {
      const nextFruits = { ...puzzle.blockFruits }
      if (mode === newsCrosswordCellTypes.block) nextFruits[index] = selectedFruit
      else delete nextFruits[index]
      onBlockFruitsChange(nextFruits)
    }
  }
  return (
    <div className={`news-crossword-board is-editor is-${puzzle.blockStyle}`} role="grid" aria-label="新聞縱橫填字編輯方格">
      {grid.map((cell, index) => {
        const labelsAtCell = labels.get(index)
        const isBlock = cell.type === newsCrosswordCellTypes.block
        return (
          <label className={`news-crossword-cell ${isBlock ? 'is-block' : ''}`} key={index}>
            <span className="sr-only">第 {Math.floor(index / NEWS_CROSSWORD_SIZE) + 1} 列第 {(index % NEWS_CROSSWORD_SIZE) + 1} 格</span>
            {labelsAtCell?.across && <span className="news-crossword-number is-across">{labelsAtCell.across}</span>}
            {labelsAtCell?.down && <span className="news-crossword-number is-down">{labelsAtCell.down}</span>}
            {mode === 'given' || mode === 'answer' ? (
              <input value={cell.value || ''} maxLength={1} onChange={(event) => updateValue(index, event.target.value)} disabled={isBlock} />
            ) : (
              <button type="button" onClick={() => updateCell(index)} aria-label={isBlock ? `阻隔格：${fruitForCell(puzzle, index).label}` : undefined}>
                {isBlock && puzzle.blockStyle === 'fruit' ? <span className="news-crossword-fruit" aria-hidden="true">{fruitForCell(puzzle, index).symbol}</span> : cell.value}
              </button>
            )}
          </label>
        )
      })}
    </div>
  )
}

function ClueEditor({ title, clues, direction, grid, solutionGrid, onChange }) {
  const update = (index, key, value) => {
    const next = clues.map((clue, clueIndex) => clueIndex === index ? { ...clue, [key]: key === 'text' ? value : Number(value) } : clue)
    onChange(next)
  }
  const updateAcceptedAnswer = (clueIndex, answerIndex, value) => {
    const acceptedAnswers = [...(clues[clueIndex].acceptedAnswers || [])]
    acceptedAnswers[answerIndex] = value
    onChange(clues.map((clue, index) => index === clueIndex ? { ...clue, acceptedAnswers } : clue))
  }
  const addAcceptedAnswer = (clueIndex) => {
    onChange(clues.map((clue, index) => index === clueIndex
      ? { ...clue, acceptedAnswers: [...(clue.acceptedAnswers || []), ''] }
      : clue))
  }
  const removeAcceptedAnswer = (clueIndex, answerIndex) => {
    onChange(clues.map((clue, index) => index === clueIndex
      ? { ...clue, acceptedAnswers: (clue.acceptedAnswers || []).filter((_, itemIndex) => itemIndex !== answerIndex) }
      : clue))
  }
  const updateCommonMistake = (clueIndex, mistakeIndex, key, value) => {
    const commonMistakes = [...(clues[clueIndex].commonMistakes || [])]
    commonMistakes[mistakeIndex] = { ...commonMistakes[mistakeIndex], [key]: value }
    onChange(clues.map((clue, index) => index === clueIndex ? { ...clue, commonMistakes } : clue))
  }
  const addCommonMistake = (clueIndex) => {
    onChange(clues.map((clue, index) => index === clueIndex
      ? { ...clue, commonMistakes: [...(clue.commonMistakes || []), { answer: '', hint: '' }] }
      : clue))
  }
  const removeCommonMistake = (clueIndex, mistakeIndex) => {
    onChange(clues.map((clue, index) => index === clueIndex
      ? { ...clue, commonMistakes: (clue.commonMistakes || []).filter((_, itemIndex) => itemIndex !== mistakeIndex) }
      : clue))
  }
  return (
    <section className="news-crossword-clue-editor">
      <h3>{title}</h3>
      {clues.map((clue, index) => (
        <div className="news-crossword-clue-editor-row" key={`${direction}-${clue.number}`}>
          <strong>{direction === newsCrosswordDirections.across ? chineseClueNumbers[index] : clue.number}</strong>
          <label>列<select value={clue.row} onChange={(event) => update(index, 'row', event.target.value)}>{Array.from({ length: 8 }, (_, value) => <option value={value} key={value}>{value + 1}</option>)}</select></label>
          <label>欄<select value={clue.col} onChange={(event) => update(index, 'col', event.target.value)}>{Array.from({ length: 8 }, (_, value) => <option value={value} key={value}>{value + 1}</option>)}</select></label>
          <label className="is-clue-text">提示<input value={clue.text} onChange={(event) => update(index, 'text', event.target.value)} placeholder="輸入題目提示" /></label>
          <details className="news-crossword-clue-answer-settings">
            <summary>答案判定設定<span>標準答案：{answerForClue(grid, solutionGrid, clue) || '請先建立完整答案'}</span></summary>
            <div className="news-crossword-answer-setting-group">
              <div className="news-crossword-answer-setting-heading"><strong>可接受答案</strong><button type="button" onClick={() => addAcceptedAnswer(index)}><Plus aria-hidden="true" />新增</button></div>
              {(clue.acceptedAnswers || []).length === 0 && <small>沒有替代答案時不必設定。</small>}
              {(clue.acceptedAnswers || []).map((answer, answerIndex) => (
                <div className="news-crossword-answer-setting-row" key={`accepted-${answerIndex}`}>
                  <label>答案<input value={answer} onChange={(event) => updateAcceptedAnswer(index, answerIndex, event.target.value)} placeholder="輸入完整替代答案" /></label>
                  <button type="button" className="icon-button" aria-label="刪除這個可接受答案" onClick={() => removeAcceptedAnswer(index, answerIndex)}><X aria-hidden="true" /></button>
                </div>
              ))}
            </div>
            <div className="news-crossword-answer-setting-group">
              <div className="news-crossword-answer-setting-heading"><strong>常見誤答與提示</strong><button type="button" onClick={() => addCommonMistake(index)}><Plus aria-hidden="true" />新增</button></div>
              {(clue.commonMistakes || []).length === 0 && <small>設定後，學生輸入該答案時只會看到提示，不會直接看到完整答案。</small>}
              {(clue.commonMistakes || []).map((mistake, mistakeIndex) => (
                <div className="news-crossword-mistake-setting-row" key={`mistake-${mistakeIndex}`}>
                  <label>常見誤答<input value={mistake.answer} onChange={(event) => updateCommonMistake(index, mistakeIndex, 'answer', event.target.value)} placeholder="例如：舌燦蓮花" /></label>
                  <label>給學生的提示<input value={mistake.hint} onChange={(event) => updateCommonMistake(index, mistakeIndex, 'hint', event.target.value)} placeholder="例如：教育部辭典採用「粲」字，請修正第二字。" /></label>
                  <button type="button" className="icon-button" aria-label="刪除這個常見誤答" onClick={() => removeCommonMistake(index, mistakeIndex)}><X aria-hidden="true" /></button>
                </div>
              ))}
            </div>
            <p className="news-crossword-crossing-note">若替代答案更動交叉格，另一方向也必須設定相容答案，否則學生仍無法全對。</p>
          </details>
        </div>
      ))}
    </section>
  )
}

function PuzzleEditor({ puzzle, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...defaultPuzzle,
    ...puzzle,
    publishedOn: puzzle?.publishedOn || todayDateValue(),
    grid: normalizeNewsCrosswordGrid(puzzle?.grid || defaultPuzzle.grid),
    blockFruits: normalizeNewsCrosswordBlockFruits(puzzle?.blockFruits, puzzle?.grid || defaultPuzzle.grid),
    acrossClues: normalizeNewsCrosswordClues(puzzle?.acrossClues, newsCrosswordDirections.across),
    downClues: normalizeNewsCrosswordClues(puzzle?.downClues, newsCrosswordDirections.down),
  }))
  const [tab, setTab] = useState('grid')
  const [mode, setMode] = useState(newsCrosswordCellTypes.block)
  const [selectedFruit, setSelectedFruit] = useState(newsCrosswordFruitOptions[0].id)
  const [referenceUrl, setReferenceUrl] = useState('')
  const [referenceType, setReferenceType] = useState('')
  const [status, setStatus] = useState({ saving: false, message: '' })
  useEffect(() => () => { if (referenceUrl) URL.revokeObjectURL(referenceUrl) }, [referenceUrl])
  const updateReference = (file) => {
    if (referenceUrl) URL.revokeObjectURL(referenceUrl)
    setReferenceUrl(file ? URL.createObjectURL(file) : '')
    setReferenceType(file?.type || '')
  }
  const updateGrid = (grid) => setForm((current) => ({
    ...current,
    grid,
    solutionGrid: current.solutionGrid ? syncNewsCrosswordSolution(grid, current.solutionGrid) : null,
    status: current.status === 'published' ? 'draft' : current.status,
  }))
  const save = async () => {
    const validated = validateNewsCrosswordPuzzle(form)
    if (validated.errors.length) {
      setStatus({ saving: false, message: validated.errors.join(' ') })
      return
    }
    setStatus({ saving: true, message: '' })
    try {
      await saveNewsCrosswordPuzzle({ ...form, ...validated })
      await onSaved()
    } catch (error) {
      setStatus({ saving: false, message: error.message })
    }
  }
  return (
    <section className="word-grid-editor">
      <div className="word-grid-editor-heading">
        <div><p className="eyebrow">ADMIN EDITOR</p><h2>{form.id ? '編輯新聞縱橫填字' : '建立新聞縱橫填字'}</h2></div>
        <button type="button" className="icon-button" onClick={onCancel}><X aria-hidden="true" /><span>關閉</span></button>
      </div>
      <div className="news-crossword-editor-fields">
        <label>題目日期<input type="date" value={form.publishedOn} onChange={(event) => setForm({ ...form, publishedOn: event.target.value })} /></label>
        <label>狀態<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">草稿</option><option value="published" disabled={!form.solutionGrid}>發布</option><option value="archived">封存</option></select></label>
        <label>阻隔格外觀<select value={form.blockStyle} onChange={(event) => setForm({ ...form, blockStyle: event.target.value })}><option value="fruit">水果圖案</option><option value="solid">純色格</option></select></label>
        <label>題目名稱<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label>來源<input value={form.sourceName} onChange={(event) => setForm({ ...form, sourceName: event.target.value })} /></label>
        <label>設計者<input value={form.designerName} onChange={(event) => setForm({ ...form, designerName: event.target.value })} placeholder="可留白" /></label>
      </div>
      <div className="word-grid-reference-upload">
        <label><ImagePlus aria-hidden="true" />上傳參考圖片或 PDF<input type="file" accept="image/*,application/pdf" onChange={(event) => updateReference(event.target.files?.[0])} /></label>
        <small>檔案只在本次編輯時供比對，不會存入題庫；請依參考頁面手動設定格子、答案與提示。</small>
      </div>
      {referenceUrl && <div className="news-crossword-reference">{referenceType === 'application/pdf' ? <iframe src={referenceUrl} title="PDF 編題參考" /> : <img src={referenceUrl} alt="編題參考" />}</div>}
      <div className="word-grid-editor-tabs">
        <button type="button" className={tab === 'grid' ? 'is-active' : ''} onClick={() => setTab('grid')}>題目格</button>
        <button type="button" className={tab === 'solution' ? 'is-active' : ''} onClick={() => setTab('solution')}>完整答案</button>
        <button type="button" className={tab === 'across' ? 'is-active' : ''} onClick={() => setTab('across')}>橫式提示</button>
        <button type="button" className={tab === 'down' ? 'is-active' : ''} onClick={() => setTab('down')}>直式提示</button>
      </div>
      {tab === 'grid' && <>
        <div className="word-grid-editor-tools">
          <button type="button" className={mode === 'block' ? 'is-active' : ''} onClick={() => setMode('block')}>阻隔格</button>
          <button type="button" className={mode === 'empty' ? 'is-active' : ''} onClick={() => setMode('empty')}>白格</button>
          <button type="button" className={mode === 'given' ? 'is-active' : ''} onClick={() => setMode('given')}>提示字</button>
        </div>
        {mode === 'block' && form.blockStyle === 'fruit' && <div className="news-crossword-fruit-picker" role="group" aria-label="選擇阻隔格水果">
          <span>選擇水果後，再點棋盤中的阻隔格：</span>
          {newsCrosswordFruitOptions.map((fruit) => <button type="button" key={fruit.id} className={selectedFruit === fruit.id ? 'is-active' : ''} aria-pressed={selectedFruit === fruit.id} title={fruit.label} onClick={() => setSelectedFruit(fruit.id)}><span aria-hidden="true">{fruit.symbol}</span><small>{fruit.label}</small></button>)}
          <small className="news-crossword-fruit-note">此設定只供管理者編題，學生端只能看到發布後的水果圖案。</small>
        </div>}
        <GridEditor puzzle={form} grid={form.grid} mode={mode} selectedFruit={selectedFruit} onChange={updateGrid} onBlockFruitsChange={(blockFruits) => setForm((current) => ({ ...current, blockFruits, status: current.status === 'published' ? 'draft' : current.status }))} />
      </>}
      {tab === 'solution' && <>
        <label className="word-grid-answer-toggle"><input type="checkbox" checked={Boolean(form.solutionGrid)} onChange={(event) => setForm({ ...form, solutionGrid: event.target.checked ? syncNewsCrosswordSolution(form.grid) : null, status: 'draft' })} />建立完整答案</label>
        {form.solutionGrid
          ? <GridEditor puzzle={form} grid={form.solutionGrid} mode="answer" selectedFruit={selectedFruit} onChange={(solutionGrid) => setForm({ ...form, solutionGrid })} />
          : <p className="word-grid-editor-empty">勾選後即可輸入答案；答案未完成前不能發布。</p>}
      </>}
      {tab === 'across' && <ClueEditor title="橫式提示（一～八）" clues={form.acrossClues} direction={newsCrosswordDirections.across} grid={form.grid} solutionGrid={form.solutionGrid} onChange={(acrossClues) => setForm({ ...form, acrossClues })} />}
      {tab === 'down' && <ClueEditor title="直式提示（1～8）" clues={form.downClues} direction={newsCrosswordDirections.down} grid={form.grid} solutionGrid={form.solutionGrid} onChange={(downClues) => setForm({ ...form, downClues })} />}
      <div className="word-grid-editor-actions"><button type="button" className="primary-button" disabled={status.saving} onClick={save}><Save aria-hidden="true" />{status.saving ? '儲存中' : '儲存題目'}</button>{status.message && <p role="status">{status.message}</p>}</div>
    </section>
  )
}

export default function NewsCrossword({ guestMode = false }) {
  const [state, setState] = useState({ loading: true, error: '', puzzles: [], canManage: false, progressOwnerId: '' })
  const [selectedId, setSelectedId] = useState('')
  const [editing, setEditing] = useState(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const returnUrl = guestMode ? '?guest=1' : './'
  const guest = guestMode ? '&guest=1' : ''
  const load = async () => {
    if (!isSupabaseConfigured) {
      setState({ loading: false, error: '新聞縱橫填字尚未連接題庫。', puzzles: [], canManage: false, progressOwnerId: '' })
      return
    }
    try {
      const data = await loadNewsCrosswordPuzzles({ guestMode })
      setState({ loading: false, error: '', ...data })
      setSelectedId((current) => current && data.puzzles.some((puzzle) => puzzle.id === current) ? current : data.puzzles[0]?.id || '')
    } catch (error) {
      setState({ loading: false, error: error.message, puzzles: [], canManage: false, progressOwnerId: '' })
    }
  }
  useEffect(() => { load() }, [guestMode])
  const puzzle = state.puzzles.find((item) => item.id === selectedId) || state.puzzles[0]
  if (state.loading) return <main className="center-screen"><p>正在載入新聞縱橫填字……</p></main>
  if (state.error) return <main className="center-screen"><CircleAlert aria-hidden="true" /><h1>暫時無法載入新聞縱橫填字</h1><p>{state.error}</p><a className="secondary-button" href={returnUrl}>返回學習系統</a></main>
  return (
    <div className="word-grid-page news-crossword-page">
      <header className="word-grid-header"><a href={returnUrl}><ArrowLeft aria-hidden="true" />返回學習系統</a><div><p>文字益智遊戲</p><h1>新聞縱橫填字</h1></div>{state.canManage ? <button type="button" onClick={() => setEditing(defaultPuzzle)}><Plus aria-hidden="true" />建立新題</button> : <span />}</header>
      <nav className="word-grid-mode-tabs" aria-label="填字圖類型">
        <a href={`?puzzle=word-grid${guest}`}>報紙填字圖</a>
        <a className="is-active" href={`?puzzle=word-grid&mode=news${guest}`}>新聞縱橫填字</a>
        <a href={`?puzzle=word-grid&mode=idiom${guest}`}>成語填字圖</a>
      </nav>
      <main className="word-grid-main">
        <section className="word-grid-intro"><div><p className="eyebrow">NEWS CROSSWORD</p><h2>從橫式與直式線索交會找出答案</h2><p>固定 8 × 8；橫式以國字題號、直式以阿拉伯數字題號標示。</p></div><button type="button" onClick={() => setShowInstructions((value) => !value)} aria-expanded={showInstructions}>玩法說明<ChevronDown aria-hidden="true" /></button></section>
        {showInstructions && <div className="word-grid-instructions"><p>水果或純色格是阻隔格，不需填寫。橫式答案由左至右，直式答案由上至下；題號標在答案的起始格，同一格可能同時有橫式與直式題號。</p><p>點提示可標示對應範圍。完成全部白格後按「核對答案」；答錯時只提示錯誤格數，不直接公布答案。全部答對後才可展開完整答案。</p></div>}
        {editing ? <PuzzleEditor puzzle={editing} onSaved={async () => { await load(); setEditing(null) }} onCancel={() => setEditing(null)} /> : puzzle ? <>
          <div className="word-grid-issue-bar"><PuzzleDateSelects puzzles={state.puzzles.filter((item) => state.canManage || item.status === 'published')} selectedId={puzzle.id} onSelect={setSelectedId} /><div><strong>{formatIssueDate(puzzle.publishedOn)}</strong><span>{puzzle.title}・{puzzle.sourceName}{puzzle.designerName ? `・${puzzle.designerName}` : ''}</span></div>{state.canManage && <div className="word-grid-admin-actions"><button type="button" onClick={() => setEditing(puzzle)}><Pencil aria-hidden="true" />編輯</button><button type="button" onClick={async () => { await archiveNewsCrosswordPuzzle(puzzle.id); await load() }}><Eraser aria-hidden="true" />封存</button></div>}</div>
          <div className="word-grid-layout"><PlayArea key={`${state.progressOwnerId || 'temporary'}:${puzzle.id}`} puzzle={puzzle} progressOwnerId={state.progressOwnerId} /></div>
        </> : <section className="word-grid-empty"><h2>目前尚無已發布題目</h2><p>{state.canManage ? '可先建立草稿，完成題目、答案與 16 則提示後再發布。' : '請稍後再回來挑戰。'}</p>{state.canManage && <button className="primary-button" type="button" onClick={() => setEditing(defaultPuzzle)}><Plus aria-hidden="true" />建立第一題</button>}</section>}
      </main>
    </div>
  )
}

