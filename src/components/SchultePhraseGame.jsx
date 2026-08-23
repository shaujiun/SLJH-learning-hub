import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Clock3,
  Grid3X3,
  Home,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Volume2,
} from 'lucide-react'
import {
  applyPhraseSchulteTap,
  bestPhraseSchulteRecord,
  createPhraseSchulteLayout,
  formatSchulteDuration,
  phraseCharacters,
  phraseProgress,
} from '../lib/schulte.js'
import {
  loadSchultePhrases,
  loadSchulteRecords,
  recordPhraseSchulteCompletion,
} from '../services/schulteService.js'
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

export function phrasePromptHeading(phrase) {
  return phrase?.category === 'poem'
    ? '請依提示完成這句詩'
    : '請依提示完成這句名言'
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

export default function SchultePhraseGame() {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const focusTaskId = resolveFocusTaskId(query, { activityPrefix: 'schulte_phrase_' })
  const [phase, setPhase] = useState('setup')
  const [phrases, setPhrases] = useState([])
  const [phrase, setPhrase] = useState(null)
  const [layout, setLayout] = useState(null)
  const [promptMode, setPromptMode] = useState('meaning')
  const [selectedCount, setSelectedCount] = useState(0)
  const [selectedTileIds, setSelectedTileIds] = useState([])
  const [errorCount, setErrorCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [canReplay, setCanReplay] = useState(false)
  const [records, setRecords] = useState([])
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const startedAtRef = useRef(0)
  const finishingRef = useRef(false)
  const bestRecord = bestPhraseSchulteRecord(records)

  useEffect(() => {
    Promise.all([loadSchultePhrases(), loadSchulteRecords('sentence')])
      .then(([loadedPhrases, loadedRecords]) => {
        setPhrases(loadedPhrases)
        setRecords(loadedRecords)
      })
      .catch(() => setPhrases([]))
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [])

  const speak = (content) => {
    if (!('speechSynthesis' in window)) return false
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.lang = 'zh-TW'
    utterance.rate = 0.82
    window.speechSynthesis.speak(utterance)
    return true
  }

  const startGame = () => {
    if (!phrases.length) return
    const selectedPhrase = phrases[Math.floor(Math.random() * phrases.length)]
    const supportsSpeech = 'speechSynthesis' in window
    const selectedMode = supportsSpeech && Math.random() < 0.5 ? 'audio' : 'meaning'
    setPhrase(selectedPhrase)
    setLayout(createPhraseSchulteLayout(selectedPhrase.content, selectedPhrase.distractorCharacters))
    setPromptMode(selectedMode)
    setSelectedCount(0)
    setSelectedTileIds([])
    setErrorCount(0)
    setFeedback('請依照提示，從第一個字開始組合。')
    setCanReplay(selectedMode === 'audio')
    setResult(null)
    finishingRef.current = false
    startedAtRef.current = performance.now()
    setPhase('playing')
    if (selectedMode === 'audio') window.setTimeout(() => speak(selectedPhrase.content), 250)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const replay = () => {
    if (!canReplay || !phrase) return
    speak(phrase.content)
    setCanReplay(false)
  }

  const finishGame = async (nextErrorCount = errorCount) => {
    if (finishingRef.current || !phrase) return
    finishingRef.current = true
    const durationMs = Math.round(performance.now() - startedAtRef.current)
    setSaving(true)
    setPhase('result')
    try {
      const saved = await recordPhraseSchulteCompletion({
        focusTaskId,
        phraseId: phrase.id,
        content: phrase.content,
        durationMs,
        errorCount: nextErrorCount,
      })
      setRecords(saved.records)
      setResult({
        ...saved.record,
        remoteError: saved.remoteError,
        taskCompleted: saved.taskCompleted,
        recoveredFocusTask: saved.recoveredFocusTask,
      })
    } catch (error) {
      setResult({
        mode: 'sentence',
        size: layout.totalCharacters,
        durationMs,
        errorCount: nextErrorCount,
        averageTapMs: Math.round(durationMs / layout.totalCharacters),
        remoteError: error.message,
      })
    } finally {
      setSaving(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleTap = (tile) => {
    if (phase !== 'playing' || selectedTileIds.includes(tile.id)) return
    const transition = applyPhraseSchulteTap({
      expectedIndex: selectedCount,
      expectedCharacter: phraseCharacters(phrase.content)[selectedCount],
      tappedCharacter: tile.character,
      totalCharacters: layout.totalCharacters,
    })
    if (!transition.correct) {
      setErrorCount((value) => value + 1)
      setSelectedCount(0)
      setSelectedTileIds([])
      setFeedback('順序不對，請沿用同一個排列，從第一個字重新開始。')
      return
    }
    const nextTileIds = [...selectedTileIds, tile.id]
    setSelectedTileIds(nextTileIds)
    setSelectedCount(transition.nextExpectedIndex)
    setFeedback(transition.completed ? '完整句子組合完成！' : '正確，繼續找下一個字。')
    if (transition.completed) finishGame()
  }

  return (
    <div className="schulte-shell phrase-schulte-shell">
      <SchulteNavigation />
      <header className="schulte-header">
        <div className="schulte-brand-icon"><MessageSquareQuote aria-hidden="true" /></div>
        <div><small>PHRASE SCHULTE</small><strong>詩句與名言重組</strong></div>
      </header>

      <main className="schulte-content">
        {phase === 'setup' && (
          <>
            <section className="schulte-intro-card">
              <div>
                <p>語文變化型</p>
                <h1>聽語音或看句義，把文字重新排好</h1>
                <span>固定 5×5 矩陣會混合正確文字與干擾字。系統每局隨機使用語音或句義提示；標點符號會自動放回。點錯時沿用原排列從頭開始，遊戲中不顯示時間。</span>
              </div>
              <MessageSquareQuote aria-hidden="true" />
            </section>
            <section className="schulte-size-section phrase-start-card">
              <div className="schulte-section-heading">
                <div><small>ONE TASK AT A TIME</small><h2>一次只專心完成一句</h2></div>
                {focusTaskId && <span>完成 1 回合即可完成今日任務</span>}
              </div>
              <p>語音題開始時會播放一次，之後只提供一次重播機會。</p>
              {bestRecord && <small>個人最佳：{formatSchulteDuration(bestRecord.durationMs)}</small>}
              <button className="shape-start-button" type="button" onClick={startGame} disabled={!phrases.length}>
                {phrases.length ? '開始隨機練習' : '正在讀取題目……'}
              </button>
            </section>
          </>
        )}

        {phase === 'playing' && phrase && layout && (
          <section className="schulte-play-card phrase-schulte-play-card">
            <div className="schulte-play-heading">
              <div><small>{phrase.category === 'poem' ? '詩句' : '名言佳句'}・{promptMode === 'audio' ? '語音提示' : '句義提示'}</small><h1>{phrasePromptHeading(phrase)}</h1></div>
              <span><Target aria-hidden="true" />已完成 {selectedCount}／{layout.totalCharacters}</span>
            </div>
            <div className="phrase-prompt-card">
              {promptMode === 'audio' ? (
                <>
                  <Volume2 aria-hidden="true" />
                  <div><small>請仔細聽句子</small><strong>依照聽到的內容排列文字</strong></div>
                  <button type="button" disabled={!canReplay} onClick={replay}><Volume2 aria-hidden="true" />{canReplay ? '重播一次' : '已重播'}</button>
                </>
              ) : (
                <><MessageSquareQuote aria-hidden="true" /><div><small>句義提示</small><strong>{phrase.meaning}</strong></div></>
              )}
            </div>
            <div className="phrase-answer" aria-live="polite">{phraseProgress(phrase.content, selectedCount)}</div>
            <div className="phrase-tile-grid" aria-label="5 乘 5 可選文字矩陣">
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
              <span>{feedback}</span><small>錯誤 {errorCount} 次・計時已隱藏</small>
            </div>
          </section>
        )}

        {phase === 'result' && phrase && (
          <section className="schulte-result-card">
            <div className="schulte-result-icon"><Trophy aria-hidden="true" /></div>
            <p>完成「{phrase.title}」</p>
            <h1>{saving ? '正在儲存這次練習……' : '句子組合完成，做得很好！'}</h1>
            <blockquote>{phrase.content}<cite>{phrase.source || '題庫內容'}</cite></blockquote>
            {result && (
              <>
                <div className="schulte-result-grid">
                  <div><Clock3 aria-hidden="true" /><span>完成時間</span><strong>{formatSchulteDuration(result.durationMs)}</strong></div>
                  <div><RotateCcw aria-hidden="true" /><span>點錯次數</span><strong>{result.errorCount} 次</strong></div>
                  <div><Target aria-hidden="true" /><span>平均點按</span><strong>{formatSchulteDuration(result.averageTapMs)}</strong></div>
                  <div><Sparkles aria-hidden="true" /><span>個人最佳</span><strong>{formatSchulteDuration((bestPhraseSchulteRecord(records) || result).durationMs)}</strong></div>
                </div>
                {result.taskCompleted && <p className="schulte-task-sync-note"><Check aria-hidden="true" />本次已計入每日任務。</p>}
                {result.remoteError && <p className="schulte-save-note">本機紀錄已保留；每日任務紀錄需待資料庫更新後同步。</p>}
              </>
            )}
            <div className="schulte-result-actions">
              <button type="button" onClick={startGame} disabled={saving}><RotateCcw aria-hidden="true" />換一句再玩</button>
              <button type="button" onClick={() => setPhase('setup')} disabled={saving}>返回說明</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
