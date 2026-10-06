import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Edit3, ExternalLink, FileImage, Maximize2, Plus, Save,
  UploadCloud, X, ZoomIn, ZoomOut,
} from 'lucide-react'
import {
  blankLearningMap,
  learningMapLevelLabel,
  learningMapStatuses,
  learningMapSubjects,
  semesterLabel,
  subjectLabel,
} from '../lib/learningMaps.js'
import { loadLearningMaps, saveLearningMap } from '../services/learningMapService.js'
import './learningMapLibrary.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

function AccessMessage({ access, error }) {
  const needsLogin = access === 'login'
  return <main className="learning-map-gate">
    <FileImage aria-hidden="true" />
    <h1>{error ? '學習地圖暫時無法讀取' : needsLogin ? '學習地圖需要學生登入' : '這個帳號無法閱讀學習地圖'}</h1>
    <p>{error || (needsLogin ? '請先從線上聯絡簿登入學生帳號。' : '僅已核准、仍有效的學生帳號與管理者可使用。')}</p>
    {needsLogin && <a href={contactBookUrl}>前往學生登入</a>}
  </main>
}

function LearningMapViewer({ item, onClose }) {
  const [scale, setScale] = useState(1)
  const viewerRef = useRef(null)
  if (!item) return null
  const isPdf = item.mimeType === 'application/pdf'

  async function fullscreen() {
    if (viewerRef.current?.requestFullscreen) await viewerRef.current.requestFullscreen()
  }

  return <div className="learning-map-viewer-backdrop" role="presentation">
    <section className="learning-map-viewer" role="dialog" aria-modal="true" aria-labelledby="learning-map-viewer-title" ref={viewerRef}>
      <header>
        <div><small>{learningMapLevelLabel(item)}</small><h2 id="learning-map-viewer-title">{item.title}</h2></div>
        <div className="learning-map-viewer-actions">
          {!isPdf && <>
            <button type="button" onClick={() => setScale((value) => Math.max(.6, value - .2))} aria-label="縮小"><ZoomOut /></button>
            <button type="button" onClick={() => setScale(1)}>{Math.round(scale * 100)}%</button>
            <button type="button" onClick={() => setScale((value) => Math.min(3, value + .2))} aria-label="放大"><ZoomIn /></button>
          </>}
          <button type="button" onClick={fullscreen} aria-label="全螢幕"><Maximize2 /></button>
          <button type="button" onClick={onClose} aria-label="關閉"><X /></button>
        </div>
      </header>
      <div className={`learning-map-document${isPdf ? ' is-pdf' : ''}`}>
        {isPdf
          ? <iframe src={`${item.signedUrl}#toolbar=0&navpanes=0`} title={`${item.title} PDF`} />
          : <img src={item.signedUrl} alt={`${item.title}學習地圖`} style={{ width: `${scale * 100}%` }} draggable="false" />}
      </div>
      <footer>
        <div><b>製作：</b>{item.creatorName}<span>・</span><b>來源：</b>{item.sourceName || item.creatorName}</div>
        <a href={item.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />查看原始來源</a>
      </footer>
    </section>
  </div>
}

function LearningMapManager({ subjectCode, maps, onSaved, onPreview }) {
  const [form, setForm] = useState(() => blankLearningMap(subjectCode))
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')

  function edit(item) {
    setForm(item)
    setFile(null)
    setStatus('')
    document.querySelector('.learning-map-admin-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save(event) {
    event.preventDefault()
    setBusy(true)
    setStatus('')
    try {
      const saved = await saveLearningMap(form, file)
      setStatus(form.status === 'published' ? '已儲存並發布，學生登入後可閱讀。' : '已儲存學習地圖設定。')
      setForm(saved)
      setFile(null)
      await onSaved()
    } catch (error) {
      setStatus(error.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="learning-map-admin">
    <div className="learning-map-section-title">
      <div><small>ADMIN ONLY</small><h2>學習地圖管理</h2><p>先儲存草稿進行預覽，確認後再改為「已發布」。</p></div>
      <button type="button" onClick={() => { setForm(blankLearningMap(subjectCode)); setFile(null); setStatus('') }}><Plus />新增地圖</button>
    </div>

    <div className="learning-map-admin-layout">
      <div className="learning-map-admin-list">
        {maps.length === 0 ? <p>尚未建立任何學習地圖。</p> : maps.map((item) => <article key={item.id}>
          <div><small>{learningMapLevelLabel(item)}</small><strong>{item.title}</strong><span className={`is-${item.status}`}>{learningMapStatuses.find((entry) => entry.value === item.status)?.label}</span></div>
          <p>{item.storagePath ? item.originalFileName || '已上傳檔案' : '尚未上傳檔案'}</p>
          <div className="learning-map-admin-actions">
            {item.signedUrl && <button type="button" onClick={() => onPreview(item)}><FileImage />預覽</button>}
            <button type="button" onClick={() => edit(item)}><Edit3 />編輯</button>
          </div>
        </article>)}
      </div>

      <form className="learning-map-admin-form" onSubmit={save}>
        <h3>{form.id ? `編輯：${form.title}` : '新增學習地圖'}</h3>
        <div className="learning-map-form-grid">
          <label>科目<select value={form.subjectCode} onChange={(event) => update('subjectCode', event.target.value)}>{learningMapSubjects.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label>年級<select value={form.gradeLevel} onChange={(event) => update('gradeLevel', event.target.value)}>{[7, 8, 9].map((grade) => <option key={grade} value={grade}>{grade} 年級</option>)}</select></label>
          <label>學期<select value={form.semester} onChange={(event) => update('semester', event.target.value)}><option value="1">上學期</option><option value="2">下學期</option></select></label>
          <label>章節<input type="number" min="1" max="30" value={form.chapterNo} onChange={(event) => update('chapterNo', event.target.value)} /></label>
        </div>
        <label>標題<input value={form.title} onChange={(event) => update('title', event.target.value)} required /></label>
        <label>簡介<textarea rows="2" value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
        <div className="learning-map-form-grid two-columns">
          <label>製作者<input value={form.creatorName} onChange={(event) => update('creatorName', event.target.value)} required /></label>
          <label>來源名稱<input value={form.sourceName} onChange={(event) => update('sourceName', event.target.value)} /></label>
        </div>
        <label>原始來源網址<input type="url" value={form.sourceUrl} onChange={(event) => update('sourceUrl', event.target.value)} required /></label>
        <label>使用說明<textarea rows="2" value={form.usageNote} onChange={(event) => update('usageNote', event.target.value)} /></label>
        <label className="learning-map-file-field"><span><UploadCloud />學習地圖檔案</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /><small>{file ? `已選擇：${file.name}` : form.storagePath ? `目前檔案：${form.originalFileName}` : '支援 JPG、PNG、WebP 與 PDF，單檔最大 15 MB。'}</small></label>
        <div className="learning-map-form-grid two-columns">
          <label>顯示順序<input type="number" value={form.displayOrder} onChange={(event) => update('displayOrder', event.target.value)} /></label>
          <label>狀態<select value={form.status} onChange={(event) => update('status', event.target.value)}>{learningMapStatuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        </div>
        <button className="learning-map-save" type="submit" disabled={busy}><Save />{busy ? '儲存中……' : '儲存學習地圖'}</button>
        <p className="learning-map-form-status" role="status">{status}</p>
      </form>
    </div>
  </section>
}

export default function LearningMapLibrary({ subjectCode = 'geography' }) {
  const [state, setState] = useState({ loading: true, access: '', canManage: false, maps: [], error: '' })
  const [grade, setGrade] = useState('all')
  const [semester, setSemester] = useState('all')
  const [viewer, setViewer] = useState(null)

  async function load() {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const result = await loadLearningMaps(subjectCode)
      setState({ loading: false, error: '', ...result })
    } catch (error) {
      setState({ loading: false, access: '', canManage: false, maps: [], error: error.message })
    }
  }

  useEffect(() => { load() }, [subjectCode])

  const publishedMaps = useMemo(() => state.maps.filter((item) => item.status === 'published' && item.signedUrl), [state.maps])
  const visibleMaps = useMemo(() => publishedMaps.filter((item) => (
    (grade === 'all' || String(item.gradeLevel) === grade)
    && (semester === 'all' || String(item.semester) === semester)
  )), [publishedMaps, grade, semester])

  if (state.loading) return <main className="learning-map-gate"><FileImage aria-hidden="true" /><h1>正在整理學習地圖……</h1></main>
  if (state.access !== 'allowed' || state.error) return <AccessMessage access={state.access} error={state.error} />

  return <div className="learning-map-shell">
    <header className="learning-map-header">
      <a href={`?subject=${subjectCode}`}><ArrowLeft />返回{subjectLabel(subjectCode)}科</a>
      <div><small>SOCIAL STUDIES MAPS</small><h1>{subjectLabel(subjectCode)}學習地圖</h1><p>依年級、冊別與章節閱讀教師整理的學習地圖。</p></div>
    </header>

    {state.canManage && <LearningMapManager subjectCode={subjectCode} maps={state.maps} onSaved={load} onPreview={setViewer} />}

    <main className="learning-map-content">
      <div className="learning-map-section-title">
        <div><small>STUDENT LIBRARY</small><h2>已發布的學習地圖</h2><p>點選章節後可放大、縮小或全螢幕閱讀。</p></div>
        <div className="learning-map-filters">
          <label>年級<select value={grade} onChange={(event) => setGrade(event.target.value)}><option value="all">全部</option>{[7, 8, 9].map((item) => <option key={item} value={item}>{item} 年級</option>)}</select></label>
          <label>學期<select value={semester} onChange={(event) => setSemester(event.target.value)}><option value="all">全部</option><option value="1">上學期</option><option value="2">下學期</option></select></label>
        </div>
      </div>

      {visibleMaps.length === 0 ? <div className="learning-map-empty"><FileImage /><h3>目前沒有符合條件的學習地圖</h3><p>{state.canManage ? '請在上方管理區上傳檔案並設為已發布。' : '請等待老師發布後再回來查看。'}</p></div> : <div className="learning-map-grid">
        {visibleMaps.map((item) => <article key={item.id}>
          <button className="learning-map-thumbnail" type="button" onClick={() => setViewer(item)} aria-label={`開啟${item.title}`}>
            {item.mimeType === 'application/pdf' ? <FileImage /> : <img src={item.signedUrl} alt="" loading="lazy" />}
          </button>
          <div><small>{item.gradeLevel} 年級{semesterLabel(item.semester)}・CH{item.chapterNo}</small><h3>{item.title}</h3><p>{item.description}</p><span>製作：{item.creatorName}</span></div>
          <button type="button" className="learning-map-open" onClick={() => setViewer(item)}>開啟學習地圖</button>
        </article>)}
      </div>}
    </main>

    <LearningMapViewer item={viewer} onClose={() => setViewer(null)} />
  </div>
}
