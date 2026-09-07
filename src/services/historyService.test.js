import { describe, expect, it, vi } from 'vitest'
import { attachHistoryQuestions, loadHistoryAtlas } from './historyService.js'

function queryResult(data) {
  const result = { data, error: null }
  const query = {
    select: () => query,
    order: () => query,
    eq: () => query,
    maybeSingle: () => Promise.resolve(result),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }
  return query
}

describe('history question service mapping', () => {
  it('attaches published question rows to the related event by type', () => {
    const events = [{ id: 'event-1', title: '事件一', pastQuestions: [], practiceQuestions: [] }]
    const result = attachHistoryQuestions(events, [
      {
        id: 'question-1',
        question_code: 'q-001',
        event_id: 'event-1',
        question_type: 'past',
        prompt: '題目',
        answer: '答案',
        source_name: '國中教育會考',
        source_year: '114 年',
        status: 'published',
        display_order: 10,
      },
      {
        id: 'question-2',
        question_code: 'q-002',
        event_id: 'event-1',
        question_type: 'practice',
        prompt: '自編題',
        answer: '答案',
        source_name: '石榴國中教師自編',
        status: 'draft',
        display_order: 20,
      },
    ])

    expect(result[0].pastQuestions).toHaveLength(1)
    expect(result[0].practiceQuestions).toHaveLength(1)
    expect(result[0].pastQuestions[0].source).toBe('114 年｜國中教育會考')
  })

  it('does not request account permissions or reader positions in guest mode', async () => {
    const requestedTables = []
    const client = {
      from: vi.fn((table) => {
        requestedTables.push(table)
        return queryResult([])
      }),
      rpc: vi.fn(),
    }

    const result = await loadHistoryAtlas(client, { guestMode: true })

    expect(result).toMatchObject({ chapters: [], events: [], canManage: false, position: null })
    expect(client.rpc).not.toHaveBeenCalled()
    expect(requestedTables).toEqual(['history_chapters', 'history_questions', 'history_events'])
    expect(requestedTables).not.toContain('history_reader_positions')
  })
})
