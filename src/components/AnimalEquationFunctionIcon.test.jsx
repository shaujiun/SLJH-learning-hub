import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { animalEquationFunctions } from '../data/animalEquationCards.js'
import AnimalEquationFunctionIcon from './AnimalEquationFunctionIcon.jsx'

describe('功能牌圖案', () => {
  it.each(animalEquationFunctions)('$name 有專屬圖案', (card) => {
    const html = renderToStaticMarkup(<AnimalEquationFunctionIcon code={card.code} />)
    expect(html).toContain(`data-code="${card.code}"`)
    expect(html).toContain('<svg')
  })
})
