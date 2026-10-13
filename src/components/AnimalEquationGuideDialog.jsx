import { useEffect, useRef } from 'react'
import { BookOpen, CheckCircle2, ExternalLink, Play, Trophy, X } from 'lucide-react'
import { animalEquationFunctions } from '../data/animalEquationCards.js'
import './animalEquationGuideDialog.css'

export function normalizeAnimalEquationTutorialUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (url.protocol !== 'https:') return ''
    const isYouTube = host === 'youtube.com' || host.endsWith('.youtube.com')
      || host === 'youtu.be' || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com')
    if (!isYouTube) return ''
    return url.toString()
  } catch {
    return ''
  }
}

export default function AnimalEquationGuideDialog({ open, onClose, tutorialUrl = '' }) {
  const safeTutorialUrl = normalizeAnimalEquationTutorialUrl(tutorialUrl)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose, open])

  if (!open) return null

  return <div className="animal-guide-backdrop" role="presentation" onMouseDown={onClose}>
    <section ref={dialogRef} tabIndex="-1" className="animal-guide-dialog" role="dialog" aria-modal="true" aria-labelledby="animal-guide-title"
      onMouseDown={(event) => event.stopPropagation()}>
      <button className="animal-guide-close" type="button" onClick={onClose} aria-label="關閉新手說明"><X /></button>
      <header>
        <p>START HERE</p>
        <h2 id="animal-guide-title">進入遊戲前，先看懂這 4 件事</h2>
        <span>每回合只要從自己的手牌選擇一種行動，系統會協助判定與補牌。</span>
      </header>

      <div className="animal-guide-grid">
        <article className="is-radical">
          <b>1</b><div><span>綠色數字牌</span><h3>出根式牌</h3></div>
          <p>直接點自己的綠色手牌。基礎玩法可出 1 張，或出 2 張化簡後同類的方根；進階玩法出 3～6 張時，要把每張牌各用一次組成正確方程式。</p>
        </article>
        <article className="is-function">
          <b>2</b><div><span>紫色功能牌</span><h3>改變動物歸屬</h3></div>
          <p>先點紫色功能牌；「馴化」再點中央動物，「指控」與「誘惑」再點對手區塊。「澄清」與「性別錯誤」是被指定時使用的防禦牌。</p>
        </article>
        <article className="is-turn">
          <b>3</b><div><span>每回合流程</span><h3>出牌、判讀、補牌</h3></div>
          <p>開局擲 2 顆骰子決定先手。每人有 6 張牌；有人出根式牌後，其他玩家可在倒數內抓錯。回合結束後，系統會自動補回 6 張。</p>
        </article>
        <article className="is-win">
          <b>4</b><div><span>勝利條件</span><h3>動物張數或分數擇一</h3></div>
          <p>先取得 4 張動物，或先達到房主設定的 40～60 分，就能獲勝。每個人只看得到自己的手牌，但所有玩家都看得到公開出牌與得分區。</p>
        </article>
      </div>

      <details className="animal-guide-functions">
        <summary><BookOpen />查看 5 種功能牌的用途</summary>
        <div>{animalEquationFunctions.map((card) => <p key={card.code}>
          <span aria-hidden="true">{card.icon}</span><strong>{card.name}</strong><small>{card.description}</small>
        </p>)}</div>
      </details>

      <section className="animal-guide-video" aria-label="YouTube 遊戲教學">
        <div><Play aria-hidden="true" /><span><strong>YouTube 教學影片</strong><small>需要示範時，可另外開啟影片觀看，不會關閉目前遊戲。</small></span></div>
        {safeTutorialUrl
          ? <a href={safeTutorialUrl} target="_blank" rel="noreferrer">觀看教學影片<ExternalLink aria-hidden="true" /></a>
          : <span className="is-pending">教學網址提供後開放</span>}
      </section>

      <button type="button" className="animal-guide-start" onClick={onClose}>
        <CheckCircle2 aria-hidden="true" />我了解了，開始選擇玩法
      </button>
      <p className="animal-guide-reminder"><Trophy aria-hidden="true" />遊戲中可隨時按「新手說明」再次查看。</p>
    </section>
  </div>
}
