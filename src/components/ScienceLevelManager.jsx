import { useEffect, useState } from 'react'
import { Atom, RefreshCw, ShieldCheck } from 'lucide-react'
import { periodicLevels } from '../lib/periodicTable.js'
import {
  loadScienceStudentLevels,
  setStudentScienceLevel,
} from '../services/periodicTableService.js'

const editableLevels = ['beginner', 'advanced', 'challenge']

export default function ScienceLevelManager() {
  const [students, setStudents] = useState([])
  const [status, setStatus] = useState({ loading: true, savingId: '', message: '', error: '' })

  const load = async () => {
    setStatus((current) => ({ ...current, loading: true, error: '' }))
    try {
      setStudents(await loadScienceStudentLevels())
      setStatus((current) => ({ ...current, loading: false }))
    } catch (error) {
      setStatus((current) => ({ ...current, loading: false, error: error.message }))
    }
  }

  useEffect(() => {
    load()
  }, [])

  const changeLevel = async (student, nextLevel) => {
    if (nextLevel === student.code) return
    const confirmed = window.confirm(
      `確定將 ${student.name} 的自然科等級調整為「${periodicLevels[nextLevel].label}」嗎？\n\n調整後，連續達標次數會重新從 0 開始。`,
    )
    if (!confirmed) return
    setStatus({ loading: false, savingId: student.id, message: '', error: '' })
    try {
      await setStudentScienceLevel({ studentId: student.id, level: nextLevel })
      setStatus({ loading: false, savingId: '', message: `已更新 ${student.name} 的自然科等級。`, error: '' })
      await load()
    } catch (error) {
      setStatus({ loading: false, savingId: '', message: '', error: error.message })
    }
  }

  return (
    <section className="science-level-manager" aria-labelledby="science-level-title">
      <div className="section-heading manager-heading">
        <div>
          <p className="eyebrow">SCIENCE PROGRESS</p>
          <h2 id="science-level-title"><Atom aria-hidden="true" />自然科元素進階</h2>
          <p>入門連續 3 次達 80 分即可升級；若未達標，安排滿 5 個入門任務後，第 6 個起仍改為進階。進階需連續 5 次達標。</p>
        </div>
        <button className="manager-refresh-button" type="button" onClick={load} disabled={status.loading || status.savingId}>
          <RefreshCw className={status.loading ? 'spin-icon' : ''} aria-hidden="true" />重新整理
        </button>
      </div>

      {status.message && <p className="manager-notice success-notice">{status.message}</p>}
      {status.error && <p className="manager-notice error-notice">{status.error}</p>}

      {status.loading ? (
        <p className="manager-empty"><RefreshCw className="spin-icon" aria-hidden="true" />正在讀取自然科進度……</p>
      ) : students.length === 0 ? (
        <p className="manager-empty">目前沒有可設定的學生。</p>
      ) : (
        <div className="science-level-list">
          {students.map((student) => (
            <article className="science-level-row" key={student.id}>
              <span className="science-seat">{student.seatNumber}</span>
              <div className="science-student-copy">
                <strong>{student.name}</strong>
                <small>{student.className}・{student.studentId}</small>
              </div>
              <div className="science-streak">
                <ShieldCheck aria-hidden="true" />
                <span>{student.requiredPasses
                  ? `升級進度 ${student.consecutivePasses}／${student.requiredPasses}`
                  : '每日任務最高級'}</span>
              </div>
              <label>
                <span className="sr-only">調整 {student.name} 的自然科等級</span>
                <select
                  value={student.code}
                  disabled={status.savingId === student.id}
                  onChange={(event) => changeLevel(student, event.target.value)}
                >
                  {editableLevels.map((level) => (
                    <option value={level} key={level}>{periodicLevels[level].label}</option>
                  ))}
                </select>
              </label>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
