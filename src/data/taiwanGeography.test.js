import taiwanMap from '@svg-maps/taiwan'
import { describe, expect, it } from 'vitest'
import {
  filterTaiwanItemsByDifficulty,
  taiwanCoastItems,
  taiwanCountyItems,
  taiwanGeographyChapters,
  taiwanGeographyTopics,
  taiwanIslandPortItems,
  taiwanLandformItems,
  taiwanLocationItems,
  taiwanMountainItems,
  taiwanRiverItems,
  taiwanWaterItems,
} from './taiwanGeography.js'
import {
  taiwanCoastlineGeometry,
  taiwanLocationPointGeometry,
  taiwanPortPointGeometry,
  taiwanTropicGeometry,
} from './taiwanMapOverlays.js'

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
      'tw-mountain-xueshan': { minX: 720, maxX: 965, minY: 435, maxY: 755 },
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

  it('平原、盆地與臺地依教材圖分布，桃園臺地不落入新竹且花東縱谷位於兩山脈之間', () => {
    expect(taiwanLandformItems).toHaveLength(13)

    const taoyuanPlateau = taiwanLandformItems.find((item) => item.id === 'tw-landform-taoyuan-plateau')
    expect(taoyuanPlateau).toMatchObject({ mapKind: 'point', x: 800, y: 465 })

    const riftValley = taiwanLandformItems.find((item) => item.id === 'tw-landform-east-rift-valley')
    expect(riftValley.mapKind).toBe('line')
    expect(riftValley.path).toBe('M 818 720 C 808 795 797 865 785 930 C 776 980 765 1025 754 1060')

    expect(taiwanLandformItems.map((item) => item.name)).toEqual(expect.arrayContaining([
      '林口臺地', '桃園臺地', '大肚臺地', '八卦臺地',
      '臺北盆地', '臺中盆地', '埔里盆地', '泰源盆地',
      '蘭陽平原', '彰化平原', '嘉南平原', '屏東平原', '花東縱谷',
    ]))
  })

  it('四種海岸沿用臺灣縣市底圖萃取的共用海岸輪廓', () => {
    expect(taiwanCoastItems).toHaveLength(4)
    taiwanCoastItems.forEach((item) => {
      expect(item.mapKind).toBe('line')
      expect(item.path).toBe(taiwanCoastlineGeometry[item.id])
      expect(item.path).not.toContain(' C ')
      expect((item.path.match(/ L /g) || []).length).toBeGreaterThanOrEqual(7)
    })
    expect(taiwanCoastItems[0].path).toMatch(/^M 824 367 .* L 982 400$/)
    expect(taiwanCoastItems[3].path).toMatch(/^M 559 1120 .* L 706 1160$/)
  })

  it('港口吸附共用海岸輪廓，恆春半島留在屏東南端', () => {
    taiwanIslandPortItems.forEach((item) => {
      expect(item).toMatchObject(taiwanPortPointGeometry[item.id])
    })
    expect(taiwanPortPointGeometry['tw-coast-hengchun']).toEqual({ x: 675, y: 1185 })
  })

  it('綠島、蘭嶼與北回歸線沿用世界中的臺灣共用疊圖', () => {
    const locationById = Object.fromEntries(taiwanLocationItems.map((item) => [item.id, item]))
    expect(locationById['tw-location-green-island']).toMatchObject(taiwanLocationPointGeometry['tw-location-green-island'])
    expect(locationById['tw-location-orchid-island']).toMatchObject(taiwanLocationPointGeometry['tw-location-orchid-island'])
    expect(locationById['tw-location-tropic'].path).toBe(taiwanTropicGeometry)
  })

  it('雪山山脈北起三貂角附近，轉向西南並延伸至濁水溪北岸', () => {
    const xueshan = taiwanMountainItems.find((item) => item.id === 'tw-mountain-xueshan')
    const values = xueshan.path.match(/\d+(?:\.\d+)?/g).map(Number)
    const points = Array.from({ length: values.length / 2 }, (_, index) => ({
      x: values[index * 2],
      y: values[index * 2 + 1],
    }))

    expect(points[0]).toEqual({ x: 965, y: 435 })
    expect(points.at(-1)).toEqual({ x: 720, y: 755 })
    expect(points.every((point, index) => index === 0 || point.x <= points[index - 1].x)).toBe(true)
    expect(points.every((point, index) => index === 0 || point.y >= points[index - 1].y)).toBe(true)
  })

  it('七條主要河川使用實際河道折線，不再使用人工概略線', () => {
    expect(taiwanRiverItems).toHaveLength(7)
    taiwanRiverItems.forEach((item) => {
      expect(item.mapKind).toBe('line')
      expect(item.path).not.toContain(' C ')
      expect((item.path.match(/ L /g) || []).length).toBeGreaterThan(4)
    })
  })

  it('主要河川的出海端皆貼齊臺灣本島海岸線', () => {
    const expectedMouths = {
      'tw-river-tamsui': { endpoint: 'start', point: [824, 367] },
      'tw-river-dajia': { endpoint: 'end', point: [608, 606] },
      'tw-river-zhuoshui': { endpoint: 'end', point: [537, 737] },
      'tw-river-zengwen': { endpoint: 'end', point: [492, 951] },
      'tw-river-gaoping': { endpoint: 'end', point: [580, 1130] },
      'tw-river-lanyang': { endpoint: 'end', point: [950, 495] },
      'tw-river-xiuguluan': { endpoint: 'end', point: [870, 801] },
    }

    taiwanRiverItems.forEach((item) => {
      const points = [...item.path.matchAll(/(?:M|L) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)]
        .map((match) => [Number(match[1]), Number(match[2])])
      const expected = expectedMouths[item.id]
      expect(expected).toBeTruthy()
      expect(expected.endpoint === 'start' ? points[0] : points.at(-1)).toEqual(expected.point)
    })
  })

  it('六個湖庫使用實際水域輪廓，不再以單點表示', () => {
    expect(taiwanWaterItems).toHaveLength(6)
    taiwanWaterItems.forEach((item) => {
      expect(item.mapKind).toBe('area')
      expect(item.areaType).toBe('water')
      expect(item.path.startsWith('M ')).toBe(true)
      expect(item.path).toContain(' Z')
    })
  })
})
