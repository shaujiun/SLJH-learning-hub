import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { buildIdiomPuzzle } from '../lib/idiomWordGrid.js'
import { IdiomBoard, IdiomLearningPanel, PlayIdiomPuzzle } from './IdiomWordGrid.jsx'

const puzzle = {
  id: 'test-puzzle', title: '成語挑戰', publishedOn: '2026-10-31', sourceVersion: 'dict_idioms_2020_20260929',
  ...buildIdiomPuzzle([
    { id: 'a', phrase: '一心一意', definition: '專心一意。', source: '教育部《成語典》。', sourceUrl: 'https://dict.idioms.moe.edu.tw/' },
    { id: 'b', phrase: '心平氣和', definition: '心情平靜。', source: '教育部《成語典》。' },
    { id: 'c', phrase: '和氣生財', definition: '待人和善能招來財富。', source: '教育部《成語典》。' },
    { id: 'd', phrase: '財源廣進', definition: '財富從各方而來。', source: '教育部《成語典》。' },
  ], 'beginner'),
}

describe('成語填字圖畫面', () => {
  it('依題目長寬建立非固定 10×10 的格線', () => {
    const html = renderToStaticMarkup(<IdiomBoard puzzle={puzzle} assignments={{}} revealedKeys={[]} onCellClick={() => {}} />)
    expect(html).toContain(`--idiom-grid-columns:${puzzle.board.width}`)
    expect(html).toContain('交錯格')
  })

  it('通關後列出成語、教育部釋義與出處，圖片未確認時不亂配圖', () => {
    const html = renderToStaticMarkup(<IdiomLearningPanel puzzle={puzzle} />)
    expect(html).toContain('一心一意')
    expect(html).toContain('專心一意。')
    expect(html).toContain('典源或出處')
    expect(html).toContain('插圖須經教師確認與成語內容相符後才會顯示')
  })

  it('提供三種提示並清楚顯示能量成本', () => {
    const html = renderToStaticMarkup(<PlayIdiomPuzzle puzzle={puzzle} context={{ studentId: '', energy: 5, remoteEnabled: false }} focusTaskId="" onEnergyChange={() => {}} />)
    expect(html).toContain('一字提示')
    expect(html).toContain('交錯字提示')
    expect(html).toContain('錯字檢查')
    expect(html).toContain('1 能量')
    expect(html).toContain('2 能量')
  })
})
