import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Circle,
  Clock3,
  Grid3X3,
  Heart,
  Home,
  RotateCcw,
  Shapes,
  Sparkles,
  Square,
  Star,
  Target,
  Triangle,
  Trophy,
} from 'lucide-react'
import {
  applyShapeSchulteTap,
  bestShapeSchulteRecord,
  createShapeSchulteLayout,
  formatSchulteDuration,
  shapeSchulteConfig,
} from '../lib/schulte.js'
import {
  loadSchulteRecords,
  recordShapeSchulteCompletion,
} from '../services/schulteService.js'
import { resolveFocusTaskId } from '../lib/focusTaskLaunch.js'
import './schulteGame.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

const shapeIcons = {
  circle: Circle,
  triangle: Triangle,
  square: Square,
  star: Star,
  heart: Heart,
}

function learningHubUrl(query = '') {
  const url = new URL(window.location.href)
  url.search = query
  url.hash = ''
  return url.toString()
}

function SchulteNavigation() {
  return (
    <nav className="schulte-floating-nav" aria-label="學習系統導覽">
      <a href={learningHubUrl('?focus=training')}><Grid3X3 aria-hidden="true" />訓練選擇</a>
      <a href={learningHubUrl()}><Home aria-hidden="true" />返回任務頁</a>
      <a href={contactBookUrl}><ArrowLeft aria-hidden="true" />返回聯絡簿</a>
    </nav>
  )
}

export default function SchulteShapeGame() {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const focusTaskId = resolveFocusTaskId(query, { activityPrefix: 'schulte_shape_' })
  const [phase, setPhase] = useState('setup')
  const [layout, setLayout] = useState(null)
  const [selectedTileIds, setSelectedTileIds] = useState([])
  const [errorCount, setErrorCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [records, setRecords] = useState([])
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const startedAtRef = useRef(0)
  const finishingRef = useRef(false)
  const bestRecord = bestShapeSchulteRecord(records)

  useEffect(() => {
    loadSchulteRecords('shape').then(setRecords).catch(() => setRecords([]))
  }, [])

  const startGame = () => {
    setLayout(createShapeSchulteLayout())
    setSelectedTileIds([])
    setErrorCount(0)
    setFeedback('請連同亮起的提示格，找出所有相同圖形。')
    setResult(null)
    finishingRef.current = false
    startedAtRef.current = performance.now()
    setPhase('playing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishGame = async (nextErrorCount = errorCount) => {
    if (finishingRef.current) return
    finishingRef.current = true
    const durationMs = Math.round(performance.now() - startedAtRef.current)
    setSaving(true)
    setPhase('result')
    try {
      const saved = await recordShapeSchulteCompletion({
        focusTaskId,
        durationMs,
        errorCount: nextErrorCount,
      })
      setRecords(saved.records)
      setResult({
        ...saved.record,
        remoteError: saved.remoteError,
        personalBestMs: saved.personalBestMs,
      })
    } catch (error) {
      setResult({
        mode: 'shape',
        size: shapeSchulteConfig.size,
        durationMs,
        errorCount: nextErrorCount,
        averageTapMs: Math.round(durationMs / shapeSchulteConfig.copiesPerShape),
        remoteError: error.message,
      })
    } finally {
      setSaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleTileTap = (tile) => {
    if (phase !== 'playing' || selectedTileIds.includes(tile.id)) return
    const transition = applyShapeSchulteTap({
      targetShapeCode: layout.targetShapeCode,
      tappedShapeCode: tile.shapeCode,
      matchedCount: selectedTileIds.length,
      totalMatches: layout.totalMatches,
    })

    if (!transition.correct) {
      setErrorCount((value) => value + 1)
      setSelectedTileIds([])
      setFeedback(`這不是${layout.targetShapeLabel}，請使用同一個排列重新尋找。`)
      return
    }

    const nextSelectedIds = [...selectedTileIds, tile.id]
    setSelectedTileIds(nextSelectedIds)
    setFeedback(transition.completed
      ? '全部找到了！'
      : `找對了，還有 ${layout.totalMatches - nextSelectedIds.length} 個。`)
    if (transition.completed) finishGame()
  }

  const TargetShapeIcon = layout ? shapeIcons[layout.targetShapeCode] : Shapes

  return (
    <div className="schulte-shell shape-schulte-shell">
      <SchulteNavigation />
      <header className="schulte-header">
        <div className="schulte-brand-icon"><Shapes aria-hidden="true" /></div>
        <div><small>SHAPE SCHULTE</small><strong>圖形舒爾特專注力訓練</strong></div>
      </header>

      <main className="schulte-content">
        {phase === 'setup' && (
          <>
            <section className="schulte-intro-card">
              <div>
                <p>圖形入門版</p>
                <h1>找出所有和提示相同的圖形</h1>
                <span>矩陣中有 5 種圖形，每種各 5 個。系統會亮出 1 個提示格，請連同提示格一起點選全部相同圖形。點錯時排列不變，但已完成的顏色會重設。</span>
              </div>
              <Shapes aria-hidden="true" />
            </section>

            <section className="schulte-size-section shape-schulte-start-card" aria-labelledby="shape-schulte-start-title">
              <div className="schulte-section-heading">
                <div><small>BEGINNER MODE</small><h2 id="shape-schulte-start-title">入門・5×5 圖形矩陣</h2></div>
                {focusTaskId && <span>完成 1 回合即可完成今日任務</span>}
              </div>
              <p>遊戲中不顯示時間，也沒有倒數壓力。完成後才會顯示本次紀錄。</p>
              {bestRecord && <small className="shape-best-preview">個人最佳：{formatSchulteDuration(bestRecord.durationMs)}</small>}
              <button className="shape-start-button" type="button" onClick={startGame}>開始圖形練習</button>
            </section>
          </>
        )}

        {phase === 'playing' && layout && (
          <section className="schulte-play-card shape-schulte-play-card">
            <div className="schulte-play-heading">
              <div><small>入門・5×5</small><h1>找出全部：<b>{layout.targetShapeLabel}</b></h1></div>
              <span><Target aria-hidden="true" />已完成 {selectedTileIds.length}／{layout.totalMatches}</span>
            </div>

            <div className="shape-target-card" aria-label={`本局目標是${layout.targetShapeLabel}`}>
              <TargetShapeIcon aria-hidden="true" />
              <div><small>本局目標</small><strong>{layout.targetShapeLabel}</strong></div>
              <span>亮起的提示格也要點選</span>
            </div>

            <div
              className="shape-schulte-grid"
              aria-label="5 乘 5 圖形舒爾特矩陣"
            >
              {layout.tiles.map((tile) => {
                const ShapeIcon = shapeIcons[tile.shapeCode]
                const isSelected = selectedTileIds.includes(tile.id)
                const isHint = tile.id === layout.hintTileId
                return (
                  <button
                    type="button"
                    className={`${isSelected ? 'is-correct' : ''}${isHint ? ' is-hint' : ''}`}
                    disabled={isSelected}
                    key={tile.id}
                    onClick={() => handleTileTap(tile)}
                    aria-label={`${tile.shapeLabel}${isHint ? '，提示格' : ''}${isSelected ? '，已完成' : ''}`}
                  >
                    <ShapeIcon aria-hidden="true" />
                    {isHint && !isSelected && <span>提示</span>}
                    {isSelected && <Check className="shape-correct-mark" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>

            <div className="schulte-feedback" aria-live="polite">
              <span>{feedback}</span>
              <small>錯誤 {errorCount} 次・計時已隱藏</small>
            </div>
          </section>
        )}

        {phase === 'result' && (
          <section className="schulte-result-card">
            <div className="schulte-result-icon"><Trophy aria-hidden="true" /></div>
            <p>完成圖形舒爾特入門版</p>
            <h1>{saving ? '正在儲存這次練習……' : '觀察得很仔細，做得很好！'}</h1>
            {result && (
              <>
                <div className="schulte-result-grid">
                  <div><Clock3 aria-hidden="true" /><span>完成時間</span><strong>{formatSchulteDuration(result.durationMs)}</strong></div>
                  <div><RotateCcw aria-hidden="true" /><span>點錯次數</span><strong>{result.errorCount} 次</strong></div>
                  <div><Target aria-hidden="true" /><span>平均點按</span><strong>{formatSchulteDuration(result.averageTapMs)}</strong></div>
                  <div><Sparkles aria-hidden="true" /><span>個人最佳</span><strong>{formatSchulteDuration((bestShapeSchulteRecord(records) || result).durationMs)}</strong></div>
                </div>
                {result.remoteError && <p className="schulte-save-note">本機紀錄已保留；每日任務紀錄需待資料庫更新後同步。</p>}
              </>
            )}
            <div className="schulte-result-actions">
              <button type="button" onClick={startGame} disabled={saving}><RotateCcw aria-hidden="true" />重新排列再玩一局</button>
              <button type="button" onClick={() => setPhase('setup')} disabled={saving}>返回說明</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
