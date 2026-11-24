import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import HandwritingAnswer, { coalescedPointerSamples, drawPad, normalizeHandwritingStrokes, rankHandwritingCandidates, recognizeTraditionalChinese } from './HandwritingAnswer.jsx'

describe('HandwritingAnswer', () => {
  it('四字模式建立四個獨立手寫區', () => {
    const html = renderToStaticMarkup(<HandwritingAnswer length={4} value="" onChange={() => {}} />)
    expect((html.match(/手寫區/g) || []).length).toBe(4)
    expect(html).toContain('停筆後自動辨識')
    expect(html).toContain('立即辨識')
    expect(html).not.toContain('改用鍵盤')
    expect(html).not.toContain('失敗')
    expect(html).not.toContain('尚未選字')
  })

  it('只保留單一中文字候選', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => ['SUCCESS', [[null, ['字', '中文', '語']]]] }))
    await expect(recognizeTraditionalChinese([{ x: [1], y: [1] }], fetcher)).resolves.toEqual(['字', '語'])
    const request = JSON.parse(fetcher.mock.calls[0][1].body)
    expect(request.requests[0].ink[0]).toHaveLength(3)
    expect(request.requests[0].ink[0][2]).toEqual([8])
  })

  it('正規化筆跡並維持跨筆畫遞增時間', () => {
    const result = normalizeHandwritingStrokes([
      { x: [10, 20], y: [20, 20], t: [0, 10] },
      { x: [15, 15], y: [30, 40], t: [30, 40] },
    ])
    expect(result).toHaveLength(2)
    expect(Math.min(...result.flatMap((stroke) => stroke.x))).toBeGreaterThan(0)
    expect(result[1].t[0]).toBeGreaterThan(result[0].t.at(-1))
  })

  it('依畫面可見文字優先排列候選字但不刪除其他候選', () => {
    expect(rankHandwritingCandidates(['觀', '歡', '袖'], ['袖', '手', '旁', '觀'])).toEqual(['觀', '袖', '歡'])
  })

  it('從原生 PointerEvent 取得合併筆跡點，失敗時仍保留目前事件', () => {
    const samples = [{ clientX: 1 }, { clientX: 2 }]
    expect(coalescedPointerSamples({ nativeEvent: { getCoalescedEvents: () => samples } })).toEqual(samples)
    const fallback = { clientX: 3, getCoalescedEvents: () => { throw new Error('not supported') } }
    expect(coalescedPointerSamples(fallback)).toEqual([fallback])
  })

  it('單點筆畫會畫成可見圓點', () => {
    const context = Object.fromEntries(['clearRect', 'setLineDash', 'beginPath', 'moveTo', 'lineTo', 'stroke', 'arc', 'fill'].map((name) => [name, vi.fn()]))
    drawPad({ getContext: () => context }, [{ x: [42], y: [56] }])
    expect(context.arc).toHaveBeenCalledWith(42, 56, 3, 0, Math.PI * 2)
    expect(context.fill).toHaveBeenCalled()
  })
})
