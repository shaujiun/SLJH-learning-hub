import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import HandwritingAnswer, { recognizeTraditionalChinese } from './HandwritingAnswer.jsx'

describe('HandwritingAnswer', () => {
  it('四字模式建立四個獨立手寫區', () => {
    const html = renderToStaticMarkup(<HandwritingAnswer length={4} value="" onChange={() => {}} />)
    expect((html.match(/手寫區/g) || []).length).toBe(4)
    expect(html).toContain('辨識')
  })

  it('只保留單一中文字候選', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ['SUCCESS', [[null, ['字', '中文', '語']]]] }))
    await expect(recognizeTraditionalChinese([{ x: [1], y: [1] }], fetcher)).resolves.toEqual(['字', '語'])
  })
})
