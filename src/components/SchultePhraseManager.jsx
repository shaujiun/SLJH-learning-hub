import { useEffect, useState } from 'react'
import { FileSpreadsheet, FileText, Pencil, Plus, Save, Trash2, Upload, X } from 'lucide-react'
import {
  importSchultePhrases,
  loadSchulteContentManagerAccess,
  loadSchultePhrases,
  removeSchultePhrase,
  saveSchultePhrase,
} from '../services/schulteService.js'
import {
  downloadSchultePhraseExcelTemplate,
  downloadSchultePhraseWordTemplate,
  normalizePhraseImportRows,
  readSchultePhraseFile,
} from '../lib/schultePhraseWorkbook.js'

const emptyForm = {
  id: '',
  category: 'quote',
  title: '',
  content: '',
  meaning: '',
  source: '',
  distractorCharacters: '',
  isActive: true,
}

export default function SchultePhraseManager() {
  const [allowed, setAllowed] = useState(false)
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null)

  const refresh = async () => {
    const canManage = await loadSchulteContentManagerAccess()
    setAllowed(canManage)
    if (canManage) setItems(await loadSchultePhrases({ includeInactive: true }))
  }

  useEffect(() => {
    refresh().catch(() => setAllowed(false))
  }, [])

  if (!allowed) return null

  const editItem = (item = emptyForm) => {
    setForm({ ...emptyForm, ...item })
    setOpen(true)
    setMessage('')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim() || !form.meaning.trim()) {
      setMessage('請填寫標題、完整句子與句義提示。')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const normalized = normalizePhraseImportRows([{ ...form, rowNumber: 1 }])
      if (normalized.errors.length) {
        setMessage(normalized.errors[0])
        setBusy(false)
        return
      }
      if (form.id && normalized.rows.length > 1) {
        setMessage('編輯中的句子超過 20 個文字，請拆成多題後分別新增。')
        setBusy(false)
        return
      }
      if (form.id) await saveSchultePhrase({ ...normalized.rows[0], id: form.id })
      else await importSchultePhrases(normalized.rows)
      await refresh()
      setOpen(false)
      setForm(emptyForm)
      setMessage('內容已儲存。')
    } catch (error) {
      setMessage(`儲存失敗：${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const selectImportFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      setPreview({ ...(await readSchultePhraseFile(file)), filename: file.name })
    } catch (error) {
      setPreview(null)
      setMessage(`檔案讀取失敗：${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const executeImport = async () => {
    if (!preview?.rows.length || preview.errors.length) return
    setBusy(true)
    try {
      const result = await importSchultePhrases(preview.rows)
      await refresh()
      setPreview(null)
      setMessage(`已匯入或更新 ${result.imported} 題。`)
    } catch (error) {
      setMessage(`匯入失敗：${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`確定刪除「${item.title}」嗎？`)) return
    setBusy(true)
    try {
      await removeSchultePhrase(item.id)
      await refresh()
      setMessage('內容已刪除。')
    } catch (error) {
      setMessage(`刪除失敗：${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="phrase-manager" aria-labelledby="phrase-manager-title">
      <div className="focus-section-heading">
        <div><small>CONTENT MANAGER</small><h2 id="phrase-manager-title">詩句與名言題庫</h2></div>
        <button type="button" onClick={() => editItem()}><Plus aria-hidden="true" />新增內容</button>
      </div>
      <p>管理者與已核准教師可建立詩句或名言。標點符號會由遊戲自動放回正確位置，不會成為選項。</p>
      {message && <div className="phrase-manager-message" role="status">{message}</div>}

      <div className="phrase-import-panel">
        <div>
          <small>BATCH IMPORT</small>
          <h3>批次匯入題庫</h3>
          <p>支援 <b>Excel（.xlsx）</b> 與 <b>Word（.docx）</b>。長句會自動拆成每題最多 20 個正確文字，相同句子會更新原題。</p>
        </div>
        <div className="phrase-import-actions">
          <button type="button" onClick={downloadSchultePhraseExcelTemplate}><FileSpreadsheet aria-hidden="true" />下載一般練習 Excel 範本</button>
          <button type="button" onClick={downloadSchultePhraseWordTemplate}><FileText aria-hidden="true" />下載一般練習 Word 範本</button>
          <label className="phrase-import-file"><Upload aria-hidden="true" />選擇匯入檔案
            <input type="file" accept=".xlsx,.docx" onChange={selectImportFile} disabled={busy} />
          </label>
        </div>
      </div>

      {preview && (
        <div className="phrase-import-preview">
          <strong>{preview.filename}：可匯入 {preview.rows.length} 題，錯誤 {preview.errors.length} 筆</strong>
          {preview.errors.length > 0 && <ul>{preview.errors.slice(0, 10).map((error) => <li key={error}>{error}</li>)}</ul>}
          {preview.rows.length > 0 && (
            <div className="phrase-import-preview-list">
              {preview.rows.slice(0, 8).map((row, index) => <span key={`${row.content}-${index}`}>{row.title}：{row.content}</span>)}
            </div>
          )}
          <div className="phrase-manager-actions">
            <button type="button" onClick={executeImport} disabled={busy || preview.errors.length > 0 || !preview.rows.length}><Upload aria-hidden="true" />確認匯入</button>
            <button type="button" onClick={() => setPreview(null)} disabled={busy}><X aria-hidden="true" />取消</button>
          </div>
        </div>
      )}

      {open && (
        <form className="phrase-manager-form" onSubmit={submit}>
          <label>類型
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option value="quote">名言佳句</option>
              <option value="poem">詩句</option>
            </select>
          </label>
          <label>標題
            <input value={form.title} maxLength="50" onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="phrase-manager-wide">完整句子
            <textarea value={form.content} maxLength="120" rows="2" onChange={(event) => setForm({ ...form, content: event.target.value })} />
          </label>
          <label className="phrase-manager-wide">句義提示
            <textarea value={form.meaning} maxLength="240" rows="2" onChange={(event) => setForm({ ...form, meaning: event.target.value })} />
          </label>
          <label>出處
            <input value={form.source} maxLength="80" onChange={(event) => setForm({ ...form, source: event.target.value })} />
          </label>
          <label>自訂干擾字
            <input value={form.distractorCharacters} maxLength="120" placeholder="可留空，由系統自動補足" onChange={(event) => setForm({ ...form, distractorCharacters: event.target.value })} />
          </label>
          <label className="phrase-manager-check">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />啟用
          </label>
          <div className="phrase-manager-actions">
            <button type="submit" disabled={busy}><Save aria-hidden="true" />儲存</button>
            <button type="button" disabled={busy} onClick={() => setOpen(false)}><X aria-hidden="true" />取消</button>
          </div>
        </form>
      )}

      <div className="phrase-manager-list">
        {items.length === 0 && <p>目前尚未建立內容。</p>}
        {items.map((item) => (
          <article key={item.id} className={!item.isActive ? 'is-inactive' : ''}>
            <div>
              <small>{item.category === 'poem' ? '詩句' : '名言佳句'}・{item.isActive ? '使用中' : '已停用'}</small>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
              <span>{item.source || '未填出處'}・提示：{item.meaning}</span>
              {item.distractorCharacters && <span>自訂干擾字：{item.distractorCharacters}</span>}
            </div>
            <div className="phrase-manager-row-actions">
              <button type="button" onClick={() => editItem(item)}><Pencil aria-hidden="true" />編輯</button>
              <button type="button" onClick={() => remove(item)} disabled={busy}><Trash2 aria-hidden="true" />刪除</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
