import {
  chinaLakeGeometry,
  chinaRiverGeometry,
  chinaSeaGeometry,
} from './geographyHydrography.js'

const provinceRegionHints = {
  northeast: '先找中國東北部，觀察它與俄羅斯、北韓及渤海的位置關係。',
  north: '先找華北與內蒙古一帶，再用海岸線或鄰近省區縮小範圍。',
  east: '先找中國東部沿海或長江、黃河下游，再辨認相鄰省區。',
  central: '先找中國中部，利用長江、黃河及南北相鄰位置判斷。',
  south: '先找中國南部沿海，留意珠江口、北部灣及南海的位置。',
  southwest: '先找中國西南部，利用青藏高原、四川盆地或邊境位置判斷。',
  northwest: '先找中國西北部，觀察沙漠、高原及與中亞相鄰的位置。',
}

const provinceRows = [
  ['heilongjiang', '黑龍江', 'northeast', '位於中國最東北，北、東側鄰近俄羅斯。'],
  ['jilin', '吉林', 'northeast', '位於黑龍江以南、遼寧以北，東南側鄰近北韓。'],
  ['liaoning', '遼寧', 'northeast', '位於東北地區南端，南側伸向渤海與黃海。'],
  ['beijing', '北京', 'north', '位於河北境內北部，是四個直轄市之一。'],
  ['tianjin', '天津', 'north', '位於北京東南、渤海沿岸，是四個直轄市之一。'],
  ['hebei', '河北', 'north', '環繞北京、天津，東側臨渤海。'],
  ['shanxi', '山西', 'north', '位於太行山以西，東側與河北相鄰。'],
  ['nei-mongol', '內蒙古', 'north', '呈狹長形橫跨中國北部，北側鄰蒙古與俄羅斯。'],
  ['shandong', '山東', 'east', '位於黃河下游，山東半島伸入渤海與黃海之間。'],
  ['jiangsu', '江蘇', 'east', '位於山東以南、長江下游北岸，東臨黃海。'],
  ['anhui', '安徽', 'east', '位於江蘇以西，長江與淮河皆流經境內。'],
  ['shanghai', '上海', 'east', '位於長江出海口南側，是四個直轄市之一。'],
  ['zhejiang', '浙江', 'east', '位於上海以南、福建以北，東臨東海。'],
  ['jiangxi', '江西', 'east', '位於長江以南，介於湖南、湖北與福建、浙江之間。'],
  ['fujian', '福建', 'east', '位於中國東南沿海，隔臺灣海峽與臺灣相望。'],
  ['henan', '河南', 'central', '位於黃河中下游，地處中國中部。'],
  ['hubei', '湖北', 'central', '位於長江中游，名稱表示洞庭湖以北。'],
  ['hunan', '湖南', 'central', '位於湖北以南，名稱表示洞庭湖以南。'],
  ['guangdong', '廣東', 'south', '位於南海沿岸，珠江三角洲位於其南部。'],
  ['guangxi-zhuang', '廣西壯族自治區', 'south', '位於廣東以西，南臨北部灣並與越南相鄰。'],
  ['hainan', '海南', 'south', '主要位於海南島，隔瓊州海峽與廣東相望。'],
  ['hong-kong', '香港', 'south', '位於珠江口東側，屬特別行政區。'],
  ['macau', '澳門', 'south', '位於珠江口西側，屬特別行政區。'],
  ['chongqing', '重慶', 'southwest', '位於四川盆地東部、長江沿岸，是四個直轄市之一。'],
  ['sichuan', '四川', 'southwest', '位於中國西南部，四川盆地是重要判斷線索。'],
  ['guizhou', '貴州', 'southwest', '位於四川、重慶以南，雲南以東。'],
  ['yunnan', '雲南', 'southwest', '位於中國西南邊境，鄰近緬甸、寮國與越南。'],
  ['xizang', '西藏自治區', 'southwest', '位於青藏高原西南部，南側為喜馬拉雅山。'],
  ['shaanxi', '陝西', 'northwest', '南北狹長，秦嶺橫貫南部，與山西隔黃河相望。'],
  ['gansu', '甘肅', 'northwest', '呈狹長走廊狀，連接黃土高原與中國西北地區。'],
  ['quinghai', '青海', 'northwest', '位於青藏高原東北部，是黃河與長江上游源區之一。'],
  ['ningxia-hui', '寧夏回族自治區', 'northwest', '位於甘肅東北與內蒙古之間，黃河流經境內。'],
  ['xinjiang-uygur', '新疆維吾爾自治區', 'northwest', '位於中國西北端，天山分隔準噶爾與塔里木盆地。'],
]

export const chinaProvinceItems = provinceRows.map(([mapId, name, region, reason]) => ({
  id: `province-${mapId}`,
  mapId,
  mapKind: 'province',
  name,
  hint: provinceRegionHints[region],
  reason,
}))

export const chinaTerrainItems = [
  { id: 'terrain-qinghai-tibet', mapKind: 'point', x: 235, y: 377, name: '青藏高原', hint: '它位於中國西南部，平均海拔最高。', reason: '青藏高原位於中國地勢第一級階梯，有「世界屋脊」之稱。' },
  { id: 'terrain-inner-mongolia', mapKind: 'point', x: 435, y: 224, name: '內蒙古高原', hint: '它位於中國北部，形狀大致由東北向西南延伸。', reason: '內蒙古高原位於中國北部，是地勢第二級階梯的重要高原。' },
  { id: 'terrain-loess', mapKind: 'point', x: 440, y: 316, name: '黃土高原', hint: '它位於秦嶺以北、太行山以西。', reason: '黃土高原黃土廣布，位於內蒙古高原以南、青藏高原以東。' },
  { id: 'terrain-yungui', mapKind: 'point', x: 430, y: 448, name: '雲貴高原', hint: '它位於中國西南，雲南與貴州一帶。', reason: '雲貴高原石灰岩地形發達，位於中國地勢第二級階梯。' },
  { id: 'terrain-tarim', mapKind: 'point', x: 183, y: 251, name: '塔里木盆地', hint: '它位於新疆南部、天山以南。', reason: '塔里木盆地位於天山與崑崙山之間，內有塔克拉瑪干沙漠。' },
  { id: 'terrain-junggar', mapKind: 'point', x: 210, y: 151, name: '準噶爾盆地', hint: '它位於新疆北部、天山以北。', reason: '準噶爾盆地位於阿爾泰山與天山之間。' },
  { id: 'terrain-sichuan-basin', mapKind: 'point', x: 421, y: 397, name: '四川盆地', hint: '它位於青藏高原以東、長江上游。', reason: '四川盆地四周多山，盆地內農業與人口集中。' },
  { id: 'terrain-northeast-plain', mapKind: 'point', x: 620, y: 196, name: '東北平原', hint: '它位於大興安嶺以東、中國東北部。', reason: '東北平原面積廣大，黑土肥沃，是中國重要農業區。' },
  { id: 'terrain-north-china-plain', mapKind: 'point', x: 548, y: 326, name: '華北平原', hint: '它位於太行山以東、黃河下游。', reason: '華北平原由黃河、淮河等河流沖積形成。' },
  { id: 'terrain-yangtze-plain', mapKind: 'point', x: 558, y: 402, name: '長江中下游平原', hint: '沿著長江中下游向東尋找。', reason: '長江中下游平原河湖密布，是中國重要的水田農業區。' },
  { id: 'terrain-tianshan', mapKind: 'line', path: 'M 125 205 C 166 196 207 201 247 209 C 278 215 307 219 333 225', name: '天山山脈', hint: '它橫貫新疆中部。', reason: '天山山脈大致東西走向，分隔準噶爾盆地與塔里木盆地。' },
  { id: 'terrain-kunlun', mapKind: 'line', path: 'M 160 300 C 204 302 250 311 294 320 C 321 326 345 332 367 339', name: '崑崙山脈', hint: '它位於塔里木盆地南側、青藏高原北緣。', reason: '崑崙山脈大致東西走向，是青藏高原北部的重要山脈。' },
  { id: 'terrain-himalaya', mapKind: 'line', path: 'M 145 430 C 184 439 225 451 267 462 C 300 471 330 476 360 478', name: '喜馬拉雅山脈', hint: '它沿著中國西南邊界延伸。', reason: '喜馬拉雅山脈沿青藏高原南緣延伸，為中國與南亞的重要界山。' },
  { id: 'terrain-qinling', mapKind: 'line', path: 'M 395 355 C 421 351 449 355 478 366', name: '秦嶺', hint: '它位於黃土高原以南、四川盆地以北。', reason: '秦嶺大致東西走向，和淮河構成中國重要自然地理分界。' },
  { id: 'terrain-turpan-depression', mapKind: 'point', x: 238, y: 221, name: '吐魯番窪地', hint: '往新疆東部、天山山脈附近尋找。', reason: '吐魯番窪地位於天山東段，是中國地勢較低且氣候乾燥的盆地。' },
  { id: 'terrain-qaidam', mapKind: 'point', x: 330, y: 333, name: '柴達木盆地', hint: '往青藏高原東北部、祁連山以南尋找。', reason: '柴達木盆地位於青海省西北部，介於祁連山與崑崙山之間。' },
  { id: 'terrain-yangtze-delta', mapKind: 'point', x: 609, y: 389, name: '長江三角洲', hint: '沿長江向東找到出海口附近。', reason: '長江三角洲位於長江出海口，是中國人口與經濟活動密集的地區。' },
  { id: 'terrain-southeast-hills', mapKind: 'point', x: 560, y: 438, name: '東南丘陵', hint: '往長江以南、東南沿海的內陸側尋找。', reason: '東南丘陵分布在中國東南部，地勢起伏且低山丘陵廣布。' },
  { id: 'terrain-lingnan-hills', mapKind: 'point', x: 535, y: 476, name: '嶺南丘陵', hint: '往南嶺以南、珠江流域北側尋找。', reason: '嶺南丘陵位於中國南部，範圍大致在南嶺以南。' },
  { id: 'terrain-pearl-delta', mapKind: 'point', x: 510, y: 510, name: '珠江三角洲', hint: '往中國南部、珠江接近南海的河口尋找。', reason: '珠江三角洲位於珠江出海口，是中國南部重要的平原與都市群。' },
  { id: 'terrain-hengduan', mapKind: 'line', path: 'M 390 368 C 402 396 402 424 397 452 C 393 474 397 493 404 510', name: '橫斷山脈', hint: '往四川盆地以西、青藏高原東南緣尋找。', reason: '橫斷山脈南北縱走，是青藏高原東南側的重要山地。' },
]

export const chinaReliefStepItems = [
  { id: 'relief-step-one', mapKind: 'range', bandStart: 65, bandEnd: 380, name: '第一級階梯', hint: '沿北緯 36° 地形剖面線觀察，範圍由西藏、新疆一側延伸至貴州最西側附近。', reason: '第一級階梯以青藏高原為主；下方雙箭頭依北緯 36° 地形剖面線的高地段標示，不代表整張地圖的面積比例。' },
  { id: 'relief-step-two', mapKind: 'range', bandStart: 380, bandEnd: 485, name: '第二級階梯', hint: '沿北緯 36° 地形剖面線觀察，範圍由第一級階梯東緣延伸至湖南、廣東、廣西交界附近。', reason: '第二級階梯的剖面範圍以高原、盆地為主；雙箭頭右端對齊第二、三級階梯的剖面轉折位置。' },
  { id: 'relief-step-three', mapKind: 'range', bandStart: 485, bandEnd: 622, name: '第三級階梯', hint: '沿北緯 36° 地形剖面線觀察，範圍由第二級階梯東緣延伸至青島附近。', reason: '第三級階梯的剖面範圍以東部平原為主；雙箭頭依剖面線延伸至青島，而不是延伸到整張地圖最右側。' },
  { id: 'relief-greater-khingan', mapKind: 'line', name: '大興安嶺', path: 'M 603 62 C 600 91 595 121 587 150 C 579 181 566 208 551 234', hint: '它位於中國東北平原西側，走向大致為東北—西南。', reason: '大興安嶺沿中國東北平原西側延伸，是中國第二、三級階梯北段的重要分界；它與太行山之間另有燕山一帶的過渡區。' },
  { id: 'relief-taihang', mapKind: 'line', name: '太行山', path: 'M 523 271 C 519 290 516 310 512 329 C 509 341 506 351 503 359', hint: '往黃土高原以東、華北平原以西尋找；北起北京西山附近，南至晉豫交界，不要向南延伸到巫山。', reason: '太行山北起北京西山、南抵晉豫交界王屋山一帶，是黃土高原與華北平原的分界；南端與巫山之間不是同一條連續山脈。' },
  { id: 'relief-wushan', mapKind: 'line', name: '巫山', path: 'M 505 390 C 503 407 501 424 498 441', hint: '往四川盆地東側、長江三峽附近尋找。', reason: '巫山位於四川盆地與長江中下游地區之間，是第二、三級階梯的重要分界。' },
  { id: 'relief-qilian', mapKind: 'line', name: '祁連山', path: 'M 330 286 C 361 291 393 299 425 312', hint: '往青藏高原東北緣、甘肅與青海交界尋找。', reason: '祁連山位於柴達木盆地北側、甘肅與青海交界，是第一、二級階梯的重要分界。' },
  { id: 'relief-kunlun', mapKind: 'line', name: '崑崙山脈', path: 'M 160 300 C 204 302 250 311 294 320 C 321 326 345 332 367 339', hint: '往塔里木盆地南側、青藏高原北緣尋找。', reason: '崑崙山脈是中國第一、二級階梯西段的重要分界。' },
  { id: 'relief-hengduan', mapKind: 'line', name: '橫斷山脈', path: 'M 390 368 C 402 396 402 424 397 452 C 393 474 397 493 404 510', hint: '往青藏高原東南緣、四川盆地以西尋找。', reason: '橫斷山脈南北縱走，是中國第一、二級階梯東南段的重要分界。' },
]

export const chinaRiverItems = [
  {
    id: 'river-yellow', mapKind: 'line', name: '黃河',
    path: chinaRiverGeometry['river-yellow'].path,
    hint: '它源於青藏高原，流經黃土高原後注入渤海。',
    reason: '黃河呈「幾」字形流經中國北部，含沙量大，最後注入渤海。',
  },
  {
    id: 'river-yangtze', mapKind: 'line', name: '長江',
    path: chinaRiverGeometry['river-yangtze'].path,
    hint: '它源於青藏高原，向東流經四川盆地與中下游平原。',
    reason: '長江是中國最長河流，自西向東注入東海。',
  },
  {
    id: 'river-pearl', mapKind: 'line', name: '珠江',
    path: chinaRiverGeometry['river-pearl'].path,
    hint: '它位於中國南部，河口形成珠江三角洲。',
    reason: '珠江水系流經中國南部，最後注入南海。',
  },
  {
    id: 'river-amur', mapKind: 'line', name: '黑龍江',
    path: chinaRiverGeometry['river-amur'].path,
    hint: '往中國東北北緣、中俄邊界一帶尋找。',
    reason: '黑龍江由額爾古納河與石勒喀河匯流形成，沿中俄邊界向東流；本圖於中國東北邊界截斷，完整河道最後注入韃靼海峽。',
  },
  {
    id: 'river-huai', mapKind: 'line', name: '淮河',
    path: chinaRiverGeometry['river-huai'].path,
    hint: '往黃河與長江之間、秦嶺—淮河線東段尋找。',
    reason: '淮河發源於河南桐柏山，位於黃河與長江之間，也是中國重要南北地理分界的一部分。',
  },
]

export const chinaLakeItems = [
  { id: 'lake-qinghai', mapKind: 'area', areaType: 'water', path: chinaLakeGeometry['lake-qinghai'].path, name: '青海湖', hint: '往青藏高原東北緣、青海省內尋找。', reason: '青海湖是中國面積最大的湖泊，位於青藏高原東北部。' },
  { id: 'lake-poyang', mapKind: 'area', areaType: 'water', path: chinaLakeGeometry['lake-poyang'].path, name: '鄱陽湖', hint: '往江西省北部、長江南側尋找。', reason: '鄱陽湖與長江相通，水位與湖面面積具有明顯季節變化。' },
  { id: 'lake-dongting', mapKind: 'area', areaType: 'water', path: chinaLakeGeometry['lake-dongting'].path, name: '洞庭湖', hint: '往湖南省北部、長江南側尋找。', reason: '洞庭湖承接湖南多條河流，再向北與長江相通。' },
  { id: 'lake-tai', mapKind: 'area', areaType: 'water', path: chinaLakeGeometry['lake-tai'].path, name: '太湖', hint: '往長江三角洲西側、江蘇與浙江交界附近尋找。', reason: '太湖位於長江三角洲，周邊都市、農業與水運發達。' },
]

export const chinaSeaItems = [
  { id: 'sea-bohai', mapKind: 'area', areaType: 'sea', path: chinaSeaGeometry['sea-bohai'].path, name: '渤海', hint: '往山東半島與遼東半島之間的內海尋找。', reason: '渤海是被遼東半島、華北平原沿海與山東半島包圍的內海，黃河注入其中。' },
  { id: 'sea-yellow', mapKind: 'area', areaType: 'sea', path: chinaSeaGeometry['sea-yellow'].path, name: '黃海', hint: '往山東半島與朝鮮半島之間尋找。', reason: '黃海位於中國東部與朝鮮半島之間，北接渤海，南連東海。' },
  { id: 'sea-east', mapKind: 'area', areaType: 'sea', path: chinaSeaGeometry['sea-east'].path, name: '東海', hint: '往長江出海口與臺灣以北的海域尋找。', reason: '東海位於中國東部沿海外側，長江注入其中。' },
  { id: 'sea-south', mapKind: 'area', areaType: 'sea', path: chinaSeaGeometry['sea-south'].path, name: '南海', hint: '往中國南部沿海與海南島外側尋找。', reason: '南海位於中國南部，珠江水系最後注入其中。' },
]

export const chinaClimateItems = [
  { id: 'climate-subtropical-monsoon', mapKind: 'point', x: 553, y: 421, name: '副熱帶季風氣候', hint: '往秦嶺—淮河以南、接近海洋的一側尋找。', reason: '中國南部緯度較低，夏季受海洋季風影響，形成溫暖多雨的副熱帶季風氣候。' },
  { id: 'climate-temperate-monsoon', mapKind: 'point', x: 573, y: 314, name: '溫帶季風氣候', hint: '往中國東部、秦嶺—淮河以北尋找。', reason: '中國東北與華北受季風影響，夏季多雨、冬季寒冷乾燥。' },
  { id: 'climate-temperate-grassland', mapKind: 'point', x: 424, y: 286, name: '溫帶草原氣候', hint: '往季風區西側與乾燥區東側的過渡帶尋找。', reason: '中國北部內陸降水由東向西減少，草原氣候位於季風與沙漠氣候之間。' },
  { id: 'climate-temperate-desert', mapKind: 'point', x: 251, y: 270, name: '溫帶沙漠氣候', hint: '往深居內陸的中國西北部尋找。', reason: '中國西北部距海遠，水氣不易到達，降水少而形成溫帶沙漠氣候。' },
  { id: 'climate-highland', mapKind: 'point', x: 250, y: 390, name: '高地氣候區', hint: '往海拔最高的青藏高原尋找。', reason: '青藏高原因海拔高，夏季氣溫仍偏低，形成高地氣候。' },
  {
    id: 'climate-qinling-huaihe', mapKind: 'line', name: '秦嶺—淮河',
    path: 'M 395 355 C 422 351 449 355 478 366 C 505 376 536 374 566 381 C 593 388 618 384 641 386',
    hint: '由黃土高原南側的秦嶺向東，接到黃河與長江之間的淮河。',
    reason: '秦嶺—淮河一線大致與一月 0℃ 等溫線及年雨量 750 毫米等雨量線相近，是中國東部重要的南北氣候分界。',
  },
]

export const chinaAgricultureItems = [
  { id: 'agriculture-pasture', mapKind: 'point', x: 380, y: 287, name: '畜牧區', hint: '往年雨量較少的北部與西北部尋找。', reason: '中國北部與西北部較乾燥，草原與荒漠較多，傳統維生方式以放牧為主。' },
  { id: 'agriculture-farming', mapKind: 'point', x: 555, y: 382, name: '農業區', hint: '往降水較多、平原較集中的中國東部尋找。', reason: '中國東部受季風影響，雨量較多，平原與河谷適合發展農業。' },
  { id: 'agriculture-wheat', mapKind: 'point', x: 548, y: 327, name: '旱田農業區', hint: '往秦嶺—淮河以北的華北平原尋找。', reason: '中國北方降水較少，主要發展旱田農業，常見作物包括小麥。' },
  { id: 'agriculture-rice', mapKind: 'point', x: 552, y: 430, name: '水田農業區', hint: '往秦嶺—淮河以南、氣候較溫暖濕潤處尋找。', reason: '中國南方雨量較多、熱量充足，水田農業發達，稻米為重要作物。' },
  { id: 'agriculture-rainfall-500', mapKind: 'line', name: '年雨量 500 毫米等雨量線', path: 'M 615 120 C 601 165 589 210 560 250 C 533 280 505 306 475 329 C 449 349 425 373 408 400 C 390 428 382 462 380 497', hint: '它大致由中國東北向西南延伸，經內蒙古、黃土高原西側與青藏高原東緣，分隔較乾燥與較濕潤地區。', reason: '年雨量 500 毫米等雨量線大致是中國傳統畜牧區與農業區的重要分界。' },
  { id: 'agriculture-qinling-huaihe-750', mapKind: 'line', name: '秦嶺—淮河（約 750 毫米等雨量線）', path: 'M 395 355 C 422 351 449 355 478 366 C 505 376 536 374 566 381 C 593 388 618 384 641 386', hint: '先找黃土高原南側的秦嶺，再沿淮河向東；這條線大致也接近年雨量 750 毫米等雨量線。', reason: '秦嶺—淮河一線大致接近年雨量 750 毫米等雨量線，分隔北方旱田與南方水田農業。' },
]

export const chinaPopulationDistributionItems = [
  {
    id: 'population-heihe-tengchong', mapKind: 'line', name: '黑河—騰衝線',
    path: 'M 661 102 L 628 151 L 596 202 L 563 254 L 530 305 L 497 356 L 464 408 L 430 458 L 401 489',
    hint: '由中國東北的黑河，向西南連到雲南騰衝。',
    reason: '黑河—騰衝線是中國人口分布的重要界線；線的東南側人口較密集，西北側人口較稀疏。',
  },
  { id: 'population-east-dense', mapKind: 'point', x: 574, y: 366, name: '東南半部人口密集區', hint: '先找黑河—騰衝線，再觀察它的東南側。', reason: '中國東南半部地勢較低、氣候較濕潤，都市、交通與產業集中，因此人口密度較高。' },
  { id: 'population-west-sparse', mapKind: 'point', x: 274, y: 322, name: '西北半部人口稀疏區', hint: '先找黑河—騰衝線，再觀察它的西北側。', reason: '中國西北半部多高原、山地與乾燥區，環境承載力較低，因此人口密度較低。' },
]

const autonomousRegionRows = [
  ['nei-mongol', '內蒙古自治區', '位於中國北部，呈東西狹長分布。'],
  ['xinjiang-uygur', '新疆維吾爾自治區', '位於中國西北端，是面積最大的省級行政區。'],
  ['xizang', '西藏自治區', '位於青藏高原西南部。'],
  ['ningxia-hui', '寧夏回族自治區', '位於黃河上游、甘肅與內蒙古之間。'],
  ['guangxi-zhuang', '廣西壯族自治區', '位於中國南部，西鄰越南、南臨北部灣。'],
]

export const chinaAutonomousRegionItems = autonomousRegionRows.map(([mapId, name, reason]) => ({
  id: `population-autonomous-${mapId}`,
  mapId,
  mapKind: 'province',
  name,
  hint: provinceRegionHints[
    mapId === 'xinjiang-uygur' ? 'northwest'
      : mapId === 'xizang' ? 'southwest'
        : mapId === 'guangxi-zhuang' ? 'south'
          : 'north'
  ],
  reason: `${reason}中國少數民族多分布於邊疆地區，這五個省級行政區以少數民族設置自治區。`,
}))

export const chinaPopulationChangeItems = [
  { id: 'population-policy-one-child', mapKind: 'diagram', diagramKind: 'policy-one-child', name: '一胎化政策', hint: '觀察家庭圖示中子女的人數。', reason: '為控制人口快速增加，中國曾長期實施一胎化政策；這也衍生少子化、性別比失衡與人口老化等問題。' },
  { id: 'population-policy-two-three-child', mapKind: 'diagram', diagramKind: 'policy-two-three-child', name: '鼓勵生育與放寬生育限制', hint: '觀察家庭圖示中的多名子女，以及向上的人口箭頭。', reason: '面對低生育率與人口老化，中國逐步放寬生育限制，並改以鼓勵生育因應人口結構變化。' },
  { id: 'population-aging', mapKind: 'diagram', diagramKind: 'population-aging', name: '人口老化', hint: '觀察人口金字塔上方年長人口的比例。', reason: '出生率下降且平均壽命延長，使老年人口比例提高，勞動力與照顧需求也隨之改變。' },
  { id: 'population-sex-ratio', mapKind: 'diagram', diagramKind: 'population-sex-ratio', name: '性別比失衡', hint: '比較圖卡左右兩側人數是否相等。', reason: '傳統重男輕女觀念與生育限制，使部分時期男性人口明顯多於女性，形成性別比失衡。' },
]

export const chinaEconomicZoneItems = [
  { id: 'economy-zone-shenzhen', mapKind: 'point', x: 512, y: 509, markerRadius: 5, hitRadius: 8, name: '深圳經濟特區', hint: '往珠江口東側、香港北方尋找。', reason: '深圳鄰近香港，是改革開放初期設立的經濟特區之一。' },
  { id: 'economy-zone-zhuhai', mapKind: 'point', x: 501, y: 512, markerRadius: 5, hitRadius: 8, name: '珠海經濟特區', hint: '往珠江口西側、澳門北方尋找。', reason: '珠海鄰近澳門，是改革開放初期設立的經濟特區之一。' },
  { id: 'economy-zone-shantou', mapKind: 'point', x: 544, y: 497, markerRadius: 5, hitRadius: 8, name: '汕頭經濟特區', hint: '往廣東東部沿海尋找。', reason: '汕頭利用沿海與僑鄉條件，成為改革開放初期設立的經濟特區之一。' },
  { id: 'economy-zone-xiamen', mapKind: 'point', x: 560, y: 480, markerRadius: 5, hitRadius: 8, name: '廈門經濟特區', hint: '往福建東南沿海、臺灣海峽西側尋找。', reason: '廈門位於福建沿海，是改革開放初期設立的經濟特區之一。' },
  { id: 'economy-zone-hainan', mapId: 'hainan', mapKind: 'province', name: '海南經濟特區', hint: '往雷州半島以南的海南島尋找。', reason: '海南全省均為經濟特區，是中國面積最大的經濟特區。' },
]

export const chinaEconomicRegionItems = [
  { id: 'economy-region-west', mapKind: 'point', x: 280, y: 333, name: '西部經濟地帶', hint: '往中國內陸西部的高原、盆地與邊疆地區尋找。', reason: '西部地區面積廣、資源多，但交通與產業基礎相對不足，人口也較稀疏。' },
  { id: 'economy-region-central', mapKind: 'point', x: 468, y: 354, name: '中部經濟地帶', hint: '往東部沿海與西部內陸之間尋找。', reason: '中部地區具有承東啟西的位置，承接沿海產業移轉並連結內陸市場。' },
  { id: 'economy-region-east', mapKind: 'point', x: 598, y: 371, name: '東部經濟地帶', hint: '往中國東部沿海與主要港口都市尋找。', reason: '東部沿海交通便利、政策開放較早，人口、都市與產業高度集中，也是人口移入的重要地區。' },
]

export const chinaBeltRoadItems = [
  { id: 'belt-road-land', mapKind: 'diagram', diagramKind: 'belt-road-land', name: '絲綢之路經濟帶', hint: '從中國出發，沿橘色路線查看中亞、西亞到歐洲的陸路節點。', reason: '絲綢之路經濟帶以陸路交通由中國向西，經中亞、西亞連結歐洲。' },
  { id: 'belt-road-sea', mapKind: 'diagram', diagramKind: 'belt-road-sea', name: '21 世紀海上絲綢之路', hint: '從中國沿海出發，沿藍色路線查看東南亞、南亞、東非到歐洲的海路節點。', reason: '21 世紀海上絲綢之路由中國沿海出發，經東南亞、南亞與東非等海運節點連結歐洲。' },
  { id: 'belt-road-dual', mapKind: 'diagram', diagramKind: 'belt-road-dual', name: '一帶一路', hint: '觀察圖中是否同時呈現橘色陸路與藍色海路。', reason: '「一帶一路」結合向西延伸的陸上經濟帶與串聯港口的海上絲綢之路，擴大跨區域交通、貿易與投資連結。' },
]

export const chinaRcepItems = [
  { id: 'rcep-asean', mapKind: 'diagram', diagramKind: 'rcep-asean', name: '東南亞國家協會十國', hint: '觀察圖卡是否以十個相連圓點呈現核心成員。', reason: 'RCEP 由東南亞國家協會發起，東協十國是協定的重要核心。' },
  { id: 'rcep-northeast-asia', mapKind: 'diagram', diagramKind: 'rcep-northeast-asia', name: '中國、日本與韓國', hint: '觀察圖卡是否以三個彼此連結的經濟體呈現。', reason: '中國、日本與韓國皆為 RCEP 成員，協定加深東北亞與東南亞的產業及貿易連結。' },
  { id: 'rcep-oceania', mapKind: 'diagram', diagramKind: 'rcep-oceania', name: '澳洲與紐西蘭', hint: '觀察圖卡是否顯示南方兩個相連成員。', reason: '澳洲與紐西蘭是 RCEP 中位於大洋洲的兩個成員。' },
  { id: 'rcep-region', mapKind: 'diagram', diagramKind: 'rcep-region', name: '區域全面經濟夥伴協定（RCEP）', hint: '觀察圖卡是否整合十國、三國與兩國三組成員。', reason: 'RCEP 整合東協十國、中日韓、澳洲與紐西蘭，降低貿易障礙並強化區域供應鏈。' },
]

export const chinaIndustryTransitionItems = [
  { id: 'industry-world-factory', mapKind: 'diagram', diagramKind: 'industry-world-factory', name: '世界工廠', hint: '觀察大量工廠與外銷貨箱的圖示。', reason: '改革開放後，中國利用勞動力與外資發展出口製造業，逐漸成為「世界工廠」。' },
  { id: 'industry-technology', mapKind: 'diagram', diagramKind: 'industry-technology', name: '高科技與自有品牌', hint: '觀察晶片、研發與品牌符號。', reason: '工資上升與產業競爭促使中國從勞力密集製造，轉向高科技、研發與自有品牌。' },
  { id: 'industry-world-market', mapKind: 'diagram', diagramKind: 'industry-world-market', name: '世界市場', hint: '觀察龐大消費人口與商品流入的箭頭。', reason: '所得提高與人口規模形成龐大內需，中國也由生產基地逐漸成為重要的「世界市場」。' },
  { id: 'industry-environment', mapKind: 'diagram', diagramKind: 'industry-environment', name: '工業化與環境問題', hint: '觀察工廠、煙霧與水滴警示符號。', reason: '快速工業化與都市化帶來空氣、水與土壤污染，經濟成長需兼顧環境治理。' },
]

export const chinaGeographyTopics = [
  {
    id: 'relief-steps',
    name: '地勢三級階梯',
    description: '三級階梯及主要分界山脈',
    semester: '翰林八上 L01',
    items: chinaReliefStepItems,
  },
  {
    id: 'administrative',
    name: '行政區填圖',
    description: '直轄市、自治區、省與特別行政區',
    semester: '翰林八上 L01',
    items: chinaProvinceItems,
  },
  {
    id: 'terrain',
    name: '地形與山脈',
    description: '高原、盆地、平原與主要山脈',
    semester: '翰林八上 L01',
    items: chinaTerrainItems,
  },
  {
    id: 'rivers',
    name: '主要河流',
    description: '黃河、長江、珠江、黑龍江與淮河的空間位置',
    semester: '翰林八上 L01',
    items: chinaRiverItems,
  },
  {
    id: 'lakes',
    name: '重要湖泊',
    description: '青海湖、鄱陽湖、洞庭湖與太湖的實際輪廓',
    semester: '翰林八上 L01',
    items: chinaLakeItems,
  },
  {
    id: 'seas',
    name: '周邊海域',
    description: '渤海、黃海、東海與南海的範圍',
    semester: '翰林八上 L01',
    items: chinaSeaItems,
  },
  {
    id: 'climate',
    name: '中國的氣候',
    description: '季風、草原、沙漠、高地氣候與重要分界',
    semester: '翰林八上 L02',
    items: chinaClimateItems,
  },
  {
    id: 'agriculture',
    name: '傳統農業區',
    description: '畜牧、農耕、旱田、水田與等雨量線',
    semester: '翰林八上第 2 章',
    items: chinaAgricultureItems,
  },
  {
    id: 'population-distribution',
    name: '人口分布',
    description: '黑河—騰衝線與東密西疏',
    semester: '翰林八上第 3 章',
    items: chinaPopulationDistributionItems,
  },
  {
    id: 'autonomous-regions',
    name: '民族與自治區',
    description: '五個少數民族自治區的位置',
    semester: '翰林八上第 3 章',
    items: chinaAutonomousRegionItems,
  },
  {
    id: 'population-change',
    name: '人口政策與問題',
    description: '人口政策、低生育率、老化與性別比',
    semester: '翰林八上第 3 章',
    items: chinaPopulationChangeItems,
  },
  {
    id: 'economic-zones',
    name: '經濟特區',
    description: '深圳、珠海、汕頭、廈門與海南',
    semester: '翰林八上第 4 章',
    items: chinaEconomicZoneItems,
  },
  {
    id: 'economic-regions',
    name: '東中西部發展',
    description: '三大經濟地帶、區域差距與人口移動',
    semester: '翰林八上第 4 章',
    items: chinaEconomicRegionItems,
  },
  {
    id: 'belt-and-road',
    name: '一帶一路',
    description: '陸上經濟帶與海上絲綢之路',
    semester: '翰林八上第 4 章',
    items: chinaBeltRoadItems,
  },
  {
    id: 'rcep',
    name: 'RCEP 區域連結',
    description: '東協、中日韓與澳紐的區域合作',
    semester: '翰林八上第 4 章',
    items: chinaRcepItems,
  },
  {
    id: 'industry-transition',
    name: '產業轉型與環境',
    description: '世界工廠、科技升級、內需與環境代價',
    semester: '翰林八上第 4 章',
    items: chinaIndustryTransitionItems,
  },
]

export const chinaGeographyChapters = [
  {
    id: 'grade8-upper-l01',
    name: '八上第 1 章　中國的地形',
    shortName: '八上第 1 章',
    description: '依正式目錄練習位置、行政區、三級階梯、地形與主要河流。',
    topicIds: ['relief-steps', 'terrain', 'administrative', 'rivers', 'lakes', 'seas'],
  },
  {
    id: 'grade8-upper-l02',
    name: '八上第 2 章　中國的氣候',
    shortName: '八上第 2 章',
    description: '練習氣候、秦嶺—淮河分界、傳統維生方式與農業分布。',
    topicIds: ['climate', 'agriculture'],
  },
  {
    id: 'grade8-upper-l03',
    name: '八上第 3 章　中國的人口',
    shortName: '八上第 3 章',
    description: '練習人口分布、民族自治區，以及人口政策與結構問題。',
    topicIds: ['population-distribution', 'autonomous-regions', 'population-change'],
  },
  {
    id: 'grade8-upper-l04',
    name: '八上第 4 章　中國的經濟發展與全球關連',
    shortName: '八上第 4 章',
    description: '練習經濟特區、區域發展、一帶一路、RCEP 與產業轉型。',
    topicIds: ['economic-zones', 'economic-regions', 'belt-and-road', 'rcep', 'industry-transition'],
  },
]
