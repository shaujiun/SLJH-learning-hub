import { useEffect, useState } from 'react'
import { deleteAdminReadingQuestion, loadAdminReadingQuestions, saveAdminReadingQuestion } from '../services/englishReadingQuestionService.js'

function blankQuestion(position = 1) {
  return { id: '', position, kind: 'choice', groupScope: 'all', prompt: '', options: ['', '', ''],
    answers: ['A'], explanation: '', evidenceSentence: '', hintA: '', hintB: '' }
}

export default function EnglishReadingQuestionEditor({ lessonId }) {
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState(blankQuestion)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!lessonId) { setQuestions([]); setForm(blankQuestion()); return }
    let active = true
    loadAdminReadingQuestions(lessonId).then((items) => {
      if (active) { setQuestions(items); setForm(blankQuestion(items.length + 1)); setStatus('') }
    }).catch((error) => { if (active) setStatus(error.message) })
    return () => { active = false }
  }, [lessonId])

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })) }

  async function save() {
    setBusy(true)
    try {
      await saveAdminReadingQuestion(form, lessonId)
      const items = await loadAdminReadingQuestions(lessonId)
      setQuestions(items)
      setForm(blankQuestion(items.length + 1))
      setStatus('題目與正解已一起儲存。若文章已發布，開放期間內學生可立即看到此題。')
    } catch (error) { setStatus(error.message) }
    finally { setBusy(false) }
  }

  async function remove() {
    if (!form.id || !window.confirm('確定刪除此題及其作答紀錄？刪除後無法復原。')) return
    setBusy(true)
    try {
      await deleteAdminReadingQuestion(form.id)
      const items = await loadAdminReadingQuestions(lessonId)
      setQuestions(items)
      setForm(blankQuestion(items.length + 1))
      setStatus('題目、正解及該題作答紀錄已刪除。')
    } catch (error) { setStatus(error.message) }
    finally { setBusy(false) }
  }

  return <section className="reading-question-editor" aria-label="可作答題目編輯">
    <h2>可作答題目與私有正解</h2>
    <p>上方辨識的練習文字是校對參考；請在這裡逐題建立。正解不會隨學生題目資料下載。</p>
    {!lessonId && <p className="reading-warning">請先將文章存入資料庫草稿，再建立題目。</p>}
    {questions.length > 0 && <div className="reading-question-list">{questions.map((item) => <button type="button" key={item.id} onClick={() => { setForm(item); setStatus('') }}>
      {item.position}. {item.kind === 'choice' ? '選擇' : '填空'}・{item.prompt.slice(0, 35)}
    </button>)}</div>}
    <button type="button" disabled={!lessonId} onClick={() => { setForm(blankQuestion(questions.length + 1)); setStatus('') }}>新增一題</button>
    <div className="reading-question-form">
      <div className="reading-meta"><label>順序<input type="number" min="1" value={form.position} onChange={(event) => update('position', event.target.value)} /></label>
        <label>題型<select value={form.kind} onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value, answers: event.target.value === 'choice' ? ['A'] : [''], options: event.target.value === 'choice' ? ['', '', ''] : [] }))}><option value="choice">閱讀選擇題</option><option value="cloze">小試身手填空題</option></select></label></div>
      <label>適用分組<select value={form.groupScope} onChange={(event) => update('groupScope', event.target.value)}><option value="all">A／B 共用</option><option value="A">只給 A 組</option><option value="B">只給 B 組</option></select></label>
      <label>題目<textarea rows="3" value={form.prompt} onChange={(event) => update('prompt', event.target.value)} placeholder={form.kind === 'cloze' ? '例如：I always ____ my sister from ____.' : '輸入完整問題'} /></label>
      {form.kind === 'choice' ? <><label>選項（每行一個，依序為 A、B、C、D）<textarea rows="4" value={form.options.join('\n')} onChange={(event) => update('options', event.target.value.split('\n'))} /></label>
        <label>正解代號<select value={form.answers[0] || 'A'} onChange={(event) => update('answers', [event.target.value])}>{['A', 'B', 'C', 'D'].map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select></label></>
        : <label>正解（每個空格一行；同格可用 | 分隔可接受的寫法）<textarea rows="3" value={form.answers.join('\n')} onChange={(event) => update('answers', event.target.value.split('\n'))} /></label>}
      <label>答題解析<textarea rows="2" value={form.explanation} onChange={(event) => update('explanation', event.target.value)} /></label>
      <label>對應原文句子<textarea rows="2" value={form.evidenceSentence} onChange={(event) => update('evidenceSentence', event.target.value)} /></label>
      <div className="reading-meta"><label>A 組提示<textarea rows="2" value={form.hintA} onChange={(event) => update('hintA', event.target.value)} /></label>
        <label>B 組提示<textarea rows="2" value={form.hintB} onChange={(event) => update('hintB', event.target.value)} /></label></div>
      <button type="button" className="reading-action" disabled={!lessonId || busy} onClick={save}>{busy ? '儲存中……' : form.id ? '更新此題' : '儲存新題'}</button>
      {form.id && <button type="button" className="reading-delete" disabled={busy} onClick={remove}>刪除此題</button>}
      <p role="status" className="reading-status">{status}</p>
    </div>
  </section>
}
