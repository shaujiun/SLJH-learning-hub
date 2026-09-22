export const subjectLearningSections = [
  { code: 'map', title: '學習地圖', description: '依冊別與章節探索學習內容。' },
  { code: 'basic', title: '基礎練習', description: '反覆練習核心知識與技能。' },
  { code: 'guided', title: '引導式學習', description: '跟著提示逐步理解與應用。' },
  { code: 'board', title: '線上桌遊', description: '透過遊戲與互動運用所學。' },
]

const subjectGameTemplates = {
  math: [
    {
      code: 'animal-equation',
      section: 'board',
      name: '根式馬戲團',
      description: '黎少奇老師設計。可選教學試玩、AI 練習或 4 人真人對戰；以根式出牌與動物牌計分。',
      availability: '八上第 2 章起適用',
      launchUrl: '?game=animal-equation',
    },
  ],
  english: [
    {
      code: 'english-vocabulary',
      section: 'basic',
      name: '英文單字學習系統',
      description: '依學生英語分組提供單字、句子、拼字、聽力與口說練習。',
      availability: '依英語 A／B 組提供適合練習',
    },
    {
      code: 'english-grammar',
      section: 'guided',
      name: '英語文法冒險',
      description: '依冊別與課次，透過提示、修正與解析逐步練習文法。',
      availability: '依已開放的冊別與課次練習',
      entry: 'grammar',
    },
    {
      code: 'english-reading',
      section: 'guided',
      name: '英語閱讀練習',
      description: '閱讀英文文章與翻譯，練習找原文依據、文法與國中 2000 單。',
      availability: '僅已登入的學生帳號可使用',
      requiresLogin: true,
      launchUrl: '?reading=practice',
    },
    {
      code: 'english-reading-workshop',
      section: 'guided',
      name: '英語閱讀編題工作台',
      description: '照片分區辨識、教師校對並預覽文章、翻譯、單字與題目；尚未發布學生版。',
      availability: '僅管理者草稿預覽',
      adminPreview: true,
      launchUrl: '?reading=workshop',
    },
  ],
  science: [
    {
      code: 'measurement-lab',
      section: 'guided',
      name: '量測實驗室',
      description: '走訪六個工作站，練習直尺、量筒與排水法的操作、讀值、單位及方法判斷。',
      availability: '封存中・僅管理者測試',
      adminPreview: true,
      launchUrl: '?game=measurement-lab',
    },
    {
      code: 'periodic-table',
      section: 'basic',
      name: '元素週期表測驗',
      description: '練習元素中文名稱、元素符號與週期表位置，並可進入多人對戰。',
      availability: '八上 CH6 後都適用',
      launchUrl: '?game=periodic-table',
    },
    {
      code: 'chemical-formula',
      section: 'guided',
      name: '化學事前哨站',
      description: '從粒子、電子得失與根離子開始，逐步判斷電荷並組成正確化學式。',
      availability: '八上第 6 章起適用',
      launchUrl: '?game=chemical-formula',
    },
  ],
  history: [
    {
      code: 'history-atlas',
      section: 'map',
      name: '歷史時光地圖',
      description: '用可搜尋、可篩選的時間軸，串起八年級中國與東亞的重要人物、制度與事件。',
      availability: '翰林八上、八下適用',
      launchUrl: '?history=atlas',
    },
  ],
  geography: [
    {
      code: 'geography-fill-map',
      section: 'guided',
      name: '地理填圖學習系統',
      description: '依翰林版課本章節練習臺灣、中國與世界地理，包含位置、地形、氣候、水文與區域特色。',
      availability: '七上、八上全冊、九上第 1～2 章已開放',
      launchUrl: '?geography=maps',
    },
    {
      code: 'geography-detective',
      section: 'guided',
      name: '地理偵探社',
      description: '閱讀地形、氣候、河川與農業線索，推理地區並理解判斷依據。',
      availability: '翰林八上第 1～2 章',
      launchUrl: '?geography=detective',
    },
  ],
}

function configuredLaunchUrl(system, englishVocabUrl) {
  return system?.launchUrl || (system?.code === 'english' ? englishVocabUrl : '')
}

function englishGrammarLaunchUrl(fallbackUrl) {
  if (!fallbackUrl) return ''
  try {
    const url = new URL(fallbackUrl)
    url.searchParams.set('entry', 'grammar')
    return url.toString()
  } catch {
    return ''
  }
}

export function subjectGamesFor(system, englishVocabUrl, { adminPreview = false, guestMode = false } = {}) {
  if (!system?.code) return []
  const fallbackUrl = configuredLaunchUrl(system, englishVocabUrl)
  const templates = subjectGameTemplates[system.code]

  if (templates) {
    return templates
      .filter((game) => (!game.adminPreview || adminPreview) && (!game.requiresLogin || !guestMode))
      .map((game) => ({
        ...game,
        launchUrl: game.entry === 'grammar'
          ? englishGrammarLaunchUrl(fallbackUrl)
          : game.launchUrl || fallbackUrl,
      }))
      .filter((game) => Boolean(game.launchUrl))
  }

  if (!fallbackUrl) return []
  return [{
    code: `${system.code}-main`,
    section: 'basic',
    name: `${system.name}學習系統`,
    description: system.description || `進入${system.name}的遊戲與自由練習。`,
    availability: '',
    launchUrl: fallbackUrl,
  }]
}

export function subjectSectionsFor(system, englishVocabUrl, options) {
  const games = subjectGamesFor(system, englishVocabUrl, options)
  return subjectLearningSections.map((section) => ({
    ...section,
    games: games.filter((game) => game.section === section.code),
  }))
}

export function learningSystemLaunchUrl(system, englishVocabUrl) {
  if (subjectGamesFor(system, englishVocabUrl).length === 0) return ''
  return `?subject=${encodeURIComponent(system.code)}`
}
