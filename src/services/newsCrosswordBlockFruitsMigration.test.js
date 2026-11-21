import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const sql = readFileSync(
  new URL('../../supabase/migrations/20261111150000_add_news_crossword_block_fruits.sql', import.meta.url),
  'utf8',
)

describe('新聞縱橫填字水果設定資料庫更新', () => {
  it('使用 JSON 物件保存各阻隔格的水果種類', () => {
    expect(sql).toContain("block_fruits jsonb not null default '{}'::jsonb")
    expect(sql).toContain("jsonb_typeof(block_fruits) = 'object'")
  })
})
