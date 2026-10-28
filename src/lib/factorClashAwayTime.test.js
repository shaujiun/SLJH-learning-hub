import { describe, expect, it } from 'vitest'
import {
  MAX_FACTOR_CLASH_AWAY_SECONDS,
  calculateFactorClashAwaySeconds,
  normalizeFactorClashAwaySeconds,
} from './factorClashAwayTime.js'

describe('因式交鋒離開頁面計時', () => {
  it('以離開與返回的時間戳計算實際秒數', () => {
    expect(calculateFactorClashAwaySeconds(1_793_165_600_000, 1_793_165_607_400)).toBe(7)
  })

  it('不會把未設定的起始時間誤當成 1970 年', () => {
    expect(calculateFactorClashAwaySeconds(0, 1_793_165_607_400)).toBe(0)
    expect(calculateFactorClashAwaySeconds(-1_793_165_600_000, 1_793_165_607_400)).toBe(0)
  })

  it('系統時間倒退或異常巨大時仍限制在合理範圍', () => {
    expect(calculateFactorClashAwaySeconds(2_000, 1_000)).toBe(0)
    expect(calculateFactorClashAwaySeconds(1, 9_999_999_999_999)).toBe(MAX_FACTOR_CLASH_AWAY_SECONDS)
    expect(normalizeFactorClashAwaySeconds(3_586_331_293)).toBe(MAX_FACTOR_CLASH_AWAY_SECONDS)
  })
})
