import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createHistoryPreviewData } from '../../preview/historyPreviewData.js'
import { historyRegions } from '../lib/historyAtlas.js'
import {
  areHistoryYearsContinuous,
  createHistoryEraBands,
  getHistoryScaleYears,
  getTimelineColumnWidths,
  historyPeriodGridColumn,
  layoutHistoryPeriods,
  Timeline,
} from './HistoryAtlas.jsx'

describe('history synchronized timeline', () => {
  it('keeps successive dynasties on one row and moves only true overlaps to another row', () => {
    const layout = layoutHistoryPeriods([
      { id: 'shang', startYear: -1600, endYear: -1046 },
      { id: 'western-zhou', startYear: -1046, endYear: -771 },
      { id: 'spring-autumn', startYear: -770, endYear: -476 },
      { id: 'warring-states', startYear: -475, endYear: -221 },
      { id: 'qin', startYear: -221, endYear: -206 },
      { id: 'parallel-state', startYear: -300, endYear: -250 },
    ])

    expect(Object.fromEntries(layout.items.map(({ period, row }) => [period.id, row]))).toEqual({
      shang: 0,
      'western-zhou': 0,
      'spring-autumn': 0,
      'warring-states': 0,
      'parallel-state': 1,
      qin: 0,
    })
    expect(layout.rowCount).toBe(2)
  })

  it('treats adjacent written years as a continuous historical transition', () => {
    expect(areHistoryYearsContinuous(-771, -770)).toBe(true)
    expect(areHistoryYearsContinuous(-476, -475)).toBe(true)
    expect(areHistoryYearsContinuous(316, 317)).toBe(true)
    expect(areHistoryYearsContinuous(-1, 1)).toBe(true)
    expect(areHistoryYearsContinuous(-206, -202)).toBe(false)
  })

  it('builds broad era bands instead of one label for every event year', () => {
    const scaleYears = getHistoryScaleYears(3)
    const eventYears = [-1046, -221, 630, 960, 1840, 1898]
    const boundaries = [...new Set([...scaleYears, ...eventYears])].sort((left, right) => left - right)
    const bands = createHistoryEraBands(boundaries, 3)

    expect(bands).toHaveLength(scaleYears.length - 1)
    expect(bands[0].label).toBe('西元前 1600～1000 年')
    expect(bands.some((band) => band.label.includes('1840'))).toBe(false)
  })

  it('places successive dynasties against the same boundary without overlapping a grid cell', () => {
    expect(historyPeriodGridColumn(0, 1)).toBe('2 / 3')
    expect(historyPeriodGridColumn(1, 2)).toBe('3 / 4')
  })

  it('supports readable and chronological timeline widths with zoom', () => {
    const boundaries = [1912, 1920, 1950]
    const readable = getTimelineColumnWidths(boundaries, 'reading', 4, 100)
    const linear = getTimelineColumnWidths(boundaries, 'linear', 4, 100)
    const zoomed = getTimelineColumnWidths(boundaries, 'linear', 4, 150)

    expect(readable).toEqual([68, 68, 42])
    expect(linear[1]).toBeGreaterThan(linear[0])
    expect(zoomed[1]).toBeGreaterThan(linear[1])
  })

  it('renders regional timelines and compact event buttons without a runtime error', () => {
    const data = createHistoryPreviewData()
    const events = data.events.filter((event) => event.chapter.volumeNo === 3)
    const html = renderToString(
      <Timeline
        events={events}
        scaleEvents={events}
        regions={historyRegions}
        volumeNo={3}
        canManage={false}
        onSelect={() => {}}
      />,
    )

    const readableHtml = html.replaceAll('<!-- -->', '')
    expect(readableHtml).toContain('各地區同步時間軸')
    expect(readableHtml).toContain('中國時間軸')
    expect(readableHtml).toContain('臺灣時間軸')
    expect(readableHtml).toContain('中國事件')
    expect(readableHtml).toContain('history-timeline-compact-card')
    expect(readableHtml).toContain('快速前往')
    expect(readableHtml).toContain('放大時間軸')
  })

  it('keeps an event at the latest year inside the final timeline column', () => {
    const data = createHistoryPreviewData()
    const events = data.events.filter((event) => event.chapter.volumeNo === 4)
    const latestEvent = events.reduce((latest, event) => (
      Number(event.startYear) > Number(latest.startYear) ? event : latest
    ))
    const html = renderToString(
      <Timeline
        events={[latestEvent]}
        scaleEvents={events}
        regions={historyRegions}
        volumeNo={4}
        canManage={false}
        onSelect={() => {}}
      />,
    )

    expect(html).toContain(latestEvent.title)
    expect(html).not.toContain('grid-column:0')
  })
})
