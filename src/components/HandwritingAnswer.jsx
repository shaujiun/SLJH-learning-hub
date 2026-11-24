import { Component, useEffect, useRef, useState } from 'react'
import './handwritingAnswer.css'

const PAD_SIZE = 180
const RECOGNITION_TIMEOUT_MS = 8000
const AUTO_RECOGNITION_DELAY_MS = 900

function finitePoints(stroke) {
  const points = []
  const length = Math.min(stroke?.x?.length || 0, stroke?.y?.length || 0)
  for (let index = 0; index < length; index += 1) {
    const x = Number(stroke.x[index])
    const y = Number(stroke.y[index])
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    const previous = points[points.length - 1]
    if (previous && Math.hypot(x - previous.x, y - previous.y) < 0.35) continue
    points.push({ x, y, t: Number.isFinite(Number(stroke.t?.[index])) ? Number(stroke.t[index]) : null })
  }
  return points
}

export function normalizeHandwritingStrokes(strokes, padSize = PAD_SIZE) {
  const validStrokes = (strokes || []).map(finitePoints).filter((stroke) => stroke.length)
  if (!validStrokes.length) return []
  const points = validStrokes.flat()
  const minX = Math.min(...points.map((point) => point.x))
  const maxX = Math.max(...points.map((point) => point.x))
  const minY = Math.min(...points.map((point) => point.y))
  const maxY = Math.max(...points.map((point) => point.y))
  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const padding = Math.round(padSize * 0.12)
  const scale = Math.min(1.8, (padSize - padding * 2) / Math.max(width, height))
  const offsetX = (padSize - width * scale) / 2
  const offsetY = (padSize - height * scale) / 2
  let fallbackTime = 0
  return validStrokes.map((stroke) => {
    const x = []
    const y = []
    const t = []
    stroke.forEach((point) => {
      x.push(Math.round((point.x - minX) * scale + offsetX))
      y.push(Math.round((point.y - minY) * scale + offsetY))
      fallbackTime = Math.max(fallbackTime + 8, Number(point.t) || 0)
      t.push(Math.round(fallbackTime))
    })
    fallbackTime += 24
    return { x, y, t }
  })
}

export function rankHandwritingCandidates(candidates, preferredCharacters = []) {
  const preferred = new Set(Array.from(preferredCharacters || []).filter(Boolean))
  return [...new Set(candidates || [])].sort((left, right) => Number(preferred.has(right)) - Number(preferred.has(left)))
}

export function coalescedPointerSamples(event) {
  const nativeEvent = event?.nativeEvent || event
  try {
    const samples = nativeEvent?.getCoalescedEvents?.()
    if (samples?.length) return Array.from(samples)
  } catch { /* 部分行動瀏覽器宣告支援但呼叫時仍可能失敗 */ }
  return nativeEvent ? [nativeEvent] : []
}

export async function recognizeTraditionalChinese(strokes, fetcher = fetch, signal = undefined, preferredCharacters = []) {
  const normalizedStrokes = normalizeHandwritingStrokes(strokes)
  if (!normalizedStrokes.length) return []
  const body = {
    options: 'enable_pre_space',
    requests: [{
      writing_guide: { writing_area_width: PAD_SIZE, writing_area_height: PAD_SIZE },
      ink: normalizedStrokes.map((stroke) => [stroke.x, stroke.y, stroke.t]),
      language: 'zh_TW',
    }],
  }
  const response = await fetcher('https://inputtools.google.com/request?itc=zh-t-i0-handwrit&app=demopage', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const result = await response.json()
  if (result?.[0] !== 'SUCCESS') return []
  const candidates = (result?.[1]?.[0]?.[1] || []).filter((item) => Array.from(String(item)).length === 1 && /[㐀-鿿]/.test(item))
  return rankHandwritingCandidates(candidates, preferredCharacters)
}

async function recognizeWithRetry(strokes, signal, preferredCharacters) {
  let lastError = null
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try { return await recognizeTraditionalChinese(strokes, fetch, signal, preferredCharacters) }
    catch (error) {
      lastError = error
      if (signal.aborted || attempt === 1) throw error
      await new Promise((resolve) => window.setTimeout(resolve, 300))
    }
  }
  throw lastError
}

export function drawPad(canvas, strokes) {
  const context = canvas?.getContext?.('2d')
  if (!context) return
  context.clearRect(0, 0, PAD_SIZE, PAD_SIZE)
  context.strokeStyle = '#d5c6b1'
  context.lineWidth = 1
  context.setLineDash([5, 5])
  ;[[0, 0, PAD_SIZE, PAD_SIZE], [PAD_SIZE, 0, 0, PAD_SIZE], [PAD_SIZE / 2, 0, PAD_SIZE / 2, PAD_SIZE], [0, PAD_SIZE / 2, PAD_SIZE, PAD_SIZE / 2]].forEach(([x1, y1, x2, y2]) => {
    context.beginPath(); context.moveTo(x1, y1); context.lineTo(x2, y2); context.stroke()
  })
  context.setLineDash([])
  context.strokeStyle = '#17324a'
  context.fillStyle = '#17324a'
  context.lineWidth = 6
  context.lineCap = 'round'
  context.lineJoin = 'round'
  strokes.forEach((stroke) => {
    if (!stroke.x.length) return
    if (stroke.x.length === 1) {
      context.beginPath(); context.arc(stroke.x[0], stroke.y[0], 3, 0, Math.PI * 2); context.fill(); return
    }
    context.beginPath(); context.moveTo(stroke.x[0], stroke.y[0])
    stroke.x.slice(1).forEach((x, index) => context.lineTo(x, stroke.y[index + 1]))
    context.stroke()
  })
}

function HandwritingPad({ value, onChange, label, preferredCharacters }) {
  const canvasRef = useRef(null)
  const activeStroke = useRef(null)
  const writingStartedAt = useRef(null)
  const requestController = useRef(null)
  const requestVersion = useRef(0)
  const autoRecognitionTimer = useRef(null)
  const recognizeRef = useRef(null)
  const strokesRef = useRef([])
  const [strokes, setStrokes] = useState([])
  const [candidates, setCandidates] = useState([])
  const [status, setStatus] = useState('')
  const [recognizing, setRecognizing] = useState(false)

  useEffect(() => drawPad(canvasRef.current, strokes), [strokes])
  useEffect(() => () => {
    requestVersion.current += 1
    requestController.current?.abort()
    window.clearTimeout(autoRecognitionTimer.current)
  }, [])

  const cancelPendingRecognition = () => {
    requestVersion.current += 1
    requestController.current?.abort()
    requestController.current = null
    window.clearTimeout(autoRecognitionTimer.current)
    setRecognizing(false)
  }

  const replaceStrokes = (next) => {
    strokesRef.current = next
    setStrokes(next)
  }

  const scheduleAutomaticRecognition = () => {
    window.clearTimeout(autoRecognitionTimer.current)
    if (!strokesRef.current.length) return
    autoRecognitionTimer.current = window.setTimeout(() => recognizeRef.current?.({ automatic: true }), AUTO_RECOGNITION_DELAY_MS)
  }

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(PAD_SIZE, (event.clientX - rect.left) * PAD_SIZE / rect.width)),
      y: Math.max(0, Math.min(PAD_SIZE, (event.clientY - rect.top) * PAD_SIZE / rect.height)),
    }
  }
  const pointerDown = (event) => {
    event.preventDefault()
    cancelPendingRecognition()
    const nativeEvent = event.nativeEvent || event
    try { canvasRef.current.setPointerCapture(nativeEvent.pointerId) } catch { /* 某些行動瀏覽器不支援指標鎖定 */ }
    if (!writingStartedAt.current) writingStartedAt.current = performance.now()
    const start = point(nativeEvent)
    activeStroke.current = { x: [start.x], y: [start.y], t: [Math.round(performance.now() - writingStartedAt.current)] }
    replaceStrokes([...strokesRef.current, activeStroke.current])
    setCandidates([])
    setStatus('')
    if (value) onChange('')
  }
  const pointerMove = (event) => {
    if (!activeStroke.current) return
    event.preventDefault()
    coalescedPointerSamples(event).forEach((sample) => {
      const next = point(sample)
      const lastIndex = activeStroke.current.x.length - 1
      if (Math.hypot(next.x - activeStroke.current.x[lastIndex], next.y - activeStroke.current.y[lastIndex]) < 0.35) return
      activeStroke.current.x.push(next.x)
      activeStroke.current.y.push(next.y)
      activeStroke.current.t.push(Math.max(0, Math.round(performance.now() - writingStartedAt.current)))
    })
    const updatedStroke = {
      ...activeStroke.current, x: [...activeStroke.current.x], y: [...activeStroke.current.y], t: [...activeStroke.current.t],
    }
    activeStroke.current = updatedStroke
    replaceStrokes([...strokesRef.current.slice(0, -1), updatedStroke])
  }
  const pointerUp = (event) => {
    const nativeEvent = event?.nativeEvent || event
    try { canvasRef.current.releasePointerCapture(nativeEvent?.pointerId) } catch { /* 沒有鎖定時不需處理 */ }
    activeStroke.current = null
    scheduleAutomaticRecognition()
  }
  const clear = () => {
    cancelPendingRecognition()
    writingStartedAt.current = null
    replaceStrokes([]); setCandidates([]); setStatus(''); onChange('')
  }
  const undo = () => {
    cancelPendingRecognition()
    const next = strokesRef.current.slice(0, -1)
    if (!next.length) writingStartedAt.current = null
    replaceStrokes(next)
    setCandidates([])
    setStatus('')
    onChange('')
    if (next.length) scheduleAutomaticRecognition()
  }
  const recognize = async ({ automatic = false } = {}) => {
    const pendingStrokes = strokesRef.current.map((stroke) => ({ x: [...stroke.x], y: [...stroke.y], t: [...stroke.t] }))
    if (!pendingStrokes.length) { if (!automatic) setStatus('請先寫字。'); return }
    window.clearTimeout(autoRecognitionTimer.current)
    const version = requestVersion.current + 1
    requestVersion.current = version
    requestController.current?.abort()
    setStatus('')
    setRecognizing(true)
    const controller = new AbortController()
    requestController.current = controller
    const timer = window.setTimeout(() => controller.abort(), RECOGNITION_TIMEOUT_MS)
    try {
      const result = await recognizeWithRetry(pendingStrokes, controller.signal, preferredCharacters)
      if (requestVersion.current !== version) return
      setCandidates(result.slice(0, 8))
      setStatus(result.length ? '請點選你寫的字。' : '可繼續補寫或復原一筆，停筆後會再次辨識。')
    } catch {
      if (requestVersion.current === version) {
        setCandidates([])
        setStatus('筆畫已保留，可繼續補寫、復原一筆或稍後重新辨識。')
      }
    } finally {
      window.clearTimeout(timer)
      if (requestVersion.current === version) {
        requestController.current = null
        setRecognizing(false)
      }
    }
  }
  recognizeRef.current = recognize

  return (
    <div className="handwriting-pad">
      <div className="handwriting-pad-label">{label}<small>停筆後自動辨識</small></div>
      <canvas ref={canvasRef} width={PAD_SIZE} height={PAD_SIZE} aria-label={`${label}手寫區`}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} />
      <div className="handwriting-actions">
        <button type="button" onClick={undo}>復原一筆</button>
        <button type="button" onClick={clear}>清除</button>
        <button type="button" className="primary" disabled={recognizing} onClick={() => recognizeRef.current?.()}>{recognizing ? '更新候選字…' : '立即辨識'}</button>
      </div>
      {(strokes.length > 0 || candidates.length > 0) && <div className="handwriting-candidates" aria-label="候選字" aria-live="polite">
        {recognizing && <span>正在更新候選字…</span>}
        {!recognizing && candidates.length === 0 && <span>可繼續補寫或復原一筆。</span>}
        {!recognizing && candidates.map((candidate) => <button type="button" className={candidate === value ? 'is-selected' : ''}
          key={candidate} onClick={() => { onChange(candidate); setStatus(`已選擇「${candidate}」。`) }}>{candidate}</button>)}
      </div>}
      {status && <p className="handwriting-status">{status}</p>}
    </div>
  )
}

export default function HandwritingAnswer({ length = 1, value = '', onChange, preferredCharacters = [] }) {
  const characters = Array.from(value || '')
  const updateCharacter = (index, character) => {
    const next = Array.from({ length }, (_, itemIndex) => itemIndex === index ? character : characters[itemIndex] || '')
    onChange(next.join(''))
  }
  return (
    <div className="handwriting-answer">
      {Array.from({ length }, (_, index) => <HandwritingPad key={index} label={`第 ${index + 1} 字`}
        value={characters[index] || ''} onChange={(character) => updateCharacter(index, character)}
        preferredCharacters={preferredCharacters} />)}
    </div>
  )
}

class HandwritingErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('Handwriting input failed.', error) }
  render() {
    if (this.state.failed) return <div className="handwriting-fallback" role="status">
      <p>手寫區需要重新載入，已選答案仍保留。</p>
      <button type="button" onClick={() => this.setState({ failed: false })}>重新開啟手寫區</button>
    </div>
    return this.props.children
  }
}

export function SafeHandwritingAnswer({ resetKey = '', ...props }) {
  return <HandwritingErrorBoundary key={resetKey}>
    <HandwritingAnswer {...props} />
  </HandwritingErrorBoundary>
}
