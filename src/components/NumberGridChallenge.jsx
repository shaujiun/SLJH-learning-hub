import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronDown,
  LockKeyhole,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import {
  assessNumberGridChallenge,
  buildNumberGridLineClue,
  createNumberGridDraft,
  NUMBER_GRID_BANK,
  NUMBER_GRID_CANVAS_SIZE,
  numberGridChallenges,
  restoreNumberGridProgress,
  serializeNumberGridProgress,
  validateNumberGridPuzzle,
} from '../lib/numberGridChallenge.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { loadNumberGridPuzzles, saveNumberGridPuzzle } from '../services/numberGridPuzzleService.js'
import './numberGridChallenge.css'

function progressKey(challengeId) {
  return `sljh-number-grid-progress-v1:${challengeId}`
}

function loadProgress(challenge) {
  if (typeof window === 'undefined') return restoreNumberGridProgress({})
  try {
    return restoreNumberGridProgress(JSON.parse(window.localStorage.getItem(progressKey(challenge.id)) || '{}'))
  } catch {
    return restoreNumberGridProgress({})
  }
}

function clueClass(checked, correct) {
  if (!checked) return ''
  return correct ? 'is-correct' : 'is-incorrect'
}

export function gridLineSegments(cells) {
  const segments = new Map()
  cells.forEach(({ row, column }) => {
    segments.set(`h-${row}-${column}`, `M${column} ${row}H${column + 1}`)
    segments.set(`h-${row + 1}-${column}`, `M${column} ${row + 1}H${column + 1}`)
    segments.set(`v-${row}-${column}`, `M${column} ${row}V${row + 1}`)
    segments.set(`v-${row}-${column + 1}`, `M${column + 1} ${row}V${row + 1}`)
  })
  return [...segments.values()]
}

export function ChallengeBoard({ challenge, entries, onCellClick, checkedResult, answer = false }) {
  const displayEntries = answer ? challenge.solution : entries
  const cellIndexByCoordinate = new Map(challenge.cells.map((cell, index) => [`${cell.row}-${cell.column}`, index]))
  return (
    <div className={`number-grid-board-stage ${answer ? 'is-answer' : ''}`}>
      <div className="number-grid-square">
        <div className="number-grid-board" role="grid" aria-label={answer ? '十拿九穩解答' : '十拿九穩題目'}>
          {Array.from({ length: NUMBER_GRID_CANVAS_SIZE ** 2 }, (_, canvasIndex) => {
            const row = Math.floor(canvasIndex / NUMBER_GRID_CANVAS_SIZE)
            const column = canvasIndex % NUMBER_GRID_CANVAS_SIZE
            const entryIndex = cellIndexByCoordinate.get(`${row}-${column}`)
            if (entryIndex == null) return <span className="number-grid-hidden-cell" aria-hidden="true" key={canvasIndex} />
            const value = displayEntries[entryIndex]
            return (
              <button
                type="button"
                role="gridcell"
                key={canvasIndex}
                disabled={answer}
                className={value ? 'is-filled' : ''}
                onClick={() => onCellClick?.(entryIndex)}
                aria-label={`畫布第 ${row + 1} 列第 ${column + 1} 格${value ? `，${value}` : '，空白'}`}
              >
                {value || ''}
              </button>
            )
          })}
        </div>
        <svg className="number-grid-grid-lines" viewBox={`0 0 ${NUMBER_GRID_CANVAS_SIZE} ${NUMBER_GRID_CANVAS_SIZE}`} preserveAspectRatio="none" aria-hidden="true">
          <path d={gridLineSegments(challenge.cells).join(' ')} vectorEffect="non-scaling-stroke" />
        </svg>
        {challenge.circleClues.map((clue, index) => {
          const result = checkedResult?.circleResults[index]
          return (
            <span
              className={`number-grid-circle-clue ${clueClass(Boolean(checkedResult), result?.actual === clue.total)}`}
              style={{ '--clue-y': `${clue.row / NUMBER_GRID_CANVAS_SIZE * 100}%`, '--clue-x': `${clue.column / NUMBER_GRID_CANVAS_SIZE * 100}%` }}
              key={`${clue.row}-${clue.column}`}
              aria-label={`周圍相鄰方格合計 ${clue.total}`}
            >
              {clue.total}
            </span>
          )
        })}
        {challenge.lineClues.map((clue, index) => {
          const result = checkedResult?.lineResults[index]
          return (
            <span
              className={`number-grid-line-clue is-${clue.direction} ${clueClass(Boolean(checkedResult), result?.actual === clue.total)}`}
              style={{ '--clue-y': `${clue.anchorRow / NUMBER_GRID_CANVAS_SIZE * 100}%`, '--clue-x': `${clue.anchorColumn / NUMBER_GRID_CANVAS_SIZE * 100}%` }}
              key={clue.id}
              aria-label={`${clue.axis === 'row' ? '橫列' : '直行'}合計 ${clue.total}`}
            >
              {clue.direction === 'left' ? <><ArrowLeft aria-hidden="true" />{clue.total}</> : clue.direction === 'down' ? <>{clue.total}<ArrowDown aria-hidden="true" /></> : <><ArrowUp aria-hidden="true" />{clue.total}</>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function todayIssue() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function NumberGridEditor({ puzzle, onSaved, onCancel }) {
  const [form, setForm] = useState(() => {
    const base = createNumberGridDraft(puzzle?.issueOn || puzzle?.id || todayIssue())
    return {
      ...base,
      ...puzzle,
      issueOn: puzzle?.issueOn || puzzle?.id || base.issueOn,
      cells: (puzzle?.cells || base.cells).map((cell) => ({ ...cell })),
      circleClues: (puzzle?.circleClues || []).map((clue) => ({ ...clue })),
      lineClues: (puzzle?.lineClues || []).map((clue) => ({ ...clue, cellIds: [...clue.cellIds] })),
      solution: [...(puzzle?.solution || base.solution)],
    }
  })
  const [referenceUrl, setReferenceUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const isBuiltInIssue = numberGridChallenges.some((item) => item.id === form.issueOn)
  useEffect(() => () => { if (referenceUrl) URL.revokeObjectURL(referenceUrl) }, [referenceUrl])

  const updateCell = (index, key, value) => setForm((current) => {
    const cells = current.cells.map((cell, position) => position === index ? { ...cell, [key]: value } : cell)
    const lineClues = current.lineClues.map((clue) => {
      const firstCell = current.cells.find((cell) => cell.id === clue.cellIds[0])
      const lineIndex = firstCell ? firstCell[clue.axis] : 1
      return buildNumberGridLineClue(cells, { id: clue.id, axis: clue.axis, lineIndex, direction: clue.direction, total: clue.total })
    })
    return { ...current, cells, lineClues, status: 'draft' }
  })
  const updateCircle = (index, key, value) => setForm((current) => ({
    ...current,
    circleClues: current.circleClues.map((clue, position) => position === index ? { ...clue, [key]: value } : clue),
  }))
  const updateLine = (index, key, value) => setForm((current) => ({
    ...current,
    lineClues: current.lineClues.map((clue, position) => {
      if (position !== index) return clue
      if (['total', 'anchorRow', 'anchorColumn'].includes(key)) return { ...clue, [key]: value }
      const firstCell = current.cells.find((cell) => cell.id === clue.cellIds[0])
      const axis = key === 'axis' ? value : clue.axis
      const lineIndex = key === 'lineIndex' ? value : firstCell ? firstCell[axis] : 1
      const direction = key === 'direction' ? value : axis === 'row' ? 'left' : clue.direction === 'left' ? 'up' : clue.direction
      return buildNumberGridLineClue(current.cells, { id: clue.id, axis, lineIndex, direction, total: clue.total })
    }),
  }))
  const save = async () => {
    const { errors } = validateNumberGridPuzzle(form)
    if (errors.length) { setMessage(errors.join(' ')); return }
    setSaving(true)
    setMessage('')
    try {
      await saveNumberGridPuzzle(form)
      await onSaved(form.issueOn)
    } catch (error) {
      setMessage(error.message)
      setSaving(false)
    }
  }
  return (
    <section className="number-grid-editor">
      <div className="number-grid-editor-heading"><h2>{form.recordId ? '編輯十拿九穩' : '建立十拿九穩新題'}</h2><button type="button" onClick={onCancel}><X aria-hidden="true" />關閉</button></div>
      <p>先建立 5×5 範圍內的 9 個格位及提示，確認 9 個答案數字和解答說明後才能發布。照片僅供目前編題參考。</p>
      {isBuiltInIssue && <p>這是內建題目；新版若先存草稿，學生仍看到原版，等新版發布才會替換。內建題目不可封存。</p>}
      <div className="number-grid-editor-fields">
        <label>期數日期<input type="date" value={form.issueOn} onChange={(event) => setForm((current) => ({ ...current, issueOn: event.target.value }))} /></label>
        <label>狀態<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="draft">草稿</option><option value="published">發布</option><option value="archived" disabled={isBuiltInIssue}>封存</option></select></label>
        <label>來源<input value={form.sourceName} onChange={(event) => setForm((current) => ({ ...current, sourceName: event.target.value }))} /></label>
        <label>設計者<input value={form.designerName} onChange={(event) => setForm((current) => ({ ...current, designerName: event.target.value }))} /></label>
        <label className="number-grid-editor-wide">參考照片<input type="file" accept="image/*" onChange={(event) => { if (referenceUrl) URL.revokeObjectURL(referenceUrl); setReferenceUrl(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : '') }} /></label>
      </div>
      <div className="number-grid-editor-workspace">
        <div>
          <h3>題目預覽</h3>
          <ChallengeBoard challenge={form} entries={form.solution} />
          {referenceUrl && <img className="number-grid-editor-photo" src={referenceUrl} alt="編題參考照片" />}
        </div>
        <div className="number-grid-editor-controls">
          <h3>9 個作答格與答案</h3>
          <p>列、欄皆從 1 到 5；每格位置不得重複。答案可先留空存草稿。</p>
          <div className="number-grid-editor-cell-list">
            {form.cells.map((cell, index) => <div key={cell.id}>
              <strong>格 {index + 1}</strong>
              <label>列<select value={cell.row} onChange={(event) => updateCell(index, 'row', Number(event.target.value))}>{Array.from({ length: 5 }, (_, value) => <option key={value} value={value}>{value + 1}</option>)}</select></label>
              <label>欄<select value={cell.column} onChange={(event) => updateCell(index, 'column', Number(event.target.value))}>{Array.from({ length: 5 }, (_, value) => <option key={value} value={value}>{value + 1}</option>)}</select></label>
              <label>答案<select value={form.solution[index] || ''} onChange={(event) => setForm((current) => ({ ...current, solution: current.solution.map((number, position) => position === index ? Number(event.target.value) || null : number) }))}><option value="">未填</option>{NUMBER_GRID_BANK.map((number) => <option key={number} value={number}>{number}</option>)}</select></label>
            </div>)}
          </div>
          <div className="number-grid-editor-section-heading"><h3>圓圈提示</h3><button type="button" onClick={() => setForm((current) => ({ ...current, circleClues: [...current.circleClues, { row: 1, column: 1, total: 1 }] }))}><Plus aria-hidden="true" />新增</button></div>
          <p>填入交點座標 0～5；0 是畫布最上方或最左方的外框線。</p>
          {form.circleClues.map((clue, index) => <div className="number-grid-editor-clue-row" key={`circle-${index}`}>
            <label>橫線<input type="number" min="0" max="5" value={clue.row} onChange={(event) => updateCircle(index, 'row', Number(event.target.value))} /></label>
            <label>直線<input type="number" min="0" max="5" value={clue.column} onChange={(event) => updateCircle(index, 'column', Number(event.target.value))} /></label>
            <label>合計<input type="number" min="1" value={clue.total} onChange={(event) => updateCircle(index, 'total', Number(event.target.value))} /></label>
            <button type="button" aria-label={`刪除第 ${index + 1} 個圓圈`} onClick={() => setForm((current) => ({ ...current, circleClues: current.circleClues.filter((_, position) => position !== index) }))}><Trash2 aria-hidden="true" /></button>
          </div>)}
          <div className="number-grid-editor-section-heading"><h3>箭頭提示</h3><button type="button" onClick={() => setForm((current) => ({ ...current, lineClues: [...current.lineClues, buildNumberGridLineClue(current.cells, { id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, axis: 'row', lineIndex: 1, direction: 'left', total: 1 })] }))}><Plus aria-hidden="true" />新增</button></div>
          <p>若提示壓到作答格，可調整下方錨點列、欄（0～5，允許小數）。</p>
          {form.lineClues.map((clue, index) => {
            const firstCell = form.cells.find((cell) => cell.id === clue.cellIds[0])
            return <div className="number-grid-editor-clue-row is-line" key={clue.id}>
              <label>方向<select value={clue.axis} onChange={(event) => updateLine(index, 'axis', event.target.value)}><option value="row">橫列</option><option value="column">直行</option></select></label>
              <label>第幾{clue.axis === 'row' ? '列' : '欄'}<select value={firstCell?.[clue.axis] ?? 1} onChange={(event) => updateLine(index, 'lineIndex', Number(event.target.value))}>{Array.from({ length: 5 }, (_, value) => <option key={value} value={value}>{value + 1}</option>)}</select></label>
              <label>箭頭<select value={clue.direction} onChange={(event) => updateLine(index, 'direction', event.target.value)}>{clue.axis === 'row' ? <option value="left">向左</option> : <><option value="up">向上</option><option value="down">向下</option></>}</select></label>
              <label>合計<input type="number" min="1" value={clue.total} onChange={(event) => updateLine(index, 'total', Number(event.target.value))} /></label>
              <button type="button" aria-label={`刪除第 ${index + 1} 個箭頭`} onClick={() => setForm((current) => ({ ...current, lineClues: current.lineClues.filter((_, position) => position !== index) }))}><Trash2 aria-hidden="true" /></button>
              <div className="number-grid-editor-anchor"><label>錨點列<input type="number" min="0" max="5" step="0.05" value={clue.anchorRow} onChange={(event) => updateLine(index, 'anchorRow', Number(event.target.value))} /></label><label>錨點欄<input type="number" min="0" max="5" step="0.05" value={clue.anchorColumn} onChange={(event) => updateLine(index, 'anchorColumn', Number(event.target.value))} /></label></div>
            </div>
          })}
          <label className="number-grid-editor-explanation">解答說明<textarea rows="5" value={form.explanation} onChange={(event) => setForm((current) => ({ ...current, explanation: event.target.value }))} /></label>
        </div>
      </div>
      <div className="number-grid-editor-save"><button type="button" className="primary-button" disabled={saving} onClick={save}><Save aria-hidden="true" />{saving ? '儲存中' : '儲存題目'}</button>{message && <p role="status">{message}</p>}</div>
    </section>
  )
}

export default function NumberGridChallenge({ guestMode = false }) {
  const [catalog, setCatalog] = useState({ puzzles: numberGridChallenges, canManage: false, warning: '' })
  const [editing, setEditing] = useState(null)
  const [selectedId, setSelectedId] = useState(numberGridChallenges.at(-1).id)
  const challenge = useMemo(() => catalog.puzzles.find((item) => item.id === selectedId) || catalog.puzzles.at(-1) || numberGridChallenges.at(-1), [catalog.puzzles, selectedId])
  const initialProgress = useMemo(() => loadProgress(challenge), [challenge])
  const [entries, setEntries] = useState(initialProgress.entries)
  const [perfectCompletedAt, setPerfectCompletedAt] = useState(initialProgress.perfectCompletedAt)
  const [loadedChallengeId, setLoadedChallengeId] = useState(challenge.id)
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [checkedResult, setCheckedResult] = useState(null)
  const [message, setMessage] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)

  const loadCatalog = async () => {
    if (!isSupabaseConfigured) return
    try {
      const loaded = await loadNumberGridPuzzles({ guestMode })
      setCatalog({ ...loaded, warning: '' })
    } catch (error) {
      setCatalog({ puzzles: numberGridChallenges, canManage: false, warning: `${error.message}；目前僅顯示內建四期。` })
    }
  }

  useEffect(() => { loadCatalog() }, [guestMode])

  useEffect(() => {
    const saved = loadProgress(challenge)
    setEntries(saved.entries)
    setPerfectCompletedAt(saved.perfectCompletedAt)
    setLoadedChallengeId(challenge.id)
    setSelectedNumber(null)
    setCheckedResult(null)
    setMessage('')
  }, [challenge])

  useEffect(() => {
    if (typeof window === 'undefined' || loadedChallengeId !== challenge.id) return
    window.localStorage.setItem(progressKey(challenge.id), JSON.stringify(serializeNumberGridProgress(entries, perfectCompletedAt)))
  }, [challenge.id, entries, loadedChallengeId, perfectCompletedAt])

  const usedNumbers = new Set(entries.filter(Boolean))
  const placeNumber = (cellIndex) => {
    if (selectedNumber == null) {
      if (!entries[cellIndex]) return
      setEntries((current) => current.map((value, index) => index === cellIndex ? null : value))
      setCheckedResult(null)
      setMessage('已將數字放回選擇區。')
      return
    }
    setEntries((current) => current.map((value, index) => {
      if (index === cellIndex) return selectedNumber
      return value === selectedNumber ? null : value
    }))
    setSelectedNumber(null)
    setCheckedResult(null)
    setMessage('')
  }

  const checkAnswer = () => {
    const result = assessNumberGridChallenge(challenge, entries)
    if (!result.complete) {
      setMessage('請先填滿 9 個方格。')
      setCheckedResult(null)
      return
    }
    if (!result.unique) {
      setMessage('每個數字只能使用一次。')
      setCheckedResult(result)
      return
    }
    setCheckedResult(result)
    if (result.correct) {
      setPerfectCompletedAt((current) => current || new Date().toISOString())
      setMessage('全部加總正確，已完成挑戰並解鎖解答。')
    } else {
      setMessage('仍有加總不正確；紅色提示可協助你找出需要調整的位置。')
    }
  }

  const reset = () => {
    setEntries(Array(9).fill(null))
    setSelectedNumber(null)
    setCheckedResult(null)
    setMessage('已清除目前填寫內容。')
  }
  const returnUrl = guestMode ? '?guest=1' : './'

  return (
    <div className="number-grid-page">
      <header className="number-grid-header">
        <a href={returnUrl}><ArrowLeft aria-hidden="true" />返回學習系統</a>
        <div><p>數字益智遊戲</p><h1>十拿九穩之變形挑戰</h1></div>
        {catalog.canManage ? <button type="button" onClick={() => setEditing(createNumberGridDraft(todayIssue()))}><Plus aria-hidden="true" />建立新題</button> : <span />}
      </header>
      <main className="number-grid-main">
        <section className="number-grid-intro">
          <div><p className="eyebrow">NUMBER GRID</p><h2>用 9 個數字同時完成所有加總</h2><p>來源：聯合報好讀周報　｜　遊戲設計：狄運來老師</p></div>
          <button type="button" onClick={() => setShowInstructions((value) => !value)} aria-expanded={showInstructions}>遊戲說明<ChevronDown aria-hidden="true" /></button>
        </section>
        {showInstructions && (
          <section className="number-grid-instructions">
            <p>從 1～10 選出 9 個數字，分別填入 9 個方格，每個數字只能使用一次。</p>
            <p><strong>圓圈數字</strong>是周圍所有相鄰方格的總和；<strong>箭頭數字</strong>是該橫列或直行方格的總和。先選數字，再點空格；點已填入的格子可取回數字。</p>
          </section>
        )}
        {catalog.warning && <p className="number-grid-catalog-warning" role="status">{catalog.warning}</p>}
        {editing ? <NumberGridEditor puzzle={editing} onCancel={() => setEditing(null)} onSaved={async (issueOn) => { await loadCatalog(); setSelectedId(issueOn); setEditing(null) }} /> : <>
        <section className="number-grid-challenge-card">
          <div className="number-grid-challenge-heading">
            <div><p className="eyebrow">CHALLENGE</p><h2>{challenge.label}：{challenge.title}</h2></div>
            <label>選擇題目<select value={challenge.id} onChange={(event) => setSelectedId(event.target.value)}>{[...catalog.puzzles].reverse().map((item) => <option value={item.id} key={item.id}>{item.label}{catalog.canManage && item.status !== 'published' ? `（${item.status === 'draft' ? '草稿' : '封存'}）` : ''}</option>)}</select></label>
          </div>
          {catalog.canManage && <div className="number-grid-admin-actions"><button type="button" onClick={() => setEditing(challenge)}><Pencil aria-hidden="true" />編輯本期</button></div>}
          <div className="number-grid-workspace">
            <div>
              <ChallengeBoard challenge={challenge} entries={entries} onCellClick={placeNumber} checkedResult={checkedResult} />
              <div className="number-grid-actions">
                <button type="button" className="secondary-button" onClick={reset}><RotateCcw aria-hidden="true" />重新開始</button>
                <button type="button" className="primary-button" onClick={checkAnswer}><Check aria-hidden="true" />完成檢查</button>
              </div>
              {message && <p className="number-grid-message" role="status">{message}</p>}
            </div>
            <aside className="number-grid-bank-column">
              <div><p className="eyebrow">NUMBER BANK</p><h2>選擇數字</h2><span>還要填 {9 - usedNumbers.size} 格</span></div>
              <div className="number-grid-bank">
                {NUMBER_GRID_BANK.map((number) => (
                  <button type="button" key={number} disabled={usedNumbers.has(number)} className={selectedNumber === number ? 'is-selected' : ''} onClick={() => setSelectedNumber((current) => current === number ? null : number)}>{number}</button>
                ))}
              </div>
              <p>10 個數字中會有 1 個不使用。</p>
            </aside>
          </div>
        </section>
        <aside className={`number-grid-answer-panel ${perfectCompletedAt ? '' : 'is-locked'}`}>
          {perfectCompletedAt ? (
            <details>
              <summary><span><span className="eyebrow">ANSWER</span><strong>本題解答與解答說明</strong></span><span>已解鎖，可展開查看</span></summary>
              <div className="number-grid-answer-content">
                <ChallengeBoard challenge={challenge} entries={challenge.solution} answer />
                <section><h3>解答說明</h3><p>{challenge.explanation}</p></section>
              </div>
            </details>
          ) : (
            <div className="number-grid-answer-lock"><LockKeyhole aria-hidden="true" /><span><strong>解答尚未解鎖</strong><small>完成一輪並全部答對後才可查看。</small></span></div>
          )}
        </aside>
        </>}
      </main>
    </div>
  )
}
