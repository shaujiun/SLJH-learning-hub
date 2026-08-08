const subjectGameTemplates = {
  english: [
    {
      code: 'english-vocabulary',
      name: '英文單字學習系統',
      description: '依學生英語分組提供單字、句子、拼字、聽力與口說練習。',
      availability: '依英語 A／B 組提供適合練習',
    },
  ],
  science: [
    {
      code: 'periodic-table',
      name: '元素週期表測驗',
      description: '練習元素中文名稱、元素符號與週期表位置，並可進入多人對戰。',
      availability: '八上 CH6 後都適用',
      launchUrl: '?game=periodic-table',
    },
  ],
}

function configuredLaunchUrl(system, englishVocabUrl) {
  return system?.launchUrl || (system?.code === 'english' ? englishVocabUrl : '')
}

export function subjectGamesFor(system, englishVocabUrl) {
  if (!system?.code) return []
  const fallbackUrl = configuredLaunchUrl(system, englishVocabUrl)
  const templates = subjectGameTemplates[system.code]

  if (templates) {
    return templates
      .map((game) => ({ ...game, launchUrl: game.launchUrl || fallbackUrl }))
      .filter((game) => Boolean(game.launchUrl))
  }

  if (!fallbackUrl) return []
  return [{
    code: `${system.code}-main`,
    name: `${system.name}學習系統`,
    description: system.description || `進入${system.name}的遊戲與自由練習。`,
    availability: '',
    launchUrl: fallbackUrl,
  }]
}

export function learningSystemLaunchUrl(system, englishVocabUrl) {
  if (subjectGamesFor(system, englishVocabUrl).length === 0) return ''
  return `?subject=${encodeURIComponent(system.code)}`
}
