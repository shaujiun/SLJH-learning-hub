export const READING_SPEECH_RATE = 0.9
export const READING_SLOW_SPEECH_RATE = 0.45

export function getReadingSpeechRate(slow = false) {
  return slow ? READING_SLOW_SPEECH_RATE : READING_SPEECH_RATE
}
