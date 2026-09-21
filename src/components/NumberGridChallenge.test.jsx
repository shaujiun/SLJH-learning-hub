import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { numberGridChallenges } from '../lib/numberGridChallenge.js'
import { ChallengeBoard } from './NumberGridChallenge.jsx'

describe('十拿九穩題目畫布', () => {
  it('只讓 9 個題目格可見及可點，其他 16 個畫布位置不呈現方格', () => {
    const challenge = numberGridChallenges[0]
    const html = renderToStaticMarkup(<ChallengeBoard challenge={challenge} entries={Array(9).fill(null)} />)
    expect(html.match(/role="gridcell"/g)).toHaveLength(9)
    expect(html.match(/class="number-grid-hidden-cell"/g)).toHaveLength(16)
    expect(html).toContain('周圍相鄰方格合計 20')
    expect(html).toContain('橫列合計 18')
  })
})
