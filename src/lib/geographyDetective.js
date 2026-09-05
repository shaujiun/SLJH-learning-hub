export function shuffleDetectiveItems(items, random = Math.random) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

export function buildGeographyDetectiveRound(questions, chapterId = 'mixed', count = 10, random = Math.random) {
  const source = chapterId === 'mixed'
    ? questions
    : questions.filter((question) => question.chapterId === chapterId)
  return shuffleDetectiveItems(source, random)
    .slice(0, Math.min(count, source.length))
    .map((question) => ({
      ...question,
      choices: shuffleDetectiveItems(question.choices, random),
    }))
}

export function evaluateGeographyDetectiveAnswer(question, selectedAnswer, previousMistakes = 0) {
  if (!question) return null
  if (selectedAnswer === question.answer) {
    const points = previousMistakes === 0 ? 10 : previousMistakes === 1 ? 7 : 4
    return {
      correct: true,
      resolved: true,
      revealAnswer: true,
      points,
      message: previousMistakes === 0 ? '判斷正確！' : '找到了，現在把判斷依據一起記起來。',
    }
  }

  const mistakeCount = previousMistakes + 1
  if (mistakeCount === 1) {
    return {
      correct: false,
      resolved: false,
      revealAnswer: false,
      mistakeCount,
      points: 0,
      message: '這個判斷還不對，先把兩條線索連在一起，再想一次。',
    }
  }
  if (mistakeCount === 2) {
    return {
      correct: false,
      resolved: false,
      revealAnswer: false,
      mistakeCount,
      points: 0,
      message: question.hint,
    }
  }
  return {
    correct: false,
    resolved: true,
    revealAnswer: true,
    mistakeCount,
    points: 0,
    message: `答案是「${question.answer}」。請看下方判斷依據。`,
  }
}

export function geographyDetectiveScore(points, questionCount) {
  if (!questionCount) return 0
  return Math.round((Math.max(0, points) / (questionCount * 10)) * 100)
}
