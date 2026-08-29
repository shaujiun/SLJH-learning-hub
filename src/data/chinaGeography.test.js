import { describe, expect, it } from 'vitest'
import chinaMap from '@svg-maps/china'
import {
  chinaGeographyChapters,
  chinaGeographyTopics,
  chinaAgricultureItems,
  chinaClimateItems,
  chinaAutonomousRegionItems,
  chinaBeltRoadItems,
  chinaEconomicRegionItems,
  chinaEconomicZoneItems,
  chinaIndustryTransitionItems,
  chinaLakeItems,
  chinaPopulationChangeItems,
  chinaPopulationDistributionItems,
  chinaProvinceItems,
  chinaRcepItems,
  chinaReliefStepItems,
  chinaRiverItems,
  chinaSeaItems,
  chinaTerrainItems,
} from './chinaGeography.js'
import { chinaSeaGeometry } from './geographyHydrography.js'

function isPointInsideAreaPath(path, [x, y]) {
  const points = [...path.matchAll(/(?:M|L) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)]
    .map((match) => [Number(match[1]), Number(match[2])])
  let isInside = false
  for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
    const [currentX, currentY] = points[index]
    const [previousX, previousY] = points[previous]
    if ((currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX) {
      isInside = !isInside
    }
  }
  return isInside
}

describe('中國地理填圖資料', () => {
  it('每個行政區題目都能對應到向量地圖區塊', () => {
    const mapIds = new Set(chinaMap.locations.map((location) => location.id))
    expect(chinaProvinceItems).toHaveLength(chinaMap.locations.length)
    expect(chinaProvinceItems.every((item) => mapIds.has(item.mapId))).toBe(true)
  })

  it('八上四章目前十六個主題都有提示與判斷依據', () => {
    expect(chinaGeographyTopics.map((topic) => topic.id)).toEqual([
      'relief-steps',
      'administrative',
      'terrain',
      'rivers',
      'lakes',
      'seas',
      'climate',
      'agriculture',
      'population-distribution',
      'autonomous-regions',
      'population-change',
      'economic-zones',
      'economic-regions',
      'belt-and-road',
      'rcep',
      'industry-transition',
    ])
    for (const topic of chinaGeographyTopics) {
      expect(topic.items.length).toBeGreaterThan(0)
      expect(topic.items.every((item) => item.hint && item.reason)).toBe(true)
    }
  })

  it('所有題目識別碼皆不重複', () => {
    const ids = chinaGeographyTopics.flatMap((topic) => topic.items.map((item) => item.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('四個正式課本章節涵蓋且只涵蓋目前十六個主題', () => {
    const chapterTopicIds = chinaGeographyChapters.flatMap((chapter) => chapter.topicIds)
    expect(chinaGeographyChapters).toHaveLength(4)
    expect(chapterTopicIds).toEqual([
      'relief-steps', 'terrain', 'administrative', 'rivers', 'lakes', 'seas',
      'climate', 'agriculture',
      'population-distribution', 'autonomous-regions', 'population-change',
      'economic-zones', 'economic-regions', 'belt-and-road', 'rcep', 'industry-transition',
    ])
    expect(new Set(chapterTopicIds)).toEqual(new Set(chinaGeographyTopics.map((topic) => topic.id)))
  })

  it('人口章使用同一套中國地圖位置與概念圖卡，不把人口政策誤畫成定位點', () => {
    expect(chinaPopulationDistributionItems.find((item) => item.id === 'population-heihe-tengchong')).toMatchObject({
      mapKind: 'line',
      name: '黑河—騰衝線',
    })
    expect(chinaAutonomousRegionItems).toHaveLength(5)
    expect(chinaAutonomousRegionItems.every((item) => item.mapKind === 'province')).toBe(true)
    expect(chinaPopulationChangeItems).toHaveLength(4)
    expect(chinaPopulationChangeItems.every((item) => item.mapKind === 'diagram' && item.diagramKind)).toBe(true)
  })

  it('經濟章包含五個經濟特區、三大經濟地帶與全球關連圖卡', () => {
    expect(chinaEconomicZoneItems.map((item) => item.name)).toEqual([
      '深圳經濟特區', '珠海經濟特區', '汕頭經濟特區', '廈門經濟特區', '海南經濟特區',
    ])
    expect(chinaEconomicRegionItems.map((item) => item.name)).toEqual(['西部經濟地帶', '中部經濟地帶', '東部經濟地帶'])
    expect(chinaBeltRoadItems.every((item) => item.mapKind === 'diagram')).toBe(true)
    expect(chinaRcepItems).toHaveLength(4)
    expect(chinaIndustryTransitionItems).toHaveLength(4)
  })

  it('四個沿海經濟特區使用目前中國底圖的福建與廣東座標，海南使用整座省區', () => {
    const expectedCityPoints = {
      'economy-zone-shenzhen': [512, 509],
      'economy-zone-zhuhai': [501, 512],
      'economy-zone-shantou': [544, 497],
      'economy-zone-xiamen': [560, 480],
    }

    for (const [id, [x, y]] of Object.entries(expectedCityPoints)) {
      expect(chinaEconomicZoneItems.find((item) => item.id === id)).toMatchObject({
        mapKind: 'point', x, y, markerRadius: 5, hitRadius: 8,
      })
    }
    expect(chinaEconomicZoneItems.find((item) => item.id === 'economy-zone-hainan')).toMatchObject({
      mapKind: 'province', mapId: 'hainan',
    })
  })

  it('長江三角洲、東南丘陵與珠江三角洲校正回中國陸地', () => {
    const expectedPoints = {
      'terrain-yangtze-delta': [609, 389],
      'terrain-southeast-hills': [560, 438],
      'terrain-pearl-delta': [510, 510],
    }

    for (const [id, [x, y]] of Object.entries(expectedPoints)) {
      expect(chinaTerrainItems.find((item) => item.id === id)).toMatchObject({ mapKind: 'point', x, y })
    }
  })

  it('使用雙箭頭範圍而不是單一定位點表示三個階梯', () => {
    const steps = chinaReliefStepItems.filter((item) => item.id.startsWith('relief-step-'))

    expect(steps).toHaveLength(3)
    steps.forEach((step) => {
      expect(step.mapKind).toBe('range')
      expect(step.bandEnd).toBeGreaterThan(step.bandStart)
      expect(step).not.toHaveProperty('x')
      expect(step).not.toHaveProperty('y')
    })
    expect(steps.map((step) => [step.bandStart, step.bandEnd])).toEqual([
      [65, 380],
      [380, 485],
      [485, 622],
    ])
  })

  it('大興安嶺與太行山依實際山脈範圍分開，不再切割同一條階梯分界線', () => {
    const greaterKhingan = chinaReliefStepItems.find((item) => item.id === 'relief-greater-khingan')
    const taihang = chinaReliefStepItems.find((item) => item.id === 'relief-taihang')

    expect(greaterKhingan.path).toBe('M 603 62 C 600 91 595 121 587 150 C 579 181 566 208 551 234')
    expect(taihang.path).toBe('M 523 271 C 519 290 516 310 512 329 C 509 341 506 351 503 359')
  })

  it('主要山脈與秦嶺—淮河使用線狀範圍，不以單點表示', () => {
    const mountainIds = [
      'terrain-tianshan',
      'terrain-kunlun',
      'terrain-himalaya',
      'terrain-qinling',
      'terrain-hengduan',
    ]
    const mountains = chinaTerrainItems.filter((item) => mountainIds.includes(item.id))

    expect(mountains).toHaveLength(mountainIds.length)
    expect(mountains.every((item) => item.mapKind === 'line' && item.path.startsWith('M '))).toBe(true)
    expect(chinaClimateItems.some((item) => item.id === 'climate-qinling-huaihe' && item.mapKind === 'line')).toBe(true)
    expect(chinaAgricultureItems.some((item) => item.id === 'agriculture-qinling-huaihe-750' && item.mapKind === 'line')).toBe(true)
    expect(chinaAgricultureItems.some((item) => item.id === 'agriculture-rainfall-750')).toBe(false)
  })

  it('五條河川使用連續的實際河道折線，不再使用人工貝茲概略線', () => {
    expect(chinaRiverItems.map((item) => item.name)).toEqual(['黃河', '長江', '珠江', '黑龍江', '淮河'])
    chinaRiverItems.forEach((item) => {
      expect(item.mapKind).toBe('line')
      expect(item.path).not.toContain(' C ')
      expect((item.path.match(/M /g) || [])).toHaveLength(1)
      expect((item.path.match(/ L /g) || []).length).toBeGreaterThan(8)
    })
  })

  it('主要河流在教學地圖的海岸或國界處結束，不延伸到外海或俄羅斯境內', () => {
    const expectedBoundaryEnds = {
      'river-yellow': [602, 290.7],
      'river-yangtze': [612, 383],
      'river-pearl': [542.7, 504.7],
      'river-amur': [755.4, 157.4],
    }

    for (const [id, expected] of Object.entries(expectedBoundaryEnds)) {
      const item = chinaRiverItems.find((river) => river.id === id)
      const points = [...item.path.matchAll(/(?:M|L) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)]
        .map((match) => [Number(match[1]), Number(match[2])])
      expect([points[0], points.at(-1)]).toContainEqual(expected)
    }
  })

  it('四座湖泊與四個海域使用可互動的實際範圍輪廓', () => {
    expect(chinaLakeItems).toHaveLength(4)
    expect(chinaSeaItems).toHaveLength(4)
    ;[...chinaLakeItems, ...chinaSeaItems].forEach((item) => {
      expect(item.mapKind).toBe('area')
      expect(item.path.startsWith('M ')).toBe(true)
      expect(item.path).toContain(' Z')
      expect((item.path.match(/ L /g) || []).length).toBeGreaterThan(3)
    })
  })

  it('四座湖泊位於對應省區，不因底圖投影偏移到鄰省或海上', () => {
    const expectedCenters = {
      'lake-qinghai': [338, 299],
      'lake-poyang': [540, 418],
      'lake-dongting': [495, 417],
      'lake-tai': [590, 388],
    }

    for (const item of chinaLakeItems) {
      const points = [...item.path.matchAll(/(?:M|L) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)]
        .map((match) => [Number(match[1]), Number(match[2])])
      const xs = points.map((point) => point[0])
      const ys = points.map((point) => point[1])
      const center = [
        Number(((Math.min(...xs) + Math.max(...xs)) / 2).toFixed(1)),
        Number(((Math.min(...ys) + Math.max(...ys)) / 2).toFixed(1)),
      ]
      expect(center).toEqual(expectedCenters[item.id])
    }
  })

  it('四個海域與行政區使用相同座標系，向陸地延伸後由省區圖層裁出海岸線', () => {
    const expectedBounds = {
      'sea-bohai': [535, 630, 225, 303],
      'sea-yellow': [535, 705, 285, 383],
      'sea-east': [530, 710, 350, 525],
      'sea-south': [380, 690, 490, 569],
    }

    for (const item of chinaSeaItems) {
      expect(chinaSeaGeometry[item.id].alignedTo).toBe('@svg-maps/china coastline')
      const points = [...item.path.matchAll(/(?:M|L) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)]
        .map((match) => [Number(match[1]), Number(match[2])])
      const xs = points.map((point) => point[0])
      const ys = points.map((point) => point[1])
      expect([Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]).toEqual(expectedBounds[item.id])
    }

    expect(chinaSeaGeometry['sea-bohai'].path).toContain('L 620 225 L 630 245 L 625 270 L 610 294')
    expect(chinaSeaGeometry['sea-bohai'].path).not.toContain('L 610 329')
    ;[[615, 255], [620, 265]].forEach((point) => {
      expect(isPointInsideAreaPath(chinaSeaGeometry['sea-bohai'].path, point)).toBe(true)
      expect(isPointInsideAreaPath(chinaSeaGeometry['sea-yellow'].path, point)).toBe(false)
    })
    expect(chinaSeaGeometry['sea-yellow'].path).toMatch(/^M 610 294 .* L 590 300 Z$/)
    expect(chinaSeaGeometry['sea-yellow'].path).not.toContain('L 610 329')
    expect(chinaSeaGeometry['sea-yellow'].path).toContain('L 690 350 L 612 383 L 570 383 L 540 365')
    expect(chinaSeaGeometry['sea-yellow'].path).toContain('L 535 340 L 535 305 L 550 300 L 590 300')
    ;[[595, 315], [590, 325], [590, 340], [600, 350], [605, 365]].forEach((point) => {
      expect(isPointInsideAreaPath(chinaSeaGeometry['sea-bohai'].path, point)).toBe(false)
      expect(isPointInsideAreaPath(chinaSeaGeometry['sea-yellow'].path, point)).toBe(true)
    })
    expect(chinaSeaGeometry['sea-east'].path).toMatch(/^M 612 383 L 690 350 /)
    expect(chinaSeaGeometry['sea-east'].path).toContain('L 680 525 L 600 505 L 530 490')
    expect(chinaSeaGeometry['sea-south'].path).toMatch(/^M 530 490 L 600 505 L 680 525 /)
  })
})
