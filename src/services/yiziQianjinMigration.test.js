import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const baseSql = readFileSync(new URL('../../supabase/migrations/20261122120000_add_yizi_qianjin_games.sql', import.meta.url), 'utf8')
const roomSql = readFileSync(new URL('../../supabase/migrations/20261122120500_add_yizi_idiom_rooms.sql', import.meta.url), 'utf8')
const seedSql = readFileSync(new URL('../../supabase/migrations/20261122121000_seed_yizi_qianjin_bank.sql', import.meta.url), 'utf8')
const fourSayingsRoomSql = readFileSync(new URL('../../supabase/migrations/20261123110000_add_yizi_four_sayings_rooms.sql', import.meta.url), 'utf8')
const multiplayerSql = readFileSync(new URL('../../supabase/migrations/20261123170000_expand_yizi_four_sayings_multiplayer.sql', import.meta.url), 'utf8')

describe('一字千金資料庫遷移', () => {
  it('建立題庫、作答、成語與房間資料表', () => {
    for (const table of ['yizi_questions', 'yizi_idiom_lexicon', 'yizi_attempts', 'yizi_rooms', 'yizi_room_players', 'yizi_room_moves']) {
      expect(baseSql).toContain(`public.${table}`)
    }
    expect(baseSql).toContain("'remove_part', 'four_sayings', 'component_pairs', 'idiom_board'")
    expect(baseSql).toContain('不屬於每日任務')
  })

  it('房間由伺服器驗證回合、時間與合法成語', () => {
    expect(roomSql).toContain('yizi_submit_room_move')
    expect(roomSql).toContain('yizi_not_your_turn')
    expect(roomSql).toContain('yizi_turn_timed_out')
    expect(roomSql).toContain("interval '120 seconds'")
    expect(roomSql).toContain('yizi_board_can_place')
  })

  it('種子資料記錄來源版本並包含三種單人題型', () => {
    expect(seedSql).toContain('588cb8eabab92f42f73b4f8e3bf4873a8ed003c9')
    expect(seedSql).toContain("'remove_part'")
    expect(seedSql).toContain("'four_sayings'")
    expect(seedSql).toContain("'component_pairs'")
  })

  it('四說新語競賽固定同題、5 或 10 題與房主作答設定', () => {
    for (const table of ['yizi_four_sayings_rooms', 'yizi_four_sayings_players', 'yizi_four_sayings_answers']) {
      expect(fourSayingsRoomSql).toContain(`public.${table}`)
    }
    expect(fourSayingsRoomSql).toContain('question_count in (5, 10)')
    expect(fourSayingsRoomSql).toContain("input_mode in ('click', 'keyboard', 'handwriting')")
    expect(fourSayingsRoomSql).toContain('question_ids[selected_room.current_round]')
    expect(fourSayingsRoomSql).toContain('yizi_four_sayings_submit_answer')
    expect(fourSayingsRoomSql).toContain('total_duration_ms')
  })

  it('四說新語支援 8 人一般房、36 人全班房與積分／淘汰賽', () => {
    expect(multiplayerSql).toContain('player_limit in (8, 36)')
    expect(multiplayerSql).toContain("competition_mode in ('points', 'eliminate_1', 'eliminate_2')")
    expect(multiplayerSql).toContain("status in ('connected', 'eliminated', 'left', 'forfeited')")
    expect(multiplayerSql).toContain('player_count')
    expect(multiplayerSql).toContain('yizi_four_sayings_mark_failure')
    expect(multiplayerSql).toContain('player_count < 2')
  })
})
