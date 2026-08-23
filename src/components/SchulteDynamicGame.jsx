import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Brain,
  Check,
  Clock3,
  Gauge,
  Grid3X3,
  Home,
  Pause,
  Play,
  RotateCcw,
  Smartphone,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import {
  applySchulteTap,
  bestDynamicSchulteRecord,
  createDynamicSchulteLayout,
  dynamicSchulteLevels,
  formatSchulteDuration,
  normalizeDynamicSchulteCount,
} from '../lib/schulte.js'
import {
  loadSchulteRecords,
  recordDynamicSchulteCompletion,
} from '../services/schulteService.js'
import { resolveFocusTaskId } from '../lib/focusTaskLaunch.js'
import './schulteGame.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

const speedProfiles = {
  gentle: [120, 144, 168],
  steady: [90, 108, 126],
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

function ringPosition(index, total, ringIndex) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  const radii = [16.5, 29, 43]
  return {
    left: `${50 + Math.cos(angle) * radii[ringIndex]}%`,
    top: `${50 + Math.sin(angle) * radii[ringIndex]}%`,
  }
}

export default function SchulteDynamicGame() {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const focusTaskId = resolveFocusTaskId(query, { activityPrefix: 'schulte_dynamic_' })
  const [itemCount, setItemCount] = useState(normalizeDynamicSchulteCount(query.get('count')))
  const [phase, setPhase] = useState('setup')
  const [layout, setLayout] = useState(null)
  const [expectedNumber, setExpectedNumber] = useState(1)
  const [correctNumbers, setCorrectNumbers] = useState([])
  const [errorCount, setErrorCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [records, setRecords] = useState([])
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [speed, setSpeed] = useState('gentle')
  const [paused, setPaused] = useState(false)
  const startedAtRef = useRef(0)
  const finishingRef = useRef(false)
  const selectedInfo = dynamicSchulteLevels[itemCount]
  const selectableLevels = focusTaskId ? [selectedInfo] : Object.values(dynamicSchulteLevels)

  useEffect(() => {
    loadSchulteRecords('dynamic').then(setRecords).catch(() => setRecords([]))
  }, [])

  const startGame = (nextItemCount = itemCount) => {
    const normalizedCount = normalizeDynamicSchulteCount(nextItemCount)
    setItemCount(normalizedCount)
    setLayout(createDynamicSchulteLayout(normalizedCount))
    setExpectedNumber(1)
    setCorrectNumbers([])
    setErrorCount(0)
    setFeedback('請從中心的 1 開始。')
    setResult(null)
    setPaused(false)
    finishingRef.current = false
    startedAtRef.current = performance.now()
    setPhase('playing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishGame = async (nextErrorCount = errorCount) => {
    if (finishingRef.current) return
    finishingRef.current = true
    const durationMs = Math.round(performance.now() - startedAtRef.current)
    setPaused(true)
    setSaving(true)
    setPhase('result')
    try {
      const saved = await recordDynamicSchulteCompletion({
        focusTaskId,
        itemCount,
        durationMs,
        errorCount: nextErrorCount,
      })
      setRecords(saved.records)
      setResult({
        ...saved.record,
        remoteError: saved.remoteError,
        personalBestMs: saved.personalBestMs,
        taskCompleted: saved.taskCompleted,
        recoveredFocusTask: saved.recoveredFocusTask,
      })
    } catch (error) {
      setResult({
        mode: 'dynamic',
        size: itemCount,
        durationMs,
        errorCount: nextErrorCount,
        averageTapMs: Math.round(durationMs / itemCount),
        remoteError: error.message,
      })
    } finally {
      setSaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleTap = (number) => {
    if (phase !== 'playing') return
    const transition = applySchulteTap({
      expectedNumber,
      tappedNumber: number,
      totalNumbers: itemCount,
    })

    if (!transition.correct) {
      setErrorCount((value) => value + 1)
      setExpectedNumber(1)
      setCorrectNumbers([])
      setFeedback(`剛剛需要找 ${expectedNumber}，請從中心的 1 重新開始；排列不變、計時繼續。`)
      return
    }

    setCorrectNumbers((values) => [...values, number])
    setExpectedNumber(transition.nextExpectedNumber)
    setFeedback(transition.completed ? '完成了！' : `很好，接著找 ${transition.nextExpectedNumber}。`)
    if (transition.completed) finishGame()
  }

  const renderNumber = (number) => {
    const isCorrect = correctNumbers.includes(number)
    return (
      <button
        type="button"
        className={isCorrect ? 'is-correct' : ''}
        onClick={() => handleTap(number)}
        aria-label={`數字 ${number}${isCorrect ? '，已完成' : ''}`}
      >
        <span>{isCorrect ? <Check aria-hidden="true" /> : number}</span>
      </button>
    )
  }

  return (
    <div className="schulte-shell dynamic-schulte-shell">
      <SchulteNavigation />
      <header className="schulte-header">
        <div className="schulte-brand-icon"><Brain aria-hidden="true" /></div>
        <div><small>DYNAMIC SCHULTE</small><strong>動態舒爾特專注力訓練</strong></div>
      </header>

      <main className="schulte-content">
        {phase === 'setup' && (
          <>
            <section className="schulte-intro-card">
              <div>
                <p>準備好了再開始</p>
                <h1>依照 1、2、3……由小到大點選</h1>
                <span>中心固定為 1，外側三個圓環會朝同一方向緩慢轉動。遊戲中不顯示時間；點錯會從 1 重來，但排列與計時不會重設。</span>
              </div>
              <Target aria-hidden="true" />
            </section>

            <p className="dynamic-orientation-tip"><Smartphone aria-hidden="true" />手機或平板轉成橫向，更方便使用喔！</p>

            <section className="schulte-size-section" aria-labelledby="dynamic-schulte-level-title">
              <div className="schulte-section-heading">
                <div><small>CHOOSE A LEVEL</small><h2 id="dynamic-schulte-level-title">選擇數字範圍</h2></div>
                {focusTaskId && <span>完成這個指定範圍，即可完成今日任務</span>}
              </div>
              <div className="schulte-size-grid">
                {selectableLevels.map((info) => {
                  const best = bestDynamicSchulteRecord(records, info.itemCount)
                  return (
                    <button type="button" key={info.itemCount} onClick={() => startGame(info.itemCount)}>
                      <span>{info.label}</span>
                      <strong>{info.rangeLabel}</strong>
                      <p>{info.description}</p>
                      <small>{best ? `個人最佳：${formatSchulteDuration(best.durationMs)}` : '尚無完成紀錄'}</small>
                    </button>
                  )
                })}
              </div>
            </section>
          </>
        )}

        {phase === 'playing' && layout && (
          <section className="schulte-play-card dynamic-schulte-play-card">
            <div className="schulte-play-heading">
              <div><small>{selectedInfo.label}・{selectedInfo.rangeLabel}</small><h1>現在請找：<b>{expectedNumber}</b></h1></div>
              <span><Target aria-hidden="true" />已完成 {correctNumbers.length}／{itemCount}</span>
            </div>

            <div className="dynamic-schulte-controls" aria-label="旋轉速度控制">
              <div><Gauge aria-hidden="true" /><strong>旋轉速度</strong></div>
              <button type="button" className={speed === 'gentle' ? 'is-active' : ''} onClick={() => setSpeed('gentle')}>舒緩</button>
              <button type="button" className={speed === 'steady' ? 'is-active' : ''} onClick={() => setSpeed('steady')}>標準</button>
              <button
                type="button"
                className={paused ? 'is-active' : ''}
                aria-pressed={paused}
                onClick={() => setPaused((value) => !value)}
              >
                {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
                {paused ? '繼續轉動' : '暫停轉動'}
              </button>
            </div>

            <p className="dynamic-orientation-tip"><Smartphone aria-hidden="true" />手機或平板轉成橫向，更方便使用喔！</p>

            <div
              className={`dynamic-schulte-stage is-${layout.direction}${paused ? ' is-paused' : ''}`}
              aria-label={`${itemCount} 個數字的動態舒爾特轉盤`}
            >
              {layout.rings.map((ring, ringIndex) => (
                <div
                  className={`dynamic-schulte-ring ring-${ringIndex + 1}`}
                  style={{ '--rotation-duration': `${speedProfiles[speed][ringIndex]}s` }}
                  key={`ring-${ringIndex + 1}`}
                >
                  {ring.map((number, index) => (
                    <div
                      className="dynamic-schulte-position"
                      style={ringPosition(index, ring.length, ringIndex)}
                      key={number}
                    >
                      {renderNumber(number)}
                    </div>
                  ))}
                </div>
              ))}
              <div className="dynamic-schulte-center">{renderNumber(layout.center)}</div>
            </div>

            <div className="schulte-feedback" aria-live="polite">
              <span>{feedback}</span>
              <small>錯誤 {errorCount} 次・計時已隱藏・{layout.direction === 'clockwise' ? '順時針' : '逆時針'}</small>
            </div>
          </section>
        )}

        {phase === 'result' && (
          <section className="schulte-result-card">
            <div className="schulte-result-icon"><Trophy aria-hidden="true" /></div>
            <p>完成動態舒爾特 {selectedInfo.rangeLabel}</p>
            <h1>{saving ? '正在儲存這次練習……' : '做得很好，讓眼睛休息一下吧！'}</h1>
            {result && (
              <>
                <div className="schulte-result-grid">
                  <div><Clock3 aria-hidden="true" /><span>完成時間</span><strong>{formatSchulteDuration(result.durationMs)}</strong></div>
                  <div><RotateCcw aria-hidden="true" /><span>點錯次數</span><strong>{result.errorCount} 次</strong></div>
                  <div><Target aria-hidden="true" /><span>平均點按</span><strong>{formatSchulteDuration(result.averageTapMs)}</strong></div>
                  <div><Sparkles aria-hidden="true" /><span>個人最佳</span><strong>{formatSchulteDuration((bestDynamicSchulteRecord(records, itemCount) || result).durationMs)}</strong></div>
                </div>
                {result.taskCompleted && <p className="schulte-task-sync-note"><Check aria-hidden="true" />本次已計入每日任務。</p>}
                {result.remoteError && <p className="schulte-save-note">本機紀錄已保留；每日任務紀錄需待資料庫更新後同步。</p>}
              </>
            )}
            <div className="schulte-result-actions">
              <button type="button" onClick={() => startGame(itemCount)} disabled={saving}><RotateCcw aria-hidden="true" />重新排列再玩一局</button>
              <button type="button" onClick={() => setPhase('setup')} disabled={saving}>選擇其他範圍</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
