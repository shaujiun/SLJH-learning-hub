import { describe, expect, it } from 'vitest'
import { buildReadingGuidanceDraft, findReadingEvidence } from './englishReadingGuidance.js'

const article = `Millions of people depend on GPS to find their way. A powerful solar storm disturbed these important signals.

Scientists found that GPS locations were suddenly wrong by nearly 10 meters. That is enough to send a self-driving car into the wrong lane.`

describe('英語閱讀免費提示草稿', () => {
  it('以題幹與正解選項定位最相關原文，不猜測不存在的句子', () => {
    const evidence = findReadingEvidence(article, {
      kind: 'choice',
      prompt: 'Why is a 10-meter GPS error dangerous for a self-driving car?',
      options: ['It may send the car into the wrong lane.', 'It damages every satellite.'],
      answers: ['A'],
    })

    expect(evidence).toMatchObject({ paragraph: 2, position: 2 })
    expect(evidence.sentence).toContain('wrong lane')
    expect(findReadingEvidence(article, { kind: 'choice', prompt: 'How many elephants danced?', answers: [''] })).toBeNull()
  })

  it('產生分層提示、解題步驟及可由老師校對的原文依據', () => {
    const draft = buildReadingGuidanceDraft(article, {
      kind: 'choice',
      prompt: 'Why is a 10-meter GPS error dangerous for a self-driving car?',
      options: ['It may send the car into the wrong lane.', 'It damages every satellite.'],
      answers: ['A'],
    })

    expect(draft.evidenceSentence).toContain('wrong lane')
    expect(draft.explanation).toContain('本題設定正解為 A')
    expect(draft.hintA).toContain('不要只看到相同單字')
    expect(draft.hintB).toContain('第 2 段第 2 句')
  })

  it('填空題著重詞性、搭配與詞形，不宣稱 AI 分析', () => {
    const draft = buildReadingGuidanceDraft(article, {
      kind: 'cloze',
      prompt: 'Millions of people ____ on GPS.',
      answers: ['depend'],
    })

    expect(draft.evidenceSentence).toContain('depend on GPS')
    expect(draft.explanation).toContain('固定搭配')
    expect(`${draft.explanation}${draft.hintA}${draft.hintB}`).not.toContain('AI')
  })
})
