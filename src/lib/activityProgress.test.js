import { describe, expect, it } from 'vitest'
import {
  buildFactorClashDuelProgress,
  buildFactorClashSoloProgress,
  buildIdiomWordGridProgress,
  buildNewsCrosswordProgress,
  buildPeriodicBattleProgress,
  buildSchulteProgress,
} from './activityProgress.js'

describe('跨活動統一進度資料', () => {
  it('因式交鋒單人局依 15 分換算百分比並保留每日任務來源', () => {
    const payload = buildFactorClashSoloProgress({
      focusTaskId: 'task-1', mode: 'cross', difficulty: 'advanced', questionCount: 5,
      points: 10, firstTryCorrect: 3, secondTryCorrect: 1, timeoutCount: 1,
    })
    expect(payload).toMatchObject({
      activityCode: 'factor_clash', modeCode: 'cross_advanced', source: 'daily_task',
      score: 66.67, correctCount: 4, questionCount: 5,
    })
  })

  it('因式交鋒雙人局使用房間與座位形成可重送但不重複的識別碼', () => {
    const payload = buildFactorClashDuelProgress({
      room: { roomCode: '123456', mode: 'area', difficulty: 'basic', questionCount: 10 },
      self: { id: 'seat-a', score: 24, firstTryCorrect: 7, totalElapsedMs: 94500 },
    })
    expect(payload).toMatchObject({
      modeCode: 'area_basic_duel', score: 80, durationSeconds: 95,
      attemptKey: 'factor-clash-duel:123456:seat-a',
    })
  })

  it('兩種填字題以題目識別碼防止同一關跨裝置重複累加', () => {
    const puzzle = { id: 'puzzle-9', publishedOn: '2026-11-21', difficulty: 'basic' }
    expect(buildIdiomWordGridProgress({ puzzle, answerCellCount: 12, hintsUsed: 2 })).toMatchObject({
      score: 100, questionCount: 12, attemptKey: 'idiom-word-grid:puzzle-9',
    })
    expect(buildNewsCrosswordProgress({ puzzle, answerCellCount: 40 })).toMatchObject({
      score: 100, questionCount: 40, attemptKey: 'news-crossword:puzzle-9',
    })
  })

  it('元素週期表對戰保留勝負與隊伍分數，但不把可為負數的戰績誤當百分制成績', () => {
    const payload = buildPeriodicBattleProgress({ room: {
      id: 'room-1', mePlayerId: 'player-2', playerLimit: 4, level: 'advanced', mode: 'mixed',
      questionCount: 20, teamAScore: 6, teamBScore: -2,
      players: [{ id: 'player-2', teamCode: 'B' }],
    } })
    expect(payload).toMatchObject({
      activityCode: 'periodic_battle', modeCode: 'advanced_mixed_4p',
      attemptKey: 'periodic-battle:room-1:player-2',
      metadata: { teamCode: 'B', teamScore: -2, opponentScore: 6, result: 'loss' },
    })
    expect(payload).not.toHaveProperty('score')
  })

  it('舒爾特活動以完成項目數及毫秒結果建立統一紀錄', () => {
    const payload = buildSchulteProgress({
      activityCode: 'schulte_dynamic', activityName: '動態舒爾特方格', modeCode: 'count_35',
      result: { totalNumbers: 35, durationMs: 32100, errorCount: 2, averageTapMs: 917 },
      attemptKey: 'local-round',
    })
    expect(payload).toMatchObject({
      subjectCode: 'focus_training', correctCount: 35, questionCount: 35,
      durationSeconds: 32, attemptKey: 'schulte:local-round',
      metadata: { errorCount: 2, averageTapMs: 917 },
    })
  })
})
