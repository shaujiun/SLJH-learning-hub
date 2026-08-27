import { useMemo, useState } from 'react'
import chinaMap from '@svg-maps/china'
import taiwanMap from '@svg-maps/taiwan'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CloudSun,
  Compass,
  Home,
  Lightbulb,
  Map,
  MapPinned,
  Mountain,
  Play,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Target,
  Trophy,
  Waves,
} from 'lucide-react'
import { chinaGeographyChapters, chinaGeographyTopics } from '../data/chinaGeography.js'
import {
  filterTaiwanItemsByDifficulty,
  taiwanGeographyChapters,
  taiwanGeographyTopics,
} from '../data/taiwanGeography.js'
import {
  buildGeographyChoices,
  buildGeographyRound,
  evaluateGeographyFillPlacement,
  geographyDifficultyLabel,
  geographyEffectiveMode,
  geographyFeedback,
  geographyMixedFillStart,
} from '../lib/geographyGame.js'
import './geographyFillMap.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

const areas = [
  { id: 'taiwan', name: '臺灣地理', caption: '七年級', status: '已開放' },
  { id: 'china', name: '中國地理', caption: '八年級', status: '已開放' },
  { id: 'world', name: '世界地理', caption: '九年級', status: '後續建立' },
]

const geographyAreas = {
  taiwan: {
    name: '臺灣地理',
    map: taiwanMap,
    chapters: taiwanGeographyChapters,
    topics: taiwanGeographyTopics,
    defaultChapterId: 'grade7-upper-l01',
    defaultTopicId: 'tw-map-skills',
    attributionUrl: 'https://github.com/VictorCazanave/svg-maps/tree/master/packages/taiwan',
    mapLabel: '臺灣縣市與自然地理填圖地圖',
  },
  china: {
    name: '中國地理',
    map: chinaMap,
    chapters: chinaGeographyChapters,
    topics: chinaGeographyTopics,
    defaultChapterId: 'grade8-upper-l01',
    defaultTopicId: 'relief-steps',
    attributionUrl: 'https://github.com/VictorCazanave/svg-maps/tree/master/packages/china',
    mapLabel: '中國行政區與地理填圖地圖',
  },
}

const modes = [
  { id: 'locate', name: '看名稱找位置', detail: '依題目，在地圖上點出位置。' },
  { id: 'identify', name: '看位置選名稱', detail: '觀察亮起的位置，再選正確名稱。' },
  { id: 'fill', name: '標籤填圖', detail: '選取標籤後，把它放到正確位置。' },
  { id: 'mixed', name: '混合挑戰', detail: '交替練習找位置與看圖辨認。' },
]

const difficulties = [
  { id: 'intro', name: '入門', count: 6, detail: '每回合 6 題、3 個選項' },
  { id: 'basic', name: '基礎', count: 10, detail: '每回合 10 題、4 個選項' },
  { id: 'advanced', name: '進階', count: 10, detail: '每回合 10 題、5 個選項' },
]

const topicIcons = {
  'relief-steps': Mountain,
  administrative: MapPinned,
  terrain: Mountain,
  rivers: Waves,
  lakes: Waves,
  seas: Waves,
  climate: CloudSun,
  agriculture: CloudSun,
  'tw-map-skills': Compass,
  'tw-location': MapPinned,
  'tw-administrative': MapPinned,
  'tw-mountains': Mountain,
  'tw-landforms': Mountain,
  'tw-coasts': Waves,
  'tw-islands-ports': MapPinned,
  'tw-climate': CloudSun,
  'tw-rivers': Waves,
  'tw-water': Waves,
}

function learningHubUrl() {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  return url.toString()
}

function GeographyNavigation() {
  return (
    <nav className="game-floating-nav geography-floating-nav" aria-label="學習系統導覽">
      <a href={learningHubUrl()}><Home aria-hidden="true" />返回任務頁</a>
      <a href={contactBookUrl}><ArrowLeft aria-hidden="true" />返回聯絡簿</a>
    </nav>
  )
}

function OrientationTip() {
  return (
    <aside className="geography-orientation-tip">
      <Smartphone aria-hidden="true" />
      <span><strong>手機或平板橫向使用，</strong>地圖會更大、更方便填圖。</span>
    </aside>
  )
}

function DiagramGraphic({ kind }) {
  if (kind === 'scale-number') return <strong className="geography-scale-number">1：50,000</strong>
  if (kind === 'scale-text') return <strong className="geography-scale-text">圖上 1 公分代表實地 500 公尺</strong>
  if (kind === 'scale-bar') {
    return (
      <div className="geography-scale-bar" aria-hidden="true">
        <span>0</span><i /><i /><b>500 公尺</b>
      </div>
    )
  }
  if (kind === 'scale-large' || kind === 'scale-small') {
    return (
      <div className={`geography-scale-map ${kind === 'scale-large' ? 'is-large-scale' : 'is-small-scale'}`} aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </div>
    )
  }

  const contourVariant = kind.replace('contour-', '')
  return (
    <svg className={`geography-contour-graphic is-${contourVariant}`} viewBox="0 0 180 112" aria-hidden="true">
      {contourVariant === 'steep' && <><path d="M30 18 C75 4 115 4 150 18" /><path d="M26 32 C72 18 118 18 154 32" /><path d="M24 46 C70 32 120 32 156 46" /><path d="M22 60 C68 46 122 46 158 60" /><path d="M20 74 C66 60 124 60 160 74" /><path d="M18 88 C64 74 126 74 162 88" /></>}
      {contourVariant === 'gentle' && <><path d="M20 12 C65 2 115 2 160 12" /><path d="M20 34 C65 24 115 24 160 34" /><path d="M20 58 C65 48 115 48 160 58" /><path d="M20 84 C65 74 115 74 160 84" /><path d="M20 106 C65 96 115 96 160 106" /></>}
      {(contourVariant === 'hill' || contourVariant === 'basin') && <><ellipse cx="90" cy="56" rx="70" ry="43" /><ellipse cx="90" cy="56" rx="48" ry="29" /><ellipse cx="90" cy="56" rx="25" ry="14" /><text x="91" y="22">{contourVariant === 'hill' ? '100' : '300'}</text><text x="91" y="43">200</text><text x="91" y="60">{contourVariant === 'hill' ? '300' : '100'}</text></>}
      {contourVariant === 'valley' && <><path d="M18 18 L90 72 L162 18" /><path d="M18 40 L90 90 L162 40" /><path d="M18 64 L90 106 L162 64" /><path className="geography-contour-water" d="M90 8 L90 94" /></>}
      {contourVariant === 'ridge' && <><path d="M18 94 L90 38 L162 94" /><path d="M18 72 L90 22 L162 72" /><path d="M18 48 L90 8 L162 48" /><path className="geography-contour-ridge-line" d="M90 15 L90 102" /></>}
    </svg>
  )
}

export function GeographyConceptDiagram({ currentItem, topicItems, effectiveMode, revealed, solved, wrongTargetId, onAnswer }) {
  const showCurrentTarget = effectiveMode === 'identify' || revealed || solved
  const isInteractive = effectiveMode !== 'identify' && !revealed && !solved
  return (
    <div className="geography-diagram-stage" role="group" aria-label="地圖判讀圖卡">
      {topicItems.map((item, index) => {
        const isTarget = item.id === currentItem?.id
        const isWrong = item.id === wrongTargetId
        return (
          <button
            type="button"
            className={`geography-diagram-card ${showCurrentTarget && isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
            key={item.id}
            disabled={!isInteractive}
            aria-label={isInteractive ? `可選擇的判讀圖卡 ${index + 1}` : undefined}
            onClick={() => onAnswer(item.id)}
          >
            <DiagramGraphic kind={item.diagramKind} />
            {(revealed || solved) && isTarget && <span>{item.name}</span>}
          </button>
        )
      })}
    </div>
  )
}

function fillTargetKey(item) {
  return item.mapKind === 'province' ? item.mapId : item.id
}

function MacauCallout({ location, isTarget, isWrong, isInteractive, showName, interactionProps = {} }) {
  if (!location) return null

  return (
    <g
      className={`geography-macau-callout ${isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
      data-map-id="macau-callout"
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : -1}
      aria-label={isInteractive ? '澳門小區域放大作答區' : '澳門小區域放大圖'}
      {...interactionProps}
    >
      <path className="geography-macau-callout-pointer" d="M 505.9 515 L 622 468 L 622 498 Z" />
      <circle className="geography-macau-callout-pin" cx="505.9" cy="515" r="3.5" />
      <rect className="geography-macau-callout-body" x="620" y="425" width="134" height="112" rx="26" />
      <text className="geography-macau-callout-caption" x="687" y="451">小區域放大圖</text>
      <path
        className="geography-macau-callout-shape"
        d={location.path}
        transform="translate(687 487) scale(30) translate(-505.75 -515.05)"
      />
      {showName && <text className="geography-macau-callout-name" x="687" y="526">澳門</text>}
      <rect className="geography-macau-callout-hit" x="618" y="423" width="138" height="116" rx="28" />
    </g>
  )
}

function FillLabelBank({ items, completed, selectedItemId, onSelect }) {
  return (
    <div className="geography-fill-label-bank" aria-label="待填入標籤">
      {items.map((item) => {
        const status = completed[item.id]
        return (
          <button
            type="button"
            className={`${selectedItemId === item.id ? 'is-selected' : ''} ${status ? 'is-completed' : ''}`}
            key={item.id}
            disabled={Boolean(status)}
            draggable={!status}
            onClick={() => onSelect(item.id)}
            onDragStart={(event) => {
              event.dataTransfer.setData('text/geography-item', item.id)
              event.dataTransfer.effectAllowed = 'move'
              onSelect(item.id)
            }}
          >
            <MapPinned aria-hidden="true" />
            <span>{status ? `${item.name}　✓` : item.name}</span>
          </button>
        )
      })}
    </div>
  )
}

export function GeographyFillBoard({ mapDefinition, mapLabel, areaId, items, onProgress, onScore, onFinish }) {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [completed, setCompleted] = useState({})
  const [mistakes, setMistakes] = useState({})
  const [wrongTargetId, setWrongTargetId] = useState('')
  const [feedback, setFeedback] = useState(null)
  const isDiagram = items.every((item) => item.mapKind === 'diagram')

  const placeLabel = (targetId, draggedItemId = '') => {
    const itemId = draggedItemId || selectedItemId
    const item = items.find((candidate) => candidate.id === itemId)
    if (!item || completed[item.id]) {
      setFeedback({ level: 'retry', message: '請先選擇一張尚未完成的標籤，再點選要放置的位置。' })
      return
    }

    const evaluation = evaluateGeographyFillPlacement(item, targetId, mistakes[item.id] || 0)
    if (evaluation.correct) {
      const nextCompleted = { ...completed, [item.id]: { revealed: false } }
      setCompleted(nextCompleted)
      setSelectedItemId('')
      setWrongTargetId('')
      setFeedback(evaluation.feedback)
      onScore(1)
      onProgress(Object.keys(nextCompleted).length)
      return
    }

    const nextFeedback = evaluation.feedback
    setMistakes({ ...mistakes, [item.id]: evaluation.mistakeCount })
    setWrongTargetId(targetId)
    setFeedback(nextFeedback)
    if (nextFeedback.revealAnswer) {
      const nextCompleted = { ...completed, [item.id]: { revealed: true } }
      setCompleted(nextCompleted)
      setSelectedItemId('')
      setWrongTargetId('')
      onProgress(Object.keys(nextCompleted).length)
    }
  }

  const completedCount = Object.keys(completed).length
  const selectedItem = items.find((item) => item.id === selectedItemId)
  const pointItems = items.filter((item) => item.mapKind === 'point')
  const lineItems = items.filter((item) => item.mapKind === 'line')
  const areaItems = items.filter((item) => item.mapKind === 'area')
  const seaItems = areaItems.filter((item) => item.areaType === 'sea')
  const waterItems = areaItems.filter((item) => item.areaType !== 'sea')
  const rangeItems = items.filter((item) => item.mapKind === 'range')
  const mapViewBoxWidth = Number(mapDefinition.viewBox.split(' ')[2])
  const macauLocation = mapDefinition.locations.find((location) => location.id === 'macau')
  const showMacauCallout = areaId === 'china' && items.some((item) => item.mapKind === 'province' && item.mapId === 'macau')
  const completedTargetIds = new Set(
    Object.keys(completed).map((itemId) => fillTargetKey(items.find((item) => item.id === itemId))),
  )

  const dropTargetProps = (targetId) => ({
    onClick: () => placeLabel(targetId),
    onKeyDown: (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        placeLabel(targetId)
      }
    },
    onDragOver: (event) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    },
    onDrop: (event) => {
      event.preventDefault()
      placeLabel(targetId, event.dataTransfer.getData('text/geography-item'))
    },
  })

  return (
    <div className="geography-fill-board">
      <div className="geography-fill-instruction" role="status">
        <strong>{selectedItem ? `已選擇：${selectedItem.name}` : '先選標籤，再點位置'}</strong>
        <span>電腦可直接拖曳；手機和平板可先點標籤，再點地圖或圖卡。</span>
      </div>

      <FillLabelBank
        items={items}
        completed={completed}
        selectedItemId={selectedItemId}
        onSelect={(itemId) => {
          setSelectedItemId(itemId)
          setWrongTargetId('')
          setFeedback(null)
        }}
      />

      {isDiagram ? (
        <div className="geography-diagram-stage is-fill-board" role="group" aria-label="判讀圖卡放置區">
          {items.map((item, index) => {
            const targetId = item.id
            const isDone = completedTargetIds.has(targetId)
            return (
              <button
                type="button"
                className={`geography-diagram-card ${isDone ? 'is-target' : ''} ${wrongTargetId === targetId ? 'is-wrong' : ''}`}
                key={item.id}
                aria-label={`標籤放置區 ${index + 1}`}
                {...dropTargetProps(targetId)}
              >
                <DiagramGraphic kind={item.diagramKind} />
                {isDone && <span>{item.name}</span>}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="geography-map-stage">
          <svg className={`geography-china-map geography-region-map is-${areaId}`} viewBox={mapDefinition.viewBox} role="img" aria-label={`${mapLabel}標籤填圖`}>
            <g className="geography-area-layer is-sea">
              {seaItems.map((item) => {
                const isDone = completedTargetIds.has(item.id)
                return (
                  <g key={item.id}>
                    <path className="geography-feature-area-visible" d={item.path} fillRule="evenodd" />
                    <path
                      className={`geography-feature-area-hit ${isDone ? 'is-target' : ''} ${wrongTargetId === item.id ? 'is-wrong' : ''}`}
                      d={item.path}
                      fillRule="evenodd"
                      role="button"
                      tabIndex={0}
                      aria-label="海域標籤放置區"
                      {...dropTargetProps(item.id)}
                    />
                  </g>
                )
              })}
            </g>
            <g className="geography-province-layer">
              {mapDefinition.locations.map((location) => {
                const isDone = completedTargetIds.has(location.id)
                return (
                  <path
                    className={`geography-province ${isDone ? 'is-target' : ''} ${wrongTargetId === location.id ? 'is-wrong' : ''}`}
                    d={location.path}
                    key={location.id}
                    role="button"
                    tabIndex={0}
                    aria-label="行政區標籤放置位置"
                    {...dropTargetProps(location.id)}
                  />
                )
              })}
            </g>
            {showMacauCallout && (
              <MacauCallout
                location={macauLocation}
                isTarget={completedTargetIds.has('macau')}
                isWrong={wrongTargetId === 'macau'}
                isInteractive
                showName={completedTargetIds.has('macau')}
                interactionProps={dropTargetProps('macau')}
              />
            )}
            <g className="geography-area-layer is-water">
              {waterItems.map((item) => {
                const isDone = completedTargetIds.has(item.id)
                return (
                  <g key={item.id}>
                    <path className="geography-feature-area-visible" d={item.path} fillRule="evenodd" />
                    <path
                      className={`geography-feature-area-hit ${isDone ? 'is-target' : ''} ${wrongTargetId === item.id ? 'is-wrong' : ''}`}
                      d={item.path}
                      fillRule="evenodd"
                      role="button"
                      tabIndex={0}
                      aria-label="湖泊或水庫標籤放置區"
                      {...dropTargetProps(item.id)}
                    />
                  </g>
                )
              })}
            </g>
            <g className="geography-line-layer">
              {lineItems.map((item) => {
                const isDone = completedTargetIds.has(item.id)
                return (
                  <g key={item.id}>
                    <path className="geography-feature-line-visible" d={item.path} />
                    <path
                      className={`geography-feature-line-hit ${isDone ? 'is-target' : ''} ${wrongTargetId === item.id ? 'is-wrong' : ''}`}
                      d={item.path}
                      role="button"
                      tabIndex={0}
                      aria-label="線狀地理標籤放置位置"
                      {...dropTargetProps(item.id)}
                    />
                  </g>
                )
              })}
            </g>
            <g className="geography-point-layer">
              {pointItems.map((item) => {
                const isDone = completedTargetIds.has(item.id)
                return (
                  <g
                    className={`geography-map-point ${isDone ? 'is-target' : ''} ${wrongTargetId === item.id ? 'is-wrong' : ''}`}
                    key={item.id}
                    transform={`translate(${item.x} ${item.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label="點狀地理標籤放置位置"
                    {...dropTargetProps(item.id)}
                  >
                    <circle className="geography-map-point-halo" r="15" />
                    <circle className="geography-map-point-dot" r="6" />
                  </g>
                )
              })}
            </g>
          </svg>
          <div className="geography-map-compass" aria-hidden="true"><Compass /></div>
          {rangeItems.length > 0 && (
            <div className="geography-relief-step-panel">
              <div className="geography-relief-step-band" aria-label="地勢分區標籤放置區">
                {rangeItems.map((item) => {
                  const isDone = completedTargetIds.has(item.id)
                  return (
                    <button
                      type="button"
                      className={`geography-map-range ${isDone ? 'is-target' : ''} ${wrongTargetId === item.id ? 'is-wrong' : ''}`}
                      key={item.id}
                      style={{
                        '--range-start': `${(item.bandStart / mapViewBoxWidth) * 100}%`,
                        '--range-width': `${((item.bandEnd - item.bandStart) / mapViewBoxWidth) * 100}%`,
                      }}
                      {...dropTargetProps(item.id)}
                    >
                      <span className="geography-map-range-line" aria-hidden="true" />
                      <span className="geography-map-range-label">{isDone ? item.name : '階梯範圍'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div className={`geography-feedback is-${feedback.level}`} role="status">
          {feedback.level === 'correct' ? <CheckCircle2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}
          <div><strong>{feedback.level === 'correct' ? '標籤放置完成' : feedback.level === 'answer' ? '答案與判斷依據' : '再試一次'}</strong><p>{feedback.message}</p></div>
        </div>
      )}

      {completedCount === items.length && (
        <button className="geography-next-button" type="button" onClick={onFinish}>查看本回合結果</button>
      )}
    </div>
  )
}

export function GeographyMap({ mapDefinition, mapLabel, areaId, currentItem, topicItems, effectiveMode, revealed, solved, wrongTargetId, onAnswer }) {
  const mapViewBoxWidth = Number(mapDefinition.viewBox.split(' ')[2])
  const targetKey = currentItem?.mapKind === 'province' ? currentItem.mapId : currentItem?.id
  const showCurrentTarget = effectiveMode === 'identify' || revealed || solved
  const pointItems = topicItems.filter((item) => item.mapKind === 'point')
  const lineItems = topicItems.filter((item) => item.mapKind === 'line')
  const areaItems = topicItems.filter((item) => item.mapKind === 'area')
  const seaItems = areaItems.filter((item) => item.areaType === 'sea')
  const waterItems = areaItems.filter((item) => item.areaType !== 'sea')
  const rangeItems = topicItems.filter((item) => item.mapKind === 'range')
  const macauLocation = mapDefinition.locations.find((location) => location.id === 'macau')
  const showMacauCallout = areaId === 'china' && topicItems.some((item) => item.mapKind === 'province' && item.mapId === 'macau')

  const answer = (id) => {
    if (effectiveMode === 'identify' || revealed || solved) return
    onAnswer(id)
  }

  return (
    <div className="geography-map-stage">
      <svg
        className={`geography-china-map geography-region-map is-${areaId}`}
        viewBox={mapDefinition.viewBox}
        role="img"
        aria-label={mapLabel}
      >
        <g className="geography-area-layer is-sea">
          {seaItems.map((item) => {
            const isTarget = item.id === targetKey
            const isWrong = wrongTargetId === item.id
            const isInteractive = currentItem?.mapKind === 'area' && effectiveMode !== 'identify' && !revealed && !solved
            return (
              <g key={item.id}>
                <path className="geography-feature-area-visible" d={item.path} fillRule="evenodd" />
                <path
                  className={`geography-feature-area-hit ${showCurrentTarget && isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
                  d={item.path}
                  fillRule="evenodd"
                  tabIndex={isInteractive ? 0 : -1}
                  role={isInteractive ? 'button' : undefined}
                  aria-label={isInteractive ? '選擇這個海域' : undefined}
                  onClick={() => answer(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      answer(item.id)
                    }
                  }}
                />
              </g>
            )
          })}
        </g>
        <g className="geography-province-layer">
          {mapDefinition.locations.map((location) => {
            const isTarget = currentItem?.mapKind === 'province' && location.id === targetKey
            const isWrong = wrongTargetId === location.id
            const isInteractive = currentItem?.mapKind === 'province' && effectiveMode !== 'identify' && !revealed && !solved
            return (
              <path
                className={`geography-province ${showCurrentTarget && isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
                d={location.path}
                data-map-id={location.id}
                key={location.id}
                tabIndex={isInteractive ? 0 : -1}
                role={isInteractive ? 'button' : undefined}
                aria-label={isInteractive ? '可選擇的行政區' : undefined}
                onClick={() => answer(location.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    answer(location.id)
                  }
                }}
              />
            )
          })}
        </g>
        {showMacauCallout && (
          <MacauCallout
            location={macauLocation}
            isTarget={showCurrentTarget && targetKey === 'macau'}
            isWrong={wrongTargetId === 'macau'}
            isInteractive={currentItem?.mapKind === 'province' && effectiveMode !== 'identify' && !revealed && !solved}
            showName={targetKey === 'macau' && (revealed || solved)}
            interactionProps={{
              onClick: () => answer('macau'),
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  answer('macau')
                }
              },
            }}
          />
        )}

        <g className="geography-area-layer is-water">
          {waterItems.map((item) => {
            const isTarget = item.id === targetKey
            const isWrong = wrongTargetId === item.id
            const isInteractive = currentItem?.mapKind === 'area' && effectiveMode !== 'identify' && !revealed && !solved
            return (
              <g key={item.id}>
                <path className="geography-feature-area-visible" d={item.path} fillRule="evenodd" />
                <path
                  className={`geography-feature-area-hit ${showCurrentTarget && isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
                  d={item.path}
                  fillRule="evenodd"
                  tabIndex={isInteractive ? 0 : -1}
                  role={isInteractive ? 'button' : undefined}
                  aria-label={isInteractive ? '選擇這個湖泊或水庫' : undefined}
                  onClick={() => answer(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      answer(item.id)
                    }
                  }}
                />
              </g>
            )
          })}
        </g>

        <g className="geography-line-layer">
          {lineItems.map((item) => {
            const isTarget = item.id === targetKey
            const isWrong = wrongTargetId === item.id
            return (
              <g key={item.id}>
                <path className="geography-feature-line-visible" d={item.path} />
                <path
                  className={`geography-feature-line-hit ${showCurrentTarget && isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
                  d={item.path}
                  tabIndex={effectiveMode !== 'identify' && !revealed && !solved ? 0 : -1}
                  role={effectiveMode !== 'identify' && !revealed && !solved ? 'button' : undefined}
                  aria-label={effectiveMode !== 'identify' && !revealed && !solved ? '可選擇的河流或分界線' : undefined}
                  onClick={() => answer(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      answer(item.id)
                    }
                  }}
                />
              </g>
            )
          })}
        </g>

        <g className="geography-point-layer">
          {pointItems.map((item) => {
            const isTarget = item.id === targetKey
            const isWrong = wrongTargetId === item.id
            return (
              <g
                className={`geography-map-point ${showCurrentTarget && isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
                key={item.id}
                transform={`translate(${item.x} ${item.y})`}
                tabIndex={effectiveMode !== 'identify' && !revealed && !solved ? 0 : -1}
                role={effectiveMode !== 'identify' && !revealed && !solved ? 'button' : undefined}
                aria-label={effectiveMode !== 'identify' && !revealed && !solved ? '可選擇的地理位置' : undefined}
                onClick={() => answer(item.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    answer(item.id)
                  }
                }}
              >
                <circle className="geography-map-point-halo" r="15" />
                <circle className="geography-map-point-dot" r="6" />
              </g>
            )
          })}
        </g>
      </svg>
      <div className="geography-map-compass" aria-hidden="true"><Compass /></div>
      {rangeItems.length > 0 && (
        <div className="geography-relief-step-panel">
          <div className="geography-relief-step-band" aria-label="地勢分區範圍">
            {rangeItems.map((item) => {
              const isTarget = item.id === targetKey
              const isWrong = wrongTargetId === item.id
              const isInteractive = effectiveMode !== 'identify' && !revealed && !solved
              const showName = isTarget && (revealed || solved)
              const rangeStart = `${(item.bandStart / mapViewBoxWidth) * 100}%`
              const rangeWidth = `${((item.bandEnd - item.bandStart) / mapViewBoxWidth) * 100}%`
              return (
                <button
                  type="button"
                  className={`geography-map-range ${showCurrentTarget && isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
                  key={item.id}
                  style={{ '--range-start': rangeStart, '--range-width': rangeWidth }}
                  disabled={!isInteractive}
                  aria-label={isInteractive ? '可選擇的階梯分布範圍' : undefined}
                  onClick={() => answer(item.id)}
                >
                  <span className="geography-map-range-line" aria-hidden="true" />
                  <span className="geography-map-range-label">
                    {showName ? item.name : '階梯範圍'}
                  </span>
                </button>
              )
            })}
          </div>
          <div className="geography-map-range-note">依北緯 36° 地形剖面線分段；雙箭頭表示階梯範圍</div>
        </div>
      )}
    </div>
  )
}

export function ChinaMap(props) {
  return <GeographyMap {...props} areaId="china" mapDefinition={chinaMap} mapLabel="中國行政區與地理填圖地圖" />
}

export default function GeographyFillMap() {
  const [areaId, setAreaId] = useState('taiwan')
  const [chapterId, setChapterId] = useState('grade7-upper-l01')
  const [topicId, setTopicId] = useState('tw-map-skills')
  const [modeId, setModeId] = useState('locate')
  const [difficultyId, setDifficultyId] = useState('basic')
  const [phase, setPhase] = useState('setup')
  const [round, setRound] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [mistakeCount, setMistakeCount] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [solved, setSolved] = useState(false)
  const [wrongTargetId, setWrongTargetId] = useState('')
  const [score, setScore] = useState(0)
  const [fillCompletedCount, setFillCompletedCount] = useState(0)

  const area = geographyAreas[areaId] || geographyAreas.taiwan
  const chapter = area.chapters.find((candidate) => candidate.id === chapterId) || area.chapters[0]
  const availableTopics = area.topics.filter((candidate) => chapter.topicIds.includes(candidate.id))
  const topic = availableTopics.find((candidate) => candidate.id === topicId) || availableTopics[0]
  const difficulty = difficulties.find((candidate) => candidate.id === difficultyId) || difficulties[1]
  const topicItems = areaId === 'taiwan'
    ? filterTaiwanItemsByDifficulty(topic.items, difficultyId)
    : topic.items
  const currentItem = round[questionIndex]
  const mixedFillStartIndex = geographyMixedFillStart(round.length)
  const effectiveMode = geographyEffectiveMode(modeId, questionIndex, round.length)
  const isFillRound = effectiveMode === 'fill' && round.length > 0
  const fillItems = modeId === 'fill' ? round : round.slice(mixedFillStartIndex)
  const choices = useMemo(
    () => buildGeographyChoices(currentItem, topicItems, difficultyId === 'intro' ? 3 : difficultyId === 'advanced' ? 5 : 4),
    [currentItem?.id, difficultyId, topic.id, topicItems],
  )

  const startRound = () => {
    setRound(buildGeographyRound(topicItems, difficulty.count))
    setQuestionIndex(0)
    setMistakeCount(0)
    setFeedback(null)
    setRevealed(false)
    setSolved(false)
    setWrongTargetId('')
    setScore(0)
    setFillCompletedCount(0)
    setPhase('playing')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetQuestionState = () => {
    setMistakeCount(0)
    setFeedback(null)
    setRevealed(false)
    setSolved(false)
    setWrongTargetId('')
  }

  const goNext = () => {
    if (questionIndex >= round.length - 1) {
      setPhase('result')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setQuestionIndex((value) => value + 1)
    resetQuestionState()
  }

  const answerTarget = (targetId) => {
    if (!currentItem || revealed || solved) return
    const correctTarget = currentItem.mapKind === 'province' ? currentItem.mapId : currentItem.id
    if (targetId === correctTarget) {
      setSolved(true)
      setWrongTargetId('')
      setScore((value) => value + 1)
      setFeedback({
        level: 'correct',
        message: mistakeCount > 0
          ? `找到了！這裡是「${currentItem.name}」。${currentItem.reason}`
          : `答對了！這裡是「${currentItem.name}」。`,
      })
      return
    }
    const nextMistakeCount = mistakeCount + 1
    const nextFeedback = geographyFeedback(currentItem, nextMistakeCount)
    setMistakeCount(nextMistakeCount)
    setFeedback(nextFeedback)
    setWrongTargetId(targetId)
    if (nextFeedback.revealAnswer) setRevealed(true)
  }

  const questionInstruction = effectiveMode === 'identify'
    ? currentItem?.mapKind === 'diagram'
      ? '觀察亮起的圖卡，選出正確的地理判讀名稱。'
      : '觀察地圖上亮起的位置，選出正確名稱。'
    : effectiveMode === 'fill'
      ? currentItem?.mapKind === 'diagram'
        ? '先看標籤，再選出符合判讀特徵的圖卡。'
        : '先看標籤，再點選它應該放置的位置。'
      : currentItem?.mapKind === 'diagram'
        ? '請選出符合題目描述的圖卡。'
        : '請在地圖上找出正確位置。'

  const chooseChapter = (nextChapterId) => {
    const nextChapter = area.chapters.find((candidate) => candidate.id === nextChapterId)
    if (!nextChapter) return
    setChapterId(nextChapter.id)
    if (!nextChapter.topicIds.includes(topicId)) setTopicId(nextChapter.topicIds[0])
  }

  const chooseArea = (nextAreaId) => {
    const nextArea = geographyAreas[nextAreaId]
    if (!nextArea) return
    setAreaId(nextAreaId)
    setChapterId(nextArea.defaultChapterId)
    setTopicId(nextArea.defaultTopicId)
    setPhase('setup')
  }

  return (
    <div className="geography-shell">
      <GeographyNavigation />
      <header className="geography-header">
        <a href="?subject=geography" className="geography-brand"><Map aria-hidden="true" /><span>地理填圖學習系統</span></a>
        <span>翰林版・七至九年級</span>
      </header>

      <main className="geography-main">
        <section className="geography-hero">
          <div>
            <p>GEOGRAPHY MAP LAB</p>
            <h1>把地理位置，真正放進腦中的地圖</h1>
            <span>臺灣與中國地理已開放，依課本章節選擇目前學到的內容再開始練習。</span>
          </div>
          <div className="geography-hero-art"><MapPinned aria-hidden="true" /></div>
        </section>

        <OrientationTip />

        {phase === 'setup' && (
          <>
            <section className="geography-panel geography-area-panel">
              <div className="geography-section-heading">
                <div><p>STEP 1</p><h2>選擇地理區域</h2></div>
                <small>依翰林版課本年級編排</small>
              </div>
              <div className="geography-area-grid">
                {areas.map((area) => (
                  <button
                    className={area.id === areaId ? 'is-active' : ''}
                    disabled={!geographyAreas[area.id]}
                    key={area.id}
                    type="button"
                    onClick={() => chooseArea(area.id)}
                  >
                    <MapPinned aria-hidden="true" />
                    <span><b>{area.name}</b><small>{area.caption}・{area.status}</small></span>
                  </button>
                ))}
              </div>
            </section>

            <section className="geography-panel">
              <div className="geography-section-heading">
                <div><p>STEP 2</p><h2>選擇目前學到的章節</h2></div>
                <small>只顯示該章節已開放的填圖內容</small>
              </div>
              <div className="geography-chapter-grid">
                {area.chapters.map((candidate, index) => (
                  <button
                    className={candidate.id === chapterId ? 'is-active' : ''}
                    key={candidate.id}
                    type="button"
                    onClick={() => chooseChapter(candidate.id)}
                  >
                    <span className="geography-chapter-number">{index + 1}</span>
                    <span><b>{candidate.name}</b><small>{candidate.description}</small></span>
                  </button>
                ))}
              </div>
            </section>

            <section className="geography-panel">
              <div className="geography-section-heading">
                <div><p>STEP 3</p><h2>選擇「{chapter.shortName}」的練習主題</h2></div>
                <small>之後可依授課進度再加入更多主題</small>
              </div>
              <div className={`geography-topic-grid topic-count-${availableTopics.length}`}>
                {availableTopics.map((candidate) => {
                  const Icon = topicIcons[candidate.id] || Target
                  return (
                    <button
                      className={candidate.id === topicId ? 'is-active' : ''}
                      key={candidate.id}
                      type="button"
                      onClick={() => setTopicId(candidate.id)}
                    >
                      <Icon aria-hidden="true" />
                      <span><b>{candidate.name}</b><small>{candidate.description}</small><em>{candidate.semester}</em></span>
                    </button>
                  )
                })}
              </div>
            </section>

            <div className="geography-setup-grid">
              <section className="geography-panel">
                <div className="geography-section-heading compact"><div><p>STEP 4</p><h2>選擇練習方式</h2></div></div>
                <div className="geography-option-list">
                  {modes.map((mode) => (
                    <button className={mode.id === modeId ? 'is-active' : ''} key={mode.id} type="button" onClick={() => setModeId(mode.id)}>
                      <span><b>{mode.name}</b><small>{mode.detail}</small></span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="geography-panel">
                <div className="geography-section-heading compact"><div><p>STEP 5</p><h2>選擇目前難度</h2></div></div>
                <div className="geography-option-list">
                  {difficulties.map((level) => (
                    <button className={level.id === difficultyId ? 'is-active' : ''} key={level.id} type="button" onClick={() => setDifficultyId(level.id)}>
                      <span><b>{level.name}</b><small>{level.detail}</small></span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <button className="geography-start-button" type="button" onClick={startRound}>
              <Play aria-hidden="true" />開始「{topic.name}」練習
            </button>
          </>
        )}

        {phase === 'playing' && currentItem && (
          <section className="geography-game-layout">
            <div className="geography-panel geography-question-panel">
              <div className="geography-progress-row">
                <span>{isFillRound ? `已完成 ${fillCompletedCount}／${fillItems.length} 個標籤` : `第 ${questionIndex + 1}／${round.length} 題`}</span>
                <div><i style={{ width: `${isFillRound ? (fillCompletedCount / fillItems.length) * 100 : ((questionIndex + 1) / round.length) * 100}%` }} /></div>
                <b>目前答對 {score} 題</b>
              </div>
              <div className="geography-question-copy">
                <p>{topic.name}・{modes.find((mode) => mode.id === effectiveMode)?.name || '混合挑戰'}</p>
                <h2>{isFillRound ? `完成 ${fillItems.length} 個標籤填圖` : effectiveMode === 'identify' ? (currentItem.mapKind === 'diagram' ? '這張圖卡表示什麼？' : '這個位置是什麼？') : `請找出「${currentItem.name}」`}</h2>
                <span>{isFillRound ? '先選標籤，再將它放到正確位置；全部完成後一次查看結果。' : questionInstruction}</span>
              </div>

              {isFillRound ? (
                <GeographyFillBoard
                  key={`${modeId}-${round.map((item) => item.id).join('-')}`}
                  mapDefinition={area.map}
                  mapLabel={area.mapLabel}
                  areaId={areaId}
                  items={fillItems}
                  onProgress={setFillCompletedCount}
                  onScore={(increment) => setScore((value) => value + increment)}
                  onFinish={() => {
                    setPhase('result')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              ) : currentItem.mapKind === 'diagram' ? (
                <GeographyConceptDiagram
                  currentItem={currentItem}
                  topicItems={topicItems}
                  effectiveMode={effectiveMode}
                  revealed={revealed}
                  solved={solved}
                  wrongTargetId={wrongTargetId}
                  onAnswer={answerTarget}
                />
              ) : (
                <GeographyMap
                  mapDefinition={area.map}
                  mapLabel={area.mapLabel}
                  areaId={areaId}
                  currentItem={currentItem}
                  topicItems={topicItems}
                  effectiveMode={effectiveMode}
                  revealed={revealed}
                  solved={solved}
                  wrongTargetId={wrongTargetId}
                  onAnswer={answerTarget}
                />
              )}

              {!isFillRound && effectiveMode === 'identify' && !revealed && !solved && (
                <div className="geography-choice-grid" aria-label="答案選項">
                  {choices.map((choice) => (
                    <button key={choice.id} type="button" onClick={() => answerTarget(choice.mapKind === 'province' ? choice.mapId : choice.id)}>
                      {choice.name}
                    </button>
                  ))}
                </div>
              )}

              {!isFillRound && feedback && (
                <div className={`geography-feedback is-${feedback.level}`} role="status">
                  {feedback.level === 'correct' ? <CheckCircle2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}
                  <div><strong>{feedback.level === 'correct' ? '完成這一題' : feedback.level === 'answer' ? '答案與判斷依據' : '再試一次'}</strong><p>{feedback.message}</p></div>
                </div>
              )}

              {!isFillRound && (solved || revealed) && (
                <button className="geography-next-button" type="button" onClick={goNext}>
                  {questionIndex >= round.length - 1 ? '查看本回合結果' : '前往下一題'}
                </button>
              )}

              <div className="geography-game-actions">
                <button type="button" onClick={() => setPhase('setup')}><ArrowLeft aria-hidden="true" />返回設定</button>
                <button type="button" onClick={startRound}><RefreshCw aria-hidden="true" />重新出題</button>
              </div>
            </div>
          </section>
        )}

        {phase === 'result' && (
          <section className="geography-panel geography-result-panel">
            <div className="geography-result-icon"><Trophy aria-hidden="true" /></div>
            <p>本回合完成</p>
            <h2>{topic.name}</h2>
            <div className="geography-result-score"><strong>{score}</strong><span>／{round.length} 題</span></div>
            <p>目前建議難度：<b>{geographyDifficultyLabel(score, round.length)}</b></p>
            <small>地理科第一版先提供自由練習，這次結果不會計入每日任務。</small>
            <div className="geography-result-actions">
              <button className="geography-start-button" type="button" onClick={startRound}><RotateCcw aria-hidden="true" />再練一回合</button>
              <button type="button" onClick={() => setPhase('setup')}><BookOpen aria-hidden="true" />選擇其他主題</button>
            </div>
          </section>
        )}

        <footer className="geography-source-note">
          <span>內容依翰林版國中地理架構與教師提供的填圖資料整理；河川、湖泊及海域已改用地理向量輪廓。</span>
          <a href={area.attributionUrl} target="_blank" rel="noreferrer">{area.name}行政區向量圖來源與授權：SVG Maps／CC BY 4.0</a>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">河川、湖泊與水庫資料：OpenStreetMap contributors／ODbL 1.0</a>
          {areaId === 'china' && <a href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/" target="_blank" rel="noreferrer">海域資料：Natural Earth 1：10m Physical Vectors／Public Domain</a>}
        </footer>
      </main>
    </div>
  )
}
