import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AnimalEquationGuideDialog, { normalizeAnimalEquationTutorialUrl } from './AnimalEquationGuideDialog.jsx'

describe('根式馬戲團新手說明', () => {
  it('一開啟就說明兩類卡牌、遊戲流程與勝利條件', () => {
    const html = renderToStaticMarkup(<AnimalEquationGuideDialog open onClose={() => {}} />)
    expect(html).toContain('進入遊戲前，先看懂這 4 件事')
    expect(html).toContain('綠色數字牌')
    expect(html).toContain('紫色功能牌')
    expect(html).toContain('每回合流程')
    expect(html).toContain('勝利條件')
    expect(html).toContain('馴化')
    expect(html).toContain('教學網址提供後開放')
  })

  it('有 YouTube 網址時顯示可另開分頁的影片連結', () => {
    const html = renderToStaticMarkup(<AnimalEquationGuideDialog open onClose={() => {}}
      tutorialUrl="https://youtu.be/example123" />)
    expect(html).toContain('href="https://youtu.be/example123"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('觀看教學影片')
  })

  it('只接受 HTTPS 的 YouTube 網址', () => {
    expect(normalizeAnimalEquationTutorialUrl('https://m.youtube.com/watch?v=abc')).toContain('youtube.com')
    expect(normalizeAnimalEquationTutorialUrl('http://youtu.be/abc')).toBe('')
    expect(normalizeAnimalEquationTutorialUrl('https://example.com/video')).toBe('')
  })
})
