import { europeMap } from './europeMap.js'

const russiaLocation = europeMap.locations.find((location) => location.id === 'ru')

// 與既有世界地圖共用座標系統：x = 476 + 2.8 × 經度，y = 600 - 6 × 緯度。
// 俄羅斯地形區會再由 GeographyMap 以俄羅斯國界裁切，避免示意色塊越出國界。
function projectedPath(points, close = false) {
  const commands = points.map(([lon, lat], index) => {
    const x = 476 + (2.8 * lon)
    const y = 600 - (6 * lat)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  })
  if (close) commands.push('Z')
  return commands.join(' ')
}

export const russiaPhysicalMap = {
  name: 'RussiaPhysical',
  viewBox: '510 105 480 300',
  locations: russiaLocation ? [russiaLocation] : [],
  clipLocationId: 'ru',
}

export const europeRegionalMap = {
  ...europeMap,
  name: 'EuropeRegional',
  viewBox: '390 170 205 225',
}

// europeMap 取自 MapSVG 的地理校準世界底圖；原始座標範圍與 SVG 尺寸如下。
// 經度採線性換算，緯度則必須使用 Mercator 投影，不能用固定倍數近似，
// 否則里斯本、雅典、馬爾他等較低緯度位置會明顯向南偏移。
const worldGeoBounds = {
  west: -169.110266,
  north: 83.600842,
  east: 190.486279,
  south: -58.508473,
}

const worldSvgSize = {
  width: 1009.6727,
  height: 665.96301,
}

function mercatorLatitude(latitude) {
  return Math.log(Math.tan((Math.PI / 4) + ((latitude * Math.PI) / 360)))
}

export const russiaLandformGeometry = {
  'world-russia-landform-east-european-plain': projectedPath([
    [15, 42], [15, 78], [58, 78], [58, 70], [59, 65], [59, 60], [58.5, 55], [60, 42],
  ], true),
  'world-russia-landform-west-siberian-plain': projectedPath([
    [60, 42], [58.5, 55], [59, 60], [59, 65], [58, 70], [58, 78],
    [91, 78], [91, 70], [90, 60], [92, 50], [92, 42],
  ], true),
  'world-russia-landform-central-siberian-plateau': projectedPath([
    [92, 42], [92, 50], [90, 60], [91, 70], [91, 78],
    [127, 78], [127, 68], [129, 60], [128, 52], [127, 42],
  ], true),
  'world-russia-landform-east-siberian-mountains': projectedPath([
    [127, 42], [128, 52], [129, 60], [127, 68], [127, 78], [180, 78], [180, 42],
  ], true),
}

export const russiaMountainGeometry = {
  'world-russia-mountain-urals': projectedPath([
    [58, 68], [59, 65], [59, 61], [58.5, 56], [60, 51],
  ]),
  'world-russia-mountain-caucasus': projectedPath([
    [39.5, 43.5], [43, 43.3], [46.5, 42.7],
  ]),
  'world-russia-mountain-tannu-ola': projectedPath([
    [88, 51.3], [91, 51], [94, 50.8], [97, 50.6],
  ]),
}

export const russiaWaterPointGeometry = {
  'world-russia-water-arctic': { x: 760, y: 145, hitRadius: 18, markerRadius: 12 },
  'world-russia-water-baltic': { x: 534, y: 278, hitRadius: 14, markerRadius: 9 },
  'world-russia-water-bering-strait': { x: 972, y: 220, hitRadius: 15, markerRadius: 10 },
}

export function projectWorldPoint(lon, lat, markerRadius = 5, hitRadius = 10) {
  const top = mercatorLatitude(worldGeoBounds.north)
  const bottom = mercatorLatitude(worldGeoBounds.south)
  const projectedLatitude = mercatorLatitude(lat)

  return {
    x: Number((
      ((lon - worldGeoBounds.west) / (worldGeoBounds.east - worldGeoBounds.west))
      * worldSvgSize.width
    ).toFixed(1)),
    y: Number((
      ((top - projectedLatitude) / (top - bottom))
      * worldSvgSize.height
    ).toFixed(1)),
    markerRadius,
    hitRadius,
  }
}
