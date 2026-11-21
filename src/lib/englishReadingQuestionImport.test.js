import { describe, expect, it } from 'vitest'
import {
  parseRecognizedChoiceQuestions,
  parseRecognizedClozeQuestions,
  parseRecognizedReadingQuestions,
} from './englishReadingQuestionImport.js'

describe('英語閱讀 OCR 題目匯入', () => {
  it('把閱讀選擇題的題幹、換行內容與選項拆成可編輯題目', () => {
    const questions = parseRecognizedChoiceQuestions(`閱讀能力測驗
1. What is the main idea of the article?
A. Solar storms are becoming more powerful every year.
B. A solar storm in 2025 confused
a lot of technology.
C. Scientists are protecting the Sun.
2) Why is a 10-meter GPS error dangerous?
A) It may send a car into the wrong lane.
B) The car cannot find any road.
C) It damages every satellite.`)

    expect(questions).toHaveLength(2)
    expect(questions[0]).toMatchObject({
      position: 1,
      kind: 'choice',
      prompt: 'What is the main idea of the article?',
      options: [
        'Solar storms are becoming more powerful every year.',
        'A solar storm in 2025 confused a lot of technology.',
        'Scientists are protecting the Sun.',
      ],
      answers: [''],
    })
    expect(questions[1].position).toBe(2)
  })

  it('把小試身手的每一題與多個空格直接轉成填空題', () => {
    const questions = parseRecognizedClozeQuestions(`Word Box
cry fall kick point win see
1. I always ____ my baby sister from ____ by making funny faces.
2. No one can ____ us from ____ the soccer match!
3. During yesterday's earthquake, Janet ____ herself
from ____ by gripping the big table.`)

    expect(questions).toHaveLength(3)
    expect(questions[0]).toMatchObject({ kind: 'cloze', position: 1, answers: ['', ''], blankCount: 2 })
    expect(questions[2].prompt).toBe("During yesterday's earthquake, Janet ____ herself from ____ by gripping the big table.")
  })

  it('合併兩種題型並接續資料庫既有題目順序', () => {
    const questions = parseRecognizedReadingQuestions({
      cloze: '① I can ____ the answer.',
      questions: '1 What happened?\nＡ．One thing.\nＢ．Another thing.',
    }, 4)

    expect(questions.map(({ position, kind }) => [position, kind]))
      .toEqual([[4, 'cloze'], [5, 'choice']])
  })

  it('不匯入缺少空格或少於兩個選項的不完整文字', () => {
    expect(parseRecognizedClozeQuestions('1. This is only OCR text.')).toEqual([])
    expect(parseRecognizedChoiceQuestions('1. What happened?\nA. Only one option.')).toEqual([])
  })

  it('不把換行後以英文冠詞 A 開頭的句子誤判為新選項', () => {
    const questions = parseRecognizedChoiceQuestions(`1. Which statement is correct?
A. The first statement.
B. The event affected
A lot of technology around the world.
C. The third statement.`)
    expect(questions[0].options[1]).toBe('The event affected A lot of technology around the world.')
  })
})
