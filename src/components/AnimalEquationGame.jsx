import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock3,
  Copy,
  Delete,
  DoorOpen,
  Home,
  LockKeyhole,
  LoaderCircle,
  Maximize2,
  Play,
  Radio,
  RotateCcw,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  X,
} from 'lucide-react'
import {
  animalEquationAnimals,
  animalEquationFunctions,
  animalEquationRadicals,
  animalEquationRuleCards,
} from '../data/animalEquationCards.js'
import AnimalEquationFunctionIcon from './AnimalEquationFunctionIcon.jsx'
import AnimalEquationRadicalText from './AnimalEquationRadicalText.jsx'
import { secondsUntilDeadline, shouldRequestDeadlineAdvance } from '../lib/animalEquationTurnClock.js'
import {
  advanceAnimalEquation,
  challengeAnimalEquation,
  createAnimalEquationRoom,
  heartbeatAnimalEquationRoom,
  joinAnimalEquationRoom,
  leaveAnimalEquationRoom,
  loadAnimalEquationRoom,
  respondAnimalEquationFunction,
  runAnimalEquationAiTurn,
  startAnimalEquationRoom,
  submitAnimalEquationFunction,
  submitAnimalEquationRadical,
  subscribeAnimalEquationRoom,
} from '../services/animalEquationRoomService.js'
import { equationTokenLabel, parseEquationTokens } from '../lib/equationTokenParser.js'
import { functionCardTargets, functionDefenseMap } from '../lib/animalEquationFunctions.js'
import { resolveFocusTaskId } from '../lib/focusTaskLaunch.js'
import { recordAnimalEquationTask } from '../services/animalEquationTaskService.js'
import './animalEquationGame.css'

const contactBookUrl = import.meta.env.VITE_CONTACT_BOOK_URL?.trim()
  || 'https://shaujiun.github.io/SLJH114-06OCB/'

function learningHubUrl() {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  return url.toString()
}

function AnimalCard({ card, hidden = false, ownerName = '' }) {
  return (
    <article className={`animal-equation-animal-card score-${card.score} ${hidden ? 'is-hidden' : ''}`}>
      {hidden ? (
        <><span className="animal-card-back-mark">∑</span><strong>根式馬戲團</strong></>
      ) : (
        <><b>{card.score}</b><span aria-hidden="true">{card.icon}</span><strong>{card.name}</strong>{ownerName && <small>{ownerName}</small>}</>
      )}
    </article>
  )
}

function RuleDialog({ rule, onClose }) {
  if (!rule) return null
  return (
    <div className="animal-rule-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="animal-rule-dialog" role="dialog" aria-modal="true" aria-labelledby="animal-rule-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="animal-rule-close" onClick={onClose} aria-label="關閉規則"><X /></button>
        <p>RULE CARD</p>
        <h2 id="animal-rule-title">{rule.title}</h2>
        <span>{rule.summary}</span>
        <ol>{rule.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <button type="button" className="animal-equation-primary" onClick={onClose}><CheckCircle2 />我看懂了</button>
      </section>
    </div>
  )
}

const tentArtSrc = import.meta.env.BASE_URL + 'animal-equation-tent.png'
const animalArtSrc = import.meta.env.BASE_URL + 'animal-equation-animals.png'
const artOrder = animalEquationAnimals.map((animal) => animal.code)
function artPosition(code) {
  const index = artOrder.indexOf(code)
  return String(index % 4 * 100 / 3) + '% ' + String(Math.floor(index / 4) * 100 / 3) + '%'
}
function TableGameCard({ card, compact = false, selected = false, newlyDrawn = false, onClick }) {
  const code = card.functionCode || card.code
  const isFunction = card.type === 'function' || animalEquationFunctions.some((item) => item.code === code)
  const label = card.variableValue ? String(card.label).replace(/^n/, String(card.variableValue)) : card.label
  const Tag = onClick ? 'button' : 'article'
  return <Tag type={onClick ? 'button' : undefined} onClick={onClick}
    className={'animal-table-game-card ' + (isFunction ? 'is-function ' : 'is-radical ') +
      (compact ? 'is-compact ' : '') + (selected ? 'is-selected ' : '') +
      (newlyDrawn ? 'is-new' : '')}
    aria-label={onClick ? '選擇手牌：' + label : undefined}>
    <img src={tentArtSrc} alt="" aria-hidden="true" />
    {isFunction ? <AnimalEquationFunctionIcon code={code} /> : null}
    <strong><AnimalEquationRadicalText text={label} /></strong>
    <small>{newlyDrawn ? '新補牌' : isFunction ? '功能牌' : '根式牌'}</small>
  </Tag>
}
function TableAnimal({ animal, hidden = false, onClick }) {
  const Tag = onClick ? 'button' : 'article'
  return <Tag type={onClick ? 'button' : undefined} onClick={onClick}
    className={'animal-table-animal ' + (hidden ? 'is-hidden' : 'is-revealed') +
      (onClick ? ' is-targetable' : '')}
    aria-label={onClick ? '選擇第 ' + animal.position + ' 張蓋住的動物牌' : undefined}>
    {hidden ? <><img src={tentArtSrc} alt="" /><small>第 {animal.position} 張</small></> :
      <><span className="animal-table-animal-art" style={{
        backgroundImage: 'url(' + animalArtSrc + ')', backgroundPosition: artPosition(animal.code),
      }} aria-hidden="true" /><strong>{animal.name}</strong><small>{animal.score} 分</small></>}
  </Tag>
}
function TableSeat({ player, direction, room, animals, onPlayerClick }) {
  const seatName = player ? String.fromCharCode(64 + player.seatNumber) : '空位'
  const scored = animals.filter((animal) => animal.ownerPlayerId === player?.id)
  const lastPlay = room?.pendingPlay && room.pendingPlay.playerId === player?.id
    ? { cards: room.pendingPlay.selectedCards } : player?.lastPlay
  const targetable = Boolean(onPlayerClick && player && player.id !== room?.mePlayerId && scored.length)
  const Tag = targetable ? 'button' : 'div'
  return <section className={'animal-table-seat is-' + direction +
    (player && player.id === room?.currentPlayerId ? ' is-active' : '') +
    (player?.id === room?.mePlayerId ? ' is-me' : '')}>
    <Tag type={targetable ? 'button' : undefined}
      onClick={targetable ? () => onPlayerClick(player.id) : undefined}
      className={'animal-table-seat-body' + (targetable ? ' is-targetable' : '')}>
      <header><b>{seatName}</b><strong>{player?.displayName || '等待加入'}</strong>
        <span>{player?.isAi ? 'AI' : player?.leftAt ? '已離房' : player?.connected ? '在線' : player ? '暫時離線' : ''}</span>
        <em>{player?.animalScore || 0} 分</em></header>
      <div className="animal-table-zones">
        <div className="animal-table-play-zone"><small>出牌區 · 上次出牌</small>
          <div>{lastPlay?.cards?.length ? lastPlay.cards.map((card) =>
            <TableGameCard card={card} compact key={card.id} />) : <span>尚未出牌</span>}</div>
        </div>
        <div className="animal-table-score-zone"><small>得分區 · {scored.length} 張</small>
          <div>{scored.length ? scored.map((animal) =>
            <TableAnimal animal={animal} key={animal.id} />) : <span>尚無動物</span>}</div>
        </div>
      </div>
      <footer>本房勝場 {player?.winCount || 0} · 判讀星 {player?.judgementStars || 0}</footer>
    </Tag>
  </section>
}
export function TablePreview({ room, selectedCardIds = [], selectedFunctionId = '',
  onCardClick, onAnimalClick, onPlayerClick }) {
  const players = room?.players || ['A 玩家','B 玩家','C 玩家','D 玩家'].map((displayName, index) => ({
    id: 'preview-' + index, displayName, seatNumber: index + 1, animalScore: 0,
    animalCount: 0, winCount: 0, judgementStars: 0,
  }))
  const me = players.find((player) => player.id === room?.mePlayerId) || players[0]
  const seat = me?.seatNumber || 1
  const relative = {
    bottom: seat, right: seat % 4 + 1, top: (seat + 1) % 4 + 1,
    left: (seat + 2) % 4 + 1,
  }
  const animals = (room?.animals || animalEquationAnimals.map((animal, index) => ({
    ...animal, id: animal.code, position: index + 1, revealed: false,
  }))).map((animal) => ({
    ...animal, ...(animalEquationAnimals.find((definition) => definition.code === animal.code) || {}),
  }))
  const centerAnimals = animals.filter((animal) => !animal.ownerPlayerId)
  const hand = room?.hand || animalEquationRadicals.slice(0, 6)
  const diceRolls = room?.firstPlayerRolls || []
  const finalRound = diceRolls.length ? Math.max(...diceRolls.map((roll) => roll.round)) : 0
  const firstRollWinner = diceRolls.filter((roll) => roll.round === finalRound)
    .sort((a, b) => b.total - a.total)[0]
  return <section className="animal-table" aria-label="四人圍坐的根式馬戲團牌桌">
    {['top','left','right','bottom'].map((direction) =>
      <TableSeat key={direction} direction={direction} room={room} animals={animals}
        player={players.find((player) => player.seatNumber === relative[direction])}
        onPlayerClick={onPlayerClick} />)}
    <div className="animal-table-center">
      <div className="animal-table-center-head"><strong>中央動物 · {centerAnimals.length} 張</strong>
        <span>牌庫 {room?.deckCount ?? '—'} · 棄牌 {room?.discardCount ?? '—'}</span></div>
      <div className="animal-table-grid">
        {centerAnimals.map((animal) =>
          <TableAnimal key={animal.id} animal={animal} hidden={!animal.revealed}
            onClick={onAnimalClick && selectedFunctionId ? () => onAnimalClick(animal.id) : undefined} />)}
      </div>
      {diceRolls.length ? <details className="animal-table-dice">
        <summary>開局骰子：{players.find((player) => player.id === firstRollWinner?.playerId)?.displayName || '玩家'}先出牌</summary>
        <ul>{diceRolls.map((roll, index) => <li key={index}>
          第 {roll.round} 次 · {players.find((player) => player.id === roll.playerId)?.displayName || '玩家'}：
          {roll.dice?.[0]} ＋ {roll.dice?.[1]} ＝ {roll.total}
        </li>)}</ul>
      </details> : null}
    </div>
    <div className="animal-table-private-hand">
      <strong><LockKeyhole />自己的手牌 · {hand.length}／6</strong>
      <div>{hand.length ? hand.map((card) => <TableGameCard key={card.id || card.code} card={card}
        newlyDrawn={room?.newDrawnCardIds?.includes(String(card.id))}
        selected={selectedCardIds.includes(String(card.id)) || selectedFunctionId === String(card.id)}
        onClick={onCardClick && room?.currentPlayerId === room?.mePlayerId
          ? () => onCardClick(card) : undefined} />) : <span>目前沒有手牌</span>}</div>
      <small>其他人只看得到你出過的牌；未出牌時，手牌內容不公開。</small>
    </div>
  </section>
}

function RoomLobby({ room, busy, onStart, onCopy, gameMode, onGameMode, targetScore, onTargetScore }) {
  const humanCount = room.players?.filter((player) => !player.isAi && !player.leftAt).length || 0
  const expectedHumans = room.humanPlayerLimit || 4
  const isFull = humanCount === expectedHumans
  return (
    <div className="animal-equation-live-room">
      <div className="animal-equation-room-code">
        <span><Radio />房間代碼</span><strong>{room.code}</strong>
        <button type="button" onClick={onCopy}><Copy />複製</button>
      </div>
      <p className="animal-equation-room-roster-note">同房勝場屬於原本加入的玩家；換裝置可用房間代碼回到原座位。暫時離線不算離房；若有人在對局中按「離開房間」，本局會取消，先前勝場仍保留。</p>
      <div className="animal-equation-lobby-seats">
        {Array.from({ length: 4 }, (_, index) => {
          const joined = room.players?.find((player) => player.seatNumber === index + 1)
          if (joined) return joined
          return index + 1 > expectedHumans
            ? { id: `ai-preview-${index}`, displayName: 'AI 對手', seatNumber: index + 1, isAi: true, connected: true }
            : null
        }).map((player, index) => (
          <article className={player?.id === room.mePlayerId ? 'is-me' : ''} key={player?.id || `lobby-${index}`}>
            <span>{player?.isAi ? <Bot aria-label="AI 玩家" /> : String.fromCharCode(65 + index)}</span>
            <strong>{player?.displayName || '等待玩家…'}</strong>
            <small>{player?.leftAt ? '已離開房間' : player?.id === room.mePlayerId ? '這是你' : player?.isAi ? '開始時自動加入' : player?.connected ? '已連線' : player ? '暫時離線' : '空位'}</small>
          </article>
        ))}
      </div>
      {room.isHost ? <div className="animal-equation-next-game">
        <fieldset><legend>這一局的玩法</legend>
          <button type="button" className={gameMode === 'basic' ? 'is-active' : ''} onClick={() => onGameMode('basic')}>基礎：出 1～2 張</button>
          <button type="button" className={gameMode === 'advanced' ? 'is-active' : ''} onClick={() => onGameMode('advanced')}>進階：可用 3～6 張組方程式</button>
        </fieldset>
        <label>通關分數<select value={targetScore} onChange={(event) => onTargetScore(Number(event.target.value))}>
          {[40, 45, 50, 55, 60].map((score) => <option value={score} key={score}>{score} 分</option>)}
        </select></label>
        <p>取得 4 張動物牌，或先達到設定分數，任一條件成立就獲勝。</p>
        <button className="animal-equation-primary animal-equation-start" type="button" disabled={!isFull || Boolean(busy)} onClick={onStart}>
          {busy === 'start' ? <LoaderCircle className="spin-icon" /> : <Play />}{isFull ? room.status === 'finished' ? '同房開始下一局' : '開始遊戲' : `還差 ${expectedHumans - humanCount} 位真人玩家`}
        </button>
      </div> : <p className="animal-equation-building-note">{isFull ? '玩家已到齊，請等房主開始。' : '請將房間代碼提供給同學。'}</p>}
    </div>
  )
}

function publicPlayCardMap(pendingPlay) {
  return new Map((pendingPlay?.selectedCards || []).map((card) => [String(card.id), {
    ...card,
    variableCode: card.variableValue ? 'n' : null,
  }]))
}

function expressionLabel(node, cardsById) {
  if (!node) return ''
  if (node.type === 'card') {
    const card = cardsById.get(String(node.cardId))
    if (!card) return '?'
    return card.variableValue ? card.label.replace('n', card.variableValue) : card.label
  }
  const operator = ({ '*': '×', '/': '÷' })[node.operator] || node.operator
  return `(${expressionLabel(node.left, cardsById)} ${operator} ${expressionLabel(node.right, cardsById)})`
}

export function turnPanelKey(room) {
  return `${room.id}:${room.turnNumber}:${room.currentPlayerId}`
}

function useDeadlineAdvance(deadline, actionKey, busy, onAdvance, initialSeconds) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const latestAction = useRef({ busy, onAdvance })
  useEffect(() => {
    latestAction.current = { busy, onAdvance }
  }, [busy, onAdvance])

  useEffect(() => {
    if (!deadline) return undefined
    let lastAttemptMs = -Infinity
    const update = () => {
      const nowMs = Date.now()
      const next = secondsUntilDeadline(deadline, nowMs)
      if (next === null) return
      setSecondsLeft(next)
      if (shouldRequestDeadlineAdvance({
        secondsLeft: next,
        busy: latestAction.current.busy,
        nowMs,
        lastAttemptMs,
      })) {
        lastAttemptMs = nowMs
        latestAction.current.onAdvance()
      }
    }
    update()
    const intervalId = window.setInterval(update, 500)
    return () => window.clearInterval(intervalId)
  }, [deadline, actionKey])

  return secondsLeft
}

function ReviewPanel({ room, busy, onChallenge, onAdvance }) {
  const play = room.pendingPlay
  const secondsLeft = useDeadlineAdvance(play?.reviewDeadline, play?.id, busy, onAdvance, 8)
  const cardsById = useMemo(() => publicPlayCardMap(play), [play])
  if (!play) return null
  const player = room.players?.find((item) => item.id === play.playerId)
  const isOwnPlay = room.mePlayerId === play.playerId
  const equation = play.mode === 'equation'
    ? `${expressionLabel(play.left, cardsById)} ＝ ${expressionLabel(play.right, cardsById)}`
    : play.selectedCards.map((card) => card.variableValue ? card.label.replace('n', card.variableValue) : card.label).join('、')
  return (
    <section className="animal-equation-turn-panel is-review">
      <div className="animal-equation-turn-heading">
        <div><p>CHECK THE PLAY</p><h2>{player?.displayName || '玩家'} 已出牌</h2></div>
        <strong><Clock3 />{secondsLeft} 秒</strong>
      </div>
      <div className="animal-equation-public-equation">{equation}</div>
      <p>{isOwnPlay ? '請等待其他玩家判讀。' : '若判斷出牌不符合規則，請在倒數結束前抓錯。'}</p>
      {!isOwnPlay && <button className="animal-equation-challenge" type="button" disabled={Boolean(busy) || secondsLeft === 0} onClick={onChallenge}><Swords />我要抓錯</button>}
    </section>
  )
}

function FunctionReactionPanel({ room, busy, onRespond, onAdvance }) {
  const action = room.pendingFunction
  const secondsLeft = useDeadlineAdvance(action?.responseDeadline, action?.id, busy, onAdvance, 8)
  if (!action) return null
  const actor = room.players?.find((player) => player.id === action.actorPlayerId)
  const target = room.players?.find((player) => player.id === action.targetPlayerId)
  const isTarget = room.mePlayerId === action.targetPlayerId
  const defenseCode = functionDefenseMap[action.functionCode]?.code
  const defenseName = functionDefenseMap[action.functionCode]?.name
  const defenseCards = room.hand?.filter((card) => card.functionCode === defenseCode) || []
  return (
    <section className="animal-equation-turn-panel is-reaction">
      <div className="animal-equation-turn-heading">
        <div><p>FUNCTION REACTION</p><h2>{actor?.displayName || '玩家'} 使用「{action.functionCode === 'accuse' ? '指控' : '誘惑'}」</h2></div>
        <strong><Clock3 />{secondsLeft} 秒</strong>
      </div>
      <div className="animal-equation-function-target">
        <span>{action.targetAnimal?.score} 分</span>
        <strong>{action.targetAnimal?.name}</strong>
        <small>目前屬於 {target?.displayName || '被指定玩家'}</small>
      </div>
      {isTarget ? <>
        <p>你可以打出「{defenseName}」保住這張動物牌，也可以直接不防禦。</p>
        <div className="animal-equation-defense-actions">
          {defenseCards.map((card) => <button type="button" className="animal-equation-primary" disabled={Boolean(busy) || secondsLeft === 0} onClick={() => onRespond(card.id)} key={card.id}><ShieldCheck />使用「{defenseName}」</button>)}
          <button type="button" className="animal-equation-secondary" disabled={Boolean(busy) || secondsLeft === 0} onClick={() => onRespond(null)}>不使用防禦牌</button>
        </div>
        {!defenseCards.length && <small className="animal-equation-no-defense">你的手牌中沒有「{defenseName}」，可直接確認不防禦。</small>}
      </> : <p>只有 {target?.displayName || '被指定玩家'} 可以決定是否使用「{defenseName}」。</p>}
    </section>
  )
}

function RadicalTurnPanel({ room, busy, onSubmit, onSubmitFunction, onAdvance }) {
  const [playKind, setPlayKind] = useState('radical')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedFunctionId, setSelectedFunctionId] = useState('')
  const [selectedAnimalId, setSelectedAnimalId] = useState('')
  const [variableValues, setVariableValues] = useState({})
  const [tokens, setTokens] = useState([])
  const [localError, setLocalError] = useState('')
  const secondsLeft = useDeadlineAdvance(room.turnDeadline, turnPanelKey(room), busy, onAdvance, 90)
  const radicalCards = room.hand?.filter((card) => card.type === 'radical') || []
  const functionCards = room.hand?.filter((card) => card.type === 'function') || []
  const playableFunctionCards = functionCards.filter((card) => ['tame', 'accuse', 'tempt'].includes(card.functionCode))
  const reactiveFunctionCards = functionCards.filter((card) => ['clarify', 'gender_error'].includes(card.functionCode))
  const selectedFunction = playableFunctionCards.find((card) => String(card.id) === selectedFunctionId)
  const functionDefinition = animalEquationFunctions.find((card) => card.code === selectedFunction?.functionCode)
  const functionTargets = functionCardTargets(room.animals || [], selectedFunction?.functionCode, room.mePlayerId)
  const cardsById = useMemo(() => new Map(radicalCards.map((card) => [String(card.id), card])), [radicalCards])
  const selectedCards = selectedIds.map((id) => cardsById.get(id)).filter(Boolean)
  const usedCardIds = new Set(tokens.filter((token) => token.type === 'card').map((token) => String(token.cardId)))
  const mode = selectedIds.length === 1 ? 'single' : selectedIds.length === 2 ? 'same_family' : 'equation'

  function toggleCard(cardId) {
    setLocalError('')
    setTokens([])
    setSelectedIds((current) => current.includes(cardId) ? current.filter((id) => id !== cardId)
      : current.length < (room.gameMode === 'advanced' ? 6 : 2) ? [...current, cardId] : current)
  }

  function appendToken(token) {
    setLocalError('')
    setTokens((current) => [...current, token])
  }

  async function submitRadical() {
    setLocalError('')
    if (!selectedIds.length) return setLocalError('請先選擇要出的根式牌。')
    for (const card of (mode === 'equation' ? selectedCards : []).filter((item) => item.variableCode === 'n')) {
      const value = Number(variableValues[card.id])
      if (!Number.isInteger(value) || value < 1 || value > 9) return setLocalError(`${card.label} 的 n 必須輸入 1～9。`)
    }
    let parsed = { left: null, right: null }
    if (mode === 'equation') {
      try {
        parsed = parseEquationTokens(tokens)
      } catch {
        return setLocalError('請完成等式，並確認運算符號、括號與等號的位置。')
      }
      const used = tokens.filter((token) => token.type === 'card').map((token) => String(token.cardId))
      if (used.length !== selectedIds.length || new Set(used).size !== selectedIds.length
        || selectedIds.some((id) => !used.includes(id))) {
        return setLocalError('每張選取的牌都必須在等式中使用 1 次。')
      }
    }
    await onSubmit({
      roomId: room.id, mode, selectedCardIds: selectedIds,
      left: parsed.left, right: parsed.right, variableValues,
    })
  }

  async function submitFunction() {
    setLocalError('')
    if (!selectedFunction) return setLocalError('請先選擇要使用的功能牌。')
    if (!selectedAnimalId) return setLocalError('請先選擇功能牌的目標動物。')
    await onSubmitFunction({
      roomId: room.id,
      functionCardId: selectedFunction.id,
      targetAnimalId: selectedAnimalId,
    })
  }

  function chooseHandCard(card) {
    if (card.type === 'radical') {
      setPlayKind('radical')
      setSelectedFunctionId('')
      toggleCard(String(card.id))
    } else if (['tame', 'accuse', 'tempt'].includes(card.functionCode)) {
      setPlayKind('function')
      setSelectedIds([])
      setTokens([])
      setSelectedFunctionId((current) => current === String(card.id) ? '' : String(card.id))
      setSelectedAnimalId('')
      setLocalError('')
    }
  }

  function chooseAnimal(animalId) {
    if (selectedFunction?.functionCode !== 'tame' || !functionTargets.some((animal) => animal.id === animalId)) return
    setSelectedAnimalId(String(animalId))
  }

  function choosePlayer(playerId) {
    if (!['accuse', 'tempt'].includes(selectedFunction?.functionCode)) return
    const target = functionTargets.filter((animal) => animal.ownerPlayerId === playerId)
      .sort((a, b) => b.score - a.score)[0]
    if (target) setSelectedAnimalId(String(target.id))
  }

  if (room.currentPlayerId !== room.mePlayerId) {
    const player = room.players?.find((item) => item.id === room.currentPlayerId)
    return <><TablePreview room={room} /><section className={`animal-equation-turn-panel is-waiting ${player?.isAi ? 'is-ai-thinking' : ''}`}>{player?.isAi ? <Bot /> : <Clock3 />}<h2>{player?.isAi ? `${player.displayName} 正在思考…` : `等待 ${player?.displayName || '下一位玩家'} 出牌`}</h2><p>{player?.isAi ? 'AI 會依目前手牌選擇出牌，請稍候。' : '你可以先觀察自己的手牌，思考之後可能的等式。'}</p></section></>
  }

  return (
    <><TablePreview room={room} selectedCardIds={selectedIds} selectedFunctionId={selectedFunctionId}
      onCardClick={chooseHandCard}
      onAnimalClick={selectedFunction?.functionCode === 'tame' ? chooseAnimal : undefined}
      onPlayerClick={['accuse', 'tempt'].includes(selectedFunction?.functionCode) ? choosePlayer : undefined} />
    <section className="animal-equation-turn-panel">
      <div className="animal-equation-turn-heading"><div><p>YOUR TURN</p><h2>選牌並完成出牌</h2></div><strong><Clock3 />{secondsLeft} 秒</strong></div>
      <div className="animal-equation-play-kind">
        <button type="button" className={playKind === 'radical' ? 'is-active' : ''} onClick={() => { setPlayKind('radical'); setLocalError('') }}>出根式牌</button>
        <button type="button" className={playKind === 'function' ? 'is-active' : ''} disabled={!playableFunctionCards.length} onClick={() => { setPlayKind('function'); setLocalError('') }}>使用功能牌</button>
      </div>
      {playKind === 'radical' ? <>
        <p>直接點上方自己的根式手牌；選好後在此送出。</p>
        {mode === 'equation' && selectedCards.some((card) => card.variableCode === 'n') && <div className="animal-equation-variable-inputs">
          {selectedCards.filter((card) => card.variableCode === 'n').map((card, index) => <label key={card.id}><span>{card.label}（n{selectedCards.filter((item) => item.variableCode === 'n').length > 1 ? index + 1 : ''}）</span><input inputMode="numeric" min="1" max="9" step="1" maxLength="1" value={variableValues[card.id] || ''} onChange={(event) => setVariableValues((current) => ({ ...current, [card.id]: event.target.value.replace(/[^1-9]/g, '').slice(0, 1) }))} placeholder="1～9" /></label>)}
        </div>}
        <p>{room.gameMode === 'advanced' ? '出 1～2 張依基礎規則；選 3～6 張時，每張牌恰好用一次組成等式。' : '基礎玩法可出 1 張，或 2 張同類方根；n 牌不必輸入係數。'}</p>
        {mode === 'equation' && <div className="animal-equation-composer">
          <div className="animal-equation-token-line">
            {tokens.length ? tokens.map((token, index) => <span key={`${token.type}-${token.cardId || token.value}-${index}`}>{equationTokenLabel(token, cardsById, variableValues)}</span>) : <small>依順序點選牌與運算符號</small>}
          </div>
          <div className="animal-equation-token-tools">
            <div>{selectedCards.map((card) => <button type="button" disabled={usedCardIds.has(String(card.id))} onClick={() => appendToken({ type: 'card', cardId: String(card.id) })} key={card.id}>{card.variableCode === 'n' && variableValues[card.id] ? card.label.replace('n', variableValues[card.id]) : card.label}</button>)}</div>
            <div>{['+', '-', '*', '/'].map((operator) => <button type="button" onClick={() => appendToken({ type: 'operator', value: operator })} key={operator}>{({ '*': '×', '/': '÷' })[operator] || operator}</button>)}<button type="button" onClick={() => appendToken({ type: 'equals' })}>=</button><button type="button" onClick={() => appendToken({ type: 'paren', value: '(' })}>(</button><button type="button" onClick={() => appendToken({ type: 'paren', value: ')' })}>)</button></div>
            <div className="animal-equation-edit-tools"><button type="button" onClick={() => setTokens((current) => current.slice(0, -1))}><Delete />退一格</button><button type="button" onClick={() => setTokens([])}><RotateCcw />重排</button></div>
          </div>
        </div>}
      </> : <div className="animal-equation-function-builder">
        <p>直接點上方自己的功能牌，再點中央動物或對手的大區塊。</p>
        {reactiveFunctionCards.length > 0 && <p className="animal-equation-function-note">反應牌：{reactiveFunctionCards.map((card) => card.label).join('、')}。只有被「指控」或「誘惑」時才能使用。</p>}
        {functionDefinition && <p className="animal-equation-function-description"><strong>{functionDefinition.name}</strong>{functionDefinition.description}</p>}
        {selectedFunction && <p className="animal-equation-function-targets">{selectedAnimalId
          ? '已選目標：' + (room.animals.find((animal) => animal.id === selectedAnimalId)?.name || '中央蓋住的動物')
          : selectedFunction.functionCode === 'tame' ? '請點中央一張蓋住的動物牌。'
            : '請點對手的大區塊；預設指定該玩家分數最高的動物。'}</p>}
        {selectedFunction && !functionTargets.length && <p>目前沒有可指定的動物牌，請改出根式牌。</p>}
      </div>}
      {localError && <p className="animal-equation-room-error" role="alert">{localError}</p>}
      {playKind === 'radical'
        ? <button className="animal-equation-primary animal-equation-submit-play" type="button" disabled={Boolean(busy) || !selectedIds.length} onClick={submitRadical}>{busy === 'play' ? <LoaderCircle className="spin-icon" /> : <CheckCircle2 />}送出根式牌</button>
        : <button className="animal-equation-primary animal-equation-submit-play" type="button" disabled={Boolean(busy) || !selectedFunction || !selectedAnimalId} onClick={submitFunction}>{busy === 'function' ? <LoaderCircle className="spin-icon" /> : <CheckCircle2 />}使用功能牌</button>}
    </section></>
  )
}

function LastPlayResult({ room }) {
  const result = room?.lastResult
  if (!result) return null
  const player = room.players?.find((item) => item.id === result.playerId)
  const challenger = room.players?.find((item) => item.id === result.challengerPlayerId)
  const defensePlayer = room.players?.find((item) => item.id === result.defensePlayerId)
  const messages = {
    valid: `${player?.displayName || '玩家'}的出牌正確，已補回 6 張手牌。`,
    invalid: `${player?.displayName || '玩家'}的出牌不成立，但無人抓錯；牌已進棄牌區並補牌。`,
    caught: `${challenger?.displayName || '玩家'}抓錯成功，獲得 3 顆判讀星。`,
    false_challenge: `${challenger?.displayName || '玩家'}抓錯失敗，扣 1 顆判讀星。`,
    tame_success: `${player?.displayName || '玩家'}成功馴化一張動物牌。`,
    accuse_success: `${player?.displayName || '玩家'}指控成功，指定的動物牌已蓋回中央。`,
    accuse_blocked: `${defensePlayer?.displayName || '玩家'}使用「澄清」，保住了動物牌。`,
    tempt_success: `${player?.displayName || '玩家'}誘惑成功，指定的動物牌已移入自己的得分區。`,
    tempt_blocked: `${defensePlayer?.displayName || '玩家'}使用「性別錯誤」，擋下了誘惑。`,
  }
  const message = result.type === 'timeout'
    ? `${player?.displayName || '玩家'}的出牌時間結束，已換下一位。`
    : messages[result.result]
  return message ? <p className={`animal-equation-last-result result-${result.result || result.type}`}><CheckCircle2 />{message}</p> : null
}

export function WinnerPanel({ room }) {
  if (room?.status !== 'finished') return null
  const winner = room.players?.find((player) => player.id === room.winnerPlayerId)
  return (
    <section className="animal-equation-winner" aria-live="polite">
      <Trophy />
      <div><p>GAME FINISHED</p><h2>{winner?.displayName || '本局玩家'} 獲勝</h2><span>取得 {winner?.animalCount || 0} 張動物牌，共 {winner?.animalScore || 0} 分，判讀星 {winner?.judgementStars || 0} 顆。</span></div>
      <span>本房第 {room.gameNumber || 1} 局已結束；勝場留在同一房間，房主可設定下一局。</span>
    </section>
  )
}

export default function AnimalEquationGame({ onBack }) {
  const query = useMemo(() => new URLSearchParams(window.location.search), [])
  const focusTaskId = useMemo(() => resolveFocusTaskId(query, {
    subjectCode: 'math', activityCode: 'animal_equation_solo',
  }), [query])
  const launchedSolo = query.get('solo') === '1'
  const [rule, setRule] = useState(null)
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [humanPlayerLimit, setHumanPlayerLimit] = useState(launchedSolo ? 1 : 4)
  const [gameMode, setGameMode] = useState('basic')
  const [targetScore, setTargetScore] = useState(60)
  const [room, setRoom] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [taskNotice, setTaskNotice] = useState('')
  const [recordedTaskGameKey, setRecordedTaskGameKey] = useState('')

  const refreshRoom = useCallback(async (roomId) => {
    const nextRoom = await loadAnimalEquationRoom(roomId)
    setRoom((previous) => {
      if (previous?.id !== nextRoom.id || previous.gameNumber !== nextRoom.gameNumber) {
        return { ...nextRoom, newDrawnCardIds: [], newDrawnAt: 0 }
      }
      const oldIds = new Set((previous.hand || []).map((card) => String(card.id)))
      const newlyDrawn = (nextRoom.hand || []).filter((card) => !oldIds.has(String(card.id)))
        .map((card) => String(card.id))
      const keepOld = Date.now() - (previous.newDrawnAt || 0) < 20000
      return {
        ...nextRoom,
        newDrawnCardIds: newlyDrawn.length ? newlyDrawn
          : keepOld ? (previous.newDrawnCardIds || []).filter((id) =>
            nextRoom.hand?.some((card) => String(card.id) === id)) : [],
        newDrawnAt: newlyDrawn.length ? Date.now() : previous.newDrawnAt || 0,
      }
    })
    return nextRoom
  }, [])

  useEffect(() => {
    const savedRoomId = window.sessionStorage.getItem('animal-equation-room-id')
    const savedNickname = window.sessionStorage.getItem('animal-equation-nickname')
    if (savedNickname) setNickname(savedNickname)
    if (!savedRoomId) return
    refreshRoom(savedRoomId).catch(() => window.sessionStorage.removeItem('animal-equation-room-id'))
  }, [refreshRoom])

  useEffect(() => {
    if (!room?.id) return undefined
    const reload = () => refreshRoom(room.id).catch((nextError) => setError(nextError.message))
    const unsubscribe = subscribeAnimalEquationRoom(room.id, reload)
    const intervalId = window.setInterval(() => {
      heartbeatAnimalEquationRoom(room.id).then(() => refreshRoom(room.id)).catch(() => {})
    }, 15000)
    return () => {
      window.clearInterval(intervalId)
      unsubscribe()
    }
  }, [room?.id, refreshRoom])

  useEffect(() => {
    if (!room?.id || busy) return undefined
    const targetPlayer = room.players?.find((player) => player.id === room.pendingFunction?.targetPlayerId)
    const needsAiAction = (room.status === 'playing' && room.currentPlayerIsAi)
      || (room.status === 'reaction' && targetPlayer?.isAi)
    if (!needsAiAction) return undefined

    const timeoutId = window.setTimeout(async () => {
      setBusy('ai')
      setError('')
      try {
        await runAnimalEquationAiTurn(room.id)
        await refreshRoom(room.id)
      } catch (nextError) {
        setError(nextError.message)
      } finally {
        setBusy('')
      }
    }, 1200)
    return () => window.clearTimeout(timeoutId)
  }, [busy, refreshRoom, room?.currentPlayerIsAi, room?.id, room?.pendingFunction?.targetPlayerId, room?.players, room?.status, room?.version])

  useEffect(() => {
    const gameKey = room?.id ? `${room.id}:${room.gameNumber || 1}` : ''
    if (room?.status !== 'finished' || gameKey === recordedTaskGameKey || Number(room.humanPlayerLimit) !== 1) return
    const me = room.players?.find((player) => player.id === room.mePlayerId)
    setRecordedTaskGameKey(gameKey)
    recordAnimalEquationTask({
      focusTaskId,
      finished: true,
      validRadicalPlays: Number(me?.validRadicalPlays || 0),
    }).then((result) => {
      if (!result) return
      setTaskNotice(result.passed
        ? '本局已完成，並已記入今日任務進度。'
        : '本局已完成；至少要成功打出 1 次根式牌，才會完成今日任務。')
    }).catch((nextError) => setTaskNotice(nextError.message))
  }, [focusTaskId, recordedTaskGameKey, room])

  async function run(action, operation) {
    setBusy(action)
    setError('')
    try {
      const nextRoom = await operation()
      const latestRoom = await refreshRoom(nextRoom.id)
      window.sessionStorage.setItem('animal-equation-room-id', latestRoom.id)
      window.sessionStorage.setItem('animal-equation-nickname', nickname.trim())
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy('')
    }
  }

  function copyRoomCode() {
    navigator.clipboard?.writeText(room?.code || '')
  }

  function startNewRoom() {
    window.sessionStorage.removeItem('animal-equation-room-id')
    setRoom(null)
    setRoomCode('')
    setError('')
    setTaskNotice('')
    setRecordedTaskGameKey('')
  }

  async function leaveRoom() {
    if (!room?.id || busy) return
    setBusy('leave')
    setError('')
    try {
      await leaveAnimalEquationRoom(room.id)
      startNewRoom()
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="animal-equation-shell">
      <nav className="game-floating-nav animal-equation-floating-nav" aria-label="學習系統導覽">
        {onBack && <button type="button" onClick={onBack}><ArrowLeft />返回玩法選擇</button>}
        <a href={learningHubUrl()}><Home />返回任務頁</a>
        <a href={contactBookUrl}><ArrowLeft />返回聯絡簿</a>
      </nav>
      <header className="animal-equation-header">
        <a href="?subject=math"><span>∑</span><h1>根式馬戲團</h1></a>
        <em>八上第 2 章起適用</em>
      </header>
      <main className="animal-equation-main">
        {(!room || room.status === 'lobby' || room.status === 'finished') && <section className="animal-equation-room-panel">
          <div className="animal-equation-section-heading">
            <div><p>4-SEAT ROOM</p><h2>準備進入遊戲房間</h2></div>
            <span><Users />真人可有 1～4 位，其餘座位由 AI 補滿</span>
          </div>
          {!room ? <>
            <div className="animal-equation-room-form">
              <label><span>本房顯示名稱</span><input value={nickname} maxLength={10} onChange={(event) => setNickname(event.target.value.slice(0, 10))} placeholder="最多 10 個字元" /><small>{nickname.length}／10</small></label>
              <fieldset className="animal-equation-player-count">
                <legend>本房真人玩家人數</legend>
                {[1, 2, 3, 4].map((count) => <button type="button" className={humanPlayerLimit === count ? 'is-active' : ''} onClick={() => setHumanPlayerLimit(count)} key={count}>{count === 4 ? '4 位真人' : `${count} 位真人＋${4 - count} 位 AI`}</button>)}
              </fieldset>
              <button className="animal-equation-primary" type="button" disabled={!nickname.trim() || Boolean(busy)} onClick={() => run('create', () => createAnimalEquationRoom(nickname, humanPlayerLimit))}>{busy === 'create' ? <LoaderCircle className="spin-icon" /> : <DoorOpen />}建立對戰房</button>
              <label><span>4 位數房間代碼</span><input inputMode="numeric" maxLength={4} value={roomCode} onChange={(event) => setRoomCode(event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="例如：0624" /></label>
              <button className="animal-equation-secondary" type="button" disabled={!nickname.trim() || roomCode.length !== 4 || Boolean(busy)} onClick={() => run('join', () => joinAnimalEquationRoom(roomCode, nickname))}>{busy === 'join' ? <LoaderCircle className="spin-icon" /> : <Copy />}加入房間</button>
            </div>
            <p className="animal-equation-building-note">名稱會與目前登入帳號綁定，其他玩家無法冒用這個座位。</p>
          </> : <RoomLobby room={room} busy={busy} onCopy={copyRoomCode}
            gameMode={gameMode} onGameMode={setGameMode} targetScore={targetScore} onTargetScore={setTargetScore}
            onStart={() => run('start', () => startAnimalEquationRoom(room.id, gameMode, targetScore))} />}
          {room && <button type="button" className="animal-equation-secondary animal-equation-leave" disabled={Boolean(busy)} onClick={leaveRoom}><DoorOpen />離開房間</button>}
          {error && <p className="animal-equation-room-error" role="alert">{error}</p>}
          {taskNotice && <p className="animal-equation-task-notice" role="status">{taskNotice}</p>}
        </section>}

        {room && room.status !== 'lobby' && <div className="animal-equation-live-status" role="status">
          <span>房間 {room.code}・第 {room.gameNumber || 1} 局・{room.gameMode === 'advanced' ? '進階' : '基礎'}玩法・通關 {room.targetScore || 60} 分</span>
          <button type="button" disabled={Boolean(busy)} onClick={leaveRoom}>離開房間</button>
        </div>}
        {room && room.status !== 'lobby' && error && <p className="animal-equation-room-error" role="alert">{error}</p>}
        {room && room.status !== 'lobby' && taskNotice && <p className="animal-equation-task-notice" role="status">{taskNotice}</p>}

        {room && room.status !== 'lobby' && <LastPlayResult room={room} />}
        {room && room.status !== 'playing' && <TablePreview room={room} />}
        <WinnerPanel room={room} />
        {room?.status === 'playing' && <RadicalTurnPanel
          key={turnPanelKey(room)}
          room={room}
          busy={busy}
          onSubmit={(payload) => run('play', () => submitAnimalEquationRadical(payload))}
          onSubmitFunction={(payload) => run('function', () => submitAnimalEquationFunction(payload))}
          onAdvance={() => { if (!busy) run('advance', () => advanceAnimalEquation(room.id)) }}
        />}
        {room?.status === 'review' && <ReviewPanel
          room={room}
          busy={busy}
          onChallenge={() => run('challenge', () => challengeAnimalEquation(room.id))}
          onAdvance={() => { if (!busy) run('advance', () => advanceAnimalEquation(room.id)) }}
        />}
        {room?.status === 'reaction' && <FunctionReactionPanel
          room={room}
          busy={busy}
          onRespond={(defenseCardId) => run('defense', () => respondAnimalEquationFunction(room.id, defenseCardId))}
          onAdvance={() => { if (!busy) run('advance', () => advanceAnimalEquation(room.id)) }}
        />}

        {!room && <TablePreview />}

        <div className="animal-equation-help-buttons" aria-label="需要時再開啟的遊戲說明">
          <button type="button" onClick={() => setRule(animalEquationRuleCards[0])}><BookOpen />遊戲說明</button>
          <button type="button" onClick={() => setRule(animalEquationRuleCards[1])}>根式出牌說明</button>
          <button type="button" onClick={() => setRule(animalEquationRuleCards[2])}>卡牌功能說明</button>
        </div>
      </main>
      <RuleDialog rule={rule} onClose={() => setRule(null)} />
    </div>
  )
}
