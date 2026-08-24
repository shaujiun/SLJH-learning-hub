import taiwanMap from '@svg-maps/taiwan'
import { describe, expect, it } from 'vitest'
import {
  filterTaiwanItemsByDifficulty,
  taiwanCountyItems,
  taiwanGeographyChapters,
  taiwanGeographyTopics,
  taiwanMountainItems,
} from './taiwanGeography.js'

describe('taiwanGeography', () => {
  it('依翰林七上正式順序提供六章', () => {
    expect(taiwanGeographyChapters).toHaveLength(6)
    expect(taiwanGeographyChapters.map((chapter) => chapter.name)).toEqual([
      '七上第 1 章　認識位置與地圖',
      '七上第 2 章　世界中的臺灣',
      '七上第 3 章　地形',
      '七上第 4 章　海岸與島嶼',
      '七上第 5 章　天氣與氣候',
      '七上第 6 章　水文',
    ])
  })

  it('每個章節引用的主題都存在且每個主題都有題目', () => {
    const topicIds = new Set(taiwanGeographyTopics.map((topic) => topic.id))
    taiwanGeographyChapters.forEach((chapter) => {
      chapter.topicIds.forEach((topicId) => expect(topicIds.has(topicId)).toBe(true))
    })
    taiwanGeographyTopics.forEach((topic) => expect(topic.items.length).toBeGreaterThanOrEqual(4))
  })

  it('完整對應臺灣向量圖的 22 縣市', () => {
    expect(taiwanCountyItems).toHaveLength(22)
    expect(new Set(taiwanCountyItems.map((item) => item.mapId))).toEqual(
      new Set(taiwanMap.locations.map((location) => location.id)),
    )
  })

  it('入門縣市只有六都，基礎與進階包含全部 22 縣市', () => {
    expect(filterTaiwanItemsByDifficulty(taiwanCountyItems, 'intro').map((item) => item.name)).toEqual([
      '臺北市', '新北市', '桃園市', '臺中市', '臺南市', '高雄市',
    ])
    expect(filterTaiwanItemsByDifficulty(taiwanCountyItems, 'basic')).toHaveLength(22)
    expect(filterTaiwanItemsByDifficulty(taiwanCountyItems, 'advanced')).toHaveLength(22)
  })

  it('所有點位都在臺灣地圖 viewBox 內，且題目具備提示與判斷依據', () => {
    const [, , width, height] = taiwanMap.viewBox.split(' ').map(Number)
    taiwanGeographyTopics.flatMap((topic) => topic.items).forEach((item) => {
      expect(item.hint).toBeTruthy()
      expect(item.reason).toBeTruthy()
      if (item.mapKind === 'point') {
        expect(item.x).toBeGreaterThanOrEqual(0)
        expect(item.x).toBeLessThanOrEqual(width)
        expect(item.y).toBeGreaterThanOrEqual(0)
        expect(item.y).toBeLessThanOrEqual(height)
      }
    })
  })

  it('所有題目 ID 在臺灣地理中不重複', () => {
    const ids = taiwanGeographyTopics.flatMap((topic) => topic.items.map((item) => item.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('五大山脈線位維持在教材對應的山地走廊，海岸山脈不得落到東部海面', () => {
    const corridors = {
      'tw-mountain-central': { minX: 700, maxX: 845, minY: 565, maxY: 1100 },
      'tw-mountain-xueshan': { minX: 720, maxX: 830, minY: 455, maxY: 730 },
      'tw-mountain-yushan': { minX: 675, maxX: 735, minY: 735, maxY: 910 },
      'tw-mountain-alishan': { minX: 635, maxX: 690, minY: 755, maxY: 920 },
      'tw-mountain-coastal': { minX: 742, maxX: 842, minY: 730, maxY: 1092 },
    }
    taiwanMountainItems.forEach((item) => {
      const values = item.path.match(/\d+(?:\.\d+)?/g).map(Number)
      const xs = values.filter((_, index) => index % 2 === 0)
      const ys = values.filter((_, index) => index % 2 === 1)
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(corridors[item.id].minX)
      expect(Math.max(...xs)).toBeLessThanOrEqual(corridors[item.id].maxX)
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(corridors[item.id].minY)
      expect(Math.max(...ys)).toBeLessThanOrEqual(corridors[item.id].maxY)
    })
  })
})
