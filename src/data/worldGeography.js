import { europeMap } from './europeMap.js'
import {
  europeClimateGeometry,
  europeLandformGeometry,
  europeMountainGeometry,
  europePhysicalMap,
  europeRiverGeometry,
  europeWaterPointGeometry,
} from './europePhysicalGeometry.js'

export { europeMap } from './europeMap.js'
export { europePhysicalMap } from './europePhysicalGeometry.js'

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

export const europeLandformItems = [
  { id: 'world-europe-landform-european-plain', mapKind: 'area', areaType: 'landform', name: '歐洲大平原', levels: allLevels, hint: '從法國北部向東，經低地國與德國、波蘭尋找連續低平地帶。', reason: '歐洲大平原由法國北部向東延伸至波蘭，地勢低平、交通便利，是人口與都市密集區。' },
  { id: 'world-europe-landform-russian-plain', mapKind: 'area', areaType: 'landform', name: '歐俄平原', levels: allLevels, hint: '往東歐與俄羅斯歐洲部分、烏拉爾山以西尋找。', reason: '歐俄平原位於俄羅斯的歐洲部分，西接歐洲大平原，東至烏拉爾山。' },
  { id: 'world-europe-landform-scandinavia', mapKind: 'area', areaType: 'landform', name: '斯堪地那維亞半島', levels: allLevels, hint: '往北歐的挪威與瑞典尋找南北狹長的大半島。', reason: '斯堪地那維亞半島位於北歐，主要包括挪威、瑞典及芬蘭西北部。' },
  { id: 'world-europe-landform-iberia', mapKind: 'area', areaType: 'landform', name: '伊比利半島', levels: allLevels, hint: '往歐洲西南端的西班牙、葡萄牙尋找。', reason: '伊比利半島位於歐洲西南端，主要由西班牙與葡萄牙構成。' },
  { id: 'world-europe-landform-italy', mapKind: 'area', areaType: 'landform', name: '義大利半島', levels: allLevels, hint: '尋找伸入地中海、外形像長靴的半島。', reason: '義大利半島由阿爾卑斯山南側伸入地中海，輪廓像長靴。' },
  { id: 'world-europe-landform-balkans', mapKind: 'area', areaType: 'landform', name: '巴爾幹半島', levels: allLevels, hint: '往歐洲東南部、亞得里亞海與黑海之間尋找。', reason: '巴爾幹半島位於歐洲東南部，地形破碎、國家眾多。' },
].map((item) => ({ ...item, path: europeLandformGeometry[item.id] }))

export const europeMountainItems = [
  { id: 'world-europe-mountain-urals', mapKind: 'line', name: '烏拉爾山', levels: allLevels, hint: '往俄羅斯境內尋找南北走向、分隔歐亞的山脈。', reason: '烏拉爾山大致呈南北走向，是歐洲與亞洲常用的自然分界。' },
  { id: 'world-europe-mountain-caucasus', mapKind: 'line', name: '高加索山', levels: allLevels, hint: '往黑海與裏海之間尋找。', reason: '高加索山位於黑海與裏海之間，也是歐亞分界的一部分。' },
  { id: 'world-europe-mountain-pyrenees', mapKind: 'line', name: '庇里牛斯山', levels: allLevels, hint: '尋找法國與西班牙交界的山脈。', reason: '庇里牛斯山位於法國與西班牙之間，形成伊比利半島北側的天然屏障。' },
  { id: 'world-europe-mountain-alps', mapKind: 'line', name: '阿爾卑斯山', levels: allLevels, hint: '往法國東南、瑞士、奧地利與義大利北部尋找。', reason: '阿爾卑斯山橫跨歐洲中南部，是年輕褶曲山脈與重要水源區。' },
  { id: 'world-europe-mountain-carpathians', mapKind: 'line', name: '喀爾巴阡山', levels: allLevels, hint: '往中東歐尋找呈弧形環繞盆地的山脈。', reason: '喀爾巴阡山呈弧形分布於中東歐，環繞喀爾巴阡盆地的東、北側。' },
].map((item) => ({ ...item, lineType: 'mountain', path: europeMountainGeometry[item.id] }))

export const europeRiverItems = [
  { id: 'world-europe-river-rhine', mapKind: 'line', name: '萊茵河', levels: allLevels, hint: '由阿爾卑斯山區向北流，最後注入北海。', reason: '萊茵河由阿爾卑斯山區向北流經西歐工業區，於荷蘭注入北海，航運價值高。', path: europeRiverGeometry.Rhine },
  { id: 'world-europe-river-danube', mapKind: 'line', name: '多瑙河', levels: allLevels, hint: '由德國南部向東流，穿越多個中東歐國家後注入黑海。', reason: '多瑙河自西向東流經中東歐多國，最後注入黑海，是重要的國際河川。', path: europeRiverGeometry.Danube },
]

export const europeWaterItems = [
  { id: 'world-europe-water-atlantic', mapKind: 'point', name: '大西洋', levels: allLevels, hint: '往歐洲西側廣大外海尋找。', reason: '大西洋位於歐洲西側，暖流與西風深刻影響西歐氣候。' },
  { id: 'world-europe-water-arctic', mapKind: 'point', name: '北極海', levels: allLevels, hint: '往歐洲最北方尋找。', reason: '北極海位於歐洲北方，沿岸高緯地區氣候寒冷。' },
  { id: 'world-europe-water-mediterranean', mapKind: 'point', name: '地中海', levels: allLevels, hint: '往歐洲南方、歐洲與非洲之間尋找。', reason: '地中海位於歐洲南方，是歐洲、亞洲與非洲之間的重要海域。' },
  { id: 'world-europe-water-north-sea', mapKind: 'point', name: '北海', levels: allLevels, hint: '往英國與北歐、低地國之間尋找。', reason: '北海位於英國以東、挪威與丹麥以西，周邊港口與油氣資源重要。' },
  { id: 'world-europe-water-baltic', mapKind: 'point', name: '波羅的海', levels: allLevels, hint: '往瑞典、芬蘭與波蘭之間尋找。', reason: '波羅的海位於北歐與東歐之間，經丹麥附近海峽與北海相通。' },
  { id: 'world-europe-water-black-sea', mapKind: 'point', name: '黑海', levels: allLevels, hint: '往歐洲東南部、烏克蘭與土耳其之間尋找。', reason: '黑海位於歐洲東南部，多瑙河最後注入此海域。' },
  { id: 'world-europe-water-caspian', mapKind: 'point', name: '裏海', levels: basicLevels, hint: '往高加索山以東、歐亞交界的內陸尋找。', reason: '裏海是世界最大的封閉內陸水體，位於高加索山與中亞之間。' },
  { id: 'world-europe-water-gibraltar', mapKind: 'point', name: '直布羅陀海峽', levels: basicLevels, hint: '往西班牙最南端與非洲之間尋找。', reason: '直布羅陀海峽連接大西洋與地中海。' },
  { id: 'world-europe-water-english-channel', mapKind: 'point', name: '英吉利海峽', levels: basicLevels, hint: '往英國南側與法國北側之間尋找。', reason: '英吉利海峽位於英國與法國之間，向西連接大西洋、向東通往北海。' },
].map((item) => ({ ...item, ...europeWaterPointGeometry[item.id] }))

export const europeClimateItems = [
  { id: 'world-europe-climate-oceanic', mapKind: 'area', areaType: 'climate', name: '溫帶海洋性氣候', levels: allLevels, hint: '往大西洋沿岸的西歐尋找，受西風與暖流調節最明顯。', reason: '西歐終年受西風與北大西洋暖流影響，全年有雨、年溫差較小。' },
  { id: 'world-europe-climate-continental', mapKind: 'area', areaType: 'climate', name: '溫帶大陸性氣候', levels: allLevels, hint: '往中歐至東歐內陸尋找，距離大西洋越遠越明顯。', reason: '由西向東距海漸遠，海洋調節減弱，因此年溫差增大、降水減少。' },
  { id: 'world-europe-climate-mediterranean', mapKind: 'area', areaType: 'climate', name: '溫帶地中海型氣候', levels: allLevels, hint: '往地中海沿岸的南歐尋找。', reason: '南歐地中海沿岸夏季受副熱帶高壓影響而乾燥，冬季受西風影響而有雨。' },
  { id: 'world-europe-climate-subarctic', mapKind: 'area', areaType: 'climate', name: '副極地大陸性氣候', levels: allLevels, hint: '往北歐與俄羅斯北部的高緯地區尋找。', reason: '北歐與俄羅斯北部緯度高，冬季漫長寒冷，暖季短暫。' },
].map((item) => ({ ...item, path: europeClimateGeometry[item.id] }))

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
  {
    id: 'world-europe-landforms',
    name: '平原與半島',
    description: '兩大平原與四個重要半島',
    semester: '翰林九上 L01',
    map: europePhysicalMap,
    mapLabel: '歐洲平原與半島填圖地圖',
    items: europeLandformItems,
  },
  {
    id: 'world-europe-mountains',
    name: '歐洲主要山脈',
    description: '烏拉爾、高加索、庇里牛斯、阿爾卑斯與喀爾巴阡山',
    semester: '翰林九上 L01',
    map: europePhysicalMap,
    mapLabel: '歐洲主要山脈填圖地圖',
    items: europeMountainItems,
  },
  {
    id: 'world-europe-rivers',
    name: '萊茵河與多瑙河',
    description: '判讀流向、出海口與航運價值',
    semester: '翰林九上 L01',
    map: europePhysicalMap,
    mapLabel: '歐洲主要河川填圖地圖',
    items: europeRiverItems,
  },
  {
    id: 'world-europe-waters',
    name: '海域與海峽',
    description: '大西洋、北極海、地中海與周邊水域',
    semester: '翰林九上 L01',
    map: europePhysicalMap,
    mapLabel: '歐洲海域與海峽填圖地圖',
    items: europeWaterItems,
  },
  {
    id: 'world-europe-climate',
    name: '歐洲氣候分布',
    description: '海洋性、大陸性、地中海型與副極地氣候',
    semester: '翰林九上 L01',
    courseConnection: '氣候分界是過渡帶；練習重點是理解緯度、西風、暖流與距海遠近造成的分布差異。',
    map: europePhysicalMap,
    mapLabel: '歐洲主要氣候類型示意分布圖',
    items: europeClimateItems,
  },
]

export const worldGeographyChapters = [
  {
    id: 'grade9-upper-l01',
    name: '九上第 1 章　歐洲概述',
    shortName: '九上第 1 章',
    description: '練習歐洲國家、平原半島、山河海域與主要氣候類型。',
    topicIds: ['world-europe-countries', 'world-europe-landforms', 'world-europe-mountains', 'world-europe-rivers', 'world-europe-waters', 'world-europe-climate'],
  },
]

export function filterWorldItemsByDifficulty(items, difficultyId) {
  return items.filter((item) => (item.levels || allLevels).includes(difficultyId))
}
