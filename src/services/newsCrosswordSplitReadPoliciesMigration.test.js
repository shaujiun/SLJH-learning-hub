import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  new URL('../../supabase/migrations/20261112135500_split_news_crossword_read_policies.sql', import.meta.url),
  'utf8',
)

describe('新聞縱橫填字公開與管理者讀取政策', () => {
  it('將預定公開與管理者預覽拆成不同政策', () => {
    expect(sql).toContain('create policy news_crossword_puzzles_scheduled_read')
    expect(sql).toContain('for select to anon, authenticated')
    expect(sql).toContain("published_on <= (now() at time zone 'Asia/Taipei')::date")
    expect(sql).toContain('create policy news_crossword_puzzles_admin_read')
    expect(sql).toContain('for select to authenticated')
  })
})
