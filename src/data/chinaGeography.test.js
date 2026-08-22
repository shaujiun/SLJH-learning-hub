import { describe, expect, it } from 'vitest'
import chinaMap from '@svg-maps/china'
import {
  chinaGeographyChapters,
  chinaGeographyTopics,
  chinaProvinceItems,
} from './chinaGeography.js'

describe('中國地理填圖資料', () => {
  it('每個行政區題目都能對應到向量地圖區塊', () => {
    const mapIds = new Set(chinaMap.locations.map((location) => location.id))
    expect(chinaProvinceItems).toHaveLength(chinaMap.locations.length)
    expect(chinaProvinceItems.every((item) => mapIds.has(item.mapId))).toBe(true)
  })

  it('八上前三課的六個主題都有提示與判斷依據', () => {
    expect(chinaGeographyTopics.map((topic) => topic.id)).toEqual([
      'relief-steps',
      'administrative',
      'terrain',
      'rivers',
      'climate',
      'agriculture',
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

  it('兩個正式課本章節涵蓋且只涵蓋目前六個主題', () => {
    const chapterTopicIds = chinaGeographyChapters.flatMap((chapter) => chapter.topicIds)
    expect(chinaGeographyChapters).toHaveLength(2)
    expect(chapterTopicIds).toEqual(['relief-steps', 'terrain', 'administrative', 'rivers', 'climate', 'agriculture'])
    expect(new Set(chapterTopicIds)).toEqual(new Set(chinaGeographyTopics.map((topic) => topic.id)))
  })
})
