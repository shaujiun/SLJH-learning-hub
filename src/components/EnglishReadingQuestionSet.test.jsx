import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { QuestionCard } from './EnglishReadingQuestionSet.jsx'

describe('英語閱讀學生作答介面', () => {
  it('依分組顯示提示並不在作答前輸出正解', () => {
    const html = renderToStaticMarkup(<QuestionCard question={{
      id: 'q1', position: 1, kind: 'choice', prompt: 'What happened?',
      options: ['The signal changed', 'The car stopped'], blankCount: 1,
      hintA: 'A hint', hintB: 'B hint',
    }} group="B" evidenceText="Source sentence." />)
    expect(html).toContain('What happened?')
    expect(html).toContain('The signal changed')
    expect(html).toContain('B hint')
    expect(html).not.toContain('A hint')
    expect(html).not.toContain('參考答案')
    expect(html).toContain('Source sentence.')
  })

  it('填空題依空格數提供輸入欄', () => {
    const html = renderToStaticMarkup(<QuestionCard question={{
      id: 'q2', position: 2, kind: 'cloze', prompt: '___ from ___',
      blankCount: 2, hintA: '', hintB: '',
    }} group="A" evidenceText="" />)
    expect(html).toContain('第 1 格')
    expect(html).toContain('第 2 格')
  })
})
