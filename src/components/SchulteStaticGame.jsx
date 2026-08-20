import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Brain,
  Check,
  Clock3,
  Grid3X3,
  Home,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import {
  applySchulteTap,
  bestSchulteRecord,
  formatSchulteDuration,
  normalizeSchulteSize,
  schulteSizes,
  shuffleSchulteNumbers,
} from '../lib/schulte.js'
import { loadSchulteRecords, recordSchulteCompletion } from '../services/schulteService.js'
import { resolveFocusTaskId } from '../lib/focusTaskLaunch.js'
import './schulteGame.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

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

export default function SchulteStaticGame() {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const focusTaskId = resolveFocusTaskId(query, { activityPrefix: 'schulte_static_' })
  const [size, setSize] = useState(normalizeSchulteSize(query.get('size')))
  const [phase, setPhase] = useState('setup')
  const [numbers, setNumbers] = useState([])
  const [expectedNumber, setExpectedNumber] = useState(1)
  const [correctNumbers, setCorrectNumbers] = useState([])
  const [errorCount, setErrorCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [records, setRecords] = useState([])
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const startedAtRef = useRef(0)
  const finishingRef = useRef(false)
  const totalNumbers = size * size
  const selectedInfo = schulteSizes[size]
  const selectableSizes = focusTaskId ? [selectedInfo] : Object.values(schulteSizes)

  useEffect(() => {
    loadSchulteRecords().then(setRecords).catch(() => setRecords([]))
  }, [])

  const startGame = (nextSize = size) => {
    const normalizedSize = normalizeSchulteSize(nextSize)
    setSize(normalizedSize)
    setNumbers(shuffleSchulteNumbers(normalizedSize))
    setExpectedNumber(1)
    setCorrectNumbers([])
    setErrorCount(0)
    setFeedback('請從 1 開始。')
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
      const saved = await recordSchulteCompletion({
        focusTaskId,
        size,
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
        size,
        durationMs,
        errorCount: nextErrorCount,
        averageTapMs: Math.round(durationMs / totalNumbers),
        remoteError: error.message,
      })
    } finally {
      setSaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleTap = (number) => {
    if (phase !== 'playing') return
    const transition = applySchulteTap({ expectedNumber, tappedNumber: number, totalNumbers })

    if (!transition.correct) {
      setErrorCount((value) => value + 1)
      setExpectedNumber(1)
      setCorrectNumbers([])
      setFeedback(`剛剛需要找 ${expectedNumber}，請從 1 重新開始；計時仍繼續。`)
      return
    }

    setCorrectNumbers((values) => [...values, number])
    setExpectedNumber(transition.nextExpectedNumber)
    setFeedback(transition.completed ? '完成了！' : `很好，接著找 ${transition.nextExpectedNumber}。`)
    if (transition.completed) finishGame()
  }

  return (
    <div className="schulte-shell">
      <SchulteNavigation />
      <header className="schulte-header">
        <div className="schulte-brand-icon"><Brain aria-hidden="true" /></div>
        <div><small>STATIC SCHULTE</small><strong>靜態舒爾特專注力訓練</strong></div>
      </header>

      <main className="schulte-content">
        {phase === 'setup' && (
          <>
            <section className="schulte-intro-card">
              <div>
                <p>準備好了再開始</p>
                <h1>依照 1、2、3……由小到大點選</h1>
                <span>遊戲進行時不顯示時間。點錯會從 1 重新開始，但矩陣不變、計時也不會中斷。</span>
              </div>
              <Target aria-hidden="true" />
            </section>

            <section className="schulte-size-section" aria-labelledby="schulte-size-title">
              <div className="schulte-section-heading">
                <div><small>CHOOSE A LEVEL</small><h2 id="schulte-size-title">選擇矩陣大小</h2></div>
                {focusTaskId && <span>完成任一回合即可完成今日任務</span>}
              </div>
              <div className="schulte-size-grid">
                {selectableSizes.map((info) => {
                  const best = bestSchulteRecord(records, info.size)
                  return (
                    <button type="button" key={info.size} onClick={() => startGame(info.size)}>
                      <span>{info.label}</span>
                      <strong>{info.size}×{info.size}</strong>
                      <p>{info.rangeLabel}・{info.description}</p>
                      <small>{best ? `個人最佳：${formatSchulteDuration(best.durationMs)}` : '尚無完成紀錄'}</small>
                    </button>
                  )
                })}
              </div>
            </section>
          </>
        )}

        {phase === 'playing' && (
          <section className="schulte-play-card">
            <div className="schulte-play-heading">
              <div><small>{selectedInfo.label}・{size}×{size}</small><h1>現在請找：<b>{expectedNumber}</b></h1></div>
              <span><Target aria-hidden="true" />已完成 {correctNumbers.length}／{totalNumbers}</span>
            </div>

            <div
              className={`schulte-grid size-${size}`}
              style={{ '--schulte-size': size }}
              aria-label={`${size} 乘 ${size} 舒爾特數字矩陣`}
            >
              {numbers.map((number) => (
                <button
                  type="button"
                  className={correctNumbers.includes(number) ? 'is-correct' : ''}
                  key={number}
                  onClick={() => handleTap(number)}
                  aria-label={`數字 ${number}${correctNumbers.includes(number) ? '，已完成' : ''}`}
                >
                  {correctNumbers.includes(number) ? <Check aria-hidden="true" /> : number}
                </button>
              ))}
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
            <p>完成 {selectedInfo.label} {size}×{size}</p>
            <h1>{saving ? '正在儲存這次練習……' : '做得很好，讓眼睛休息一下吧！'}</h1>
            {result && (
              <>
                <div className="schulte-result-grid">
                  <div><Clock3 aria-hidden="true" /><span>完成時間</span><strong>{formatSchulteDuration(result.durationMs)}</strong></div>
                  <div><RotateCcw aria-hidden="true" /><span>點錯次數</span><strong>{result.errorCount} 次</strong></div>
                  <div><Target aria-hidden="true" /><span>平均點按</span><strong>{formatSchulteDuration(result.averageTapMs)}</strong></div>
                  <div><Sparkles aria-hidden="true" /><span>個人最佳</span><strong>{formatSchulteDuration((bestSchulteRecord(records, size) || result).durationMs)}</strong></div>
                </div>
                {result.remoteError && <p className="schulte-save-note">本機紀錄已保留；每日任務紀錄需待資料庫更新後同步。</p>}
              </>
            )}
            <div className="schulte-result-actions">
              <button type="button" onClick={() => startGame(size)} disabled={saving}><RotateCcw aria-hidden="true" />重新排列再玩一局</button>
              <button type="button" onClick={() => setPhase('setup')} disabled={saving}>選擇其他矩陣</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
