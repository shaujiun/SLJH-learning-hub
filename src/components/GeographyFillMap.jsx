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
  europeMap,
  filterWorldItemsByDifficulty,
  worldGeographyChapters,
  worldGeographyTopics,
} from '../data/worldGeography.js'
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
  { id: 'world', name: '世界地理', caption: '九年級', status: '第二階段測試中' },
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
  world: {
    name: '世界地理',
    map: europeMap,
    chapters: worldGeographyChapters,
    topics: worldGeographyTopics,
    defaultChapterId: 'grade9-upper-l01',
    defaultTopicId: 'world-europe-countries',
    attributionUrl: 'https://github.com/VictorCazanave/svg-maps/tree/master/packages/world',
    mapLabel: '歐洲國家精確國界填圖地圖',
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
  'population-distribution': MapPinned,
  'autonomous-regions': MapPinned,
  'population-change': BookOpen,
  'economic-zones': MapPinned,
  'economic-regions': MapPinned,
  'belt-and-road': Map,
  rcep: Map,
  'industry-transition': BookOpen,
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
  'world-europe-countries': MapPinned,
  'world-europe-landforms': Mountain,
  'world-europe-mountains': Mountain,
  'world-europe-rivers': Waves,
  'world-europe-waters': Waves,
  'world-europe-climate': CloudSun,
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

  if (kind.startsWith('policy-') || kind.startsWith('population-')) {
    const isOneChild = kind === 'policy-one-child'
    const isMoreChildren = kind === 'policy-two-three-child'
    const isAging = kind === 'population-aging'
    return (
      <svg className={`geography-concept-graphic is-${kind}`} viewBox="0 0 220 130" aria-hidden="true">
        {(isOneChild || isMoreChildren) && (
          <>
            <circle cx="75" cy="31" r="13" /><circle cx="145" cy="31" r="13" />
            <path d="M75 47 L75 84 M55 64 L95 64 M145 47 L145 84 M125 64 L165 64" />
            <circle className="is-accent" cx="110" cy="78" r="10" />
            <path className="is-accent" d="M110 89 L110 116 M96 101 L124 101" />
            {isMoreChildren && <><circle className="is-accent" cx="67" cy="91" r="8" /><circle className="is-accent" cx="153" cy="91" r="8" /><path className="is-accent" d="M67 99 L67 119 M153 99 L153 119" /><path className="geography-concept-arrow" d="M190 104 L190 48 M178 60 L190 48 L202 60" /></>}
          </>
        )}
        {isAging && (
          <>
            <path className="geography-concept-axis" d="M35 108 H190 M110 18 V112" />
            <path className="is-soft" d="M110 102 H62 V88 H110 M110 83 H70 V69 H110 M110 64 H78 V50 H110 M110 45 H88 V31 H110 M110 26 H98 V15 H110" />
            <path className="is-accent" d="M110 102 H158 V88 H110 M110 83 H150 V69 H110 M110 64 H142 V50 H110 M110 45 H132 V31 H110 M110 26 H122 V15 H110" />
          </>
        )}
        {kind === 'population-sex-ratio' && (
          <>
            {[45, 75, 105, 135, 165].map((x) => <circle className="is-soft" cx={x} cy="42" r="12" key={`top-${x}`} />)}
            {[65, 105, 145].map((x) => <circle className="is-accent" cx={x} cy="95" r="12" key={`bottom-${x}`} />)}
            <path className="geography-concept-divider" d="M25 68 H195" />
          </>
        )}
      </svg>
    )
  }

  if (kind.startsWith('belt-road-')) {
    const showLand = kind !== 'belt-road-sea'
    const showSea = kind !== 'belt-road-land'
    const landArrowId = `${kind}-land-arrow`
    const seaArrowId = `${kind}-sea-arrow`
    return (
      <svg className={`geography-concept-graphic geography-belt-road-graphic is-${kind}`} viewBox="0 0 320 180" aria-hidden="true">
        <defs>
          <marker id={landArrowId} markerWidth="7" markerHeight="7" refX="8" refY="5" orient="auto" viewBox="0 0 10 10">
            <path className="geography-belt-arrow is-land" d="M0 0 L10 5 L0 10 Z" />
          </marker>
          <marker id={seaArrowId} markerWidth="7" markerHeight="7" refX="8" refY="5" orient="auto" viewBox="0 0 10 10">
            <path className="geography-belt-arrow is-sea" d="M0 0 L10 5 L0 10 Z" />
          </marker>
        </defs>
        <rect className="geography-belt-background" x="4" y="4" width="312" height="172" rx="18" />
        <path className="geography-belt-land-context" d="M19 51 C40 24 72 23 95 35 C118 18 155 20 178 38 C204 22 251 26 286 45 L301 72 C273 85 246 88 223 82 C198 94 168 91 143 82 C117 96 86 91 63 80 C42 86 25 76 19 51 Z" />
        <path className="geography-belt-sea-context" d="M22 114 Q43 101 64 114 T106 114 T148 114 T190 114 T232 114 T274 114 T309 114 V171 H22 Z" />

        {showLand && (
          <>
            <path className="geography-concept-route is-land" markerEnd={`url(#${landArrowId})`} d="M276 57 C231 41 198 58 160 49 C119 39 84 52 42 56" />
            <circle className="geography-belt-node is-land" cx="205" cy="52" r="6" />
            <circle className="geography-belt-node is-land" cx="126" cy="47" r="6" />
          </>
        )}
        {showSea && (
          <>
            <path className="geography-concept-route is-sea" markerEnd={`url(#${seaArrowId})`} d="M282 72 C274 105 247 121 219 126 C180 134 153 153 115 148 C77 143 57 113 38 76" />
            <circle className="geography-belt-node is-sea" cx="250" cy="111" r="6" />
            <circle className="geography-belt-node is-sea" cx="196" cy="133" r="6" />
            <circle className="geography-belt-node is-sea" cx="115" cy="148" r="6" />
          </>
        )}

        <g className="geography-belt-place is-china"><circle cx="282" cy="57" r="12" /><text x="282" y="38">中國</text></g>
        <g className="geography-belt-place"><circle cx="38" cy="61" r="10" /><text x="38" y="39">歐洲</text></g>
        {showLand && <><text className="geography-belt-label" x="205" y="36">中亞</text><text className="geography-belt-label" x="126" y="72">西亞</text></>}
        {showSea && <><text className="geography-belt-label" x="250" y="139">東南亞</text><text className="geography-belt-label" x="196" y="157">南亞</text><text className="geography-belt-label" x="115" y="171">東非</text></>}
      </svg>
    )
  }

  if (kind.startsWith('rcep-')) {
    const arrowId = `${kind}-arrow`
    return (
      <svg className={`geography-concept-graphic geography-rcep-graphic is-${kind}`} viewBox="0 0 260 150" aria-hidden="true">
        <defs>
          <marker id={arrowId} markerWidth="7" markerHeight="7" refX="8" refY="5" orient="auto" viewBox="0 0 10 10">
            <path className="geography-rcep-arrow-head" d="M0 0 L10 5 L0 10 Z" />
          </marker>
        </defs>
        <rect className="geography-rcep-background" x="4" y="4" width="252" height="142" rx="18" />
        {kind === 'rcep-members' && (
          <>
            <path className="geography-rcep-region is-northeast" d="M83 24 Q116 7 151 27 L143 65 Q112 72 80 54 Z" />
            <path className="geography-rcep-region is-southeast" d="M107 65 Q140 57 164 82 L149 119 Q118 116 92 92 Z" />
            <path className="geography-rcep-region is-oceania" d="M166 104 Q196 90 225 111 L217 136 Q185 142 161 124 Z" />
            <path className="geography-rcep-network" d="M112 43 C127 64 133 76 130 91 C149 101 170 114 190 120" />
            {[91, 111, 132, 147].map((x, index) => <circle className="geography-rcep-node" cx={x} cy={index % 2 ? 45 : 36} r="5" key={`north-${x}`} />)}
            {[108, 126, 145, 157].map((x, index) => <circle className="geography-rcep-node" cx={x} cy={80 + (index % 2) * 18} r="5" key={`south-${x}`} />)}
            <circle className="geography-rcep-node" cx="183" cy="119" r="5" />
            <circle className="geography-rcep-node" cx="207" cy="124" r="5" />
          </>
        )}
        {kind === 'rcep-tariff' && (
          <>
            <g className="geography-rcep-customs"><path d="M40 121 V54 H84 V121 M50 121 V73 H74 V121" /><path d="M34 54 H90" /></g>
            <g className="geography-rcep-customs"><path d="M178 121 V54 H222 V121 M188 121 V73 H212 V121" /><path d="M172 54 H228" /></g>
            <rect className="geography-rcep-cargo is-soft" x="103" y="77" width="54" height="36" rx="5" />
            <path className="geography-rcep-flow" markerEnd={`url(#${arrowId})`} d="M87 95 H98 M160 95 H174" />
            <path className="geography-rcep-down" markerEnd={`url(#${arrowId})`} d="M130 24 V57" />
            <text className="geography-rcep-symbol" x="130" y="34">％</text>
            <path className="geography-rcep-open-gate" d="M96 60 L111 72 M164 60 L149 72" />
          </>
        )}
        {kind === 'rcep-supply-chain' && (
          <>
            <g className="geography-rcep-stage"><circle className="is-soft" cx="42" cy="78" r="25" /><path d="M31 85 L42 60 L53 85 Z" /></g>
            <g className="geography-rcep-stage"><circle className="is-third" cx="102" cy="78" r="25" /><circle cx="102" cy="78" r="10" /><path d="M102 54 V63 M102 93 V102 M78 78 H87 M117 78 H126" /></g>
            <g className="geography-rcep-stage"><circle className="is-accent" cx="164" cy="78" r="25" /><path d="M149 91 V72 L159 78 V67 L170 76 V91 Z" /></g>
            <g className="geography-rcep-stage"><circle className="geography-rcep-market-node" cx="224" cy="78" r="25" /><path d="M212 90 V70 H236 V90 M216 70 L224 61 L232 70" /></g>
            <path className="geography-rcep-flow" markerEnd={`url(#${arrowId})`} d="M68 78 H74 M128 78 H136 M190 78 H196" />
            <path className="geography-rcep-loop" markerEnd={`url(#${arrowId})`} d="M221 111 C177 137 89 137 45 111" />
          </>
        )}
        {kind === 'rcep-market' && (
          <>
            <circle className="geography-rcep-market-core" cx="130" cy="75" r="29" />
            <path className="geography-rcep-bag" d="M114 84 V65 H146 V84 Z M121 65 C121 53 139 53 139 65" />
            {[[48, 38], [212, 38], [48, 116], [212, 116]].map(([x, y]) => <g className="geography-rcep-economy" key={`${x}-${y}`}><circle cx={x} cy={y} r="18" /><rect x={x - 8} y={y - 7} width="16" height="14" rx="3" /></g>)}
            <path className="geography-rcep-flow is-two-way" markerEnd={`url(#${arrowId})`} d="M68 48 L101 64 M192 48 L159 64 M68 107 L101 88 M192 107 L159 88" />
            <path className="geography-rcep-investment" d="M118 114 H142 M122 123 H138 M126 132 H134" />
          </>
        )}
      </svg>
    )
  }

  if (kind.startsWith('industry-')) {
    return (
      <svg className={`geography-concept-graphic is-${kind}`} viewBox="0 0 230 130" aria-hidden="true">
        {kind === 'industry-world-factory' && <><path className="is-soft" d="M25 108 V55 L67 76 V48 L110 75 V38 L155 64 V108 Z" /><path className="is-accent" d="M155 108 V31 H181 V108 Z" /><path className="geography-concept-smoke" d="M169 24 C152 13 164 2 149 0" /><rect x="45" y="86" width="25" height="18" /><rect x="88" y="86" width="25" height="18" /></>}
        {kind === 'industry-technology' && <><rect className="is-accent" x="67" y="25" width="96" height="80" rx="12" /><rect x="89" y="45" width="52" height="40" rx="5" />{[45, 65, 85, 105, 125, 145, 165, 185].map((x) => <path d={`M${x} 15 V25 M${x} 105 V115`} key={x} />)}<path d="M55 43 H67 M55 65 H67 M55 87 H67 M163 43 H175 M163 65 H175 M163 87 H175" /></>}
        {kind === 'industry-world-market' && <><circle className="is-soft" cx="70" cy="50" r="24" /><circle className="is-soft" cx="116" cy="43" r="24" /><circle className="is-soft" cx="160" cy="54" r="24" /><path className="is-accent" d="M39 108 H189 L176 72 H54 Z" /><path className="geography-concept-arrow" d="M23 38 H50 M35 26 L50 38 L35 50 M207 38 H180 M195 26 L180 38 L195 50" /></>}
        {kind === 'industry-environment' && <><path className="is-soft" d="M26 108 V65 L72 85 V53 L118 80 V108 Z" /><path className="is-accent" d="M118 108 V30 H145 V108 Z" /><path className="geography-concept-smoke" d="M132 24 C112 11 129 0 107 0 M155 31 C174 17 158 5 181 1" /><path className="geography-concept-water" d="M20 116 Q35 105 50 116 T80 116 T110 116 T140 116 T170 116 T200 116" /></>}
      </svg>
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
  const isBeltRoad = topicItems.some((item) => item.diagramKind?.startsWith('belt-road-'))
  const isRcep = topicItems.some((item) => item.diagramKind?.startsWith('rcep-'))
  return (
    <div className={`geography-diagram-stage ${isBeltRoad ? 'is-belt-road' : ''} ${isRcep ? 'is-rcep' : ''}`} role="group" aria-label="地圖判讀圖卡">
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

export function GeographyCourseConnection({ text }) {
  if (!text) return null
  return (
    <aside className="geography-course-connection">
      <BookOpen aria-hidden="true" />
      <div><strong>與本章的連結</strong><span>{text}</span></div>
    </aside>
  )
}

function EconomicZoneInset({ mapDefinition, items, getPointState, getInteractionProps }) {
  const cityItems = items.filter((item) => item.insetGroup === 'southeast-coast')
  if (cityItems.length !== 4) return null

  return (
    <aside className="geography-economic-zone-inset" aria-label="中國東南沿海經濟特區放大圖">
      <div>
        <strong>東南沿海放大圖</strong>
        <span>由上方同一張中國底圖直接放大；海南經濟特區請在主圖點選海南島。</span>
      </div>
      <svg viewBox="485 465 82 56" role="img" aria-label="福建與廣東沿海經濟特區位置放大圖">
        <g className="geography-province-layer">
          {mapDefinition.locations.map((location) => (
            <path className="geography-province" d={location.path} key={location.id} aria-hidden="true" />
          ))}
        </g>
        <g className="geography-point-layer">
          {cityItems.map((item) => {
            const { isTarget, isWrong } = getPointState(item)
            return (
              <g
                className={`geography-map-point ${isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
                key={item.id}
                transform={`translate(${item.x} ${item.y})`}
                {...getInteractionProps(item)}
              >
                <circle className="geography-map-point-hit" r="5.5" />
                <circle className="geography-map-point-halo" r="2.8" />
                <circle className="geography-map-point-dot" r="1.25" />
              </g>
            )
          })}
        </g>
      </svg>
    </aside>
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
  const isBeltRoad = items.some((item) => item.diagramKind?.startsWith('belt-road-'))

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
  const waterItems = areaItems.filter((item) => !item.areaType || item.areaType === 'water')
  const overlayItems = areaItems.filter((item) => !['sea', 'water'].includes(item.areaType))
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
        <div className={`geography-diagram-stage is-fill-board ${isBeltRoad ? 'is-belt-road' : ''}`} role="group" aria-label="判讀圖卡放置區">
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
            <g className="geography-overlay-layer">
              {overlayItems.map((item) => {
                const isDone = completedTargetIds.has(item.id)
                return (
                  <g className={`geography-area-layer is-${item.areaType}`} key={item.id}>
                    <path className="geography-feature-area-visible" d={item.path} fillRule="evenodd" />
                    <path
                      className={`geography-feature-area-hit ${isDone ? 'is-target' : ''} ${wrongTargetId === item.id ? 'is-wrong' : ''}`}
                      d={item.path}
                      fillRule="evenodd"
                      role="button"
                      tabIndex={0}
                      aria-label="地形或氣候區標籤放置區"
                      {...dropTargetProps(item.id)}
                    />
                  </g>
                )
              })}
            </g>
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
                    <path className={`geography-feature-line-visible ${item.lineType ? `is-${item.lineType}` : ''}`} d={item.path} />
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
                    <circle className="geography-map-point-hit" r={item.hitRadius || 20} />
                    <circle className="geography-map-point-halo" r={item.markerRadius || 15} />
                    <circle className="geography-map-point-dot" r={Math.min(6, (item.markerRadius || 15) * 0.45)} />
                  </g>
                )
              })}
            </g>
          </svg>
          <EconomicZoneInset
            mapDefinition={mapDefinition}
            items={pointItems}
            getPointState={(item) => ({
              isTarget: completedTargetIds.has(item.id),
              isWrong: wrongTargetId === item.id,
            })}
            getInteractionProps={(item) => ({
              role: 'button',
              tabIndex: 0,
              'aria-label': '東南沿海經濟特區標籤放置位置',
              ...dropTargetProps(item.id),
            })}
          />
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
  const waterItems = areaItems.filter((item) => !item.areaType || item.areaType === 'water')
  const overlayItems = areaItems.filter((item) => !['sea', 'water'].includes(item.areaType))
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

        <g className="geography-overlay-layer">
          {overlayItems.map((item) => {
            const isTarget = item.id === targetKey
            const isWrong = wrongTargetId === item.id
            const isInteractive = currentItem?.mapKind === 'area' && effectiveMode !== 'identify' && !revealed && !solved
            return (
              <g className={`geography-area-layer is-${item.areaType}`} key={item.id}>
                <path className="geography-feature-area-visible" d={item.path} fillRule="evenodd" />
                <path
                  className={`geography-feature-area-hit ${showCurrentTarget && isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
                  d={item.path}
                  fillRule="evenodd"
                  tabIndex={isInteractive ? 0 : -1}
                  role={isInteractive ? 'button' : undefined}
                  aria-label={isInteractive ? '選擇這個地形或氣候區' : undefined}
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
                <path className={`geography-feature-line-visible ${item.lineType ? `is-${item.lineType}` : ''}`} d={item.path} />
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
                <circle className="geography-map-point-hit" r={item.hitRadius || 20} />
                <circle className="geography-map-point-halo" r={item.markerRadius || 15} />
                <circle className="geography-map-point-dot" r={Math.min(6, (item.markerRadius || 15) * 0.45)} />
              </g>
            )
          })}
        </g>
      </svg>
      <EconomicZoneInset
        mapDefinition={mapDefinition}
        items={pointItems}
        getPointState={(item) => ({
          isTarget: showCurrentTarget && item.id === targetKey,
          isWrong: wrongTargetId === item.id,
        })}
        getInteractionProps={(item) => ({
          tabIndex: effectiveMode !== 'identify' && !revealed && !solved ? 0 : -1,
          role: effectiveMode !== 'identify' && !revealed && !solved ? 'button' : undefined,
          'aria-label': effectiveMode !== 'identify' && !revealed && !solved ? '可選擇的東南沿海經濟特區位置' : undefined,
          onClick: () => answer(item.id),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              answer(item.id)
            }
          },
        })}
      />
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

export function EuropeMap(props) {
  return <GeographyMap {...props} areaId="world" mapDefinition={europeMap} mapLabel="歐洲國家精確國界填圖地圖" />
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
    : areaId === 'world'
      ? filterWorldItemsByDifficulty(topic.items, difficultyId)
      : topic.items
  const mapDefinition = topic.map || area.map
  const mapLabel = topic.mapLabel || area.mapLabel
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
            <span>臺灣、中國與世界地理已分階段開放，依課本章節選擇目前學到的內容再開始練習。</span>
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
              <GeographyCourseConnection text={topic.courseConnection} />
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
              <GeographyCourseConnection text={topic.courseConnection} />

              {isFillRound ? (
                <GeographyFillBoard
                  key={`${modeId}-${round.map((item) => item.id).join('-')}`}
                  mapDefinition={mapDefinition}
                  mapLabel={mapLabel}
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
                  mapDefinition={mapDefinition}
                  mapLabel={mapLabel}
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
          {areaId === 'world' && <a href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/" target="_blank" rel="noreferrer">歐洲河川中心線：Natural Earth 1：10m Physical Vectors／Public Domain</a>}
        </footer>
      </main>
    </div>
  )
}
