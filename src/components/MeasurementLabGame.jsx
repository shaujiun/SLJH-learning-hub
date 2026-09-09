import { ArrowLeft, FlaskConical } from 'lucide-react'
import './measurementLabGame.css'

function scienceMenuUrl() {
  const searchParams = new URLSearchParams(window.location.search)
  return searchParams.get('guest') === '1'
    ? '?subject=science&guest=1'
    : '?subject=science'
}

export default function MeasurementLabGame() {
  return (
    <div className="measurement-lab-page">
      <header className="measurement-lab-nav">
        <a href={scienceMenuUrl()} aria-label="返回自然科遊戲選擇">
          <ArrowLeft aria-hidden="true" />
          返回自然科遊戲
        </a>
        <div>
          <FlaskConical aria-hidden="true" />
          <span>
            <strong>量測實驗室</strong>
            <small>長度與體積測量</small>
          </span>
        </div>
        <span className="measurement-lab-web-badge">Web 版</span>
      </header>

      <main className="measurement-lab-frame-shell">
        <p className="measurement-lab-loading" aria-hidden="true">正在載入量測實驗室……</p>
        <iframe
          className="measurement-lab-frame"
          src="./games/measurement-lab/index.html"
          title="量測實驗室互動遊戲"
          allow="fullscreen"
          allowFullScreen
        />
      </main>
    </div>
  )
}
