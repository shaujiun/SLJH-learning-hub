import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import YiziQuestionEditor from './YiziQuestionEditor.jsx'
import { localYiziQuestions } from '../lib/yiziQianjin.js'

describe('一字千金題庫工作區', () => {
  it('以人性化欄位呈現建題、答案、難度與發布狀態', () => {
    const html = renderToStaticMarkup(<YiziQuestionEditor
      questions={localYiziQuestions('four_sayings').slice(0, 2)} remoteEnabled={false} />)
    expect(html).toContain('題庫工作區')
    expect(html).toContain('建立新題')
    expect(html).toContain('適合難度')
    expect(html).toContain('主要答案（每行一個）')
    expect(html).toContain('草稿')
    expect(html).toContain('學生題目預覽')
  })
})
