import { describe, expect, it } from 'vitest'
import { formatReadingCountdown, READING_TRANSLATION_DELAY_SECONDS } from './englishReadingTimer.js'

describe('英語閱讀中文譯文計時', () => {
  it('預設鎖定三分鐘', () => {
    expect(READING_TRANSLATION_DELAY_SECONDS).toBe(180)
    expect(formatReadingCountdown(READING_TRANSLATION_DELAY_SECONDS)).toBe('3:00')
  })

  it('倒數格式固定顯示分與兩位秒數', () => {
    expect(formatReadingCountdown(179)).toBe('2:59')
    expect(formatReadingCountdown(5)).toBe('0:05')
    expect(formatReadingCountdown(-1)).toBe('0:00')
  })
})
