import { WORD_GRID_SIZE, wordGridCellTypes } from './wordGridPuzzle.js'

export function normalizedPhotoRect(first, second) {
  if (!first || !second) return null
  const left = Math.max(0, Math.min(first.x, second.x))
  const top = Math.max(0, Math.min(first.y, second.y))
  const right = Math.min(1, Math.max(first.x, second.x))
  const bottom = Math.min(1, Math.max(first.y, second.y))
  return right - left >= 0.03 && bottom - top >= 0.03
    ? { left, top, width: right - left, height: bottom - top }
    : null
}

export function classifyPhotoCell(imageData) {
  const { data, width, height } = imageData
  let innerDark = 0
  let innerPixels = 0
  let centerDark = 0
  let centerPixels = 0
  for (let y = Math.floor(height * 0.22); y < Math.ceil(height * 0.78); y += 1) {
    for (let x = Math.floor(width * 0.22); x < Math.ceil(width * 0.78); x += 1) {
      const offset = (y * width + x) * 4
      const brightness = (data[offset] * 299 + data[offset + 1] * 587 + data[offset + 2] * 114) / 1000
      const dark = brightness < 145
      innerPixels += 1
      if (dark) innerDark += 1
      if (x >= width * 0.38 && x < width * 0.62 && y >= height * 0.38 && y < height * 0.62) {
        centerPixels += 1
        if (dark) centerDark += 1
      }
    }
  }
  if (innerDark / innerPixels > 0.58 && centerDark / centerPixels > 0.48) return wordGridCellTypes.block
  if (innerDark / innerPixels > 0.018) return wordGridCellTypes.given
  return wordGridCellTypes.empty
}

function croppedCanvas(image, rect, width, height = width) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  context.fillStyle = '#fff'
  context.fillRect(0, 0, width, height)
  context.drawImage(
    image,
    rect.left * image.naturalWidth,
    rect.top * image.naturalHeight,
    rect.width * image.naturalWidth,
    rect.height * image.naturalHeight,
    0, 0, width, height,
  )
  return canvas
}

function cellCanvas(gridCanvas, row, column) {
  const cellSize = gridCanvas.width / WORD_GRID_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = 192
  canvas.height = 192
  const context = canvas.getContext('2d')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, 192, 192)
  context.drawImage(gridCanvas, column * cellSize + cellSize * 0.12, row * cellSize + cellSize * 0.12,
    cellSize * 0.76, cellSize * 0.76, 16, 16, 160, 160)
  return canvas
}

export async function importWordGridFromPhoto(image, rect, onProgress = () => {}) {
  const canvas = croppedCanvas(image, rect, 1000)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const grid = []
  const candidates = []
  for (let row = 0; row < WORD_GRID_SIZE; row += 1) {
    for (let column = 0; column < WORD_GRID_SIZE; column += 1) {
      const index = row * WORD_GRID_SIZE + column
      const type = classifyPhotoCell(context.getImageData(column * 100, row * 100, 100, 100))
      grid.push({ type, value: type === wordGridCellTypes.given ? '？' : '' })
      if (type === wordGridCellTypes.given) candidates.push({ index, row, column })
    }
  }
  if (candidates.length > 65 || grid.filter((cell) => cell.type === wordGridCellTypes.block).length < 3) {
    throw new Error('無法可靠判定 10×10 題目範圍。請重新框選格線的左上角與右下角。')
  }
  const { createWorker, PSM } = await import('tesseract.js')
  const worker = await createWorker('chi_tra')
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_CHAR })
    for (let position = 0; position < candidates.length; position += 1) {
      const { index, row, column } = candidates[position]
      const { data } = await worker.recognize(cellCanvas(canvas, row, column))
      const character = Array.from(String(data.text || '').replace(/[^\p{Script=Han}]/gu, ''))[0] || '？'
      grid[index] = { type: wordGridCellTypes.given, value: character }
      onProgress(position + 1, candidates.length)
    }
  } finally {
    await worker.terminate()
  }
  return { grid, uncertainCount: grid.filter((cell) => cell.value === '？').length }
}

export async function importWordBankFromPhoto(image, rect, onProgress = () => {}) {
  const canvas = croppedCanvas(image, rect, 1000, 400)
  const { createWorker, PSM } = await import('tesseract.js')
  const worker = await createWorker('chi_tra')
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_CHAR })
    const characters = []
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 10; column += 1) {
        const { data } = await worker.recognize(cellCanvas(canvas, row, column))
        characters.push(Array.from(String(data.text || '').replace(/[^\p{Script=Han}]/gu, ''))[0] || '？')
        onProgress(characters.length, 40)
      }
    }
    return characters
  } finally {
    await worker.terminate()
  }
}
