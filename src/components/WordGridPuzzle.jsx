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
  restoreAssignments,
  serializeAssignments,
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
  previousAnswerLabel: '',
  previousAnswerGrid: null,
  status: 'draft',
}

function formatIssueDate(value) {
  if (!value) return '未定日期'
  const [year, month, day] = value.split('-')
  return `${year}／${month}／${day}`
}

function progressKey(puzzleId) {
  return `sljh-word-grid-progress-v1:${puzzleId}`
}

function loadSavedAssignments(puzzle) {
  if (!puzzle?.id || typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(progressKey(puzzle.id)) || '{}')
    return restoreAssignments(parsed, puzzle.grid, puzzle.characterBank)
  } catch {
    return {}
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

function AnswerPanel({ puzzle }) {
  return (
    <aside className="word-grid-answer-panel" aria-labelledby="previous-answer-title">
      <div>
        <p className="eyebrow">PREVIOUS ANSWER</p>
        <h2 id="previous-answer-title">前一期答案</h2>
        <p>{puzzle.previousAnswerLabel || '部分期數資料尚未收錄'}</p>
      </div>
      {puzzle.previousAnswerGrid ? (
        <PuzzleGrid puzzle={{ ...puzzle, grid: puzzle.previousAnswerGrid, characterBank: [] }} answerGrid={puzzle.previousAnswerGrid} />
      ) : (
        <div className="word-grid-answer-missing">
          <CircleAlert aria-hidden="true" />
          <strong>這一期沒有可核對的前期答案</strong>
          <span>之後可由管理者補登，不影響本期練習。</span>
        </div>
      )}
    </aside>
  )
}

function PlayArea({ puzzle }) {
  const bankTiles = useMemo(() => createBankTiles(puzzle.characterBank), [puzzle.characterBank])
  const [assignments, setAssignments] = useState(() => loadSavedAssignments(puzzle))
  const [selectedTile, setSelectedTile] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setAssignments(loadSavedAssignments(puzzle))
    setSelectedTile(null)
    setMessage('')
  }, [puzzle.id])

  useEffect(() => {
    if (!puzzle.id || typeof window === 'undefined') return
    window.localStorage.setItem(progressKey(puzzle.id), JSON.stringify(serializeAssignments(assignments)))
  }, [assignments, puzzle.id])

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
    else if (result.correct) setMessage('全部正確，完成本期填字圖。')
    else setMessage('還有文字位置不正確，可以再調整。')
  }

  return (
    <section className="word-grid-play" aria-labelledby="word-grid-play-title">
      <div className="word-grid-bank-heading">
        <div>
          <p className="eyebrow">CHARACTER BANK</p>
          <h2 id="word-grid-play-title">可填的文字</h2>
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
      <p className="word-grid-hint">先點一張字卡，再點白格；點已填的格子可把文字放回字庫。</p>
      <PuzzleGrid puzzle={puzzle} assignments={assignments} onCellClick={handleCellClick} />
      <div className="word-grid-actions">
        <button type="button" className="secondary-button" onClick={clearAll}><RotateCcw aria-hidden="true" />重新開始</button>
        <button type="button" className="primary-button" onClick={checkAnswer}><Check aria-hidden="true" />完成檢查</button>
      </div>
      {message && <p className="word-grid-message" role="status">{message}</p>}
    </section>
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
  const [form, setForm] = useState(() => ({ ...defaultPuzzle, ...puzzle, grid: normalizeWordGrid(puzzle?.grid || defaultPuzzle.grid) }))
  const [mode, setMode] = useState(wordGridCellTypes.block)
  const [answerTab, setAnswerTab] = useState('puzzle')
  const [referenceUrl, setReferenceUrl] = useState('')
  const [status, setStatus] = useState({ saving: false, message: '' })

  useEffect(() => () => { if (referenceUrl) URL.revokeObjectURL(referenceUrl) }, [referenceUrl])

  const updateReference = (file) => {
    if (referenceUrl) URL.revokeObjectURL(referenceUrl)
    setReferenceUrl(file ? URL.createObjectURL(file) : '')
  }
  const setAnswerEnabled = (field, enabled) => setForm((current) => ({
    ...current,
    [field]: enabled
      ? field === 'previousAnswerGrid' ? createEmptyWordGrid() : copyPuzzleShapeForAnswer(current.grid)
      : null,
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

  const activeGrid = answerTab === 'puzzle' ? form.grid : answerTab === 'solution' ? form.solutionGrid : form.previousAnswerGrid
  return (
    <section className="word-grid-editor" aria-labelledby="word-grid-editor-title">
      <div className="word-grid-editor-heading">
        <div><p className="eyebrow">ADMIN EDITOR</p><h2 id="word-grid-editor-title">{form.id ? '編輯填字圖' : '建立填字圖'}</h2></div>
        <button type="button" className="icon-button" onClick={onCancel}><X aria-hidden="true" /><span>關閉</span></button>
      </div>
      <div className="word-grid-editor-fields">
        <label>期數日期<input type="date" value={form.publishedOn} onChange={(event) => setForm({ ...form, publishedOn: event.target.value })} /></label>
        <label>狀態<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="draft">草稿</option><option value="published">發布</option><option value="archived">封存</option></select></label>
        <label>來源<input value={form.sourceName} onChange={(event) => setForm({ ...form, sourceName: event.target.value })} /></label>
        <label>設計者<input value={form.designerName} onChange={(event) => setForm({ ...form, designerName: event.target.value })} /></label>
        <label className="is-wide">可填文字<textarea rows="3" value={Array.isArray(form.characterBank) ? form.characterBank.join('') : form.characterBank} onChange={(event) => setForm({ ...form, characterBank: event.target.value })} /></label>
        <label className="is-wide">前一期答案標示<input value={form.previousAnswerLabel} placeholder="例如：2026／08／24 答案" onChange={(event) => setForm({ ...form, previousAnswerLabel: event.target.value })} /></label>
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
            <button type="button" className={answerTab === 'previous' ? 'is-active' : ''} onClick={() => setAnswerTab('previous')}>前一期答案</button>
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
                  onChange={(event) => setAnswerEnabled(answerTab === 'solution' ? 'solutionGrid' : 'previousAnswerGrid', event.target.checked)}
                />
                收錄{answerTab === 'solution' ? '本期完整解答' : '前一期答案'}
              </label>
              {answerTab === 'previous' && activeGrid && <div className="word-grid-editor-tools" aria-label="前一期答案格工具">
                <button type="button" className={mode === 'block' ? 'is-active' : ''} onClick={() => setMode('block')}>黑格</button>
                <button type="button" className={mode === 'empty' ? 'is-active' : ''} onClick={() => setMode('empty')}>白格</button>
                <button type="button" className={mode === 'given' ? 'is-active' : ''} onClick={() => setMode('given')}>答案字</button>
              </div>}
            </>
          )}
          {activeGrid ? (
            <GridEditor
              value={activeGrid}
              mode={answerTab === 'solution' ? 'answer' : mode}
              onChange={(grid) => setForm({ ...form, [answerTab === 'puzzle' ? 'grid' : answerTab === 'solution' ? 'solutionGrid' : 'previousAnswerGrid']: grid })}
            />
          ) : <p className="word-grid-editor-empty">勾選後即可輸入答案；未收錄時，學生端會顯示尚無答案。</p>}
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
        {showInstructions && <div className="word-grid-instructions"><p>將上方字卡各使用一次，填入白色空格。橫向由左至右、直向由上至下，都要能形成正確語詞或文句。黑格不可填，題目中的文字是提示。</p><p>系統會保存在目前裝置的進度；缺少完整解答的期數只供練習，不會顯示成答對。</p></div>}
        {editing ? <PuzzleEditor puzzle={editing} onSaved={async () => { await load(); setEditing(null) }} onCancel={() => setEditing(null)} /> : puzzle ? <>
          <div className="word-grid-issue-bar">
            <label>選擇期數<select value={puzzle.id} onChange={(event) => setSelectedId(event.target.value)}>{state.puzzles.filter((item) => state.canManage || item.status === 'published').map((item) => <option value={item.id} key={item.id}>{formatIssueDate(item.publishedOn)}{item.status !== 'published' ? `・${item.status === 'draft' ? '草稿' : '封存'}` : ''}</option>)}</select></label>
            <div><strong>{formatIssueDate(puzzle.publishedOn)}</strong><span>{puzzle.solutionGrid ? '可自動核對' : '練習模式・暫無本期解答'}</span></div>
            {state.canManage && <div className="word-grid-admin-actions"><button type="button" onClick={() => setEditing(puzzle)}><Pencil aria-hidden="true" />編輯</button><button type="button" onClick={async () => { await archiveWordGridPuzzle(puzzle.id); await load() }}><Eraser aria-hidden="true" />封存</button></div>}
          </div>
          <div className="word-grid-layout">
            <PlayArea puzzle={puzzle} />
            <AnswerPanel puzzle={puzzle} />
          </div>
        </> : <section className="word-grid-empty"><h2>目前尚無已發布題目</h2>{state.canManage && <button className="primary-button" type="button" onClick={() => setEditing(defaultPuzzle)}><Plus aria-hidden="true" />建立第一題</button>}</section>}
      </main>
    </div>
  )
}
