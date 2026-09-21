import { useEffect, useMemo, useState } from 'react'
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
import {
  assessWordGridAnswer,
  createBankTiles,
  createEmptyWordGrid,
  normalizeWordGrid,
  parseCharacterBank,
  restoreWordGridProgress,
  serializeWordGridProgress,
  validateWordGridPuzzle,
  wordGridCellTypes,
} from '../lib/wordGridPuzzle.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import {
  archiveWordGridPuzzle,
  loadWordGridPuzzles,
  saveWordGridPuzzle,
} from '../services/wordGridPuzzleService.js'
import './wordGridPuzzle.css'

const defaultPuzzle = {
  id: '',
  publishedOn: '',
  title: '填字圖',
  sourceName: '聯合報好讀周報',
  designerName: '遲驖川老師',
  grid: createEmptyWordGrid(),
  characterBank: [],
  solutionGrid: null,
  answerExplanation: '',
  status: 'draft',
}

function formatIssueDate(value) {
  if (!value) return '未定日期'
  const [year, month, day] = value.split('-')
  return `${year}／${month}／${day}`
}

function todayDateValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function issueDateParts(value) {
  const [year = '', month = '', day = ''] = String(value || '').split('-')
  return { year, month, day }
}

function daysInMonth(year, month) {
  return new Date(Number(year), Number(month), 0).getDate()
}

function EditorDateSelects({ value, onChange }) {
  const parts = issueDateParts(value || todayDateValue())
  const currentYear = new Date().getFullYear()
  const years = Array.from(new Set([
    ...Array.from({ length: 8 }, (_, index) => String(currentYear - 2 + index)),
    parts.year,
  ])).filter(Boolean).sort((a, b) => Number(b) - Number(a))
  const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
  const dayCount = daysInMonth(parts.year, parts.month)
  const days = Array.from({ length: dayCount }, (_, index) => String(index + 1).padStart(2, '0'))
  const update = (key, nextValue) => {
    const next = { ...parts, [key]: nextValue }
    const maxDay = daysInMonth(next.year, next.month)
    next.day = String(Math.min(Number(next.day), maxDay)).padStart(2, '0')
    onChange(`${next.year}-${next.month}-${next.day}`)
  }
  return (
    <fieldset className="word-grid-date-fields">
      <legend>期數日期</legend>
      <label>年<select value={parts.year} onChange={(event) => update('year', event.target.value)}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
      <label>月<select value={parts.month} onChange={(event) => update('month', event.target.value)}>{months.map((month) => <option key={month} value={month}>{Number(month)}</option>)}</select></label>
      <label>日<select value={parts.day} onChange={(event) => update('day', event.target.value)}>{days.map((day) => <option key={day} value={day}>{Number(day)}</option>)}</select></label>
    </fieldset>
  )
}

function PuzzleDateSelects({ puzzles, selectedId, onSelect }) {
  const selected = puzzles.find((puzzle) => puzzle.id === selectedId) || puzzles[0]
  if (!selected) return null
  const selectedDate = issueDateParts(selected.publishedOn)
  const years = [...new Set(puzzles.map((puzzle) => issueDateParts(puzzle.publishedOn).year))].sort((a, b) => Number(b) - Number(a))
  const months = [...new Set(puzzles
    .filter((puzzle) => issueDateParts(puzzle.publishedOn).year === selectedDate.year)
    .map((puzzle) => issueDateParts(puzzle.publishedOn).month))].sort((a, b) => Number(b) - Number(a))
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
      <legend>選擇期數</legend>
      <label>年<select value={selectedDate.year} onChange={(event) => chooseFirst(puzzles.filter((puzzle) => issueDateParts(puzzle.publishedOn).year === event.target.value))}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
      <label>月<select value={selectedDate.month} onChange={(event) => chooseFirst(puzzles.filter((puzzle) => { const date = issueDateParts(puzzle.publishedOn); return date.year === selectedDate.year && date.month === event.target.value }))}>{months.map((month) => <option key={month} value={month}>{Number(month)}</option>)}</select></label>
      <label>日<select value={selected.id} onChange={(event) => onSelect(event.target.value)}>{days.map((puzzle) => <option key={puzzle.id} value={puzzle.id}>{Number(issueDateParts(puzzle.publishedOn).day)}{puzzle.status !== 'published' ? `（${puzzle.status === 'draft' ? '草稿' : '封存'}）` : ''}</option>)}</select></label>
    </fieldset>
  )
}

function progressKey(puzzleId) {
  return `sljh-word-grid-progress-v1:${puzzleId}`
}

function loadSavedProgress(puzzle) {
  if (!puzzle?.id || typeof window === 'undefined') return { assignments: {}, perfectCompletedAt: '' }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(progressKey(puzzle.id)) || '{}')
    return restoreWordGridProgress(parsed, puzzle.grid, puzzle.characterBank)
  } catch {
    return { assignments: {}, perfectCompletedAt: '' }
  }
}

function PuzzleGrid({ puzzle, assignments, onCellClick, answerGrid = null, editor = false, onEditorValue }) {
  const tiles = useMemo(() => createBankTiles(puzzle.characterBank), [puzzle.characterBank])
  const grid = answerGrid || puzzle.grid
  return (
    <div className={`word-grid-board ${editor ? 'is-editor' : ''}`} role="grid" aria-label={answerGrid ? '答案方格' : '填字圖題目'}>
      {grid.map((cell, index) => {
        const sourceCell = puzzle.grid[index]
        const isBlock = sourceCell?.type === wordGridCellTypes.block || cell.type === wordGridCellTypes.block
        const assignedTile = tiles[assignments?.[index]]
        const value = answerGrid
          ? cell.value
          : sourceCell?.type === wordGridCellTypes.given ? sourceCell.value : assignedTile?.character || ''
        if (editor && !isBlock && onEditorValue) {
          return (
            <label className="word-grid-cell is-answer-input" key={index}>
              <span className="sr-only">第 {Math.floor(index / 10) + 1} 列第 {(index % 10) + 1} 格</span>
              <input value={value} maxLength={1} onChange={(event) => onEditorValue(index, event.target.value)} />
            </label>
          )
        }
        return (
          <button
            className={`word-grid-cell is-${isBlock ? 'block' : sourceCell?.type || cell.type} ${assignedTile ? 'is-filled' : ''}`}
            type="button"
            role="gridcell"
            key={index}
            disabled={isBlock || (!editor && sourceCell?.type === wordGridCellTypes.given)}
            onClick={() => onCellClick?.(index)}
            aria-label={isBlock ? '黑格' : `第 ${Math.floor(index / 10) + 1} 列第 ${(index % 10) + 1} 格${value ? `，${value}` : '，空白'}`}
          >
            {value}
          </button>
        )
      })}
    </div>
  )
}

export function AnswerPanel({ puzzle, unlocked }) {
  if (!unlocked) {
    return (
      <aside className="word-grid-answer-panel is-locked" aria-labelledby="current-answer-title">
        <div className="word-grid-answer-lock">
          <span>
            <span className="eyebrow">CURRENT ANSWER</span>
            <strong id="current-answer-title">本期解答與解答說明</strong>
          </span>
          <span className="word-grid-answer-summary-hint">完成一輪並全部答對後解鎖</span>
        </div>
      </aside>
    )
  }
  return (
    <aside className="word-grid-answer-panel" aria-labelledby="current-answer-title">
      <details>
        <summary>
          <span>
            <span className="eyebrow">CURRENT ANSWER</span>
            <strong id="current-answer-title">本期解答與解答說明</strong>
          </span>
          <span className="word-grid-answer-summary-hint">已解鎖，可展開查看</span>
        </summary>
        {puzzle.solutionGrid ? (
          <div className="word-grid-answer-content">
            <PuzzleGrid puzzle={{ ...puzzle, grid: puzzle.solutionGrid, characterBank: [] }} answerGrid={puzzle.solutionGrid} />
            <section className="word-grid-answer-explanation" aria-label="解答說明">
              <h3>解答說明</h3>
              {puzzle.answerExplanation
                ? <p>{puzzle.answerExplanation}</p>
                : <p className="is-missing">本期解答說明尚待補登。</p>}
            </section>
          </div>
        ) : (
          <div className="word-grid-answer-missing">
            <CircleAlert aria-hidden="true" />
            <strong>本期完整解答尚未確認</strong>
            <span>管理者校對照片後才會收錄並發布。</span>
          </div>
        )}
      </details>
    </aside>
  )
}

function PlayArea({ puzzle }) {
  const bankTiles = useMemo(() => createBankTiles(puzzle.characterBank), [puzzle.characterBank])
  const initialProgress = useMemo(() => loadSavedProgress(puzzle), [puzzle])
  const [assignments, setAssignments] = useState(initialProgress.assignments)
  const [perfectCompletedAt, setPerfectCompletedAt] = useState(initialProgress.perfectCompletedAt)
  const [selectedTile, setSelectedTile] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!puzzle.id || typeof window === 'undefined') return
    window.localStorage.setItem(progressKey(puzzle.id), JSON.stringify(serializeWordGridProgress(assignments, perfectCompletedAt)))
  }, [assignments, perfectCompletedAt, puzzle.id])

  const usedTileIds = new Set(Object.values(assignments))
  const handleCellClick = (cellIndex) => {
    const currentTile = assignments[cellIndex]
    if (selectedTile == null) {
      if (currentTile == null) return
      setAssignments((current) => {
        const next = { ...current }
        delete next[cellIndex]
        return next
      })
      setMessage('已將文字放回字庫。')
      return
    }
    setAssignments((current) => {
      const next = { ...current }
      Object.keys(next).forEach((key) => {
        if (next[key] === selectedTile) delete next[key]
      })
      next[cellIndex] = selectedTile
      return next
    })
    setSelectedTile(null)
    setMessage('')
  }

  const clearAll = () => {
    setAssignments({})
    setSelectedTile(null)
    setMessage('已清除本期填寫內容。')
  }

  const checkAnswer = () => {
    const result = assessWordGridAnswer(puzzle, assignments)
    if (result.status === 'incomplete') setMessage('還有白格尚未填寫。')
    else if (result.status === 'practice-complete') setMessage('字卡已全部填入；本期暫無完整解答，因此不判分。')
    else if (result.correct) {
      setPerfectCompletedAt((current) => current || new Date().toISOString())
      setMessage('全部正確，已解鎖本期解答與解答說明。')
    }
    else setMessage('還有文字位置不正確，可以再調整。')
  }

  return (
    <>
      <section className="word-grid-play" aria-labelledby="word-grid-play-title">
        <div className="word-grid-solving-area">
          <div className="word-grid-puzzle-column">
            <div className="word-grid-puzzle-heading">
              <p className="eyebrow">PUZZLE</p>
              <h2 id="word-grid-play-title">本期題目</h2>
            </div>
            <p className="word-grid-hint">先選右側文字，再點選題目白格；點已有文字的格子可將文字放回字庫。</p>
            <PuzzleGrid puzzle={puzzle} assignments={assignments} onCellClick={handleCellClick} />
            <div className="word-grid-actions">
              <button type="button" className="secondary-button" onClick={clearAll}><RotateCcw aria-hidden="true" />重新開始</button>
              <button type="button" className="primary-button" onClick={checkAnswer}><Check aria-hidden="true" />完成檢查</button>
            </div>
            {message && <p className="word-grid-message" role="status">{message}</p>}
          </div>
          <aside className="word-grid-bank-column">
            <div className="word-grid-bank-heading">
              <div>
                <p className="eyebrow">CHARACTER BANK</p>
                <h2>可填的文字</h2>
              </div>
              <span>剩餘 {bankTiles.length - usedTileIds.size} 字</span>
            </div>
            <div className="word-grid-bank" aria-label="可填文字字庫">
              {bankTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  className={selectedTile === tile.id ? 'is-selected' : ''}
                  disabled={usedTileIds.has(tile.id)}
                  onClick={() => setSelectedTile((current) => current === tile.id ? null : tile.id)}
                >
                  {tile.character}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
      <AnswerPanel puzzle={puzzle} unlocked={Boolean(perfectCompletedAt)} />
    </>
  )
}

function copyPuzzleShapeForAnswer(grid) {
  return normalizeWordGrid(grid).map((cell) => cell.type === wordGridCellTypes.block
    ? cell
    : { type: wordGridCellTypes.given, value: cell.value || '' })
}

function GridEditor({ value, mode, onChange }) {
  const grid = normalizeWordGrid(value)
  const handleCellClick = (index) => {
    const next = [...grid]
    if (mode === 'given') {
      const value = window.prompt('請輸入這一格的提示字', grid[index]?.value || '')
      if (!value) return
      next[index] = { type: wordGridCellTypes.given, value: Array.from(value).slice(-1)[0] }
      onChange(next)
      return
    }
    next[index] = { type: mode, value: '' }
    onChange(next)
  }
  const handleValue = (index, text) => {
    const next = [...grid]
    next[index] = text
      ? { type: wordGridCellTypes.given, value: Array.from(text).slice(-1)[0] }
      : { type: wordGridCellTypes.empty, value: '' }
    onChange(next)
  }
  if (mode === 'answer') {
    return <PuzzleGrid puzzle={{ grid, characterBank: [] }} answerGrid={grid} editor onEditorValue={handleValue} />
  }
  return (
    <div className="word-grid-board is-editor" role="grid" aria-label="題目編輯方格">
      {grid.map((cell, index) => (
        <label className={`word-grid-cell is-${cell.type}`} key={index}>
          <span className="sr-only">第 {Math.floor(index / 10) + 1} 列第 {(index % 10) + 1} 格</span>
          {mode === wordGridCellTypes.given ? (
            <input value={cell.type === wordGridCellTypes.given ? cell.value : ''} maxLength={1} onChange={(event) => handleValue(index, event.target.value)} />
          ) : (
            <button type="button" onClick={() => handleCellClick(index)} aria-label={`${cell.type === 'block' ? '黑格' : '白格'}，套用目前工具`}>{cell.value}</button>
          )}
        </label>
      ))}
    </div>
  )
}

function PuzzleEditor({ puzzle, onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({
    ...defaultPuzzle,
    ...puzzle,
    publishedOn: puzzle?.publishedOn || todayDateValue(),
    grid: normalizeWordGrid(puzzle?.grid || defaultPuzzle.grid),
  }))
  const [mode, setMode] = useState(wordGridCellTypes.block)
  const [answerTab, setAnswerTab] = useState('puzzle')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [status, setStatus] = useState({ saving: false, message: '' })

  useEffect(() => () => { if (referenceUrl) URL.revokeObjectURL(referenceUrl) }, [referenceUrl])

  const updateReference = (file) => {
    if (referenceUrl) URL.revokeObjectURL(referenceUrl)
    setReferenceUrl(file ? URL.createObjectURL(file) : '')
  }
  const setAnswerEnabled = (enabled) => setForm((current) => ({
    ...current,
    solutionGrid: enabled ? copyPuzzleShapeForAnswer(current.grid) : null,
    status: !enabled && current.status === 'published' ? 'draft' : current.status,
  }))
  const save = async () => {
    const validated = validateWordGridPuzzle({ ...form, characterBank: parseCharacterBank(form.characterBank) })
    if (validated.errors.length) {
      setStatus({ saving: false, message: validated.errors.join(' ') })
      return
    }
    setStatus({ saving: true, message: '' })
    try {
      await saveWordGridPuzzle({ ...form, ...validated })
      setStatus({ saving: false, message: '題目已儲存。' })
      await onSaved()
    } catch (error) {
      setStatus({ saving: false, message: error.message })
    }
  }

  const activeGrid = answerTab === 'puzzle' ? form.grid : form.solutionGrid
  return (
    <section className="word-grid-editor" aria-labelledby="word-grid-editor-title">
      <div className="word-grid-editor-heading">
        <div><p className="eyebrow">ADMIN EDITOR</p><h2 id="word-grid-editor-title">{form.id ? '編輯填字圖' : '建立填字圖'}</h2></div>
        <button type="button" className="icon-button" onClick={onCancel}><X aria-hidden="true" /><span>關閉</span></button>
      </div>
      <div className="word-grid-editor-fields">
        <EditorDateSelects value={form.publishedOn} onChange={(publishedOn) => setForm({ ...form, publishedOn })} />
        <label>狀態<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">草稿</option><option value="published" disabled={!form.solutionGrid}>發布（須有完整解答）</option><option value="archived">封存</option></select><small>先儲存草稿；依報紙右側的當期解答完成校對後，再改為發布。</small></label>
        <label>來源<input value={form.sourceName} onChange={(event) => setForm({ ...form, sourceName: event.target.value })} /></label>
        <label>設計者<input value={form.designerName} onChange={(event) => setForm({ ...form, designerName: event.target.value })} /></label>
        <label className="is-wide">可填文字<textarea rows="3" value={Array.isArray(form.characterBank) ? form.characterBank.join('') : form.characterBank} onChange={(event) => setForm({ ...form, characterBank: event.target.value })} /></label>
      </div>
      <div className="word-grid-reference-upload">
        <label><ImagePlus aria-hidden="true" />載入照片作為本次編題參考<input type="file" accept="image/*" onChange={(event) => updateReference(event.target.files?.[0])} /></label>
        <small>照片只在目前瀏覽器顯示，不會自動上傳或發布；請依照片逐格校對。</small>
      </div>
      <div className={`word-grid-editor-workspace ${referenceUrl ? 'has-reference' : ''}`}>
        {referenceUrl && <img src={referenceUrl} alt="編題參考照片" />}
        <div>
          <div className="word-grid-editor-tabs">
            <button type="button" className={answerTab === 'puzzle' ? 'is-active' : ''} onClick={() => setAnswerTab('puzzle')}>題目格</button>
            <button type="button" className={answerTab === 'solution' ? 'is-active' : ''} onClick={() => setAnswerTab('solution')}>本期解答</button>
          </div>
          {answerTab === 'puzzle' ? (
            <div className="word-grid-editor-tools" aria-label="格子工具">
              <button type="button" className={mode === 'block' ? 'is-active' : ''} onClick={() => setMode('block')}>黑格</button>
              <button type="button" className={mode === 'empty' ? 'is-active' : ''} onClick={() => setMode('empty')}>白格</button>
              <button type="button" className={mode === 'given' ? 'is-active' : ''} onClick={() => setMode('given')}>提示字</button>
            </div>
          ) : (
            <>
              <label className="word-grid-answer-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(activeGrid)}
                  onChange={(event) => setAnswerEnabled(event.target.checked)}
                />
                收錄本期完整解答
              </label>
            </>
          )}
          {activeGrid ? (
            <GridEditor
              value={activeGrid}
              mode={answerTab === 'solution' ? 'answer' : mode}
              onChange={(grid) => setForm({ ...form, [answerTab === 'puzzle' ? 'grid' : 'solutionGrid']: grid })}
            />
          ) : <p className="word-grid-editor-empty">勾選後即可輸入答案；未收錄時，學生端會顯示尚無答案。</p>}
          {answerTab === 'solution' && activeGrid && (
            <label className="word-grid-explanation-editor">
              解答說明
              <textarea
                rows="8"
                value={form.answerExplanation || ''}
                placeholder={'請依報紙逐條輸入說明，例如：\n1. 語詞／說明\n2. 語句／出處'}
                onChange={(event) => setForm({ ...form, answerExplanation: event.target.value })}
              />
            </label>
          )}
        </div>
      </div>
      <div className="word-grid-editor-actions">
        <button type="button" className="primary-button" onClick={save} disabled={status.saving}><Save aria-hidden="true" />{status.saving ? '儲存中' : '儲存題目'}</button>
        {status.message && <p role="status">{status.message}</p>}
      </div>
    </section>
  )
}

export default function WordGridPuzzle({ guestMode = false }) {
  const [state, setState] = useState({ loading: true, error: '', puzzles: [], canManage: false })
  const [selectedId, setSelectedId] = useState('')
  const [editing, setEditing] = useState(null)
  const [showInstructions, setShowInstructions] = useState(false)

  const load = async () => {
    if (!isSupabaseConfigured) {
      setState({ loading: false, error: '填字圖尚未連接題庫。', puzzles: [], canManage: false })
      return
    }
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const data = await loadWordGridPuzzles({ guestMode })
      setState({ loading: false, error: '', ...data })
      setSelectedId((current) => current && data.puzzles.some((puzzle) => puzzle.id === current) ? current : data.puzzles[0]?.id || '')
    } catch (error) {
      setState({ loading: false, error: error.message, puzzles: [], canManage: false })
    }
  }

  useEffect(() => { load() }, [guestMode])
  const puzzle = state.puzzles.find((item) => item.id === selectedId) || state.puzzles[0]
  const returnUrl = guestMode ? '?guest=1' : './'

  if (state.loading) return <main className="center-screen"><p>正在載入填字圖……</p></main>
  if (state.error) return <main className="center-screen"><CircleAlert aria-hidden="true" /><h1>暫時無法載入填字圖</h1><p>{state.error}</p><a className="secondary-button" href={returnUrl}>返回學習系統</a></main>

  return (
    <div className="word-grid-page">
      <header className="word-grid-header">
        <a href={returnUrl}><ArrowLeft aria-hidden="true" />返回學習系統</a>
        <div><p>文字益智遊戲</p><h1>填字圖</h1></div>
        {state.canManage ? <button type="button" onClick={() => setEditing(defaultPuzzle)}><Plus aria-hidden="true" />建立新題</button> : <span />}
      </header>
      <main className="word-grid-main">
        <section className="word-grid-intro">
          <div>
            <p className="eyebrow">WORD GRID</p>
            <h2>讓橫列與直行成為正確語詞或文句</h2>
            <p>來源：聯合報好讀周報　｜　遊戲設計：遲驖川老師</p>
          </div>
          <button type="button" onClick={() => setShowInstructions((value) => !value)} aria-expanded={showInstructions}>遊戲說明<ChevronDown aria-hidden="true" /></button>
        </section>
        {showInstructions && <div className="word-grid-instructions"><p>將字庫中的文字各使用一次，填入白色空格。橫向由左至右、直向由上至下，都要能形成正確語詞或文句。黑格不可填，題目中的文字是提示。</p><p>可用年、月、日選擇想挑戰的期數；題目會在答案確認後才發布，系統並會保存在目前裝置的作答進度。每一期至少完成一輪並全部答對後，才可展開該期解答與解答說明。</p></div>}
        {editing ? <PuzzleEditor puzzle={editing} onSaved={async () => { await load(); setEditing(null) }} onCancel={() => setEditing(null)} /> : puzzle ? <>
          <div className="word-grid-issue-bar">
            <PuzzleDateSelects puzzles={state.puzzles.filter((item) => state.canManage || item.status === 'published')} selectedId={puzzle.id} onSelect={setSelectedId} />
            <div><strong>{formatIssueDate(puzzle.publishedOn)}</strong><span>{puzzle.solutionGrid ? '答案已收錄・可自動核對' : '草稿預覽・答案尚未確認'}</span></div>
            {state.canManage && <div className="word-grid-admin-actions"><button type="button" onClick={() => setEditing(puzzle)}><Pencil aria-hidden="true" />編輯</button><button type="button" onClick={async () => { await archiveWordGridPuzzle(puzzle.id); await load() }}><Eraser aria-hidden="true" />封存</button></div>}
          </div>
          <div className="word-grid-layout">
            <PlayArea key={puzzle.id} puzzle={puzzle} />
          </div>
        </> : <section className="word-grid-empty"><h2>目前尚無已發布題目</h2>{state.canManage && <button className="primary-button" type="button" onClick={() => setEditing(defaultPuzzle)}><Plus aria-hidden="true" />建立第一題</button>}</section>}
      </main>
    </div>
  )
}
