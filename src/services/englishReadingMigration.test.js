import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(new URL('../../supabase/migrations/20260922180000_add_english_reading_lessons.sql', import.meta.url), 'utf8')
const questionMigration = readFileSync(new URL('../../supabase/migrations/20260922190000_add_english_reading_questions.sql', import.meta.url), 'utf8')
const gpsDraftMigration = readFileSync(new URL('../../supabase/migrations/20260926120000_seed_english_reading_gps_draft.sql', import.meta.url), 'utf8')

describe('英語閱讀資料庫存取界線', () => {
  it('不給訪客讀取資料表，且資料列權限保持開啟', () => {
    expect(migration).toContain('enable row level security')
    expect(migration).toContain('revoke all on public.english_reading_lessons from public, anon')
    expect(migration).not.toMatch(/grant\s+select\s+on\s+public\.english_reading_lessons\s+to\s+anon/i)
  })
  it('學生必須有有效帳號且只可看發布期間內的文章', () => {
    expect(migration).toContain("profile.user_type = 'student'")
    expect(migration).toContain("profile.approval_status = 'approved'")
    expect(migration).toContain('student.is_active')
    expect(migration).toContain("status = 'published'")
    expect(migration).toContain('available_from <=')
    expect(migration).toContain('available_until >=')
    expect(migration).not.toContain('class_id')
  })
  it('答案表只有管理者可讀，學生僅透過檢查權限的函式送出', () => {
    expect(questionMigration).toContain('alter table public.english_reading_answer_keys enable row level security')
    expect(questionMigration).toContain('create policy english_reading_keys_admin')
    expect(questionMigration).not.toContain('english_reading_keys_student')
    expect(questionMigration).toContain('if not public.is_active_learning_student()')
    expect(questionMigration).toContain("item.status <> 'published'")
    expect(questionMigration).toContain("item.group_scope <> current_group")
    expect(questionMigration).toContain('reading_questions_required_before_publish')
    expect(questionMigration).toContain('revoke all on function public.submit_english_reading_answer(uuid, text[], text) from public, anon')
  })
  it('GPS 閱讀稿含文章、六題與私有正解，並保持未發布', () => {
    expect(gpsDraftMigration).toContain("'A Stormy Day for GPS'")
    expect(gpsDraftMigration).toContain("'聯合報好讀周報'")
    expect(gpsDraftMigration).toContain("'draft'")
    expect(gpsDraftMigration).not.toMatch(/'published'\s*\)?\s*(?:;|where)/i)
    expect(gpsDraftMigration.match(/20260921010[1-6]/g)).toHaveLength(12)
    expect(gpsDraftMigration).toContain("array['stop', 'crying']")
    expect(gpsDraftMigration).toContain("array['B']")
    expect(gpsDraftMigration).toContain("array['A']")
    expect(gpsDraftMigration).toContain("array['C']")
  })
})
