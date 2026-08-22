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
  { id: 'terrain-tianshan', mapKind: 'point', x: 205, y: 202, name: '天山山脈', hint: '它橫貫新疆中部。', reason: '天山山脈大致東西走向，分隔準噶爾盆地與塔里木盆地。' },
  { id: 'terrain-kunlun', mapKind: 'point', x: 244, y: 309, name: '崑崙山脈', hint: '它位於塔里木盆地南側、青藏高原北緣。', reason: '崑崙山脈大致東西走向，是青藏高原北部的重要山脈。' },
  { id: 'terrain-himalaya', mapKind: 'point', x: 236, y: 457, name: '喜馬拉雅山脈', hint: '它位於中國西南邊界。', reason: '喜馬拉雅山脈位於青藏高原南緣，為中國與南亞的重要界山。' },
  { id: 'terrain-qinling', mapKind: 'point', x: 439, y: 354, name: '秦嶺', hint: '它位於黃土高原以南、四川盆地以北。', reason: '秦嶺大致東西走向，和淮河構成中國重要自然地理分界。' },
  { id: 'terrain-turpan-depression', mapKind: 'point', x: 238, y: 221, name: '吐魯番窪地', hint: '往新疆東部、天山山脈附近尋找。', reason: '吐魯番窪地位於天山東段，是中國地勢較低且氣候乾燥的盆地。' },
  { id: 'terrain-qaidam', mapKind: 'point', x: 330, y: 333, name: '柴達木盆地', hint: '往青藏高原東北部、祁連山以南尋找。', reason: '柴達木盆地位於青海省西北部，介於祁連山與崑崙山之間。' },
  { id: 'terrain-yangtze-delta', mapKind: 'point', x: 646, y: 405, name: '長江三角洲', hint: '沿長江向東找到出海口附近。', reason: '長江三角洲位於長江出海口，是中國人口與經濟活動密集的地區。' },
  { id: 'terrain-southeast-hills', mapKind: 'point', x: 604, y: 450, name: '東南丘陵', hint: '往長江以南、東南沿海的內陸側尋找。', reason: '東南丘陵分布在中國東南部，地勢起伏且低山丘陵廣布。' },
  { id: 'terrain-lingnan-hills', mapKind: 'point', x: 535, y: 476, name: '嶺南丘陵', hint: '往南嶺以南、珠江流域北側尋找。', reason: '嶺南丘陵位於中國南部，範圍大致在南嶺以南。' },
  { id: 'terrain-pearl-delta', mapKind: 'point', x: 580, y: 505, name: '珠江三角洲', hint: '往中國南部、珠江接近南海的河口尋找。', reason: '珠江三角洲位於珠江出海口，是中國南部重要的平原與都市群。' },
  { id: 'terrain-hengduan', mapKind: 'point', x: 388, y: 430, name: '橫斷山脈', hint: '往四川盆地以西、青藏高原東南緣尋找。', reason: '橫斷山脈南北縱走，是青藏高原東南側的重要山地。' },
]

export const chinaReliefStepItems = [
  { id: 'relief-step-one', mapKind: 'point', x: 235, y: 382, name: '第一級階梯', hint: '先找中國西南部海拔最高、面積廣大的高原。', reason: '第一級階梯以青藏高原為主，平均海拔最高。' },
  { id: 'relief-step-two', mapKind: 'point', x: 438, y: 325, name: '第二級階梯', hint: '位於青藏高原以東、大興安嶺至太行山一線以西。', reason: '第二級階梯以高原與盆地為主，包括內蒙古高原、黃土高原、四川盆地等。' },
  { id: 'relief-step-three', mapKind: 'point', x: 590, y: 338, name: '第三級階梯', hint: '往中國東部沿海的平原與丘陵區尋找。', reason: '第三級階梯位於中國東部，主要由平原與丘陵構成。' },
  { id: 'relief-greater-khingan', mapKind: 'line', name: '大興安嶺', path: 'M 552 126 C 543 171 545 220 535 261 C 527 289 527 315 531 337', hint: '它位於中國東北部，走向大致為東北—西南。', reason: '大興安嶺是中國第二、三級階梯北段的重要分界。' },
  { id: 'relief-taihang', mapKind: 'line', name: '太行山', path: 'M 531 337 C 527 352 526 370 523 387', hint: '往黃土高原以東、華北平原以西尋找。', reason: '太行山位於黃土高原與華北平原之間，是第二、三級階梯的重要分界。' },
  { id: 'relief-wushan', mapKind: 'line', name: '巫山', path: 'M 500 386 C 500 404 499 420 496 437', hint: '往四川盆地東側、長江三峽附近尋找。', reason: '巫山位於四川盆地與長江中下游地區之間，是第二、三級階梯的重要分界。' },
  { id: 'relief-qilian', mapKind: 'line', name: '祁連山', path: 'M 306 316 C 338 320 365 328 393 344', hint: '往青藏高原東北緣、甘肅與青海交界尋找。', reason: '祁連山位於青藏高原東北緣，是第一、二級階梯的重要分界。' },
  { id: 'relief-kunlun', mapKind: 'line', name: '崑崙山脈', path: 'M 175 294 C 220 302 267 311 314 323', hint: '往塔里木盆地南側、青藏高原北緣尋找。', reason: '崑崙山脈是中國第一、二級階梯西段的重要分界。' },
  { id: 'relief-hengduan', mapKind: 'line', name: '橫斷山脈', path: 'M 391 366 C 398 390 397 419 390 453 C 387 470 388 486 391 500', hint: '往青藏高原東南緣、四川盆地以西尋找。', reason: '橫斷山脈南北縱走，是中國第一、二級階梯東南段的重要分界。' },
]

export const chinaRiverItems = [
  {
    id: 'river-yellow', mapKind: 'line', name: '黃河',
    path: 'M 320 250 C 365 266 405 272 417 305 C 423 327 445 330 475 315 C 510 297 545 304 575 289 C 600 276 620 286 638 301',
    hint: '它源於青藏高原，流經黃土高原後注入渤海。',
    reason: '黃河呈「幾」字形流經中國北部，含沙量大，最後注入渤海。',
  },
  {
    id: 'river-yangtze', mapKind: 'line', name: '長江',
    path: 'M 292 382 C 340 395 370 376 411 392 C 451 410 490 398 528 409 C 563 419 599 401 642 413 C 659 418 675 414 691 407',
    hint: '它源於青藏高原，向東流經四川盆地與中下游平原。',
    reason: '長江是中國最長河流，自西向東注入東海。',
  },
  {
    id: 'river-pearl', mapKind: 'line', name: '珠江',
    path: 'M 442 468 C 468 475 487 488 510 486 C 533 485 552 500 575 507',
    hint: '它位於中國南部，河口形成珠江三角洲。',
    reason: '珠江水系流經中國南部，最後注入南海。',
  },
]

export const chinaClimateItems = [
  { id: 'climate-subtropical-monsoon', mapKind: 'point', x: 553, y: 421, name: '副熱帶季風氣候', hint: '往秦嶺—淮河以南、接近海洋的一側尋找。', reason: '中國南部緯度較低，夏季受海洋季風影響，形成溫暖多雨的副熱帶季風氣候。' },
  { id: 'climate-temperate-monsoon', mapKind: 'point', x: 573, y: 314, name: '溫帶季風氣候', hint: '往中國東部、秦嶺—淮河以北尋找。', reason: '中國東北與華北受季風影響，夏季多雨、冬季寒冷乾燥。' },
  { id: 'climate-temperate-grassland', mapKind: 'point', x: 424, y: 286, name: '溫帶草原氣候', hint: '往季風區西側與乾燥區東側的過渡帶尋找。', reason: '中國北部內陸降水由東向西減少，草原氣候位於季風與沙漠氣候之間。' },
  { id: 'climate-temperate-desert', mapKind: 'point', x: 251, y: 270, name: '溫帶沙漠氣候', hint: '往深居內陸的中國西北部尋找。', reason: '中國西北部距海遠，水氣不易到達，降水少而形成溫帶沙漠氣候。' },
  { id: 'climate-highland', mapKind: 'point', x: 250, y: 390, name: '高地氣候區', hint: '往海拔最高的青藏高原尋找。', reason: '青藏高原因海拔高，夏季氣溫仍偏低，形成高地氣候。' },
  { id: 'climate-qinling', mapKind: 'point', x: 440, y: 354, name: '秦嶺山脈', hint: '往黃土高原以南、四川盆地以北尋找。', reason: '秦嶺山脈與淮河共同形成中國東部重要的氣候分界。' },
  {
    id: 'climate-huaihe', mapKind: 'line', name: '淮河',
    path: 'M 475 355 C 510 360 548 354 584 359 C 597 361 609 360 621 358',
    hint: '從秦嶺向東，在黃河與長江之間尋找。',
    reason: '淮河與秦嶺大致相接，是中國東部南北氣候的重要分界。',
  },
]

export const chinaAgricultureItems = [
  { id: 'agriculture-pasture', mapKind: 'point', x: 380, y: 287, name: '畜牧區', hint: '往年雨量較少的北部與西北部尋找。', reason: '中國北部與西北部較乾燥，草原與荒漠較多，傳統維生方式以放牧為主。' },
  { id: 'agriculture-farming', mapKind: 'point', x: 555, y: 382, name: '農業區', hint: '往降水較多、平原較集中的中國東部尋找。', reason: '中國東部受季風影響，雨量較多，平原與河谷適合發展農業。' },
  { id: 'agriculture-wheat', mapKind: 'point', x: 548, y: 327, name: '旱田農業區', hint: '往秦嶺—淮河以北的華北平原尋找。', reason: '中國北方降水較少，主要發展旱田農業，常見作物包括小麥。' },
  { id: 'agriculture-rice', mapKind: 'point', x: 552, y: 430, name: '水田農業區', hint: '往秦嶺—淮河以南、氣候較溫暖濕潤處尋找。', reason: '中國南方雨量較多、熱量充足，水田農業發達，稻米為重要作物。' },
  { id: 'agriculture-qinling', mapKind: 'point', x: 440, y: 354, name: '秦嶺山脈', hint: '往黃土高原以南、四川盆地以北尋找。', reason: '秦嶺山脈與淮河共同形成中國東部重要的農業分界。' },
  { id: 'agriculture-huaihe', mapKind: 'line', name: '淮河', path: 'M 475 355 C 510 360 548 354 584 359 C 597 361 609 360 621 358', hint: '從秦嶺向東，在黃河與長江之間尋找。', reason: '淮河以北雨量較少，多旱田；以南較濕潤，多水田。' },
  { id: 'agriculture-rainfall-500', mapKind: 'line', name: '年雨量 500 毫米等雨量線', path: 'M 520 122 C 515 183 518 235 500 283 C 486 319 474 343 466 368', hint: '它大致由中國東北向西南延伸，分隔較乾燥與較濕潤地區。', reason: '年雨量 500 毫米等雨量線大致是中國傳統畜牧區與農業區的重要分界。' },
  { id: 'agriculture-rainfall-750', mapKind: 'line', name: '年雨量 750 毫米等雨量線', path: 'M 440 354 C 478 356 514 360 551 356 C 581 354 602 360 623 361', hint: '它大致接近秦嶺—淮河一線。', reason: '年雨量 750 毫米等雨量線大致分隔北方旱田與南方水田農業。' },
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
    description: '黃河、長江與珠江的空間位置',
    semester: '翰林八上 L01',
    items: chinaRiverItems,
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
]

export const chinaGeographyChapters = [
  {
    id: 'grade8-upper-l01',
    name: '八上第 1 章　中國的地形',
    shortName: '八上第 1 章',
    description: '依正式目錄練習位置、行政區、三級階梯、地形與主要河流。',
    topicIds: ['relief-steps', 'terrain', 'administrative', 'rivers'],
  },
  {
    id: 'grade8-upper-l02',
    name: '八上第 2 章　中國的氣候',
    shortName: '八上第 2 章',
    description: '練習氣候、秦嶺—淮河分界、傳統維生方式與農業分布。',
    topicIds: ['climate', 'agriculture'],
  },
]
