import { useMemo, useState } from 'react'
import chinaMap from '@svg-maps/china'
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
  buildGeographyChoices,
  buildGeographyRound,
  geographyDifficultyLabel,
  geographyFeedback,
} from '../lib/geographyGame.js'
import './geographyFillMap.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

const mapAttributionUrl = 'https://github.com/VictorCazanave/svg-maps/tree/master/packages/china'

const areas = [
  { id: 'taiwan', name: '臺灣地理', caption: '七年級', status: '下一階段' },
  { id: 'china', name: '中國地理', caption: '八年級', status: '已開放' },
  { id: 'world', name: '世界地理', caption: '九年級', status: '後續建立' },
]

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
  climate: CloudSun,
  agriculture: CloudSun,
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

export function ChinaMap({ currentItem, topicItems, effectiveMode, revealed, solved, wrongTargetId, onAnswer }) {
  const targetKey = currentItem?.mapKind === 'province' ? currentItem.mapId : currentItem?.id
  const showCurrentTarget = effectiveMode === 'identify' || revealed || solved
  const pointItems = topicItems.filter((item) => item.mapKind === 'point')
  const lineItems = topicItems.filter((item) => item.mapKind === 'line')
  const rangeItems = topicItems.filter((item) => item.mapKind === 'range')

  const answer = (id) => {
    if (effectiveMode === 'identify' || revealed || solved) return
    onAnswer(id)
  }

  return (
    <div className="geography-map-stage">
      <svg
        className="geography-china-map"
        viewBox={chinaMap.viewBox}
        role="img"
        aria-label="中國行政區與地理填圖地圖"
      >
        <g className="geography-province-layer">
          {chinaMap.locations.map((location) => {
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
          <div className="geography-relief-step-band" aria-label="中國地勢三級階梯範圍">
            {rangeItems.map((item) => {
              const isTarget = item.id === targetKey
              const isWrong = wrongTargetId === item.id
              const isInteractive = effectiveMode !== 'identify' && !revealed && !solved
              const showName = isTarget && (revealed || solved)
              return (
                <button
                  type="button"
                  className={`geography-map-range ${showCurrentTarget && isTarget ? 'is-target' : ''} ${isWrong ? 'is-wrong' : ''}`}
                  key={item.id}
                  style={{ '--range-weight': item.bandWeight }}
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
          <div className="geography-map-range-note">雙箭頭表示階梯分布範圍</div>
        </div>
      )}
    </div>
  )
}

export default function GeographyFillMap() {
  const [chapterId, setChapterId] = useState('grade8-upper-l01')
  const [topicId, setTopicId] = useState('relief-steps')
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

  const chapter = chinaGeographyChapters.find((candidate) => candidate.id === chapterId) || chinaGeographyChapters[0]
  const availableTopics = chinaGeographyTopics.filter((candidate) => chapter.topicIds.includes(candidate.id))
  const topic = availableTopics.find((candidate) => candidate.id === topicId) || availableTopics[0]
  const difficulty = difficulties.find((candidate) => candidate.id === difficultyId) || difficulties[1]
  const currentItem = round[questionIndex]
  const effectiveMode = modeId === 'mixed'
    ? (questionIndex % 2 === 0 ? 'locate' : 'identify')
    : modeId
  const choices = useMemo(
    () => buildGeographyChoices(currentItem, topic.items, difficultyId === 'intro' ? 3 : difficultyId === 'advanced' ? 5 : 4),
    [currentItem?.id, difficultyId, topic.id],
  )

  const startRound = () => {
    setRound(buildGeographyRound(topic.items, difficulty.count))
    setQuestionIndex(0)
    setMistakeCount(0)
    setFeedback(null)
    setRevealed(false)
    setSolved(false)
    setWrongTargetId('')
    setScore(0)
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
    ? '觀察地圖上亮起的位置，選出正確名稱。'
    : effectiveMode === 'fill'
      ? '先看標籤，再點選它應該放置的位置。'
      : '請在地圖上找出正確位置。'

  const chooseChapter = (nextChapterId) => {
    const nextChapter = chinaGeographyChapters.find((candidate) => candidate.id === nextChapterId)
    if (!nextChapter) return
    setChapterId(nextChapter.id)
    if (!nextChapter.topicIds.includes(topicId)) setTopicId(nextChapter.topicIds[0])
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
            <span>第一階段開放中國地理；臺灣與世界地理會依課本順序陸續加入。</span>
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
                    className={area.id === 'china' ? 'is-active' : ''}
                    disabled={area.id !== 'china'}
                    key={area.id}
                    type="button"
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
                {chinaGeographyChapters.map((candidate, index) => (
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
                <span>第 {questionIndex + 1}／{round.length} 題</span>
                <div><i style={{ width: `${((questionIndex + 1) / round.length) * 100}%` }} /></div>
                <b>目前答對 {score} 題</b>
              </div>
              <div className="geography-question-copy">
                <p>{topic.name}・{modes.find((mode) => mode.id === effectiveMode)?.name || '混合挑戰'}</p>
                <h2>{effectiveMode === 'identify' ? '這個位置是什麼？' : `請找出「${currentItem.name}」`}</h2>
                <span>{questionInstruction}</span>
              </div>

              {effectiveMode === 'fill' && (
                <div className="geography-drag-label" aria-label={`待放置標籤：${currentItem.name}`}>
                  <MapPinned aria-hidden="true" /><strong>{currentItem.name}</strong>
                </div>
              )}

              <ChinaMap
                currentItem={currentItem}
                topicItems={topic.items}
                effectiveMode={effectiveMode}
                revealed={revealed}
                solved={solved}
                wrongTargetId={wrongTargetId}
                onAnswer={answerTarget}
              />

              {effectiveMode === 'identify' && !revealed && !solved && (
                <div className="geography-choice-grid" aria-label="答案選項">
                  {choices.map((choice) => (
                    <button key={choice.id} type="button" onClick={() => answerTarget(choice.mapKind === 'province' ? choice.mapId : choice.id)}>
                      {choice.name}
                    </button>
                  ))}
                </div>
              )}

              {feedback && (
                <div className={`geography-feedback is-${feedback.level}`} role="status">
                  {feedback.level === 'correct' ? <CheckCircle2 aria-hidden="true" /> : <Lightbulb aria-hidden="true" />}
                  <div><strong>{feedback.level === 'correct' ? '完成這一題' : feedback.level === 'answer' ? '答案與判斷依據' : '再試一次'}</strong><p>{feedback.message}</p></div>
                </div>
              )}

              {(solved || revealed) && (
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
          <span>內容依翰林版國中地理架構與教師提供的填圖資料整理；地圖輪廓採互動式向量重繪。</span>
          <a href={mapAttributionUrl} target="_blank" rel="noreferrer">行政區向量圖來源與授權：SVG Maps／CC BY 4.0</a>
        </footer>
      </main>
    </div>
  )
}
