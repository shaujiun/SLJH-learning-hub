function percentage(value, maximum) {
  const score = Number(value)
  const total = Number(maximum)
  if (!Number.isFinite(score) || !Number.isFinite(total) || total <= 0) return null
  return Math.max(0, Math.min(100, Math.round((score / total) * 10000) / 100))
}

function safeCount(value) {
  const count = Math.trunc(Number(value))
  return Number.isFinite(count) ? Math.max(0, count) : 0
}

export function resolveTrackedFocusTaskId(explicitTaskId = '', taskResult = null) {
  return String(taskResult?.matchedFocusTaskId || explicitTaskId || '').trim()
}

export function buildFactorClashSoloProgress({
  focusTaskId = '', mode = 'area', difficulty = 'basic', questionCount = 0,
  points = 0, firstTryCorrect = 0, secondTryCorrect = 0,
  timeoutCount = 0, awayCount = 0, awaySeconds = 0,
}) {
  const totalQuestions = Math.max(1, safeCount(questionCount))
  const firstTry = safeCount(firstTryCorrect)
  const secondTry = safeCount(secondTryCorrect)
  return {
    subjectCode: 'math',
    activityCode: 'factor_clash',
    activityName: '因式交鋒：天人 × 十字',
    modeCode: `${mode}_${difficulty}`,
    source: focusTaskId ? 'daily_task' : 'free_practice',
    score: percentage(points, totalQuestions * 3),
    correctCount: Math.min(totalQuestions, firstTry + secondTry),
    questionCount: totalQuestions,
    metadata: {
      firstTryCorrect: firstTry,
      secondTryCorrect: secondTry,
      timeoutCount: safeCount(timeoutCount),
      awayCount: safeCount(awayCount),
      awaySeconds: safeCount(awaySeconds),
    },
  }
}

export function buildFactorClashDuelProgress({ room = {}, self = {} }) {
  const questionCount = Math.max(1, safeCount(room.questionCount || self.progress || 10))
  return {
    subjectCode: 'math',
    activityCode: 'factor_clash',
    activityName: '因式交鋒：天人 × 十字',
    modeCode: `${room.mode || 'area'}_${room.difficulty || 'basic'}_duel`,
    source: 'free_practice',
    completed: self.status !== 'forfeited',
    score: percentage(self.score, questionCount * 3),
    durationSeconds: Math.round(safeCount(self.totalElapsedMs) / 1000),
    attemptKey: `factor-clash-duel:${room.roomCode || 'room'}:${self.id || self.seatNo || 'seat'}`,
    metadata: {
      questionCount,
      firstTryCorrect: safeCount(self.firstTryCorrect),
      forfeited: self.status === 'forfeited',
    },
  }
}

export function buildPeriodicBattleProgress({ room = {} }) {
  const me = (room.players || []).find((player) => player.id === room.mePlayerId)
  const myScore = me?.teamCode === 'B' ? Number(room.teamBScore || 0) : Number(room.teamAScore || 0)
  const opponentScore = me?.teamCode === 'B' ? Number(room.teamAScore || 0) : Number(room.teamBScore || 0)
  return {
    subjectCode: 'science',
    activityCode: 'periodic_battle',
    activityName: '元素週期表即時對戰',
    modeCode: `${room.level || 'beginner'}_${room.mode || 'mixed'}_${safeCount(room.playerLimit) || 2}p`,
    source: 'free_practice',
    attemptKey: `periodic-battle:${room.id || room.code || 'room'}:${room.mePlayerId || 'player'}`,
    metadata: {
      questionCount: safeCount(room.questionCount),
      teamCode: me?.teamCode || null,
      teamScore: myScore,
      opponentScore,
      result: myScore === opponentScore ? 'tie' : myScore > opponentScore ? 'win' : 'loss',
    },
  }
}

export function buildIdiomWordGridProgress({ puzzle, focusTaskId = '', answerCellCount = 0, hintsUsed = 0 }) {
  const questionCount = Math.max(1, safeCount(answerCellCount))
  return {
    subjectCode: 'puzzle',
    activityCode: 'idiom_word_grid',
    activityName: '成語填字圖',
    modeCode: puzzle?.id || puzzle?.difficulty || 'issue',
    source: focusTaskId ? 'daily_task' : 'free_practice',
    score: 100,
    correctCount: questionCount,
    questionCount,
    attemptKey: `idiom-word-grid:${puzzle?.id || puzzle?.publishedOn || 'starter'}`,
    metadata: {
      difficulty: puzzle?.difficulty || null,
      publishedOn: puzzle?.publishedOn || null,
      hintsUsed: safeCount(hintsUsed),
    },
  }
}

export function buildNewsCrosswordProgress({ puzzle, answerCellCount = 0 }) {
  const questionCount = Math.max(1, safeCount(answerCellCount))
  return {
    subjectCode: 'puzzle',
    activityCode: 'news_crossword',
    activityName: '新聞縱橫填字',
    modeCode: puzzle?.id || puzzle?.publishedOn || 'issue',
    source: 'free_practice',
    score: 100,
    correctCount: questionCount,
    questionCount,
    attemptKey: `news-crossword:${puzzle?.id || puzzle?.publishedOn || 'issue'}`,
    metadata: { publishedOn: puzzle?.publishedOn || null },
  }
}

export function buildSchulteProgress({
  activityCode, activityName, modeCode, result, attemptKey,
  focusTaskId = '', questionCount = null, metadata = {},
}) {
  const totalQuestions = Math.max(1, safeCount(questionCount ?? result?.totalNumbers ?? result?.size))
  return {
    subjectCode: 'focus_training',
    activityCode,
    activityName,
    modeCode,
    source: focusTaskId ? 'daily_task' : 'free_practice',
    correctCount: totalQuestions,
    questionCount: totalQuestions,
    durationSeconds: Math.round(safeCount(result?.durationMs) / 1000),
    attemptKey: `schulte:${attemptKey}`,
    metadata: {
      errorCount: safeCount(result?.errorCount),
      averageTapMs: safeCount(result?.averageTapMs),
      ...metadata,
    },
  }
}
