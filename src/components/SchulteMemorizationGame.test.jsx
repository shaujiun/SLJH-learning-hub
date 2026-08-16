import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import SchulteMemorizationGame from './SchulteMemorizationGame.jsx'

describe('SchulteMemorizationGame', () => {
  beforeEach(() => {
    globalThis.window = {
      location: new URL('http://127.0.0.1:4174/?game=schulte-memorization'),
    }
  })

  it('顯示週五五句連續背誦模式', () => {
    const html = renderToString(<SchulteMemorizationGame />)
    expect(html).toContain('週五名言佳句背誦')
    expect(html).toContain('FRIDAY RECITATION')
  })
})
