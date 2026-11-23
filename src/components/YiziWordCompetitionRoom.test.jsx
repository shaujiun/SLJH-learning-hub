import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import YiziWordCompetitionRoom from './YiziWordCompetitionRoom.jsx'

const originalWindow = globalThis.window
afterEach(() => { globalThis.window = originalWindow })

function renderLobby(gameType) {
  globalThis.window = { localStorage: { getItem: () => null } }
  return renderToStaticMarkup(<YiziWordCompetitionRoom gameType={gameType} context={{}} />)
}

describe('YiziWordCompetitionRoom', () => {
  it('去無成字可建立 8 人或 36 人積分房', () => {
    const html = renderLobby('remove_part')
    for (const text of ['去無成字多人競賽', '積分', '5 題', '10 題', '最多 8 人', '最多 36 人']) expect(html).toContain(text)
    expect(html).not.toContain('輪流答題制')
  })

  it('成雙成對可選積分制或輪流答題制', () => {
    const html = renderLobby('component_pairs')
    for (const text of ['成雙成對多人競賽', '積分制', '輪流答題制', '30 秒', '60 秒', '90 秒']) expect(html).toContain(text)
  })
})
