import { useMemo, useRef, useState } from 'react'
import {
  Archive,
  Download,
  Eye,
  FileSpreadsheet,
  ImagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Upload,
  X,
} from 'lucide-react'
import {
  historyCategories,
  historyRegions,
  historyStatusLabel,
} from '../lib/historyAtlas.js'
import {
  downloadHistoryWorkbookTemplate,
  readHistoryWorkbook,
} from '../lib/historyWorkbook.js'
import {
  importHistoryEventRows,
  saveHistoryEvent,
  setHistoryEventStatus,
  uploadHistoryImage,
} from '../services/historyService.js'
import HistoryQuestionManager from './HistoryQuestionManager.jsx'

function emptyEvent(chapters) {
  const chapter = chapters[0]
  return {
    id: '',
    eventCode: '',
    chapterCode: chapter?.chapterCode || '',
    title: '',
    startYear: '',
    endYear: '',
    displayDate: '',
    region: 'china',
    category: 'politics',
    importance: 2,
    summary: '',
    causeText: '',
    processText: '',
    impactText: '',
    people: '',
    keywords: '',
    imageUrl: '',
    imageSource: '',
    imageSourceUrl: '',
    resourceUrl: '',
    sourceNote: '',
    displayOrder: 10,
    status: 'draft',
  }
}

function editEvent(event) {
  return {
    ...event,
    chapterCode: event.chapter?.chapterCode || '',
    endYear: event.endYear ?? '',
    people: (event.people || []).join('、'),
    keywords: (event.keywords || []).join('、'),
  }
}

function EventEditor({ chapters, value, onChange, onCancel, onSaved }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const imageInput = useRef(null)
  const update = (field, nextValue) => onChange({ ...value, [field]: nextValue })

  const handleSave = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await saveHistoryEvent(value, chapters)
      await onSaved('歷史事件已儲存。')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      update('imageUrl', await uploadHistoryImage(file))
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  return (
    <form className="history-event-editor" onSubmit={handleSave}>
      <div className="history-manager-title-row">
        <div>
          <p className="eyebrow">{value.id ? 'EDIT EVENT' : 'NEW EVENT'}</p>
          <h3>{value.id ? `編輯「${value.title}」` : '新增歷史事件'}</h3>
        </div>
        <button type="button" className="editor-close" onClick={onCancel} aria-label="關閉事件編輯"><X aria-hidden="true" /></button>
      </div>
      {error && <p className="manager-notice error-notice">{error}</p>}

      <div className="history-editor-grid compact-fields">
        <label><span>事件代碼</span><input value={value.eventCode} onChange={(event) => update('eventCode', event.target.value)} disabled={Boolean(value.id)} placeholder="例如 h3c1-09" required /></label>
        <label><span>對應章節</span><select value={value.chapterCode} onChange={(event) => update('chapterCode', event.target.value)}>{chapters.map((chapter) => <option key={chapter.id} value={chapter.chapterCode}>第 {chapter.volumeNo} 冊第 {chapter.chapterNo} 章｜{chapter.title}</option>)}</select></label>
        <label className="history-editor-wide"><span>事件名稱</span><input value={value.title} onChange={(event) => update('title', event.target.value)} required /></label>
        <label><span>開始年份</span><input type="number" value={value.startYear} onChange={(event) => update('startYear', event.target.value)} placeholder="西元前請輸入負數" required /></label>
        <label><span>結束年份</span><input type="number" value={value.endYear} onChange={(event) => update('endYear', event.target.value)} placeholder="單一年份可留空" /></label>
        <label><span>日期自訂顯示</span><input value={value.displayDate} onChange={(event) => update('displayDate', event.target.value)} placeholder="留空即自動顯示" /></label>
        <label><span>地區</span><select value={value.region} onChange={(event) => update('region', event.target.value)}>{historyRegions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        <label><span>事件類型</span><select value={value.category} onChange={(event) => update('category', event.target.value)}>{historyCategories.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        <label><span>重要程度</span><select value={value.importance} onChange={(event) => update('importance', event.target.value)}><option value="1">一般</option><option value="2">重要</option><option value="3">核心必學</option></select></label>
        <label><span>發布狀態</span><select value={value.status} onChange={(event) => update('status', event.target.value)}><option value="draft">草稿</option><option value="published">已發布</option><option value="archived">已封存</option></select></label>
        <label><span>顯示順序</span><input type="number" value={value.displayOrder} onChange={(event) => update('displayOrder', event.target.value)} /></label>
      </div>

      <div className="history-writing-grid">
        <label className="history-editor-full"><span>一句話重點</span><textarea rows="2" value={value.summary} onChange={(event) => update('summary', event.target.value)} /></label>
        <label><span>發生原因</span><textarea rows="4" value={value.causeText} onChange={(event) => update('causeText', event.target.value)} /></label>
        <label><span>事件經過</span><textarea rows="4" value={value.processText} onChange={(event) => update('processText', event.target.value)} /></label>
        <label><span>後續影響</span><textarea rows="4" value={value.impactText} onChange={(event) => update('impactText', event.target.value)} /></label>
        <label><span>重要人物</span><textarea rows="4" value={value.people} onChange={(event) => update('people', event.target.value)} placeholder="以頓號、逗號或分號分隔" /></label>
      </div>

      <div className="history-editor-grid">
        <label><span>關鍵詞</span><input value={value.keywords} onChange={(event) => update('keywords', event.target.value)} placeholder="以頓號、逗號或分號分隔" /></label>
        <label><span>延伸文章或影片網址</span><input type="url" value={value.resourceUrl} onChange={(event) => update('resourceUrl', event.target.value)} /></label>
        <label className="history-editor-wide"><span>圖片網址</span><div className="history-image-field"><input type="url" value={value.imageUrl} onChange={(event) => update('imageUrl', event.target.value)} /><input ref={imageInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImage} /><button type="button" onClick={() => imageInput.current?.click()} disabled={busy}><ImagePlus aria-hidden="true" />上傳圖片</button></div></label>
        <label><span>圖片出處名稱</span><input value={value.imageSource} onChange={(event) => update('imageSource', event.target.value)} /></label>
        <label><span>圖片出處網址</span><input type="url" value={value.imageSourceUrl} onChange={(event) => update('imageSourceUrl', event.target.value)} /></label>
        <label className="history-editor-wide"><span>資料來源備註</span><input value={value.sourceNote} onChange={(event) => update('sourceNote', event.target.value)} /></label>
      </div>

      <div className="editor-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>取消</button>
        <button className="primary-button" type="submit" disabled={busy}>{busy ? <RefreshCw className="spin-icon" aria-hidden="true" /> : <Save aria-hidden="true" />}儲存事件</button>
      </div>
    </form>
  )
}

function WorkbookImporter({ chapters, onImported }) {
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
      setPreview(await readHistoryWorkbook(file, chapters))
    } catch (readError) {
      setPreview(null)
      setError(`無法讀取 Excel：${readError.message}`)
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
      const result = await importHistoryEventRows(preview.rows, mode)
      setMessage(`已匯入 ${result.imported} 筆草稿；跳過 ${result.skipped} 筆。`)
      setPreview(null)
      await onImported()
    } catch (importError) {
      setError(importError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="history-importer" aria-labelledby="history-import-title">
      <div className="history-manager-title-row">
        <div><p className="eyebrow">EXCEL IMPORT</p><h3 id="history-import-title">批次匯入歷史事件</h3><p>先下載範本；所有匯入資料都會先成為草稿。</p></div>
        <button type="button" className="secondary-button" onClick={() => downloadHistoryWorkbookTemplate(chapters)}><Download aria-hidden="true" />下載範本</button>
      </div>
      {message && <p className="manager-notice success-notice">{message}</p>}
      {error && <p className="manager-notice error-notice">{error}</p>}
      <div className="history-import-actions">
        <label className="file-picker-button"><FileSpreadsheet aria-hidden="true" />選擇 Excel<input hidden type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={chooseFile} /></label>
        <label><span>事件代碼重複時</span><select value={mode} onChange={(event) => setMode(event.target.value)}><option value="update">更新既有事件</option><option value="skip">跳過既有事件</option></select></label>
      </div>
      {busy && <p className="manager-empty"><RefreshCw className="spin-icon" aria-hidden="true" />正在處理資料……</p>}
      {preview && (
        <div className="history-import-preview">
          <strong>預覽：可匯入 {preview.rows.length} 筆，錯誤 {preview.errors.length} 筆</strong>
          {preview.errors.length > 0 && <ul>{preview.errors.slice(0, 12).map((item) => <li key={item}>{item}</li>)}</ul>}
          {preview.rows.length > 0 && <div className="history-preview-table"><table><thead><tr><th>列</th><th>事件代碼</th><th>章節</th><th>事件名稱</th><th>年份</th></tr></thead><tbody>{preview.rows.slice(0, 10).map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.input.eventCode}</td><td>{row.input.chapterCode}</td><td>{row.input.title}</td><td>{row.input.startYear}</td></tr>)}</tbody></table></div>}
          <button className="primary-button" type="button" onClick={executeImport} disabled={busy || preview.errors.length > 0}><Upload aria-hidden="true" />確認匯入為草稿</button>
        </div>
      )}
    </section>
  )
}

export default function HistoryContentManager({ chapters, events, onChanged }) {
  const [managerSection, setManagerSection] = useState('events')
  const [editor, setEditor] = useState(null)
  const [statusFilter, setStatusFilter] = useState('draft')
  const [chapterFilter, setChapterFilter] = useState('')
  const [keyword, setKeyword] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState({ message: '', error: '' })

  const visibleEvents = useMemo(() => events.filter((event) => {
    if (statusFilter && event.status !== statusFilter) return false
    if (chapterFilter && event.chapterId !== chapterFilter) return false
    const term = keyword.trim().toLocaleLowerCase('zh-Hant')
    return !term || `${event.eventCode} ${event.title} ${event.summary}`.toLocaleLowerCase('zh-Hant').includes(term)
  }), [chapterFilter, events, keyword, statusFilter])

  const refresh = async (message = '') => {
    setEditor(null)
    setNotice({ message, error: '' })
    await onChanged()
  }

  const changeStatus = async (event, status) => {
    setBusy(true)
    setNotice({ message: '', error: '' })
    try {
      await setHistoryEventStatus(event.id, status)
      await refresh(status === 'published' ? '事件已發布。' : status === 'archived' ? '事件已封存。' : '事件已改回草稿。')
    } catch (error) {
      setNotice({ message: '', error: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="history-content-manager" aria-labelledby="history-manager-title">
      <div className="history-manager-title-row">
        <div><p className="eyebrow">HISTORY ADMIN</p><h2 id="history-manager-title">歷史內容管理</h2><p>草稿須確認內容與來源後再發布；歷史老師只能管理歷史科內容。</p></div>
        {managerSection === 'events' && <button className="manager-add-button" type="button" onClick={() => setEditor(emptyEvent(chapters))}><Plus aria-hidden="true" />新增事件</button>}
      </div>
      <div className="history-manager-tabs" role="tablist" aria-label="歷史內容管理項目">
        <button type="button" role="tab" aria-selected={managerSection === 'events'} className={managerSection === 'events' ? 'is-active' : ''} onClick={() => setManagerSection('events')}>事件管理</button>
        <button type="button" role="tab" aria-selected={managerSection === 'questions'} className={managerSection === 'questions' ? 'is-active' : ''} onClick={() => { setManagerSection('questions'); setEditor(null) }}>題庫管理</button>
      </div>
      {managerSection === 'questions' ? <HistoryQuestionManager events={events} onChanged={onChanged} /> : <>
      {notice.message && <p className="manager-notice success-notice">{notice.message}</p>}
      {notice.error && <p className="manager-notice error-notice">{notice.error}</p>}

      {editor && <EventEditor chapters={chapters} value={editor} onChange={setEditor} onCancel={() => setEditor(null)} onSaved={refresh} />}
      <WorkbookImporter chapters={chapters} onImported={onChanged} />

      <div className="history-manager-filters">
        <label><span>狀態</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">全部</option><option value="draft">草稿</option><option value="published">已發布</option><option value="archived">已封存</option></select></label>
        <label><span>章節</span><select value={chapterFilter} onChange={(event) => setChapterFilter(event.target.value)}><option value="">全部章節</option>{chapters.map((chapter) => <option value={chapter.id} key={chapter.id}>第 {chapter.volumeNo} 冊第 {chapter.chapterNo} 章</option>)}</select></label>
        <label className="history-filter-search"><span>搜尋</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="事件代碼、名稱或摘要" /></label>
        <strong>{visibleEvents.length} 筆</strong>
      </div>

      <div className="history-manager-list">
        {visibleEvents.length === 0 ? <p className="manager-empty">目前沒有符合條件的事件。</p> : visibleEvents.map((event) => (
          <article key={event.id} className={`history-manager-row is-${event.status}`}>
            <div className="history-manager-event-copy">
              <div><code>{event.eventCode}</code><span>{historyStatusLabel(event.status)}</span><small>第 {event.chapter?.volumeNo} 冊第 {event.chapter?.chapterNo} 章</small></div>
              <h3>{event.title}</h3>
              <p>{event.summary || '尚未填寫一句話重點。'}</p>
            </div>
            <div className="history-manager-row-actions">
              <button type="button" onClick={() => setEditor(editEvent(event))} disabled={busy}><Pencil aria-hidden="true" />編輯</button>
              {event.status !== 'published' && <button type="button" onClick={() => changeStatus(event, 'published')} disabled={busy}><Eye aria-hidden="true" />發布</button>}
              {event.status === 'published' && <button type="button" onClick={() => changeStatus(event, 'draft')} disabled={busy}><RefreshCw aria-hidden="true" />改回草稿</button>}
              {event.status !== 'archived' && <button type="button" onClick={() => changeStatus(event, 'archived')} disabled={busy}><Archive aria-hidden="true" />封存</button>}
            </div>
          </article>
        ))}
      </div>
      </>}
    </section>
  )
}
