import React from 'react'
import { renderToString } from 'react-dom/server'
import chinaMap from '@svg-maps/china'
import taiwanMap from '@svg-maps/taiwan'
import { afterEach, describe, expect, it } from 'vitest'
import { chinaLakeItems, chinaProvinceItems, chinaReliefStepItems, chinaSeaItems } from '../data/chinaGeography.js'
import { taiwanContourItems, taiwanScaleItems, taiwanWaterItems } from '../data/taiwanGeography.js'
import GeographyFillMap, { ChinaMap, GeographyConceptDiagram, GeographyFillBoard } from './GeographyFillMap.jsx'

const originalWindow = globalThis.window

afterEach(() => {
  globalThis.window = originalWindow
})

describe('GeographyFillMap', () => {
  it('預設顯示臺灣地理正式課本章節，再顯示目前章節的主題與練習方式', () => {
    globalThis.window = {
      location: new URL('http://127.0.0.1:4173/?geography=maps'),
      scrollTo: () => {},
    }

    const html = renderToString(<GeographyFillMap />)

    expect(html).toContain('地理填圖學習系統')
    expect(html).toContain('臺灣地理')
    expect(html).toContain('中國地理')
    expect(html).toContain('世界地理')
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
    expect(lakeHtml).toContain('選擇這個湖泊或水庫')
    expect(seaHtml.match(/geography-feature-area-hit/g)).toHaveLength(4)
    expect(seaHtml).toContain('選擇這個海域')
    expect(fillHtml.match(/湖泊或水庫標籤放置區/g)).toHaveLength(3)
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
})
