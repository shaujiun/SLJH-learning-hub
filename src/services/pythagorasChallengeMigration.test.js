import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

const migrationUrl = new URL('../../supabase/migrations/20261012150000_add_pythagoras_challenge_focus_task.sql', import.meta.url)
const sql = fs.readFileSync(migrationUrl, 'utf8')

describe('畢氏定理挑戰賽每日任務 migration', () => {
  it('加入數學活動池並使用對應入口與通關條件', () => {
    expect(sql).toContain("'pythagoras_challenge'")
    expect(sql).toContain("'&game=pythagoras-challenge'")
    expect(sql).toMatch(/10,\s*10,\s*100,\s*10,\s*true/s)
  })

  it('不改寫數學科原有的每週派發數量', () => {
    expect(sql).not.toMatch(/update\s+public\.learning_systems/i)
    expect(sql).not.toMatch(/weekly_(minimum|maximum)\s*=/i)
  })
})
