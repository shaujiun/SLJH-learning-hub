import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import EnglishReadingQuestionEditor from './EnglishReadingQuestionEditor.jsx'

describe('英語閱讀 AI 題目設定區', () => {
  it('辨識題目直接顯示於設定區並附正解與原文依據', () => {
    const html = renderToStaticMarkup(<EnglishReadingQuestionEditor lessonId="lesson-1" articleDraft={{ english: 'Article.' }} suggestedQuestions={[{
      position: 1, kind: 'choice', prompt: 'What happened?', options: ['One', 'Two'], answers: ['B'],
      explanation: '文章指出第二個選項。', evidenceSentence: 'This is the source sentence.', hintA: 'Find the key idea.', hintB: 'Look at paragraph one.',
    }]} />)
    expect(html).toContain('AI 辨識待確認題目')
    expect(html).toContain('What happened?')
    expect(html).toContain('正解：')
    expect(html).toContain('This is the source sentence.')
    expect(html).toContain('不需從預覽區複製')
  })
})
