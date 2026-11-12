import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./newsCrossword.css', import.meta.url), 'utf8')

describe('新聞縱橫填字水果格樣式', () => {
  it('水果填滿固定方格，但不改變棋盤列高', () => {
    expect(css).toContain('grid-template-rows: repeat(8, minmax(0, 1fr))')
    expect(css).toMatch(/\.news-crossword-fruit\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;/s)
    expect(css).toMatch(/\.news-crossword-cell\s*\{[^}]*aspect-ratio:\s*1;/s)
  })
})
