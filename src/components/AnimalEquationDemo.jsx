import { useState } from 'react'
import { ArrowLeft, BookOpen, Bot, RotateCcw, Swords, Trophy } from 'lucide-react'
import { createAnimalEquationDemo, submitDemoPair, tameDemoAnimal } from '../lib/animalEquationDemo.js'
import './animalEquationDemo.css'

export function DemoVariableInputs({ hand, selectedIds, nValues, onChange }) {
  return hand.filter((card) => selectedIds.includes(card.id) && card.variableCode === 'n').map((card) => (
    <label className="animal-demo-variable" key={card.id}>
      <span>替 {card.label} 設定正整數 n</span>
      <input inputMode="numeric" pattern="[1-9][0-9]*" value={nValues[card.id] || ''}
        onChange={(event) => onChange(card.id, event.target.value.replace(/\D/g, ''))} placeholder="例如 2" />
    </label>
  ))
}

export default function AnimalEquationDemo({ onBack, onStartGame }) {
  const [room, setRoom] = useState(createAnimalEquationDemo)
  const [selectedIds, setSelectedIds] = useState([])
  const [nValues, setNValues] = useState({})
  const [selectedAnimalId, setSelectedAnimalId] = useState('')
  const me = room.players[0]

  function selectCard(id) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((selected) => selected !== id)
      : current.length < 2 ? [...current, id] : [current[1], id])
  }

  function playPair() {
    const nextRoom = submitDemoPair(room, selectedIds, nValues)
    setRoom(nextRoom)
    if (nextRoom.phase === 'tame') setSelectedIds([])
  }

  function restart() {
    setRoom(createAnimalEquationDemo())
    setSelectedIds([])
    setNValues({})
    setSelectedAnimalId('')
  }

  return (
    <div className="animal-demo-shell">
      <header className="animal-demo-header">
        {onBack ? <button type="button" onClick={onBack}><ArrowLeft aria-hidden="true" />選擇模式</button>
          : <a href="?guest=1&subject=math"><ArrowLeft aria-hidden="true" />返回數學練習</a>}
        <strong>根式馬戲團 <span>免登入教學試玩</span></strong>
      </header>

      <main className="animal-demo-main">
        <section className="animal-demo-turn" aria-labelledby="animal-demo-turn-title">
          <div className="animal-demo-heading">
            <div>
              <p>YOUR TURN · {room.phase === 'pair' ? '1／2' : '2／2'}</p>
              <h1 id="animal-demo-turn-title">{room.phase === 'pair' ? '找出兩張同類方根' : room.phase === 'tame' ? '翻開一張動物牌' : '這輪試玩完成'}</h1>
            </div>
            <span>八上第 2 章起適用</span>
          </div>
          <p className="animal-demo-feedback" role="status" aria-live="polite">{room.message}</p>

          {room.phase === 'pair' && <>
            <div className="animal-demo-hand" aria-label="你的根式手牌">
              {room.hand.filter((card) => card.type === 'radical').map((card) => (
                <button key={card.id} type="button" className={selectedIds.includes(card.id) ? 'is-selected' : ''}
                  aria-pressed={selectedIds.includes(card.id)} onClick={() => selectCard(card.id)}>
                  <strong>{card.label}</strong><small>{selectedIds.includes(card.id) ? '已選取' : '點選出牌'}</small>
                </button>
              ))}
              <span className="animal-demo-function-card" aria-label="下一步可使用的馴化牌">馴化<small>下一步</small></span>
            </div>
            <DemoVariableInputs hand={room.hand} selectedIds={selectedIds} nValues={nValues}
              onChange={(id, value) => setNValues((current) => ({ ...current, [id]: value }))} />
            <button className="animal-demo-action" type="button" disabled={selectedIds.length !== 2} onClick={playPair}>
              送出 2 張根式牌
            </button>
            <p className="animal-demo-hint"><Swords aria-hidden="true" />可以故意選不同類的牌，看看 AI 如何抓錯；正式對局中別人有 8 秒判讀。</p>
          </>}

          {room.phase === 'tame' && <>
            <p className="animal-demo-instruction">你手上有一張「馴化」。先挑一張蓋住的動物，再打出功能牌。</p>
            <div className="animal-demo-targets" aria-label="中央未翻開的動物牌">
              {room.animals.map((animal) => <button key={animal.id} type="button"
                className={selectedAnimalId === animal.id ? 'is-selected' : ''}
                aria-pressed={selectedAnimalId === animal.id} onClick={() => setSelectedAnimalId(animal.id)}>
                <span>∑</span><strong>第 {animal.position} 張</strong><small>蓋住的動物</small>
              </button>)}
            </div>
            <button className="animal-demo-action" type="button" disabled={!selectedAnimalId}
              onClick={() => setRoom(tameDemoAnimal(room, selectedAnimalId))}>使用「馴化」</button>
          </>}

          {room.phase === 'complete' && <div className="animal-demo-complete">
            <Trophy aria-hidden="true" />
            <p>目前收集 {me.animalCount} 張動物、{me.animalScore} 分。這是 2 步教學試玩，不是完整四人對局。</p>
            <button className="animal-demo-action" type="button" onClick={restart}><RotateCcw aria-hidden="true" />重新試玩</button>
            {onStartGame && <button className="animal-demo-action" type="button" onClick={onStartGame}>進入自由試玩，與 3 位 AI 對局</button>}
          </div>}
        </section>

        <section className="animal-demo-table" aria-label="試玩桌面">
          <div className="animal-demo-scoreboard">
            {room.players.map((player) => <div key={player.id} className={player.id === 'you' ? 'is-me' : ''}>
              <span>{player.isAi ? <Bot aria-label="AI" /> : '你'}</span>
              <strong>{player.displayName}</strong>
              <small>{player.animalCount} 張動物 · {player.judgementStars} 顆判讀星</small>
              <b>{player.animalScore} 分</b>
            </div>)}
          </div>
          <div className="animal-demo-table-body">
            <div className="animal-demo-animal-grid">
              {room.animals.map((animal) => <div key={animal.id} className={animal.revealed ? 'is-revealed' : ''}>
                {animal.revealed ? <><span aria-hidden="true">{animal.icon}</span><strong>{animal.name}</strong><small>{animal.score} 分 · 你的動物</small></>
                  : <><span>∑</span><strong>動物牌</strong><small>第 {animal.position} 張</small></>}
              </div>)}
            </div>
            <aside className="animal-demo-table-center">
              <span>本輪出牌</span><strong>{room.lastPlay || '尚未出牌'}</strong>
              <span>你的手牌</span><p>{room.hand.map((card) => card.label).join('　')}</p>
            </aside>
          </div>
        </section>

        <details className="animal-demo-rules">
          <summary><BookOpen aria-hidden="true" />正式對局還有哪些玩法？</summary>
          <p>正式對局有 4 個座位、每人 6 張私人手牌。每回合可出單張根式、兩張同類方根，或用多張牌排成正確等式；也可使用功能牌。指控、誘惑及對應防禦牌會影響已收集的動物。先收集 4 張動物或達到 40 分者獲勝。</p>
          <p>本頁只示範兩張同類方根與馴化。試玩紀錄不會寫入帳號或每日任務。</p>
        </details>
      </main>
    </div>
  )
}
