import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AnimalEquationDemo, { DemoVariableInputs } from './AnimalEquationDemo.jsx'
import { createAnimalEquationDemo } from '../lib/animalEquationDemo.js'

describe('AnimalEquationDemo', () => {
  it('教學隨機抽到 n√6 時，選取後顯示可輸入的 n 欄位', () => {
    const room = createAnimalEquationDemo(() => 0.99)
    expect(room.hand.some((card) => card.id === 'nsqrt6')).toBe(true)
    const html = renderToStaticMarkup(<DemoVariableInputs hand={room.hand} selectedIds={['nsqrt6']}
      nValues={{ nsqrt6: '3' }} onChange={() => {}} />)
    expect(html).toContain('替 n√6 設定正整數 n')
    expect(html).toContain('value="3"')
  })

  it('把可操作的試玩回合放在桌面與規則之前', () => {
    const html = renderToStaticMarkup(<AnimalEquationDemo />)
    expect(html).toContain('免登入教學試玩')
    expect(html).toContain('送出 2 張根式牌')
    expect(html).toMatch(/√(?:8|12|24)/)
    expect(html).toContain('馴化')
    expect(html).toContain('data-code="tame"')
    expect(html.indexOf('找出兩張同類方根')).toBeLessThan(html.indexOf('試玩桌面'))
    expect(html).toContain('試玩紀錄不會寫入帳號或每日任務')
  })
})
