import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(
  new URL('../../supabase/migrations/20261127153000_add_idiom_illustration_storage.sql', import.meta.url),
  'utf8',
)

describe('成語教師圖片儲存空間 migration', () => {
  it('建立公開圖片 bucket，並限制只有成語管理者可寫入', () => {
    expect(sql).toContain("'idiom-word-grid-media'")
    expect(sql).toContain('5242880')
    expect(sql).toContain("array['image/jpeg', 'image/png', 'image/webp']")
    expect(sql).toContain('public.can_manage_word_grid_puzzles()')
    expect(sql).toContain('for insert to authenticated')
    expect(sql).toContain('for delete to authenticated')
  })
})
