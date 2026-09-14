import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import AnimalEquationRadicalText from './AnimalEquationRadicalText.jsx'

describe('根式牌排版', () => {
  it.each([
    ['√2', '<msqrt><mn>2</mn></msqrt>'],
    ['√6', '<msqrt><mn>6</mn></msqrt>'],
    ['√50', '<msqrt><mn>50</mn></msqrt>'],
    ['n√6', '<mi>n</mi><msqrt><mn>6</mn></msqrt>'],
    ['3√2', '<mn>3</mn><msqrt><mn>2</mn></msqrt>'],
  ])('%s 的被開方數在根號內，係數在根號外', (label, markup) => {
    const html = renderToStaticMarkup(<AnimalEquationRadicalText text={label} />)
    expect(html).toContain(markup)
  })

  it('出牌紀錄中的多個根式也分別排版', () => {
    const html = renderToStaticMarkup(<AnimalEquationRadicalText text="你打出了 √8、n√2。" />)
    expect((html.match(/<msqrt>/g) || [])).toHaveLength(2)
    expect(html).toContain('<mi>n</mi><msqrt><mn>2</mn></msqrt>')
  })
})
