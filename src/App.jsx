import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Atom,
  BookOpenCheck,
  Brain,
  Check,
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
import { learningSystemLaunchUrl, subjectGamesFor } from './lib/subjectGames.js'
import { rememberFocusTaskLaunch } from './lib/focusTaskLaunch.js'
import { resolveSelectedFocusTask } from './lib/focusTaskSelection.js'

const HistoryAtlas = lazy(() => import('./components/HistoryAtlas.jsx'))
const FocusTrainingHub = lazy(() => import('./components/FocusTrainingHub.jsx'))
const SchulteStaticGame = lazy(() => import('./components/SchulteStaticGame.jsx'))
const SchulteDynamicGame = lazy(() => import('./components/SchulteDynamicGame.jsx'))
const SchulteShapeGame = lazy(() => import('./components/SchulteShapeGame.jsx'))
const SchultePhraseGame = lazy(() => import('./components/SchultePhraseGame.jsx'))
const SchulteMemorizationGame = lazy(() => import('./components/SchulteMemorizationGame.jsx'))

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

function FocusTask({ task, position, total, freelySelectable = false }) {
  const isSchulte = task.activityCode?.startsWith('schulte_')
  const isMemorization = task.activityCode === 'schulte_memorization'
  const ActivityIcon = isSchulte
    ? Brain
    : task.activityCode?.startsWith('periodic_')
    ? Atom
    : activityIcons[task.activityCode] || Target
  const completed = task.status === 'completed'
  const groupLabel = isSchulte
    ? '專注力訓練'
    : task.groupCode === 'COMMON'
    ? '共同任務'
    : `${task.subjectName} ${task.groupCode} 組`

  return (
    <article className={`focus-task ${completed ? 'task-completed' : ''}`}>
      <div className="task-topline">
        <span className="task-position">
          {freelySelectable ? `今日任務 ${position}／${total}・可自由選擇` : `今日任務 ${position}／${total}`}
        </span>
        <span className="group-badge">{groupLabel}</span>
      </div>
      <div className="task-main">
        <div className="task-icon"><ActivityIcon aria-hidden="true" /></div>
        <div>
          <p className="task-subject">{task.subjectName}</p>
          <h2>{task.activityName}</h2>
          <div className="task-rules">
            {isSchulte ? (
              <span><Target aria-hidden="true" />{isMemorization ? '連續完成 5 句' : '完成 1 回合'}</span>
            ) : <>
              <span><Target aria-hidden="true" />{task.questionCount} 題</span>
              <span><Sparkles aria-hidden="true" />目標 {task.targetScore} 分</span>
            </>}
          </div>
        </div>
      </div>
      {completed ? (
        <div className="completed-message">
          <Check aria-hidden="true" />
          {isSchulte ? '已完成本次專注力訓練' : `已完成，最高 ${task.bestScore ?? task.targetScore} 分`}
        </div>
      ) : (
        <a
          className="task-start-button"
          href={buildTaskLaunchUrl(task)}
          onClick={() => rememberFocusTaskLaunch(task)}
        >
          <Play aria-hidden="true" />開始這項任務
        </a>
      )}
    </article>
  )
}

function FocusTrainingEntrance() {
  return (
    <section className="focus-training-entrance" aria-labelledby="focus-training-title">
      <div className="focus-training-entrance-icon"><Brain aria-hidden="true" /></div>
      <div>
        <p className="eyebrow">FOCUS TRAINING</p>
        <h2 id="focus-training-title">專注力訓練</h2>
        <p>不分科目與分組，用舒爾特學習法練習視覺搜尋、注意力與穩定度。</p>
      </div>
      <a href="./?focus=training"><Play aria-hidden="true" />選擇訓練</a>
    </section>
  )
}

function SystemCard({ system }) {
  const isEnglish = system.code === 'english'
  const launchUrl = learningSystemLaunchUrl(system, englishVocabUrl)
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

function SubjectGameIcon({ system }) {
  if (system?.code === 'science') return <Atom aria-hidden="true" />
  if (system?.code === 'english') return <span aria-hidden="true">Aa</span>
  return <span aria-hidden="true">{system?.name?.slice(0, 1) || '學'}</span>
}

function SubjectGameMenu({ system }) {
  const games = subjectGamesFor(system, englishVocabUrl)
  const isHistory = system?.code === 'history'
  if (!system) {
    return (
      <section className="subject-games-section subject-menu-empty">
        <CircleAlert aria-hidden="true" />
        <h1>找不到這個科目的學習系統</h1>
        <p>這個科目可能尚未開放，或不符合目前學生的分組設定。</p>
        <a className="primary-button" href="./"><ArrowLeft aria-hidden="true" />返回各科選擇</a>
      </section>
    )
  }

  return (
    <>
      <section className="subject-menu-hero">
        <div>
          <p className="eyebrow">{system.code.toUpperCase()} {isHistory ? 'LEARNING' : 'GAMES'}</p>
          <h1>{system.name}{isHistory ? '學習選擇' : '遊戲選擇'}</h1>
          <p>{isHistory ? '選擇這次要閱讀的歷史學習工具，之後新增的遊戲也會放在這裡。' : `選擇這次要練習的遊戲。之後新增的${system.name}遊戲也會集中顯示在這裡。`}</p>
        </div>
        <div className={`subject-menu-hero-icon is-${system.code}`}><SubjectGameIcon system={system} /></div>
      </section>

      <section className="subject-games-section" aria-labelledby="subject-games-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">SELECT {isHistory ? 'A TOOL' : 'A GAME'}</p>
            <h2 id="subject-games-title">選擇{isHistory ? '學習' : '遊戲'}項目</h2>
          </div>
          <a className="back-link" href="./"><ArrowLeft aria-hidden="true" />返回各科選擇</a>
        </div>

        <div className="subject-game-grid">
          {games.map((game) => (
            <article className="subject-game-card" key={game.code}>
              <div className="subject-game-icon"><SubjectGameIcon system={system} /></div>
              <div className="subject-game-copy">
                <div className="subject-game-title-row">
                  <h3>{game.name}</h3>
                  {game.availability && <span>{game.availability}</span>}
                </div>
                <p>{game.description}</p>
              </div>
              <a href={game.launchUrl} aria-label={`進入${game.name}`}>
                <Play aria-hidden="true" />進入{isHistory ? '學習' : '遊戲'}
              </a>
            </article>
          ))}
        </div>

        <p className="subject-coming-soon">其他{system.name}{isHistory ? '學習內容與遊戲' : '遊戲'}將陸續加入。</p>
      </section>
    </>
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

function LearningHub({ requestedSubject = '' }) {
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [selectedTaskId, setSelectedTaskId] = useState('')

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
  const currentTask = resolveSelectedFocusTask(pendingTasks, selectedTaskId)
  const currentTaskPosition = currentTask
    ? completedTasks.length + pendingTasks.findIndex((task) => task.id === currentTask.id) + 1
    : 0

  if (state.loading) return <LoadingScreen />
  if (state.error) return <ErrorScreen message={state.error} onRetry={load} />
  if (!state.data?.authenticated) return <LoginRequired />

  const { profile, student, systems, weeklyTasks, role, groupBySubject = {} } = state.data
  const academicSystems = systems.filter((system) => system.code !== 'focus_training')
  const visibleTotal = pendingTasks.length + completedTasks.length
  const selectedSystem = requestedSubject
    ? systems.find((system) => system.code === requestedSubject)
    : null

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
        {requestedSubject ? (
          <SubjectGameMenu system={selectedSystem} />
        ) : <>{role === 'student' ? (
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
                <p>每天會有 1～3 項任務；一次專注一項，遊戲內也一次只呈現一題。</p>
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
                  <span className="daily-count">最多 3 項</span>
                </div>

                {currentTask ? (
                  <>
                    {pendingTasks.length > 1 && (
                      <div className="task-choice-box" aria-label="選擇優先完成的任務">
                        <div>
                          <strong>你想先完成哪一項？</strong>
                          <span>今天的任務可自由選擇順序</span>
                        </div>
                        <div className="task-choice-list">
                          {pendingTasks.map((task, index) => (
                            <button
                              className={task.id === currentTask.id ? 'is-selected' : ''}
                              key={task.id}
                              type="button"
                              aria-pressed={task.id === currentTask.id}
                              onClick={() => setSelectedTaskId(task.id)}
                            >
                              <span>{index + 1}</span>
                              <span><b>{task.subjectName}</b><small>{task.activityName}</small></span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <FocusTask
                      task={currentTask}
                      position={currentTaskPosition}
                      total={visibleTotal}
                      freelySelectable={pendingTasks.length > 1}
                    />
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

        <FocusTrainingEntrance />

        <section className="systems-section" aria-labelledby="systems-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">SUBJECTS</p>
              <h2 id="systems-title">各科自由練習</h2>
            </div>
            <a className="back-link" href={contactBookUrl}><ArrowLeft aria-hidden="true" />返回聯絡簿</a>
          </div>
          <div className="system-grid">
            {academicSystems.map((system) => <SystemCard key={system.id} system={system} />)}
          </div>
        </section>
        </>}
      </main>
    </div>
  )
}

export default function App() {
  const searchParams = new URLSearchParams(window.location.search)
  const requestedGame = searchParams.get('game')
  if (requestedGame === 'periodic-table') return <PeriodicTableGame />
  if (requestedGame === 'schulte-static') {
    return <Suspense fallback={<LoadingScreen />}><SchulteStaticGame /></Suspense>
  }
  if (requestedGame === 'schulte-dynamic') {
    return <Suspense fallback={<LoadingScreen />}><SchulteDynamicGame /></Suspense>
  }
  if (requestedGame === 'schulte-shape') {
    return <Suspense fallback={<LoadingScreen />}><SchulteShapeGame /></Suspense>
  }
  if (requestedGame === 'schulte-phrase') {
    return <Suspense fallback={<LoadingScreen />}><SchultePhraseGame /></Suspense>
  }
  if (requestedGame === 'schulte-memorization') {
    return <Suspense fallback={<LoadingScreen />}><SchulteMemorizationGame /></Suspense>
  }
  if (searchParams.get('focus') === 'training') {
    return <Suspense fallback={<LoadingScreen />}><FocusTrainingHub /></Suspense>
  }
  if (searchParams.get('history') === 'atlas') {
    return <Suspense fallback={<LoadingScreen />}><HistoryAtlas /></Suspense>
  }
  return <LearningHub requestedSubject={searchParams.get('subject') || ''} />
}
