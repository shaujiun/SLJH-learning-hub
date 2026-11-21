import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const migrationPath = fileURLToPath(new URL('../../supabase/migrations/20261017100000_add_unified_learning_progress.sql', import.meta.url))
const sql = readFileSync(migrationPath, 'utf8')

describe('統一學習進度 migration', () => {
  it('建立逐次紀錄、累積摘要與唯一作答鍵', () => {
    expect(sql).toContain('create table if not exists public.student_activity_attempts')
    expect(sql).toContain('create table if not exists public.student_activity_progress')
    expect(sql).toContain('unique (student_id, attempt_key)')
  })

  it('只由登入學生 RPC 寫入且保留 RLS', () => {
    expect(sql).toContain("profile.user_type = 'student'")
    expect(sql).toContain("profile.approval_status = 'approved'")
    expect(sql).toContain('alter table public.student_activity_attempts enable row level security')
    expect(sql).toContain('revoke insert, update, delete on public.student_activity_attempts')
    expect(sql).toContain('security definer set search_path = public')
  })

  it('相同作答識別碼不會重複累加', () => {
    expect(sql).toContain('on conflict (student_id, attempt_key) do nothing')
    expect(sql).toContain("'duplicate', inserted_attempt_id is null")
  })
})
