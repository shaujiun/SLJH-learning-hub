import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { startFactorClashRoom } from './factorClashRoomService.js'

const migration = readFileSync(
  new URL('../../supabase/migrations/20261027140000_add_factor_clash_guest_rooms.sql', import.meta.url),
  'utf8',
)

describe('因式交鋒雙人房間', () => {
  it('為兩位玩家產生各自 10 題，且不共用同一份題目', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    await startFactorClashRoom({ roomCode: '123456', seatToken: 'secret' }, 'cross', 'advanced', { rpc })
    expect(rpc).toHaveBeenCalledOnce()
    const [name, parameters] = rpc.mock.calls[0]
    expect(name).toBe('factor_clash_start_room')
    expect(parameters.p_host_questions).toHaveLength(10)
    expect(parameters.p_guest_questions).toHaveLength(10)
    expect(parameters.p_host_questions).not.toEqual(parameters.p_guest_questions)
    expect(parameters.p_host_questions.every((question) => question.mode === 'cross' && question.difficulty === 'advanced')).toBe(true)
  })

  it('資料表不直接開放，訪客只能透過座位 token 呼叫受控函式', () => {
    expect(migration).toContain('alter table public.factor_clash_rooms enable row level security')
    expect(migration).toContain('revoke all on table public.factor_clash_rooms from public, anon, authenticated')
    expect(migration).toContain('token_hash=public.factor_clash_token_hash(p_seat_token)')
    expect(migration).toContain("'questions',me.questions")
    expect(migration).not.toContain("'questions',opponent.questions")
    expect(migration).toContain('grant execute on function public.factor_clash_create_room(text) to anon,authenticated')
  })

  it('房間代碼固定為 6 位數，超過 3 分鐘離線判定中離', () => {
    expect(migration).toContain("room_code text not null unique check (room_code ~ '^[0-9]{6}$')")
    expect(migration).toContain("opponent.last_seen_at < now()-interval '3 minutes'")
    expect(migration).toContain("update public.factor_clash_room_players set status='forfeited'")
  })
})
