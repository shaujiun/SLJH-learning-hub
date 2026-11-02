import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const sql = readFileSync(new URL('../../supabase/migrations/20261102190000_extend_learning_maps_for_science.sql', import.meta.url), 'utf8')

describe('science learning-map migration', () => {
  it('開放自然科並加入冊別與節次欄位', () => {
    expect(sql).toContain("'science'")
    expect(sql).toMatch(/add column if not exists volume_no smallint/i)
    expect(sql).toMatch(/add column if not exists section_no smallint/i)
    expect(sql).toMatch(/learning_maps_volume_section_order_idx/i)
  })
})
