import { requireSupabase } from '../lib/supabase.js'
import { normalizeAiReadingResult } from '../lib/englishReadingAi.js'

const maxImageDimension = 1800

export async function readingPhotoToDataUrl(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('請選擇 JPG、PNG 或 WebP 照片。')
  const sourceUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = sourceUrl
    await image.decode()
    const scale = Math.min(1, maxImageDimension / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('這個瀏覽器無法處理照片。')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', .88)
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

async function invokeReadingAi(body, client = requireSupabase()) {
  const { data, error } = await client.functions.invoke('analyze-english-reading', { body })
  if (error) {
    let remoteMessage = ''
    try {
      if (error.context && typeof error.context.json === 'function') {
        const response = await error.context.json()
        remoteMessage = String(response?.error || '')
      }
    } catch {
      // 回應不是 JSON 時，改用 Supabase SDK 提供的錯誤訊息。
    }
    const message = remoteMessage || String(error.message || '')
    if (/not found|404/i.test(message)) throw new Error('AI 閱讀分析服務尚未部署，請先完成伺服器端設定。')
    throw new Error(`AI 閱讀分析失敗：${message || '請稍後再試。'}`)
  }
  if (!data?.result) throw new Error(data?.error || 'AI 沒有回傳可用內容，請換用較清晰的照片再試。')
  return normalizeAiReadingResult(data.result)
}

export async function analyzeEnglishReadingPhotos({ articlePhoto, exercisePhoto }, client) {
  if (!articlePhoto || !exercisePhoto) throw new Error('請先上傳「文章與翻譯」及「單字與練習」兩張照片。')
  const [articleImage, exerciseImage] = await Promise.all([
    readingPhotoToDataUrl(articlePhoto), readingPhotoToDataUrl(exercisePhoto),
  ])
  return invokeReadingAi({ action: 'import_photos', articleImage, exerciseImage }, client)
}

export async function requestEnglishReadingAi(action, draft, questions, client) {
  if (!['evaluate_questions', 'enrich_questions'].includes(action)) throw new Error('不支援的 AI 編題操作。')
  if (!String(draft?.english || '').trim()) throw new Error('請先完成英文文章辨識或輸入英文文章。')
  return invokeReadingAi({ action, lesson: draft, questions }, client)
}
