import { describe, expect, it } from 'vitest'
import { describePendingTask, summarizeWeeklyProgress } from './weeklyProgress.js'

const tasks = [
  {
    id: 'science-complete',
    assignedDate: '2026-08-21',
    subjectCode: 'science',
    subjectName: '自然科',
    activityName: '元素週期表混合挑戰',
    status: 'completed',
    targetScore: 80,
    bestScore: 90,
  },
  {
    id: 'focus-pending',
    assignedDate: '2026-08-22',
    subjectCode: 'focus_training',
    subjectName: '專注力訓練',
    activityName: '靜態舒爾特 4×4',
    status: 'pending',
    targetScore: 100,
    bestScore: null,
  },
  {
    id: 'future-task',
    assignedDate: '2026-08-24',
    subjectCode: 'english',
    subjectName: '英語',
    activityName: '單字拼寫',
    status: 'pending',
    targetScore: 80,
    bestScore: null,
  },
]

describe('summarizeWeeklyProgress', () => {
  it('只用今天以前已到期的任務計算百分比', () => {
    const summary = summarizeWeeklyProgress(tasks, '2026-08-23')
    expect(summary).toMatchObject({
      completed: 1,
      total: 2,
      percentage: 50,
      futureCount: 1,
    })
    expect(summary.pendingTasks.map((task) => task.id)).toEqual(['focus-pending'])
  })

  it('當已到期任務全部完成時顯示 100%，不受未來任務影響', () => {
    const summary = summarizeWeeklyProgress([
      tasks[0],
      { ...tasks[2], assignedDate: '2026-08-24' },
    ], '2026-08-23')
    expect(summary.percentage).toBe(100)
    expect(summary.completed).toBe(1)
    expect(summary.total).toBe(1)
  })

  it('未完成項目會說明缺少任務連結或尚未達標', () => {
    expect(describePendingTask(tasks[1])).toContain('尚未留下與本週任務連結')
    expect(describePendingTask({ ...tasks[0], status: 'pending', bestScore: 60 }))
      .toBe('最高 60 分／目標 80 分')
  })
})
