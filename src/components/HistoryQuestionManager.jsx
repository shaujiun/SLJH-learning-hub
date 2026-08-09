import { useMemo, useState } from 'react'
import {
  Archive,
  BookMarked,
  Download,
  Eye,
  FileSpreadsheet,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Upload,
  X,
} from 'lucide-react'
import {
  historyQuestionSourceLabel,
  historyQuestionTypeLabel,
  historyStatusLabel,
  parseHistoryQuestionMedia,
  parseHistoryQuestionOptions,
} from '../lib/historyAtlas.js'
import { loadOfficialHistoryQuestionPreview } from '../lib/historyOfficialQuestions.js'
import {
  downloadHistoryQuestionWorkbookTemplate,
  readHistoryQuestionWorkbook,
} from '../lib/historyWorkbook.js'
import {
  importHistoryQuestionRows,
  saveHistoryQuestion,
  setHistoryQuestionStatus,
} from '../services/historyService.js'

function emptyQuestion(events) {
  return {
    id: '',
    questionCode: '',
    eventId: events[0]?.id || '',
    questionType: 'practice',
    prompt: '',
    options: [],
    mediaUrls: [],
    tables: [],
    answer: '',
    explanation: '',
    sourceName: '石榴國中教師自編',
    sourceYear: '',
    sourceUrl: '',
    originalEventIds: [],
    mappingConfidence: 0,
    mappingNote: '',
    displayOrder: 10,
    status: 'draft',
  }
}

function OfficialQuestionImporter({ events, onImported }) {
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadPreview = async () => {
    setBusy(true)
    setMessage('')
    setError('')
    try {
      setPreview(await loadOfficialHistoryQuestionPreview(events))
    } catch (loadError) {
      setPreview(null)
      setError(`無法讀取正式試題快照：${loadError.message}`)
    } finally {
      setBusy(false)
    }
  }

  const executeImport = async () => {
    if (!preview?.rows?.length || preview.errors.length > 0) return
    setBusy(true)
    setMessage('')
    setError('')
    try {
      const result = await importHistoryQuestionRows(preview.rows, 'update')
      setMessage(`已匯入或更新 ${result.imported} 題正式試題草稿。所有題目仍須個別發布。`)
      setPreview(null)
      await onImported()
    } catch (importError) {
      setError(importError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="history-importer history-official-question-importer" aria-labelledby="history-official-question-title">
      <div className="history-manager-title-row">
        <div>
          <p className="eyebrow">OFFICIAL EXAMS</p>
          <h3 id="history-official-question-title">基測與會考正式試題</h3>
          <p>已依題幹、答案及原事件標記配對八年級章節；不會匯入原網站自行撰寫的解析。</p>
        </div>
        <button type="button" className="secondary-button" onClick={loadPreview} disabled={busy}><BookMarked aria-hidden="true" />讀取匯入預覽</button>
      </div>
      {message && <p className="manager-notice success-notice">{message}</p>}
      {error && <p className="manager-notice error-notice">{error}</p>}
      {busy && <p className="manager-empty"><RefreshCw className="spin-icon" aria-hidden="true" />正在整理正式試題……</p>}
      {preview && (
        <div className="history-official-question-preview">
          <div className="history-official-question-stats">
            <span><b>{preview.rows.length}</b>可匯入題目</span>
            <span><b>{preview.highConfidenceCount}</b>高信心配對</span>
            <span><b>{preview.mediaCount}</b>含題目附圖</span>
            <span><b>{preview.tableCount}</b>含題目附表</span>
          </div>
          <p>來源資料版本：{preview.meta.sourceBuild || '未標示'}。匯入後一律為草稿，不會立即顯示給學生。</p>
          {preview.errors.length > 0 && <div className="manager-notice error-notice"><b>目前有 {preview.errors.length} 題無法匯入：</b><ul>{preview.errors.slice(0, 12).map((item) => <li key={item}>{item}</li>)}</ul></div>}
          <button className="primary-button" type="button" onClick={executeImport} disabled={busy || preview.errors.length > 0}><Upload aria-hidden="true" />確認匯入 {preview.rows.length} 題草稿</button>
        </div>
      )}
    </section>
  )
}

function QuestionWorkbookImporter({ events, onImported }) {
  const [preview, setPreview] = useState(null)
  const [mode, setMode] = useState('update')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const chooseFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setMessage('')
    setError('')
    try {
      setPreview(await readHistoryQuestionWorkbook(file, events))
    } catch (readError) {
      setPreview(null)
      setError(`無法讀取題庫 Excel：${readError.message}`)
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  const executeImport = async () => {
    if (!preview?.rows?.length || preview.errors.length > 0) return
    setBusy(true)
    setMessage('')
    setError('')
    try {
      const result = await importHistoryQuestionRows(preview.rows, mode)
      setMessage(`已匯入 ${result.imported} 題草稿；跳過 ${result.skipped} 題。`)
      setPreview(null)
      await onImported()
    } catch (importError) {
      setError(importError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="history-importer history-question-importer" aria-labelledby="history-question-import-title">
      <div className="history-manager-title-row">
        <div><p className="eyebrow">QUESTION EXCEL</p><h3 id="history-question-import-title">批次匯入歷史題目</h3><p>題目一律先匯入為草稿，歷屆題需保留來源。</p></div>
        <button type="button" className="secondary-button" onClick={() => downloadHistoryQuestionWorkbookTemplate(events)}><Download aria-hidden="true" />下載題庫範本</button>
      </div>
      {message && <p className="manager-notice success-notice">{message}</p>}
      {error && <p className="manager-notice error-notice">{error}</p>}
      <div className="history-import-actions">
        <label className="file-picker-button"><FileSpreadsheet aria-hidden="true" />選擇 Excel<input hidden type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={chooseFile} /></label>
        <label><span>題目代碼重複時</span><select value={mode} onChange={(event) => setMode(event.target.value)}><option value="update">更新既有題目</option><option value="skip">跳過既有題目</option></select></label>
      </div>
      {busy && <p className="manager-empty"><RefreshCw className="spin-icon" aria-hidden="true" />正在處理題庫……</p>}
      {preview && (
        <div className="history-import-preview">
          <strong>預覽：可匯入 {preview.rows.length} 題，錯誤 {preview.errors.length} 題</strong>
          {preview.errors.length > 0 && <ul>{preview.errors.slice(0, 12).map((item) => <li key={item}>{item}</li>)}</ul>}
          {preview.rows.length > 0 && <div className="history-preview-table"><table><thead><tr><th>列</th><th>題目代碼</th><th>事件代碼</th><th>類型</th><th>題目</th></tr></thead><tbody>{preview.rows.slice(0, 10).map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.input.questionCode}</td><td>{row.eventCode}</td><td>{historyQuestionTypeLabel(row.input.questionType)}</td><td>{row.input.prompt}</td></tr>)}</tbody></table></div>}
          <button className="primary-button" type="button" onClick={executeImport} disabled={busy || preview.errors.length > 0}><Upload aria-hidden="true" />確認匯入為草稿</button>
        </div>
      )}
    </section>
  )
}

function flattenQuestions(events) {
  return events.flatMap((event) => [
    ...(event.pastQuestions || []),
    ...(event.practiceQuestions || []),
  ].map((question) => ({ ...question, event })))
}

function QuestionEditor({ events, value, onChange, onCancel, onSaved }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const update = (field, nextValue) => onChange({ ...value, [field]: nextValue })

  const handleSave = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await saveHistoryQuestion({
        ...value,
        options: value.optionsText == null ? value.options : parseHistoryQuestionOptions(value.optionsText),
        mediaUrls: value.mediaUrlsText == null ? value.mediaUrls : parseHistoryQuestionMedia(value.mediaUrlsText),
      }, events)
      await onSaved('歷史題目已儲存。')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="history-question-editor" onSubmit={handleSave}>
      <div className="history-manager-title-row">
        <div><p className="eyebrow">QUESTION EDITOR</p><h3>{value.id ? '編輯歷史題目' : '新增歷史題目'}</h3></div>
        <button type="button" className="editor-close" onClick={onCancel} aria-label="關閉題目編輯"><X aria-hidden="true" /></button>
      </div>
      {error && <p className="manager-notice error-notice">{error}</p>}

      <div className="history-editor-grid compact-fields">
        <label><span>題目代碼</span><input value={value.questionCode} onChange={(event) => update('questionCode', event.target.value)} disabled={Boolean(value.id)} placeholder="例如 h3c1-01-q01" required /></label>
        <label className="history-editor-wide"><span>對應事件</span><select value={value.eventId} onChange={(event) => update('eventId', event.target.value)}>{events.map((item) => <option value={item.id} key={item.id}>第 {item.chapter?.volumeNo} 冊第 {item.chapter?.chapterNo} 章｜{item.title}</option>)}</select></label>
        <label><span>題目類型</span><select value={value.questionType} onChange={(event) => {
          const questionType = event.target.value
          onChange({
            ...value,
            questionType,
            sourceName: questionType === 'past'
              ? (value.sourceName === '石榴國中教師自編' ? '' : value.sourceName)
              : (value.sourceName || '石榴國中教師自編'),
          })
        }}><option value="practice">教師自編題</option><option value="past">歷屆題</option></select></label>
        <label><span>發布狀態</span><select value={value.status} onChange={(event) => update('status', event.target.value)}><option value="draft">草稿</option><option value="published">已發布</option><option value="archived">已封存</option></select></label>
        <label><span>顯示順序</span><input type="number" value={value.displayOrder} onChange={(event) => update('displayOrder', event.target.value)} /></label>
      </div>

      <div className="history-question-writing-grid">
        <label><span>題目內容</span><textarea rows="4" value={value.prompt} onChange={(event) => update('prompt', event.target.value)} required /></label>
        <label><span>參考答案</span><textarea rows="4" value={value.answer} onChange={(event) => update('answer', event.target.value)} required /></label>
        <label className="history-editor-full"><span>選項（每行一個，例如 A｜選項內容）</span><textarea rows="5" value={value.optionsText ?? (value.options || []).map((item) => `${item.key}｜${item.text}`).join('\n')} onChange={(event) => update('optionsText', event.target.value)} /></label>
        <label className="history-editor-full"><span>題目圖片網址（每行一個）</span><textarea rows="2" value={value.mediaUrlsText ?? (value.mediaUrls || []).join('\n')} onChange={(event) => update('mediaUrlsText', event.target.value)} /></label>
        <label className="history-editor-full"><span>解析</span><textarea rows="3" value={value.explanation} onChange={(event) => update('explanation', event.target.value)} /></label>
      </div>

      <div className="history-editor-grid">
        <label><span>{value.questionType === 'past' ? '考試或題目來源' : '自編單位'}</span><input value={value.sourceName} onChange={(event) => update('sourceName', event.target.value)} required={value.questionType === 'past'} placeholder={value.questionType === 'past' ? '例如：國中教育會考' : '例如：石榴國中教師自編'} /></label>
        <label><span>來源年度</span><input value={value.sourceYear} onChange={(event) => update('sourceYear', event.target.value)} placeholder="例如：114 年" /></label>
        <label className="history-editor-wide"><span>來源網址</span><input type="url" value={value.sourceUrl} onChange={(event) => update('sourceUrl', event.target.value)} placeholder="若有公開來源可填寫" /></label>
      </div>

      <p className="history-question-source-note">歷屆題發布前必須確認來源；教師自編題會明確顯示自編單位，不會標示成歷屆題。</p>
      {value.mappingConfidence > 0 && <p className="history-question-mapping-note"><b>自動配對信心：{value.mappingConfidence}%</b>{value.mappingNote && <span>{value.mappingNote}</span>}</p>}
      <div className="editor-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>取消</button>
        <button className="primary-button" type="submit" disabled={busy}>{busy ? <RefreshCw className="spin-icon" aria-hidden="true" /> : <Save aria-hidden="true" />}儲存題目</button>
      </div>
    </form>
  )
}

export default function HistoryQuestionManager({ events, onChanged }) {
  const [editor, setEditor] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('draft')
  const [keyword, setKeyword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState({ message: '', error: '' })
  const questions = useMemo(() => flattenQuestions(events), [events])
  const visibleQuestions = useMemo(() => questions.filter((question) => {
    if (typeFilter && question.questionType !== typeFilter) return false
    if (statusFilter && question.status !== statusFilter) return false
    const term = keyword.trim().toLocaleLowerCase('zh-Hant')
    return !term || [question.questionCode, question.prompt, question.event?.title, historyQuestionSourceLabel(question)]
      .join(' ').toLocaleLowerCase('zh-Hant').includes(term)
  }), [keyword, questions, statusFilter, typeFilter])

  const refresh = async (message = '') => {
    setEditor(null)
    setNotice({ message, error: '' })
    await onChanged()
  }

  const changeStatus = async (question, status) => {
    setBusy(true)
    setNotice({ message: '', error: '' })
    try {
      await setHistoryQuestionStatus(question.id, status)
      await refresh(status === 'published' ? '題目已發布。' : status === 'archived' ? '題目已封存。' : '題目已改回草稿。')
    } catch (error) {
      setNotice({ message: '', error: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="history-question-manager" aria-labelledby="history-question-manager-title">
      <div className="history-question-manager-heading">
        <div><h3 id="history-question-manager-title">歷史題庫管理</h3><p>題目發布後，才會出現在學生的事件詳情與題庫中。</p></div>
        <button className="manager-add-button" type="button" onClick={() => setEditor(emptyQuestion(events))} disabled={events.length === 0}><Plus aria-hidden="true" />新增題目</button>
      </div>
      {notice.message && <p className="manager-notice success-notice">{notice.message}</p>}
      {notice.error && <p className="manager-notice error-notice">{notice.error}</p>}
      {editor && <QuestionEditor events={events} value={editor} onChange={setEditor} onCancel={() => setEditor(null)} onSaved={refresh} />}
      <OfficialQuestionImporter events={events} onImported={onChanged} />
      <QuestionWorkbookImporter events={events} onImported={onChanged} />

      <div className="history-manager-filters">
        <label><span>類型</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="">全部</option><option value="practice">教師自編題</option><option value="past">歷屆題</option></select></label>
        <label><span>狀態</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">全部</option><option value="draft">草稿</option><option value="published">已發布</option><option value="archived">已封存</option></select></label>
        <label className="history-filter-search"><span>搜尋</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="題目、事件或來源" /></label>
        <strong>{visibleQuestions.length} 題</strong>
      </div>

      <div className="history-manager-list history-question-manager-list">
        {visibleQuestions.length === 0 ? <p className="manager-empty">目前沒有符合條件的題目。</p> : visibleQuestions.map((question) => (
          <article key={question.id} className={`history-manager-row is-${question.status}`}>
            <div className="history-manager-event-copy">
              <div><code>{question.questionCode}</code><span>{historyStatusLabel(question.status)}</span><small>{historyQuestionTypeLabel(question.questionType)}</small></div>
              <h3>{question.event?.title || '尚未指定事件'}</h3>
              <p>{question.prompt}</p>
              <small className="history-question-manager-source">來源：{historyQuestionSourceLabel(question)}</small>
              {question.mappingConfidence > 0 && <small className="history-question-confidence">章節配對 {question.mappingConfidence}%</small>}
            </div>
            <div className="history-manager-row-actions">
              <button type="button" onClick={() => setEditor({ ...question })} disabled={busy}><Pencil aria-hidden="true" />編輯</button>
              {question.status !== 'published' && <button type="button" onClick={() => changeStatus(question, 'published')} disabled={busy}><Eye aria-hidden="true" />發布</button>}
              {question.status === 'published' && <button type="button" onClick={() => changeStatus(question, 'draft')} disabled={busy}><RefreshCw aria-hidden="true" />改回草稿</button>}
              {question.status !== 'archived' && <button type="button" onClick={() => changeStatus(question, 'archived')} disabled={busy}><Archive aria-hidden="true" />封存</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
