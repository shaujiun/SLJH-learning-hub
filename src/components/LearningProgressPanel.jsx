import { useEffect, useMemo, useState } from 'react'
import { BarChart3, ChevronDown, RefreshCw } from 'lucide-react'
import {
  loadAdminLearningProgress,
  loadMyLearningProgress,
} from '../services/learningProgressService.js'

const subjectNames = {
  math: '數學', english: '英語', science: '自然', geography: '地理',
  history: '歷史', puzzle: '益智遊戲', general: '綜合',
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

function scoreText(value) {
  return value === null || value === undefined ? '未計分' : `${Math.round(Number(value))} 分`
}

export default function LearningProgressPanel({ role }) {
  const [open, setOpen] = useState(role === 'student')
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState({ loading: false, loaded: false, error: '' })
  const [filters, setFilters] = useState({ classId: '', studentId: '', subjectCode: '' })

  const load = async () => {
    setStatus({ loading: true, loaded: false, error: '' })
    try {
      const data = role === 'admin'
        ? await loadAdminLearningProgress()
        : await loadMyLearningProgress()
      setRows(data)
      setStatus({ loading: false, loaded: true, error: '' })
    } catch (error) {
      const missingTable = /student_activity_progress|does not exist|schema cache/i.test(error.message || '')
      setStatus({
        loading: false,
        loaded: true,
        error: missingTable
          ? '統一進度資料表尚未安裝，請由管理者完成本次資料庫更新。'
          : (error.message || '讀取學習進度失敗。'),
      })
    }
  }

  useEffect(() => {
    if (open && !status.loaded && !status.loading) load()
  }, [open])

  const options = useMemo(() => ({
    classes: [...new Map(rows.filter((row) => row.classId).map((row) => [row.classId, row.className])).entries()],
    students: [...new Map(rows
      .filter((row) => !filters.classId || row.classId === filters.classId)
      .map((row) => [row.studentId, `${row.seatNumber ?? '—'} 號　${row.studentName}`])).entries()],
    subjects: [...new Set(rows.map((row) => row.subjectCode))],
  }), [rows, filters.classId])

  const visibleRows = useMemo(() => rows.filter((row) => (
    (!filters.classId || row.classId === filters.classId)
    && (!filters.studentId || row.studentId === filters.studentId)
    && (!filters.subjectCode || row.subjectCode === filters.subjectCode)
  )), [rows, filters])

  return (
    <section className="learning-progress-panel" aria-labelledby="learning-progress-title">
      <button
        type="button"
        className="learning-progress-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span><BarChart3 aria-hidden="true" /><span><small>LEARNING RECORDS</small><strong id="learning-progress-title">{role === 'admin' ? '全班遊戲與測驗進度' : '我的遊戲與測驗進度'}</strong></span></span>
        <ChevronDown className={open ? 'is-open' : ''} aria-hidden="true" />
      </button>

      {open && <div className="learning-progress-content">
        {role === 'admin' && rows.length > 0 && <div className="learning-progress-filters">
          <label>班級<select value={filters.classId} onChange={(event) => setFilters({ ...filters, classId: event.target.value, studentId: '' })}><option value="">全部班級</option>{options.classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label>學生<select value={filters.studentId} onChange={(event) => setFilters({ ...filters, studentId: event.target.value })}><option value="">全部學生</option>{options.students.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label>科目<select value={filters.subjectCode} onChange={(event) => setFilters({ ...filters, subjectCode: event.target.value })}><option value="">全部科目</option>{options.subjects.map((code) => <option key={code} value={code}>{subjectNames[code] || code}</option>)}</select></label>
        </div>}

        {status.error && <p className="manager-notice error-notice">{status.error}</p>}
        {status.loading ? <p className="manager-empty"><RefreshCw className="spin-icon" aria-hidden="true" />正在讀取進度……</p>
          : !status.error && visibleRows.length === 0 ? <p className="manager-empty">目前還沒有完成紀錄；完成一個關卡或一輪測驗後會顯示在這裡。</p>
            : !status.error && <div className="learning-progress-table-wrap"><table className="learning-progress-table"><thead><tr>{role === 'admin' && <th>學生</th>}<th>科目／活動</th><th>模式</th><th>完成</th><th>最近／最佳</th><th>最近完成</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={`${row.studentId}:${row.subjectCode}:${row.activityCode}:${row.modeCode}`}>
              {role === 'admin' && <td><strong>{row.seatNumber ?? '—'} 號　{row.studentName}</strong><small>{row.className}</small></td>}
              <td><strong>{subjectNames[row.subjectCode] || row.subjectCode}</strong><small>{row.activityName}</small></td>
              <td>{row.modeCode === 'default' ? '一般' : row.modeCode.replaceAll('_', ' ')}</td>
              <td>{row.completionCount} 次<small>共作答 {row.attemptCount} 次</small></td>
              <td>{scoreText(row.latestScore)}<small>最佳 {scoreText(row.bestScore)}</small></td>
              <td>{formatDate(row.lastAttemptedAt)}</td>
            </tr>)}</tbody></table></div>}

        {!status.loading && <button type="button" className="manager-refresh-button" onClick={load}><RefreshCw aria-hidden="true" />重新整理</button>}
      </div>}
    </section>
  )
}
