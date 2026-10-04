import { describe, expect, it } from 'vitest'
import {
  getReadingSpeechRate,
  READING_SLOW_SPEECH_RATE,
  READING_SPEECH_RATE,
} from './englishReadingSpeech.js'

describe('englishReadingSpeech', () => {
  it('讓慢速發音與一般發音有明顯差異', () => {
    expect(getReadingSpeechRate()).toBe(READING_SPEECH_RATE)
    expect(getReadingSpeechRate(true)).toBe(READING_SLOW_SPEECH_RATE)
    expect(READING_SLOW_SPEECH_RATE).toBeLessThanOrEqual(READING_SPEECH_RATE * 0.5)
  })
})
