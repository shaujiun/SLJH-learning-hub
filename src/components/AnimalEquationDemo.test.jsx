import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AnimalEquationDemo from './AnimalEquationDemo.jsx'

describe('AnimalEquationDemo', () => {
  it('把可操作的試玩回合放在桌面與規則之前', () => {
    const html = renderToStaticMarkup(<AnimalEquationDemo />)
    expect(html).toContain('免登入教學試玩')
    expect(html).toContain('送出 2 張根式牌')
    expect(html).toContain('√8')
    expect(html).toContain('馴化')
    expect(html.indexOf('找出兩張同類方根')).toBeLessThan(html.indexOf('試玩桌面'))
    expect(html).toContain('試玩紀錄不會寫入帳號或每日任務')
  })
})
