import { projectWorldPoint } from './russiaPhysicalGeometry.js'
import { southeastAsiaLocations } from './southeastAsiaMapData.js'

const allLevels = ['intro', 'basic', 'advanced']
const basicLevels = ['basic', 'advanced']

const answerCountryIds = ['mm', 'th', 'la', 'kh', 'vn', 'my', 'sg', 'id', 'bn', 'ph', 'tl']

export const southeastAsiaMap = {
  name: 'SoutheastAsia',
  viewBox: '720 365 175 145',
  locations: southeastAsiaLocations.filter((location) => answerCountryIds.includes(location.id)),
}

const countryRows = [
  ['mm', '緬甸', '中南半島西側，西鄰印度、東接泰國', allLevels],
  ['th', '泰國', '中南半島中央，國土向南延伸到馬來半島', allLevels],
  ['la', '寮國', '位於中南半島內陸，夾在泰國與越南之間', allLevels],
  ['kh', '柬埔寨', '位於泰國東南、越南西南，面向泰國灣', allLevels],
  ['vn', '越南', '位於中南半島東側，國土沿海岸呈南北狹長', allLevels],
  ['my', '馬來西亞', '國土分布在馬來半島南部與婆羅洲北部', allLevels],
  ['id', '印度尼西亞', '由赤道附近眾多島嶼組成，位於東南亞南側', allLevels],
  ['ph', '菲律賓', '位於越南東方、臺灣南方的群島國家', allLevels],
]

export const southeastAsiaCountryItems = [
  ...countryRows.map(([mapId, name, locationHint, levels]) => ({
    id: `southeast-asia-country-${mapId}`,
    mapId,
    mapKind: 'province',
    name,
    levels,
    hint: `先找${locationHint}，再觀察海岸線與鄰國。`,
    reason: `${name}的位置可由海陸分布、國土輪廓與相鄰國家共同判斷。`,
  })),
  {
    id: 'southeast-asia-country-sg',
    mapKind: 'point',
    pointType: 'country-location',
    name: '新加坡',
    levels: basicLevels,
    ...projectWorldPoint(103.8539, 1.295, 4.2, 8.5),
    hint: '往馬來半島最南端尋找面積很小的島國定位點。',
    reason: '新加坡位於馬來半島南端、麻六甲海峽東南出口附近。',
  },
  {
    id: 'southeast-asia-country-bn',
    mapKind: 'point',
    pointType: 'country-location',
    name: '汶萊',
    levels: basicLevels,
    ...projectWorldPoint(114.9333, 4.8833, 4.2, 8.5),
    hint: '往婆羅洲北岸、馬來西亞東部國土之間尋找。',
    reason: '汶萊位於婆羅洲北岸，國土被馬來西亞砂拉越分隔為兩部分。',
  },
  {
    id: 'southeast-asia-country-tl',
    mapKind: 'point',
    pointType: 'country-location',
    name: '東帝汶',
    levels: basicLevels,
    ...projectWorldPoint(125.5795, -8.5594, 4.2, 8.5),
    hint: '往小巽他群島東端、帝汶島東半部尋找。',
    reason: '東帝汶主要位於帝汶島東半部，南側隔帝汶海與澳洲相望。',
  },
]

const capitalRows = [
  ['naypyidaw', '奈比都', 96.1167, 19.7685, '緬甸', allLevels],
  ['bangkok', '曼谷', 100.5147, 13.7519, '泰國', allLevels],
  ['vientiane', '永珍', 102.6, 17.9667, '寮國', allLevels],
  ['phnom-penh', '金邊', 104.9147, 11.552, '柬埔寨', allLevels],
  ['hanoi', '河內', 105.8481, 21.0353, '越南', allLevels],
  ['kuala-lumpur', '吉隆坡', 101.6887, 3.1398, '馬來西亞', allLevels],
  ['singapore', '新加坡', 103.8539, 1.295, '新加坡', allLevels],
  ['jakarta', '雅加達', 106.8275, -6.1725, '印度尼西亞', allLevels],
  ['bandar-seri-begawan', '斯里巴加灣市', 114.9333, 4.8833, '汶萊', basicLevels],
  ['manila', '馬尼拉', 120.9803, 14.6061, '菲律賓', basicLevels],
  ['dili', '帝力', 125.5795, -8.5594, '東帝汶', basicLevels],
]

export const southeastAsiaCapitalItems = capitalRows.map(([id, name, longitude, latitude, country, levels]) => ({
  id: `southeast-asia-capital-${id}`,
  mapKind: 'point',
  pointType: 'capital',
  name,
  levels,
  ...projectWorldPoint(longitude, latitude, 3.8, 7.5),
  hint: `先找${country}的國土，再依海岸、河流或國土中央位置判斷。`,
  reason: `${name}是${country}的首都；圖上的圓點只表示都市位置，不表示國家範圍。`,
}))

function riverPath(segments) {
  return segments.map((segment) => segment.map(([longitude, latitude], index) => {
    const { x, y } = projectWorldPoint(longitude, latitude)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')).join(' ')
}

// 河道折線取自 Natural Earth 1:10m 河川中心線，僅做 Douglas-Peucker 簡化，
// 並使用與世界國界相同的 Mercator 投影，避免河流與國界在不同裝置上錯位。
const riverCoordinates = {
  irrawaddy: [[[97.486,25.701],[97.534,25.676],[97.421,25.33],[97.313,25.357],[97.233,25.186],[97.315,25.104],[97.214,25.086],[97.222,24.997],[97.034,24.823],[97.185,24.207],[96.929,24.128],[96.634,24.357],[96.438,24.303],[96.205,23.768],[96.02,23.555],[95.965,22.769],[95.901,22.707],[95.99,22.529],[96.041,21.923],[95.914,21.856],[95.776,21.932],[95.512,21.918],[95.33,21.464],[94.803,21.164],[94.82,20.972],[94.713,20.814],[94.905,20.365],[94.914,20.124],[95.16,19.823],[95.197,19.372],[95.113,19.015],[95.213,18.805],[95.063,18.562],[95.383,18.231],[95.458,17.726],[95.566,17.614],[95.548,17.5],[95.677,17.419],[95.589,17.303],[95.613,16.864],[95.335,16.758],[95.318,16.61],[94.992,16.251]]],
  red: [[[106.501,20.3],[106.267,20.331],[106.125,20.625],[105.915,20.81],[105.834,21.079],[105.494,21.174],[105.414,21.307],[105.292,21.267],[105.225,21.405],[105.188,21.342],[104.799,21.792],[103.52,22.911],[102.819,23.284],[102.136,23.481],[101.693,23.915],[101.319,24.541],[101.211,24.538],[100.819,25.025],[100.734,24.988],[100.351,25.133],[100.183,25.443]]],
  mekong: [
    [[101.564,17.821],[101.729,17.912],[101.79,18.074],[101.904,18.037],[102.078,18.214],[102.599,17.955],[102.595,17.841],[102.683,17.81],[102.852,17.972],[103.038,17.991],[103.092,18.141]],
    [[103.09,18.137],[103.295,18.288],[103.261,18.4],[103.386,18.442],[104.018,18.299],[104.452,17.666],[104.792,17.424],[104.754,16.529],[105.015,16.277],[105.058,16.121],[105.422,16.01],[105.36,15.92],[105.412,15.8],[105.65,15.635],[105.604,15.439],[105.483,15.335],[105.632,15.32],[105.767,15.133]],
    [[105.782,15.121],[105.897,15.004],[105.935,14.766],[105.816,14.103],[105.976,13.966],[106.037,13.686],[105.905,13.406],[106.046,13.155],[105.959,12.81],[106.048,12.331],[105.983,12.262],[105.572,12.294],[105.458,11.935],[105.184,11.94],[104.993,11.839],[104.952,11.595]],
    [[104.951,11.59],[105.258,11.398],[105.216,10.845],[105.348,10.765],[105.387,10.599],[105.8,10.32],[106.119,10.238]],
    [[104.951,11.59],[104.951,11.481],[105.05,11.444],[105.135,10.712],[105.838,10.005]],
  ],
  chaoPhraya: [
    [[100.141,15.707],[100.06,15.272],[100.242,15.169],[100.44,14.852],[100.427,14.376],[100.574,13.978],[100.495,13.695],[100.596,13.697],[100.543,13.64],[100.598,13.612]],
    [[100.083,15.237],[100.016,14.99],[100.147,14.651],[100.117,14.175],[100.193,13.79],[100.282,13.774],[100.205,13.714],[100.272,13.708],[100.22,13.627],[100.275,13.517]],
  ],
}

export const southeastAsiaRiverItems = [
  {
    id: 'southeast-asia-river-irrawaddy', mapKind: 'line', name: '伊洛瓦底江', levels: basicLevels,
    path: riverPath(riverCoordinates.irrawaddy),
    hint: '往緬甸中部尋找一條由北向南、注入安達曼海的河流。',
    reason: '伊洛瓦底江縱貫緬甸中部，沖積平原是緬甸重要農業區。',
  },
  {
    id: 'southeast-asia-river-red', mapKind: 'line', name: '紅河', levels: basicLevels,
    path: riverPath(riverCoordinates.red),
    hint: '往越南北部尋找注入北部灣、流經河內附近的河流。',
    reason: '紅河流經越南北部並形成三角洲，河內位於其下游地區。',
  },
  {
    id: 'southeast-asia-river-mekong', mapKind: 'line', name: '湄公河', levels: allLevels,
    path: riverPath(riverCoordinates.mekong),
    hint: '尋找流經寮國、泰國邊界、柬埔寨，最後在越南南部入海的長河。',
    reason: '湄公河流經多國，於越南南部形成廣大的湄公河三角洲。',
  },
  {
    id: 'southeast-asia-river-chao-phraya', mapKind: 'line', name: '昭披耶河', levels: allLevels,
    path: riverPath(riverCoordinates.chaoPhraya),
    hint: '往泰國中部尋找由北向南流經曼谷附近的河流。',
    reason: '昭披耶河流經泰國中部平原，沿岸人口與稻作集中，最後注入泰國灣。',
  },
]

export const southeastAsiaTopics = [
  {
    id: 'southeast-asia-countries',
    name: '東南亞國家',
    description: '依精確國界辨認 11 個國家',
    semester: '翰林八下第 1 章',
    courseConnection: '先分辨中南半島與南洋群島，再利用海岸線、鄰國與島嶼輪廓定位；小國改用菱形定位點，避免手機上無法點選。',
    map: southeastAsiaMap,
    mapLabel: '東南亞國家精確國界填圖地圖',
    items: southeastAsiaCountryItems,
  },
  {
    id: 'southeast-asia-capitals',
    name: '國家與首都',
    description: '首都位置與所屬國家配對',
    semester: '翰林八下第 1 章',
    courseConnection: '圓點只代表首都所在位置，不代表整個國家範圍；先確認國家，再判讀首都點位。',
    map: southeastAsiaMap,
    mapLabel: '東南亞首都精確點位地圖',
    items: southeastAsiaCapitalItems,
  },
  {
    id: 'southeast-asia-rivers',
    name: '四大河川',
    description: '河道、流向、平原與出海口',
    semester: '翰林八下第 1 章',
    courseConnection: '河川使用實際向量河道，先觀察所在國與出海方向，再連結沖積平原、稻作與人口分布。',
    map: southeastAsiaMap,
    mapLabel: '東南亞主要河川實際河道填圖地圖',
    items: southeastAsiaRiverItems,
  },
]

export const southeastAsiaChapters = [
  {
    id: 'grade8-lower-l01',
    name: '八下第 1 章　東南亞',
    shortName: '八下第 1 章',
    description: '練習東南亞國家、首都與主要河川，建立區域位置與自然環境基礎。',
    topicIds: ['southeast-asia-countries', 'southeast-asia-capitals', 'southeast-asia-rivers'],
  },
]

export function filterSoutheastAsiaItemsByDifficulty(items, difficultyId) {
  return items.filter((item) => (item.levels || allLevels).includes(difficultyId))
}
