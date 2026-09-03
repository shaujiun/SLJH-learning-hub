import { describe, expect, it } from 'vitest'
import {
  filterSoutheastAsiaItemsByDifficulty,
  southeastAsiaCapitalItems,
  southeastAsiaChapters,
  southeastAsiaCountryItems,
  southeastAsiaMap,
  southeastAsiaRiverItems,
  southeastAsiaTopics,
} from './southeastAsiaGeography.js'

describe('八下東南亞地理資料', () => {
  it('使用同一套世界精確國界，且只載入東南亞十一國避免拖慢手機', () => {
    const mapIds = new Set(southeastAsiaMap.locations.map((location) => location.id))
    expect(southeastAsiaMap.viewBox).toBe('720 365 175 145')
    expect(southeastAsiaMap.locations).toHaveLength(11)
    ;['mm', 'th', 'la', 'kh', 'vn', 'my', 'sg', 'id', 'bn', 'ph', 'tl'].forEach((id) => {
      expect(mapIds.has(id)).toBe(true)
    })
  })

  it('國家題包含東南亞十一國，小國改用可點選定位點', () => {
    expect(southeastAsiaCountryItems).toHaveLength(11)
    expect(southeastAsiaCountryItems.filter((item) => item.mapKind === 'province')).toHaveLength(8)
    expect(southeastAsiaCountryItems.filter((item) => item.pointType === 'country-location').map((item) => item.name)).toEqual([
      '新加坡', '汶萊', '東帝汶',
    ])
    expect(filterSoutheastAsiaItemsByDifficulty(southeastAsiaCountryItems, 'intro')).toHaveLength(8)
    expect(filterSoutheastAsiaItemsByDifficulty(southeastAsiaCountryItems, 'basic')).toHaveLength(11)
  })

  it('首都以精確點位呈現，且明確說明圓點不是國家範圍', () => {
    expect(southeastAsiaCapitalItems).toHaveLength(11)
    expect(southeastAsiaCapitalItems.every((item) => item.mapKind === 'point' && item.pointType === 'capital')).toBe(true)
    expect(southeastAsiaCapitalItems.every((item) => item.reason.includes('圓點只表示都市位置'))).toBe(true)
  })

  it('四條主要河川使用多節點向量河道並連到正確國家與出海方向', () => {
    expect(southeastAsiaRiverItems.map((item) => item.name)).toEqual(['伊洛瓦底江', '紅河', '湄公河', '昭披耶河'])
    southeastAsiaRiverItems.forEach((item) => {
      expect(item.mapKind).toBe('line')
      expect(item.path).toMatch(/^M /)
      expect((item.path.match(/ L /g) || []).length).toBeGreaterThan(8)
      expect(item.hint).toBeTruthy()
      expect(item.reason).toBeTruthy()
    })
  })

  it('八下第一章先依章節提供國家、首都與河川三個主題', () => {
    expect(southeastAsiaChapters).toEqual([
      expect.objectContaining({
        id: 'grade8-lower-l01',
        name: '八下第 1 章　東南亞',
        topicIds: ['southeast-asia-countries', 'southeast-asia-capitals', 'southeast-asia-rivers'],
      }),
    ])
    expect(southeastAsiaTopics.map((topic) => topic.id)).toEqual(southeastAsiaChapters[0].topicIds)
    expect(southeastAsiaTopics.every((topic) => topic.map === southeastAsiaMap)).toBe(true)
  })
})
