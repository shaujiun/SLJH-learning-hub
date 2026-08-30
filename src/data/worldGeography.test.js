import { describe, expect, it } from 'vitest'
import {
  europeClimateItems,
  europeCountryItems,
  europeLandformItems,
  europeMap,
  europeMountainItems,
  europePhysicalMap,
  europeRiverItems,
  europeWaterItems,
  filterWorldItemsByDifficulty,
  worldGeographyChapters,
  worldGeographyTopics,
} from './worldGeography.js'

describe('worldGeography', () => {
  it('以九上第 1 章開放歐洲國家與自然環境填圖', () => {
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
    expect(europeWaterItems.every((item) => Number.isFinite(item.x) && Number.isFinite(item.y))).toBe(true)
    expect(europeClimateItems.every((item) => item.path && item.areaType === 'climate')).toBe(true)
  })

  it('納入教師教材列出的 20 個歐洲國家，且每個目標都有精確國界', () => {
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
})
