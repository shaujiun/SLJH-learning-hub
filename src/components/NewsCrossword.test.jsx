import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  createEmptyNewsCrosswordClues,
  createEmptyNewsCrosswordGrid,
  newsCrosswordCellTypes,
  newsCrosswordDirections,
} from '../lib/newsCrossword.js'
import NewsCrossword from './NewsCrossword.jsx'

describe('新聞縱橫填字入口', () => {
  it('原始元件保留第三個填字圖分頁名稱', () => {
    expect(NewsCrossword).toBeTypeOf('function')
    const source = renderToStaticMarkup(
      <nav className="word-grid-mode-tabs">
        <a href="?puzzle=word-grid">報紙填字圖</a>
        <a href="?puzzle=word-grid&mode=news">新聞縱橫填字</a>
        <a href="?puzzle=word-grid&mode=idiom">成語填字圖</a>
      </nav>,
    )
    expect(source).toContain('新聞縱橫填字')
  })

  it('測試資料可建立 8 x 8 且同格橫直題號', () => {
    const grid = createEmptyNewsCrosswordGrid()
    grid[7] = { type: newsCrosswordCellTypes.block, value: '' }
    const across = createEmptyNewsCrosswordClues(newsCrosswordDirections.across)
    const down = createEmptyNewsCrosswordClues(newsCrosswordDirections.down)
    across[0] = { ...across[0], row: 0, col: 0, text: '橫式測試' }
    down[0] = { ...down[0], row: 0, col: 0, text: '直式測試' }
    expect(grid).toHaveLength(64)
    expect(across[0].row).toBe(down[0].row)
    expect(across[0].col).toBe(down[0].col)
  })
})
