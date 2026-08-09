import { useMemo, useState } from 'react'
import { ArrowRight, BookOpen, Search, X } from 'lucide-react'
import HistoryQuestionContent, { HistoryQuestionAnswer } from './HistoryQuestionContent.jsx'
import {
  formatHistoryDate,
  formatHistoryYear,
  historyCategoryLabel,
  historyQuestionSourceLabel,
  historyRegionLabel,
  sortHistoryEvents,
} from '../lib/historyAtlas.js'

function ToolDialog({ title, eyebrow, onClose, children, className = '' }) {
  return (
    <div className="history-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <article className={`history-tool-dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby="history-tool-dialog-title">
        <button className="history-detail-close" type="button" onClick={onClose} aria-label="關閉"><X aria-hidden="true" /></button>
        <header><p>{eyebrow}</p><h2 id="history-tool-dialog-title">{title}</h2></header>
        {children}
      </article>
    </div>
  )
}

export function buildHistoryRelations(events = []) {
  const grouped = new Map()
  sortHistoryEvents(events).forEach((event) => {
    const key = event.chapterId || event.chapter?.id || 'unknown'
    const current = grouped.get(key) || []
    current.push(event)
    grouped.set(key, current)
  })

  return [...grouped.values()].flatMap((chapterEvents) => chapterEvents.slice(0, -1).map((event, index) => ({
    id: `${event.id}-${chapterEvents[index + 1].id}`,
    from: event,
    to: chapterEvents[index + 1],
    label: '前後發展',
    note: event.impactText || `「${event.title}」之後，歷史進入「${chapterEvents[index + 1].title}」所代表的下一個發展節點。`,
  })))
}

export function HistoryRelationDialog({ events, onClose, onSelectEvent }) {
  const [keyword, setKeyword] = useState('')
  const relations = useMemo(() => {
    const normalized = keyword.trim().toLocaleLowerCase('zh-Hant')
    return buildHistoryRelations(events).filter((relation) => !normalized || [
      relation.from.title,
      relation.to.title,
      relation.note,
      relation.from.chapter?.title,
    ].join(' ').toLocaleLowerCase('zh-Hant').includes(normalized))
  }, [events, keyword])

  return (
    <ToolDialog title="事件關聯與發展速查" eyebrow="學習統整" onClose={onClose}>
      <p className="history-tool-intro">依同一章的時間順序整理前後發展，協助建立時序。這些連結是學習索引，完整因果仍以事件說明與課本為準。</p>
      <label className="history-tool-search"><Search aria-hidden="true" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜尋事件、人物或制度" /></label>
      <div className="history-relation-list">
        {relations.map((relation) => (
          <article key={relation.id}>
            <div className="history-relation-flow">
              <button type="button" onClick={() => onSelectEvent(relation.from)}>{relation.from.title}</button>
              <span><ArrowRight aria-hidden="true" />{relation.label}</span>
              <button type="button" onClick={() => onSelectEvent(relation.to)}>{relation.to.title}</button>
            </div>
            <p>{relation.note}</p>
            <small>{relation.from.chapter?.title || '尚未指定章節'}</small>
          </article>
        ))}
        {relations.length === 0 && <p className="history-tool-empty">目前沒有符合搜尋條件的事件關聯。</p>}
      </div>
    </ToolDialog>
  )
}

const literacyTools = [
  {
    id: 'source',
    label: '史料判讀',
    title: '先問史料從哪裡來',
    steps: ['作者是誰？寫作或製作於什麼時代？', '內容是親身紀錄、事後回憶，還是後人整理？', '作者想說服誰？可能省略了哪些立場？', '能否找到另一份史料互相印證？'],
  },
  {
    id: 'context',
    label: '時序與因果',
    title: '把事件放回當時條件',
    steps: ['先確認事件之前已經發生什麼。', '分清楚長期背景、直接原因與導火線。', '結果不等於單一原因，留意不同力量同時作用。', '區分短期結果與長期影響。'],
  },
  {
    id: 'compare',
    label: '比較統整',
    title: '使用相同標準比較',
    steps: ['先決定比較面向，例如政治、經濟、社會與文化。', '同時寫出相同點與差異點。', '比較時使用同一時間範圍與地理尺度。', '最後說明差異形成的可能原因。'],
  },
  {
    id: 'writing',
    label: '作答模板',
    title: '主張、證據、解釋',
    steps: ['主張：直接回答題目，先寫出你的判斷。', '證據：引用題幹史料或已知史實。', '解釋：說明證據如何支持主張。', '檢查：是否回答時間、人物、原因或影響等題目要求。'],
  },
]

export function HistoryLiteracyDialog({ onClose }) {
  const [activeId, setActiveId] = useState('source')
  const active = literacyTools.find((tool) => tool.id === activeId)
  return (
    <ToolDialog title="史料判讀與歷史素養工具" eyebrow="思考方法" onClose={onClose}>
      <div className="history-tool-tabs" role="tablist">
        {literacyTools.map((tool) => <button className={activeId === tool.id ? 'is-active' : ''} type="button" onClick={() => setActiveId(tool.id)} key={tool.id}>{tool.label}</button>)}
      </div>
      <section className="history-literacy-card">
        <h3>{active.title}</h3>
        <ol>{active.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      </section>
    </ToolDialog>
  )
}

export function HistoryQuestionBankDialog({ events, onClose, onSelectEvent }) {
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState('all')
  const questions = useMemo(() => events.flatMap((event) => [
    ...(event.pastQuestions || []).map((question) => ({ ...question, type: 'past', event })),
    ...(event.practiceQuestions || []).map((question) => ({ ...question, type: 'practice', event })),
  ]).filter((question) => {
    if (type !== 'all' && question.type !== type) return false
    const normalized = keyword.trim().toLocaleLowerCase('zh-Hant')
    return !normalized || [question.prompt, question.answer, question.explanation, question.event.title, historyQuestionSourceLabel(question)]
      .join(' ').toLocaleLowerCase('zh-Hant').includes(normalized)
  }), [events, keyword, type])

  return (
    <ToolDialog title="歷屆與練習題庫" eyebrow="題目練習" onClose={onClose}>
      <div className="history-question-bank-filters">
        <label className="history-tool-search"><Search aria-hidden="true" /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜尋題目或相關事件" /></label>
        <label><span>題目類型</span><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">全部題目</option><option value="past">相關歷屆題</option><option value="practice">教師自編題</option></select></label>
      </div>
      <p className="history-question-bank-count">目前找到 {questions.length} 題；答案與解析預設收合。</p>
      <div className="history-question-bank-list">
        {questions.map((question, index) => (
          <article key={question.id || `${question.event.id}-${index}`}>
            <div><button type="button" onClick={() => onSelectEvent(question.event)}>{question.event.title}</button><span>{question.type === 'past' ? '歷屆題' : '教師自編題'}</span></div>
            <HistoryQuestionContent question={question} />
            <small className="history-question-source">來源：{question.sourceUrl ? <a href={question.sourceUrl} target="_blank" rel="noreferrer">{historyQuestionSourceLabel(question)}</a> : historyQuestionSourceLabel(question)}</small>
            <details><summary>查看答案與解析</summary><HistoryQuestionAnswer question={question} />{question.explanation && <span>{question.explanation}</span>}</details>
          </article>
        ))}
        {questions.length === 0 && <p className="history-tool-empty">目前尚無符合條件的題目；不會以其他題目假裝成歷屆考題。</p>}
      </div>
    </ToolDialog>
  )
}

function CompareEventCard({ event, onSelectEvent }) {
  if (!event) return <article className="history-compare-card"><p>目前沒有可比較的事件。</p></article>
  return (
    <article className={`history-compare-card category-${event.category}`}>
      <div><span>{historyRegionLabel(event.region)}</span><span>{historyCategoryLabel(event.category)}</span></div>
      <p>{formatHistoryDate(event)}</p>
      <h3>{event.title}</h3>
      <strong>{event.summary || '尚未填寫一句話重點。'}</strong>
      <dl>
        <div><dt>原因</dt><dd>{event.causeText || '教師審核後補充。'}</dd></div>
        <div><dt>經過</dt><dd>{event.processText || '教師審核後補充。'}</dd></div>
        <div><dt>影響</dt><dd>{event.impactText || '教師審核後補充。'}</dd></div>
      </dl>
      <button type="button" onClick={() => onSelectEvent(event)}>開啟完整事件</button>
    </article>
  )
}

export function HistoryCompareDialog({ events, onClose, onSelectEvent }) {
  const ordered = useMemo(() => sortHistoryEvents(events), [events])
  const [leftId, setLeftId] = useState(() => ordered[0]?.id || '')
  const [rightId, setRightId] = useState(() => ordered[1]?.id || ordered[0]?.id || '')
  const left = ordered.find((event) => event.id === leftId)
  const right = ordered.find((event) => event.id === rightId)
  const options = ordered.map((event) => <option value={event.id} key={event.id}>{formatHistoryDate(event)}｜{event.title}</option>)

  return (
    <ToolDialog title="事件並排比較" eyebrow="異同比較" onClose={onClose} className="history-compare-dialog">
      <p className="history-tool-intro">選擇兩個事件，使用相同欄位比較時間、地區、原因、經過與影響。</p>
      <div className="history-compare-selectors">
        <label><span>左側事件</span><select value={leftId} onChange={(event) => setLeftId(event.target.value)}>{options}</select></label>
        <label><span>右側事件</span><select value={rightId} onChange={(event) => setRightId(event.target.value)}>{options}</select></label>
      </div>
      <div className="history-compare-grid">
        <CompareEventCard event={left} onSelectEvent={onSelectEvent} />
        <CompareEventCard event={right} onSelectEvent={onSelectEvent} />
      </div>
    </ToolDialog>
  )
}

export function HistoryHelpDialog({ onClose }) {
  return (
    <ToolDialog title="這張時間軸怎麼看？" eyebrow="操作說明" onClose={onClose}>
      <ol className="history-help-list">
        <li>橫向是共同年代，縱向是不同地區；朝代與政權使用長條，事件放在下方事件列。</li>
        <li>按住空白處左右拖曳，或使用時間軸下方捲軸移動。</li>
        <li>使用「閱讀比例」拉開事件節點；切換「線性比例」可依實際年代距離比較時間長短。</li>
        <li>用縮放按鈕在總覽與細讀之間切換，也可使用快速前往跳到重要年代。</li>
        <li>點選事件查看原因、經過、影響與題目；點選政權長條查看同時期的重要事件。</li>
        <li>「事件關聯」適合整理前後發展；「素養工具」可協助史料判讀與作答。</li>
      </ol>
    </ToolDialog>
  )
}

export function HistoryPeriodDialog({ detail, events, onClose, onSelectEvent }) {
  const period = detail?.period
  if (!period) return null
  const related = sortHistoryEvents(events.filter((event) => {
    const eventEnd = Number(event.endYear || event.startYear)
    return event.region === detail.region
      && Number(event.startYear) <= period.endYear
      && eventEnd >= period.startYear
  }))
  return (
    <ToolDialog title={period.label} eyebrow={`${historyRegionLabel(detail.region)}｜${detail.trackLabel}`} onClose={onClose} className="history-period-dialog">
      <p className="history-period-dialog-date">{formatHistoryYear(period.startYear)}－{period.isOngoing ? '至今' : formatHistoryYear(period.endYear)}</p>
      <p className="history-tool-intro">這個長條表示政權或時期的延續範圍；下方列出目前資料中與它年代重疊的事件。</p>
      <div className="history-period-related-events">
        {related.map((event) => <button type="button" onClick={() => onSelectEvent(event)} key={event.id}><span>{formatHistoryDate(event)}</span><strong>{event.title}</strong></button>)}
        {related.length === 0 && <p className="history-tool-empty"><BookOpen aria-hidden="true" />目前資料尚未建立這段期間的相關事件。</p>}
      </div>
    </ToolDialog>
  )
}
