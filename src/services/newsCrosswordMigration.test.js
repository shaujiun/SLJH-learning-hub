import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20261111100000_add_news_crossword_puzzles.sql', import.meta.url),
  'utf8',
)

describe('新聞縱橫填字資料庫遷移', () => {
  it('限制題目為 8 x 8 並保留橫直提示', () => {
    expect(sql).toContain('array_length(rows, 1) = 8')
    expect(sql).toContain('char_length(row_text) <> 8')
    expect(sql).toContain('across_clues jsonb')
    expect(sql).toContain('down_clues jsonb')
  })

  it('只公開已發布題目，管理者可讀寫草稿', () => {
    expect(sql).toContain("status = 'published' or public.can_manage_word_grid_puzzles()")
    expect(sql).toContain('for all to authenticated')
    expect(sql).toContain('news_crossword_published_has_solution')
  })
})
