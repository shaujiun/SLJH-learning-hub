import { describe, expect, it } from 'vitest'
import {
  ADVANCE_RETRY_MS,
  secondsUntilDeadline,
  shouldRequestDeadlineAdvance,
} from './animalEquationTurnClock.js'

describe('animal equation turn clock', () => {
  it('keeps the countdown positive until the actual deadline', () => {
    const deadline = '2026-09-13T12:00:08.000Z'
    expect(secondsUntilDeadline(deadline, Date.parse('2026-09-13T12:00:07.500Z'))).toBe(1)
    expect(secondsUntilDeadline(deadline, Date.parse(deadline))).toBe(0)
    expect(secondsUntilDeadline('not-a-date')).toBeNull()
  })

  it('retries a missed advance without sending it on every render or timer tick', () => {
    const pending = { secondsLeft: 0, busy: false }
    expect(shouldRequestDeadlineAdvance({ ...pending, nowMs: 1000, lastAttemptMs: -Infinity })).toBe(true)
    expect(shouldRequestDeadlineAdvance({ ...pending, nowMs: 1000 + ADVANCE_RETRY_MS - 1, lastAttemptMs: 1000 })).toBe(false)
    expect(shouldRequestDeadlineAdvance({ ...pending, nowMs: 1000 + ADVANCE_RETRY_MS, lastAttemptMs: 1000 })).toBe(true)
    expect(shouldRequestDeadlineAdvance({ ...pending, busy: true, nowMs: 9000, lastAttemptMs: 1000 })).toBe(false)
    expect(shouldRequestDeadlineAdvance({ ...pending, secondsLeft: 1, nowMs: 9000, lastAttemptMs: 1000 })).toBe(false)
  })
})
