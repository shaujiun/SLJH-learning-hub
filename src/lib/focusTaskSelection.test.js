import { describe, expect, it } from 'vitest'
import { resolveSelectedFocusTask } from './focusTaskSelection.js'

const tasks = [
  { id: 'task-1', subjectName: '英語' },
  { id: 'task-2', subjectName: '自然科' },
  { id: 'task-3', subjectName: '專注力訓練' },
]

describe('resolveSelectedFocusTask', () => {
  it('未選擇時顯示第一項任務', () => {
    expect(resolveSelectedFocusTask(tasks)?.id).toBe('task-1')
  })

  it('可自由切換到同一天的其他任務', () => {
    expect(resolveSelectedFocusTask(tasks, 'task-3')?.id).toBe('task-3')
  })

  it('原選擇完成並離開待完成清單後，自動改顯示下一項', () => {
    expect(resolveSelectedFocusTask(tasks.slice(1), 'task-1')?.id).toBe('task-2')
  })
})
