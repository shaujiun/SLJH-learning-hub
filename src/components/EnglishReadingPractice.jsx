import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpenCheck, Volume2 } from 'lucide-react'
import { readingParagraphs, readingSentences, parseReadingWords } from '../lib/englishReadingDraft.js'
import { formatReadingCountdown, READING_TRANSLATION_DELAY_SECONDS } from '../lib/englishReadingTimer.js'
import { loadStudentReadingLessons } from '../services/englishReadingService.js'
import EnglishReadingQuestionSet from './EnglishReadingQuestionSet.jsx'
import './englishReadingWorkshop.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

export default function EnglishReadingPractice() {
  const [state, setState] = useState({ loading: true, access: '', lessons: [], group: 'B', viewerRole: '', error: '' })
  const [lessonId, setLessonId] = useState('')
  const [translationOpen, setTranslationOpen] = useState(false)
  const [translationSecondsLeft, setTranslationSecondsLeft] = useState(READING_TRANSLATION_DELAY_SECONDS)
  const [evidenceKey, setEvidenceKey] = useState(null)
  const [speechError, setSpeechError] = useState('')

  useEffect(() => {
    let active = true
    loadStudentReadingLessons().then((result) => { if (active) setState({ ...result, loading: false, error: '' }) })
      .catch((error) => { if (active) setState({ loading: false, access: 'error', lessons: [], group: 'B', viewerRole: '', error: error.message }) })
    return () => { active = false; window.speechSynthesis?.cancel() }
  }, [])

  const lesson = state.lessons.find((item) => item.id === lessonId) || state.lessons[0]
  const translationLocked = state.viewerRole !== 'admin' && translationSecondsLeft > 0
  const english = readingParagraphs(lesson?.english)
  const translation = readingParagraphs(lesson?.translation)
  const [evidenceParagraph, evidenceSentence] = (evidenceKey || '').split('-').map(Number)
  const evidenceText = evidenceKey === null ? '' : readingSentences(english[evidenceParagraph] || '')[evidenceSentence] || ''

  useEffect(() => {
    setTranslationOpen(false)
    if (!lesson?.id) return undefined
    if (state.viewerRole === 'admin') {
      setTranslationSecondsLeft(0)
      return undefined
    }

    function resetReadingTime() {
      setTranslationOpen(false)
      setTranslationSecondsLeft(READING_TRANSLATION_DELAY_SECONDS)
    }

    resetReadingTime()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        setTranslationSecondsLeft((seconds) => Math.max(0, seconds - 1))
      }
    }, 1000)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') resetReadingTime()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [lesson?.id, state.viewerRole])

  function speak(word, slow = false) {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setSpeechError('目前瀏覽器不支援發音，請改用 Safari、Chrome 或 Edge。')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = 'en-US'
    utterance.rate = slow ? 0.65 : 0.9
    window.speechSynthesis.speak(utterance)
    setSpeechError('')
  }

  if (state.loading) return <main className="reading-workshop-gate"><BookOpenCheck aria-hidden="true" /><h1>英語閱讀</h1><p>正在確認學生身分與閱讀內容……</p></main>
  if (state.access !== 'allowed') return <main className="reading-workshop-gate"><BookOpenCheck aria-hidden="true" /><h1>英語閱讀需要學生登入</h1><p>{state.access === 'login' ? '請先從線上聯絡簿登入學生帳號。' : state.access === 'denied' ? '這個帳號不是已核准的有效學生帳號。' : state.error}</p><a href={contactBookUrl}>前往學生登入</a></main>

  return <main className="reading-workshop reading-student-page"><header className="reading-workshop-header"><a href="?subject=english"><ArrowLeft aria-hidden="true" />返回英語科</a><div><small>ENGLISH READING</small><h1>英語閱讀練習</h1><p>先找出支持答案的原文段落，再完成閱讀題。點選單字可以聽發音。</p></div></header>
    {!lesson ? <section className="reading-editor"><h2>目前沒有開放中的文章</h2><p>老師發布並設定開放日期後，文章才會出現在此處。</p></section> : <section className="reading-preview reading-student-article">
      <div className="reading-preview-heading"><div><small>{lesson.source}・{lesson.issueDate}</small><h2>{lesson.title}</h2><p>{lesson.author && `作者：${lesson.author}`}</p>{state.viewerRole === 'admin' && <span className="reading-admin-preview-badge">管理者閱讀預覽</span>}</div><div className="reading-preview-selectors"><label>選擇文章<select value={lesson.id} onChange={(event) => { setLessonId(event.target.value); setEvidenceKey(null); setTranslationOpen(false) }}>{state.lessons.map((item) => <option value={item.id} key={item.id}>{item.issueDate || '未標日期'}・{item.title}</option>)}</select></label>{state.viewerRole === 'admin' && <label>預覽分組<select value={state.group} onChange={(event) => setState((current) => ({ ...current, group: event.target.value }))}><option value="A">A 組</option><option value="B">B 組</option></select></label>}</div></div>
      <div className="reading-preview-layout"><article><div className="reading-toolbar"><button type="button" disabled={translationLocked} aria-describedby={translationLocked ? 'translation-reading-status' : undefined} onClick={() => setTranslationOpen((open) => !open)}>{translationLocked ? `中文譯文（${formatReadingCountdown(translationSecondsLeft)} 後開放）` : translationOpen ? '收起中文譯文' : '查看中文譯文'}</button><span id="translation-reading-status" role="status">{state.viewerRole === 'admin' ? '管理者預覽可直接查看中文譯文。' : translationLocked ? '請持續閱讀英文；離開頁面或切換分頁會重新計時。' : '已完成 3 分鐘閱讀，可以查看中文譯文。'}</span><span>點選一句英文，標記作答依據。</span></div>
        {english.map((paragraph, index) => <div className="reading-paragraph" key={`${lesson.id}-${index}`}><div className="reading-sentence-list">{readingSentences(paragraph).map((sentence, sentenceIndex) => {
          const key = `${index}-${sentenceIndex}`
          return <button type="button" key={key} className={evidenceKey === key ? 'is-evidence' : ''} aria-pressed={evidenceKey === key} onClick={() => setEvidenceKey(key)}>{sentence}</button>
        })}</div>{translationOpen && translation[index] && <p lang="zh-Hant">{translation[index]}</p>}</div>)}
        <p className="reading-evidence">{evidenceKey === null ? '尚未標記原文依據。' : '已標記一句原文作為答案依據。'}</p>
      </article><aside className="reading-sidebar">{[
        ['國中 2000 單', lesson.coreWords], ['補充單字', lesson.extraWords],
      ].map(([label, value]) => <section key={label}><h3>{label}</h3><div className="reading-word-list">{parseReadingWords(value).map(({ word, meaning }, index) => <div key={`${word}-${index}`}><button type="button" onClick={() => speak(word)}><Volume2 aria-hidden="true" />{word}</button><span>{meaning}</span><button type="button" className="reading-slow" onClick={() => speak(word, true)} aria-label={`慢速播放 ${word}`}>慢速</button></div>)}</div></section>)}
        {speechError && <p role="status" className="reading-warning">{speechError}</p>}
        {lesson.grammar && <section><h3>實用文法</h3><p className="reading-raw-text">{lesson.grammar}</p></section>}
        {lesson.mindMap && <section><h3>單字心智圖</h3><p className="reading-raw-text">{lesson.mindMap}</p></section>}
      </aside></div>
      <div className="reading-exercises"><section><h3>練習題</h3><p>{state.viewerRole === 'admin' ? '管理者可完整試答並查看參考答案、AI 解題思路與原文依據，但不會建立學生作答紀錄。' : '完成後送出，系統會顯示參考答案、AI 解題思路與原文依據；可再次練習。'}</p><EnglishReadingQuestionSet key={lesson.id} lessonId={lesson.id} group={state.group} evidenceText={evidenceText} fallback={Boolean(lesson.cloze || lesson.questions)} viewerRole={state.viewerRole} /></section><section><h3>閱讀提示</h3><p>{(state.group === 'A' ? lesson.groupAHint : lesson.groupBHint) || '這篇文章沒有額外提示。'}</p></section></div>
    </section>}
  </main>
}
