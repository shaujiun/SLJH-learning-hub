import { describe, expect, it } from 'vitest'
import { requestEnglishReadingAi } from './englishReadingAiService.js'

describe('英語閱讀 AI 服務', () => {
  it('只透過登入後的 Supabase Edge Function 呼叫 AI', async () => {
    let invocation
    const client = { functions: { invoke: async (name, options) => {
      invocation = [name, options]
      return { data: { result: { lesson: { title: 'Test' }, questions: [], decision: 'enough', message: '題目足夠，不必再生成新題目' } }, error: null }
    } } }
    const result = await requestEnglishReadingAi('evaluate_questions', { english: 'An article.' }, [], client)
    expect(invocation[0]).toBe('analyze-english-reading')
    expect(invocation[1].body).toEqual(expect.objectContaining({ action: 'evaluate_questions' }))
    expect(result.decision).toBe('enough')
  })

  it('拒絕沒有文章的自動編題', async () => {
    await expect(requestEnglishReadingAi('enrich_questions', { english: '' }, [], {})).rejects.toThrow('英文文章')
  })
})
