export async function recognizeReadingRegion(image, rect, language) {
  if (!image?.naturalWidth || !rect) throw new Error('請先框選清楚的照片範圍。')
  const canvas = document.createElement('canvas')
  const sourceWidth = rect.width * image.naturalWidth
  const sourceHeight = rect.height * image.naturalHeight
  const scale = Math.min(2, 2400 / Math.max(sourceWidth, sourceHeight))
  canvas.width = Math.max(1, Math.round(sourceWidth * scale))
  canvas.height = Math.max(1, Math.round(sourceHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('這個瀏覽器無法讀取照片。')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, rect.left * image.naturalWidth, rect.top * image.naturalHeight,
    sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(language.includes('+') ? language.split('+') : language)
  try {
    const { data } = await worker.recognize(canvas)
    return String(data.text || '').trim()
  } finally {
    await worker.terminate()
  }
}
