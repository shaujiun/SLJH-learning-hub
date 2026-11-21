import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  new URL('../../supabase/migrations/20261112134500_fix_news_crossword_scheduled_read_policy.sql', import.meta.url),
  'utf8',
)

describe('新聞縱橫填字預定公開權限修正', () => {
  it('匿名學生不會執行管理者專用權限函式', () => {
    expect(sql).toContain('case')
    expect(sql).toContain("when status = 'published'")
    expect(sql).toContain("when auth.uid() is null then false")
    expect(sql).toContain('else public.can_manage_word_grid_puzzles()')
  })
})
