import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import EnglishReadingQuestionEditor from './EnglishReadingQuestionEditor.jsx'

describe('英語閱讀辨識題目設定區', () => {
  it('提供直接轉入按鈕並說明系統不猜測正解', () => {
    const html = renderToStaticMarkup(<EnglishReadingQuestionEditor
      lessonId="lesson-1"
      recognizedCloze="1. I can ____ it."
      recognizedQuestions="1. Which one?\nA. One\nB. Two"
    />)

    expect(html).toContain('將辨識文字轉入題目設定')
    expect(html).toContain('系統只整理題幹、空格與選項，不會猜測正解')
    expect(html).toContain('請選擇正解')
  })

  it('沒有辨識文字時停用轉入按鈕', () => {
    const html = renderToStaticMarkup(<EnglishReadingQuestionEditor lessonId="lesson-1" />)
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>將辨識文字轉入題目設定<\/button>/)
  })
})
