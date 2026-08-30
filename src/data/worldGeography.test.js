import { describe, expect, it } from 'vitest'
import {
  europeClimateItems,
  europeCountryItems,
  europeLandformItems,
  europeMap,
  europeMountainItems,
  europePhysicalMap,
  europeRegionalMap,
  europeRiverItems,
  europeWaterItems,
  filterWorldItemsByDifficulty,
  northEastEuropeItems,
  russiaLandformItems,
  russiaMountainWaterItems,
  russiaPhysicalMap,
  southWestEuropeItems,
  worldGeographyChapters,
  worldGeographyTopics,
} from './worldGeography.js'

describe('worldGeography', () => {
  it('以九上第 1、2 章開放歐洲與俄羅斯填圖', () => {
    expect(worldGeographyChapters).toEqual([
      expect.objectContaining({
        id: 'grade9-upper-l01',
        topicIds: [
          'world-europe-countries',
          'world-europe-landforms',
          'world-europe-mountains',
          'world-europe-rivers',
          'world-europe-waters',
          'world-europe-climate',
        ],
      }),
      expect.objectContaining({
        id: 'grade9-upper-l02',
        topicIds: [
          'world-north-east-europe-regions',
          'world-south-west-europe-regions',
          'world-russia-landforms',
          'world-russia-mountains-waters',
        ],
      }),
    ])
    expect(worldGeographyTopics[0]).toEqual(expect.objectContaining({
      id: 'world-europe-countries',
      map: europeMap,
    }))
  })

  it('依教師教材建立歐洲自然環境與主要氣候題庫', () => {
    expect(europeLandformItems).toHaveLength(6)
    expect(europeMountainItems).toHaveLength(5)
    expect(europeRiverItems).toHaveLength(2)
    expect(europeWaterItems).toHaveLength(9)
    expect(europeClimateItems).toHaveLength(4)

    expect(europeLandformItems.every((item) => item.path && item.areaType === 'landform')).toBe(true)
    expect(europeMountainItems.every((item) => item.path && item.lineType === 'mountain')).toBe(true)
    expect(europeRiverItems.every((item) => item.path?.startsWith('M'))).toBe(true)
    const waterAreas = europeWaterItems.filter((item) => item.mapKind === 'area')
    const waterPoints = europeWaterItems.filter((item) => item.mapKind === 'point')
    expect(waterAreas.map((item) => item.name)).toEqual(['黑海', '裏海'])
    expect(waterAreas.every((item) => item.path?.startsWith('M') && item.areaType === 'water')).toBe(true)
    expect(waterPoints).toHaveLength(7)
    expect(waterPoints.every((item) => Number.isFinite(item.x) && Number.isFinite(item.y))).toBe(true)
    expect(europeClimateItems.every((item) => item.path && item.areaType === 'climate')).toBe(true)
  })

  it('納入第一章教師教材列出的 20 個歐洲國家，且每個目標都有精確國界', () => {
    expect(europeCountryItems).toHaveLength(20)
    expect(europeCountryItems.map((item) => item.name)).toEqual(expect.arrayContaining([
      '冰島', '挪威', '瑞典', '芬蘭', '丹麥', '英國', '法國', '德國', '荷蘭', '比利時',
      '瑞士', '奧地利', '葡萄牙', '西班牙', '義大利', '希臘', '波蘭', '捷克', '匈牙利', '俄羅斯',
    ]))

    const mapIds = new Set(europeMap.locations.map((location) => location.id))
    expect(europeCountryItems.every((item) => mapIds.has(item.mapId))).toBe(true)
  })

  it('依難度由主要大國逐步加入北歐與中歐小國', () => {
    const introNames = filterWorldItemsByDifficulty(europeCountryItems, 'intro').map((item) => item.name)
    const basicNames = filterWorldItemsByDifficulty(europeCountryItems, 'basic').map((item) => item.name)
    const advancedNames = filterWorldItemsByDifficulty(europeCountryItems, 'advanced').map((item) => item.name)

    expect(introNames).toEqual(['英國', '法國', '德國', '西班牙', '義大利', '俄羅斯'])
    expect(basicNames).toHaveLength(16)
    expect(basicNames).toContain('冰島')
    expect(basicNames).not.toContain('瑞士')
    expect(advancedNames).toHaveLength(20)
    expect(advancedNames).toEqual(expect.arrayContaining(['瑞士', '奧地利', '捷克', '匈牙利']))
  })

  it('所有歐洲主題共用同一個裁切底圖', () => {
    expect(europeMap.viewBox).toBe('390 170 205 205')
    expect(europeMap.locations.length).toBeGreaterThan(europeCountryItems.length)
    expect(europePhysicalMap.viewBox).toBe('390 155 320 245')
    expect(europePhysicalMap.locations.map((location) => location.id)).toEqual(expect.arrayContaining(['am', 'az', 'cy', 'ge']))
  })

  it('海域題庫依難度加入裏海與兩個海峽', () => {
    expect(filterWorldItemsByDifficulty(europeWaterItems, 'intro')).toHaveLength(6)
    expect(filterWorldItemsByDifficulty(europeWaterItems, 'basic')).toHaveLength(9)
    expect(filterWorldItemsByDifficulty(europeWaterItems, 'advanced')).toHaveLength(9)
  })

  it('依九上第 2 章教師版建立歐洲分區與俄羅斯題庫', () => {
    expect(northEastEuropeItems).toHaveLength(12)
    expect(southWestEuropeItems).toHaveLength(25)
    expect(russiaLandformItems).toHaveLength(4)
    expect(russiaMountainWaterItems).toHaveLength(8)

    expect(northEastEuropeItems.filter((item) => item.mapKind === 'point').map((item) => item.name)).toEqual([
      '哥本哈根', '華沙', '基輔', '布拉格',
    ])
    expect(southWestEuropeItems.map((item) => item.name)).toEqual(expect.arrayContaining([
      '馬爾他', '倫敦', '巴黎', '柏林', '馬德里', '羅馬', '阿姆斯特丹', '布魯塞爾', '里斯本', '雅典', '伯恩', '維也納',
    ]))
    expect(russiaPhysicalMap).toEqual(expect.objectContaining({
      viewBox: '510 105 480 300',
      clipLocationId: 'ru',
    }))
    expect(russiaPhysicalMap.locations.map((location) => location.id)).toEqual(['ru'])
    expect(europeRegionalMap.viewBox).toBe('390 170 205 225')
    expect(russiaLandformItems.every((item) => item.path?.startsWith('M') && item.areaType === 'landform')).toBe(true)
    expect(russiaMountainWaterItems.filter((item) => item.mapKind === 'line')).toHaveLength(3)
    expect(russiaMountainWaterItems.filter((item) => item.mapKind === 'point')).toHaveLength(3)
    expect(russiaMountainWaterItems.filter((item) => item.mapKind === 'area')).toHaveLength(2)
  })
})
