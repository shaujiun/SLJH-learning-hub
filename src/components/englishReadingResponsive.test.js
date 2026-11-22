import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./englishReadingWorkshop.css', import.meta.url), 'utf8')

describe('英語閱讀響應式版面', () => {
  it('長題目、回饋與心智圖文字不會撐破容器', () => {
    expect(css).toMatch(/\.reading-question-list button\s*\{[^}]*overflow-wrap:\s*anywhere;/s)
    expect(css).toMatch(/\.reading-question-card h4\s*\{[^}]*overflow-wrap:\s*anywhere;/s)
    expect(css).toMatch(/\.reading-feedback\s*\{[^}]*overflow-wrap:\s*anywhere;/s)
    expect(css).toMatch(/\.reading-mind-map-center strong\s*\{[^}]*overflow-wrap:\s*anywhere;/s)
  })

  it('手機版匯入操作改為單欄且主要按鈕保有觸控高度', () => {
    const mobile = css.match(/@media \(max-width:\s*640px\)\s*\{([\s\S]*)\}\s*$/)?.[1] || ''
    expect(mobile).toMatch(/\.reading-import-controls\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s)
    expect(mobile).toMatch(/\.reading-import-controls \.reading-action[^}]*min-height:\s*44px;/s)
  })
})
