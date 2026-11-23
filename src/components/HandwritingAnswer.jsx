import { Component, useEffect, useRef, useState } from 'react'
import './handwritingAnswer.css'

const PAD_SIZE = 180
const RECOGNITION_TIMEOUT_MS = 8000
const MAX_RECOGNITION_FAILURES = 2

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

function drawPad(canvas, strokes) {
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
  context.lineWidth = 6
  context.lineCap = 'round'
  context.lineJoin = 'round'
  strokes.forEach((stroke) => {
    if (!stroke.x.length) return
    context.beginPath(); context.moveTo(stroke.x[0], stroke.y[0])
    stroke.x.slice(1).forEach((x, index) => context.lineTo(x, stroke.y[index + 1]))
    context.stroke()
  })
}

function HandwritingPad({ value, onChange, label, preferredCharacters, onRecognitionFailure, onFallback }) {
  const canvasRef = useRef(null)
  const activeStroke = useRef(null)
  const writingStartedAt = useRef(null)
  const requestController = useRef(null)
  const failureCount = useRef(0)
  const [strokes, setStrokes] = useState([])
  const [candidates, setCandidates] = useState([])
  const [status, setStatus] = useState('')
  const [recognizing, setRecognizing] = useState(false)

  useEffect(() => drawPad(canvasRef.current, strokes), [strokes])
  useEffect(() => () => requestController.current?.abort(), [])

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(PAD_SIZE, (event.clientX - rect.left) * PAD_SIZE / rect.width)),
      y: Math.max(0, Math.min(PAD_SIZE, (event.clientY - rect.top) * PAD_SIZE / rect.height)),
    }
  }
  const pointerDown = (event) => {
    event.preventDefault()
    try { canvasRef.current.setPointerCapture(event.pointerId) } catch { /* 某些行動瀏覽器不支援指標鎖定 */ }
    if (!writingStartedAt.current) writingStartedAt.current = performance.now()
    const start = point(event)
    activeStroke.current = { x: [start.x], y: [start.y], t: [Math.round(performance.now() - writingStartedAt.current)] }
    setStrokes((items) => [...items, activeStroke.current])
    setCandidates([])
    setStatus('')
    if (value) onChange('')
  }
  const pointerMove = (event) => {
    if (!activeStroke.current) return
    event.preventDefault()
    const events = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event]
    events.forEach((sample) => {
      const next = point(sample)
      const lastIndex = activeStroke.current.x.length - 1
      if (Math.hypot(next.x - activeStroke.current.x[lastIndex], next.y - activeStroke.current.y[lastIndex]) < 0.35) return
      activeStroke.current.x.push(next.x)
      activeStroke.current.y.push(next.y)
      activeStroke.current.t.push(Math.max(0, Math.round(performance.now() - writingStartedAt.current)))
    })
    setStrokes((items) => [...items.slice(0, -1), {
      ...activeStroke.current, x: [...activeStroke.current.x], y: [...activeStroke.current.y], t: [...activeStroke.current.t],
    }])
  }
  const pointerUp = () => { activeStroke.current = null }
  const clear = () => {
    requestController.current?.abort()
    writingStartedAt.current = null
    failureCount.current = 0
    setStrokes([]); setCandidates([]); setStatus(''); onChange('')
  }
  const undo = () => {
    setStrokes((items) => {
      const next = items.slice(0, -1)
      if (!next.length) writingStartedAt.current = null
      return next
    })
    setCandidates([])
    setStatus('')
    onChange('')
  }
  const registerFailure = (message) => {
    failureCount.current += 1
    setStatus(message)
    if (failureCount.current >= MAX_RECOGNITION_FAILURES) onRecognitionFailure?.()
  }
  const recognize = async () => {
    if (!strokes.length || recognizing) { if (!strokes.length) setStatus('請先寫字。'); return }
    setStatus('辨識中…')
    setRecognizing(true)
    const controller = new AbortController()
    requestController.current?.abort()
    requestController.current = controller
    const timer = window.setTimeout(() => controller.abort(), RECOGNITION_TIMEOUT_MS)
    try {
      const result = await recognizeWithRetry(strokes, controller.signal, preferredCharacters)
      setCandidates(result.slice(0, 8))
      if (result.length) {
        failureCount.current = 0
        setStatus('請點選你寫的字，系統不會自動替你決定。')
      } else registerFailure('暫時辨識不出來；連續失敗兩次會自動改用鍵盤。')
    } catch (error) {
      if (!controller.signal.aborted || requestController.current === controller) {
        registerFailure('手寫辨識逾時或無法連線；連續失敗兩次會自動改用鍵盤。')
      }
    } finally {
      window.clearTimeout(timer)
      if (requestController.current === controller) requestController.current = null
      setRecognizing(false)
    }
  }

  return (
    <div className="handwriting-pad">
      <div className="handwriting-pad-label">{label}</div>
      <canvas ref={canvasRef} width={PAD_SIZE} height={PAD_SIZE} aria-label={`${label}手寫區`}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} />
      <div className="handwriting-actions">
        <button type="button" onClick={undo}>復原一筆</button>
        <button type="button" onClick={clear}>清除</button>
        <button type="button" className="primary" disabled={recognizing} onClick={recognize}>{recognizing ? '辨識中…' : '辨識'}</button>
        {onFallback && <button type="button" onClick={onFallback}>改用鍵盤</button>}
      </div>
      {candidates.length > 0 && <div className="handwriting-candidates" aria-label="候選字">
        {candidates.map((candidate) => <button type="button" className={candidate === value ? 'is-selected' : ''}
          key={candidate} onClick={() => { onChange(candidate); setStatus(`已選擇「${candidate}」。`) }}>{candidate}</button>)}
      </div>}
      {status && <p className="handwriting-status">{status}</p>}
    </div>
  )
}

export default function HandwritingAnswer({ length = 1, value = '', onChange, preferredCharacters = [], onRecognitionFailure, onFallback }) {
  const characters = Array.from(value || '')
  const updateCharacter = (index, character) => {
    const next = Array.from({ length }, (_, itemIndex) => itemIndex === index ? character : characters[itemIndex] || '')
    onChange(next.join(''))
  }
  return (
    <div className="handwriting-answer">
      {Array.from({ length }, (_, index) => <HandwritingPad key={index} label={`第 ${index + 1} 字`}
        value={characters[index] || ''} onChange={(character) => updateCharacter(index, character)}
        preferredCharacters={preferredCharacters} onRecognitionFailure={onRecognitionFailure} onFallback={onFallback} />)}
    </div>
  )
}

class HandwritingErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('Handwriting input failed.', error) }
  render() {
    if (this.state.failed) return <div className="handwriting-fallback" role="alert">
      <p>手寫區暫時無法使用，其他作答內容仍保留。</p>
      <button type="button" onClick={this.props.onFallback}>改用鍵盤輸入</button>
    </div>
    return this.props.children
  }
}

export function SafeHandwritingAnswer({ resetKey = '', onFallback, ...props }) {
  return <HandwritingErrorBoundary key={resetKey} onFallback={onFallback}>
    <HandwritingAnswer {...props} onFallback={onFallback} onRecognitionFailure={onFallback} />
  </HandwritingErrorBoundary>
}
