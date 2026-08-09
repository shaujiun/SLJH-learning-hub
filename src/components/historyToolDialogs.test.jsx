import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createHistoryPreviewData } from '../../preview/historyPreviewData.js'
import { buildHistoryRelations, HistoryCompareDialog } from './HistoryToolDialogs.jsx'

describe('history learning tools', () => {
  it('builds event relations only inside the same chapter', () => {
    const { events } = createHistoryPreviewData()
    const relations = buildHistoryRelations(events)

    expect(relations.length).toBeGreaterThan(0)
    relations.forEach((relation) => {
      const fromChapterId = relation.from.chapterId || relation.from.chapter?.id
      const toChapterId = relation.to.chapterId || relation.to.chapter?.id
      expect(toChapterId).toBe(fromChapterId)
    })
  })

  it('does not invent a relation for a chapter with only one event', () => {
    const event = {
      id: 'single-event',
      chapterId: 'single-chapter',
      startYear: 1912,
      title: '單一事件',
    }

    expect(buildHistoryRelations([event])).toEqual([])
  })

  it('renders two events with the same comparison fields', () => {
    const { events } = createHistoryPreviewData()
    const html = renderToString(<HistoryCompareDialog events={events.slice(0, 2)} onClose={() => {}} onSelectEvent={() => {}} />)

    expect(html).toContain('事件並排比較')
    expect(html).toContain('左側事件')
    expect(html).toContain('右側事件')
    expect(html).toContain('原因')
    expect(html).toContain('影響')
  })
})
