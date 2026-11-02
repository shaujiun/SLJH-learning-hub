import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Check,
  CircleAlert,
  Coins,
  ExternalLink,
  Image as ImageIcon,
  Lightbulb,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from 'lucide-react'
import {
  assessIdiomAssignments,
  buildIdiomPuzzle,
  buildManualIdiomPuzzle,
  chooseHintCell,
  createIdiomEditorGrid,
  createIdiomBankTiles,
  editorGridFromPuzzle,
  IDIOM_EDITOR_CELL_TYPES,
  IDIOM_DIFFICULTIES,
} from '../lib/idiomWordGrid.js'
import {
  completeIdiomPuzzle,
  loadIdiomWordGridContext,
  saveIdiomEntry,
  saveIdiomPuzzle,
  spendIdiomHint,
} from '../services/idiomWordGridService.js'
import {
  IDIOM_DICTIONARY_ATTRIBUTION,
  IDIOM_DICTIONARY_VERSION,
} from '../data/idiomWordGridStarter.js'
import './idiomWordGrid.css'

const difficultyOrder = ['beginner', 'basic', 'advanced', 'challenge']
const stageLabels = {
  elementary: '國小階段',
  junior: '國中階段',
  senior: '高中延伸',
  all: '跨階段／自訂',
}

function formatDate(value) {
  if (!value) return '自由練習'
  const [year, month, day] = value.split('-')
  return `${year}／${month}／${day}`
}
function progressKey(studentId, puzzleId) {
  return `sljh:idiom-word-grid:${studentId || 'guest'}:${puzzleId}`
}

function restoreProgress(studentId, puzzleId) {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(window.localStorage.getItem(progressKey(studentId, puzzleId)) || '{}') } catch { return {} }
}

function PuzzleTabs({ guestMode }) {
  const guest = guestMode ? '&guest=1' : ''
  return (
    <nav className="word-grid-mode-tabs" aria-label="填字圖類型">
      <a href={`?puzzle=word-grid${guest}`}>報紙填字圖</a>
      <a className="is-active" href={`?puzzle=word-grid&mode=idiom${guest}`}>成語填字圖</a>
    </nav>
  )
}

export function IdiomBoard({ puzzle, assignments, selectedCellKey, revealedKeys, checkedWrongKeys = [], onCellClick }) {
  const tiles = useMemo(() => createIdiomBankTiles(puzzle), [puzzle])
  const given = new Set(puzzle.givenCellKeys || [])
  const revealed = new Set(revealedKeys || [])
  const cellMap = new Map((puzzle.board?.cells || []).map((cell) => [cell.key, cell]))
  return (
    <div
      className="idiom-grid-board"
      role="grid"
      aria-label="成語填字圖題目"
      style={{ '--idiom-grid-columns': puzzle.board.width, '--idiom-grid-rows': puzzle.board.height }}
    >
      {Array.from({ length: puzzle.board.width * puzzle.board.height }, (_, index) => {
        const row = Math.floor(index / puzzle.board.width)
        const column = index % puzzle.board.width
        const key = `${row}:${column}`
        const cell = cellMap.get(key)
        if (!cell) return <span className={`idiom-grid-void ${puzzle.board.showBlocks ? 'is-block' : ''}`} key={key} aria-hidden="true" />
        const tile = tiles[assignments[key]]
        const fixed = given.has(key) || revealed.has(key)
        const value = fixed ? cell.solution : tile?.character || ''
        return (
          <button
            key={key}
            type="button"
            role="gridcell"
            className={`idiom-grid-cell ${fixed ? 'is-given' : ''} ${revealed.has(key) ? 'is-hint' : ''} ${checkedWrongKeys.includes(key) ? 'is-checked-wrong' : ''} ${cell.isIntersection ? 'is-intersection' : ''} ${selectedCellKey === key ? 'is-selected-cell' : ''}`}
            disabled={fixed}
            onClick={() => onCellClick(key)}
            aria-label={`第 ${row + 1} 列第 ${column + 1} 格${value ? `，${value}` : '，空白'}${cell.isIntersection ? '，交錯格' : ''}`}
          >
            {value}
            {cell.isIntersection && <span className="idiom-grid-cross-dot" aria-hidden="true" />}
          </button>
        )
      })}
    </div>
  )
}

export function IdiomLearningPanel({ puzzle }) {
  const [selectedId, setSelectedId] = useState(puzzle.idioms[0]?.id || '')
  useEffect(() => setSelectedId(puzzle.idioms[0]?.id || ''), [puzzle.id])
  const entry = puzzle.idioms.find((idiom) => idiom.id === selectedId) || puzzle.idioms[0]
  return (
    <section className="idiom-learning-panel" aria-labelledby="idiom-learning-title">
      <div className="idiom-learning-heading">
        <div><p className="eyebrow">AFTER CLEARING</p><h2 id="idiom-learning-title">本關成語學習</h2></div>
        <span><BookOpen aria-hidden="true" />全部答對後解鎖</span>
      </div>
      <div className="idiom-chip-list" role="list">
        {puzzle.idioms.map((idiom) => (
          <button key={idiom.id} type="button" className={idiom.id === entry?.id ? 'is-active' : ''} onClick={() => setSelectedId(idiom.id)}>{idiom.phrase}</button>
        ))}
      </div>
      {entry && (
        <article className="idiom-entry-card">
          <div className="idiom-entry-copy">
            <h3>{entry.phrase}</h3>
            <dl>
              <div><dt>釋義</dt><dd>{entry.definition || '本題的教育部釋義尚待同步；可先開啟原始條目查詢。'}</dd></div>
              <div><dt>典源或出處</dt><dd>{entry.source || '請參閱教育部《成語典》原始條目。'}</dd></div>
            </dl>
            {entry.story && <details><summary>閱讀完整典故</summary><p>{entry.story}</p></details>}
            {entry.sourceUrl && <a href={entry.sourceUrl} target="_blank" rel="noreferrer">開啟教育部《成語典》條目<ExternalLink aria-hidden="true" /></a>}
          </div>
          <div className={`idiom-entry-illustration ${entry.illustrationUrl ? 'has-image' : ''}`}>
            {entry.illustrationUrl
              ? <img src={entry.illustrationUrl} alt={`${entry.phrase}的輔助插圖`} />
              : <><ImageIcon aria-hidden="true" /><span>插圖須經教師確認與成語內容相符後才會顯示</span></>}
          </div>
        </article>
      )}
      <footer className="idiom-attribution">
        <strong>資料來源</strong>
        <span>{IDIOM_DICTIONARY_ATTRIBUTION}</span>
        <span>資料版本：{puzzle.sourceVersion || IDIOM_DICTIONARY_VERSION}；內容依原授權資料呈現，不改寫釋義與典源。</span>
      </footer>
    </section>
  )
}

export function PlayIdiomPuzzle({ puzzle, context, focusTaskId, onEnergyChange }) {
  const initial = useMemo(() => restoreProgress(context.studentId, puzzle.id), [context.studentId, puzzle.id])
  const [assignments, setAssignments] = useState(initial.assignments || {})
  const [revealedKeys, setRevealedKeys] = useState(initial.revealedKeys || [])
  const [hintUses, setHintUses] = useState(Number(initial.hintUses || initial.revealedKeys?.length || 0))
  const [selectedTile, setSelectedTile] = useState(null)
  const [selectedCellKey, setSelectedCellKey] = useState('')
  const [checkedWrongKeys, setCheckedWrongKeys] = useState([])
  const [message, setMessage] = useState('')
  const [completed, setCompleted] = useState(Boolean(initial.completed))
  const [busy, setBusy] = useState(false)
  const tiles = useMemo(() => createIdiomBankTiles(puzzle), [puzzle])
  const usedTileIds = new Set(Object.values(assignments))

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(progressKey(context.studentId, puzzle.id), JSON.stringify({ assignments, revealedKeys, hintUses, completed }))
  }, [assignments, completed, context.studentId, hintUses, puzzle.id, revealedKeys])

  const reset = () => {
    setAssignments({})
    setRevealedKeys([])
    setHintUses(0)
    setSelectedTile(null)
    setSelectedCellKey('')
    setCheckedWrongKeys([])
    setCompleted(false)
    setMessage('已重新開始；先選字卡，再點選空格。')
  }

  const placeTile = (cellKey) => {
    setSelectedCellKey(cellKey)
    setCheckedWrongKeys((current) => current.filter((key) => key !== cellKey))
    if (selectedTile == null) {
      if (!Number.isInteger(assignments[cellKey])) return
      setAssignments((current) => {
        const next = { ...current }
        delete next[cellKey]
        return next
      })
      return
    }
    setAssignments((current) => {
      const next = { ...current }
      Object.keys(next).forEach((key) => { if (next[key] === selectedTile) delete next[key] })
      next[cellKey] = selectedTile
      return next
    })
    setSelectedTile(null)
  }

  const revealHint = async (kind) => {
    const target = chooseHintCell(puzzle, assignments, revealedKeys, kind, selectedCellKey)
    if (!target) {
      setMessage(kind === 'cross' ? '目前沒有可提示的交錯格。' : '請先點選想提示的空格。')
      return
    }
    const cost = kind === 'cross' ? 2 : 1
    if (context.energy < cost) {
      setMessage(`能量不足，需要 ${cost} 點；首次通關可取得能量。`)
      return
    }
    setBusy(true)
    try {
      let nextEnergy = context.energy - cost
      if (context.remoteEnabled && context.studentId && !puzzle.id.startsWith('starter-')) {
        const result = await spendIdiomHint({ puzzleId: puzzle.id, kind, cellKey: target.key })
        nextEnergy = result.energy
      }
      onEnergyChange(nextEnergy)
      setHintUses((current) => current + 1)
      setRevealedKeys((current) => [...new Set([...current, target.key])])
      setAssignments((current) => {
        const next = { ...current }
        delete next[target.key]
        return next
      })
      setMessage(kind === 'cross' ? '已揭示一個同時連接兩個成語的交錯字。' : '已揭示所選格的一個字。')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const checkOneWrong = async () => {
    const result = assessIdiomAssignments(puzzle, assignments)
    const wrongCellKey = result.wrongCellKeys?.[0]
    if (!wrongCellKey) {
      setMessage(result.status === 'incomplete' ? '請先填入一些文字，再使用錯字檢查。' : '目前填入的文字沒有發現錯位。')
      return
    }
    if (context.energy < 1) {
      setMessage('能量不足，需要 1 點。')
      return
    }
    setBusy(true)
    try {
      let nextEnergy = context.energy - 1
      if (context.remoteEnabled && context.studentId && !puzzle.id.startsWith('starter-')) {
        const saved = await spendIdiomHint({ puzzleId: puzzle.id, kind: 'check', cellKey: wrongCellKey })
        nextEnergy = saved.energy
      }
      onEnergyChange(nextEnergy)
      setHintUses((current) => current + 1)
      setCheckedWrongKeys([wrongCellKey])
      setMessage('已標記一個位置錯誤的字，但不公布正確答案；調整後可再檢查。')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const checkAnswer = async () => {
    const result = assessIdiomAssignments(puzzle, assignments)
    if (result.status === 'incomplete') {
      setMessage('還有空格尚未填寫。')
      return
    }
    if (!result.correct) {
      setMessage('還有文字位置不正確；系統不會直接公布答案，可以繼續調整或使用提示。')
      return
    }
    const wasCompleted = completed
    setCompleted(true)
    setMessage('全部正確，已解鎖本關成語的釋義與出處。')
    if (!context.studentId || puzzle.id.startsWith('starter-')) {
      if (!wasCompleted) onEnergyChange(Math.min(20, context.energy + (hintUses ? 3 : 4)))
      return
    }
    setBusy(true)
    try {
      const saved = await completeIdiomPuzzle({ puzzleId: puzzle.id, hintsUsed: hintUses, focusTaskId })
      onEnergyChange(saved.energy)
      setMessage(`全部正確，已解鎖成語學習。${saved.energyEarned ? `本關獲得 ${saved.energyEarned} 點能量。` : '本關已領取過能量。'}${saved.taskCompleted ? '每日任務也已完成。' : ''}`)
    } catch (error) {
      setMessage(`${error.message}；本機仍保留本次通關。`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="idiom-play-card">
        <div className="idiom-play-heading">
          <div><p className="eyebrow">IDIOM CROSSWORD</p><h2>{puzzle.title}</h2><span>{formatDate(puzzle.publishedOn)}・{IDIOM_DIFFICULTIES[puzzle.difficulty]?.label || '基礎'}</span></div>
          <div className="idiom-energy"><Coins aria-hidden="true" /><strong>{context.energy}</strong><span>／20 能量</span></div>
        </div>
        <p className="idiom-play-instruction">先選下方字卡，再點選題目空格。格子右下方有圓點，代表這個字同時連接橫向與直向成語。</p>
        <div className="idiom-solving-layout">
          <div className="idiom-board-wrap"><IdiomBoard puzzle={puzzle} assignments={assignments} selectedCellKey={selectedCellKey} revealedKeys={revealedKeys} checkedWrongKeys={checkedWrongKeys} onCellClick={placeTile} /></div>
          <aside className="idiom-hint-panel">
            <h3><Lightbulb aria-hidden="true" />提示工具</h3>
            <button type="button" disabled={busy || context.energy < 1} onClick={() => revealHint('letter')}><strong>一字提示</strong><span>先選空格，再揭示正確字</span><b>1 能量</b></button>
            <button type="button" disabled={busy || context.energy < 2} onClick={() => revealHint('cross')}><strong>交錯字提示</strong><span>揭示同時連接兩個成語的字</span><b>2 能量</b></button>
            <button type="button" disabled={busy || context.energy < 1} onClick={checkOneWrong}><strong>錯字檢查</strong><span>標記一個放錯的位置，不公布答案</span><b>1 能量</b></button>
            <p>首次通關可得 3 點；未使用提示再加 1 點。同一關重玩不重複獲得。</p>
          </aside>
        </div>
        <section className="idiom-character-bank" aria-labelledby="idiom-bank-title">
          <div><h3 id="idiom-bank-title">可填文字</h3><span>剩餘 {tiles.length - usedTileIds.size} 字</span></div>
          <div className="idiom-bank-tiles">
            {tiles.map((tile) => <button key={tile.id} type="button" disabled={usedTileIds.has(tile.id)} className={selectedTile === tile.id ? 'is-selected' : ''} onClick={() => setSelectedTile((current) => current === tile.id ? null : tile.id)}>{tile.character}</button>)}
          </div>
        </section>
        <div className="idiom-play-actions">
          <button type="button" className="secondary-button" onClick={reset}><RotateCcw aria-hidden="true" />重新開始</button>
          <button type="button" className="primary-button" disabled={busy} onClick={checkAnswer}><Check aria-hidden="true" />完成檢查</button>
        </div>
        {message && <p className="idiom-status-message" role="status">{message}</p>}
      </section>
      {completed && <IdiomLearningPanel puzzle={puzzle} />}
    </>
  )
}

function todayDateValue() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function resizeIdiomEditorGrid(grid, nextWidth, nextHeight) {
  const resized = createIdiomEditorGrid(nextWidth, nextHeight)
  for (let row = 0; row < Math.min(grid.height, resized.height); row += 1) {
    for (let column = 0; column < Math.min(grid.width, resized.width); column += 1) {
      resized.cells[row * resized.width + column] = grid.cells[row * grid.width + column]
    }
  }
  return resized
}

function IdiomEditorBoard({ grid, tab, tool, onChange }) {
  const updateCell = (index, value) => {
    const cells = grid.cells.map((cell, cellIndex) => cellIndex === index ? value : cell)
    onChange({ ...grid, cells })
  }
  const applyTool = (index) => {
    const current = grid.cells[index]
    if (tool === IDIOM_EDITOR_CELL_TYPES.block) {
      updateCell(index, { type: IDIOM_EDITOR_CELL_TYPES.block, value: '' })
      return
    }
    if (tool === IDIOM_EDITOR_CELL_TYPES.empty) {
      updateCell(index, { type: IDIOM_EDITOR_CELL_TYPES.empty, value: current.value || '' })
      return
    }
    const value = window.prompt('請輸入這一格的提示字', current.value || '')
    if (value == null) return
    updateCell(index, { type: IDIOM_EDITOR_CELL_TYPES.given, value: Array.from(value.trim())[0] || '' })
  }
  return (
    <div
      className="idiom-editor-grid"
      style={{ '--idiom-editor-columns': grid.width }}
      role="grid"
      aria-label={tab === 'solution' ? '成語填字圖完整答案' : '成語填字圖題目版面'}
    >
      {grid.cells.map((cell, index) => {
        const row = Math.floor(index / grid.width)
        const column = index % grid.width
        if (tab === 'solution') {
          if (cell.type === IDIOM_EDITOR_CELL_TYPES.block) return <span key={index} className="idiom-editor-cell is-block" aria-label={`第 ${row + 1} 列第 ${column + 1} 格，黑格`} />
          return (
            <input
              key={index}
              className={`idiom-editor-cell is-${cell.type}`}
              value={cell.value}
              maxLength={1}
              aria-label={`第 ${row + 1} 列第 ${column + 1} 格答案`}
              onChange={(event) => updateCell(index, { ...cell, value: Array.from(event.target.value)[0] || '' })}
            />
          )
        }
        return (
          <button
            key={index}
            type="button"
            className={`idiom-editor-cell is-${cell.type}`}
            aria-label={`第 ${row + 1} 列第 ${column + 1} 格，${cell.type === IDIOM_EDITOR_CELL_TYPES.block ? '黑格' : cell.type === IDIOM_EDITOR_CELL_TYPES.given ? `提示字 ${cell.value || '未輸入'}` : '白格'}`}
            onClick={() => applyTool(index)}
          >
            {cell.type === IDIOM_EDITOR_CELL_TYPES.given ? cell.value : ''}
          </button>
        )
      })}
    </div>
  )
}

export function IdiomPuzzleEditor({ catalog, puzzle = null, onSaved, onCancel, onCatalogAdded }) {
  const [title, setTitle] = useState(puzzle?.title || '成語填字圖')
  const [publishedOn, setPublishedOn] = useState(puzzle?.publishedOn || todayDateValue())
  const [difficulty, setDifficulty] = useState(puzzle?.difficulty || 'beginner')
  const [stage, setStage] = useState(puzzle?.stage || 'junior')
  const [selectedIds, setSelectedIds] = useState((puzzle?.idioms || []).map((entry) => entry.id))
  const [editorGrid, setEditorGrid] = useState(() => puzzle ? editorGridFromPuzzle(puzzle) : createIdiomEditorGrid(8, 8))
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState(puzzle?.status || 'draft')
  const [isDailyEligible, setIsDailyEligible] = useState(puzzle?.isDailyEligible !== false)
  const [tab, setTab] = useState('puzzle')
  const [tool, setTool] = useState(IDIOM_EDITOR_CELL_TYPES.block)
  const [saving, setSaving] = useState(false)
  const [messages, setMessages] = useState([])
  const [entryForm, setEntryForm] = useState({ phrase: '', stage: 'junior', definition: '', source: '', sourceUrl: '' })
  const [entrySaving, setEntrySaving] = useState(false)
  const available = catalog.filter((entry) => stage === 'all' || entry.stage === stage || selectedIds.includes(entry.id))
  const selectedEntries = catalog.filter((entry) => selectedIds.includes(entry.id))

  const toggle = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const addEntry = async () => {
    setEntrySaving(true)
    try {
      const entry = await saveIdiomEntry({ ...entryForm, sourceVersion: IDIOM_DICTIONARY_VERSION })
      onCatalogAdded(entry)
      setSelectedIds((current) => [...new Set([...current, entry.id])])
      setEntryForm({ phrase: '', stage: 'junior', definition: '', source: '', sourceUrl: '' })
      setMessages([`已新增「${entry.phrase}」，並加入本題。`])
    } catch (error) {
      setMessages([error.message])
    } finally {
      setEntrySaving(false)
    }
  }
  const validate = () => {
    const result = buildManualIdiomPuzzle({ editorGrid, idioms: selectedEntries, difficulty, stage })
    setMessages(result.errors.length ? result.errors : ['版面與完整答案檢查通過，可以儲存或發布。'])
    setPreview(result.errors.length ? null : result.puzzle)
    return result
  }
  const generate = () => {
    const generated = buildIdiomPuzzle(selectedEntries, difficulty)
    if (generated.board.placements.length < 4) {
      setMessages(['目前選取的成語無法形成至少 4 條交錯，請增加具有共同文字的成語。'])
      return
    }
    setSelectedIds(generated.idioms.map((entry) => entry.id))
    setEditorGrid(editorGridFromPuzzle(generated))
    setPreview(null)
    setMessages([`已自動排入 ${generated.idioms.length} 個成語；可繼續調整黑格、白格與提示字。`])
  }
  const save = async () => {
    const result = validate()
    if (result.errors.length) return
    setSaving(true)
    try {
      await saveIdiomPuzzle({
        ...result.puzzle,
        id: puzzle?.id,
        title,
        publishedOn,
        difficulty,
        stage,
        status,
        sourceVersion: IDIOM_DICTIONARY_VERSION,
        isDailyEligible,
      })
      setMessages([status === 'published' ? '題目已發布。' : '草稿已儲存。'])
      await onSaved()
    } catch (error) {
      setMessages([error.message])
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="idiom-admin-editor" aria-labelledby="idiom-editor-title">
      <div className="idiom-admin-heading">
        <div><p className="eyebrow">ADMIN EDITOR</p><h2 id="idiom-editor-title">{puzzle?.id ? '編輯成語填字圖' : '建立成語填字圖'}</h2></div>
        <button type="button" className="icon-button" onClick={onCancel}><X aria-hidden="true" />關閉</button>
      </div>
      <div className="idiom-admin-fields">
        <label>題目名稱<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>發布日期<input type="date" value={publishedOn} onChange={(event) => setPublishedOn(event.target.value)} /></label>
        <label>適合等級<select value={stage} onChange={(event) => setStage(event.target.value)}>{Object.entries(stageLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>難度<select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>{difficultyOrder.map((value) => <option key={value} value={value}>{IDIOM_DIFFICULTIES[value].label}</option>)}</select></label>
        <label>列數<input type="number" min="4" max="18" value={editorGrid.height} onChange={(event) => setEditorGrid((current) => resizeIdiomEditorGrid(current, current.width, Number(event.target.value)))} /></label>
        <label>欄數<input type="number" min="4" max="18" value={editorGrid.width} onChange={(event) => setEditorGrid((current) => resizeIdiomEditorGrid(current, Number(event.target.value), current.height))} /></label>
        <label>發布狀態<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="draft">草稿</option><option value="published">正式發布</option><option value="archived">封存</option></select></label>
        <label className="idiom-admin-checkbox"><input type="checkbox" checked={isDailyEligible} onChange={(event) => setIsDailyEligible(event.target.checked)} />可列入每日任務</label>
      </div>

      <div className="idiom-admin-section-heading"><div><h3>① 選擇本題成語</h3><p>至少 4 個；完成後學生才會解鎖這些成語的釋義與出處。</p></div><strong>{selectedIds.length} 個</strong></div>
      <div className="idiom-admin-catalog">
        {available.map((entry) => <label key={entry.id}><input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggle(entry.id)} /><span>{entry.phrase}</span><small>{stageLabels[entry.stage]}</small></label>)}
      </div>
      <details className="idiom-entry-editor">
        <summary><Plus aria-hidden="true" />成語不在清單中？新增成語資料</summary>
        <p>請依教育部《成語典》輸入；新增後會自動加入本題。</p>
        <div className="idiom-entry-editor-fields">
          <label>成語<input value={entryForm.phrase} onChange={(event) => setEntryForm((current) => ({ ...current, phrase: event.target.value }))} /></label>
          <label>適合等級<select value={entryForm.stage} onChange={(event) => setEntryForm((current) => ({ ...current, stage: event.target.value }))}><option value="elementary">國小階段</option><option value="junior">國中階段</option><option value="senior">高中延伸</option></select></label>
          <label className="is-wide">釋義<textarea rows="3" value={entryForm.definition} onChange={(event) => setEntryForm((current) => ({ ...current, definition: event.target.value }))} /></label>
          <label className="is-wide">典源或出處<textarea rows="3" value={entryForm.source} onChange={(event) => setEntryForm((current) => ({ ...current, source: event.target.value }))} /></label>
          <label className="is-wide">教育部成語典網址<input type="url" value={entryForm.sourceUrl} onChange={(event) => setEntryForm((current) => ({ ...current, sourceUrl: event.target.value }))} /></label>
        </div>
        <button type="button" disabled={entrySaving} onClick={addEntry}><Save aria-hidden="true" />{entrySaving ? '儲存中……' : '新增並加入本題'}</button>
      </details>
      <button type="button" className="idiom-auto-layout-button" onClick={generate}><Sparkles aria-hidden="true" />依所選成語自動排版</button>

      <div className="idiom-admin-section-heading"><div><h3>② 建立題目與完整答案</h3><p>題目格設定黑格、白格與提示字；完整答案逐格輸入正確文字。</p></div></div>
      <div className="idiom-editor-tabs">
        <button type="button" className={tab === 'puzzle' ? 'is-active' : ''} onClick={() => setTab('puzzle')}>題目格</button>
        <button type="button" className={tab === 'solution' ? 'is-active' : ''} onClick={() => setTab('solution')}>完整答案</button>
      </div>
      {tab === 'puzzle' && (
        <div className="idiom-editor-tools" aria-label="格子工具">
          <button type="button" className={tool === IDIOM_EDITOR_CELL_TYPES.block ? 'is-active' : ''} onClick={() => setTool(IDIOM_EDITOR_CELL_TYPES.block)}>黑格</button>
          <button type="button" className={tool === IDIOM_EDITOR_CELL_TYPES.empty ? 'is-active' : ''} onClick={() => setTool(IDIOM_EDITOR_CELL_TYPES.empty)}>白格</button>
          <button type="button" className={tool === IDIOM_EDITOR_CELL_TYPES.given ? 'is-active' : ''} onClick={() => setTool(IDIOM_EDITOR_CELL_TYPES.given)}>提示字</button>
        </div>
      )}
      <div className="idiom-editor-board-wrap"><IdiomEditorBoard grid={editorGrid} tab={tab} tool={tool} onChange={(grid) => { setEditorGrid(grid); setPreview(null) }} /></div>

      <div className="idiom-admin-actions">
        <button type="button" className="secondary-button" onClick={validate}>檢查並預覽</button>
        <button type="button" className="primary-button" disabled={saving} onClick={save}><Save aria-hidden="true" />{saving ? '儲存中……' : status === 'published' ? '儲存並發布' : '儲存題目'}</button>
      </div>
      {messages.length > 0 && <ul className={`idiom-editor-messages ${preview ? 'is-success' : ''}`} role="status">{messages.map((message) => <li key={message}>{message}</li>)}</ul>}
      {preview && <div className="idiom-editor-preview"><h3>學生端預覽</h3><IdiomBoard puzzle={preview} assignments={{}} revealedKeys={[]} onCellClick={() => {}} /></div>}
    </section>
  )
}

export default function IdiomWordGrid({ guestMode = false }) {
  const [state, setState] = useState({ loading: true, error: '', puzzles: [], catalog: [], energy: 0, studentId: '', canManage: false, remoteEnabled: false })
  const [selectedId, setSelectedId] = useState('')
  const [editing, setEditing] = useState(null)
  const focusTaskId = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('focusTask') || ''
  const returnUrl = guestMode ? './?guest=1' : './'
  const load = async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const data = await loadIdiomWordGridContext({ guestMode })
      setState({ loading: false, error: '', ...data })
      setSelectedId((current) => data.puzzles.some((puzzle) => puzzle.id === current) ? current : data.puzzles[0]?.id || '')
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }))
    }
  }
  useEffect(() => { load() }, [guestMode])
  if (state.loading) return <main className="center-screen"><p>正在載入成語填字圖……</p></main>
  if (state.error) return <main className="center-screen"><CircleAlert aria-hidden="true" /><h1>暫時無法載入成語填字圖</h1><p>{state.error}</p><a className="secondary-button" href={returnUrl}>返回學習系統</a></main>
  const puzzle = state.puzzles.find((item) => item.id === selectedId) || state.puzzles[0]
  return (
    <main className="idiom-word-grid-page">
      <header className="idiom-page-header">
        <a className="idiom-back-link" href={returnUrl}><ArrowLeft aria-hidden="true" />返回學習系統</a>
        <div><p>文字益智遊戲</p><h1>填字圖</h1><span>在交錯文字中認識成語，通關後閱讀教育部釋義與典源。</span></div>
        {state.canManage && !editing && <button type="button" className="idiom-create-button" onClick={() => setEditing({})}><Plus aria-hidden="true" />建立新題</button>}
      </header>
      <PuzzleTabs guestMode={guestMode} />
      {guestMode && <p className="idiom-guest-note">訪客可以自由遊玩；能量與通關紀錄不會跨裝置保存。登入學生後才會記錄每日任務與帳號能量。</p>}
      {editing ? (
        <IdiomPuzzleEditor
          key={editing.id || 'new'}
          catalog={state.catalog}
          puzzle={editing.id ? editing : null}
          onCancel={() => setEditing(null)}
          onSaved={async () => { await load(); setEditing(null) }}
          onCatalogAdded={(entry) => setState((current) => ({
            ...current,
            catalog: [...current.catalog.filter((item) => item.id !== entry.id), entry]
              .sort((left, right) => left.phrase.localeCompare(right.phrase, 'zh-TW')),
          }))}
        />
      ) : (
        <>
          {state.puzzles.length > 0 && (
            <div className="idiom-puzzle-toolbar">
              <label className="idiom-puzzle-picker">選擇關卡<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{state.puzzles.map((item) => <option key={item.id} value={item.id}>{formatDate(item.publishedOn)}・{item.title}・{stageLabels[item.stage] || '自訂'}・{IDIOM_DIFFICULTIES[item.difficulty]?.label}</option>)}</select></label>
              {state.canManage && puzzle && <button type="button" onClick={() => setEditing(puzzle)}><Pencil aria-hidden="true" />編輯這一題</button>}
            </div>
          )}
          {puzzle
            ? <PlayIdiomPuzzle key={puzzle.id} puzzle={puzzle} context={state} focusTaskId={focusTaskId} onEnergyChange={(energy) => setState((current) => ({ ...current, energy }))} />
            : <section className="idiom-empty-state"><h2>尚無已發布題目</h2><p>管理者建立並發布題目後，學生即可開始作答。</p>{state.canManage && <button type="button" className="primary-button" onClick={() => setEditing({})}><Plus aria-hidden="true" />建立第一題</button>}</section>}
        </>
      )}
    </main>
  )
}
