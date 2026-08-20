import { describe, expect, it } from 'vitest'
import {
  clearRememberedFocusTask,
  focusTaskLaunchStorageKey,
  readRememberedFocusTask,
  rememberFocusTaskLaunch,
  resolveFocusTaskId,
} from './focusTaskLaunch.js'

const taskId = '0f3d8fcb-1d2d-4a47-94cb-b01cbd024028'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
}

describe('focus task launch context', () => {
  it('restores a task only for the matching subject and activity', () => {
    const storage = memoryStorage()
    expect(rememberFocusTaskLaunch({
      id: taskId,
      subjectCode: 'english',
      activityCode: 'spelling',
    }, storage, 1000)).toBe(true)

    expect(readRememberedFocusTask({
      subjectCode: 'english',
      activityCode: 'spelling',
    }, storage, 2000)?.taskId).toBe(taskId)
    expect(readRememberedFocusTask({ subjectCode: 'science' }, storage, 2000)).toBeNull()
  })

  it('uses the URL id first and falls back to a recent task launch', () => {
    const storage = memoryStorage()
    rememberFocusTaskLaunch({
      id: taskId,
      subjectCode: 'focus_training',
      activityCode: 'schulte_static_4',
    }, storage)

    const params = new URLSearchParams('game=schulte-static')
    expect(resolveFocusTaskId(params, { activityPrefix: 'schulte_static_' }, storage)).toBe(taskId)
  })

  it('removes expired or completed launch context', () => {
    const storage = memoryStorage()
    storage.setItem(focusTaskLaunchStorageKey, JSON.stringify({
      taskId,
      subjectCode: 'english',
      activityCode: 'listening',
      expiresAt: 10,
    }))
    expect(readRememberedFocusTask({}, storage, 20)).toBeNull()

    rememberFocusTaskLaunch({ id: taskId, subjectCode: 'english', activityCode: 'listening' }, storage, 100)
    clearRememberedFocusTask(taskId, storage)
    expect(storage.getItem(focusTaskLaunchStorageKey)).toBeNull()
  })
})
