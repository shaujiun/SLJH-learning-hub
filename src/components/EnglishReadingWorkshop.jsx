import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BookOpen, ImagePlus, Volume2 } from 'lucide-react'
import { canManageLearningContent } from '../services/learningService.js'
import {
  emptyReadingDraft, normalizeReadingDraft, normalizedReadingRect, parseReadingWords,
  readingParagraphs, readingSections, readingSentences,
} from '../lib/englishReadingDraft.js'
import { recognizeReadingRegion } from '../lib/englishReadingPhotoImport.js'
import { loadAdminReadingLessons, saveAdminReadingLesson } from '../services/englishReadingService.js'
import EnglishReadingQuestionEditor from './EnglishReadingQuestionEditor.jsx'
import './englishReadingWorkshop.css'

const storageKey = 'sljh-english-reading-teacher-draft-v1'
const photoLabels = { article: '文章與翻譯', exercise: '單字與練習' }

function storedDraft() {
  try {
    return normalizeReadingDraft(JSON.parse(window.localStorage.getItem(storageKey) || '{}'))
  } catch {
    return emptyReadingDraft()
  }
}

function pointInImage(event) {
  const bounds = event.currentTarget.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
    y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
  }
}

function ReadingPreview({ draft }) {
  const [showTranslation, setShowTranslation] = useState(false)
  const [group, setGroup] = useState('B')
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [speechNotice, setSpeechNotice] = useState('')
  const english = readingParagraphs(draft.english)
  const translation = readingParagraphs(draft.translation)
  const words = [
    { label: '國中 2000 單', entries: parseReadingWords(draft.coreWords) },
    { label: '補充單字', entries: parseReadingWords(draft.extraWords) },
  ]

  function speak(word, slow = false) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setSpeechNotice('目前瀏覽器不支援發音，請改用 Safari、Chrome 或 Edge。')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = slow ? 0.65 : 0.9
    window.speechSynthesis.speak(utterance)
    setSpeechNotice(`正在播放：${word}${slow ? '（慢速）' : ''}`)
  }

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  return <section className="reading-preview" aria-label="學生頁面預覽">
    <div className="reading-preview-heading">
      <div><small>管理者預覽・顯示目前編輯內容</small><h2>{draft.title || '文章標題待輸入'}</h2>
        <p>{draft.author && `作者：${draft.author}・`}{draft.source}{draft.issueDate && `・${draft.issueDate}`}</p></div>
      <label>預覽分組 <select value={group} onChange={(event) => setGroup(event.target.value)}><option value="B">B 組</option><option value="A">A 組</option></select></label>
    </div>
    <div className="reading-preview-layout">
      <div>
        <div className="reading-toolbar"><button type="button" onClick={() => setShowTranslation((value) => !value)}>{showTranslation ? '收起' : '顯示'}中文翻譯</button><span>點選段落，可練習標記答案依據。</span></div>
        {english.length ? english.map((paragraph, index) => <div className="reading-paragraph" key={`${index}-${paragraph.slice(0, 12)}`}>
          <div className="reading-sentence-list">{readingSentences(paragraph).map((sentence, sentenceIndex) => {
            const evidenceKey = `${index}-${sentenceIndex}`
            return <button type="button" key={evidenceKey} className={selectedEvidence === evidenceKey ? 'is-evidence' : ''} onClick={() => setSelectedEvidence(evidenceKey)} aria-pressed={selectedEvidence === evidenceKey}>{sentence}</button>
          })}</div>
          {showTranslation && translation[index] && <p lang="zh-Hant">{translation[index]}</p>}
        </div>) : <p className="reading-empty">請先在左側校對英文文章。</p>}
        {showTranslation && translation.length > english.length && <p className="reading-warning">中英文段落數不同，請先校對段落對應。</p>}
        <p className="reading-evidence">{selectedEvidence === null ? '尚未選出原文依據。' : '已標記一句原文作為答案依據。'}</p>
      </div>
      <aside className="reading-sidebar">
        {words.map(({ label, entries }) => <section key={label}><h3>{label}</h3>{entries.length ? <div className="reading-word-list">{entries.map(({ word, meaning }, index) => <div key={`${word}-${index}`}><button type="button" onClick={() => speak(word)} title={`播放 ${word} 發音`}><Volume2 aria-hidden="true" />{word}</button><span>{meaning}</span><button type="button" className="reading-slow" onClick={() => speak(word, true)} aria-label={`慢速播放 ${word}`}>慢速</button></div>)}</div> : <p>尚未校對單字。</p>}</section>)}
        {speechNotice && <p role="status" className="reading-speech-notice">{speechNotice}</p>}
        {draft.grammar && <section><h3>實用文法</h3><p className="reading-raw-text">{draft.grammar}</p></section>}
        {draft.mindMap && <section><h3>單字心智圖文字草稿</h3><p className="reading-raw-text">{draft.mindMap}</p></section>}
      </aside>
    </div>
    <div className="reading-exercises">
      <section><h3>小試身手</h3><p className="reading-raw-text">{draft.cloze || '題目待校對。'}</p></section>
      <section><h3>閱讀能力測驗</h3><p className="reading-raw-text">{draft.questions || '題目待校對。'}</p></section>
      <section><h3>{group} 組閱讀提示</h3><p>{(group === 'A' ? draft.groupAHint : draft.groupBHint) || '尚未設定提示。'}</p></section>
    </div>
    <p className="reading-warning">此處預覽文章排版及找句子操作；實際作答題目請在編題區另外建立。</p>
  </section>
}

export default function EnglishReadingWorkshop() {
  const [permission, setPermission] = useState('loading')
  const [draft, setDraft] = useState(storedDraft)
  const [photos, setPhotos] = useState({ article: '', exercise: '' })
  const [photoType, setPhotoType] = useState('article')
  const [sectionCode, setSectionCode] = useState('english')
  const [firstPoint, setFirstPoint] = useState(null)
  const [selectedRect, setSelectedRect] = useState(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [savedLessons, setSavedLessons] = useState([])
  const [lessonId, setLessonId] = useState('')
  const [availableFrom, setAvailableFrom] = useState('')
  const [availableUntil, setAvailableUntil] = useState('')
  const [usageNote, setUsageNote] = useState('')
  const imageRef = useRef(null)
  const photoUrls = useRef([])

  useEffect(() => {
    let active = true
    canManageLearningContent().then((allowed) => { if (active) setPermission(allowed ? 'allowed' : 'denied') })
      .catch(() => { if (active) setPermission('denied') })
    return () => { active = false }
  }, [])
  useEffect(() => () => photoUrls.current.forEach((url) => URL.revokeObjectURL(url)), [])
  useEffect(() => {
    if (permission !== 'allowed') return
    let active = true
    loadAdminReadingLessons().then((lessons) => { if (active) setSavedLessons(lessons) })
      .catch((error) => { if (active) setStatus(`尚無法讀取資料庫草稿：${error.message}`) })
    return () => { active = false }
  }, [permission])

  function updateField(code, value) { setDraft((previous) => ({ ...previous, [code]: value })) }

  function uploadPhoto(type, file) {
    if (!file) return
    if (!file.type.startsWith('image/')) { setStatus('請選擇照片檔案。'); return }
    const next = URL.createObjectURL(file)
    photoUrls.current.push(next)
    setPhotos((previous) => ({ ...previous, [type]: next }))
    setPhotoType(type)
    setSelectedRect(null)
    setFirstPoint(null)
    setStatus('照片只在此瀏覽器供選區辨識，不會上傳或儲存原圖。')
  }

  function finishSelection(event) {
    if (!firstPoint) return
    const rect = normalizedReadingRect(firstPoint, pointInImage(event))
    setSelectedRect(rect)
    setFirstPoint(null)
    if (!rect) setStatus('選區太小，請從區塊左上角拖曳到右下角。')
  }

  async function recognize() {
    const section = readingSections.find((item) => item.code === sectionCode)
    if (!photos[photoType] || !selectedRect || !imageRef.current) { setStatus('請先上傳照片並拖曳框選要讀取的區塊。'); return }
    if (draft[section.code] && !window.confirm(`辨識結果將取代「${section.label}」現有文字，確定繼續？`)) return
    setBusy(true)
    setStatus('正在此瀏覽器辨識，首次使用需下載辨識語言資料。')
    try {
      const result = await recognizeReadingRegion(imageRef.current, selectedRect, section.language)
      if (!result) throw new Error('未讀到文字，請縮小選區並選擇清晰的照片。')
      updateField(section.code, result)
      setStatus(`已帶入「${section.label}」。照片角度、欄位與手寫痕跡會造成錯字，請逐字校對。`)
    } catch (error) { setStatus(`辨識失敗：${error.message}`) }
    finally { setBusy(false) }
  }

  function saveLocalDraft() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(draft))
      setStatus('草稿只存於此裝置的瀏覽器；尚未存入資料庫，也沒有發布。')
    } catch { setStatus('此瀏覽器無法儲存草稿，請先複製編輯欄文字保留。') }
  }

  function chooseSavedLesson(id) {
    setLessonId(id)
    const selected = savedLessons.find((lesson) => lesson.id === id)
    setDraft(selected ? normalizeReadingDraft(selected) : emptyReadingDraft())
    setAvailableFrom(selected?.availableFrom || '')
    setAvailableUntil(selected?.availableUntil || '')
    setUsageNote(selected?.usageNote || '')
  }

  async function saveDatabase(statusToSave) {
    if (statusToSave === 'published' && !window.confirm('這篇文章將在指定日期內供所有有效學生帳號閱讀；請確認文字、來源及使用範圍均已校對。確定發布？')) return
    setBusy(true)
    try {
      const id = await saveAdminReadingLesson(draft, {
        id: lessonId || undefined,
        status: statusToSave,
        availableFrom,
        availableUntil,
        usageNote,
      })
      setLessonId(id)
      setSavedLessons(await loadAdminReadingLessons())
      setStatus(statusToSave === 'published' ? '已設定發布；只有開放日期內的有效學生帳號可讀取。' : '已存入資料庫草稿，學生看不到。')
    } catch (error) { setStatus(error.message.includes('reading_questions_required_before_publish') ? '發布前請先建立至少一題有正解的練習題。' : error.message) }
    finally { setBusy(false) }
  }

  if (permission !== 'allowed') return <main className="reading-workshop-gate"><BookOpen aria-hidden="true" /><h1>英語閱讀編題工作台</h1><p>{permission === 'loading' ? '正在確認管理者身分……' : '此頁只開放已核准的管理者編題。'}</p><a href="?subject=english">返回英語科</a></main>

  return <main className="reading-workshop">
    <header className="reading-workshop-header"><a href="?subject=english"><ArrowLeft aria-hidden="true" />返回英語科</a><div><small>ENGLISH READING・管理者編題</small><h1>照片匯入與閱讀預覽</h1><p>先將同一期報紙的兩張照片分區辨識，再校對文章、翻譯、單字與練習題。發布前請確認使用範圍。</p></div></header>
    <div className="reading-workshop-columns">
      <section className="reading-editor">
        <h2><ImagePlus aria-hidden="true" />匯入照片</h2>
        <label>已儲存文章<select value={lessonId} onChange={(event) => chooseSavedLesson(event.target.value)}><option value="">建立新文章</option>{savedLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.issueDate || '未標日期'}・{lesson.title || '未命名'}（{lesson.status === 'published' ? '已發布' : '草稿'}）</option>)}</select></label>
        <div className="reading-upload-row">{Object.entries(photoLabels).map(([type, label]) => <label key={type}>{label}<input type="file" accept="image/*" onChange={(event) => uploadPhoto(type, event.target.files?.[0])} /></label>)}</div>
        <div className="reading-recognize-controls"><label>選擇照片<select value={photoType} onChange={(event) => { setPhotoType(event.target.value); setSelectedRect(null) }}><option value="article">文章與翻譯</option><option value="exercise">單字與練習</option></select></label><label>帶入欄位<select value={sectionCode} onChange={(event) => setSectionCode(event.target.value)}>{readingSections.map((section) => <option value={section.code} key={section.code}>{section.label}</option>)}</select></label></div>
        <p>在照片上拖曳框選單一欄位；英文和翻譯請分開選，單字兩欄也分開選。辨識錯字可在下方編輯。</p>
        {photos[photoType] ? <div className="reading-photo" onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setFirstPoint(pointInImage(event)) }} onPointerUp={finishSelection} onPointerCancel={() => setFirstPoint(null)}>
          <img ref={imageRef} src={photos[photoType]} alt={`${photoLabels[photoType]}編題照片`} draggable="false" />
          {selectedRect && <span className="reading-photo-selection" style={{ left: `${selectedRect.left * 100}%`, top: `${selectedRect.top * 100}%`, width: `${selectedRect.width * 100}%`, height: `${selectedRect.height * 100}%` }} />}
        </div> : <div className="reading-photo-empty">上傳照片後，在這裡選擇要辨識的文字區塊。</div>}
        <button type="button" className="reading-action" disabled={busy || !selectedRect} onClick={recognize}>{busy ? '辨識中……' : '辨識選取範圍'}</button>
        <p className="reading-status" role="status">{status}</p>
        <div className="reading-meta"><label>文章標題<input value={draft.title} onChange={(event) => updateField('title', event.target.value)} /></label><label>作者<input value={draft.author} onChange={(event) => updateField('author', event.target.value)} /></label><label>報紙日期<input type="date" value={draft.issueDate} onChange={(event) => updateField('issueDate', event.target.value)} /></label><label>來源<input value={draft.source} onChange={(event) => updateField('source', event.target.value)} /></label></div>
        {readingSections.map((section) => <label className="reading-text-field" key={section.code}>{section.label}<textarea value={draft[section.code]} onChange={(event) => updateField(section.code, event.target.value)} rows={section.code === 'english' || section.code === 'translation' ? 8 : 4} placeholder={section.code.endsWith('Words') ? '一行一個，例如：serious 嚴重的' : '辨識後請逐字對照照片校對。'} /></label>)}
        {['A', 'B'].map((group) => <label className="reading-text-field" key={group}>{group} 組提示<textarea value={draft[`group${group}Hint`]} onChange={(event) => updateField(`group${group}Hint`, event.target.value)} rows={2} /></label>)}
        <div className="reading-meta"><label>學生開放日期<input type="date" value={availableFrom} onChange={(event) => setAvailableFrom(event.target.value)} /></label><label>學生截止日期<input type="date" value={availableUntil} onChange={(event) => setAvailableUntil(event.target.value)} /></label></div>
        <label className="reading-text-field">教學使用依據或授權範圍<textarea value={usageNote} onChange={(event) => setUsageNote(event.target.value)} rows={2} placeholder="請記錄適用課程、使用對象與期間，或授權資訊。" /></label>
        <div className="reading-save-actions"><button type="button" className="reading-action" onClick={saveLocalDraft}>儲存此裝置草稿</button><button type="button" className="reading-action" disabled={busy} onClick={() => saveDatabase('draft')}>存入資料庫草稿／暫停發布</button><button type="button" className="reading-action reading-publish" disabled={busy || !lessonId} onClick={() => saveDatabase('published')}>發布閱讀版</button></div>
        <p>發布前請先儲存文章草稿，再建立至少一題有正解的練習題。</p>
        <EnglishReadingQuestionEditor lessonId={lessonId} />
        <p className="reading-warning">原圖不儲存；資料庫只保存校對後的文字。發布前請校對文章及每題答案。</p>
      </section>
      <ReadingPreview draft={draft} />
    </div>
  </main>
}
