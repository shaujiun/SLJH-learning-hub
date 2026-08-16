import { useEffect, useState } from 'react'
import { CalendarDays, FileSpreadsheet, FileText, Trash2, Upload, X } from 'lucide-react'
import {
  importSchulteMemorizationBatches,
  importSchultePhrases,
  loadSchulteMemorizationClasses,
  loadSchulteMemorizationManagerAccess,
  loadSchulteMemorizationSets,
  removeSchulteMemorizationSet,
} from '../services/schulteService.js'
import {
  downloadSchulteMemorizationExcelTemplate,
  downloadSchulteMemorizationWordTemplate,
  readSchulteMemorizationFile,
} from '../lib/schulteMemorizationWorkbook.js'

function formatDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  return `${year}/${month}/${day}`
}

export default function SchulteMemorizationManager() {
  const [allowed, setAllowed] = useState(false)
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')
  const [sets, setSets] = useState([])
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    Promise.all([loadSchulteMemorizationManagerAccess(), loadSchulteMemorizationClasses()])
      .then(([canManage, loadedClasses]) => {
        setAllowed(canManage)
        if (!canManage) return
        setClasses(loadedClasses)
        setClassId(loadedClasses[0]?.id || '')
      })
      .catch(() => setAllowed(false))
  }, [])

  useEffect(() => {
    if (!allowed || !classId) return
    loadSchulteMemorizationSets(classId).then(setSets).catch((error) => setMessage(`無法讀取背誦題庫：${error.message}`))
  }, [allowed, classId])

  if (!allowed) return null

  const selectFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      setPreview({ ...(await readSchulteMemorizationFile(file)), filename: file.name })
    } catch (error) {
      setPreview(null)
      setMessage(`無法讀取檔案：${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const executeImport = async () => {
    if (!classId || !preview?.rows?.length || preview.errors.length) return
    setBusy(true)
    setMessage('')
    try {
      const result = await importSchulteMemorizationBatches(classId, preview.batches)
      const generalRows = preview.generalRows || []
      const generalResult = generalRows.length
        ? await importSchultePhrases(generalRows.map((item) => ({
          category: 'quote',
          title: item.content.slice(0, 20),
          content: item.content,
          meaning: item.meaning,
          source: item.source || '',
          distractorCharacters: '',
          isActive: true,
        })))
        : { imported: 0 }
      setSets(await loadSchulteMemorizationSets(classId))
      setPreview(null)
      setMessage(`已匯入 ${result.importedBatches} 個週五測驗批次、${result.importedPhrases} 句指定佳句，另有 ${generalResult.imported} 句只加入一般練習。`)
    } catch (error) {
      setMessage(`匯入失敗：${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  const removeSet = async (item) => {
    if (!window.confirm(`確定刪除 ${formatDate(item.testDate)} 的 5 句背誦安排嗎？一般練習題庫中的佳句仍會保留。`)) return
    setBusy(true)
    try {
      await removeSchulteMemorizationSet(item.id)
      setSets(await loadSchulteMemorizationSets(classId))
      setMessage('背誦安排已刪除；佳句仍保留於一般練習。')
    } catch (error) {
      setMessage(`刪除失敗：${error.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="phrase-manager memorization-manager" aria-labelledby="memorization-manager-title">
      <div className="focus-section-heading">
        <div><small>FRIDAY RECITATION</small><h2 id="memorization-manager-title">週五名言佳句背誦</h2></div>
        <CalendarDays aria-hidden="true" />
      </div>
      <p>僅管理者可設定。有填測驗日期的內容會加入週五背誦及一般練習；日期留空則只加入一般練習。</p>
      {message && <div className="phrase-manager-message" role="status">{message}</div>}

      <div className="phrase-import-panel">
        <div>
          <label className="memorization-class-select">套用班級
            <select value={classId} onChange={(event) => setClassId(event.target.value)}>
              {classes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
            </select>
          </label>
          <small>BATCH IMPORT</small>
          <h3>匯入名言佳句與選填測驗日期</h3>
          <p>支援 Excel（.xlsx）與 Word（.docx）。測驗日期可留空；有填日期時，同一天必須剛好 5 句。</p>
        </div>
        <div className="phrase-import-actions">
          <button type="button" onClick={downloadSchulteMemorizationExcelTemplate}><FileSpreadsheet aria-hidden="true" />下載週五背誦 Excel 範本</button>
          <button type="button" onClick={downloadSchulteMemorizationWordTemplate}><FileText aria-hidden="true" />下載週五背誦 Word 範本</button>
          <label className="phrase-import-file"><Upload aria-hidden="true" />選擇匯入檔案
            <input type="file" accept=".xlsx,.docx" onChange={selectFile} disabled={busy || !classId} />
          </label>
        </div>
      </div>

      {preview && (
        <div className="phrase-import-preview">
          <strong>{preview.filename}：{preview.batches.length} 個週五測驗批次、{preview.generalRows?.length || 0} 句只供一般練習、{preview.errors.length} 個問題</strong>
          {preview.errors.length > 0 && <ul>{preview.errors.slice(0, 10).map((error) => <li key={error}>{error}</li>)}</ul>}
          {preview.batches.map((batch) => (
            <div className="memorization-preview-batch" key={batch.testDate}>
              <b>測驗日期：{formatDate(batch.testDate)}</b>
              <ol>{batch.items.map((item) => <li key={item.content}>{item.content}：{item.meaning}</li>)}</ol>
            </div>
          ))}
          {(preview.generalRows?.length || 0) > 0 && (
            <div className="memorization-preview-batch">
              <b>只加入一般練習</b>
              <ol>{preview.generalRows.map((item) => <li key={item.content}>{item.content}：{item.meaning}</li>)}</ol>
            </div>
          )}
          <div className="phrase-manager-actions">
            <button type="button" onClick={executeImport} disabled={busy || preview.errors.length > 0 || !preview.rows.length}><Upload aria-hidden="true" />確認匯入</button>
            <button type="button" onClick={() => setPreview(null)} disabled={busy}><X aria-hidden="true" />取消</button>
          </div>
        </div>
      )}

      <div className="memorization-set-list">
        {sets.length === 0 ? <p>目前尚未建立背誦安排。</p> : sets.map((item) => (
          <article key={item.id}>
            <div><small>測驗日期</small><h3>{formatDate(item.testDate)}</h3></div>
            <ol>{item.items.map((phrase) => <li key={phrase.id || phrase.displayOrder}>{phrase.displayOrder}．{phrase.content}<span>{phrase.meaning}</span></li>)}</ol>
            <button type="button" onClick={() => removeSet(item)} disabled={busy}><Trash2 aria-hidden="true" />刪除安排</button>
          </article>
        ))}
      </div>
    </section>
  )
}
