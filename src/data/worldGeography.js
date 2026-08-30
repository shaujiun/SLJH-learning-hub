import { europeMap } from './europeMap.js'
import {
  europeClimateGeometry,
  europeLandformGeometry,
  europeMountainGeometry,
  europePhysicalMap,
  europeRiverGeometry,
  europeWaterAreaGeometry,
  europeWaterPointGeometry,
} from './europePhysicalGeometry.js'
import {
  europeRegionalMap,
  projectWorldPoint,
  russiaLandformGeometry,
  russiaMountainGeometry,
  russiaPhysicalMap,
  russiaWaterPointGeometry,
} from './russiaPhysicalGeometry.js'

export { europeMap } from './europeMap.js'
export { europePhysicalMap } from './europePhysicalGeometry.js'
export { russiaPhysicalMap } from './russiaPhysicalGeometry.js'
export { europeRegionalMap } from './russiaPhysicalGeometry.js'

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
  { id: 'world-europe-water-black-sea', mapKind: 'area', areaType: 'water', name: '黑海', levels: allLevels, hint: '往歐洲東南部、烏克蘭與土耳其之間尋找完整水域輪廓。', reason: '黑海位於歐洲東南部，北接烏克蘭、南接土耳其，多瑙河最後注入其西側。' },
  { id: 'world-europe-water-caspian', mapKind: 'area', areaType: 'water', name: '裏海', levels: basicLevels, hint: '往高加索山以東、歐亞交界尋找南北狹長的封閉水域。', reason: '裏海是世界最大的封閉內陸水體，西側接高加索地區，整體呈南北狹長形。' },
  { id: 'world-europe-water-gibraltar', mapKind: 'point', name: '直布羅陀海峽', levels: basicLevels, hint: '往西班牙最南端與非洲之間尋找。', reason: '直布羅陀海峽連接大西洋與地中海。' },
  { id: 'world-europe-water-english-channel', mapKind: 'point', name: '英吉利海峽', levels: basicLevels, hint: '往英國南側與法國北側之間尋找。', reason: '英吉利海峽位於英國與法國之間，向西連接大西洋、向東通往北海。' },
].map((item) => (item.mapKind === 'area'
  ? { ...item, path: europeWaterAreaGeometry[item.id] }
  : { ...item, ...europeWaterPointGeometry[item.id] }))

export const europeClimateItems = [
  { id: 'world-europe-climate-oceanic', mapKind: 'area', areaType: 'climate', name: '溫帶海洋性氣候', levels: allLevels, hint: '往大西洋沿岸的西歐尋找，受西風與暖流調節最明顯。', reason: '西歐終年受西風與北大西洋暖流影響，全年有雨、年溫差較小。' },
  { id: 'world-europe-climate-continental', mapKind: 'area', areaType: 'climate', name: '溫帶大陸性氣候', levels: allLevels, hint: '往中歐至東歐內陸尋找，距離大西洋越遠越明顯。', reason: '由西向東距海漸遠，海洋調節減弱，因此年溫差增大、降水減少。' },
  { id: 'world-europe-climate-mediterranean', mapKind: 'area', areaType: 'climate', name: '溫帶地中海型氣候', levels: allLevels, hint: '往地中海沿岸的南歐尋找。', reason: '南歐地中海沿岸夏季受副熱帶高壓影響而乾燥，冬季受西風影響而有雨。' },
  { id: 'world-europe-climate-subarctic', mapKind: 'area', areaType: 'climate', name: '副極地大陸性氣候', levels: allLevels, hint: '往北歐與俄羅斯北部的高緯地區尋找。', reason: '北歐與俄羅斯北部緯度高，冬季漫長寒冷，暖季短暫。' },
].map((item) => ({ ...item, path: europeClimateGeometry[item.id] }))

const l02SupplementCountryItems = [
  ['ie', '愛爾蘭', '英國西側的大西洋島嶼', '位於不列顛群島西側，與英國隔愛爾蘭海相望。'],
  ['lu', '盧森堡', '法國、德國與比利時之間', '位於西歐內陸，是法國、德國與比利時之間的小國。'],
  ['ua', '烏克蘭', '東歐平原、黑海北側', '位於俄羅斯西南方，南側面向黑海。'],
].map(([mapId, name, locationHint, reason]) => ({
  id: `world-europe-country-${mapId}`,
  mapId,
  mapKind: 'province',
  name,
  levels: allLevels,
  hint: `先找${locationHint}，再觀察鄰國與海岸線。`,
  reason,
}))

const europeCountryByMapId = Object.fromEntries(
  [...europeCountryItems, ...l02SupplementCountryItems].map((item) => [item.mapId, item]),
)

function regionalCountry(mapId, levels = allLevels) {
  return { ...europeCountryByMapId[mapId], levels }
}

function capitalItem(id, name, lon, lat, locationHint, reason, levels = allLevels) {
  return {
    id: `world-europe-capital-${id}`,
    mapKind: 'point',
    name,
    levels,
    hint: locationHint,
    reason,
    ...projectWorldPoint(lon, lat),
  }
}

export const northEastEuropeItems = [
  regionalCountry('is', basicLevels),
  regionalCountry('dk'),
  regionalCountry('no'),
  regionalCountry('se'),
  regionalCountry('fi'),
  regionalCountry('pl'),
  regionalCountry('ua'),
  regionalCountry('cz'),
  capitalItem('copenhagen', '哥本哈根', 12.5683, 55.6761, '先找丹麥，再找日德蘭半島東側的島嶼。', '哥本哈根是丹麥首都，位於西蘭島東岸。'),
  capitalItem('warsaw', '華沙', 21.0122, 52.2297, '先找波蘭，再往國土中東部尋找。', '華沙是波蘭首都，位於維斯瓦河沿岸。'),
  capitalItem('kyiv', '基輔', 30.5234, 50.4501, '先找烏克蘭，再往國土北部偏中尋找。', '基輔是烏克蘭首都，位於第聶伯河沿岸。'),
  capitalItem('prague', '布拉格', 14.4378, 50.0755, '先找捷克，再往國土西部偏中尋找。', '布拉格是捷克首都，位於伏爾塔瓦河沿岸。'),
]

export const southWestEuropeItems = [
  regionalCountry('ie', basicLevels),
  regionalCountry('gb'),
  regionalCountry('nl', basicLevels),
  regionalCountry('be', basicLevels),
  regionalCountry('lu', advancedOnly),
  regionalCountry('fr'),
  regionalCountry('de'),
  regionalCountry('ch', advancedOnly),
  regionalCountry('at', advancedOnly),
  regionalCountry('pt', basicLevels),
  regionalCountry('es'),
  regionalCountry('it'),
  regionalCountry('gr', basicLevels),
  {
    id: 'world-europe-country-mt',
    mapKind: 'point',
    name: '馬爾他',
    levels: advancedOnly,
    hint: '往義大利西西里島南方的地中海尋找小島國。',
    reason: '馬爾他位於地中海中部、義大利西西里島南方。',
    ...projectWorldPoint(14.3754, 35.9375, 5, 11),
  },
  capitalItem('london', '倫敦', -0.1276, 51.5074, '先找英國，再往英格蘭東南部尋找。', '倫敦是英國首都，位於泰晤士河沿岸。'),
  capitalItem('paris', '巴黎', 2.3522, 48.8566, '先找法國，再往國土北部尋找。', '巴黎是法國首都，位於塞納河沿岸。'),
  capitalItem('berlin', '柏林', 13.405, 52.52, '先找德國，再往國土東北部尋找。', '柏林是德國首都，位置較接近德國東部。'),
  capitalItem('madrid', '馬德里', -3.7038, 40.4168, '先找西班牙，再往伊比利半島中央尋找。', '馬德里是西班牙首都，位於國土中央的高原地區。'),
  capitalItem('rome', '羅馬', 12.4964, 41.9028, '先找義大利半島，再往中部西岸尋找。', '羅馬是義大利首都，位於義大利半島中部偏西。'),
  capitalItem('amsterdam', '阿姆斯特丹', 4.9041, 52.3676, '先找荷蘭，再往國土西部尋找。', '阿姆斯特丹是荷蘭首都，位於低地國西部。', basicLevels),
  capitalItem('brussels', '布魯塞爾', 4.3517, 50.8503, '先找比利時，再往國土中央尋找。', '布魯塞爾是比利時首都，也是歐盟重要機構所在地。', basicLevels),
  capitalItem('lisbon', '里斯本', -9.1393, 38.7223, '先找葡萄牙，再往大西洋沿岸尋找。', '里斯本是葡萄牙首都，位於伊比利半島西岸。', basicLevels),
  capitalItem('athens', '雅典', 23.7275, 37.9838, '先找希臘，再往國土東南側尋找。', '雅典是希臘首都，位於希臘本土東南部。', basicLevels),
  capitalItem('bern', '伯恩', 7.4474, 46.948, '先找瑞士，再往國土西部尋找。', '伯恩是瑞士聯邦政府所在地，位於瑞士西部。', advancedOnly),
  capitalItem('vienna', '維也納', 16.3738, 48.2082, '先找奧地利，再往國土東部尋找。', '維也納是奧地利首都，位於多瑙河沿岸。', advancedOnly),
]

export const russiaLandformItems = [
  { id: 'world-russia-landform-east-european-plain', mapKind: 'area', areaType: 'landform', name: '歐俄平原', levels: allLevels, hint: '往烏拉爾山以西、俄羅斯歐洲部分尋找。', reason: '歐俄平原位於烏拉爾山以西，是俄羅斯人口與都市較集中的核心區。' },
  { id: 'world-russia-landform-west-siberian-plain', mapKind: 'area', areaType: 'landform', name: '西部西伯利亞平原', levels: allLevels, hint: '往烏拉爾山以東、葉尼塞河以西尋找。', reason: '西部西伯利亞平原位於烏拉爾山與葉尼塞河之間，地勢低平、沼澤廣布。' },
  { id: 'world-russia-landform-central-siberian-plateau', mapKind: 'area', areaType: 'landform', name: '中部西伯利亞高原', levels: allLevels, hint: '往葉尼塞河以東、勒拿河以西尋找。', reason: '中部西伯利亞高原位於葉尼塞河與勒拿河之間，地勢較西部平原高。' },
  { id: 'world-russia-landform-east-siberian-mountains', mapKind: 'area', areaType: 'landform', name: '東部西伯利亞山地', levels: allLevels, hint: '往勒拿河以東、太平洋沿岸方向尋找。', reason: '東部西伯利亞山地位於俄羅斯東部，山地廣布並接近太平洋板塊活動帶。' },
].map((item) => ({ ...item, path: russiaLandformGeometry[item.id] }))

export const russiaMountainWaterItems = [
  { id: 'world-russia-mountain-urals', mapKind: 'line', lineType: 'mountain', name: '烏拉爾山', levels: allLevels, hint: '尋找俄羅斯西部南北走向的歐亞分界山脈。', reason: '烏拉爾山是東歐平原與西部西伯利亞平原的分界，也是常用的歐亞分界。', path: russiaMountainGeometry['world-russia-mountain-urals'] },
  { id: 'world-russia-mountain-caucasus', mapKind: 'line', lineType: 'mountain', name: '高加索山', levels: allLevels, hint: '往黑海與裏海之間尋找。', reason: '高加索山位於黑海與裏海之間，地勢高聳，也是歐亞分界的一部分。', path: russiaMountainGeometry['world-russia-mountain-caucasus'] },
  { id: 'world-russia-mountain-tannu-ola', mapKind: 'line', lineType: 'mountain', name: '唐努烏拉山', levels: basicLevels, hint: '往俄羅斯南側、蒙古西北方尋找。', reason: '唐努烏拉山位於俄羅斯與蒙古交界附近，是南西伯利亞山地的一部分。', path: russiaMountainGeometry['world-russia-mountain-tannu-ola'] },
  { id: 'world-russia-water-arctic', mapKind: 'point', name: '北極海', levels: allLevels, hint: '往俄羅斯北側廣大的海域尋找。', reason: '俄羅斯北側面向北極海，海岸線漫長且高緯海域冬季結冰。', ...russiaWaterPointGeometry['world-russia-water-arctic'] },
  { id: 'world-russia-water-baltic', mapKind: 'point', name: '波羅的海', levels: allLevels, hint: '往俄羅斯西側、北歐與東歐之間尋找。', reason: '俄羅斯可經波羅的海通往北海與大西洋，聖彼得堡即位於其沿岸。', ...russiaWaterPointGeometry['world-russia-water-baltic'] },
  { id: 'world-russia-water-black-sea', mapKind: 'area', areaType: 'water', name: '黑海', levels: allLevels, hint: '往俄羅斯西南方、烏克蘭與土耳其之間尋找。', reason: '黑海位於俄羅斯西南側，經土耳其海峽可通往地中海。', path: europeWaterAreaGeometry['world-europe-water-black-sea'] },
  { id: 'world-russia-water-caspian', mapKind: 'area', areaType: 'water', name: '裏海', levels: basicLevels, hint: '往高加索山以東尋找南北狹長的封閉水域。', reason: '裏海是封閉的內陸水體，俄羅斯位於其西北岸。', path: europeWaterAreaGeometry['world-europe-water-caspian'] },
  { id: 'world-russia-water-bering-strait', mapKind: 'point', name: '白令海峽', levels: basicLevels, hint: '往俄羅斯最東端與北美洲阿拉斯加之間尋找。', reason: '白令海峽分隔亞洲與北美洲，也連接北極海與太平洋海域。', ...russiaWaterPointGeometry['world-russia-water-bering-strait'] },
]

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
  {
    id: 'world-north-east-europe-regions',
    name: '北歐與東歐國家、首都',
    description: '依教師版填圖辨識 8 個國家與 4 個首都',
    semester: '翰林九上 L02',
    courseConnection: '國家以精確國界作答；首都以城市點位作答，避免把國家範圍和都市位置混為一談。',
    map: europeMap,
    mapLabel: '北歐與東歐國家及首都精確填圖地圖',
    items: northEastEuropeItems,
  },
  {
    id: 'world-south-west-europe-regions',
    name: '南歐與西歐國家、首都',
    description: '依教師版填圖辨識 14 個國家與 11 個首都',
    semester: '翰林九上 L02',
    courseConnection: '小國與首都會使用較大的點按範圍；馬爾他以島嶼位置點作答，其餘國家維持精確國界。',
    map: europeRegionalMap,
    mapLabel: '南歐與西歐國家及首都精確填圖地圖',
    items: southWestEuropeItems,
  },
  {
    id: 'world-russia-landforms',
    name: '俄羅斯四大地形區',
    description: '歐俄平原、西部西伯利亞平原、中部高原與東部山地',
    semester: '翰林九上 L02',
    courseConnection: '由西向東依序判讀四大地形區；色塊以俄羅斯國界裁切，不代表鄰國也屬於同一題答案。',
    map: russiaPhysicalMap,
    mapLabel: '俄羅斯四大地形區填圖地圖',
    items: russiaLandformItems,
  },
  {
    id: 'world-russia-mountains-waters',
    name: '俄羅斯山脈與海域',
    description: '三座重要山脈與五個周邊海域、海峽',
    semester: '翰林九上 L02',
    courseConnection: '先用烏拉爾山辨認歐亞與地形分界，再連結俄羅斯面向北極海、波羅的海、黑海與太平洋的出海方向。',
    map: russiaPhysicalMap,
    mapLabel: '俄羅斯主要山脈與周邊海域填圖地圖',
    items: russiaMountainWaterItems,
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
  {
    id: 'grade9-upper-l02',
    name: '九上第 2 章　歐洲區域特色與俄羅斯',
    shortName: '九上第 2 章',
    description: '練習歐洲分區國家與首都，以及俄羅斯地形、山脈與周邊海域。',
    topicIds: [
      'world-north-east-europe-regions',
      'world-south-west-europe-regions',
      'world-russia-landforms',
      'world-russia-mountains-waters',
    ],
  },
]

export function filterWorldItemsByDifficulty(items, difficultyId) {
  return items.filter((item) => (item.levels || allLevels).includes(difficultyId))
}
