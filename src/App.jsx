import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Atom,
  BookOpenCheck,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Eye,
  EyeOff,
  Headphones,
  LogOut,
  Mic2,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import PeriodicTableGame from './components/PeriodicTableGame.jsx'
import ScienceLevelManager from './components/ScienceLevelManager.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import {
  buildTaskLaunchUrl,
  loadLearningDashboard,
  signOutEverywhere,
} from './services/learningService.js'
import {
  loadAdminLearningSystems,
  reorderLearningSystems,
  saveLearningSystem,
  setLearningSystemActive,
} from './services/learningAdminService.js'
import { learningAudienceOptions } from './lib/learningAudiences.js'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'
const englishVocabUrl = import.meta.env.VITE_ENGLISH_VOCAB_URL?.trim()
  || 'https://shaujiun.github.io/englishvocabking/'

const activityIcons = {
  listening: Headphones,
  spelling: BookOpenCheck,
  sentence: Sparkles,
  matching: Brain,
  pronunciation: Mic2,
}

function LoadingScreen() {
  return (
    <main className="center-screen">
      <div className="loading-orb"><RefreshCw aria-hidden="true" /></div>
      <h1>正在準備今天的學習任務</h1>
      <p>系統正在讀取登入身分、學生分組與個人學習進度。</p>
    </main>
  )
}

function LoginRequired() {
  return (
    <main className="center-screen">
      <div className="mascot-orb"><BookOpenCheck aria-hidden="true" /></div>
      <p className="eyebrow">LEARNING PASSPORT</p>
      <h1>請先登入線上聯絡簿</h1>
      <p>登入一次後，就能直接前往各科入口與英文單字系統，不必再次輸入密碼。</p>
      <a className="primary-button" href={contactBookUrl}>
        <ArrowLeft aria-hidden="true" />
        前往聯絡簿登入
      </a>
    </main>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <main className="center-screen">
      <div className="error-orb"><CircleAlert aria-hidden="true" /></div>
      <h1>暫時無法載入學習任務</h1>
      <p>{message}</p>
      <div className="button-row">
        <button className="primary-button" type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />重新讀取
        </button>
        <a className="secondary-button" href={contactBookUrl}>返回聯絡簿</a>
      </div>
    </main>
  )
}

function WeeklyProgress({ tasks }) {
  const completed = tasks.filter((task) => task.status === 'completed').length
  const active = tasks.filter((task) => task.status !== 'expired').length
  const percentage = active === 0 ? 0 : Math.round((completed / active) * 100)
  const subjectSummary = Object.values(tasks.reduce((summary, task) => {
    const current = summary[task.subjectCode] || {
      name: task.subjectName,
      total: 0,
      completed: 0,
    }
    if (task.status !== 'expired') current.total += 1
    if (task.status === 'completed') current.completed += 1
    summary[task.subjectCode] = current
    return summary
  }, {}))

  return (
    <section className="weekly-card" aria-labelledby="weekly-title">
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">THIS WEEK</p>
          <h2 id="weekly-title">本週練習進度</h2>
        </div>
        <strong className="progress-number">{completed}／{active}</strong>
      </div>
      <div className="progress-track" aria-label={`本週已完成 ${percentage}%`}>
        <span style={{ width: `${percentage}%` }} />
      </div>
      <div className="subject-progress-list">
        {subjectSummary.map((subject) => (
          <span key={subject.name}>
            {subject.name} {subject.completed}／{subject.total}
          </span>
        ))}
      </div>
      <p className="weekend-note">平日未完成時，週末只保留約 70％ 任務；平日全部完成，就不加派週末任務。</p>
    </section>
  )
}

function FocusTask({ task, position, total }) {
  const ActivityIcon = task.activityCode?.startsWith('periodic_')
    ? Atom
    : activityIcons[task.activityCode] || Target
  const completed = task.status === 'completed'
  const groupLabel = task.groupCode === 'COMMON'
    ? '共同任務'
    : `${task.subjectName} ${task.groupCode} 組`

  return (
    <article className={`focus-task ${completed ? 'task-completed' : ''}`}>
      <div className="task-topline">
        <span className="task-position">今日任務 {position}／{total}</span>
        <span className="group-badge">{groupLabel}</span>
      </div>
      <div className="task-main">
        <div className="task-icon"><ActivityIcon aria-hidden="true" /></div>
        <div>
          <p className="task-subject">{task.subjectName}</p>
          <h2>{task.activityName}</h2>
          <div className="task-rules">
            <span><Target aria-hidden="true" />{task.questionCount} 題</span>
            <span><Sparkles aria-hidden="true" />目標 {task.targetScore} 分</span>
          </div>
        </div>
      </div>
      {completed ? (
        <div className="completed-message"><Check aria-hidden="true" />已完成，最高 {task.bestScore ?? task.targetScore} 分</div>
      ) : (
        <a className="task-start-button" href={buildTaskLaunchUrl(task)}>
          <Play aria-hidden="true" />開始這項任務
        </a>
      )}
    </article>
  )
}

function SystemCard({ system }) {
  const isEnglish = system.code === 'english'
  const launchUrl = system.launchUrl || (isEnglish ? englishVocabUrl : '')
  const isReady = Boolean(launchUrl)
  return (
    <article className={`system-card ${isReady ? 'system-ready' : ''}`}>
      <div className="system-card-icon">{isEnglish ? 'Aa' : system.name.slice(0, 1)}</div>
      <div className="system-copy">
        <div className="system-title-row">
          <h3>{system.name}</h3>
          <span>{isReady ? '已開放' : '準備中'}・{system.audienceLabel}</span>
        </div>
        <p>{system.description}</p>
        <small>
          {system.activities.length > 0
            ? `每週隨機安排 ${system.weeklyMinimum}～${system.weeklyMaximum} 次`
            : '目前提供自由練習，尚未安排專注任務'}
        </small>
      </div>
      {isReady ? (
        <a href={launchUrl} aria-label={`前往${system.name}學習系統`}>
          前往練習
        </a>
      ) : <span className="system-unavailable">尚未開放</span>}
    </article>
  )
}

const emptySystemForm = {
  id: '',
  subjectCode: '',
  subjectName: '',
  description: '',
  launchUrl: '',
  displayOrder: 10,
  weeklyMinimum: 1,
  weeklyMaximum: 3,
  audienceScope: 'common',
  isActive: true,
}

function LearningSystemManager({ onSystemsChanged }) {
  const [systems, setSystems] = useState([])
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState({ loading: true, saving: false, message: '', error: '' })

  const loadSystems = async () => {
    setStatus((current) => ({ ...current, loading: true, error: '' }))
    try {
      const rows = await loadAdminLearningSystems()
      setSystems(rows)
      setStatus((current) => ({ ...current, loading: false }))
    } catch (error) {
      setStatus((current) => ({ ...current, loading: false, error: error.message }))
    }
  }

  useEffect(() => {
    loadSystems()
  }, [])

  const startCreate = () => {
    const nextOrder = systems.length === 0
      ? 10
      : Math.max(...systems.map((system) => system.displayOrder || 0)) + 10
    setForm({ ...emptySystemForm, displayOrder: nextOrder })
    setStatus((current) => ({ ...current, message: '', error: '' }))
  }

  const startEdit = (system) => {
    setForm({ ...system })
    setStatus((current) => ({ ...current, message: '', error: '' }))
  }

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setStatus((current) => ({ ...current, saving: true, message: '', error: '' }))
    try {
      await saveLearningSystem(form)
      setForm(null)
      setStatus((current) => ({ ...current, saving: false, message: '學習系統連結已儲存。' }))
      await loadSystems()
      await onSystemsChanged()
    } catch (error) {
      setStatus((current) => ({ ...current, saving: false, error: error.message }))
    }
  }

  const handleVisibility = async (system) => {
    setStatus((current) => ({ ...current, saving: true, message: '', error: '' }))
    try {
      await setLearningSystemActive(system.id, !system.isActive)
      setStatus((current) => ({
        ...current,
        saving: false,
        message: system.isActive ? '已隱藏學習系統。' : '已恢復顯示學習系統。',
      }))
      await loadSystems()
      await onSystemsChanged()
    } catch (error) {
      setStatus((current) => ({ ...current, saving: false, error: error.message }))
    }
  }

  const moveSystem = async (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= systems.length) return
    const reordered = [...systems]
    ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
    setSystems(reordered)
    setStatus((current) => ({ ...current, saving: true, message: '', error: '' }))
    try {
      await reorderLearningSystems(reordered.map((system) => system.id))
      setStatus((current) => ({ ...current, saving: false, message: '顯示順序已更新。' }))
      await loadSystems()
      await onSystemsChanged()
    } catch (error) {
      setStatus((current) => ({ ...current, saving: false, error: error.message }))
      await loadSystems()
    }
  }

  return (
    <section className="system-manager" aria-labelledby="system-manager-title">
      <div className="section-heading manager-heading">
        <div>
          <p className="eyebrow">ADMIN SETTINGS</p>
          <h2 id="system-manager-title">學習系統連結管理</h2>
          <p>新增科目入口、設定學生分組對象、調整順序，或暫時隱藏尚未開放的系統。</p>
        </div>
        <button className="manager-add-button" type="button" onClick={startCreate} disabled={status.saving}>
          <Plus aria-hidden="true" />新增學習系統
        </button>
      </div>

      {status.message && <p className="manager-notice success-notice">{status.message}</p>}
      {status.error && <p className="manager-notice error-notice">{status.error}</p>}

      {form && (
        <form className="system-editor" onSubmit={handleSave}>
          <div className="editor-title-row">
            <div>
              <p className="eyebrow">{form.id ? 'EDIT SYSTEM' : 'NEW SYSTEM'}</p>
              <h3>{form.id ? `編輯${form.subjectName}` : '新增科目學習系統'}</h3>
            </div>
            <button className="editor-close" type="button" onClick={() => setForm(null)} aria-label="關閉編輯表單">
              <X aria-hidden="true" />
            </button>
          </div>
          <div className="editor-grid">
            <label>
              <span>科目代碼</span>
              <input value={form.subjectCode} onChange={(event) => updateField('subjectCode', event.target.value)} disabled={Boolean(form.id)} placeholder="例如 math" required />
              <small>{form.id ? '建立後不可更改，避免既有任務失去對應。' : '使用小寫英文，例如 science、math_game。'}</small>
            </label>
            <label>
              <span>科目名稱</span>
              <input value={form.subjectName} onChange={(event) => updateField('subjectName', event.target.value)} placeholder="例如數學" required />
            </label>
            <label className="editor-url-field">
              <span>學習系統網址</span>
              <input type="url" value={form.launchUrl} onChange={(event) => updateField('launchUrl', event.target.value)} placeholder="https://..." required />
            </label>
            <label className="editor-description-field">
              <span>簡短說明</span>
              <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows="2" maxLength="180" placeholder="說明這個系統可以練習什麼內容" />
            </label>
            <label>
              <span>每週最少次數</span>
              <select value={form.weeklyMinimum} onChange={(event) => updateField('weeklyMinimum', event.target.value)}>
                <option value="1">1 次</option><option value="2">2 次</option><option value="3">3 次</option>
              </select>
            </label>
            <label>
              <span>每週最多次數</span>
              <select value={form.weeklyMaximum} onChange={(event) => updateField('weeklyMaximum', event.target.value)}>
                <option value="1">1 次</option><option value="2">2 次</option><option value="3">3 次</option>
              </select>
            </label>
            <label>
              <span>顯示順序</span>
              <input type="number" min="0" max="9999" value={form.displayOrder} onChange={(event) => updateField('displayOrder', event.target.value)} required />
            </label>
            <label>
              <span>顯示對象</span>
              <select value={form.audienceScope} onChange={(event) => updateField('audienceScope', event.target.value)}>
                {learningAudienceOptions.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
              <small>學生只會看到共同項目及符合本人分組的項目。</small>
            </label>
            <label className="editor-checkbox">
              <input type="checkbox" checked={form.isActive} onChange={(event) => updateField('isActive', event.target.checked)} />
              <span>儲存後立即顯示</span>
            </label>
          </div>
          <div className="editor-actions">
            <button className="secondary-button" type="button" onClick={() => setForm(null)}>取消</button>
            <button className="primary-button" type="submit" disabled={status.saving}>
              {status.saving ? <RefreshCw className="spin-icon" aria-hidden="true" /> : <Save aria-hidden="true" />}
              儲存設定
            </button>
          </div>
        </form>
      )}

      {status.loading ? (
        <p className="manager-empty"><RefreshCw className="spin-icon" aria-hidden="true" />正在讀取設定……</p>
      ) : systems.length === 0 ? (
        <p className="manager-empty">尚未建立任何學習系統。</p>
      ) : (
        <div className="manager-system-list">
          {systems.map((system, index) => (
            <article className={`manager-system-row ${system.isActive ? '' : 'manager-system-hidden'}`} key={system.id}>
              <div className="manager-order-buttons">
                <button type="button" onClick={() => moveSystem(index, -1)} disabled={index === 0 || status.saving} aria-label={`將${system.subjectName}往前移`}><ChevronUp aria-hidden="true" /></button>
                <button type="button" onClick={() => moveSystem(index, 1)} disabled={index === systems.length - 1 || status.saving} aria-label={`將${system.subjectName}往後移`}><ChevronDown aria-hidden="true" /></button>
              </div>
              <div className="manager-system-copy">
                <div><strong>{system.subjectName}</strong><code>{system.subjectCode}</code><span>{system.audienceLabel}</span><span>{system.isActive ? '顯示中' : '已隱藏'}</span></div>
                <p>{system.description || '尚未填寫說明'}</p>
                <small>{system.launchUrl}・每週 {system.weeklyMinimum}～{system.weeklyMaximum} 次・{system.activities.length} 項任務</small>
              </div>
              <div className="manager-row-actions">
                <button type="button" onClick={() => startEdit(system)} disabled={status.saving}><Pencil aria-hidden="true" />編輯</button>
                <button type="button" onClick={() => handleVisibility(system)} disabled={status.saving}>
                  {system.isActive ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  {system.isActive ? '隱藏' : '恢復'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function LearningHub() {
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [showLater, setShowLater] = useState(false)

  const load = async () => {
    if (!isSupabaseConfigured) {
      setState({ loading: false, data: null, error: '本機環境尚未設定 Supabase 連線資料。' })
      return
    }
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const data = await loadLearningDashboard()
      setState({ loading: false, data, error: '' })
    } catch (error) {
      console.error(error)
      setState({ loading: false, data: null, error: error.message || '讀取失敗，請稍後再試。' })
    }
  }

  useEffect(() => {
    load()
  }, [])

  const pendingTasks = useMemo(
    () => state.data?.tasks?.filter((task) => task.status !== 'completed') || [],
    [state.data],
  )
  const completedTasks = useMemo(
    () => state.data?.tasks?.filter((task) => task.status === 'completed') || [],
    [state.data],
  )
  const currentTask = pendingTasks[0]
  const laterTasks = pendingTasks.slice(1)

  if (state.loading) return <LoadingScreen />
  if (state.error) return <ErrorScreen message={state.error} onRetry={load} />
  if (!state.data?.authenticated) return <LoginRequired />

  const { profile, student, systems, weeklyTasks, role, groupBySubject = {} } = state.data
  const visibleTotal = pendingTasks.length + completedTasks.length

  const handleLogout = async () => {
    await signOutEverywhere()
    window.location.assign(contactBookUrl)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href={contactBookUrl}>
          <span><BookOpenCheck aria-hidden="true" /></span>
          <div>
            <p>SLJH LEARNING HUB</p>
            <strong>各科學習系統</strong>
          </div>
        </a>
        <div className="header-actions">
          <div className="identity">
            <strong>{profile.displayName}</strong>
            <span>{student ? `${student.className}・${student.seatNumber} 號` : '教師／管理者'}</span>
          </div>
          <button type="button" className="icon-button" onClick={handleLogout} title="登出所有共用系統">
            <LogOut aria-hidden="true" />
            <span>登出</span>
          </button>
        </div>
      </header>

      <main className="page-content">
        {role === 'student' ? (
          <>
            <section className="welcome-panel">
              <div>
                <p className="eyebrow">FOCUS PRACTICE</p>
                <h1>{profile.displayName}，一次完成一項就好</h1>
                <div className="welcome-identity" aria-label="學生身分與分組">
                  <span><b>姓名</b>{profile.displayName}</span>
                  <span><b>學號</b>{profile.username}</span>
                  <span><b>數學</b>{groupBySubject.math || 'B'} 組</span>
                  <span><b>英語</b>{groupBySubject.english || 'B'} 組</span>
                </div>
                <p>每天會有 1～4 項任務；一次專注一項，遊戲內也一次只呈現一題。</p>
              </div>
              <div className="welcome-figure"><Brain aria-hidden="true" /></div>
            </section>

            <div className="dashboard-grid">
              <section className="today-section" aria-labelledby="today-title">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">TODAY</p>
                    <h2 id="today-title">今天的專注任務</h2>
                  </div>
                  <span className="daily-count">最多 4 項</span>
                </div>

                {currentTask ? (
                  <>
                    <FocusTask task={currentTask} position={completedTasks.length + 1} total={visibleTotal} />
                    {laterTasks.length > 0 && (
                      <div className="later-box">
                        <button type="button" onClick={() => setShowLater((value) => !value)}>
                          <span>稍後還有 {laterTasks.length} 項任務</span>
                          {showLater ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                        </button>
                        {showLater && (
                          <div className="later-list">
                            {laterTasks.map((task) => (
                              <span key={task.id}>{task.subjectName}・{task.activityName}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-task">
                    <div><Check aria-hidden="true" /></div>
                    <h3>{visibleTotal > 0 ? '今天的任務完成了' : '今天沒有安排必要任務'}</h3>
                    <p>可以休息一下，也可以到下方選擇自由練習。</p>
                  </div>
                )}
              </section>
              <WeeklyProgress tasks={weeklyTasks} />
            </div>
          </>
        ) : (
          <section className="welcome-panel staff-welcome">
            <div>
              <p className="eyebrow">STAFF PREVIEW</p>
              <h1>{profile.displayName}，歡迎查看各科學習入口</h1>
              <p>學生登入後，只會看到共同內容及符合本人數學、英語 A／B 分組的學習系統。</p>
            </div>
            <div className="welcome-figure"><Brain aria-hidden="true" /></div>
          </section>
        )}

        {role === 'admin' && <LearningSystemManager onSystemsChanged={load} />}
        {role === 'admin' && <ScienceLevelManager />}

        <section className="systems-section" aria-labelledby="systems-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SUBJECTS</p>
              <h2 id="systems-title">各科自由練習</h2>
            </div>
            <a className="back-link" href={contactBookUrl}><ArrowLeft aria-hidden="true" />返回聯絡簿</a>
          </div>
          <div className="system-grid">
            {systems.map((system) => <SystemCard key={system.id} system={system} />)}
          </div>
        </section>
      </main>
    </div>
  )
}

export default function App() {
  const requestedGame = new URLSearchParams(window.location.search).get('game')
  if (requestedGame === 'periodic-table') return <PeriodicTableGame />
  return <LearningHub />
}
