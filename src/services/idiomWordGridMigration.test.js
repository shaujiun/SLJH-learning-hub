import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migrationUrl = new URL('../../supabase/migrations/20261031150000_add_idiom_word_grid.sql', import.meta.url)
const seedUrl = new URL('../../supabase/migrations/20261031151000_seed_idiom_word_grid.sql', import.meta.url)
const publicReadUrl = new URL('../../supabase/migrations/20261031152000_fix_idiom_word_grid_public_read.sql', import.meta.url)
const sql = readFileSync(migrationUrl, 'utf8')
const seedSql = readFileSync(seedUrl, 'utf8')
const publicReadSql = readFileSync(publicReadUrl, 'utf8')

describe('成語填字圖 migration', () => {
  it('建立題庫、能量、提示與通關資料並套用 RLS', () => {
    expect(sql).toContain('create table if not exists public.idiom_entries')
    expect(sql).toContain('create table if not exists public.idiom_word_grid_wallets')
    expect(sql).toContain('create policy idiom_wallet_self_read')
    expect(sql).toContain('grant select on public.idiom_entries to anon, authenticated')
  })

  it('由資料庫原子性限制能量上限與首次通關獎勵', () => {
    expect(sql).toContain('create or replace function public.spend_idiom_word_grid_hint')
    expect(sql).toContain('wallet.energy >= hint_cost')
    expect(sql).toContain('least(20, public.idiom_word_grid_wallets.energy + earned)')
    expect(sql).toContain('on conflict (student_id, puzzle_id) do nothing')
    expect(sql).toContain('select count(*)::integer into actual_hints_used')
    expect(sql).toContain('case when actual_hints_used = 0 then 4 else 3 end')
    expect(sql).toContain("lower(task.subject_code_snapshot::text) = 'chinese'")
    expect(sql).toContain("lower(task.activity_code_snapshot::text) = 'idiom_word_grid'")
  })

  it('新增國文系統並固定每週派發一題成語填字圖', () => {
    expect(sql).toContain("'chinese', '國文'")
    expect(sql).toContain('weekly_minimum = 1')
    expect(sql).toContain('weekly_maximum = 1')
    expect(sql).toContain("15, 1, 1, 'common', true")
    expect(sql).toContain("'idiom_word_grid', '成語填字圖'")
  })

  it('預載教育部成語資料與四個漸進難度題組', () => {
    expect(seedSql.match(/insert into public\.idiom_entries/g)).toHaveLength(24)
    expect(seedSql.match(/insert into public\.idiom_word_grid_puzzles/g)).toHaveLength(4)
    expect(seedSql).toContain("values ('一心一意', '同心同意。")
    expect(seedSql).toContain("'challenge'")
  })

  it('匿名讀取政策不呼叫管理者專用函式', () => {
    expect(publicReadSql).toContain('create policy idiom_entries_active_read')
    expect(publicReadSql).toContain('create policy idiom_puzzles_published_read')
    expect(publicReadSql).toContain("using (status = 'published')")
    expect(publicReadSql).not.toContain('grant execute on function public.can_manage_word_grid_puzzles() to anon')
  })
})
