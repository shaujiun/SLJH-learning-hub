import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { reportFactorClashQuestion, startFactorClashRoom, useFactorClashSkill } from './factorClashRoomService.js'

const migration = readFileSync(
  new URL('../../supabase/migrations/20261027140000_add_factor_clash_guest_rooms.sql', import.meta.url),
  'utf8',
)
const balanceMigration = readFileSync(
  new URL('../../supabase/migrations/20261028100000_add_factor_clash_balanced_duel.sql', import.meta.url),
  'utf8',
)
const challengeTimingMigration = readFileSync(
  new URL('../../supabase/migrations/20261028103000_fix_factor_clash_challenge_timing.sql', import.meta.url),
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
    expect(parameters.p_host_questions.every((entry) => entry.variants.length === 5)).toBe(true)
    expect(parameters.p_host_questions[0].variants.map((question) => question.challengeTier)).toEqual([1, 2, 3, 4, 5])
  })

  it('回報成績時送出原題時限，技能另由受控 RPC 處理', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null })
    const seat = { roomCode: '123456', seatToken: 'secret' }
    await reportFactorClashQuestion(seat, {
      questionNumber: 2, points: 3, firstTry: true, elapsedMs: 25000, timedOut: false, timeLimitMs: 120000,
    }, { rpc })
    expect(rpc).toHaveBeenCalledWith('factor_clash_report_question', expect.objectContaining({ p_time_limit_ms: 120000 }))
    await useFactorClashSkill(seat, 'hint', 3, { rpc })
    expect(rpc).toHaveBeenLastCalledWith('factor_clash_use_skill', expect.objectContaining({ p_skill: 'hint', p_question_number: 3 }))
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

  it('平衡對戰由資料庫限制能量、每題技能與動態難度範圍', () => {
    expect(balanceMigration).toContain('challenge_tier smallint not null default 2 check (challenge_tier between 1 and 5)')
    expect(balanceMigration).toContain("p_skill not in ('hint','extra_time','retry','shield','challenge')")
    expect(balanceMigration).toContain('if me.last_skill_question=p_question_number')
    expect(balanceMigration).toContain('next_current_tier := greatest(1,least(5,adapted_tier+me.pending_tier_boost))')
    expect(balanceMigration).toContain('p_elapsed_ms>=p_time_limit_ms*4/5')
    expect(balanceMigration).toContain('new_score<=opponent.score-7')
    expect(balanceMigration).toContain('grant execute on function public.factor_clash_use_skill')
  })

  it('挑戰升級只套用在對手下一題，並於該題第一次答對後才給獎勵', () => {
    expect(challengeTimingMigration).toContain('challenge_bonus_pending=me.pending_tier_boost>0')
    expect(challengeTimingMigration).toContain('if me.challenge_bonus_pending and p_first_try and p_points=3')
    expect(challengeTimingMigration).toContain('update public.factor_clash_room_players set pending_tier_boost=1 where id=opponent.id')
    expect(challengeTimingMigration).not.toContain('pending_tier_boost=1,challenge_bonus_pending=true')
    expect(challengeTimingMigration).toContain('opponent.progress>=9')
  })
})
