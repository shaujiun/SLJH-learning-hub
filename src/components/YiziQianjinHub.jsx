import { useEffect, useMemo, useState } from 'react'
import { loadYiziContext } from '../services/yiziQianjinService.js'
import { YIZI_GAME_LABELS, YIZI_SOURCE } from '../lib/yiziQianjin.js'
import { ComponentPairsGame, FourSayingsGame, RemovePartGame } from './YiziSoloGames.jsx'
import YiziIdiomBoard from './YiziIdiomBoard.jsx'
import YiziQuestionEditor from './YiziQuestionEditor.jsx'
import './yiziQianjin.css'

const tabs = ['four_sayings', 'remove_part', 'component_pairs', 'idiom_board']

function Rules({ gameType }) {
  const rules = {
    four_sayings: ['從四句成語各選一字，再重組成第五句成語。', '單人練習可用點選、鍵盤或手寫；同一難度題目全部輪完前不重複。', '多人競賽由房主固定 5 題或 10 題、作答方式及每題 40 秒或 60 秒；所有玩家同時回答相同題目。', '一般房最多 8 人、全班房最多 36 人，可選積分賽、錯 1 題淘汰或錯 2 題淘汰。'],
    remove_part: ['觀察四個文字部件，心中去除一個。', '把保留的三個部件旋轉、重新組合成一個國字。', '單人可手寫或輸入；多人競賽全員回答相同題目，答對一題得 1 分。'],
    component_pairs: ['觀察 16 個部件，任取兩個組成國字。', '部件可以重複搭配，但同一個答案不能重複計分。', '多人可選同步積分制，或共用答案清單的輪流答題制；輪流時答錯或逾時只退出目前這一題。'],
    idiom_board: ['在 12 × 8 棋盤輪流放入四字成語。', '新成語必須和盤面既有文字交會，不可覆蓋不同文字。', '支援橫、直、斜與反向排列；可和 AI 或輸入房間代碼雙人對戰。'],
  }
  return <details className="yizi-rules"><summary>玩法說明</summary><ol>{rules[gameType].map((rule) => <li key={rule}>{rule}</li>)}</ol></details>
}

export default function YiziQianjinHub({ guestMode = false }) {
  const [context, setContext] = useState(null)
  const [active, setActive] = useState('four_sayings')
  const [showEditor, setShowEditor] = useState(false)
  const [message, setMessage] = useState('')
  const load = async () => {
    try { setContext(await loadYiziContext({ guestMode })); setMessage('') }
    catch (error) { setMessage(error.message) }
  }
  useEffect(() => { load() }, [guestMode])
  const questions = useMemo(() => context?.questions || [], [context])
  const byType = (type) => questions.filter((question) => question.gameType === type && (context?.canManage || question.status === 'published'))
  if (!context) return <main className="yizi-page"><div className="yizi-loading">正在準備文字挑戰…</div></main>
  return <main className="yizi-page">
    <header className="yizi-hero"><a href={guestMode ? '?guest=1' : './'}>返回學習系統</a><div><p className="eyebrow">CHINESE CHARACTER CHALLENGE</p>
      <h1>一字千金文字挑戰</h1><p>從文字部件、成語取字到棋盤接龍，練習觀察、重組與詞彙運用。</p></div>
      {context.canManage ? <button type="button" onClick={() => setShowEditor((value) => !value)}>{showEditor ? '返回試玩' : '題庫工作區'}</button> : <span />}</header>
    <section className="yizi-notice"><strong>{guestMode ? '訪客練習' : context.studentId ? '登入學生' : context.canManage ? '管理者試玩' : '一般練習'}</strong>
      <span>{context.studentId
        ? '作答紀錄會隨帳號跨裝置保存。'
        : guestMode
          ? '可以玩單人與房間對戰，但不保存長期戰績。'
          : context.canManage
            ? '管理者試玩不會寫入學生戰績。'
            : '未登入時可以練習，但不保存長期戰績。'}</span></section>
    {message && <p className="yizi-feedback is-error">{message}</p>}
    {showEditor && context.canManage ? <YiziQuestionEditor questions={questions} remoteEnabled={context.remoteEnabled} onSaved={load} /> : <>
      <nav className="yizi-game-tabs" aria-label="選擇文字遊戲">{tabs.map((type) => <button type="button" key={type}
        className={active === type ? 'is-active' : ''} onClick={() => setActive(type)}><strong>{YIZI_GAME_LABELS[type]}</strong>
        <span>{type === 'four_sayings' ? '成語取字' : type === 'remove_part' ? '部件重組' : type === 'component_pairs' ? '部件配字' : '成語棋盤'}</span></button>)}</nav>
      <Rules gameType={active} />
      {active === 'four_sayings' && <FourSayingsGame questions={byType('four_sayings')} context={context} />}
      {active === 'remove_part' && <RemovePartGame questions={byType('remove_part')} context={context} />}
      {active === 'component_pairs' && <ComponentPairsGame questions={byType('component_pairs')} context={context} />}
      {active === 'idiom_board' && <YiziIdiomBoard context={context} />}
    </>}
    <footer className="yizi-source"><p>題型與初始題庫參考「一字千金練習」網站，經授權作為學習系統練習使用；本系統為教學用途，非公共電視官方產品。</p>
      <p>資料版本：<code>{YIZI_SOURCE?.commit?.slice(0, 8) || '教師自建'}</code>。未來新增玩法已列入開發路線圖。</p></footer>
  </main>
}
