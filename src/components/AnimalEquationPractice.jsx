import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bot, RotateCcw, Swords } from 'lucide-react'
import AnimalEquationFunctionIcon from './AnimalEquationFunctionIcon.jsx'
import AnimalEquationRadicalText from './AnimalEquationRadicalText.jsx'
import { functionCardTargets } from '../lib/animalEquationFunctions.js'
import {
  createAnimalEquationPractice,
  passPracticeTurn,
  practicePublicView,
  practiceTargetForPlayer,
  resolvePracticeReview,
  respondPracticeFunction,
  submitPracticeFunction,
  submitPracticeRadical,
  takeAiPracticeTurn,
} from '../lib/animalEquationPractice.js'
import './animalEquationPractice.css'

const publicName = (view, playerId) => view.players.find((player) => player.id === playerId)?.displayName || '玩家'
const tentArtSrc = `${import.meta.env.BASE_URL}animal-equation-tent.png`
const animalArtSrc = `${import.meta.env.BASE_URL}animal-equation-animals.png`

const animalArtOrder = ['deer', 'octopus', 'sloth', 'beluga', 'ostrich', 'poodle', 'tabby', 'dolphin',
  'beaver', 'wallaby', 'pig', 'goldfish', 'chihuahua', 'fox', 'maltese', 'corgi']
const animalArtPosition = (code) => {
  const index = animalArtOrder.indexOf(code)
  return `${index % 4 * 100 / 3}% ${Math.floor(index / 4) * 100 / 3}%`
}

function OpponentSeat({ player, active, targetAnimal, onTarget }) {
  return <button type="button" className={`animal-practice-seat is-${player.position} ${active ? 'is-active' : ''} ${targetAnimal ? 'is-targetable' : ''}`}
    disabled={!targetAnimal} onClick={onTarget}
    aria-label={`${player.displayName}，${player.handCount} 張未公開手牌${targetAnimal ? `；選取後對其 ${targetAnimal.name} 使用功能牌` : ''}`}>
    <div className="animal-practice-seat-heading"><Bot aria-label="AI" /><strong>{player.seatLabel} · {player.displayName}</strong><span>{player.animalScore} 分 · {player.animalCount} 張動物</span></div>
    <div className="animal-practice-card-backs" aria-hidden="true">
      {Array.from({ length: player.handCount }, (_, index) => <span key={index}><img src={tentArtSrc} alt="" /></span>)}
    </div>
    <small>{targetAnimal ? `點此指定 ${targetAnimal.name}（${targetAnimal.score} 分）` : `${player.handCount} 張私人手牌 · 判讀星 ${player.judgementStars}`}</small>
  </button>
}

export default function AnimalEquationPractice({ onBack }) {
  const [game, setGame] = useState(createAnimalEquationPractice)
  const [selectedCards, setSelectedCards] = useState([])
  const [variableValues, setVariableValues] = useState({})
  const [functionCardId, setFunctionCardId] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(8)
  const view = useMemo(() => practicePublicView(game, 'you'), [game])
  const me = view.players.find((player) => player.id === 'you')
  const myTurn = game.status === 'playing' && game.currentPlayerId === 'you'
  const playableFunctions = view.hand.filter((card) => ['tame', 'accuse', 'tempt'].includes(card.code))
  const selectedFunction = playableFunctions.find((card) => card.id === functionCardId)
  const targets = functionCardTargets(view.animals, selectedFunction?.code, 'you')
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
  }, [game.turnNumber])

  function toggleCard(cardId) {
    setFunctionCardId('')
    setSelectedCards((current) => current.includes(cardId)
      ? current.filter((id) => id !== cardId)
      : current.length < 2 ? [...current, cardId] : [current[1], cardId])
  }

  function playRadical() {
    setGame((current) => submitPracticeRadical(current, selectedCards, variableValues))
  }

  function selectFunction(cardId) {
    setSelectedCards([])
    setFunctionCardId((current) => current === cardId ? '' : cardId)
  }

  function playFunctionAtAnimal(animalId) {
    if (!myTurn || selectedFunction?.code !== 'tame' || !targets.some((animal) => animal.id === animalId)) return
    setGame((current) => submitPracticeFunction(current, functionCardId, animalId))
  }

  function playFunctionAtPlayer(playerId) {
    if (!myTurn || !['accuse', 'tempt'].includes(selectedFunction?.code)) return
    const target = practiceTargetForPlayer(view.animals, selectedFunction.code, 'you', playerId)
    if (target) setGame((current) => submitPracticeFunction(current, functionCardId, target.id))
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
        <span><AnimalEquationRadicalText text={view.message} /></span>
      </div>
      <p className="animal-practice-mode-note">這是本機試玩：AI 會輪流出牌，手牌與動物每局重新洗牌；目前支援單張、兩張同類方根及功能牌，不含多張牌排等式、真人連線或雲端紀錄。</p>

      <div className="animal-practice-layout">
        {view.players.filter((player) => player.id !== 'you').map((player) => <OpponentSeat key={player.id}
          player={player} active={view.currentPlayerId === player.id}
          targetAnimal={myTurn && ['accuse', 'tempt'].includes(selectedFunction?.code)
            ? practiceTargetForPlayer(view.animals, selectedFunction.code, 'you', player.id) : null}
          onTarget={() => playFunctionAtPlayer(player.id)} />)}

        <section className="animal-practice-center" aria-label="公開桌面">
          <div className="animal-practice-board-heading"><strong>中央動物</strong><span>牌庫 {view.deckCount} 張</span></div>
          <div className="animal-practice-animals">
            {view.animals.map((animal) => <button type="button" key={animal.id}
              className={`${animal.revealed ? 'is-revealed' : ''} ${myTurn && selectedFunction?.code === 'tame' && targets.some((target) => target.id === animal.id) ? 'is-targetable' : ''}`}
              disabled={!myTurn || selectedFunction?.code !== 'tame' || !targets.some((target) => target.id === animal.id)}
              onClick={() => playFunctionAtAnimal(animal.id)}
              aria-label={animal.revealed ? `${animal.name}，${animal.score} 分，${publicName(view, animal.ownerPlayerId)}持有` : `第 ${animal.position} 張蓋住的動物${selectedFunction?.code === 'tame' ? '，點此使用馴化' : ''}`}>
              {animal.revealed ? <><span className="animal-practice-animal-art" style={{ backgroundImage: `url(${animalArtSrc})`, backgroundPosition: animalArtPosition(animal.code) }} aria-hidden="true" /><strong>{animal.name}</strong><small>{animal.score} 分 · {publicName(view, animal.ownerPlayerId)}</small></>
                : <><img className="animal-practice-animal-back" src={tentArtSrc} alt="" /><strong>第 {animal.position} 張</strong><small>尚未翻開</small></>}
            </button>)}
          </div>
          <div className="animal-practice-public-play" aria-live="polite">
            <div><Swords aria-hidden="true" /><strong>本回合公開出牌</strong></div>
            <p>{latestPlay?.functionCode && <AnimalEquationFunctionIcon code={latestPlay.functionCode} className="is-public" />}
              <span><AnimalEquationRadicalText text={latestPlay ? `${publicName(view, latestPlay.playerId)}：${latestPlay.text}` : '尚未有人出牌'} /></span></p>
            {latestPlay && <small>{latestPlay.result}{latestPlay.defenseLabel ? ` · ${latestPlay.defenseLabel}` : ''}</small>}
          </div>
          <details className="animal-practice-history">
            <summary>查看所有玩家的出牌紀錄（{view.publicPlays.length} 筆）</summary>
            <ol>{view.publicPlays.map((play) => <li key={play.id}>
              <strong>第 {play.turnNumber} 回合 · {publicName(view, play.playerId)}</strong>
              <span>{play.functionCode && <AnimalEquationFunctionIcon code={play.functionCode} className="is-history" />}
                <AnimalEquationRadicalText text={`${play.text} · ${play.result}`} /></span>
            </li>)}</ol>
          </details>
        </section>

        <section className={`animal-practice-self ${myTurn ? 'is-active' : ''}`} aria-label="你在下方的私人手牌與操作區">
          <div className="animal-practice-self-heading">
            <div><span>你的座位 · 下方</span><strong>{me.seatLabel} · 你</strong><small>{me.animalCount} 張動物 · {me.animalScore} 分 · 判讀星 {me.judgementStars}</small></div>
            <b>手牌 {view.hand.length}／6</b>
          </div>
          <div className="animal-practice-hand" aria-label="只有你看得到的手牌；直接點牌選取">
            {view.hand.map((card) => {
              const selected = card.type === 'function' ? functionCardId === card.id : selectedCards.includes(card.id)
              const canDefend = game.status === 'reaction' && card.code === defenseCode
              const canSelect = myTurn && (card.type === 'radical' || playableFunctions.some((item) => item.id === card.id))
              return <button type="button" key={card.id}
                className={[card.type === 'function' ? 'is-function' : '', view.newDrawnCardIds.includes(card.id) ? 'is-new' : '', selected ? 'is-selected' : ''].filter(Boolean).join(' ')}
                disabled={!canSelect && !canDefend} aria-pressed={selected}
                aria-label={`${card.label}，${card.type === 'function' ? '功能牌' : '根式牌'}${canDefend ? '，點此防禦' : selected ? '，已選取' : ''}`}
                onClick={() => canDefend ? setGame((current) => respondPracticeFunction(current, card.id))
                  : card.type === 'function' ? selectFunction(card.id) : toggleCard(card.id)}>
                <img className="animal-practice-hand-art" src={tentArtSrc} alt="" aria-hidden="true" />
                <span className="animal-practice-hand-corner" aria-hidden="true">{card.type === 'function' ? '✦' : '√'}</span>
                {card.type === 'function' && <AnimalEquationFunctionIcon code={card.code} />}
                <strong>{card.type === 'radical' ? <AnimalEquationRadicalText text={card.label} /> : card.label}</strong>
                <small>{view.newDrawnCardIds.includes(card.id) ? '新補牌' : card.type === 'function' ? '功能牌' : '根式牌'}</small>
                <span className="animal-practice-hand-corner is-bottom" aria-hidden="true">{card.type === 'function' ? '✦' : '√'}</span>
              </button>
            })}
          </div>
          <small className="animal-practice-private-note">直接點手牌選取。別人只看到牌背；只有出牌後，牌面才會公開。</small>

          {myTurn && <div className="animal-practice-controls">
            <p>{selectedFunction?.code === 'tame' ? '已選「馴化」：直接點中央發亮的蓋住動物牌。'
              : ['accuse', 'tempt'].includes(selectedFunction?.code) ? `已選「${selectedFunction.label}」：直接點發亮的對手座位。若有多張動物，優先指定分數最高的一張。`
                : selectedCards.length ? `已選 ${selectedCards.length} 張根式牌；確認 n 值後送出。`
                  : '點自己的牌選取：根式牌選 1～2 張；功能牌選取後，直接點桌面目標。'}</p>
            {view.hand.filter((card) => selectedCards.includes(card.id) && card.variableCode === 'n').map((card) =>
              <label className="animal-practice-variable" key={card.id}><span><AnimalEquationRadicalText text={card.label} /> 的 n 值</span>
                <input inputMode="numeric" value={variableValues[card.id] || ''} placeholder="正整數"
                  onChange={(event) => setVariableValues((current) => ({ ...current, [card.id]: event.target.value.replace(/\D/g, '') }))} />
              </label>)}
            {selectedCards.length > 0 && <button className="animal-practice-primary" type="button" onClick={playRadical}>送出 {selectedCards.length} 張根式牌</button>}
            {selectedFunction && !targets.length && <small>目前沒有這張功能牌可以指定的目標。</small>}
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
            <span>{defenseCards.length ? '直接點上方手牌中的防禦牌。' : '你沒有可用的防禦牌。'}</span>
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
