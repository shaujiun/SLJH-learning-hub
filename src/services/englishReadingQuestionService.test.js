import { describe, expect, it } from 'vitest'
import {
  deleteAdminReadingQuestion, loadStudentReadingQuestions, readingQuestionPayload, saveAdminReadingQuestion,
  submitStudentReadingAnswer,
} from './englishReadingQuestionService.js'

describe('英語閱讀互動題目', () => {
  it('管理者儲存選擇題時檢查選項及正解', () => {
    expect(readingQuestionPayload({ kind: 'choice', prompt: 'Which?', options: ['one', 'two', ''], answers: ['B'] }, 'lesson-1'))
      .toEqual(expect.objectContaining({ p_kind: 'choice', p_options: ['one', 'two'], p_answers: ['B'] }))
    expect(() => readingQuestionPayload({ kind: 'choice', prompt: 'Which?', options: ['one', 'two'], answers: ['C'] }, 'lesson-1'))
      .toThrow('有效的正解')
    expect(() => readingQuestionPayload({ kind: 'choice', prompt: 'Which?', options: ['one', '', 'three'], answers: ['A'] }, 'lesson-1'))
      .toThrow('有效的正解')
  })

  it('填空題每行答案對應一個空格', () => {
    expect(readingQuestionPayload({ kind: 'cloze', prompt: '___ from ___', answers: ['stop', 'crying|cryin'] }, 'lesson-1'))
      .toEqual(expect.objectContaining({ p_answers: ['stop', 'crying|cryin'], p_options: [] }))
  })

  it('學生查詢不要求或載入答案欄位', async () => {
    let columns
    const client = { from: () => ({ select(value) {
      columns = value
      return { eq: () => ({ order: async () => ({ data: [{ id: 'q1', lesson_id: 'l1', kind: 'choice', options: ['a', 'b'], blank_count: 1 }], error: null }) }) }
    } }) }
    const questions = await loadStudentReadingQuestions('l1', client)
    expect(columns).not.toMatch(/answers|answer_keys|explanation/)
    expect(questions[0]).toEqual(expect.objectContaining({ id: 'q1', options: ['a', 'b'] }))
  })

  it('儲存與送出答案使用專用 RPC', async () => {
    const calls = []
    const client = { rpc: async (name, payload) => {
      calls.push([name, payload])
      return { data: name.startsWith('save') ? 'q1' : { correct: true, expected: ['B'] }, error: null }
    } }
    expect(await saveAdminReadingQuestion({ kind: 'choice', prompt: 'Why?', options: ['one', 'two'], answers: ['B'] }, 'l1', client)).toBe('q1')
    expect(await submitStudentReadingAnswer('q1', [' B '], 'Source sentence.', client)).toEqual({ correct: true, expected: ['B'] })
    expect(calls[0][0]).toBe('save_english_reading_question')
    expect(calls[1]).toEqual(['submit_english_reading_answer', {
      p_question_id: 'q1', p_answers: ['B'], p_evidence_text: 'Source sentence.',
    }])
    await deleteAdminReadingQuestion('q1', client)
    expect(calls[2]).toEqual(['delete_english_reading_question', { p_question_id: 'q1' }])
  })
})
