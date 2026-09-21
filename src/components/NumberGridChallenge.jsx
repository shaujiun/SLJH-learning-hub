import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  ChevronDown,
  LockKeyhole,
  RotateCcw,
} from 'lucide-react'
import {
  assessNumberGridChallenge,
  NUMBER_GRID_BANK,
  NUMBER_GRID_CANVAS_SIZE,
  numberGridChallenges,
  restoreNumberGridProgress,
  serializeNumberGridProgress,
} from '../lib/numberGridChallenge.js'
import './numberGridChallenge.css'

function progressKey(challengeId) {
  return `sljh-number-grid-progress-v1:${challengeId}`
}

function loadProgress(challenge) {
  if (typeof window === 'undefined') return restoreNumberGridProgress({})
  try {
    return restoreNumberGridProgress(JSON.parse(window.localStorage.getItem(progressKey(challenge.id)) || '{}'))
  } catch {
    return restoreNumberGridProgress({})
  }
}

function clueClass(checked, correct) {
  if (!checked) return ''
  return correct ? 'is-correct' : 'is-incorrect'
}

export function ChallengeBoard({ challenge, entries, onCellClick, checkedResult, answer = false }) {
  const displayEntries = answer ? challenge.solution : entries
  const cellIndexByCoordinate = new Map(challenge.cells.map((cell, index) => [`${cell.row}-${cell.column}`, index]))
  const hasCell = (row, column) => cellIndexByCoordinate.has(`${row}-${column}`)
  return (
    <div className={`number-grid-board-stage ${answer ? 'is-answer' : ''}`}>
      <div className="number-grid-square">
        <div className="number-grid-board" role="grid" aria-label={answer ? '十拿九穩解答' : '十拿九穩題目'}>
          {Array.from({ length: NUMBER_GRID_CANVAS_SIZE ** 2 }, (_, canvasIndex) => {
            const row = Math.floor(canvasIndex / NUMBER_GRID_CANVAS_SIZE)
            const column = canvasIndex % NUMBER_GRID_CANVAS_SIZE
            const entryIndex = cellIndexByCoordinate.get(`${row}-${column}`)
            if (entryIndex == null) return <span className="number-grid-hidden-cell" aria-hidden="true" key={canvasIndex} />
            const value = displayEntries[entryIndex]
            return (
              <button
                type="button"
                role="gridcell"
                key={canvasIndex}
                disabled={answer}
                className={`${value ? 'is-filled' : ''} ${!hasCell(row, column + 1) ? 'has-right-edge' : ''} ${!hasCell(row + 1, column) ? 'has-bottom-edge' : ''}`}
                onClick={() => onCellClick?.(entryIndex)}
                aria-label={`畫布第 ${row + 1} 列第 ${column + 1} 格${value ? `，${value}` : '，空白'}`}
              >
                {value || ''}
              </button>
            )
          })}
        </div>
        {challenge.circleClues.map((clue, index) => {
          const result = checkedResult?.circleResults[index]
          return (
            <span
              className={`number-grid-circle-clue ${clueClass(Boolean(checkedResult), result?.actual === clue.total)}`}
              style={{ '--clue-y': `${clue.row / NUMBER_GRID_CANVAS_SIZE * 100}%`, '--clue-x': `${clue.column / NUMBER_GRID_CANVAS_SIZE * 100}%` }}
              key={`${clue.row}-${clue.column}`}
              aria-label={`周圍相鄰方格合計 ${clue.total}`}
            >
              {clue.total}
            </span>
          )
        })}
        {challenge.lineClues.map((clue, index) => {
          const result = checkedResult?.lineResults[index]
          return (
            <span
              className={`number-grid-line-clue is-${clue.direction} ${clueClass(Boolean(checkedResult), result?.actual === clue.total)}`}
              style={{ '--clue-y': `${clue.anchorRow / NUMBER_GRID_CANVAS_SIZE * 100}%`, '--clue-x': `${clue.anchorColumn / NUMBER_GRID_CANVAS_SIZE * 100}%` }}
              key={clue.id}
              aria-label={`${clue.axis === 'row' ? '橫列' : '直行'}合計 ${clue.total}`}
            >
              {clue.direction === 'left' ? <><ArrowLeft aria-hidden="true" />{clue.total}</> : clue.direction === 'down' ? <>{clue.total}<ArrowDown aria-hidden="true" /></> : <><ArrowUp aria-hidden="true" />{clue.total}</>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export default function NumberGridChallenge({ guestMode = false }) {
  const [selectedId, setSelectedId] = useState(numberGridChallenges.at(-1).id)
  const challenge = useMemo(() => numberGridChallenges.find((item) => item.id === selectedId) || numberGridChallenges[0], [selectedId])
  const initialProgress = useMemo(() => loadProgress(challenge), [challenge])
  const [entries, setEntries] = useState(initialProgress.entries)
  const [perfectCompletedAt, setPerfectCompletedAt] = useState(initialProgress.perfectCompletedAt)
  const [loadedChallengeId, setLoadedChallengeId] = useState(challenge.id)
  const [selectedNumber, setSelectedNumber] = useState(null)
  const [checkedResult, setCheckedResult] = useState(null)
  const [message, setMessage] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    const saved = loadProgress(challenge)
    setEntries(saved.entries)
    setPerfectCompletedAt(saved.perfectCompletedAt)
    setLoadedChallengeId(challenge.id)
    setSelectedNumber(null)
    setCheckedResult(null)
    setMessage('')
  }, [challenge])

  useEffect(() => {
    if (typeof window === 'undefined' || loadedChallengeId !== challenge.id) return
    window.localStorage.setItem(progressKey(challenge.id), JSON.stringify(serializeNumberGridProgress(entries, perfectCompletedAt)))
  }, [challenge.id, entries, loadedChallengeId, perfectCompletedAt])

  const usedNumbers = new Set(entries.filter(Boolean))
  const placeNumber = (cellIndex) => {
    if (selectedNumber == null) {
      if (!entries[cellIndex]) return
      setEntries((current) => current.map((value, index) => index === cellIndex ? null : value))
      setCheckedResult(null)
      setMessage('已將數字放回選擇區。')
      return
    }
    setEntries((current) => current.map((value, index) => {
      if (index === cellIndex) return selectedNumber
      return value === selectedNumber ? null : value
    }))
    setSelectedNumber(null)
    setCheckedResult(null)
    setMessage('')
  }

  const checkAnswer = () => {
    const result = assessNumberGridChallenge(challenge, entries)
    if (!result.complete) {
      setMessage('請先填滿 9 個方格。')
      setCheckedResult(null)
      return
    }
    if (!result.unique) {
      setMessage('每個數字只能使用一次。')
      setCheckedResult(result)
      return
    }
    setCheckedResult(result)
    if (result.correct) {
      setPerfectCompletedAt((current) => current || new Date().toISOString())
      setMessage('全部加總正確，已完成挑戰並解鎖解答。')
    } else {
      setMessage('仍有加總不正確；紅色提示可協助你找出需要調整的位置。')
    }
  }

  const reset = () => {
    setEntries(Array(9).fill(null))
    setSelectedNumber(null)
    setCheckedResult(null)
    setMessage('已清除目前填寫內容。')
  }
  const returnUrl = guestMode ? '?guest=1' : './'

  return (
    <div className="number-grid-page">
      <header className="number-grid-header">
        <a href={returnUrl}><ArrowLeft aria-hidden="true" />返回學習系統</a>
        <div><p>數字益智遊戲</p><h1>十拿九穩之變形挑戰</h1></div>
        <span />
      </header>
      <main className="number-grid-main">
        <section className="number-grid-intro">
          <div><p className="eyebrow">NUMBER GRID</p><h2>用 9 個數字同時完成所有加總</h2><p>來源：聯合報好讀周報　｜　遊戲設計：狄運來老師</p></div>
          <button type="button" onClick={() => setShowInstructions((value) => !value)} aria-expanded={showInstructions}>遊戲說明<ChevronDown aria-hidden="true" /></button>
        </section>
        {showInstructions && (
          <section className="number-grid-instructions">
            <p>從 1～10 選出 9 個數字，分別填入 9 個方格，每個數字只能使用一次。</p>
            <p><strong>圓圈數字</strong>是周圍所有相鄰方格的總和；<strong>箭頭數字</strong>是該橫列或直行方格的總和。先選數字，再點空格；點已填入的格子可取回數字。</p>
          </section>
        )}
        <section className="number-grid-challenge-card">
          <div className="number-grid-challenge-heading">
            <div><p className="eyebrow">CHALLENGE</p><h2>{challenge.label}：{challenge.title}</h2></div>
            <label>選擇題目<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{[...numberGridChallenges].reverse().map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
          </div>
          <div className="number-grid-workspace">
            <div>
              <ChallengeBoard challenge={challenge} entries={entries} onCellClick={placeNumber} checkedResult={checkedResult} />
              <div className="number-grid-actions">
                <button type="button" className="secondary-button" onClick={reset}><RotateCcw aria-hidden="true" />重新開始</button>
                <button type="button" className="primary-button" onClick={checkAnswer}><Check aria-hidden="true" />完成檢查</button>
              </div>
              {message && <p className="number-grid-message" role="status">{message}</p>}
            </div>
            <aside className="number-grid-bank-column">
              <div><p className="eyebrow">NUMBER BANK</p><h2>選擇數字</h2><span>還要填 {9 - usedNumbers.size} 格</span></div>
              <div className="number-grid-bank">
                {NUMBER_GRID_BANK.map((number) => (
                  <button type="button" key={number} disabled={usedNumbers.has(number)} className={selectedNumber === number ? 'is-selected' : ''} onClick={() => setSelectedNumber((current) => current === number ? null : number)}>{number}</button>
                ))}
              </div>
              <p>10 個數字中會有 1 個不使用。</p>
            </aside>
          </div>
        </section>
        <aside className={`number-grid-answer-panel ${perfectCompletedAt ? '' : 'is-locked'}`}>
          {perfectCompletedAt ? (
            <details>
              <summary><span><span className="eyebrow">ANSWER</span><strong>本題解答與解答說明</strong></span><span>已解鎖，可展開查看</span></summary>
              <div className="number-grid-answer-content">
                <ChallengeBoard challenge={challenge} entries={challenge.solution} answer />
                <section><h3>解答說明</h3><p>{challenge.explanation}</p></section>
              </div>
            </details>
          ) : (
            <div className="number-grid-answer-lock"><LockKeyhole aria-hidden="true" /><span><strong>解答尚未解鎖</strong><small>完成一輪並全部答對後才可查看。</small></span></div>
          )}
        </aside>
      </main>
    </div>
  )
}
