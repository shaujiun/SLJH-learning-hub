import { ArrowLeft, Brain, ChevronRight, Grid3X3, Orbit, Shapes } from 'lucide-react'
import './schulteGame.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

function learningHubUrl() {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  return url.toString()
}

export default function FocusTrainingHub() {
  return (
    <div className="focus-training-shell">
      <header className="focus-training-header">
        <a href={learningHubUrl()} className="focus-training-brand">
          <span><Brain aria-hidden="true" /></span>
          <div><small>FOCUS TRAINING</small><strong>專注力訓練</strong></div>
        </a>
        <nav aria-label="專注力訓練導覽">
          <a href={learningHubUrl()}><ArrowLeft aria-hidden="true" />返回任務頁</a>
          <a href={contactBookUrl}>返回聯絡簿</a>
        </nav>
      </header>

      <main className="focus-training-content">
        <section className="focus-training-hero">
          <div>
            <p>舒爾特學習法</p>
            <h1>一次尋找一個目標，慢慢把注意力找回來</h1>
            <span>遊戲中不顯示計時，也沒有倒數壓力。完成後才會看到自己的練習紀錄。</span>
          </div>
          <Brain aria-hidden="true" />
        </section>

        <section className="focus-mode-section" aria-labelledby="focus-mode-title">
          <div className="focus-section-heading">
            <div><small>CHOOSE A MODE</small><h2 id="focus-mode-title">選擇訓練方式</h2></div>
            <span>第一階段</span>
          </div>
          <div className="focus-mode-grid">
            <article className="focus-mode-card is-ready">
              <div className="focus-mode-icon"><Grid3X3 aria-hidden="true" /></div>
              <div><span>目前開放</span><h3>靜態舒爾特</h3><p>在固定矩陣中，依序找出由小到大的數字。</p></div>
              <a href="./?game=schulte-static">開始練習<ChevronRight aria-hidden="true" /></a>
            </article>
            <article className="focus-mode-card is-future">
              <div className="focus-mode-icon"><Orbit aria-hidden="true" /></div>
              <div><span>下一階段</span><h3>動態舒爾特</h3><p>三個同心圓環低速旋轉，練習動態視覺搜尋。</p></div>
              <b>尚未開放</b>
            </article>
            <article className="focus-mode-card is-future">
              <div className="focus-mode-icon"><Shapes aria-hidden="true" /></div>
              <div><span>後續階段</span><h3>圖形與語句變化型</h3><p>辨識相同圖形，或依語音、句義重組詩句與名言。</p></div>
              <b>尚未開放</b>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
