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
  history: [
    {
      code: 'history-atlas',
      name: '歷史時光地圖',
      description: '用可搜尋、可篩選的時間軸，串起八年級中國與東亞的重要人物、制度與事件。',
      availability: '翰林八上、八下適用',
      launchUrl: '?history=atlas',
    },
  ],
  geography: [
    {
      code: 'geography-fill-map',
      name: '地理填圖學習系統',
      description: '依翰林版課本章節練習臺灣、中國與世界地理，包含位置、地形、氣候、水文與區域特色。',
      availability: '七上、八上全冊、九上第 1～2 章已開放',
      launchUrl: '?geography=maps',
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
