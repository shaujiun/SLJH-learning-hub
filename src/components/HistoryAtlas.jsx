import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Brain,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Columns3,
  Clock3,
  ClipboardList,
  Compass,
  ExternalLink,
  Focus,
  HelpCircle,
  Link2,
  Map as MapIcon,
  Moon,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Sun,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import HistoryContentManager from './HistoryContentManager.jsx'
import HistoryQuestionContent, { HistoryQuestionAnswer } from './HistoryQuestionContent.jsx'
import {
  HistoryHelpDialog,
  HistoryCompareDialog,
  HistoryLiteracyDialog,
  HistoryPeriodDialog,
  HistoryQuestionBankDialog,
  HistoryRelationDialog,
} from './HistoryToolDialogs.jsx'
import { getHistoryPeriodTracks } from '../data/historyPeriods.js'
import {
  filterHistoryEvents,
  formatHistoryDate,
  formatHistoryYear,
  historyCategories,
  historyCategoryLabel,
  historyQuestionSourceLabel,
  historyRegionLabel,
  historyRegions,
  historyStatusLabel,
} from '../lib/historyAtlas.js'
import {
  loadHistoryAtlas,
  saveHistoryReaderPosition,
} from '../services/historyService.js'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

function OrientationTip() {
  return (
    <p className="history-orientation-tip">
      <Compass aria-hidden="true" />手機或平板轉成橫向，閱讀時間軸會更方便喔！
    </p>
  )
}

function EventDetail({ event, onClose }) {
  if (!event) return null
  const detailSections = [
    ['發生原因', event.causeText],
    ['事件經過', event.processText],
    ['後續影響', event.impactText],
  ]
  return (
    <div className="history-detail-backdrop" role="presentation" onMouseDown={(mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onClose() }}>
      <article className={`history-event-detail category-${event.category}`} role="dialog" aria-modal="true" aria-labelledby="history-detail-title">
        <button className="history-detail-close" type="button" onClick={onClose} aria-label="關閉事件說明"><X aria-hidden="true" /></button>
        {event.imageUrl && <img className="history-detail-image" src={event.imageUrl} alt={`${event.title}相關圖片`} />}
        <div className="history-detail-heading">
          <div className="history-event-meta"><span>{historyRegionLabel(event.region)}</span><span>{historyCategoryLabel(event.category)}</span>{event.status !== 'published' && <span>{historyStatusLabel(event.status)}</span>}</div>
          <p>{formatHistoryDate(event)}</p>
          <h2 id="history-detail-title">{event.title}</h2>
          <strong>{event.summary || '這個事件的一句話重點尚待補充。'}</strong>
        </div>
        <div className="history-detail-learning-grid">
          {detailSections.map(([title, content]) => (
            <section key={title}><h3>{title}</h3><p>{content || '教師審核後補充。'}</p></section>
          ))}
        </div>
        {(event.people.length > 0 || event.keywords.length > 0) && (
          <div className="history-tag-groups">
            {event.people.length > 0 && <div><b>重要人物</b>{event.people.map((item) => <span key={item}>{item}</span>)}</div>}
            {event.keywords.length > 0 && <div><b>關鍵詞</b>{event.keywords.map((item) => <span key={item}>{item}</span>)}</div>}
          </div>
        )}
        <div className="history-detail-source">
          <p><b>課程位置：</b>翰林第 {event.chapter?.volumeNo} 冊第 {event.chapter?.chapterNo} 章｜{event.chapter?.title}</p>
          {event.sourceNote && <p><b>資料備註：</b>{event.sourceNote}</p>}
          {event.imageSource && <p><b>圖片出處：</b>{event.imageSourceUrl ? <a href={event.imageSourceUrl} target="_blank" rel="noreferrer">{event.imageSource}<ExternalLink aria-hidden="true" /></a> : event.imageSource}</p>}
          {event.resourceUrl && <a className="history-resource-link" href={event.resourceUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />開啟延伸學習資料</a>}
        </div>
        <section className="history-detail-questions" aria-labelledby="history-related-questions-title">
          <div className="history-detail-question-heading">
            <div><p>延伸練習</p><h3 id="history-related-questions-title">相關歷屆與練習題</h3></div>
            <span>{(event.pastQuestions?.length || 0) + (event.practiceQuestions?.length || 0)} 題</span>
          </div>
          <div className="history-question-groups">
            {[
              ['相關歷屆題', event.pastQuestions || []],
              ['教師自編題', event.practiceQuestions || []],
            ].map(([label, questions]) => (
              <section key={label}>
                <h4>{label}</h4>
                {questions.length > 0 ? questions.map((question, index) => (
                  <article className="history-question-card" key={question.id || `${label}-${index}`}>
                    <small>來源：{question.sourceUrl ? <a href={question.sourceUrl} target="_blank" rel="noreferrer">{historyQuestionSourceLabel(question)}</a> : historyQuestionSourceLabel(question)}</small>
                    <HistoryQuestionContent question={question} />
                    <details>
                      <summary>查看答案與解析</summary>
                      <HistoryQuestionAnswer question={question} />
                      {question.explanation && <span>{question.explanation}</span>}
                    </details>
                  </article>
                )) : <p className="history-question-empty">目前尚未建立與此事件直接相關的{label}。</p>}
              </section>
            ))}
          </div>
        </section>
      </article>
    </div>
  )
}

function FocusReader({ events, currentEvent, onSelect }) {
  const index = Math.max(0, events.findIndex((event) => event.id === currentEvent?.id))
  const event = events[index]
  if (!event) return <div className="history-empty"><BookOpen aria-hidden="true" /><h3>目前沒有符合條件的事件</h3><p>請調整冊次、章節或篩選條件。</p></div>

  return (
    <section className={`history-focus-reader category-${event.category}`} aria-live="polite">
      <div className="history-focus-count">第 {index + 1} 個，共 {events.length} 個事件</div>
      <div className="history-event-meta"><span>{historyRegionLabel(event.region)}</span><span>{historyCategoryLabel(event.category)}</span></div>
      <p className="history-focus-date">{formatHistoryDate(event)}</p>
      <h2>{event.title}</h2>
      <p className="history-focus-summary">{event.summary || '這個事件的一句話重點尚待補充。'}</p>
      <div className="history-focus-three">
        <div><b>為什麼？</b><p>{event.causeText || '教師審核後補充。'}</p></div>
        <div><b>發生什麼？</b><p>{event.processText || '教師審核後補充。'}</p></div>
        <div><b>造成什麼影響？</b><p>{event.impactText || '教師審核後補充。'}</p></div>
      </div>
      <div className="history-focus-navigation">
        <button type="button" disabled={index === 0} onClick={() => onSelect(events[index - 1])}><ChevronLeft aria-hidden="true" />上一事件</button>
        <button className="history-focus-detail" type="button" onClick={() => onSelect(event, true)}>查看完整資料</button>
        <button type="button" disabled={index === events.length - 1} onClick={() => onSelect(events[index + 1])}>下一事件<ChevronRight aria-hidden="true" /></button>
      </div>
    </section>
  )
}

function timelinePeriodLabel(period) {
  const end = period.isOngoing ? '至今' : formatHistoryYear(period.endYear)
  return `${formatHistoryYear(period.startYear)}－${end}`
}

function layoutCompactEvents(events, boundaryIndex, boundaryCount) {
  const rowEnds = []
  const items = events.map((event) => {
    const start = boundaryIndex.get(Number(event.startYear)) ?? 0
    const span = Math.min(2, Math.max(1, boundaryCount - start))
    let row = rowEnds.findIndex((end) => end <= start)
    if (row < 0) row = rowEnds.length
    rowEnds[row] = start + span
    return { event, row, start, span }
  })
  return { items, rowCount: Math.max(1, rowEnds.length) }
}

export function layoutHistoryPeriods(periods) {
  const rowEnds = []
  const items = [...periods]
    .sort((left, right) => left.startYear - right.startYear || left.endYear - right.endYear)
    .map((period) => {
      // 沒有時間重疊就使用原列；真正同時存在才換列。
      let row = rowEnds.findIndex((endYear) => endYear <= period.startYear)
      if (row < 0) row = rowEnds.length
      rowEnds[row] = period.endYear
      return { period, row }
    })

  return { items, rowCount: Math.max(1, rowEnds.length) }
}

export function areHistoryYearsContinuous(endYear, nextStartYear) {
  const end = Number(endYear)
  const start = Number(nextStartYear)
  if (!Number.isFinite(end) || !Number.isFinite(start) || start < end) return false
  if (start === end || start === end + 1) return true
  // 西元前 1 年之後直接是西元 1 年，曆法中沒有西元 0 年。
  return end === -1 && start === 1
}

export function historyPeriodGridColumn(startIndex, endIndex) {
  const startLine = startIndex + 2
  // 結束年份同時也是下一朝代起點時，兩個長條共用交界線，不共用整個格子。
  const endLine = Math.max(startLine + 1, endIndex + 2)
  return `${startLine} / ${endLine}`
}

const historyScaleYearsByVolume = {
  3: [-1600, -1000, -500, 1, 500, 1000, 1300, 1500, 1700, 1800, 1850, 1900, 1912],
  4: [1912, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020, 2030],
}

export function getHistoryScaleYears(volumeNo) {
  return historyScaleYearsByVolume[Number(volumeNo)] || []
}

function historyEraBandLabel(startYear, endYear) {
  if (startYear < 0 && endYear < 0) return `西元前 ${Math.abs(startYear)}～${Math.abs(endYear)} 年`
  return `${formatHistoryYear(startYear)}～${formatHistoryYear(endYear)}`
}

export function createHistoryEraBands(boundaries, volumeNo) {
  const boundaryIndex = new Map(boundaries.map((year, index) => [year, index]))
  const scaleYears = getHistoryScaleYears(volumeNo).filter((year) => boundaryIndex.has(year))
  return scaleYears.slice(0, -1).map((startYear, index) => {
    const endYear = scaleYears[index + 1]
    const start = boundaryIndex.get(startYear)
    const end = boundaryIndex.get(endYear)
    return {
      id: `${startYear}-${endYear}`,
      label: historyEraBandLabel(startYear, endYear),
      start,
      span: Math.max(1, end - start),
    }
  })
}

function historyYearDistance(startYear, endYear) {
  const start = Number(startYear)
  const end = Number(endYear)
  if (start < 0 && end > 0) return Math.max(1, end - start - 1)
  return Math.max(1, end - start)
}

export function getTimelineColumnWidths(boundaries, scaleMode, volumeNo, zoom = 100) {
  const zoomRatio = Math.min(2, Math.max(0.5, Number(zoom) / 100))
  const linearUnit = Number(volumeNo) === 3 ? 1.35 : 15
  return boundaries.map((year, index) => {
    if (index === boundaries.length - 1) return Math.round(42 * zoomRatio)
    const distance = historyYearDistance(year, boundaries[index + 1])
    const baseWidth = scaleMode === 'linear' ? Math.max(2, distance * linearUnit) : 68
    return Math.max(2, Math.round(baseWidth * zoomRatio))
  })
}

const historyJumpOptionsByVolume = {
  3: [
    { label: '商周', year: -1046 },
    { label: '秦漢', year: -221 },
    { label: '隋唐', year: 581 },
    { label: '宋元', year: 960 },
    { label: '西力衝擊', year: 1840 },
    { label: '清末', year: 1895 },
  ],
  4: [
    { label: '民國建立', year: 1912 },
    { label: '全面抗戰', year: 1937 },
    { label: '戰後東亞', year: 1945 },
    { label: '改革開放', year: 1978 },
    { label: '當代', year: 2000 },
  ],
}

export function Timeline({
  events,
  scaleEvents,
  regions,
  volumeNo,
  canManage,
  scaleMode = 'reading',
  zoom = 100,
  onZoomChange = () => {},
  onSelect,
  onSelectPeriod = () => {},
}) {
  const scrollRef = useRef(null)
  const dragStateRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [cursor, setCursor] = useState(null)
  const periodTracks = getHistoryPeriodTracks(volumeNo)
  const periods = periodTracks.flatMap((track) => track.periods)
  const scaleYears = getHistoryScaleYears(volumeNo)
  const boundaries = [...new Set([
    ...scaleYears,
    ...periods.flatMap((period) => [period.startYear, period.endYear]),
    ...scaleEvents.flatMap((event) => [Number(event.startYear), Number(event.endYear || event.startYear)]),
  ].filter(Number.isFinite))].sort((left, right) => left - right)
  if (boundaries.length < 2) boundaries.push((boundaries[0] || new Date().getFullYear()) + 1)
  const boundaryIndex = new Map(boundaries.map((year, index) => [year, index]))
  const timelineColumnCount = boundaries.length
  const columnWidths = getTimelineColumnWidths(boundaries, scaleMode, volumeNo, zoom)
  const gridTemplateColumns = `150px ${columnWidths.map((width) => `${width}px`).join(' ')}`
  const canvasWidth = 150 + columnWidths.reduce((total, width) => total + width, 0)
  const eraBands = createHistoryEraBands(boundaries, volumeNo)
  const jumpOptions = historyJumpOptionsByVolume[Number(volumeNo)] || []

  const startDragging = (event) => {
    if (event.button !== 0 || event.target.closest('button, a, input, select, summary, .history-period-bar, .history-period-track-label')) return
    const container = scrollRef.current
    if (!container) return
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: container.scrollLeft,
    }
    container.setPointerCapture?.(event.pointerId)
    setIsDragging(true)
  }

  const updateCursor = (event) => {
    const container = scrollRef.current
    if (!container || dragStateRef.current) return
    const rect = container.getBoundingClientRect()
    const contentX = event.clientX - rect.left + container.scrollLeft - 150
    if (contentX < 0) {
      setCursor(null)
      return
    }
    let consumed = 0
    let index = columnWidths.length - 1
    for (let current = 0; current < columnWidths.length; current += 1) {
      if (contentX < consumed + columnWidths[current]) {
        index = current
        break
      }
      consumed += columnWidths[current]
    }
    const startYear = boundaries[index]
    const endYear = boundaries[Math.min(index + 1, boundaries.length - 1)]
    const ratio = columnWidths[index] > 0 ? Math.min(1, Math.max(0, (contentX - consumed) / columnWidths[index])) : 0
    let year = Math.round(startYear + (endYear - startYear) * ratio)
    if (year === 0) year = ratio < 0.5 ? -1 : 1
    setCursor({ x: Math.min(contentX, canvasWidth - 150), year })
  }

  const movePointer = (event) => {
    const dragState = dragStateRef.current
    const container = scrollRef.current
    if (dragState && container && dragState.pointerId === event.pointerId) {
      container.scrollLeft = dragState.scrollLeft - (event.clientX - dragState.startX)
      event.preventDefault()
      return
    }
    updateCursor(event)
  }

  const stopDragging = (event) => {
    const container = scrollRef.current
    if (dragStateRef.current?.pointerId !== event.pointerId) return
    if (container?.hasPointerCapture?.(event.pointerId)) container.releasePointerCapture(event.pointerId)
    dragStateRef.current = null
    setIsDragging(false)
  }

  const jumpToYear = (year) => {
    const container = scrollRef.current
    if (!container) return
    let index = boundaries.findIndex((boundary) => boundary >= year)
    if (index < 0) index = boundaries.length - 1
    const left = columnWidths.slice(0, index).reduce((total, width) => total + width, 0)
    container.scrollTo({ left: Math.max(0, left - 100), behavior: 'smooth' })
  }

  return (
    <section className="history-period-section" aria-labelledby="history-synced-timeline-title">
      <div className="history-period-heading">
        <div>
          <p><Clock3 aria-hidden="true" /> 同步年代</p>
          <h2 id="history-synced-timeline-title">各地區同步時間軸</h2>
        </div>
        <small>拖曳空白處或使用下方捲軸左右移動；點事件查看分層摘要與相關歷屆、練習題。</small>
      </div>
      <div className="history-timeline-toolbar">
        <div className="history-quick-jumps"><strong>快速前往</strong>{jumpOptions.map((option) => <button type="button" onClick={() => jumpToYear(option.year)} key={option.label}>{option.label}</button>)}</div>
        <div className="history-zoom-controls">
          <button type="button" onClick={() => onZoomChange(Math.max(50, zoom - 25))} aria-label="縮小時間軸"><ZoomOut aria-hidden="true" /></button>
          <span>{zoom}%</span>
          <button type="button" onClick={() => onZoomChange(Math.min(200, zoom + 25))} aria-label="放大時間軸"><ZoomIn aria-hidden="true" /></button>
          <button type="button" onClick={() => onZoomChange(100)}>重設</button>
        </div>
      </div>
      <div
        className={`history-period-scroll ${isDragging ? 'is-dragging' : ''}`}
        ref={scrollRef}
        tabIndex="0"
        aria-label="各地區同步歷史時間軸，可拖曳空白處或使用下方捲軸左右移動"
        onPointerDown={startDragging}
        onPointerMove={movePointer}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={() => { if (!dragStateRef.current) setCursor(null) }}
      >
        <div className="history-period-canvas" style={{ width: `${canvasWidth}px` }}>
          {cursor && <div className="history-timeline-cursor" style={{ left: `${150 + cursor.x}px` }}><span>{formatHistoryYear(cursor.year)}</span></div>}
          <div className="history-period-years" style={{ gridTemplateColumns }}>
            <strong>共同年代</strong>
            {eraBands.map((band) => (
              <span
                className="history-era-band"
                style={{ gridColumn: `${band.start + 2} / span ${band.span}` }}
                key={band.id}
              >
                {band.label}
              </span>
            ))}
          </div>
          {regions.map((region) => {
            const regionTracks = periodTracks.filter((track) => track.region === region.value)
            const regionEvents = events.filter((event) => event.region === region.value)
            const layout = layoutCompactEvents(regionEvents, boundaryIndex, timelineColumnCount)
            return (
              <section className={`history-sync-region region-${region.value}`} key={region.value}>
                <div className="history-sync-region-axis" style={{ gridTemplateColumns }}>
                  <strong className="history-period-track-label">{region.label}時間軸</strong>
                  <div className="history-sync-axis-line" style={{ gridColumn: '2 / -1' }}>
                    <span>{regionEvents.length} 個事件</span>
                  </div>
                </div>
                {regionTracks.map((track) => {
                  const periodLayout = layoutHistoryPeriods(track.periods)
                  return (
                    <div
                      className="history-period-track"
                      style={{
                        gridTemplateColumns,
                        gridTemplateRows: `repeat(${periodLayout.rowCount}, 58px)`,
                      }}
                      key={track.id}
                    >
                      <strong
                        className="history-period-track-label"
                        style={{ gridRow: `1 / span ${periodLayout.rowCount}` }}
                      >
                        {track.label}
                      </strong>
                      {periodLayout.items.map(({ period, row }, periodIndex) => {
                        const start = boundaryIndex.get(period.startYear)
                        const end = boundaryIndex.get(period.endYear)
                        const nextPeriod = periodLayout.items[periodIndex + 1]?.period
                        const displayEnd = nextPeriod && areHistoryYearsContinuous(period.endYear, nextPeriod.startYear)
                          ? boundaryIndex.get(nextPeriod.startYear)
                          : end
                        return (
                          <button
                            type="button"
                            className="history-period-bar"
                            style={{
                              gridColumn: historyPeriodGridColumn(start, displayEnd),
                              gridRow: row + 1,
                            }}
                            title={`${period.label}｜${timelinePeriodLabel(period)}`}
                            aria-label={`${period.label}，${timelinePeriodLabel(period)}`}
                            onClick={() => onSelectPeriod({ period, trackLabel: track.label, region: track.region })}
                            key={period.id}
                          >
                            <b>{period.label}</b>
                            <span>{timelinePeriodLabel(period)}</span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
                <div
                  className="history-sync-event-grid"
                  style={{
                    gridTemplateColumns,
                    gridTemplateRows: `repeat(${layout.rowCount}, 58px)`,
                  }}
                >
                  <strong
                    className="history-period-track-label history-sync-event-label"
                    style={{ gridRow: `1 / span ${layout.rowCount}` }}
                  >
                    {region.label}事件
                  </strong>
                  {layout.items.map(({ event, row, start, span }) => (
                    <button
                      type="button"
                      className={`history-timeline-compact-card category-${event.category} importance-${event.importance}`}
                      style={{ gridColumn: `${start + 2} / span ${span}`, gridRow: row + 1 }}
                      onClick={() => onSelect(event, true)}
                      title={`${formatHistoryDate(event)}｜${event.title}`}
                      key={event.id}
                    >
                      <small>{formatHistoryDate(event)}</small>
                      <strong>{event.title}</strong>
                      {canManage && event.status !== 'published' && <em>{historyStatusLabel(event.status)}</em>}
                    </button>
                  ))}
                  {layout.items.length === 0 && <p className="history-sync-no-events" style={{ gridColumn: '2 / -1' }}>目前篩選條件下沒有這個地區的事件。</p>}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function HistoryAtlas() {
  const previewMode = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('preview') === '1'
  const [state, setState] = useState({ loading: true, data: null, error: '' })
  const [volumeNo, setVolumeNo] = useState(3)
  const [chapterId, setChapterId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedRegions, setSelectedRegions] = useState(
    () => historyRegions.map((region) => region.value),
  )
  const [selectedCategories, setSelectedCategories] = useState([])
  const [focusMode, setFocusMode] = useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)
  const [showManager, setShowManager] = useState(false)
  const [density, setDensity] = useState('standard')
  const [scaleMode, setScaleMode] = useState('reading')
  const [zoom, setZoom] = useState(100)
  const [activeTool, setActiveTool] = useState('')
  const [periodDetail, setPeriodDetail] = useState(null)
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('history-dark-mode') === '1')

  useEffect(() => {
    window.localStorage.setItem('history-dark-mode', darkMode ? '1' : '0')
  }, [darkMode])

  const load = async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      let data
      if (previewMode) {
        const response = await fetch('/__history-preview-data')
        if (!response.ok) throw new Error('無法載入本機歷史預覽資料。')
        data = await response.json()
      } else {
        data = await loadHistoryAtlas()
      }
      setState({ loading: false, data, error: '' })
      if (data.position?.volume_no) setVolumeNo(data.position.volume_no)
      if (data.position?.chapter_id) setChapterId(data.position.chapter_id)
      setFocusMode(Boolean(data.position?.focus_mode))
      const restoredEvent = data.events.find((event) => event.id === data.position?.event_id)
      if (restoredEvent) setCurrentEvent(restoredEvent)
    } catch (error) {
      setState({ loading: false, data: null, error: error.message || '無法讀取歷史時光地圖。' })
    }
  }

  useEffect(() => { load() }, [])

  const chapters = state.data?.chapters || []
  const allEvents = state.data?.events || []
  const activeChapters = chapters.filter((chapter) => chapter.volumeNo === Number(volumeNo))
  const selectedRegionRows = historyRegions.filter((region) => selectedRegions.includes(region.value))
  const timelineEvents = useMemo(
    () => allEvents.filter((event) => event.status !== 'archived'),
    [allEvents],
  )
  const volumeTimelineEvents = useMemo(
    () => timelineEvents.filter((event) => Number(event.chapter?.volumeNo) === Number(volumeNo)),
    [timelineEvents, volumeNo],
  )
  const events = useMemo(() => {
    const filtered = filterHistoryEvents(timelineEvents, {
      volumeNo,
      chapterId,
      keyword,
      regions: selectedRegions,
      categories: selectedCategories,
    })
    if (density === 'core') return filtered.filter((event) => Number(event.importance) >= 3)
    if (density === 'standard') return filtered.filter((event) => Number(event.importance) >= 2)
    return filtered
  }, [chapterId, density, keyword, selectedCategories, selectedRegions, timelineEvents, volumeNo])

  useEffect(() => {
    if (currentEvent && events.some((event) => event.id === currentEvent.id)) return
    setCurrentEvent(events[0] || null)
  }, [events, currentEvent])

  const remember = (event = currentEvent, nextFocus = focusMode) => {
    if (previewMode) return
    saveHistoryReaderPosition({ chapterId, eventId: event?.id, volumeNo, focusMode: nextFocus })
  }

  const selectEvent = (event, openDetail = false) => {
    setCurrentEvent(event)
    if (openDetail) setDetailEvent(event)
    if (!previewMode) saveHistoryReaderPosition({ chapterId, eventId: event.id, volumeNo, focusMode })
  }

  const selectEventFromTool = (event) => {
    setActiveTool('')
    setPeriodDetail(null)
    selectEvent(event, true)
  }

  const toggleRegion = (region) => {
    setSelectedRegions((current) => current.includes(region)
      ? current.filter((item) => item !== region)
      : [...current, region])
  }

  const toggleCategory = (category) => {
    setSelectedCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category])
  }

  if (state.loading) return <main className="center-screen history-loading"><div className="loading-orb"><RefreshCw aria-hidden="true" /></div><h1>正在展開歷史時光地圖</h1><p>正在讀取章節、事件與上次閱讀位置。</p></main>
  if (state.error) return <main className="center-screen"><div className="error-orb"><CircleAlert aria-hidden="true" /></div><h1>歷史時光地圖暫時無法載入</h1><p>{state.error}</p><div className="button-row"><button className="primary-button" type="button" onClick={load}><RefreshCw aria-hidden="true" />重新讀取</button><a className="secondary-button" href="./"><ArrowLeft aria-hidden="true" />返回學習任務</a></div></main>

  const canManage = Boolean(state.data?.canManage)
  return (
    <div className={`history-atlas-shell ${darkMode ? 'is-dark' : ''}`}>
      <header className="history-site-header">
        <a className="history-brand" href="?subject=history"><span><MapIcon aria-hidden="true" /></span><div><p>HISTORY ATLAS</p><strong>歷史時光地圖</strong></div></a>
        <nav><a href="./"><ArrowLeft aria-hidden="true" />返回任務頁</a><a href={contactBookUrl}><BookOpen aria-hidden="true" />返回聯絡簿</a>{canManage && <button type="button" onClick={() => setShowManager((value) => !value)}><Settings aria-hidden="true" />{showManager ? '返回地圖' : '內容管理'}</button>}</nav>
      </header>

      <main className="history-page-content">
        <section className="history-hero">
          <div><p className="eyebrow">HANLIN・GRADE 8</p><h1>把事件放回時間裡，歷史就不再是碎片</h1><p>國中所有歷史的洪流，可幫助學習統整。點選事件可查看原因、經過與影響。</p></div>
          <div className="history-hero-art"><span>古</span><Compass aria-hidden="true" /></div>
        </section>
        <OrientationTip />
        {previewMode && (
          <p className="history-preview-banner">
            本機預覽模式：目前使用 24 筆示範事件，不連接、不修改 Supabase，也不會發布網站。
          </p>
        )}

        {showManager && canManage ? (
          <HistoryContentManager chapters={chapters} events={allEvents} onChanged={load} />
        ) : (
          <>
            <section className="history-controls" aria-label="歷史時間軸篩選">
              <div className="history-control-primary">
                <label><span>冊別</span><select value={volumeNo} onChange={(event) => { setVolumeNo(Number(event.target.value)); setChapterId(''); remember(null) }}><option value="3">八上｜第 3 冊</option><option value="4">八下｜第 4 冊</option></select></label>
                <label className="history-chapter-select"><span>章節</span><select value={chapterId} onChange={(event) => { setChapterId(event.target.value); remember() }}><option value="">整冊全部章節</option>{activeChapters.map((chapter) => <option key={chapter.id} value={chapter.id}>第 {chapter.chapterNo} 章｜{chapter.title}</option>)}</select></label>
                <label className="history-search"><span>搜尋</span><div><Search aria-hidden="true" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="事件、人物、制度或年份" />{keyword && <button type="button" onClick={() => setKeyword('')} aria-label="清除搜尋"><X aria-hidden="true" /></button>}</div></label>
                <button className={`history-focus-toggle ${focusMode ? 'is-active' : ''}`} type="button" onClick={() => { const next = !focusMode; setFocusMode(next); remember(currentEvent, next) }}><Focus aria-hidden="true" />{focusMode ? '返回時間軸' : '專注閱讀'}</button>
              </div>

              {!focusMode && <div className="history-filter-groups">
                <fieldset><legend>地區</legend>{historyRegions.map((region) => <button type="button" className={selectedRegions.includes(region.value) ? 'is-active' : ''} onClick={() => toggleRegion(region.value)} key={region.value}>{region.label}</button>)}</fieldset>
                <fieldset><legend>事件類型</legend>{historyCategories.map((category) => <button type="button" className={selectedCategories.includes(category.value) ? `is-active category-${category.value}` : ''} onClick={() => toggleCategory(category.value)} key={category.value}>{category.label}</button>)}</fieldset>
              </div>}
              {!focusMode && (
                <div className="history-display-tools">
                  <div className="history-display-selects">
                    <label><span>事件密度</span><select value={density} onChange={(event) => setDensity(event.target.value)}><option value="core">核心事件</option><option value="standard">課綱重點</option><option value="all">完整資料</option></select></label>
                    <label><span>時間比例</span><select value={scaleMode} onChange={(event) => { setScaleMode(event.target.value); setZoom(100) }}><option value="reading">閱讀比例</option><option value="linear">線性比例</option></select></label>
                  </div>
                  <div className="history-tool-buttons">
                    <button type="button" onClick={() => setActiveTool('questions')}><ClipboardList aria-hidden="true" />題庫</button>
                    <button type="button" onClick={() => setActiveTool('compare')}><Columns3 aria-hidden="true" />事件比較</button>
                    <button type="button" onClick={() => setActiveTool('relations')}><Link2 aria-hidden="true" />事件關聯</button>
                    <button type="button" onClick={() => setActiveTool('literacy')}><Brain aria-hidden="true" />素養工具</button>
                    <button type="button" onClick={() => window.print()}><Printer aria-hidden="true" />列印</button>
                    <button type="button" onClick={() => setDarkMode((value) => !value)}>{darkMode ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}{darkMode ? '淺色' : '深色'}</button>
                    <button type="button" onClick={() => setActiveTool('help')}><HelpCircle aria-hidden="true" />說明</button>
                  </div>
                </div>
              )}
              <p className="history-result-count">目前顯示 {events.length} 個事件{canManage && allEvents.some((event) => event.status !== 'published') ? '；管理者可同時看見尚未發布的草稿' : ''}</p>
            </section>

            {focusMode
              ? <FocusReader events={events} currentEvent={currentEvent} onSelect={selectEvent} />
              : selectedRegionRows.length === 0
                ? <div className="history-empty"><MapIcon aria-hidden="true" /><h3>請至少選擇一個地區</h3><p>八年級建議先從「中國」開始。</p></div>
                : <Timeline
                    events={events}
                    scaleEvents={volumeTimelineEvents}
                    regions={selectedRegionRows}
                    volumeNo={volumeNo}
                    canManage={canManage}
                    scaleMode={scaleMode}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    onSelect={selectEvent}
                    onSelectPeriod={setPeriodDetail}
                  />}

            {!focusMode && <section className="history-legend"><strong>底色代表事件類型</strong>{historyCategories.map((category) => <span className={`category-${category.value}`} key={category.value}>{category.label}</span>)}</section>}
          </>
        )}
      </main>
      <EventDetail event={detailEvent} onClose={() => setDetailEvent(null)} />
      {activeTool === 'questions' && <HistoryQuestionBankDialog events={volumeTimelineEvents} onClose={() => setActiveTool('')} onSelectEvent={selectEventFromTool} />}
      {activeTool === 'compare' && <HistoryCompareDialog events={volumeTimelineEvents} onClose={() => setActiveTool('')} onSelectEvent={selectEventFromTool} />}
      {activeTool === 'relations' && <HistoryRelationDialog events={volumeTimelineEvents} onClose={() => setActiveTool('')} onSelectEvent={selectEventFromTool} />}
      {activeTool === 'literacy' && <HistoryLiteracyDialog onClose={() => setActiveTool('')} />}
      {activeTool === 'help' && <HistoryHelpDialog onClose={() => setActiveTool('')} />}
      <HistoryPeriodDialog detail={periodDetail} events={volumeTimelineEvents} onClose={() => setPeriodDetail(null)} onSelectEvent={selectEventFromTool} />
    </div>
  )
}
