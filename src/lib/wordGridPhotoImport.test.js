import { describe, expect, it } from 'vitest'
import { classifyPhotoCell, normalizedPhotoRect } from './wordGridPhotoImport.js'

function pixels(drawDark) {
  const width = 100
  const height = 100
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      const value = drawDark(x, y) ? 20 : 245
      data.set([value, value, value, 255], offset)
    }
  }
  return { data, width, height }
}

describe('photo-to-word-grid preparation', () => {
  it('normalizes crop corners in either order', () => {
    expect(normalizedPhotoRect({ x: 0.8, y: 0.9 }, { x: 0.2, y: 0.1 }))
      .toEqual({ left: 0.2, top: 0.1, width: 0.6000000000000001, height: 0.8 })
    expect(normalizedPhotoRect({ x: 0.2, y: 0.2 }, { x: 0.21, y: 0.21 })).toBeNull()
  })

  it('distinguishes black, blank, and printed-character cells', () => {
    expect(classifyPhotoCell(pixels(() => true))).toBe('block')
    expect(classifyPhotoCell(pixels(() => false))).toBe('empty')
    expect(classifyPhotoCell(pixels((x, y) => x >= 44 && x < 56 && y >= 42 && y < 58))).toBe('given')
  })
})
