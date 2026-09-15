import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import AnimalEquationGame, { TablePreview, WinnerPanel, turnPanelKey } from './AnimalEquationGame.jsx'

const originalWindow = globalThis.window

afterEach(() => {
  globalThis.window = originalWindow
})

describe('AnimalEquationGame', () => {
  it('顯示新名稱、適用章節與可操作房間入口', () => {
    globalThis.window = {
      location: { href: 'http://127.0.0.1:4174/?game=animal-equation' },
      sessionStorage: { getItem: () => null, removeItem: () => {} },
    }
    const html = renderToStaticMarkup(<AnimalEquationGame />)
    expect(html).toContain('根式馬戲團')
    expect(html).toContain('八上第 2 章起適用')
    expect(html).toContain('建立對戰房')
    expect(html).toContain('1 位真人＋3 位 AI')
    expect(html).toContain('名稱會與目前登入帳號綁定')
  })

  it('結算後提供開新房入口', () => {
    const html = renderToStaticMarkup(<WinnerPanel
      room={{
        status: 'finished', winnerPlayerId: 'player-1',
        players: [{ id: 'player-1', displayName: '小安', animalCount: 4, animalScore: 45, judgementStars: 2 }],
      }}
      onNewRoom={() => {}}
    />)
    expect(html).toContain('小安 獲勝')
    expect(html).toContain('勝場留在同一房間')
  })

  it('每一回合及每位出牌者都有獨立草稿身分', () => {
    const room = { id: 'room-1', turnNumber: 1, currentPlayerId: 'player-1' }
    expect(turnPanelKey(room)).not.toBe(turnPanelKey({ ...room, turnNumber: 2 }))
    expect(turnPanelKey(room)).not.toBe(turnPanelKey({ ...room, currentPlayerId: 'player-2' }))
  })

  it('即時桌面只顯示真實手牌，且公開出牌區顯示本回合牌面', () => {
    const html = renderToStaticMarkup(<TablePreview room={{
      mePlayerId: 'player-1', players: [{ id: 'player-1', seatNumber: 1, displayName: '小安' }],
      hand: [], animals: [], turnNumber: 2,
      pendingPlay: { playerId: 'player-1', mode: 'same_family', selectedCards: [{ id: 'card-1', label: '√8' }, { id: 'card-2', label: '√18' }] },
    }} />)
    expect(html).toContain('<msqrt><mn>8</mn></msqrt>')
    expect(html).toContain('<msqrt><mn>18</mn></msqrt>')
    expect(html).toContain('目前沒有手牌')
    expect(html).not.toContain('A 玩家')
    expect(html).not.toContain('梅花鹿')
    expect(html).not.toContain('class="animal-hand-cards"><button')
  })

  it('每位玩家在自己裝置位於下方，得分動物離開中央', () => {
    const players = [1, 2, 3, 4].map((seatNumber) => ({
      id: 'player-' + seatNumber, seatNumber, displayName: String.fromCharCode(64 + seatNumber) + ' 玩家',
      winCount: seatNumber - 1,
    }))
    const html = renderToStaticMarkup(<TablePreview room={{
      mePlayerId: 'player-2', players, hand: [],
      animals: [{ id: 'deer-1', position: 1, code: 'deer', name: '梅花鹿', score: 20,
        revealed: true, ownerPlayerId: 'player-3' }],
    }} />)
    expect(html).toMatch(/is-bottom[^]*?B 玩家/)
    expect(html).toMatch(/is-right[^]*?C 玩家/)
    expect(html).toContain('中央動物 · 0 張')
    expect(html).toContain('梅花鹿')
    expect(html).toContain('本房勝場 2')
  })

  it('補牌後只在自己的手牌標出新補牌', () => {
    const html = renderToStaticMarkup(<TablePreview room={{
      mePlayerId: 'player-1', currentPlayerId: 'player-1',
      players: [{ id: 'player-1', seatNumber: 1, displayName: '小安' }],
      hand: [{ id: 'drawn-1', type: 'radical', code: 'sqrt6', label: '√6' }],
      newDrawnCardIds: ['drawn-1'], animals: [],
    }} />)
    expect(html).toContain('is-new')
    expect(html).toContain('新補牌')
    expect(html).toContain('<msqrt><mn>6</mn></msqrt>')
  })
})
