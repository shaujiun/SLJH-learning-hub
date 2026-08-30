import { europeMap } from './europeMap.js'

export { europeMap } from './europeMap.js'

const allLevels = ['intro', 'basic', 'advanced']
const basicLevels = ['basic', 'advanced']
const advancedOnly = ['advanced']

const europeCountryRows = [
  ['gb', '英國', '西歐外海的不列顛群島', '位於歐洲西北方，隔英吉利海峽與法國相望。', allLevels],
  ['fr', '法國', '歐洲西部、大西洋東岸', '西臨大西洋，北接比利時，東側與德國、瑞士相鄰。', allLevels],
  ['de', '德國', '歐洲中部', '位於法國以東、波蘭以西，是中歐的重要國家。', allLevels],
  ['es', '西班牙', '伊比利半島的大部分', '位於歐洲西南端，與葡萄牙共同位於伊比利半島。', allLevels],
  ['it', '義大利', '向地中海伸出的靴形半島', '位於歐洲南部，國土輪廓像長靴伸入地中海。', allLevels],
  ['ru', '俄羅斯', '歐洲東部並向亞洲延伸', '國土橫跨歐洲與亞洲，歐洲部分位於東歐平原。', allLevels],
  ['no', '挪威', '斯堪地那維亞半島西側', '位於北歐，海岸曲折並以峽灣地形著名。', basicLevels],
  ['se', '瑞典', '斯堪地那維亞半島東側', '位於挪威以東、波羅的海以西。', basicLevels],
  ['fi', '芬蘭', '北歐東側、瑞典與俄羅斯之間', '西鄰瑞典、東鄰俄羅斯，南側面向波羅的海。', basicLevels],
  ['is', '冰島', '歐洲西北方的北大西洋島國', '位於英國西北方、北大西洋上，接近北極圈。', basicLevels],
  ['dk', '丹麥', '德國北方、北海與波羅的海之間', '由日德蘭半島與周圍島嶼組成，是北歐南端的國家。', basicLevels],
  ['pt', '葡萄牙', '伊比利半島西側', '位於西班牙西側，西臨大西洋。', basicLevels],
  ['nl', '荷蘭', '德國西側、北海沿岸', '位於歐洲西北部，萊茵河下游並面向北海。', basicLevels],
  ['be', '比利時', '法國北側、荷蘭南側', '位於法國、荷蘭與德國之間，是西歐面積較小的國家。', basicLevels],
  ['pl', '波蘭', '德國以東、俄羅斯以西', '位於中東歐平原，西鄰德國、東側接近白俄羅斯與烏克蘭。', basicLevels],
  ['gr', '希臘', '巴爾幹半島南端', '位於歐洲東南部，周圍分布許多愛琴海島嶼。', basicLevels],
  ['ch', '瑞士', '阿爾卑斯山區、法國與義大利之間', '位於歐洲中部的內陸國，阿爾卑斯山橫亙其境。', advancedOnly],
  ['at', '奧地利', '瑞士以東、匈牙利以西', '位於中歐內陸，多瑙河由西向東流過。', advancedOnly],
  ['cz', '捷克', '德國東南側、奧地利北側', '位於中歐內陸，西鄰德國、南鄰奧地利。', advancedOnly],
  ['hu', '匈牙利', '奧地利以東的多瑙河中游', '位於喀爾巴阡盆地，多瑙河流經其境。', advancedOnly],
]

export const europeCountryItems = europeCountryRows.map(([mapId, name, locationHint, reason, levels]) => ({
  id: `world-europe-country-${mapId}`,
  mapId,
  mapKind: 'province',
  name,
  levels,
  hint: `先找${locationHint}，再觀察鄰國與海岸線。`,
  reason,
}))

export const worldGeographyTopics = [
  {
    id: 'world-europe-countries',
    name: '歐洲國家填圖',
    description: '北歐、西歐、中歐、南歐與俄羅斯',
    semester: '翰林九上 L01～L02',
    courseConnection: '先掌握歐洲主要國家位置，再連結氣候、產業、都市與區域特色。',
    map: europeMap,
    mapLabel: '歐洲國家精確國界填圖地圖',
    items: europeCountryItems,
  },
]

export const worldGeographyChapters = [
  {
    id: 'grade9-upper-l01',
    name: '九上第 1 章　歐洲概述',
    shortName: '九上第 1 章',
    description: '先以共用精確國界底圖辨認歐洲主要國家。',
    topicIds: ['world-europe-countries'],
  },
]

export function filterWorldItemsByDifficulty(items, difficultyId) {
  return items.filter((item) => (item.levels || allLevels).includes(difficultyId))
}
