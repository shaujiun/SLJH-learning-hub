import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpenCheck, Volume2 } from 'lucide-react'
import { readingParagraphs, readingSentences, parseReadingWords } from '../lib/englishReadingDraft.js'
import { loadStudentReadingLessons } from '../services/englishReadingService.js'
import EnglishReadingQuestionSet from './EnglishReadingQuestionSet.jsx'
import './englishReadingWorkshop.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

export default function EnglishReadingPractice() {
  const [state, setState] = useState({ loading: true, access: '', lessons: [], group: 'B', error: '' })
  const [lessonId, setLessonId] = useState('')
  const [translationOpen, setTranslationOpen] = useState(false)
  const [evidenceKey, setEvidenceKey] = useState(null)
  const [speechError, setSpeechError] = useState('')

  useEffect(() => {
    let active = true
    loadStudentReadingLessons().then((result) => { if (active) setState({ ...result, loading: false, error: '' }) })
      .catch((error) => { if (active) setState({ loading: false, access: 'error', lessons: [], group: 'B', error: error.message }) })
    return () => { active = false; window.speechSynthesis?.cancel() }
  }, [])

  const lesson = state.lessons.find((item) => item.id === lessonId) || state.lessons[0]
  const english = readingParagraphs(lesson?.english)
  const translation = readingParagraphs(lesson?.translation)
  const [evidenceParagraph, evidenceSentence] = (evidenceKey || '').split('-').map(Number)
  const evidenceText = evidenceKey === null ? '' : readingSentences(english[evidenceParagraph] || '')[evidenceSentence] || ''

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
      <div className="reading-preview-heading"><div><small>{lesson.source}・{lesson.issueDate}</small><h2>{lesson.title}</h2><p>{lesson.author && `作者：${lesson.author}`}</p></div><label>選擇文章<select value={lesson.id} onChange={(event) => { setLessonId(event.target.value); setEvidenceKey(null); setTranslationOpen(false) }}>{state.lessons.map((item) => <option value={item.id} key={item.id}>{item.issueDate || '未標日期'}・{item.title}</option>)}</select></label></div>
      <div className="reading-preview-layout"><article><div className="reading-toolbar"><button type="button" onClick={() => setTranslationOpen((open) => !open)}>{translationOpen ? '收起中文翻譯' : '查看中文翻譯'}</button><span>點選一句英文，標記作答依據。</span></div>
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
      <div className="reading-exercises"><section><h3>練習題</h3><p>完成後送出，系統會顯示參考答案與解析；可再次練習。</p><EnglishReadingQuestionSet key={lesson.id} lessonId={lesson.id} group={state.group} evidenceText={evidenceText} fallback={Boolean(lesson.cloze || lesson.questions)} /></section><section><h3>閱讀提示</h3><p>{(state.group === 'A' ? lesson.groupAHint : lesson.groupBHint) || '這篇文章沒有額外提示。'}</p></section></div>
    </section>}
  </main>
}
