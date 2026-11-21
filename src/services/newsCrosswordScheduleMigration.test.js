import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  new URL('../../supabase/migrations/20261112133000_schedule_news_crossword_publication.sql', import.meta.url),
  'utf8',
)

describe('新聞縱橫填字預定公開日期', () => {
  it('未到題目日期時只允許管理者讀取', () => {
    expect(sql).toContain('public.can_manage_word_grid_puzzles()')
    expect(sql).toContain("status = 'published'")
    expect(sql).toContain("published_on <= (now() at time zone 'Asia/Taipei')::date")
  })
})
