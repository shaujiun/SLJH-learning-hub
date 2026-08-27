import { taiwanRiverGeometry, taiwanWaterGeometry } from './geographyHydrography.js'
import {
  taiwanCoastlineGeometry,
  taiwanLocationPointGeometry,
  taiwanPortPointGeometry,
  taiwanTropicGeometry,
} from './taiwanMapOverlays.js'

const allLevels = ['intro', 'basic', 'advanced']
const basicLevels = ['basic', 'advanced']
const advancedOnly = ['advanced']

const countyRows = [
  ['taipei-city', '臺北市', '北部', '位於臺灣北部、四周大多與新北市相鄰。', allLevels],
  ['new-taipei-city', '新北市', '北部', '環繞臺北市，北、東側臨海。', allLevels],
  ['taoyuan-city', '桃園市', '北部', '位於新北市西南、新竹縣以北。', allLevels],
  ['taichung-city', '臺中市', '中部', '位於臺灣中部，東西狹長並橫跨中央山地。', allLevels],
  ['tainan-city', '臺南市', '南部', '位於嘉義縣以南、高雄市以北。', allLevels],
  ['kaohsiung-city', '高雄市', '南部', '位於臺灣西南部，市域由海岸延伸到中央山地。', allLevels],
  ['keelung-city', '基隆市', '北部', '位於臺灣本島最北端附近，是北部重要港市。', basicLevels],
  ['yilan-county', '宜蘭縣', '東北部', '位於臺灣東北部，蘭陽平原面向太平洋。', basicLevels],
  ['hsinchu-city', '新竹市', '北部', '位於新竹縣西側的海岸地區。', basicLevels],
  ['hsinchu-county', '新竹縣', '北部', '位於桃園市以南、苗栗縣以北。', basicLevels],
  ['miaoli-county', '苗栗縣', '中北部', '位於新竹縣以南、臺中市以北。', basicLevels],
  ['changhua-county', '彰化縣', '中部', '位於臺中市西南側，西臨臺灣海峽。', basicLevels],
  ['nantou-county', '南投縣', '中部', '位於臺灣本島中央，是唯一不臨海的縣。', basicLevels],
  ['yunlin-county', '雲林縣', '中部', '位於彰化縣以南、嘉義縣以北。', basicLevels],
  ['chiayi-city', '嘉義市', '南部', '位於嘉義縣內，面積較小。', basicLevels],
  ['chiayi-county', '嘉義縣', '南部', '位於雲林縣以南、臺南市以北。', basicLevels],
  ['pingtung-county', '屏東縣', '南部', '位於臺灣最南端，西側與高雄市相鄰。', basicLevels],
  ['hualien-county', '花蓮縣', '東部', '位於臺灣東部，東臨太平洋、西側為中央山脈。', basicLevels],
  ['taitung-county', '臺東縣', '東部', '位於花蓮縣以南，東臨太平洋。', basicLevels],
  ['penghu-county', '澎湖縣', '離島', '位於臺灣海峽中部，由許多島嶼組成。', basicLevels],
  ['kinmen-county', '金門縣', '離島', '位於中國福建沿海、臺灣本島以西。', basicLevels],
  ['lienchiang-county', '連江縣', '離島', '即馬祖列島，位於中國福建沿海、金門以北。', basicLevels],
]

export const taiwanCountyItems = countyRows.map(([mapId, name, region, reason, levels]) => ({
  id: `tw-county-${mapId}`,
  mapId,
  mapKind: 'province',
  name,
  levels,
  hint: `先判斷它位於${region}，再利用海岸線與相鄰縣市縮小範圍。`,
  reason,
}))

export const taiwanLocationItems = [
  { id: 'tw-location-taiwan-strait', mapKind: 'point', ...taiwanLocationPointGeometry['tw-location-taiwan-strait'], name: '臺灣海峽', levels: allLevels, hint: '它位於臺灣本島與中國大陸之間。', reason: '臺灣海峽位於臺灣本島西側，是連接東海與南海的重要海域。' },
  { id: 'tw-location-pacific', mapKind: 'point', ...taiwanLocationPointGeometry['tw-location-pacific'], name: '太平洋', levels: allLevels, hint: '往臺灣本島東側尋找。', reason: '臺灣本島東側直接面向太平洋。' },
  { id: 'tw-location-east-china-sea', mapKind: 'point', ...taiwanLocationPointGeometry['tw-location-east-china-sea'], name: '東海', levels: allLevels, hint: '往臺灣北方海域尋找。', reason: '東海位於臺灣以北，向西北連接中國東部沿海。' },
  { id: 'tw-location-bashi-channel', mapKind: 'point', ...taiwanLocationPointGeometry['tw-location-bashi-channel'], name: '巴士海峽', levels: allLevels, hint: '往臺灣與菲律賓之間尋找。', reason: '巴士海峽位於臺灣南方、菲律賓北方。' },
  { id: 'tw-location-tropic', mapKind: 'line', path: taiwanTropicGeometry, name: '北回歸線', levels: allLevels, hint: '它約在北緯 23.5°，橫越臺灣中南部。', reason: '北回歸線通過嘉義、花蓮一帶，是熱帶與副熱帶的重要緯線。' },
  { id: 'tw-location-green-island', mapKind: 'point', ...taiwanLocationPointGeometry['tw-location-green-island'], name: '綠島', levels: basicLevels, hint: '它在臺東外海，位置比蘭嶼偏北。', reason: '綠島標示對齊臺東縣向量圖中的綠島輪廓，位於臺東縣東方海面。' },
  { id: 'tw-location-orchid-island', mapKind: 'point', ...taiwanLocationPointGeometry['tw-location-orchid-island'], name: '蘭嶼', levels: basicLevels, hint: '它在臺東外海，位置比綠島偏南。', reason: '蘭嶼標示對齊臺東縣向量圖中的蘭嶼輪廓，位於臺灣東南方海面。' },
]

export const taiwanMapSkillItems = [
  { id: 'tw-map-north', mapKind: 'point', x: 865, y: 370, name: '北方', levels: allLevels, hint: '先找指北針，地圖上方通常表示北方。', reason: '一般地圖若未另行標示，慣例以上方為北。' },
  { id: 'tw-map-east', mapKind: 'point', x: 970, y: 720, name: '東方', levels: allLevels, hint: '面向地圖北方時，右手邊是東方。', reason: '臺灣東方臨太平洋。' },
  { id: 'tw-map-west', mapKind: 'point', x: 490, y: 720, name: '西方', levels: allLevels, hint: '面向地圖北方時，左手邊是西方。', reason: '臺灣西方隔臺灣海峽與中國大陸相望。' },
  { id: 'tw-map-south', mapKind: 'point', x: 720, y: 1245, name: '南方', levels: allLevels, hint: '地圖下方通常表示南方。', reason: '臺灣最南端接近恆春半島。' },
  { id: 'tw-map-latitude', mapKind: 'line', path: 'M 450 650 L 960 650', name: '緯線', levels: basicLevels, hint: '緯線大致呈東西方向。', reason: '緯線用來判斷南北位置，數值稱為緯度。' },
  { id: 'tw-map-longitude', mapKind: 'line', path: 'M 760 260 L 760 1240', name: '經線', levels: basicLevels, hint: '經線大致呈南北方向。', reason: '經線用來判斷東西位置，數值稱為經度。' },
]

export const taiwanScaleItems = [
  { id: 'tw-scale-number', mapKind: 'diagram', diagramKind: 'scale-number', name: '數字比例尺', levels: allLevels, hint: '找以比值表示圖上距離與實際距離的圖卡。', reason: '數字比例尺常寫成 1：50,000，表示圖上 1 單位相當於實際 50,000 個相同單位。' },
  { id: 'tw-scale-text', mapKind: 'diagram', diagramKind: 'scale-text', name: '文字比例尺', levels: allLevels, hint: '找用一段文字直接說明圖上與實際距離關係的圖卡。', reason: '文字比例尺會寫成「圖上 1 公分代表實地 500 公尺」等敘述。' },
  { id: 'tw-scale-bar', mapKind: 'diagram', diagramKind: 'scale-bar', name: '圖示比例尺', levels: allLevels, hint: '找具有刻度線與實際距離標示的圖卡。', reason: '圖示比例尺會以線段和刻度呈現，地圖縮放後仍可依線段比例判讀。' },
  { id: 'tw-scale-large', mapKind: 'diagram', diagramKind: 'scale-large', name: '大比例尺地圖', levels: basicLevels, hint: '找呈現範圍較小、地物較詳細的圖卡。', reason: '大比例尺的分母較小，表示範圍較小，但內容通常較詳細。' },
  { id: 'tw-scale-small', mapKind: 'diagram', diagramKind: 'scale-small', name: '小比例尺地圖', levels: basicLevels, hint: '找呈現範圍較大、地物較簡略的圖卡。', reason: '小比例尺的分母較大，表示範圍較大，但內容通常較簡略。' },
]

export const taiwanContourItems = [
  { id: 'tw-contour-steep', mapKind: 'diagram', diagramKind: 'contour-steep', name: '陡坡', levels: allLevels, hint: '找等高線排列最密集的坡面。', reason: '等高線越密集，代表同樣水平距離內高度變化越大，坡度越陡。' },
  { id: 'tw-contour-gentle', mapKind: 'diagram', diagramKind: 'contour-gentle', name: '緩坡', levels: allLevels, hint: '找等高線排列最疏鬆的坡面。', reason: '等高線越疏，代表同樣水平距離內高度變化較小，坡度越緩。' },
  { id: 'tw-contour-hill', mapKind: 'diagram', diagramKind: 'contour-hill', name: '山頂', levels: allLevels, hint: '找封閉曲線，並觀察高度向中心增加。', reason: '等高線呈封閉狀且高度由外向內增加，表示中心為山頂。' },
  { id: 'tw-contour-basin', mapKind: 'diagram', diagramKind: 'contour-basin', name: '盆地', levels: basicLevels, hint: '找封閉曲線，並觀察高度向中心降低。', reason: '等高線呈封閉狀且高度由外向內降低，表示中心較低，可能是盆地或窪地。' },
  { id: 'tw-contour-valley', mapKind: 'diagram', diagramKind: 'contour-valley', name: '山谷', levels: basicLevels, hint: '找等高線呈 V 字，尖端指向較高處的圖卡。', reason: '河谷穿越等高線時，等高線彎曲的尖端通常指向上游與較高處。' },
  { id: 'tw-contour-ridge', mapKind: 'diagram', diagramKind: 'contour-ridge', name: '山脊', levels: advancedOnly, hint: '找等高線呈 V 或 U 字，突出方向朝向較低處的圖卡。', reason: '山脊由高處向低處延伸，等高線彎曲的突出方向通常朝向較低處。' },
]

export const taiwanMountainItems = [
  { id: 'tw-mountain-central', mapKind: 'line', path: 'M 845 565 C 825 660 805 750 780 835 C 755 930 725 1015 700 1100', name: '中央山脈', levels: allLevels, hint: '它由宜蘭南側向南延伸，是臺灣最長的山脈，呈東北—西南走向。', reason: '中央山脈縱貫臺灣本島中東部，是東西部河川的重要分水嶺，南端約至北大武山一帶。' },
  { id: 'tw-mountain-xueshan', mapKind: 'line', path: 'M 965 435 C 930 445 900 465 875 495 C 840 535 805 585 780 640 C 755 690 735 730 720 755', name: '雪山山脈', levels: allLevels, hint: '它北起三貂角，沿蘭陽平原北側與西側轉向西南，位於中央山脈西北方。', reason: '雪山山脈北起新北市三貂角，呈東北—西南走向，經北部與中部山區，南至濁水溪北岸。' },
  { id: 'tw-mountain-yushan', mapKind: 'line', path: 'M 735 735 C 712 785 692 840 675 910', name: '玉山山脈', levels: allLevels, hint: '它位於臺灣中南部、中央山脈西側，位置在阿里山山脈以東。', reason: '玉山山脈位於中央山脈與阿里山山脈之間，包含臺灣最高峰玉山主峰。' },
  { id: 'tw-mountain-alishan', mapKind: 'line', path: 'M 690 755 C 670 805 650 860 635 920', name: '阿里山山脈', levels: allLevels, hint: '它位於玉山山脈西側、嘉義東部山區。', reason: '阿里山山脈大致呈東北—西南走向，位於玉山山脈西側，沒有延伸到嘉南平原。' },
  { id: 'tw-mountain-coastal', mapKind: 'line', path: 'M 842 730 C 832 815 818 900 800 975 C 785 1020 765 1060 742 1092', name: '海岸山脈', levels: allLevels, hint: '它位於花東縱谷東側，但仍在臺灣本島陸地內，不是沿著外海海面。', reason: '海岸山脈位於花蓮、臺東東部，西側隔花東縱谷與中央山脈相望，南端接近卑南一帶。' },
]

export const taiwanLandformItems = [
  { id: 'tw-landform-taipei-basin', mapKind: 'point', x: 870, y: 410, name: '臺北盆地', levels: allLevels, hint: '往臺灣北部、淡水河流域尋找。', reason: '臺北盆地位於臺灣北部，是人口與都市高度集中的盆地。' },
  { id: 'tw-landform-taichung-basin', mapKind: 'point', x: 690, y: 665, name: '臺中盆地', levels: allLevels, hint: '往臺灣中部、臺中市內陸尋找。', reason: '臺中盆地位於大肚臺地東側與山地之間。' },
  { id: 'tw-landform-puli-basin', mapKind: 'point', x: 758, y: 710, name: '埔里盆地', levels: basicLevels, hint: '往南投縣中央、群山環繞處尋找。', reason: '埔里盆地位於臺灣本島中部，是典型的山間盆地。' },
  { id: 'tw-landform-taiyuan-basin', mapKind: 'point', x: 825, y: 985, name: '泰源盆地', levels: advancedOnly, hint: '往臺東縣東河鄉、海岸山脈內部尋找。', reason: '泰源盆地位於海岸山脈內，是四周受山地包圍的盆地。' },
  { id: 'tw-landform-yilan-plain', mapKind: 'point', x: 925, y: 500, name: '蘭陽平原', levels: allLevels, hint: '往臺灣東北部、宜蘭縣沿海尋找。', reason: '蘭陽平原由蘭陽溪沖積形成，呈三角形沖積平原。' },
  { id: 'tw-landform-changhua-plain', mapKind: 'point', x: 595, y: 720, name: '彰化平原', levels: basicLevels, hint: '往臺灣中西部、濁水溪以北的沿海平地尋找。', reason: '彰化平原位於臺灣中西部，介於大肚臺地、八卦臺地與臺灣海峽之間。' },
  { id: 'tw-landform-chianan-plain', mapKind: 'point', x: 585, y: 885, name: '嘉南平原', levels: allLevels, hint: '往臺灣西南部、嘉義與臺南一帶尋找。', reason: '嘉南平原是臺灣面積最大的平原，農業發達。' },
  { id: 'tw-landform-pingtung-plain', mapKind: 'point', x: 640, y: 1060, name: '屏東平原', levels: basicLevels, hint: '往臺灣南部、高屏溪下游以東尋找。', reason: '屏東平原位於高雄以東、恆春半島以北。' },
  { id: 'tw-landform-linkou-plateau', mapKind: 'point', x: 820, y: 425, name: '林口臺地', levels: basicLevels, hint: '往臺北盆地西側、桃園臺地東北方尋找。', reason: '林口臺地位於臺北盆地與桃園臺地之間，地勢較周圍平地高。' },
  { id: 'tw-landform-taoyuan-plateau', mapKind: 'point', x: 800, y: 465, name: '桃園臺地', levels: basicLevels, hint: '往臺灣西北部、桃園市尋找，不要移到新竹地區。', reason: '桃園臺地位於林口臺地西南側，過去埤塘密布，形成重要的人文地景。' },
  { id: 'tw-landform-dadu-plateau', mapKind: 'point', x: 645, y: 645, name: '大肚臺地', levels: basicLevels, hint: '往臺中盆地西側、臺中市海線以東尋找。', reason: '大肚臺地位於臺中盆地西側，呈南北狹長分布。' },
  { id: 'tw-landform-bagua-plateau', mapKind: 'point', x: 660, y: 735, name: '八卦臺地', levels: basicLevels, hint: '往彰化平原東側、濁水溪以北尋找。', reason: '八卦臺地位於彰化平原與南投丘陵之間，呈西北—東南方向延伸。' },
  { id: 'tw-landform-east-rift-valley', mapKind: 'line', path: 'M 818 720 C 808 795 797 865 785 930 C 776 980 765 1025 754 1060', name: '花東縱谷', levels: allLevels, hint: '它位於中央山脈與海岸山脈之間，不在海岸山脈東側。', reason: '花東縱谷是一條南北狹長的谷地，北起花蓮、向南延伸至臺東，西鄰中央山脈、東鄰海岸山脈。' },
]

export const taiwanCoastItems = [
  { id: 'tw-coast-north', mapKind: 'line', path: taiwanCoastlineGeometry['tw-coast-north'], name: '北部岬灣海岸', levels: allLevels, hint: '沿臺灣北端實際海岸線，找岬角與海灣交錯處。', reason: '北部岩岸受差異侵蝕影響，常見岬角與海灣；線段沿縣市底圖的本島外輪廓標示。' },
  { id: 'tw-coast-west', mapKind: 'line', path: taiwanCoastlineGeometry['tw-coast-west'], name: '西部沙岸', levels: allLevels, hint: '沿臺灣西部實際海岸線尋找。', reason: '西部河川輸沙量大、沿海水淺，形成沙洲、潟湖等堆積地形；線段沿縣市底圖的本島外輪廓標示。' },
  { id: 'tw-coast-east', mapKind: 'line', path: taiwanCoastlineGeometry['tw-coast-east'], name: '東部斷層海岸', levels: allLevels, hint: '沿臺灣東部實際海岸線尋找。', reason: '東部山地逼近太平洋，海岸陡峭且海水較深；線段沿縣市底圖的本島外輪廓標示。' },
  { id: 'tw-coast-south', mapKind: 'line', path: taiwanCoastlineGeometry['tw-coast-south'], name: '南部珊瑚礁海岸', levels: allLevels, hint: '沿恆春半島周圍的實際海岸線尋找。', reason: '南部海水溫暖清澈，適合珊瑚礁生長；線段沿縣市底圖的本島外輪廓標示。' },
]

export const taiwanIslandPortItems = [
  { id: 'tw-port-keelung', mapKind: 'point', ...taiwanPortPointGeometry['tw-port-keelung'], name: '基隆港', levels: allLevels, hint: '往臺灣北部岬灣海岸尋找。', reason: '基隆港利用天然岬灣發展，是北部重要港口；標示點吸附於共用海岸輪廓。' },
  { id: 'tw-port-taichung', mapKind: 'point', ...taiwanPortPointGeometry['tw-port-taichung'], name: '臺中港', levels: allLevels, hint: '往臺灣中部西岸尋找。', reason: '臺中港位於臺灣中部西岸，屬人工港；標示點吸附於共用海岸輪廓。' },
  { id: 'tw-port-kaohsiung', mapKind: 'point', ...taiwanPortPointGeometry['tw-port-kaohsiung'], name: '高雄港', levels: allLevels, hint: '往臺灣西南部尋找。', reason: '高雄港位於臺灣西南部，是臺灣重要商港；標示點吸附於共用海岸輪廓。' },
  { id: 'tw-port-hualien', mapKind: 'point', ...taiwanPortPointGeometry['tw-port-hualien'], name: '花蓮港', levels: basicLevels, hint: '往臺灣東部、花蓮沿岸尋找。', reason: '花蓮港位於東部斷層海岸，為人工開鑿港口；標示點吸附於共用海岸輪廓。' },
  { id: 'tw-coast-hengchun', mapKind: 'point', ...taiwanPortPointGeometry['tw-coast-hengchun'], name: '恆春半島', levels: allLevels, hint: '往臺灣本島最南端、屏東南部尋找，不要移到臺東縣。', reason: '恆春半島位於臺灣本島最南端的屏東縣，周邊可見珊瑚礁海岸。' },
]

export const taiwanClimateItems = [
  { id: 'tw-climate-northeast-monsoon', mapKind: 'line', path: 'M 985 250 C 930 300 885 350 840 430', name: '冬季東北季風', levels: allLevels, hint: '風從臺灣東北方吹來，先影響北部與東北部。', reason: '冬季東北季風使北部、東北部迎風坡較多雨，中南部背風側較乾燥。' },
  { id: 'tw-climate-southwest-monsoon', mapKind: 'line', path: 'M 470 1210 C 540 1110 610 1020 680 930', name: '夏季西南季風', levels: allLevels, hint: '風從臺灣西南方海面吹來。', reason: '夏季西南季風帶來暖濕水氣，使臺灣夏季降雨增加。' },
  { id: 'tw-climate-northeast-windward', mapKind: 'point', x: 920, y: 500, name: '冬季迎風區', levels: allLevels, hint: '找東北季風最先吹到的北部、東北部。', reason: '臺灣北部與東北部位於冬季東北季風迎風側，冬雨較明顯。' },
  { id: 'tw-climate-southwest-windward', mapKind: 'point', x: 610, y: 950, name: '夏季迎風區', levels: basicLevels, hint: '找夏季西南季風先吹到的西南部。', reason: '夏季西南風帶來水氣，臺灣西南側及山區迎風坡雨量增加。' },
  { id: 'tw-climate-typhoon-east', mapKind: 'line', path: 'M 995 770 C 930 760 875 750 820 740', name: '颱風由東側接近', levels: basicLevels, hint: '臺灣颱風多由西北太平洋生成後向西接近。', reason: '侵臺颱風常由臺灣東方海面接近，帶來強風、豪雨與災害風險。' },
  { id: 'tw-climate-tropic', mapKind: 'line', path: taiwanTropicGeometry, name: '北回歸線氣候分界', levels: advancedOnly, hint: '找約北緯 23.5° 的東西向緯線。', reason: '北回歸線通過臺灣中南部，但臺灣氣候仍同時受緯度、季風、地形與海洋影響。' },
]

export const taiwanRiverItems = [
  { id: 'tw-river-tamsui', mapKind: 'line', path: taiwanRiverGeometry['tw-river-tamsui'].path, name: '淡水河', levels: allLevels, hint: '往臺灣北部、臺北盆地出海的河流尋找。', reason: '淡水河流經臺北盆地，流域人口稠密。' },
  { id: 'tw-river-dajia', mapKind: 'line', path: taiwanRiverGeometry['tw-river-dajia'].path, name: '大甲溪', levels: basicLevels, hint: '往臺灣中部、臺中市北側尋找。', reason: '大甲溪源自中央山脈，向西流入臺灣海峽，水力資源豐富。' },
  { id: 'tw-river-zhuoshui', mapKind: 'line', path: taiwanRiverGeometry['tw-river-zhuoshui'].path, name: '濁水溪', levels: allLevels, hint: '往臺灣中部、彰化與雲林交界附近尋找。', reason: '濁水溪是臺灣最長河川，流域跨越臺灣中部。' },
  { id: 'tw-river-zengwen', mapKind: 'line', path: taiwanRiverGeometry['tw-river-zengwen'].path, name: '曾文溪', levels: basicLevels, hint: '往嘉南地區、臺灣西南部尋找。', reason: '曾文溪流經嘉南地區，流域內有曾文水庫。' },
  { id: 'tw-river-gaoping', mapKind: 'line', path: taiwanRiverGeometry['tw-river-gaoping'].path, name: '高屏溪', levels: allLevels, hint: '往高雄與屏東交界尋找。', reason: '高屏溪是臺灣流域面積最大的河川，出海口位於高雄、屏東交界。' },
  { id: 'tw-river-lanyang', mapKind: 'line', path: taiwanRiverGeometry['tw-river-lanyang'].path, name: '蘭陽溪', levels: basicLevels, hint: '往宜蘭縣、蘭陽平原尋找。', reason: '蘭陽溪沖積形成蘭陽平原，向東注入太平洋。' },
  { id: 'tw-river-xiuguluan', mapKind: 'line', path: taiwanRiverGeometry['tw-river-xiuguluan'].path, name: '秀姑巒溪', levels: advancedOnly, hint: '往花東縱谷中南部、東切海岸山脈的河流尋找。', reason: '秀姑巒溪切穿海岸山脈後注入太平洋，是東部重要河川。' },
]

export const taiwanWaterItems = [
  { id: 'tw-water-shimen', mapKind: 'area', areaType: 'water', path: taiwanWaterGeometry['tw-water-shimen'].path, name: '石門水庫', levels: allLevels, hint: '往桃園市南側、大漢溪上游尋找。', reason: '石門水庫供應桃園與北部部分地區用水，也兼具防洪、灌溉等功能。' },
  { id: 'tw-water-feitsui', mapKind: 'area', areaType: 'water', path: taiwanWaterGeometry['tw-water-feitsui'].path, name: '翡翠水庫', levels: basicLevels, hint: '往新北市東南部、新店溪上游尋找。', reason: '翡翠水庫是大臺北地區重要水源。' },
  { id: 'tw-water-sun-moon-lake', mapKind: 'area', areaType: 'water', path: taiwanWaterGeometry['tw-water-sun-moon-lake'].path, name: '日月潭', levels: allLevels, hint: '往南投縣中央尋找。', reason: '日月潭是臺灣著名湖泊，也與水力發電及觀光發展有關。' },
  { id: 'tw-water-zengwen', mapKind: 'area', areaType: 'water', path: taiwanWaterGeometry['tw-water-zengwen'].path, name: '曾文水庫', levels: allLevels, hint: '往嘉義、臺南交界附近的曾文溪上游尋找。', reason: '曾文水庫是臺灣蓄水量大的水庫之一，供應嘉南地區用水。' },
  { id: 'tw-water-wushantou', mapKind: 'area', areaType: 'water', path: taiwanWaterGeometry['tw-water-wushantou'].path, name: '烏山頭水庫', levels: basicLevels, hint: '往臺南市內陸、嘉南平原東側尋找。', reason: '烏山頭水庫與嘉南大圳相連，對嘉南平原灌溉十分重要。' },
  { id: 'tw-water-nanhua', mapKind: 'area', areaType: 'water', path: taiwanWaterGeometry['tw-water-nanhua'].path, name: '南化水庫', levels: advancedOnly, hint: '往臺南市東部山區尋找。', reason: '南化水庫是南部重要公共給水水源之一。' },
]

export const taiwanGeographyTopics = [
  { id: 'tw-map-skills', name: '地圖基本功', description: '方位、經緯線與地圖判讀', semester: '翰林七上 L01', items: taiwanMapSkillItems },
  { id: 'tw-scale', name: '比例尺判讀', description: '數字、文字、圖示與大小比例尺', semester: '翰林七上 L01', items: taiwanScaleItems },
  { id: 'tw-contours', name: '等高線判讀', description: '陡緩坡、山頂、盆地、山谷與山脊', semester: '翰林七上 L01', items: taiwanContourItems },
  { id: 'tw-location', name: '世界中的臺灣', description: '海域、離島與北回歸線', semester: '翰林七上 L02', items: taiwanLocationItems },
  { id: 'tw-administrative', name: '縣市填圖', description: '六都、22 縣市與離島', semester: '翰林七上 L02', items: taiwanCountyItems },
  { id: 'tw-mountains', name: '五大山脈', description: '主要山脈與花東縱谷', semester: '翰林七上 L03', items: taiwanMountainItems },
  { id: 'tw-landforms', name: '平原、盆地與臺地', description: '重要地形區的位置', semester: '翰林七上 L03', items: taiwanLandformItems },
  { id: 'tw-coasts', name: '四種海岸', description: '北岬灣、西沙岸、東斷層、南珊瑚礁', semester: '翰林七上 L04', items: taiwanCoastItems },
  { id: 'tw-islands-ports', name: '島嶼、半島與港口', description: '離島、恆春半島與主要港口', semester: '翰林七上 L04', items: taiwanIslandPortItems },
  { id: 'tw-climate', name: '季風與降雨', description: '季風、迎背風與颱風路徑', semester: '翰林七上 L05', items: taiwanClimateItems },
  { id: 'tw-rivers', name: '主要河川', description: '流向、流域與重要河川', semester: '翰林七上 L06', items: taiwanRiverItems },
  { id: 'tw-water', name: '水庫與水資源', description: '主要水庫及供水問題', semester: '翰林七上 L06', items: taiwanWaterItems },
]

export const taiwanGeographyChapters = [
  { id: 'grade7-upper-l01', name: '七上第 1 章　認識位置與地圖', shortName: '七上第 1 章', description: '練習方位、經緯線、比例尺與等高線判讀。', topicIds: ['tw-map-skills', 'tw-scale', 'tw-contours'] },
  { id: 'grade7-upper-l02', name: '七上第 2 章　世界中的臺灣', shortName: '七上第 2 章', description: '認識臺灣的位置、鄰近海域、離島與 22 縣市。', topicIds: ['tw-location', 'tw-administrative'] },
  { id: 'grade7-upper-l03', name: '七上第 3 章　地形', shortName: '七上第 3 章', description: '練習五大山脈、花東縱谷、平原、盆地與臺地。', topicIds: ['tw-mountains', 'tw-landforms'] },
  { id: 'grade7-upper-l04', name: '七上第 4 章　海岸與島嶼', shortName: '七上第 4 章', description: '比較四種海岸，並辨認島嶼、半島與港口。', topicIds: ['tw-coasts', 'tw-islands-ports'] },
  { id: 'grade7-upper-l05', name: '七上第 5 章　天氣與氣候', shortName: '七上第 5 章', description: '練習季風、地形雨、迎背風與颱風路徑。', topicIds: ['tw-climate'] },
  { id: 'grade7-upper-l06', name: '七上第 6 章　水文', shortName: '七上第 6 章', description: '認識主要河川、水庫與臺灣水資源課題。', topicIds: ['tw-rivers', 'tw-water'] },
]

export function filterTaiwanItemsByDifficulty(items, difficultyId) {
  return items.filter((item) => (item.levels || allLevels).includes(difficultyId))
}
