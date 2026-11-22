import { useEffect, useRef, useState } from 'react'
import './handwritingAnswer.css'

const PAD_SIZE = 180

export async function recognizeTraditionalChinese(strokes, fetcher = fetch) {
  if (!strokes.length) return []
  const body = {
    options: 'enable_pre_space',
    requests: [{
      writing_guide: { writing_area_width: PAD_SIZE, writing_area_height: PAD_SIZE },
      ink: strokes.map((stroke) => [stroke.x, stroke.y]),
      language: 'zh_TW',
    }],
  }
  const response = await fetcher('https://inputtools.google.com/request?itc=zh-t-i0-handwrit&app=demopage', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const result = await response.json()
  if (result?.[0] !== 'SUCCESS') return []
  return (result?.[1]?.[0]?.[1] || []).filter((item) => Array.from(String(item)).length === 1 && /[㐀-鿿]/.test(item))
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

function HandwritingPad({ value, onChange, label }) {
  const canvasRef = useRef(null)
  const activeStroke = useRef(null)
  const [strokes, setStrokes] = useState([])
  const [candidates, setCandidates] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => drawPad(canvasRef.current, strokes), [strokes])

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(PAD_SIZE, (event.clientX - rect.left) * PAD_SIZE / rect.width)),
      y: Math.max(0, Math.min(PAD_SIZE, (event.clientY - rect.top) * PAD_SIZE / rect.height)),
    }
  }
  const pointerDown = (event) => {
    event.preventDefault()
    canvasRef.current.setPointerCapture(event.pointerId)
    const start = point(event)
    activeStroke.current = { x: [start.x], y: [start.y] }
    setStrokes((items) => [...items, activeStroke.current])
  }
  const pointerMove = (event) => {
    if (!activeStroke.current) return
    event.preventDefault()
    const next = point(event)
    activeStroke.current.x.push(next.x)
    activeStroke.current.y.push(next.y)
    setStrokes((items) => [...items.slice(0, -1), { ...activeStroke.current, x: [...activeStroke.current.x], y: [...activeStroke.current.y] }])
  }
  const pointerUp = () => { activeStroke.current = null }
  const clear = () => {
    setStrokes([]); setCandidates([]); setStatus(''); onChange('')
  }
  const recognize = async () => {
    if (!strokes.length) { setStatus('請先寫字。'); return }
    setStatus('辨識中…')
    try {
      const result = await recognizeTraditionalChinese(strokes)
      setCandidates(result.slice(0, 8))
      if (result[0]) onChange(result[0])
      setStatus(result.length ? '請選擇正確候選字。' : '暫時辨識不出來，請重寫或改用鍵盤。')
    } catch {
      setStatus('無法連線辨識，請改用鍵盤輸入。')
    }
  }

  return (
    <div className="handwriting-pad">
      <div className="handwriting-pad-label">{label}：<strong>{value || '尚未選字'}</strong></div>
      <canvas ref={canvasRef} width={PAD_SIZE} height={PAD_SIZE} aria-label={`${label}手寫區`}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} />
      <div className="handwriting-actions">
        <button type="button" onClick={() => setStrokes((items) => items.slice(0, -1))}>復原一筆</button>
        <button type="button" onClick={clear}>清除</button>
        <button type="button" className="primary" onClick={recognize}>辨識</button>
      </div>
      {candidates.length > 0 && <div className="handwriting-candidates" aria-label="候選字">
        {candidates.map((candidate) => <button type="button" className={candidate === value ? 'is-selected' : ''}
          key={candidate} onClick={() => onChange(candidate)}>{candidate}</button>)}
      </div>}
      {status && <p className="handwriting-status">{status}</p>}
    </div>
  )
}

export default function HandwritingAnswer({ length = 1, value = '', onChange }) {
  const characters = Array.from(value || '')
  const updateCharacter = (index, character) => {
    const next = Array.from({ length }, (_, itemIndex) => itemIndex === index ? character : characters[itemIndex] || '')
    onChange(next.join(''))
  }
  return (
    <div className="handwriting-answer">
      {Array.from({ length }, (_, index) => <HandwritingPad key={index} label={`第 ${index + 1} 字`}
        value={characters[index] || ''} onChange={(character) => updateCharacter(index, character)} />)}
    </div>
  )
}
