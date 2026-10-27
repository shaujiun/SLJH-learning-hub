import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL('../../supabase/migrations/20261027130000_add_factor_clash_single_practice.sql', import.meta.url),
  'utf8',
)

describe('因式交鋒資料庫 migration', () => {
  it('以 RLS 限制學生只新增與讀取自己的練習紀錄', () => {
    expect(migration).toContain('alter table public.factor_clash_sessions enable row level security')
    expect(migration).toContain('with check (public.is_student_self(student_id))')
    expect(migration).toContain('using (public.is_student_self(student_id))')
    expect(migration).toContain('grant select, insert on table public.factor_clash_sessions to authenticated')
  })

  it('每日任務固定五題，完成即可，不以得分設門檻', () => {
    expect(migration).toContain("'factor_clash_solo'")
    expect(migration).toContain("'&game=factor-clash&solo=1'")
    expect(migration).toContain('5, 5, 0, 12, true')
  })
})
