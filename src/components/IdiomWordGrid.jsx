import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
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
  Search,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react'
import {
  assessIdiomAssignments,
  assessIdiomProgress,
  applyRevealedIdiomCells,
  assignIdiomTile,
  buildIdiomPuzzle,
  buildManualIdiomPuzzle,
  chooseHintCell,
  chooseAllCrossHintCells,
  createIdiomEditorGrid,
  createIdiomBankTiles,
  chooseIdiomHintCells,
  editorGridFromPuzzle,
  buildIdiomLevelNavigation,
  IDIOM_EDITOR_CELL_TYPES,
  IDIOM_DIFFICULTY_ORDER,
  IDIOM_DIFFICULTIES,
  pickPreferredIdiomLevel,
} from '../lib/idiomWordGrid.js'
import { searchIdiomDictionary, speakIdiom } from '../lib/idiomDictionary.js'
import { buildIdiomWordGridProgress } from '../lib/activityProgress.js'
import {
  completeIdiomPuzzle,
  loadIdiomWordGridContext,
  saveIdiomEntry,
  saveIdiomPuzzle,
  saveIdiomReviews,
  spendIdiomHint,
} from '../services/idiomWordGridService.js'
import { loadIdiomDictionary, loadIdiomDictionaryAppendix } from '../services/idiomDictionaryService.js'
import { trackLearningActivityAttempt } from '../services/learningProgressService.js'
import {
  IDIOM_DICTIONARY_ATTRIBUTION,
  IDIOM_DICTIONARY_VERSION,
} from '../data/idiomWordGridStarter.js'
import './idiomWordGrid.css'

const difficultyOrder = IDIOM_DIFFICULTY_ORDER
const stageLabels = {
  elementary: '國小階段',
  junior: '國中階段',
  senior: '高中延伸',
  all: '跨階段／自訂',
}

const chineseTextInputProps = {
  lang: 'zh-Hant',
  inputMode: 'text',
  autoCapitalize: 'off',
  autoCorrect: 'off',
  spellCheck: false,
}

const idiomFeedbackColors = ['#a9dfca', '#b7d5f5', '#f3d47f', '#ccb5ea', '#a6dfe5', '#f3b995', '#cddc8c', '#efb2d6']

function idiomFeedbackBackground(feedback = []) {
  const colors = feedback.map((item) => (
    item.status === 'incorrect' ? '#ffd2cf' : idiomFeedbackColors[item.colorIndex % idiomFeedbackColors.length]
  ))
  const unique = [...new Set(colors)]
  if (unique.length === 0) return undefined
  if (unique.length === 1) return unique[0]
  const step = 100 / unique.length
  const stops = unique.flatMap((color, index) => [`${color} ${index * step}%`, `${color} ${(index + 1) * step}%`])
  return `linear-gradient(135deg, ${stops.join(', ')})`
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
      <a href={`?puzzle=word-grid&mode=news${guest}`}>新聞縱橫填字</a>
      <a className="is-active" href={`?puzzle=word-grid&mode=idiom${guest}`}>成語填字圖</a>
    </nav>
  )
}

export function IdiomBoard({ puzzle, assignments, selectedCellKey, revealedKeys, feedbackByCell = {}, arrivingCellKey = '', onCellClick, boardRef = null }) {
  const tiles = useMemo(() => createIdiomBankTiles(puzzle), [puzzle])
  const given = new Set(puzzle.givenCellKeys || [])
  const revealed = new Set(revealedKeys || [])
  const cellMap = new Map((puzzle.board?.cells || []).map((cell) => [cell.key, cell]))
  return (
    <div
      ref={boardRef}
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
        const feedback = feedbackByCell[key] || []
        const feedbackStatus = feedback.some((item) => item.status === 'incorrect')
          ? 'incorrect'
          : feedback.length ? 'correct' : ''
        const feedbackBackground = idiomFeedbackBackground(feedback)
        return (
          <button
            key={key}
            type="button"
            role="gridcell"
            className={`idiom-grid-cell ${fixed ? 'is-given' : ''} ${revealed.has(key) ? 'is-hint' : ''} ${feedbackStatus ? `is-idiom-${feedbackStatus}` : ''} ${cell.isIntersection ? 'is-intersection' : ''} ${selectedCellKey === key ? 'is-selected-cell' : ''} ${arrivingCellKey === key ? 'is-tile-arriving' : ''}`}
            disabled={fixed}
            data-cell-key={key}
            data-idiom-feedback={feedbackStatus || undefined}
            style={feedbackBackground ? { '--idiom-feedback-background': feedbackBackground } : undefined}
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

export function IdiomLearningPanel({
  puzzle,
  reviewEntryIds = [],
  canReview = false,
  onToggleReview = async () => {},
  compact = false,
  title = '本關成語學習',
}) {
  const [selectedId, setSelectedId] = useState(puzzle.idioms[0]?.id || '')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  useEffect(() => setSelectedId(puzzle.idioms[0]?.id || ''), [puzzle.id])
  const entry = puzzle.idioms.find((idiom) => idiom.id === selectedId) || puzzle.idioms[0]
  const isReviewed = Boolean(entry && reviewEntryIds.includes(entry.id))
  const toggleReview = async () => {
    if (!entry || !canReview) return
    setReviewBusy(true)
    try {
      await onToggleReview([entry.id], !isReviewed)
      setReviewMessage(isReviewed ? `已將「${entry.phrase}」移出複習清單。` : `已將「${entry.phrase}」加入複習清單。`)
    } catch (error) {
      setReviewMessage(error.message)
    } finally {
      setReviewBusy(false)
    }
  }
  return (
    <section className={`idiom-learning-panel ${compact ? 'is-compact' : ''}`} aria-labelledby="idiom-learning-title">
      <div className="idiom-learning-heading">
        <div><p className="eyebrow">IDIOM REVIEW</p><h2 id="idiom-learning-title">{title}</h2></div>
        <span><BookOpen aria-hidden="true" />點選成語查看解釋</span>
      </div>
      <div className="idiom-chip-list" role="list">
        {puzzle.idioms.map((idiom) => (
          <button key={idiom.id} type="button" className={idiom.id === entry?.id ? 'is-active' : ''} onClick={() => setSelectedId(idiom.id)}>{idiom.phrase}</button>
        ))}
      </div>
      {entry && (
        <article className="idiom-entry-card">
          <div className="idiom-entry-copy">
            <div className="idiom-entry-title-row">
              <div><h3>{entry.phrase}</h3>{entry.zhuyin && <p>{entry.zhuyin}</p>}</div>
              <div className="idiom-entry-title-actions">
                <button type="button" className="idiom-speech-button" onClick={() => speakIdiom(entry.phrase)}><Volume2 aria-hidden="true" />播放發音</button>
                {canReview && <button type="button" className={`idiom-review-toggle ${isReviewed ? 'is-reviewed' : ''}`} disabled={reviewBusy} onClick={toggleReview}>{isReviewed ? '已加入複習' : '加入複習'}</button>}
              </div>
            </div>
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
      {reviewMessage && <p className="idiom-review-message" role="status">{reviewMessage}</p>}
      <footer className="idiom-attribution">
        <strong>資料來源</strong>
        <span>{IDIOM_DICTIONARY_ATTRIBUTION}</span>
        <span>資料版本：{puzzle.sourceVersion || IDIOM_DICTIONARY_VERSION}；內容依原授權資料呈現，不改寫釋義與典源。</span>
        <a href="idiom-dictionary-license.txt" target="_blank" rel="noreferrer">查看授權說明 <ExternalLink aria-hidden="true" /></a>
      </footer>
    </section>
  )
}

export function IdiomCompletionDialog({
  puzzle,
  levelLabel,
  nextLevelLabel = '',
  reviewEntryIds = [],
  canReview = false,
  onToggleReview = async () => {},
  onClose,
  onNextPuzzle = null,
}) {
  return (
    <div className="idiom-dialog-backdrop" role="presentation">
      <section className="idiom-completion-dialog" role="dialog" aria-modal="true" aria-labelledby="idiom-completion-title">
        <header>
          <div><p>通關完成</p><h2 id="idiom-completion-title">{levelLabel || '本關'}全部答對</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="關閉通關視窗"><X aria-hidden="true" /></button>
        </header>
        <IdiomLearningPanel
          puzzle={puzzle}
          reviewEntryIds={reviewEntryIds}
          canReview={canReview}
          onToggleReview={onToggleReview}
          compact
        />
        <footer>
          <button type="button" className="secondary-button" onClick={onClose}>留在本關</button>
          {onNextPuzzle
            ? <button type="button" className="primary-button" onClick={() => { onClose(); onNextPuzzle() }}>進入下一關：{nextLevelLabel}<ArrowRight aria-hidden="true" /></button>
            : <strong>這是目前這個難度最後一關，請靜待更新。</strong>}
        </footer>
      </section>
    </div>
  )
}

function IdiomReviewDialog({ entries, reviewEntryIds, onToggleReview, onClose }) {
  const puzzle = useMemo(() => ({
    id: 'student-idiom-review-library',
    idioms: entries,
    sourceVersion: IDIOM_DICTIONARY_VERSION,
  }), [entries])
  return (
    <div className="idiom-dialog-backdrop" role="presentation">
      <section className="idiom-review-dialog" role="dialog" aria-modal="true" aria-labelledby="idiom-review-dialog-title">
        <header>
          <div><p>MY REVIEW LIST</p><h2 id="idiom-review-dialog-title">我的成語複習</h2></div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="關閉複習清單"><X aria-hidden="true" /></button>
        </header>
        {entries.length > 0
          ? <IdiomLearningPanel puzzle={puzzle} reviewEntryIds={reviewEntryIds} canReview onToggleReview={onToggleReview} compact title="點選成語複習" />
          : <div className="idiom-review-empty"><BookOpen aria-hidden="true" /><p>目前還沒有收錄成語。答題錯誤或覺得不熟時，可以加入複習清單。</p></div>}
      </section>
    </div>
  )
}

export function buildIdiomCompletionProgress({ puzzle, focusTaskId = '', hintUses = 0 }) {
  const givenKeys = new Set(puzzle?.givenCellKeys || [])
  const answerCellCount = (puzzle?.board?.cells || []).filter((cell) => !givenKeys.has(cell.key)).length
  return buildIdiomWordGridProgress({
    puzzle, focusTaskId, answerCellCount, hintsUsed: hintUses,
  })
}

export function PlayIdiomPuzzle({
  puzzle,
  context,
  focusTaskId,
  levelLabel,
  nextLevelLabel = '',
  reviewEntryIds = [],
  onToggleReview = async () => {},
  onEnergyChange,
  onPuzzleCompleted = () => {},
  onNextPuzzle = null,
}) {
  const initial = useMemo(() => restoreProgress(context.studentId, puzzle.id), [context.studentId, puzzle.id])
  const savedHintUses = Number(context.hintUseCounts?.[puzzle.id] || 0)
  const [assignments, setAssignments] = useState(() => applyRevealedIdiomCells(puzzle, initial.assignments || {}, initial.revealedKeys || []))
  const [revealedKeys, setRevealedKeys] = useState(initial.revealedKeys || [])
  const [hintUses, setHintUses] = useState(Math.max(Number(initial.hintUses || initial.revealedKeys?.length || 0), savedHintUses))
  const [selectedTile, setSelectedTile] = useState(null)
  const [selectedCellKey, setSelectedCellKey] = useState('')
  const [message, setMessage] = useState('')
  const [completed, setCompleted] = useState(Boolean(initial.completed || context.completedPuzzleIds?.includes(puzzle.id)))
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [arrivingCellKey, setArrivingCellKey] = useState('')
  const [tileFlight, setTileFlight] = useState(null)
  const [busy, setBusy] = useState(false)
  const boardRef = useRef(null)
  const animationTimerRef = useRef(null)
  const tiles = useMemo(() => createIdiomBankTiles(puzzle), [puzzle])
  const usedTileIds = new Set(Object.values(assignments))
  const idiomProgress = useMemo(
    () => assessIdiomProgress(puzzle, assignments, revealedKeys),
    [assignments, puzzle, revealedKeys],
  )
  const hintLimitReached = hintUses >= 2

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(progressKey(context.studentId, puzzle.id), JSON.stringify({ assignments, revealedKeys, hintUses, completed }))
  }, [assignments, completed, context.studentId, hintUses, puzzle.id, revealedKeys])

  useEffect(() => () => {
    if (animationTimerRef.current) window.clearTimeout(animationTimerRef.current)
  }, [])

  const reset = () => {
    setAssignments({})
    setRevealedKeys([])
    setHintUses(savedHintUses)
    setSelectedTile(null)
    setSelectedCellKey('')
    setCompleted(false)
    setShowCompletionDialog(false)
    setMessage('已重新開始；可先選方格再選文字，也可先選文字再點方格。')
  }

  const assignTileToCell = (cellKey, tileId) => {
    setAssignments((current) => assignIdiomTile(current, cellKey, tileId))
    setSelectedTile(null)
    setSelectedCellKey('')
    setArrivingCellKey(cellKey)
    if (animationTimerRef.current) window.clearTimeout(animationTimerRef.current)
    animationTimerRef.current = window.setTimeout(() => {
      setArrivingCellKey('')
      setTileFlight(null)
    }, 500)
  }

  const placeTile = (cellKey) => {
    const wasSelected = selectedCellKey === cellKey
    setSelectedCellKey(cellKey)
    if (selectedTile != null) {
      assignTileToCell(cellKey, selectedTile)
      return
    }
    if (wasSelected && Number.isInteger(assignments[cellKey])) {
      setAssignments((current) => {
        const next = { ...current }
        delete next[cellKey]
        return next
      })
      setSelectedCellKey('')
    }
  }

  const chooseTile = (tile, event) => {
    if (!selectedCellKey) {
      setSelectedTile((current) => current === tile.id ? null : tile.id)
      return
    }
    const target = boardRef.current?.querySelector(`[data-cell-key="${selectedCellKey}"]`)
    if (target && event?.currentTarget) {
      const sourceRect = event.currentTarget.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      setTileFlight({
        token: `${Date.now()}-${tile.id}`,
        character: tile.character,
        left: sourceRect.left + sourceRect.width / 2,
        top: sourceRect.top + sourceRect.height / 2,
        x: targetRect.left + targetRect.width / 2 - sourceRect.left - sourceRect.width / 2,
        y: targetRect.top + targetRect.height / 2 - sourceRect.top - sourceRect.height / 2,
      })
    }
    assignTileToCell(selectedCellKey, tile.id)
  }

  const revealHint = async (kind) => {
    if (hintLimitReached) {
      setMessage('本關最多使用 2 次提示；目前已達上限。')
      return
    }
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
      onEnergyChange(nextEnergy, { spent: cost })
      setHintUses((current) => current + 1)
      setRevealedKeys((current) => [...new Set([...current, target.key])])
      setAssignments((current) => applyRevealedIdiomCells(puzzle, current, [target.key]))
      setMessage(kind === 'cross' ? '已揭示一個同時連接兩個成語的交錯字。' : '已揭示所選格的一個字。')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const revealIdiomHint = async () => {
    if (hintLimitReached) {
      setMessage('本關最多使用 2 次提示；目前已達上限。')
      return
    }
    const target = chooseIdiomHintCells(puzzle, assignments, revealedKeys, selectedCellKey)
    if (target.status === 'cell-required') {
      setMessage('請先點選想提示的成語中的任一空格。')
      return
    }
    if (target.status === 'ambiguous') {
      setMessage('這是交錯格，同時屬於兩個尚未完成的成語；請改點該成語的非交錯格。')
      return
    }
    if (target.status === 'already-correct' || target.cellKeys.length === 0) {
      setMessage('所選成語已經正確完成，不需要再使用提示。')
      return
    }
    if (context.energy < 5) {
      setMessage('能量不足，需要 5 點。')
      return
    }
    setBusy(true)
    try {
      let nextEnergy = context.energy - 5
      if (context.remoteEnabled && context.studentId && !puzzle.id.startsWith('starter-')) {
        const saved = await spendIdiomHint({ puzzleId: puzzle.id, kind: 'idiom', cellKey: target.idiomId })
        nextEnergy = saved.energy
      }
      onEnergyChange(nextEnergy, { spent: 5 })
      setHintUses((current) => current + 1)
      setRevealedKeys((current) => [...new Set([...current, ...target.cellKeys])])
      setAssignments((current) => applyRevealedIdiomCells(puzzle, current, target.cellKeys))
      setMessage('已揭示所選的一個完整成語。')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const revealAllCrossHints = async () => {
    if (hintLimitReached) {
      setMessage('本關最多使用 2 次提示；目前已達上限。')
      return
    }
    const targets = chooseAllCrossHintCells(puzzle, revealedKeys)
    if (targets.length === 0) {
      setMessage('本題目前沒有尚未揭示的交錯字。')
      return
    }
    if (context.energy < 10) {
      setMessage('能量不足，需要 10 點。')
      return
    }
    setBusy(true)
    try {
      let nextEnergy = context.energy - 10
      if (context.remoteEnabled && context.studentId && !puzzle.id.startsWith('starter-')) {
        const saved = await spendIdiomHint({ puzzleId: puzzle.id, kind: 'all_cross', cellKey: 'all' })
        nextEnergy = saved.energy
      }
      const targetKeys = targets.map((target) => target.key)
      onEnergyChange(nextEnergy, { spent: 10 })
      setHintUses((current) => current + 1)
      setRevealedKeys((current) => [...new Set([...current, ...targetKeys])])
      setAssignments((current) => applyRevealedIdiomCells(puzzle, current, targetKeys))
      setMessage(`已揭示全部 ${targets.length} 個交錯字。`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  const addWrongIdiomsToReview = async (wrongCellKeys = []) => {
    if (!context.studentId || puzzle.id.startsWith('starter-')) return 0
    const wrongKeys = new Set(wrongCellKeys)
    const entryIds = [...new Set((puzzle.board?.cells || [])
      .filter((cell) => wrongKeys.has(cell.key))
      .flatMap((cell) => cell.idiomIds || []))]
    if (entryIds.length === 0) return 0
    await onToggleReview(entryIds, true)
    return entryIds.length
  }

  const checkAnswer = async () => {
    const result = assessIdiomAssignments(puzzle, assignments)
    if (result.status === 'incomplete') {
      setMessage('還有空格尚未填寫。')
      return
    }
    if (!result.correct) {
      try {
        const reviewCount = await addWrongIdiomsToReview(result.wrongCellKeys)
        setMessage(`還有文字位置不正確；系統不會直接公布答案，可以繼續調整或使用提示。${reviewCount ? `相關的 ${reviewCount} 個成語已加入複習清單。` : ''}`)
      } catch (error) {
        setMessage(`還有文字位置不正確；可繼續調整。${error.message}`)
      }
      return
    }
    const wasCompleted = completed
    if (!context.studentId || puzzle.id.startsWith('starter-')) {
      setCompleted(true)
      setShowCompletionDialog(true)
      onPuzzleCompleted(puzzle.id)
      setMessage('全部正確，已解鎖本關成語的釋義與出處。')
      if (!wasCompleted) {
        const earned = hintUses ? 3 : 4
        onEnergyChange(context.energy + earned, { earned })
      }
      return
    }
    setBusy(true)
    try {
      const saved = await completeIdiomPuzzle({ puzzleId: puzzle.id, hintsUsed: hintUses, focusTaskId })
      await trackLearningActivityAttempt(buildIdiomCompletionProgress({ puzzle, focusTaskId, hintUses }))
      setCompleted(true)
      setShowCompletionDialog(true)
      onPuzzleCompleted(puzzle.id)
      onEnergyChange(saved.energy, { earned: saved.energyEarned })
      setMessage(`全部正確，已解鎖成語學習。${saved.energyEarned ? `本關獲得 ${saved.energyEarned} 點能量。` : '本關已領取過能量。'}${saved.taskCompleted ? '每日任務也已完成。' : ''}`)
    } catch (error) {
      setCompleted(true)
      setShowCompletionDialog(true)
      onPuzzleCompleted(puzzle.id)
      setMessage(`${error.message}；本機仍保留本次通關。`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="idiom-play-card">
        <div className="idiom-play-heading">
          <div><p className="eyebrow">IDIOM CROSSWORD</p><h2>{puzzle.title}</h2><span>{levelLabel || IDIOM_DIFFICULTIES[puzzle.difficulty]?.label || '基礎'}・{stageLabels[puzzle.stage] || '自訂'}</span></div>
          <div className="idiom-energy"><Coins aria-hidden="true" /><strong>{context.energy}</strong><span>目前能量</span>{context.studentId && <small>累計獲得 {context.energyEarnedTotal || 0}・已使用 {context.energySpentTotal || 0}</small>}</div>
        </div>
        <p className="idiom-play-instruction">先點選題目空格，再選下方文字即可直接填入；也可先選文字再點方格。再次點選同一個已填方格可取回文字；右下圓點代表交錯字。</p>
        <div className="idiom-solving-layout">
          <div className="idiom-board-wrap"><IdiomBoard puzzle={puzzle} assignments={assignments} selectedCellKey={selectedCellKey} revealedKeys={revealedKeys} feedbackByCell={idiomProgress.cellFeedback} arrivingCellKey={arrivingCellKey} onCellClick={placeTile} boardRef={boardRef} /></div>
          <aside className="idiom-hint-panel">
            <h3><Lightbulb aria-hidden="true" />提示工具</h3>
            <button type="button" disabled={busy || hintLimitReached || context.energy < 1} onClick={() => revealHint('letter')}><strong>一字提示</strong><span>先選空格，再揭示正確字</span><b>1 能量</b></button>
            <button type="button" disabled={busy || hintLimitReached || context.energy < 2} onClick={() => revealHint('cross')}><strong>交錯字提示</strong><span>揭示同時連接兩個成語的字</span><b>2 能量</b></button>
            <button type="button" disabled={busy || hintLimitReached || context.energy < 5} onClick={revealIdiomHint}><strong>完整成語提示</strong><span>先選該成語的非交錯格，再揭示整句</span><b>5 能量</b></button>
            {['advanced', 'challenge'].includes(puzzle.difficulty) && <button type="button" disabled={busy || hintLimitReached || context.energy < 10} onClick={revealAllCrossHints}><strong>所有交錯字提示</strong><span>一次揭示本題所有交錯位置</span><b>10 能量</b></button>}
            <p>本關提示已使用 {hintUses}／2 次。首次通關可得 3 點；未使用提示再加 1 點。同一關重玩不重複獲得。</p>
          </aside>
        </div>
        <section className="idiom-character-bank" aria-labelledby="idiom-bank-title">
          <div><h3 id="idiom-bank-title">可填文字</h3><span>剩餘 {tiles.length - usedTileIds.size} 字</span></div>
          <div className="idiom-bank-tiles">
            {tiles.filter((tile) => !usedTileIds.has(tile.id)).map((tile) => <button key={tile.id} type="button" data-tile-id={tile.id} className={selectedTile === tile.id ? 'is-selected' : ''} onClick={(event) => chooseTile(tile, event)}>{tile.character}</button>)}
            {usedTileIds.size === tiles.length && <p className="idiom-bank-empty">所有文字都已放入題目。</p>}
          </div>
        </section>
        <div className="idiom-play-actions">
          <button type="button" className="secondary-button" onClick={reset}><RotateCcw aria-hidden="true" />{completed ? '重新挑戰本關' : '重新開始'}</button>
          {completed && <button type="button" className="secondary-button" onClick={() => setShowCompletionDialog(true)}><BookOpen aria-hidden="true" />查看本關成語解說</button>}
          <button type="button" className="primary-button" disabled={busy} onClick={checkAnswer}><Check aria-hidden="true" />完成檢查</button>
        </div>
        {message && <p className="idiom-status-message" role="status">{message}</p>}
      </section>
      {tileFlight && <span key={tileFlight.token} className="idiom-tile-flight" style={{ left: tileFlight.left, top: tileFlight.top, '--flight-x': `${tileFlight.x}px`, '--flight-y': `${tileFlight.y}px` }} aria-hidden="true">{tileFlight.character}</span>}
      {showCompletionDialog && <IdiomCompletionDialog puzzle={puzzle} levelLabel={levelLabel} nextLevelLabel={nextLevelLabel} reviewEntryIds={reviewEntryIds} canReview={Boolean(context.studentId)} onToggleReview={onToggleReview} onClose={() => setShowCompletionDialog(false)} onNextPuzzle={onNextPuzzle} />}
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
  const [editingGivenIndex, setEditingGivenIndex] = useState(-1)
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
    updateCell(index, { type: IDIOM_EDITOR_CELL_TYPES.given, value: current.value || '' })
    setEditingGivenIndex(index)
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
              {...chineseTextInputProps}
              aria-label={`第 ${row + 1} 列第 ${column + 1} 格答案`}
              onChange={(event) => updateCell(index, { ...cell, value: Array.from(event.target.value)[0] || '' })}
            />
          )
        }
        if (tool === IDIOM_EDITOR_CELL_TYPES.given && cell.type === IDIOM_EDITOR_CELL_TYPES.given) {
          return (
            <input
              key={index}
              className="idiom-editor-cell is-given"
              value={cell.value}
              maxLength={1}
              {...chineseTextInputProps}
              autoFocus={editingGivenIndex === index}
              aria-label={`第 ${row + 1} 列第 ${column + 1} 格提示字`}
              onFocus={() => setEditingGivenIndex(index)}
              onBlur={() => setEditingGivenIndex(-1)}
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
  const [acceptedAnswerDrafts, setAcceptedAnswerDrafts] = useState(() => Object.fromEntries(
    Object.entries(puzzle?.acceptedAnswers || {}).map(([idiomId, answers]) => [idiomId, (answers || []).join('、')]),
  ))
  const [editorGrid, setEditorGrid] = useState(() => puzzle ? editorGridFromPuzzle(puzzle) : createIdiomEditorGrid(8, 8))
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState(puzzle?.status || 'draft')
  const [isDailyEligible, setIsDailyEligible] = useState(puzzle?.isDailyEligible !== false)
  const [tab, setTab] = useState('puzzle')
  const [tool, setTool] = useState(IDIOM_EDITOR_CELL_TYPES.block)
  const [saving, setSaving] = useState(false)
  const [messages, setMessages] = useState([])
  const emptyEntryForm = { phrase: '', stage: 'junior', definition: '', source: '', story: '', sourceUrl: '', illustrationUrl: '', sourceEntryId: null, zhuyin: '', pinyin: '' }
  const [entryForm, setEntryForm] = useState(emptyEntryForm)
  const [entrySaving, setEntrySaving] = useState(false)
  const [entryEditorOpen, setEntryEditorOpen] = useState(false)
  const entryEditorRef = useRef(null)
  const [dictionaryQuery, setDictionaryQuery] = useState('')
  const [dictionaryState, setDictionaryState] = useState({
    loading: false,
    loaded: false,
    error: '',
    entries: [],
    appendixLoading: false,
    appendixLoaded: false,
    appendixError: '',
  })
  const available = catalog.filter((entry) => stage === 'all' || entry.stage === stage || selectedIds.includes(entry.id))
  const selectedEntries = catalog.filter((entry) => selectedIds.includes(entry.id))
  const dictionaryResults = useMemo(
    () => searchIdiomDictionary(dictionaryState.entries, dictionaryQuery, 12),
    [dictionaryQuery, dictionaryState.entries],
  )
  const normalizedEntryPhrase = Array.from(String(entryForm.phrase || '').replace(/\s/g, '')).join('')
  const existingCatalogEntry = catalog.find((entry) => entry.phrase === normalizedEntryPhrase) || null

  const toggle = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  const ensureDictionary = async () => {
    if (dictionaryState.loaded || dictionaryState.loading) return
    setDictionaryState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const payload = await loadIdiomDictionary()
      setDictionaryState((current) => ({
        ...current,
        loading: false,
        loaded: true,
        error: '',
        entries: [...payload.entries, ...current.entries.filter((entry) => entry.sourceType === '修訂本參考資料')],
      }))
    } catch (error) {
      setDictionaryState((current) => ({ ...current, loading: false, loaded: false, error: error.message }))
    }
  }
  const ensureDictionaryAppendix = async () => {
    if (dictionaryState.appendixLoaded || dictionaryState.appendixLoading) return
    setDictionaryState((current) => ({ ...current, appendixLoading: true, appendixError: '' }))
    try {
      const payload = await loadIdiomDictionaryAppendix()
      setDictionaryState((current) => ({
        ...current,
        appendixLoading: false,
        appendixLoaded: true,
        appendixError: '',
        entries: [...current.entries.filter((entry) => entry.sourceType !== '修訂本參考資料'), ...payload.entries],
      }))
    } catch (error) {
      setDictionaryState((current) => ({ ...current, appendixLoading: false, appendixLoaded: false, appendixError: error.message }))
    }
  }
  const updateDictionaryQuery = (value) => {
    setDictionaryQuery(value)
    ensureDictionary()
    if (value.replace(/\s/g, '')) ensureDictionaryAppendix()
  }
  const chooseDictionaryEntry = (entry) => {
    const existingEntry = catalog.find((item) => item.phrase === entry.phrase)
    setEntryForm((current) => ({
      ...current,
      phrase: entry.phrase,
      stage: existingEntry?.stage || current.stage,
      definition: entry.definition,
      source: entry.source,
      story: entry.story,
      sourceUrl: entry.sourceUrl,
      sourceEntryId: entry.sourceEntryId,
      zhuyin: entry.zhuyin,
      pinyin: entry.pinyin,
    }))
    setDictionaryQuery(entry.phrase)
    setEntryEditorOpen(true)
    setMessages([existingEntry
      ? `題庫已有「${entry.phrase}」。已帶入較新的官方資料；儲存後會更新既有資料並加入本題。`
      : `已帶入教育部《成語典》「${entry.phrase}」的官方資料；請選擇適合等級後加入本題。`])
  }
  const startManualEntry = () => {
    const phrase = Array.from(String(dictionaryQuery || '').replace(/\s/g, '')).join('')
    setEntryForm((current) => ({ ...emptyEntryForm, phrase, stage: current.stage }))
    setMessages([`請自行補充「${phrase}」的釋義與出處；日後若成語典收錄更完整資料，可再搜尋並更新。`])
    setEntryEditorOpen(true)
  }
  const clearEntryForm = () => {
    setEntryForm({ ...emptyEntryForm, stage: entryForm.stage })
    setDictionaryQuery('')
  }
  const editCatalogEntry = (entry) => {
    setEntryForm({
      phrase: entry.phrase || '',
      stage: entry.stage || 'junior',
      definition: entry.definition || '',
      source: entry.source || '',
      story: entry.story || '',
      sourceUrl: entry.sourceUrl || '',
      illustrationUrl: entry.illustrationUrl || '',
      sourceEntryId: entry.sourceEntryId || null,
      zhuyin: entry.zhuyin || '',
      pinyin: entry.pinyin || '',
    })
    setDictionaryQuery(entry.phrase || '')
    setEntryEditorOpen(true)
    setMessages([entry.sourceEntryId
      ? `正在編輯「${entry.phrase}」；教育部官方欄位維持唯讀，可調整適合等級與教師圖片。`
      : `正在編輯老師自行建立的「${entry.phrase}」。`])
    window.requestAnimationFrame(() => entryEditorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const addEntry = async () => {
    setEntrySaving(true)
    try {
      const entry = await saveIdiomEntry({ ...entryForm, sourceVersion: IDIOM_DICTIONARY_VERSION })
      onCatalogAdded(entry)
      setSelectedIds((current) => [...new Set([...current, entry.id])])
      setEntryForm(emptyEntryForm)
      setDictionaryQuery('')
      setMessages([entry.wasUpdated
        ? `已更新「${entry.phrase}」的既有資料，並加入本題。`
        : `已新增「${entry.phrase}」，並加入本題。`])
    } catch (error) {
      setMessages([error.message])
    } finally {
      setEntrySaving(false)
    }
  }
  const validate = () => {
    const result = buildManualIdiomPuzzle({
      editorGrid,
      idioms: selectedEntries,
      acceptedAnswers: acceptedAnswerDrafts,
      difficulty,
      stage,
    })
    setMessages(result.errors.length ? result.errors : ['版面與完整答案檢查通過，可以儲存或發布。'])
    setPreview(result.errors.length ? null : result.puzzle)
    return result
  }
  const generate = () => {
    if (selectedEntries.length < 4) {
      setMessages(['請先勾選至少 4 個成語，再由系統尋找共同文字進行交錯排版。'])
      return
    }
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
        <label>題目名稱<input {...chineseTextInputProps} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
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
        {available.map((entry) => <div className="idiom-admin-catalog-item" key={entry.id}><label><input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggle(entry.id)} /><span>{entry.phrase}</span><small>{stageLabels[entry.stage]}</small></label><button type="button" onClick={() => editCatalogEntry(entry)}><Pencil aria-hidden="true" />編輯</button></div>)}
      </div>
      <details ref={entryEditorRef} className="idiom-entry-editor" open={entryEditorOpen} onToggle={(event) => setEntryEditorOpen(event.currentTarget.open)}>
        <summary><Plus aria-hidden="true" />搜尋、新增或編輯成語資料</summary>
        <p>輸入成語或部分文字，點選結果後會自動帶入官方釋義、典源、典故、注音及網址。</p>
        <div className="idiom-dictionary-search">
          <label><span><Search aria-hidden="true" />搜尋成語</span><input {...chineseTextInputProps} value={dictionaryQuery} placeholder="例如：一字千金" onFocus={ensureDictionary} onChange={(event) => updateDictionaryQuery(event.target.value)} /></label>
          {dictionaryState.loading && <p role="status">正在載入教育部成語資料……</p>}
          {dictionaryState.appendixLoading && <p role="status">正在補查修訂本參考資料……</p>}
          {dictionaryState.error && <p className="is-error" role="alert">{dictionaryState.error}</p>}
          {dictionaryState.appendixError && <p className="is-error" role="alert">修訂本參考資料載入失敗：{dictionaryState.appendixError}</p>}
          {dictionaryState.loaded && dictionaryState.appendixLoaded && dictionaryQuery.trim() && dictionaryResults.length === 0 && (
            <div className="idiom-dictionary-not-found">
              <p>正文與修訂本參考資料都找不到相符成語，可由老師自行建立；日後找到更完整資料時仍可更新。</p>
              <button type="button" onClick={startManualEntry}>以「{dictionaryQuery.replace(/\s/g, '')}」建立自訂資料</button>
            </div>
          )}
          {dictionaryResults.length > 0 && (
            <ul className="idiom-dictionary-results">
              {dictionaryResults.map((entry) => (
                <li key={entry.sourceEntryId || entry.phrase}>
                  <button type="button" className="idiom-dictionary-pick" onClick={() => chooseDictionaryEntry(entry)}>
                    <strong>{entry.phrase}</strong><span>{entry.zhuyin || '未收錄注音'}</span><small>{entry.definition}</small><em>{entry.sourceType || '教育部成語典正文'}</em>
                  </button>
                  <button type="button" className="idiom-dictionary-speak" onClick={() => speakIdiom(entry.phrase)} aria-label={`播放${entry.phrase}發音`}><Volume2 aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          )}
          <p className="idiom-speech-note">發音使用本裝置的繁體中文語音；破音字仍請依畫面上的教育部注音核對。</p>
        </div>
        {existingCatalogEntry && (
          <p className="idiom-entry-update-note" role="status">
            題庫已有「{existingCatalogEntry.phrase}」。本次儲存會以新資料的非空欄位更新原資料，並保留既有圖片與新資料未提供的內容。
          </p>
        )}
        <div className="idiom-entry-editor-fields">
          <label>成語<input {...chineseTextInputProps} readOnly={Boolean(entryForm.sourceEntryId)} value={entryForm.phrase} onChange={(event) => setEntryForm((current) => ({ ...current, phrase: event.target.value }))} /></label>
          <label>適合等級<select value={entryForm.stage} onChange={(event) => setEntryForm((current) => ({ ...current, stage: event.target.value }))}><option value="elementary">國小階段</option><option value="junior">國中階段</option><option value="senior">高中延伸</option></select></label>
          {entryForm.sourceEntryId && <div className="idiom-official-reading is-wide"><div><strong>教育部注音</strong><span>{entryForm.zhuyin || '未收錄'}</span></div><div><strong>漢語拼音</strong><span>{entryForm.pinyin || '未收錄'}</span></div><button type="button" onClick={() => speakIdiom(entryForm.phrase)}><Volume2 aria-hidden="true" />試聽</button></div>}
          <label className="is-wide">釋義<textarea {...chineseTextInputProps} readOnly={Boolean(entryForm.sourceEntryId)} rows="3" value={entryForm.definition} onChange={(event) => setEntryForm((current) => ({ ...current, definition: event.target.value }))} /></label>
          <label className="is-wide">典源或出處<textarea {...chineseTextInputProps} readOnly={Boolean(entryForm.sourceEntryId)} rows="4" value={entryForm.source} onChange={(event) => setEntryForm((current) => ({ ...current, source: event.target.value }))} /></label>
          <label className="is-wide">完整典故<textarea {...chineseTextInputProps} readOnly={Boolean(entryForm.sourceEntryId)} rows="4" value={entryForm.story} onChange={(event) => setEntryForm((current) => ({ ...current, story: event.target.value }))} /></label>
          <label className="is-wide">教育部成語典網址<input {...chineseTextInputProps} readOnly={Boolean(entryForm.sourceEntryId)} type="text" value={entryForm.sourceUrl} onChange={(event) => setEntryForm((current) => ({ ...current, sourceUrl: event.target.value }))} /></label>
          <label className="is-wide">教師圖片網址（選填）<input {...chineseTextInputProps} type="text" value={entryForm.illustrationUrl} onChange={(event) => setEntryForm((current) => ({ ...current, illustrationUrl: event.target.value }))} /></label>
        </div>
        <div className="idiom-entry-editor-actions">
          {entryForm.sourceEntryId && <button type="button" className="secondary-button" onClick={clearEntryForm}>清除並改為手動輸入</button>}
          <button type="button" disabled={entrySaving} onClick={addEntry}><Save aria-hidden="true" />{entrySaving ? '儲存中……' : existingCatalogEntry ? '更新既有資料並加入本題' : '新增並加入本題'}</button>
        </div>
      </details>
      <button type="button" className="idiom-auto-layout-button" onClick={generate}><Sparkles aria-hidden="true" />依所選成語自動排版</button>
      <p className="idiom-auto-layout-note">先勾選至少 4 個具有共同文字的成語；系統會自動建立交錯版面，仍可在下方手動調整。</p>

      <div className="idiom-admin-section-heading"><div><h3>② 設定可接受的替代答案（選填）</h3><p>只影響本題判分，不會改寫教育部成語資料。</p></div></div>
      <div className="idiom-alternate-answer-editor">
        <p>替代答案須與預設答案字數相同、使用相同文字，且不可改動提示字或交錯字的位置。多個答案可用頓號、逗號或換行分隔。</p>
        {selectedEntries.length === 0 && <p className="is-empty">請先選擇本題成語。</p>}
        {selectedEntries.map((entry) => (
          <label key={entry.id}>
            <span><strong>{entry.phrase}</strong><small>預設答案</small></span>
            <textarea
              {...chineseTextInputProps}
              rows="2"
              value={acceptedAnswerDrafts[entry.id] || ''}
              placeholder="例如：一十一五"
              onChange={(event) => {
                const value = event.target.value
                setAcceptedAnswerDrafts((current) => ({ ...current, [entry.id]: value }))
                setPreview(null)
              }}
            />
          </label>
        ))}
      </div>

      <div className="idiom-admin-section-heading"><div><h3>③ 建立題目與完整答案</h3><p>題目格設定黑格、白格與提示字；完整答案逐格輸入正確文字。</p></div></div>
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
  const [state, setState] = useState({ loading: true, error: '', puzzles: [], catalog: [], energy: 0, energyEarnedTotal: 0, energySpentTotal: 0, hintUseCounts: {}, studentId: '', completedPuzzleIds: [], reviewEntryIds: [], canManage: false, remoteEnabled: false })
  const [selectedId, setSelectedId] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('beginner')
  const [editing, setEditing] = useState(null)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const focusTaskId = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('focusTask') || ''
  const returnUrl = guestMode ? './?guest=1' : './'
  const load = async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const data = await loadIdiomWordGridContext({ guestMode })
      const localCompletedIds = data.puzzles
        .filter((puzzle) => restoreProgress(data.studentId, puzzle.id).completed)
        .map((puzzle) => puzzle.id)
      const completedPuzzleIds = [...new Set([...(data.completedPuzzleIds || []), ...localCompletedIds])]
      const firstPendingDifficulty = difficultyOrder.find((difficulty) => {
        const levels = buildIdiomLevelNavigation(data.puzzles, completedPuzzleIds, difficulty)
        return levels.some((level) => !level.completed)
      })
      const firstAvailableDifficulty = difficultyOrder.find((difficulty) => data.puzzles.some((puzzle) => puzzle.difficulty === difficulty))
      const difficulty = firstPendingDifficulty || firstAvailableDifficulty || 'beginner'
      const preferredLevel = pickPreferredIdiomLevel(buildIdiomLevelNavigation(data.puzzles, completedPuzzleIds, difficulty))
      setState({ loading: false, error: '', ...data, completedPuzzleIds })
      setSelectedDifficulty(difficulty)
      setSelectedId(preferredLevel?.puzzle.id || '')
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }))
    }
  }
  useEffect(() => { load() }, [guestMode])
  if (state.loading) return <main className="center-screen"><p>正在載入成語填字圖……</p></main>
  if (state.error) return <main className="center-screen"><CircleAlert aria-hidden="true" /><h1>暫時無法載入成語填字圖</h1><p>{state.error}</p><a className="secondary-button" href={returnUrl}>返回學習系統</a></main>
  const difficultyLevels = buildIdiomLevelNavigation(state.puzzles, state.completedPuzzleIds, selectedDifficulty)
  const selectedLevel = difficultyLevels.find((level) => level.puzzle.id === selectedId) || pickPreferredIdiomLevel(difficultyLevels)
  const puzzle = selectedLevel?.puzzle || null
  const selectedLevelIndex = difficultyLevels.findIndex((level) => level.puzzle.id === puzzle?.id)
  const nextLevel = selectedLevelIndex >= 0 ? difficultyLevels[selectedLevelIndex + 1] || null : null
  const pendingLevels = difficultyLevels.filter((level) => !level.completed)
  const completedLevels = difficultyLevels.filter((level) => level.completed)
  const reviewEntries = state.catalog.filter((entry) => state.reviewEntryIds?.includes(entry.id))
  const updateReviewEntries = async (entryIds, shouldReview) => {
    const normalizedIds = [...new Set((entryIds || []).map((id) => String(id || '')).filter(Boolean))]
    if (normalizedIds.length === 0) return
    const previousIds = state.reviewEntryIds || []
    const nextIds = shouldReview
      ? [...new Set([...previousIds, ...normalizedIds])]
      : previousIds.filter((id) => !normalizedIds.includes(id))
    setState((current) => ({ ...current, reviewEntryIds: nextIds }))
    try {
      if (state.remoteEnabled && state.studentId) {
        await saveIdiomReviews({ studentId: state.studentId, entryIds: normalizedIds, shouldReview })
      }
    } catch (error) {
      setState((current) => ({ ...current, reviewEntryIds: previousIds }))
      throw error
    }
  }
  const chooseDifficulty = (difficulty) => {
    const levels = buildIdiomLevelNavigation(state.puzzles, state.completedPuzzleIds, difficulty)
    const preferred = pickPreferredIdiomLevel(levels)
    setSelectedDifficulty(difficulty)
    setSelectedId(preferred?.puzzle.id || '')
  }
  return (
    <main className="idiom-word-grid-page">
      <header className="idiom-page-header">
        <a className="idiom-back-link" href={returnUrl}><ArrowLeft aria-hidden="true" />返回學習系統</a>
        <div><p>文字益智遊戲</p><h1>填字圖</h1><span>在交錯文字中認識成語，通關後閱讀教育部釋義與典源。</span></div>
        <div className="idiom-page-actions">
          {state.studentId && !editing && <button type="button" className="idiom-review-button" onClick={() => setShowReviewDialog(true)}><BookOpen aria-hidden="true" />我的成語複習（{reviewEntries.length}）</button>}
          {state.canManage && !editing && <button type="button" className="idiom-create-button" onClick={() => setEditing({})}><Plus aria-hidden="true" />建立新題</button>}
        </div>
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
              <nav className="idiom-difficulty-tabs" aria-label="選擇難度">
                {difficultyOrder.map((difficulty) => {
                  const levels = buildIdiomLevelNavigation(state.puzzles, state.completedPuzzleIds, difficulty)
                  const pendingCount = levels.filter((level) => !level.completed).length
                  return <button key={difficulty} type="button" className={selectedDifficulty === difficulty ? 'is-active' : ''} disabled={levels.length === 0} aria-pressed={selectedDifficulty === difficulty} onClick={() => chooseDifficulty(difficulty)}><strong>{IDIOM_DIFFICULTIES[difficulty].label}</strong><span>{levels.length === 0 ? '尚未開放' : pendingCount > 0 ? `${pendingCount} 關未通關` : '全部通關'}</span></button>
                })}
              </nav>
              {difficultyLevels.length > 0 && (
                <label className="idiom-puzzle-picker">選擇關卡
                  <select value={puzzle?.id || ''} onChange={(event) => setSelectedId(event.target.value)}>
                    {pendingLevels.length > 0 && <optgroup label="尚未通關">{pendingLevels.map((level) => <option key={level.puzzle.id} value={level.puzzle.id}>{level.levelLabel}</option>)}</optgroup>}
                    {completedLevels.length > 0 && <optgroup label="回顧已通關關卡">{completedLevels.map((level) => <option key={level.puzzle.id} value={level.puzzle.id}>{level.levelLabel}・可重答</option>)}</optgroup>}
                  </select>
                </label>
              )}
              {difficultyLevels.length === 0 && <p className="idiom-no-levels">這個難度目前尚未開放關卡。</p>}
              {state.canManage && puzzle && <button type="button" onClick={() => setEditing(puzzle)}><Pencil aria-hidden="true" />編輯這一題</button>}
            </div>
          )}
          {puzzle
            ? <PlayIdiomPuzzle
              key={puzzle.id}
              puzzle={puzzle}
              context={state}
              focusTaskId={focusTaskId}
              levelLabel={selectedLevel?.levelLabel}
              nextLevelLabel={nextLevel?.levelLabel}
              reviewEntryIds={state.reviewEntryIds || []}
              onToggleReview={updateReviewEntries}
              onNextPuzzle={nextLevel ? () => setSelectedId(nextLevel.puzzle.id) : null}
              onEnergyChange={(energy, change = {}) => setState((current) => ({
                ...current,
                energy,
                energyEarnedTotal: Number(current.energyEarnedTotal || 0) + Number(change.earned || 0),
                energySpentTotal: Number(current.energySpentTotal || 0) + Number(change.spent || 0),
                hintUseCounts: change.spent
                  ? { ...current.hintUseCounts, [puzzle.id]: Number(current.hintUseCounts?.[puzzle.id] || 0) + 1 }
                  : current.hintUseCounts,
              }))}
              onPuzzleCompleted={(puzzleId) => setState((current) => ({
                ...current,
                completedPuzzleIds: [...new Set([...(current.completedPuzzleIds || []), puzzleId])],
              }))}
            />
            : <section className="idiom-empty-state"><h2>尚無已發布題目</h2><p>管理者建立並發布題目後，學生即可開始作答。</p>{state.canManage && <button type="button" className="primary-button" onClick={() => setEditing({})}><Plus aria-hidden="true" />建立第一題</button>}</section>}
        </>
      )}
      {showReviewDialog && <IdiomReviewDialog entries={reviewEntries} reviewEntryIds={state.reviewEntryIds || []} onToggleReview={updateReviewEntries} onClose={() => setShowReviewDialog(false)} />}
    </main>
  )
}
