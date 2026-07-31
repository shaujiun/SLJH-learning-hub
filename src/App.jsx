import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Headphones,
  LogOut,
  Mic2,
  Play,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react'
import { isSupabaseConfigured } from './lib/supabase.js'
import {
  buildTaskLaunchUrl,
  loadLearningDashboard,
  signOutEverywhere,
} from './services/learningService.js'

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
      <p>系統正在讀取登入身分與英語分組。</p>
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
  const ActivityIcon = activityIcons[task.activityCode] || Target
  const completed = task.status === 'completed'

  return (
    <article className={`focus-task ${completed ? 'task-completed' : ''}`}>
      <div className="task-topline">
        <span className="task-position">今日任務 {position}／{total}</span>
        <span className="group-badge">英語 {task.groupCode} 組</span>
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
  return (
    <article className={`system-card ${isEnglish ? 'system-ready' : ''}`}>
      <div className="system-card-icon">{isEnglish ? 'Aa' : '＋'}</div>
      <div className="system-copy">
        <div className="system-title-row">
          <h3>{system.name}</h3>
          <span>{isEnglish ? '已開放' : '準備中'}</span>
        </div>
        <p>{system.description}</p>
        <small>每週隨機安排 {system.weeklyMinimum}～{system.weeklyMaximum} 次</small>
      </div>
      <a href={system.launchUrl || englishVocabUrl} aria-label={`前往${system.name}學習系統`}>
        前往練習
      </a>
    </article>
  )
}

export default function App() {
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
                <div className="welcome-groups">
                  <span>英語 {groupBySubject.english || 'B'} 組</span>
                </div>
                <p>每天會有 1～4 項任務，每項只呈現一題，完成後再前往下一項。</p>
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
              <p>學生登入後，系統會依個人的英語 A／B 組產生專注任務。</p>
            </div>
            <div className="welcome-figure"><Brain aria-hidden="true" /></div>
          </section>
        )}

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
