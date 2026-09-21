import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapRowsToGrid } from '../lib/wordGridPuzzle.js'
import { AnswerPanel } from './WordGridPuzzle.jsx'

const grid = mapRowsToGrid([
  '字.########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
])
const solutionGrid = grid.map((cell, index) => index === 1 ? { type: 'given', value: '圖' } : cell)
const puzzle = { grid, solutionGrid, answerExplanation: '測試解答說明' }

describe('填字圖解答面板', () => {
  it('尚未全對時不把解答或說明放入頁面', () => {
    const html = renderToStaticMarkup(<AnswerPanel puzzle={puzzle} unlocked={false} />)
    expect(html).toContain('完成一輪並全部答對後解鎖')
    expect(html).not.toContain('測試解答說明')
    expect(html).not.toContain('圖')
  })

  it('全對解鎖後才提供完整解答與說明', () => {
    const html = renderToStaticMarkup(<AnswerPanel puzzle={puzzle} unlocked />)
    expect(html).toContain('已解鎖，可展開查看')
    expect(html).toContain('測試解答說明')
    expect(html).toContain('圖')
  })
})
