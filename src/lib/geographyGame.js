export function shuffleGeographyItems(items, random = Math.random) {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

export function buildGeographyRound(items, size = 10, random = Math.random) {
  if (!Array.isArray(items) || items.length === 0) return []
  return shuffleGeographyItems(items, random).slice(0, Math.min(size, items.length))
}

export function buildGeographyChoices(item, pool, size = 4, random = Math.random) {
  if (!item) return []
  const distractors = shuffleGeographyItems(
    pool.filter((candidate) => candidate.id !== item.id),
    random,
  ).slice(0, Math.max(0, size - 1))
  return shuffleGeographyItems([item, ...distractors], random)
}

export function geographyFeedback(item, mistakeCount) {
  if (mistakeCount <= 1) {
    return {
      level: 'retry',
      message: '這個答案還不對，別急，再觀察地圖想一想。',
      revealAnswer: false,
    }
  }
  if (mistakeCount === 2) {
    return {
      level: 'hint',
      message: item?.hint || '留意它與周圍地形、河流或行政區的位置關係。',
      revealAnswer: false,
    }
  }
  return {
    level: 'answer',
    message: `答案是「${item?.name || ''}」。${item?.reason || ''}`,
    revealAnswer: true,
  }
}

export function geographyDifficultyLabel(score, total) {
  if (!total) return '入門'
  const rate = score / total
  if (rate >= 0.9) return '進階'
  if (rate >= 0.7) return '基礎'
  return '入門'
}
