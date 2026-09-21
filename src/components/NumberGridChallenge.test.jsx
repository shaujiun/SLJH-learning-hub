import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createNumberGridDraft, numberGridChallenges } from '../lib/numberGridChallenge.js'
import { ChallengeBoard, gridLineSegments, NumberGridEditor } from './NumberGridChallenge.jsx'

describe('十拿九穩題目畫布', () => {
  it('只讓 9 個題目格可見及可點，其他 16 個畫布位置不呈現方格', () => {
    const challenge = numberGridChallenges[0]
    const html = renderToStaticMarkup(<ChallengeBoard challenge={challenge} entries={Array(9).fill(null)} />)
    expect(html.match(/role="gridcell"/g)).toHaveLength(9)
    expect(html.match(/class="number-grid-hidden-cell"/g)).toHaveLength(16)
    expect(html).toContain('周圍相鄰方格合計 20')
    expect(html).toContain('橫列合計 18')
  })

  it.each(numberGridChallenges)('$id draws each shared grid edge only once', (challenge) => {
    const segments = gridLineSegments(challenge.cells)
    const html = renderToStaticMarkup(<ChallengeBoard challenge={challenge} entries={Array(9).fill(null)} />)
    expect(new Set(segments).size).toBe(segments.length)
    expect(html).toContain(`d="${segments.join(' ')}"`)
    expect(html).toContain('class="number-grid-grid-lines"')
    expect(html).not.toContain('has-right-edge')
    expect(html).not.toContain('has-bottom-edge')
  })

  it('shows a 5x5 new-puzzle editor with nine position and answer controls', () => {
    const html = renderToStaticMarkup(<NumberGridEditor puzzle={createNumberGridDraft('2026-09-21')} />)
    expect(html).toContain('建立十拿九穩新題')
    expect(html.match(/答案<select/g)).toHaveLength(9)
    expect(html).toContain('圓圈提示')
    expect(html).toContain('箭頭提示')
    expect(html).toContain('儲存題目')
  })
})
