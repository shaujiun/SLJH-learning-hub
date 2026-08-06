import {
  createPeriodicQuestions,
  getElementsForLevel,
  normalizePeriodicLevel,
  normalizePeriodicMode,
} from './periodicTable.js'

export const battlePlayerOptions = [2, 4]
export const battleDefaultQuestionCount = 20

export function isValidBattleQuestionCount(playerLimit, questionCount) {
  const players = Number(playerLimit)
  const questions = Number(questionCount)
  return Number.isInteger(questions)
    && questions >= 4
    && questions <= 40
    && (players !== 4 || questions % 4 === 0)
}
export function getInitialBattleSeats(playerLimit, questionPosition) {
  if (Number(playerLimit) === 2) return [1, 2]
  return [
    [1, 3],
    [2, 4],
    [2, 3],
    [1, 4],
  ][(Math.max(1, Number(questionPosition)) - 1) % 4]
}

export function getBattleAttemptOrder({ playerLimit, questionPosition, winnerSeat, players }) {
  const initial = getInitialBattleSeats(playerLimit, questionPosition)
  if (!initial.includes(winnerSeat)) return []
  const opponentSeat = initial.find((seat) => seat !== winnerSeat)
  if (Number(playerLimit) === 2) return [winnerSeat, opponentSeat]

  const winner = players.find((player) => player.seatNumber === winnerSeat)
  const teammate = players.find((player) => (
    player.teamCode === winner?.teamCode && player.seatNumber !== winnerSeat
  ))
  const used = new Set([winnerSeat, opponentSeat, teammate?.seatNumber])
  const remaining = players.find((player) => !used.has(player.seatNumber))
  return [winnerSeat, opponentSeat, teammate?.seatNumber, remaining?.seatNumber].filter(Boolean)
}

export function pointsForBattleAttempt(attemptNumber, correct) {
  if (!correct) return -1
  if (Number(attemptNumber) === 1) return 3
  if (Number(attemptNumber) === 2) return 2
  return 1
}

export function createPeriodicBattleQuestions({
  level = 'beginner',
  mode = 'mixed',
  count = battleDefaultQuestionCount,
  random = Math.random,
} = {}) {
  const normalizedLevel = normalizePeriodicLevel(level)
  const normalizedMode = normalizePeriodicMode(mode)
  const requestedCount = Math.max(4, Math.min(40, Number.parseInt(count, 10) || battleDefaultQuestionCount))
  const poolSize = getElementsForLevel(normalizedLevel).length
  const questions = []

  while (questions.length < requestedCount) {
    const batchCount = Math.min(poolSize, requestedCount - questions.length)
    const batch = createPeriodicQuestions({
      level: normalizedLevel,
      mode: normalizedMode,
      count: batchCount,
      random,
    })
    questions.push(...batch)
  }

  return questions.slice(0, requestedCount).map((question) => ({
    mode: question.mode,
    prompt: question.prompt,
    answer: String(question.answer),
    choices: question.choices.map((choice) => ({
      key: choice.key,
      value: String(choice.value),
    })),
  }))
}

export function secondsUntil(deadline, now = Date.now()) {
  if (!deadline) return 0
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Number(now)) / 1000))
}
