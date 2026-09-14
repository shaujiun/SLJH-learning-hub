import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bot, RotateCcw, Swords } from 'lucide-react'
import { functionCardTargets } from '../lib/animalEquationFunctions.js'
import {
  createAnimalEquationPractice,
  passPracticeTurn,
  practicePublicView,
  resolvePracticeReview,
  respondPracticeFunction,
  submitPracticeFunction,
  submitPracticeRadical,
  takeAiPracticeTurn,
} from '../lib/animalEquationPractice.js'
import './animalEquationPractice.css'

const publicName = (view, playerId) => view.players.find((player) => player.id === playerId)?.displayName || '玩家'

function OpponentSeat({ player, active }) {
  return <section className={`animal-practice-seat is-${player.position} ${active ? 'is-active' : ''}`}
    aria-label={`${player.displayName}，${player.handCount} 張未公開手牌`}>
    <div className="animal-practice-seat-heading"><Bot aria-label="AI" /><strong>{player.seatLabel} · {player.displayName}</strong><span>{player.animalScore} 分 · {player.animalCount} 張動物</span></div>
    <div className="animal-practice-card-backs" aria-hidden="true">
      {Array.from({ length: player.handCount }, (_, index) => <span key={index}>∑</span>)}
    </div>
    <small>{player.handCount} 張私人手牌 · 判讀星 {player.judgementStars}</small>
  </section>
}

export default function AnimalEquationPractice({ onBack }) {
  const [game, setGame] = useState(createAnimalEquationPractice)
  const [playKind, setPlayKind] = useState('radical')
  const [selectedCards, setSelectedCards] = useState([])
  const [variableValues, setVariableValues] = useState({})
  const [functionCardId, setFunctionCardId] = useState('')
  const [targetAnimalId, setTargetAnimalId] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(8)
  const view = useMemo(() => practicePublicView(game, 'you'), [game])
  const me = view.players.find((player) => player.id === 'you')
  const myTurn = game.status === 'playing' && game.currentPlayerId === 'you'
  const playableFunctions = view.hand.filter((card) => ['tame', 'accuse', 'tempt'].includes(card.code))
  const selectedFunction = playableFunctions.find((card) => card.id === functionCardId)
  const targets = functionCardTargets(game.animals, selectedFunction?.code, 'you')
  const defenseCode = game.pendingFunction?.functionCode === 'accuse' ? 'clarify' : 'gender_error'
  const defenseCards = view.hand.filter((card) => card.code === defenseCode)

  useEffect(() => {
    if (game.status !== 'playing' || game.currentPlayerId === 'you') return undefined
    const timer = window.setTimeout(() => setGame((current) => takeAiPracticeTurn(current)), 950)
    return () => window.clearTimeout(timer)
  }, [game.status, game.currentPlayerId, game.turnNumber])

  useEffect(() => {
    if (game.status !== 'review' && game.status !== 'reaction') return undefined
    setSecondsLeft(8)
    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((8000 - (Date.now() - startedAt)) / 1000)))
    }, 250)
    const timer = window.setTimeout(() => setGame((current) => {
      if (current.status === 'review') {
        const aiChallenger = current.pendingPlay.playerId === 'you' && !current.pendingPlay.isValid
          && Math.random() < 0.7 ? 'ai-fox' : null
        return resolvePracticeReview(current, aiChallenger)
      }
      if (current.status === 'reaction' && current.pendingFunction?.targetPlayerId === 'you') {
        return respondPracticeFunction(current)
      }
      return current
    }), 8000)
    return () => { window.clearInterval(interval); window.clearTimeout(timer) }
  }, [game.status, game.pendingPlay?.id, game.pendingFunction?.id])

  useEffect(() => {
    setSelectedCards([])
    setVariableValues({})
    setFunctionCardId('')
    setTargetAnimalId('')
  }, [game.turnNumber])

  function toggleCard(cardId) {
    setSelectedCards((current) => current.includes(cardId)
      ? current.filter((id) => id !== cardId)
      : current.length < 2 ? [...current, cardId] : [current[1], cardId])
  }

  function playRadical() {
    setGame((current) => submitPracticeRadical(current, selectedCards, variableValues))
  }

  function playFunction() {
    setGame((current) => submitPracticeFunction(current, functionCardId, targetAnimalId))
  }

  const latestPlay = view.publicPlays.at(-1)
  return <div className="animal-practice-shell">
    <header className="animal-practice-header">
      <button type="button" onClick={onBack}><ArrowLeft aria-hidden="true" />選擇模式</button>
      <div><strong>根式馬戲團</strong><span>自由試玩 · 1 人對 3 位 AI</span></div>
    </header>
    <main className="animal-practice-main">
      <div className="animal-practice-status" role="status" aria-live="polite">
        <strong>{game.status === 'finished' ? `${publicName(view, game.winnerPlayerId)}獲勝` : `第 ${view.turnNumber} 回合 · ${publicName(view, game.currentPlayerId) || '結算中'}`}</strong>
        <span>{view.message}</span>
      </div>
      <p className="animal-practice-mode-note">這是本機試玩：AI 會輪流出牌，手牌與動物每局重新洗牌；目前支援單張、兩張同類方根及功能牌，不含多張牌排等式、真人連線或雲端紀錄。</p>

      <div className="animal-practice-layout">
        {view.players.filter((player) => player.id !== 'you').map((player) => <OpponentSeat key={player.id}
          player={player} active={view.currentPlayerId === player.id} />)}

        <section className="animal-practice-center" aria-label="公開桌面">
          <div className="animal-practice-board-heading"><strong>中央動物</strong><span>牌庫 {view.deckCount} 張</span></div>
          <div className="animal-practice-animals">
            {view.animals.map((animal) => <div key={animal.id} className={animal.revealed ? 'is-revealed' : ''}>
              {animal.revealed ? <><span aria-hidden="true">{animal.icon}</span><strong>{animal.name}</strong><small>{animal.score} 分 · {publicName(view, animal.ownerPlayerId)}</small></>
                : <><span>∑</span><strong>第 {animal.position} 張</strong><small>尚未翻開</small></>}
            </div>)}
          </div>
          <div className="animal-practice-public-play" aria-live="polite">
            <div><Swords aria-hidden="true" /><strong>本回合公開出牌</strong></div>
            <p>{latestPlay ? `${publicName(view, latestPlay.playerId)}：${latestPlay.text}` : '尚未有人出牌'}</p>
            {latestPlay && <small>{latestPlay.result}{latestPlay.defenseLabel ? ` · ${latestPlay.defenseLabel}` : ''}</small>}
          </div>
          <details className="animal-practice-history">
            <summary>查看所有玩家的出牌紀錄（{view.publicPlays.length} 筆）</summary>
            <ol>{view.publicPlays.map((play) => <li key={play.id}>
              <strong>第 {play.turnNumber} 回合 · {publicName(view, play.playerId)}</strong>
              <span>{play.text} · {play.result}</span>
            </li>)}</ol>
          </details>
        </section>

        <section className={`animal-practice-self ${myTurn ? 'is-active' : ''}`} aria-label="你在下方的私人手牌與操作區">
          <div className="animal-practice-self-heading">
            <div><span>你的座位 · 下方</span><strong>{me.seatLabel} · 你</strong><small>{me.animalCount} 張動物 · {me.animalScore} 分 · 判讀星 {me.judgementStars}</small></div>
            <b>手牌 {view.hand.length}／6</b>
          </div>
          <div className="animal-practice-hand" aria-label="只有你看得到的手牌">
            {view.hand.map((card) => <div key={card.id} className={[card.type === 'function' ? 'is-function' : '', view.newDrawnCardIds.includes(card.id) ? 'is-new' : ''].filter(Boolean).join(' ')}>
              <strong>{card.label}</strong><small>{view.newDrawnCardIds.includes(card.id) ? '新補牌' : card.type === 'function' ? '功能牌' : '根式牌'}</small>
            </div>)}
          </div>
          <small className="animal-practice-private-note">別人只看到你有幾張牌；即使你在手牌區查看牌面，也不會公開。只有送出後，牌面才會出現在中央與紀錄。</small>

          {myTurn && <div className="animal-practice-controls">
            <div className="animal-practice-tabs" role="group" aria-label="本回合動作">
              <button type="button" className={playKind === 'radical' ? 'is-selected' : ''} onClick={() => setPlayKind('radical')}>出根式牌</button>
              <button type="button" className={playKind === 'function' ? 'is-selected' : ''} onClick={() => setPlayKind('function')}>使用功能牌</button>
            </div>
            {playKind === 'radical' ? <>
              <p>可出 1 張任意根式，或 2 張化簡後同類的根式。故意出錯可能被 AI 抓到。</p>
              <div className="animal-practice-choices">
                {view.hand.filter((card) => card.type === 'radical').map((card) => <button key={card.id} type="button"
                  aria-pressed={selectedCards.includes(card.id)} className={selectedCards.includes(card.id) ? 'is-selected' : ''}
                  onClick={() => toggleCard(card.id)}>{card.label}</button>)}
              </div>
              {view.hand.filter((card) => selectedCards.includes(card.id) && card.variableCode === 'n').map((card) =>
                <label className="animal-practice-variable" key={card.id}>{card.label} 的 n 值
                  <input inputMode="numeric" value={variableValues[card.id] || ''} placeholder="正整數"
                    onChange={(event) => setVariableValues((current) => ({ ...current, [card.id]: event.target.value.replace(/\D/g, '') }))} />
                </label>)}
              <button className="animal-practice-primary" type="button" disabled={!selectedCards.length} onClick={playRadical}>送出所選根式牌</button>
            </> : <>
              <p>「馴化」可翻開中央動物；「指控」與「誘惑」可指定對手已取得的動物。防禦牌留待被指定時使用。</p>
              <div className="animal-practice-choices">
                {playableFunctions.map((card) => <button key={card.id} type="button" aria-pressed={functionCardId === card.id}
                  className={functionCardId === card.id ? 'is-selected' : ''} onClick={() => { setFunctionCardId(card.id); setTargetAnimalId('') }}>{card.label}</button>)}
                {!playableFunctions.length && <span>目前沒有可主動使用的功能牌。</span>}
              </div>
              {selectedFunction && <div className="animal-practice-targets" aria-label="可指定的動物">
                {targets.map((animal) => <button key={animal.id} type="button" aria-pressed={targetAnimalId === animal.id}
                  className={targetAnimalId === animal.id ? 'is-selected' : ''} onClick={() => setTargetAnimalId(animal.id)}>
                  {animal.revealed ? animal.name : `第 ${animal.position} 張蓋住的動物`}
                </button>)}
                {!targets.length && <span>目前沒有這張牌可以指定的動物。</span>}
              </div>}
              <button className="animal-practice-primary" type="button" disabled={!functionCardId || !targetAnimalId} onClick={playFunction}>打出功能牌</button>
            </>}
            <button className="animal-practice-pass" type="button" onClick={() => setGame((current) => passPracticeTurn(current))}>略過本回合</button>
          </div>}

          {game.status === 'review' && <div className="animal-practice-review">
            <strong>抓錯倒數：{secondsLeft} 秒</strong>
            {game.pendingPlay?.playerId !== 'you' ? <button className="animal-practice-primary" type="button"
              onClick={() => setGame((current) => resolvePracticeReview(current, 'you'))}>我要抓錯</button>
              : <span>其他玩家正在判讀你打出的牌。</span>}
          </div>}
          {game.status === 'reaction' && game.pendingFunction?.targetPlayerId === 'you' && <div className="animal-practice-review">
            <strong>防禦倒數：{secondsLeft} 秒</strong>
            {defenseCards.map((card) => <button className="animal-practice-primary" type="button" key={card.id}
              onClick={() => setGame((current) => respondPracticeFunction(current, card.id))}>使用「{card.label}」</button>)}
            <button className="animal-practice-pass" type="button" onClick={() => setGame((current) => respondPracticeFunction(current))}>不防禦</button>
          </div>}
          {game.status === 'finished' && <button className="animal-practice-primary" type="button" onClick={() => setGame(createAnimalEquationPractice())}>
            <RotateCcw aria-hidden="true" />重新洗牌再玩
          </button>}
        </section>
      </div>
    </main>
  </div>
}
