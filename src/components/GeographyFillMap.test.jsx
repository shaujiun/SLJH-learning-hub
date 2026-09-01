import React from 'react'
import { renderToString } from 'react-dom/server'
import chinaMap from '@svg-maps/china'
import taiwanMap from '@svg-maps/taiwan'
import { afterEach, describe, expect, it } from 'vitest'
import {
  chinaBeltRoadItems,
  chinaEconomicZoneItems,
  eastAsiaCountryItems,
  eastAsiaCurrentItems,
  eastAsiaMonsoonItems,
  japanEconomyItems,
  japanIndustrialRegionItems,
  koreaEconomyItems,
  koreanPeninsulaLocationItems,
  chinaLakeItems,
  chinaPopulationChangeItems,
  chinaProvinceItems,
  chinaRcepItems,
  chinaReliefStepItems,
  chinaSeaItems,
} from '../data/chinaGeography.js'
import { eastAsiaMap, japanIndustryMap, koreanPeninsulaMap } from '../data/eastAsiaMap.js'
import { taiwanContourItems, taiwanScaleItems, taiwanWaterItems } from '../data/taiwanGeography.js'
import {
  europeClimateItems,
  europeCountryItems,
  europeLandformItems,
  europeMountainItems,
  europePhysicalMap,
  europeRegionalMap,
  europeRiverItems,
  europeWaterItems,
  northEastEuropeCapitalItems,
  northEastEuropeItems,
  russiaLandformItems,
  russiaMountainWaterItems,
  russiaPhysicalMap,
  southWestEuropeCapitalItems,
  southWestEuropeCountryItems,
  southWestEuropeItems,
} from '../data/worldGeography.js'
import GeographyFillMap, { ChinaMap, EuropeMap, GeographyConceptDiagram, GeographyCourseConnection, GeographyFillBoard, GeographyMap } from './GeographyFillMap.jsx'

const originalWindow = globalThis.window

afterEach(() => {
  globalThis.window = originalWindow
})

describe('GeographyFillMap', () => {
  it('renders the shared East Asia base map and directional wind/current arrows', () => {
    const renderEastAsiaMap = (currentItem, topicItems) => renderToString(
      <GeographyMap
        mapDefinition={eastAsiaMap}
        mapLabel="東北亞共用底圖"
        areaId="china"
        currentItem={currentItem}
        topicItems={topicItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    const countryHtml = renderEastAsiaMap(eastAsiaCountryItems[0], eastAsiaCountryItems)
    const monsoonHtml = renderEastAsiaMap(eastAsiaMonsoonItems[0], eastAsiaMonsoonItems)
    const currentHtml = renderEastAsiaMap(eastAsiaCurrentItems[0], eastAsiaCurrentItems)

    expect(countryHtml).toContain('viewBox="690 230 235 205"')
    expect(countryHtml.match(/data-map-id=/g)).toHaveLength(7)
    expect(countryHtml).toContain('data-map-id="jp"')
    expect(countryHtml).toContain('data-map-id="kr"')
    expect(monsoonHtml.match(/class="geography-feature-line-visible is-wind-/g)).toHaveLength(2)
    expect(monsoonHtml).toContain('marker-end="url(#geography-arrow-map-china-wind-winter)"')
    expect(monsoonHtml).toContain('marker-end="url(#geography-arrow-map-china-wind-summer)"')
    expect(currentHtml).toContain('marker-end="url(#geography-arrow-map-china-ocean-warm)"')
    expect(currentHtml).toContain('marker-end="url(#geography-arrow-map-china-ocean-cold)"')
  })

  it('以同一套東北亞底圖放大日本工業區與朝鮮半島，不用另一張近似地圖', () => {
    const industryHtml = renderToString(
      <GeographyMap
        mapDefinition={japanIndustryMap}
        mapLabel="日本主要工業區"
        areaId="china"
        currentItem={japanIndustrialRegionItems[0]}
        topicItems={japanIndustrialRegionItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const koreaHtml = renderToString(
      <GeographyMap
        mapDefinition={koreanPeninsulaMap}
        mapLabel="朝鮮半島主要都市"
        areaId="china"
        currentItem={koreanPeninsulaLocationItems[0]}
        topicItems={koreanPeninsulaLocationItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId={koreanPeninsulaLocationItems[1].id}
        onAnswer={() => {}}
      />,
    )

    expect(industryHtml).toContain('viewBox="837 350 34 15"')
    expect(industryHtml).toContain('is-japanindustry')
    const solvedIndustryHtml = renderToString(
      <GeographyMap
        mapDefinition={japanIndustryMap}
        mapLabel="日本工業區"
        areaId="china"
        currentItem={japanIndustrialRegionItems[0]}
        topicItems={japanIndustrialRegionItems}
        effectiveMode="locate"
        revealed={false}
        solved
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    expect(solvedIndustryHtml).toContain('geography-point-feedback is-correct')
    expect(solvedIndustryHtml).toContain('答對')
    expect(industryHtml.match(/geography-map-point-industrial-marker/g)).toHaveLength(6)
    expect(industryHtml).toContain('虛線橢圓代表課本工業區的概略範圍')
    expect(koreaHtml).toContain('viewBox="822 338 21 25"')
    expect(koreaHtml).toContain('is-koreanpeninsula')
    expect(koreaHtml).toContain('geography-point-feedback is-wrong')
    expect(koreaHtml).toContain('再想想')
    expect(koreaHtml).toContain('圓點代表都市所在位置')
    expect(koreaHtml).toContain('is-political-boundary')
  })

  it('八上第六章的日本與南北韓概念圖卡在作答前不顯示答案名稱', () => {
    const japanHtml = renderToString(
      <GeographyConceptDiagram
        currentItem={japanEconomyItems[0]}
        topicItems={japanEconomyItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const koreaHtml = renderToString(
      <GeographyConceptDiagram
        currentItem={koreaEconomyItems[0]}
        topicItems={koreaEconomyItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(japanHtml).toContain('is-japan-import-export')
    expect(japanHtml).toContain(japanEconomyItems[0].visualCue)
    expect(japanHtml).not.toContain('進口原料、出口工業產品')
    expect(koreaHtml).toContain('is-korea-north-heavy')
    expect(koreaHtml).toContain(koreaEconomyItems[0].visualCue)
    expect(koreaHtml).not.toContain('北韓重工業與國防工業')
  })

  it('預設顯示臺灣地理正式課本章節，再顯示目前章節的主題與練習方式', () => {
    globalThis.window = {
      location: new URL('http://127.0.0.1:4173/?geography=maps'),
      scrollTo: () => {},
    }

    const html = renderToString(<GeographyFillMap />)

    expect(html).toContain('地理填圖學習系統')
    expect(html).toContain('臺灣地理')
    expect(html).toContain('中國地理')
    expect(html).toContain('八上全冊已開放')
    expect(html).toContain('世界地理')
    expect(html).toContain('九年級')
    expect(html).toContain('第 1～2 章已開放')
    expect(html).toContain('七上第 1 章　認識位置與地圖')
    expect(html).toContain('七上第 2 章　世界中的臺灣')
    expect(html).toContain('七上第 6 章　水文')
    expect(html).toContain('地圖基本功')
    expect(html).toContain('比例尺判讀')
    expect(html).toContain('等高線判讀')
    expect(html).not.toContain('地勢三級階梯')
    expect(html).not.toContain('<em>翰林八上 L03</em>')
    expect(html).toContain('看名稱找位置')
    expect(html).toContain('看位置選名稱')
    expect(html).toContain('標籤填圖')
    expect(html).toContain('混合挑戰')
    expect(html).toContain('返回任務頁')
    expect(html).toContain('返回聯絡簿')
  })

  it('以三組可選雙箭頭呈現階梯範圍，作答前不顯示階梯名稱', () => {
    const html = renderToString(
      <ChinaMap
        currentItem={chinaReliefStepItems[0]}
        topicItems={chinaReliefStepItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(html.match(/geography-map-range /g)).toHaveLength(3)
    expect(html).toContain('geography-relief-step-band')
    expect(html.match(/--range-start:/g)).toHaveLength(3)
    expect(html.match(/--range-width:/g)).toHaveLength(3)
    expect(html).toContain('依北緯 36° 地形剖面線分段；雙箭頭表示階梯範圍')
    expect(html).toContain('可選擇的階梯分布範圍')
    expect(html).toContain('階梯範圍')
    expect(html).not.toContain('第一級階梯')
    expect(html).not.toContain('geography-map-point ')
  })

  it('公布答案後在雙箭頭中央顯示正確階梯名稱', () => {
    const html = renderToString(
      <ChinaMap
        currentItem={chinaReliefStepItems[0]}
        topicItems={chinaReliefStepItems}
        effectiveMode="locate"
        revealed
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(html).toContain('第一級階梯')
  })

  it('比例尺與等高線以不洩漏答案名稱的互動圖卡呈現', () => {
    const scaleHtml = renderToString(
      <GeographyConceptDiagram
        currentItem={taiwanScaleItems[0]}
        topicItems={taiwanScaleItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const contourHtml = renderToString(
      <GeographyConceptDiagram
        currentItem={taiwanContourItems[0]}
        topicItems={taiwanContourItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(scaleHtml).toContain('1：50,000')
    expect(scaleHtml).toContain('圖上 1 公分代表實地 500 公尺')
    expect(scaleHtml).not.toContain('數字比例尺')
    expect(contourHtml).toContain('geography-contour-graphic')
    expect(contourHtml).not.toContain('陡坡')
  })

  it('歐洲地圖使用共用精確國界並裁切到歐洲範圍', () => {
    const html = renderToString(
      <EuropeMap
        currentItem={europeCountryItems[0]}
        topicItems={europeCountryItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(html).toContain('viewBox="390 170 205 205"')
    expect(html).toContain('data-map-id="gb"')
    expect(html).toContain('data-map-id="fr"')
    expect(html).toContain('data-map-id="ru"')
    expect(html).toContain('aria-label="歐洲國家精確國界填圖地圖"')
    expect(html).not.toContain('>英國<')
  })

  it('歐洲自然環境共用延伸底圖，並區分山脈、河流、區域與海域標記', () => {
    const renderMap = (currentItem, topicItems) => renderToString(
      <GeographyMap
        mapDefinition={europePhysicalMap}
        mapLabel="歐洲自然環境填圖地圖"
        areaId="world"
        currentItem={currentItem}
        topicItems={topicItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    const mountainHtml = renderMap(europeMountainItems[0], europeMountainItems)
    const riverHtml = renderMap(europeRiverItems[0], europeRiverItems)
    const landformHtml = renderMap(europeLandformItems[0], europeLandformItems)
    const climateHtml = renderMap(europeClimateItems[0], europeClimateItems)
    const waterHtml = renderMap(europeWaterItems.find((item) => item.name === '黑海'), europeWaterItems)

    expect(mountainHtml).toContain('viewBox="390 155 320 245"')
    expect(mountainHtml.match(/geography-feature-line-visible is-mountain/g)).toHaveLength(5)
    expect(riverHtml.match(/geography-feature-line-visible "/g)).toHaveLength(2)
    expect(landformHtml.match(/geography-area-layer is-landform/g)).toHaveLength(6)
    expect(climateHtml.match(/geography-area-layer is-climate/g)).toHaveLength(4)
    expect(waterHtml.match(/geography-map-point /g)).toHaveLength(7)
    expect(waterHtml.match(/geography-feature-area-hit/g)).toHaveLength(2)
    expect(waterHtml).toContain('選擇這個水域')
  })

  it('九上第 2 章把國家與首都拆開，並清楚說明點位意義', () => {
    const northEastHtml = renderToString(
      <GeographyMap
        mapDefinition={europePhysicalMap}
        mapLabel="北歐與東歐國家及首都地圖"
        areaId="world"
        currentItem={northEastEuropeCapitalItems.find((item) => item.name === '華沙')}
        topicItems={northEastEuropeCapitalItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const southWestHtml = renderToString(
      <GeographyMap
        mapDefinition={europeRegionalMap}
        mapLabel="南歐與西歐國家及首都地圖"
        areaId="world"
        currentItem={southWestEuropeCapitalItems.find((item) => item.name === '雅典')}
        topicItems={southWestEuropeCapitalItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const russiaLandformHtml = renderToString(
      <GeographyMap
        mapDefinition={russiaPhysicalMap}
        mapLabel="俄羅斯四大地形區地圖"
        areaId="world"
        currentItem={russiaLandformItems[0]}
        topicItems={russiaLandformItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const russiaWaterHtml = renderToString(
      <GeographyMap
        mapDefinition={russiaPhysicalMap}
        mapLabel="俄羅斯山脈與海域地圖"
        areaId="world"
        currentItem={russiaMountainWaterItems[0]}
        topicItems={russiaMountainWaterItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(northEastHtml.match(/geography-map-point /g)).toHaveLength(4)
    expect(southWestHtml.match(/geography-map-point /g)).toHaveLength(11)
    expect(northEastHtml).toContain('圓點只代表首都所在位置，不代表整個國家範圍。')
    expect(southWestHtml).toContain('translate(541.4 347.7)')
    expect(russiaLandformHtml).toContain('viewBox="510 105 480 300"')
    expect(russiaLandformHtml).toContain('<clipPath id="geography-map-clip-world-RussiaPhysical"')
    expect(russiaLandformHtml).toContain('clip-path="url(#geography-map-clip-world-RussiaPhysical)"')
    expect(russiaLandformHtml.match(/geography-area-layer is-landform/g)).toHaveLength(4)
    expect(russiaWaterHtml.match(/geography-feature-line-visible is-mountain/g)).toHaveLength(3)
    expect(russiaWaterHtml.match(/geography-map-point /g)).toHaveLength(3)
    expect(russiaWaterHtml.match(/geography-feature-area-hit/g)).toHaveLength(2)
  })

  it('南歐與西歐國家題不混入首都點，馬爾他另用菱形定位點並提供說明', () => {
    const html = renderToString(
      <GeographyMap
        mapDefinition={europeRegionalMap}
        mapLabel="南歐與西歐國家地圖"
        areaId="world"
        currentItem={southWestEuropeCountryItems.find((item) => item.name === '馬爾他')}
        topicItems={southWestEuropeCountryItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(html.match(/geography-map-point /g)).toHaveLength(1)
    expect(html).toContain('geography-map-point-country-marker')
    expect(html).toContain('菱形代表面積較小的國家位置（馬爾他）。')
    expect(html).not.toContain('圓點只代表首都所在位置')
  })

  it('人口政策、一帶一路與 RCEP 使用不洩漏名稱的概念圖卡', () => {
    const populationHtml = renderToString(
      <GeographyConceptDiagram
        currentItem={chinaPopulationChangeItems[0]}
        topicItems={chinaPopulationChangeItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const beltRoadHtml = renderToString(
      <GeographyConceptDiagram
        currentItem={chinaBeltRoadItems[0]}
        topicItems={[chinaBeltRoadItems[0]]}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const rcepHtml = renderToString(
      <GeographyConceptDiagram
        currentItem={chinaRcepItems[0]}
        topicItems={chinaRcepItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(populationHtml).toContain('geography-concept-graphic')
    expect(populationHtml).not.toContain('一胎化政策')
    expect(beltRoadHtml).toContain('geography-concept-route')
    expect(beltRoadHtml).toContain('中亞')
    expect(beltRoadHtml).toContain('西亞')
    expect(beltRoadHtml).not.toContain('東南亞')
    expect(beltRoadHtml).toContain('marker-end="url(#belt-road-land-land-arrow)"')
    expect(beltRoadHtml).not.toContain('絲綢之路經濟帶')
    expect(rcepHtml).toContain('geography-rcep-graphic')
    expect(rcepHtml).toContain('geography-rcep-network')
    expect(rcepHtml).toContain('geography-rcep-customs')
    expect(rcepHtml).toContain('geography-rcep-loop')
    expect(rcepHtml).not.toContain('>10<')
    expect(rcepHtml).not.toContain('RCEP 的亞太成員範圍')
  })

  it('RCEP 顯示與八上經濟章的課程連結說明', () => {
    const html = renderToString(<GeographyCourseConnection text="對應八上第 4 章「中國的經濟發展與全球關連」。" />)
    expect(html).toContain('與本章的連結')
    expect(html).toContain('中國的經濟發展與全球關連')
    expect(html).toContain('geography-course-connection')
  })

  it('一帶一路雙路線圖分別呈現陸路與海路的主要節點', () => {
    const html = renderToString(
      <GeographyConceptDiagram
        currentItem={chinaBeltRoadItems[2]}
        topicItems={[chinaBeltRoadItems[2]]}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(html).toContain('中亞')
    expect(html).toContain('西亞')
    expect(html).toContain('東南亞')
    expect(html).toContain('南亞')
    expect(html).toContain('東非')
    expect(html).toContain('geography-concept-route is-land')
    expect(html).toContain('geography-concept-route is-sea')
    expect(html).not.toContain('一帶一路</span>')
  })

  it('標籤填圖同時提供多張可拖曳標籤與多個空白圖卡', () => {
    const items = taiwanScaleItems.slice(0, 3)
    const html = renderToString(
      <GeographyFillBoard
        mapDefinition={taiwanMap}
        mapLabel="臺灣地圖"
        areaId="taiwan"
        items={items}
        onProgress={() => {}}
        onScore={() => {}}
        onFinish={() => {}}
      />,
    )

    expect(html.match(/draggable="true"/g)).toHaveLength(3)
    expect(html.match(/geography-diagram-card /g)).toHaveLength(3)
    expect(html).toContain('先選標籤，再點位置')
    expect(html).toContain('手機和平板可先點標籤')
    expect(html).not.toContain('查看本回合結果')
  })

  it('湖泊、水庫與海域輪廓都能成為鍵盤及點選作答區', () => {
    const lakeHtml = renderToString(
      <ChinaMap
        currentItem={chinaLakeItems[0]}
        topicItems={chinaLakeItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const seaHtml = renderToString(
      <ChinaMap
        currentItem={chinaSeaItems[0]}
        topicItems={chinaSeaItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const fillHtml = renderToString(
      <GeographyFillBoard
        mapDefinition={taiwanMap}
        mapLabel="臺灣地圖"
        areaId="taiwan"
        items={taiwanWaterItems.slice(0, 3)}
        onProgress={() => {}}
        onScore={() => {}}
        onFinish={() => {}}
      />,
    )

    expect(lakeHtml.match(/geography-feature-area-hit/g)).toHaveLength(4)
    expect(lakeHtml).toContain('選擇這個水域')
    expect(seaHtml.match(/geography-feature-area-hit/g)).toHaveLength(4)
    expect(seaHtml).toContain('選擇這個海域')
    expect(fillHtml.match(/水域標籤放置區/g)).toHaveLength(3)
  })

  it('中國行政區提供尖端指向實際位置的澳門放大作答氣泡', () => {
    const macau = chinaProvinceItems.find((item) => item.mapId === 'macau')
    const mapHtml = renderToString(
      <ChinaMap
        currentItem={macau}
        topicItems={chinaProvinceItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )
    const fillHtml = renderToString(
      <GeographyFillBoard
        mapDefinition={chinaMap}
        mapLabel="中國地圖"
        areaId="china"
        items={chinaProvinceItems}
        onProgress={() => {}}
        onScore={() => {}}
        onFinish={() => {}}
      />,
    )

    expect(mapHtml).toContain('data-map-id="macau-callout"')
    expect(mapHtml).toContain('M 505.9 515 L 622 468 L 622 498 Z')
    expect(mapHtml).toContain('小區域放大圖')
    expect(mapHtml).toContain('澳門小區域放大作答區')
    expect(mapHtml).not.toContain('geography-macau-callout-name')
    expect(fillHtml).toContain('data-map-id="macau-callout"')
  })

  it('經濟特區使用同一個 SVG 座標系，並提供可在手機點選的東南沿海放大圖', () => {
    const html = renderToString(
      <ChinaMap
        currentItem={chinaEconomicZoneItems[0]}
        topicItems={chinaEconomicZoneItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(html).toContain('viewBox="0 0 774 569"')
    expect(html).toContain('中國東南沿海經濟特區放大圖')
    expect(html).toContain('viewBox="485 465 82 56"')
    expect(html.match(/translate\(512 509\)/g)).toHaveLength(2)
    expect(html.match(/translate\(501 512\)/g)).toHaveLength(2)
    expect(html.match(/translate\(544 497\)/g)).toHaveLength(2)
    expect(html.match(/translate\(560 480\)/g)).toHaveLength(2)
    expect(html.match(/translate\(24 261\)/g)).toHaveLength(1)
    expect(html).toContain('geography-map-point-hit')
    expect(html).not.toContain('深圳經濟特區')
  })
})
