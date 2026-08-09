import { describe, expect, it } from 'vitest'
import { getHistoryPeriodTracks } from './historyPeriods.js'

describe('history period tracks', () => {
  it('provides the grade 8 first-semester dynasty comparison', () => {
    const tracks = getHistoryPeriodTracks(3, 2026)
    const labels = tracks.flatMap((track) => track.periods.map((period) => period.label))
    expect(labels).toContain('秦')
    expect(labels).toContain('北宋')
    expect(labels).toContain('清')
    expect(tracks.some((track) => track.label === '日本')).toBe(true)

    const periods = Object.fromEntries(tracks.flatMap((track) => (
      track.periods.map((period) => [period.id, period])
    )))
    expect(periods['western-jin'].startYear).toBe(265)
    expect(periods.sui.startYear).toBe(581)
    expect(periods.yuan.startYear).toBe(1271)
    expect(periods.goryeo.startYear).toBe(918)
  })

  it('resolves ongoing modern periods to the current year', () => {
    const tracks = getHistoryPeriodTracks(4, 2026)
    const ongoing = tracks.flatMap((track) => track.periods).filter((period) => period.isOngoing)
    expect(ongoing.length).toBeGreaterThan(0)
    expect(ongoing.every((period) => period.endYear === 2026)).toBe(true)
  })
})
