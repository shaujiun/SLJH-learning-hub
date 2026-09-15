import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AnimalEquationExperience from './AnimalEquationExperience.jsx'
import AnimalEquationPractice from './AnimalEquationPractice.jsx'

describe('根式馬戲團入口與桌面', () => {
  it('讓學生自行選擇教學或直接開始', () => {
    const html = renderToStaticMarkup(<AnimalEquationExperience />)
    expect(html).toContain('教學試玩')
    expect(html).toContain('直接自由試玩')
    expect(html).toContain('4 人真人對戰')
    expect(html).toContain('真人對戰需使用學習系統帳號登入')
  })

  it('自己的手牌在下方，三位 AI 只顯示牌背與手牌張數', () => {
    const html = renderToStaticMarkup(<AnimalEquationPractice onBack={() => {}} />)
    expect(html).toContain('你在下方的私人手牌與操作區')
    expect(html).toContain('AI 小狐')
    expect(html).toContain('AI 海豚')
    expect(html).toContain('AI 樹懶')
    expect(html).toContain('6 張未公開手牌')
    expect(html).toContain('查看所有玩家的出牌紀錄')
    expect(html).toContain('手牌 6／6')
    expect(html).toContain('只有你看得到的手牌；直接點牌選取')
    expect(html).toContain('點自己的牌選取')
    expect(html).toContain('animal-equation-tent.png')
    expect(html).toMatch(/<img[^>]+src="[^"]*animal-equation-tent\.png"/)
    expect(html).toMatch(/<button[^>]+aria-label="[^"]+根式牌/)
    expect(html).not.toContain('animal-practice-choices')
  })
})
