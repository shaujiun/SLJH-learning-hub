import { lazy, Suspense, useState } from 'react'
import { ArrowLeft, BookOpen, Play, Users } from 'lucide-react'
import AnimalEquationDemo from './AnimalEquationDemo.jsx'
import AnimalEquationPractice from './AnimalEquationPractice.jsx'
import './animalEquationExperience.css'

const AnimalEquationGame = lazy(() => import('./AnimalEquationGame.jsx'))

const preferenceKey = 'animal-equation-played-before'

export default function AnimalEquationExperience() {
  const [mode, setMode] = useState('choose')
  const [playedBefore, setPlayedBefore] = useState(() => {
    try { return typeof window !== 'undefined' && window.localStorage.getItem(preferenceKey) === '1' }
    catch { return false }
  })

  function startPractice() {
    try { window.localStorage.setItem(preferenceKey, '1') } catch { /* Private browsing may disable storage. */ }
    setPlayedBefore(true)
    setMode('practice')
  }

  if (mode === 'tutorial') return <AnimalEquationDemo onBack={() => setMode('choose')} onStartGame={startPractice} />
  if (mode === 'practice') return <AnimalEquationPractice onBack={() => setMode('choose')} />
  if (mode === 'live') return <Suspense fallback={<div className="animal-experience-shell"><main>正在開啟真人牌桌…</main></div>}><AnimalEquationGame onBack={() => setMode('choose')} /></Suspense>

  return <div className="animal-experience-shell">
    <header><a href="?guest=1&subject=math"><ArrowLeft aria-hidden="true" />返回數學練習</a><strong>根式馬戲團</strong></header>
    <main>
      <p className="animal-experience-eyebrow">教學試玩、自由練習、4 人真人對戰</p>
      <h1>{playedBefore ? '這次想怎麼玩？' : '第一次玩？先選擇方式'}</h1>
      <p>每位玩家只能看自己的手牌；出牌後，所有人都能看到打出的牌。試玩會重新洗牌、讓 AI 輪流行動，並顯示補牌。</p>
      <div className="animal-experience-options">
        <button type="button" onClick={() => setMode('tutorial')}>
          <BookOpen aria-hidden="true" /><strong>教學試玩</strong><span>用 2 步熟悉同類方根、抓錯與馴化。可隨時回來複習。</span><b>開始教學</b>
        </button>
        <button type="button" onClick={startPractice}>
          <Play aria-hidden="true" /><strong>直接自由試玩</strong><span>4 個座位、隨機手牌與動物、AI 回合、公開出牌紀錄。</span><b>開始對局</b>
        </button>
        <button type="button" onClick={() => setMode('live')}>
          <Users aria-hidden="true" /><strong>4 人真人對戰</strong><span>同學可從不同裝置加入同一房間；每局由房主選模式及通關分數。</span><b>進入房間</b>
        </button>
      </div>
      <small>教學與自由試玩為本機模擬，不寫入每日任務；真人對戰需使用學習系統帳號登入。</small>
    </main>
  </div>
}
