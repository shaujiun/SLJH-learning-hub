import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CalendarCheck2, Check, Clock3, Grid3X3, Home, MessageSquareQuote, RotateCcw, Target, X } from 'lucide-react'
import { applyMemorizationSequenceStep, applyPhraseSchulteTap, createPhraseSchulteLayout, formatSchulteDuration, phraseCharacters, phraseProgress } from '../lib/schulte.js'
import { loadCurrentSchulteMemorizationBatch, recordSchulteMemorizationCompletion } from '../services/schulteService.js'
import './schulteGame.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

function learningHubUrl(query = '') {
  const url = new URL(window.location.href)
  url.search = query
  url.hash = ''
  return url.toString()
}

function formatDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${year}/${month}/${day}`
}

function SchulteNavigation() {
  return (
    <nav className="schulte-floating-nav" aria-label="週五名言佳句背誦導覽">
      <a href={learningHubUrl('?focus=training')}><Grid3X3 aria-hidden="true" />訓練選單</a>
      <a href={learningHubUrl()}><Home aria-hidden="true" />任務頁</a>
      <a href={contactBookUrl}><ArrowLeft aria-hidden="true" />聯絡簿</a>
    </nav>
  )
}

export default function SchulteMemorizationGame() {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const referenceDate = query.get('date') || ''
  const [phase, setPhase] = useState('loading')
  const [batch, setBatch] = useState(null)
  const [layouts, setLayouts] = useState([])
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [selectedCount, setSelectedCount] = useState(0)
  const [selectedTileIds, setSelectedTileIds] = useState([])
  const [errorCount, setErrorCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const startedAtRef = useRef(0)
  const finishingRef = useRef(false)

  useEffect(() => {
    loadCurrentSchulteMemorizationBatch(referenceDate)
      .then((loadedBatch) => {
        setBatch(loadedBatch)
        setPhase('setup')
      })
      .catch((error) => {
        setResult({ remoteError: error.message })
        setPhase('setup')
      })
  }, [referenceDate])

  const phrases = batch?.items || []
  const phrase = phrases[phraseIndex] || null
  const layout = layouts[phraseIndex] || null

  const startGame = () => {
    if (phrases.length !== 5) return
    setLayouts(phrases.map((item) => createPhraseSchulteLayout(item.content)))
    setPhraseIndex(0)
    setSelectedCount(0)
    setSelectedTileIds([])
    setErrorCount(0)
    setFeedback('請依照釋義，從第 1 個字開始找出完整佳句。')
    setResult(null)
    finishingRef.current = false
    startedAtRef.current = performance.now()
    setPhase('playing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const finishGame = async (finalErrorCount) => {
    if (finishingRef.current || !batch) return
    finishingRef.current = true
    const durationMs = Math.round(performance.now() - startedAtRef.current)
    setPhase('result')
    setSaving(true)
    try {
      const completion = await recordSchulteMemorizationCompletion({
        setId: batch.setId,
        durationMs,
        errorCount: finalErrorCount,
      })
      setResult({
        durationMs,
        errorCount: finalErrorCount,
        preview: completion?.preview === true,
        storedRemotely: completion?.preview !== true,
      })
    } catch (error) {
      setResult({ durationMs, errorCount: finalErrorCount, remoteError: error.message })
    } finally {
      setSaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleTap = (tile) => {
    if (phase !== 'playing' || !phrase || !layout || selectedTileIds.includes(tile.id)) return
    const transition = applyPhraseSchulteTap({
      expectedIndex: selectedCount,
      expectedCharacter: phraseCharacters(phrase.content)[selectedCount],
      tappedCharacter: tile.character,
      totalCharacters: layout.totalCharacters,
    })
    const sequence = applyMemorizationSequenceStep({
      phraseIndex,
      totalPhrases: phrases.length,
      phraseCompleted: transition.completed,
      correct: transition.correct,
    })

    if (!transition.correct) {
      const nextErrors = errorCount + 1
      setErrorCount(nextErrors)
      setPhraseIndex(sequence.phraseIndex)
      setSelectedCount(0)
      setSelectedTileIds([])
      setFeedback('這一輪有一個字選錯了，請回到第 1 句重新開始。計時會繼續。')
      return
    }

    setSelectedTileIds((current) => [...current, tile.id])
    setSelectedCount(transition.nextExpectedIndex)
    if (!transition.completed) {
      setFeedback(`第 ${phraseIndex + 1} 句正確，繼續找下一個字。`)
      return
    }

    if (!sequence.completed && sequence.resetPhrase) {
      const nextIndex = sequence.phraseIndex
      setPhraseIndex(nextIndex)
      setSelectedCount(0)
      setSelectedTileIds([])
      setFeedback(`第 ${phraseIndex + 1} 句完成，接著完成第 ${nextIndex + 1} 句。`)
      return
    }

    if (sequence.completed) finishGame(errorCount)
  }

  const closeResult = () => window.location.assign(learningHubUrl())

  return (
    <div className="schulte-shell phrase-schulte-shell memorization-shell">
      <SchulteNavigation />
      <header className="schulte-header">
        <div className="schulte-brand-icon"><CalendarCheck2 aria-hidden="true" /></div>
        <div><small>FRIDAY RECITATION</small><strong>週五名言佳句背誦</strong></div>
      </header>

      <main className="schulte-content">
        {phase === 'loading' && <section className="schulte-size-section phrase-start-card"><p>正在讀取本次背誦內容……</p></section>}

        {phase === 'setup' && (
          <section className="schulte-size-section phrase-start-card memorization-start-card">
            <div className="schulte-section-heading">
              <div><small>FIVE IN A ROW</small><h1>連續完成 5 句才算通過</h1></div>
              <MessageSquareQuote aria-hidden="true" />
            </div>
            {batch ? (
              <>
                <p>測驗日期：<b>{formatDate(batch.testDate)}</b>。本模式不播放語音，只提供釋義；任一句答錯都必須從第 1 句重新開始。</p>
                {batch.preview && <p className="schulte-save-note">目前為管理員／教師預覽模式，可完整作答，但不會寫入任何學生的通過紀錄。</p>}
                <div className="memorization-rule-list">
                  <span><Target aria-hidden="true" />共 5 句</span>
                  <span><RotateCcw aria-hidden="true" />答錯回到第 1 句</span>
                  <span><Clock3 aria-hidden="true" />重來時持續計時</span>
                </div>
                <button className="shape-start-button" type="button" onClick={startGame}>開始背誦</button>
              </>
            ) : (
              <>
                <p>{result?.remoteError ? `目前無法讀取背誦安排：${result.remoteError}` : '目前沒有位於挑戰期間的週五背誦；每批可從開放日起練習至測驗日當天。'}</p>
                <a className="shape-start-button memorization-back-link" href={learningHubUrl('?focus=training')}>返回專注力訓練</a>
              </>
            )}
          </section>
        )}

        {phase === 'playing' && phrase && layout && (
          <section className="schulte-play-card phrase-schulte-play-card">
            <div className="schulte-play-heading">
              <div><small>只提供釋義</small><h1>第 {phraseIndex + 1}／5 句</h1></div>
              <span><Target aria-hidden="true" />本句 {selectedCount}／{layout.totalCharacters}</span>
            </div>
            <div className="phrase-prompt-card">
              <MessageSquareQuote aria-hidden="true" />
              <div><small>句義提示</small><strong>{phrase.meaning}</strong></div>
            </div>
            <div className="phrase-answer" aria-live="polite">{phraseProgress(phrase.content, selectedCount)}</div>
            <div className="phrase-tile-grid" aria-label="5 乘 5 名言佳句文字矩陣">
              {layout.tiles.map((tile) => {
                const selected = selectedTileIds.includes(tile.id)
                return (
                  <button type="button" key={tile.id} disabled={selected} className={selected ? 'is-correct' : ''} onClick={() => handleTap(tile)}>
                    {selected ? <Check aria-hidden="true" /> : tile.character}
                  </button>
                )
              })}
            </div>
            <div className="schulte-feedback" aria-live="polite">
              <span>{feedback}</span><small>累積錯誤 {errorCount} 次</small>
            </div>
          </section>
        )}

        {phase === 'result' && batch && (
          <div className="memorization-result-overlay" role="dialog" aria-modal="true" aria-labelledby="memorization-result-title">
            <section className="schulte-result-card memorization-result-card">
              <button className="memorization-result-close" type="button" onClick={closeResult} disabled={saving} aria-label="關閉結果"><X aria-hidden="true" /></button>
              <div className="schulte-result-icon"><CalendarCheck2 aria-hidden="true" /></div>
              <p>5 句連續背誦完成</p>
              <h1 id="memorization-result-title">{saving ? '正在保存通過紀錄……' : '本次背誦通過'}</h1>
              <div className="schulte-result-grid">
                <div><Clock3 aria-hidden="true" /><span>完成時間</span><strong>{result?.durationMs ? formatSchulteDuration(result.durationMs) : '—'}</strong></div>
                <div><RotateCcw aria-hidden="true" /><span>累積錯誤</span><strong>{result?.errorCount ?? errorCount} 次</strong></div>
              </div>
              <div className="memorization-result-list">
                {phrases.map((item, index) => <blockquote key={item.id}><b>{index + 1}．{item.content}</b><span>{item.meaning}</span><cite>{item.source || '題庫內容'}</cite></blockquote>)}
              </div>
              {result?.preview && <p className="schulte-save-note">預覽已完成；本次結果未計入學生進度。</p>}
              {result?.remoteError && <p className="schulte-save-note">紀錄尚未同步：{result.remoteError}。關閉後任務仍會保留，請稍後再試。</p>}
              <p className="memorization-close-note">結果會持續顯示，請按右上角「×」返回任務頁。</p>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
