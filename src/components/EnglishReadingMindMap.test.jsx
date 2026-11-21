import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EnglishReadingMindMap, EnglishReadingMindMapEditor } from './EnglishReadingMindMap.jsx'

describe('英語閱讀心智圖', () => {
  it('學生端把結構化內容呈現為中心主題、分支與關鍵字', () => {
    const html = renderToStaticMarkup(<EnglishReadingMindMap
      title="A Stormy Day"
      value={JSON.stringify({
        center: 'Solar Storm',
        branches: [
          { title: 'Technology', keywords: ['GPS', 'satellite'] },
          { title: 'Effects', keywords: ['signal', 'damage'] },
        ],
      })}
    />)
    expect(html).toContain('aria-label="文章心智圖"')
    expect(html).toContain('Solar Storm')
    expect(html).toContain('Technology')
    expect(html).toContain('satellite')
    expect(html).not.toContain('&quot;branches&quot;')
  })

  it('管理者看到可直接編輯的中心主題與四個分支，不必操作程式碼', () => {
    const html = renderToStaticMarkup(<EnglishReadingMindMapEditor
      title="A Stormy Day"
      value=""
      onChange={() => {}}
    />)
    expect(html).toContain('心智圖內容')
    expect(html).toContain('A Stormy Day')
    expect(html).toContain('分支 4')
    expect(html).toContain('關鍵字（以頓號分隔）')
  })
})
