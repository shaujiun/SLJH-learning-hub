import { describe, expect, it } from 'vitest'
import {
  assignReadingEvidence,
  evidencePositionsForSentence,
  getReadingEvidenceText,
} from './englishReadingEvidence.js'

describe('英語閱讀分題原文依據', () => {
  it('依段落與句子索引取得原文', () => {
    expect(getReadingEvidenceText(['First sentence. Second sentence.'], '0-1')).toBe('Second sentence.')
    expect(getReadingEvidenceText(['First sentence.'], '9-9')).toBe('')
  })

  it('不同題目可以指定同一句原文', () => {
    let selected = assignReadingEvidence({}, 'q4', '1-0')
    selected = assignReadingEvidence(selected, 'q5', '1-0')
    expect(selected).toEqual({ q4: '1-0', q5: '1-0' })
    expect(evidencePositionsForSentence([
      { id: 'q4', position: 4 },
      { id: 'q5', position: 5 },
      { id: 'q6', position: 6 },
    ], selected, '1-0')).toEqual([4, 5])
  })
})
