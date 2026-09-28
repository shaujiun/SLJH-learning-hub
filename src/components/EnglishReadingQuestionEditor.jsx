import { useEffect, useState } from 'react'
import { FileCheck2, Sparkles } from 'lucide-react'
import { deleteAdminReadingQuestion, loadAdminReadingQuestions, saveAdminReadingQuestion } from '../services/englishReadingQuestionService.js'

function blankQuestion(position = 1) {
  return { id: '', position, kind: 'choice', groupScope: 'all', prompt: '', options: ['', '', ''],
    answers: ['A'], explanation: '', evidenceSentence: '', hintA: '', hintB: '' }
}

export default function EnglishReadingQuestionEditor({
  lessonId, articleDraft, suggestedQuestions = [], onSuggestedQuestionsChange = () => {}, onAiAction, aiBusy = false,
}) {
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState(blankQuestion)
  const [suggestionIndex, setSuggestionIndex] = useState(null)
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!lessonId) { setQuestions([]); setForm(blankQuestion()); setSuggestionIndex(null); return }
    let active = true
    loadAdminReadingQuestions(lessonId).then((items) => {
      if (active) { setQuestions(items); setForm(blankQuestion(items.length + 1)); setStatus('') }
    }).catch((error) => { if (active) setStatus(error.message) })
    return () => { active = false }
  }, [lessonId])

  useEffect(() => {
    if (!suggestedQuestions.length || form.id || form.prompt || suggestionIndex !== null) return
    setForm({ ...blankQuestion(1), ...suggestedQuestions[0] })
    setSuggestionIndex(0)
  }, [suggestedQuestions, form.id, form.prompt, suggestionIndex])

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })) }

  async function save() {
    setBusy(true)
    try {
      await saveAdminReadingQuestion(form, lessonId)
      const items = await loadAdminReadingQuestions(lessonId)
      setQuestions(items)
      setForm(blankQuestion(items.length + 1))
      if (suggestionIndex !== null) onSuggestedQuestionsChange(suggestedQuestions.filter((_, index) => index !== suggestionIndex))
      setSuggestionIndex(null)
      setStatus('題目與正解已一起儲存。若文章已發布，開放期間內學生可立即看到此題。')
    } catch (error) { setStatus(error.message) }
    finally { setBusy(false) }
  }

  async function saveAllSuggested() {
    if (!lessonId || !suggestedQuestions.length) return
    setBusy(true)
    let completed = 0
    try {
      for (const item of suggestedQuestions) {
        await saveAdminReadingQuestion(item, lessonId)
        completed += 1
      }
      const items = await loadAdminReadingQuestions(lessonId)
      setQuestions(items)
      onSuggestedQuestionsChange([])
      setSuggestionIndex(null)
      setForm(blankQuestion(items.length + 1))
      setStatus(`已儲存 ${suggestedQuestions.length} 題及其私有正解。`)
    } catch (error) {
      onSuggestedQuestionsChange(suggestedQuestions.slice(completed))
      setQuestions(await loadAdminReadingQuestions(lessonId).catch(() => questions))
      setStatus(`已儲存前 ${completed} 題；其餘題目保留在待確認區。${error.message}`)
    }
    finally { setBusy(false) }
  }

  async function runAi(action) {
    if (!onAiAction) return
    const current = [...questions, ...suggestedQuestions]
    setStatus('')
    try {
      const result = await onAiAction(action, current)
      if (!result?.questions?.length) { setStatus(result?.message || '題目足夠，不必再生成新題目'); return }
      if (action === 'enrich_questions') {
        const enriched = result.questions.map((question, index) => ({ ...question, id: current[index]?.id || '' }))
        onSuggestedQuestionsChange(enriched)
        setStatus('解析、原文依據與分組提示已放入待確認區；儲存後才會更新學生題目。')
      } else {
        const lastPosition = current.reduce((largest, item) => Math.max(largest, Number(item.position) || 0), 0)
        const additions = result.questions.map((question, index) => ({ ...question, id: '', position: lastPosition + index + 1 }))
        onSuggestedQuestionsChange([...suggestedQuestions, ...additions])
        setStatus(`已新增 ${additions.length} 題到待確認區。`)
      }
      setForm(blankQuestion(current.length + 1))
      setSuggestionIndex(null)
    } catch (error) { setStatus(error.message) }
  }

  async function remove() {
    if (!form.id || !window.confirm('確定刪除此題及其作答紀錄？刪除後無法復原。')) return
    setBusy(true)
    try {
      await deleteAdminReadingQuestion(form.id)
      const items = await loadAdminReadingQuestions(lessonId)
      setQuestions(items)
      setForm(blankQuestion(items.length + 1))
      setSuggestionIndex(null)
      setStatus('題目、正解及該題作答紀錄已刪除。')
    } catch (error) { setStatus(error.message) }
    finally { setBusy(false) }
  }

  return <section className="reading-question-editor" aria-label="可作答題目編輯">
    <h2>可作答題目與私有正解</h2>
    <p>照片辨識的每一題會直接出現在此區，包含選項、正解、解析、原文依據與 A／B 組提示。正解不會隨學生題目資料下載。</p>
    {!lessonId && <p className="reading-warning">請先將文章存入資料庫草稿，再建立題目。</p>}
    <div className="reading-ai-question-actions">
      <button type="button" className="reading-action" disabled={aiBusy || !articleDraft?.english} onClick={() => runAi('evaluate_questions')}><FileCheck2 aria-hidden="true" />判斷是否需要新增題目</button>
      <button type="button" className="reading-action reading-ai-action" disabled={aiBusy || !articleDraft?.english || (!questions.length && !suggestedQuestions.length)} onClick={() => runAi('enrich_questions')}><Sparkles aria-hidden="true" />自動補上解析、原文依據與提示</button>
    </div>
    {suggestedQuestions.length > 0 && <section className="reading-suggested-questions">
      <div className="reading-suggestion-heading"><div><strong>AI 辨識待確認題目</strong><p>已直接帶入設定，不需從預覽區複製。請抽查照片文字與正解。</p></div><button type="button" className="reading-action" disabled={!lessonId || busy} onClick={saveAllSuggested}>全部儲存到題庫</button></div>
      <div className="reading-suggestion-list">{suggestedQuestions.map((item, index) => <article key={`${item.position}-${index}`}>
        <div><small>{item.kind === 'choice' ? '閱讀選擇' : '小試身手'}・第 {item.position} 題</small><h3>{item.prompt}</h3>
          {item.options?.length > 0 && <p>{item.options.map((option, optionIndex) => `${'ABCD'[optionIndex]}. ${option}`).join('　')}</p>}
          <p><b>正解：</b>{item.answers?.join('、') || '待確認'}　<b>解析：</b>{item.explanation || '待補'}</p>
          <p><b>原文依據：</b>{item.evidenceSentence || '待補'}</p></div>
        <div className="reading-suggestion-buttons"><button type="button" onClick={() => { setForm({ ...blankQuestion(item.position), ...item }); setSuggestionIndex(index); setStatus('') }}>校對這題</button><button type="button" onClick={() => { onSuggestedQuestionsChange(suggestedQuestions.filter((_, itemIndex) => itemIndex !== index)); if (suggestionIndex === index) { setForm(blankQuestion(questions.length + 1)); setSuggestionIndex(null) } }}>移除</button></div>
      </article>)}</div>
    </section>}
    {questions.length > 0 && <div className="reading-question-list">{questions.map((item) => <button type="button" key={item.id} onClick={() => { setForm(item); setSuggestionIndex(null); setStatus('') }}>
      {item.position}. {item.kind === 'choice' ? '選擇' : '填空'}・{item.prompt.slice(0, 35)}
    </button>)}</div>}
    <button type="button" disabled={!lessonId} onClick={() => { setForm(blankQuestion(questions.length + suggestedQuestions.length + 1)); setSuggestionIndex(null); setStatus('') }}>新增一題</button>
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
