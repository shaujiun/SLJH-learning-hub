import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const cacheDirectory = join(tmpdir(), 'sljh-geography-water', 'nominatim')
const outputPath = new URL('../src/data/geographyHydrography.js', import.meta.url)

const taiwanProjection = ([longitude, latitude]) => [
  271.48152928771435 * longitude - 9.399192673299012 * latitude - 31872.5694815843,
  -17.78078453831405 * longitude - 248.5768221103906 * latitude + 8805.006160373687,
]

const chinaProjection = ([longitude, latitude]) => [
  12.639424978724161 * longitude - 2.277754207797333 * latitude - 821.4972374474961,
  1.5466989318008952 * longitude - 15.502364474332628 * latitude + 697.520642817183,
]

const taiwanRivers = [
  ['tw-river-tamsui', '淡水河'],
  ['tw-river-dajia', '大甲溪'],
  ['tw-river-zhuoshui', '濁水溪'],
  ['tw-river-zengwen', '曾文溪'],
  ['tw-river-gaoping', '高屏溪'],
  ['tw-river-lanyang', '蘭陽溪'],
  ['tw-river-xiuguluan', '秀姑巒溪'],
]

const taiwanRiverMouths = {
  'tw-river-tamsui': { endpoint: 'start', target: [824, 367] },
  'tw-river-dajia': { endpoint: 'end', target: [608, 606] },
  'tw-river-zhuoshui': { endpoint: 'end', target: [537, 737] },
  'tw-river-zengwen': { endpoint: 'end', target: [492, 951] },
  'tw-river-gaoping': { endpoint: 'end', target: [580, 1130] },
  'tw-river-lanyang': { endpoint: 'end', target: [950, 495] },
  'tw-river-xiuguluan': { endpoint: 'end', target: [870, 801] },
}

const taiwanWaters = [
  ['tw-water-shimen', '石門水庫'],
  ['tw-water-feitsui', '翡翠水庫'],
  ['tw-water-sun-moon-lake', '日月潭'],
  ['tw-water-zengwen', '曾文水庫'],
  ['tw-water-wushantou', '烏山頭水庫'],
  ['tw-water-nanhua', '南化水庫'],
]

const chinaRivers = [
  ['river-yellow', '黃河', ['china-river-yellow'], { stitchLongestChains: 2, boundaryTarget: [602, 290.7] }],
  ['river-yangtze', '長江', ['china-river-tongtian', 'china-river-jinsha', 'china-river-yangtze'], { joinTolerance: 0.01, boundaryTarget: [612, 383] }],
  ['river-pearl', '珠江', ['china-river-nanpan', 'china-river-hongshui', 'china-river-qianjiang', 'china-river-xunjiang', 'china-river-xijiang'], { joinTolerance: 0.01, boundaryTarget: [542.7, 504.7] }],
  ['river-amur', '黑龍江', ['china-river-amur'], { joinTolerance: 0.01, boundaryTarget: [755.4, 157.4] }],
  ['river-huai', '淮河', ['china-river-huai'], { joinTolerance: 0.01 }],
]

const chinaLakes = [
  ['lake-qinghai', '青海湖', 'china-lake-qinghai', [338, 299]],
  ['lake-poyang', '鄱陽湖', 'china-lake-poyang', [540, 418]],
  ['lake-dongting', '洞庭湖', 'china-lake-dongting', [495, 417]],
  ['lake-tai', '太湖', 'china-lake-tai', [590, 388]],
]

// These teaching regions intentionally extend beneath the province layer. The
// province polygons are painted above them, so the visible western edge is the
// exact coastline from @svg-maps/china instead of a second, mismatched map.
const chinaSeaCoastAlignedPaths = {
  'sea-bohai': 'M 545 238 L 620 225 L 630 245 L 625 270 L 610 294 L 603 303 L 590 298 L 575 294 L 560 286 L 548 287 L 535 290 Z',
  'sea-yellow': 'M 610 294 L 690 285 L 705 315 L 700 340 L 690 350 L 612 383 L 570 383 L 540 365 L 535 340 L 535 305 L 550 300 L 590 300 Z',
  'sea-east': 'M 612 383 L 690 350 L 710 390 L 710 470 L 680 525 L 600 505 L 530 490 L 570 430 Z',
  'sea-south': 'M 530 490 L 600 505 L 680 525 L 690 560 L 690 569 L 380 569 L 380 500 Z',
}

function squaredDistance(a, b) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return dx * dx + dy * dy
}

function pointSegmentDistanceSquared(point, start, end) {
  const lengthSquared = squaredDistance(start, end)
  if (!lengthSquared) return squaredDistance(point, start)
  let ratio = ((point[0] - start[0]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[1] - start[1])) / lengthSquared
  ratio = Math.max(0, Math.min(1, ratio))
  return squaredDistance(point, [start[0] + ratio * (end[0] - start[0]), start[1] + ratio * (end[1] - start[1])])
}

function simplify(points, tolerance) {
  if (points.length <= 2) return points
  const threshold = tolerance * tolerance
  let maximumDistance = 0
  let splitIndex = 0
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = pointSegmentDistanceSquared(points[index], points[0], points.at(-1))
    if (distance > maximumDistance) {
      maximumDistance = distance
      splitIndex = index
    }
  }
  if (maximumDistance <= threshold) return [points[0], points.at(-1)]
  return [...simplify(points.slice(0, splitIndex + 1), tolerance).slice(0, -1), ...simplify(points.slice(splitIndex), tolerance)]
}

function lineLength(points) {
  return points.slice(1).reduce((length, point, index) => length + Math.sqrt(squaredDistance(point, points[index])), 0)
}

function lineStrings(geometry) {
  if (!geometry) return []
  if (geometry.type === 'LineString') return [geometry.coordinates]
  if (geometry.type === 'MultiLineString') return geometry.coordinates
  return []
}

function polygonRings(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') return geometry.coordinates
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat()
  return []
}

function samePoint(a, b, tolerance = 0.000002) {
  return Math.abs(a[0] - b[0]) < tolerance && Math.abs(a[1] - b[1]) < tolerance
}

function joinLineStrings(inputLines, tolerance = 0.000002) {
  const remaining = inputLines.filter((line) => line.length > 1).map((line) => [...line])
  const chains = []
  while (remaining.length) {
    const chain = remaining.shift()
    let didMerge = true
    while (didMerge) {
      didMerge = false
      for (let index = 0; index < remaining.length; index += 1) {
        const candidate = remaining[index]
        if (samePoint(chain.at(-1), candidate[0], tolerance)) chain.push(...candidate.slice(1))
        else if (samePoint(chain.at(-1), candidate.at(-1), tolerance)) chain.push(...candidate.slice(0, -1).reverse())
        else if (samePoint(chain[0], candidate.at(-1), tolerance)) chain.unshift(...candidate.slice(0, -1))
        else if (samePoint(chain[0], candidate[0], tolerance)) chain.unshift(...candidate.slice(1).reverse())
        else continue
        remaining.splice(index, 1)
        didMerge = true
        break
      }
    }
    chains.push(chain)
  }
  return chains
}

function stitchLongestChains(inputLines, count) {
  const chains = joinLineStrings(inputLines)
    .sort((a, b) => lineLength(b) - lineLength(a))
    .slice(0, count)
  if (chains.length < 2) return chains

  let stitched = chains.shift()
  while (chains.length) {
    let best = null
    for (let index = 0; index < chains.length; index += 1) {
      for (const left of [stitched, [...stitched].reverse()]) {
        for (const right of [chains[index], [...chains[index]].reverse()]) {
          const distance = squaredDistance(left.at(-1), right[0])
          if (!best || distance < best.distance) best = { distance, index, line: [...left, ...right] }
        }
      }
    }
    stitched = best.line
    chains.splice(best.index, 1)
  }
  return [stitched]
}

function rounded(value) {
  return Number(value.toFixed(1))
}

function snapMouthToCoast(points, mouth) {
  if (!mouth || points.length < 2) return points
  const mouthIndex = mouth.endpoint === 'start' ? 0 : points.length - 1
  const mouthPoint = points[mouthIndex]
  const offset = [mouth.target[0] - mouthPoint[0], mouth.target[1] - mouthPoint[1]]
  const ordered = mouth.endpoint === 'start' ? points : [...points].reverse()
  const totalLength = lineLength(ordered)
  const taperDistance = Math.min(180, Math.max(80, totalLength * 0.42))
  let travelled = 0
  const adjusted = ordered.map((point, index) => {
    if (index) travelled += Math.sqrt(squaredDistance(point, ordered[index - 1]))
    const progress = Math.min(1, travelled / taperDistance)
    const weight = (1 - progress) ** 2
    return [point[0] + offset[0] * weight, point[1] + offset[1] * weight]
  })
  return mouth.endpoint === 'start' ? adjusted : adjusted.reverse()
}

function trimLineAtBoundary(points, target) {
  if (!target || points.length < 2) return points
  let closest = null
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]
    const end = points[index + 1]
    const lengthSquared = squaredDistance(start, end)
    const ratio = lengthSquared
      ? Math.max(0, Math.min(1, ((target[0] - start[0]) * (end[0] - start[0]) + (target[1] - start[1]) * (end[1] - start[1])) / lengthSquared))
      : 0
    const point = [start[0] + ratio * (end[0] - start[0]), start[1] + ratio * (end[1] - start[1])]
    const distance = squaredDistance(target, point)
    if (!closest || distance < closest.distance) closest = { distance, index, point }
  }

  const before = [...points.slice(0, closest.index + 1), closest.point]
  const after = [closest.point, ...points.slice(closest.index + 1)]
  const endpoint = lineLength(before) >= lineLength(after) ? 'end' : 'start'
  const selected = endpoint === 'end' ? before : after
  const ordered = endpoint === 'start' ? selected : [...selected].reverse()
  const offset = [target[0] - ordered[0][0], target[1] - ordered[0][1]]
  const taperDistance = Math.min(52, Math.max(24, lineLength(ordered) * 0.08))
  let travelled = 0
  const adjusted = ordered.map((point, index) => {
    if (index) travelled += Math.sqrt(squaredDistance(point, ordered[index - 1]))
    const weight = Math.max(0, 1 - travelled / taperDistance) ** 2
    return [point[0] + offset[0] * weight, point[1] + offset[1] * weight]
  })
  return endpoint === 'start' ? adjusted : adjusted.reverse()
}

function toLinePath(lines, projection, tolerance = 1.2, keepLongestOnly = true, mouth = null, joinTolerance = 0.000002, boundaryTarget = null) {
  const projected = joinLineStrings(lines, joinTolerance)
    .map((line) => simplify(line.map(projection), tolerance))
    .filter((line) => line.length > 1 && lineLength(line) > 8)
    .sort((a, b) => lineLength(b) - lineLength(a))
  const selected = (keepLongestOnly ? projected.slice(0, 1) : projected.slice(0, 5))
    .map((line) => boundaryTarget ? trimLineAtBoundary(line, boundaryTarget) : snapMouthToCoast(line, mouth))
  return selected.map((line) => `M ${line.map(([x, y]) => `${rounded(x)} ${rounded(y)}`).join(' L ')}`).join(' ')
}

function toAreaPath(rings, projection, tolerance = 0.45, targetCenter = null, translation = [0, 0]) {
  const projectedRings = rings.map((ring) => simplify(ring.map(projection), tolerance))
  let offset = [...translation]
  if (targetCenter) {
    const points = projectedRings.flat()
    const xs = points.map((point) => point[0])
    const ys = points.map((point) => point[1])
    const center = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
    offset = [offset[0] + targetCenter[0] - center[0], offset[1] + targetCenter[1] - center[1]]
  }

  return projectedRings
    .map((ring) => {
      const projected = ring.map(([x, y]) => [x + offset[0], y + offset[1]])
      if (projected.length < 3) return ''
      return `M ${projected.map(([x, y]) => `${rounded(x)} ${rounded(y)}`).join(' L ')} Z`
    })
    .filter(Boolean)
    .join(' ')
}

async function nominatimResult(id) {
  const results = JSON.parse(await readFile(join(cacheDirectory, `${id}.json`), 'utf8'))
  const result = results.find((item) => item.geojson && !['administrative', 'town', 'station'].includes(item.type))
  if (!result) throw new Error(`No usable Nominatim geometry for ${id}`)
  return result
}

async function buildData() {
  const taiwanRiverGeometry = {}
  for (const [id] of taiwanRivers) {
    const result = await nominatimResult(id)
    taiwanRiverGeometry[id] = {
      path: toLinePath(lineStrings(result.geojson), taiwanProjection, 1.15, true, taiwanRiverMouths[id]),
      mouth: taiwanRiverMouths[id].target,
      osmId: `${result.osm_type}/${result.osm_id}`,
    }
  }

  const taiwanWaterGeometry = {}
  for (const [id] of taiwanWaters) {
    const result = await nominatimResult(id)
    taiwanWaterGeometry[id] = {
      path: toAreaPath(polygonRings(result.geojson), taiwanProjection, 0.28),
      osmId: `${result.osm_type}/${result.osm_id}`,
    }
  }

  const chinaRiverGeometry = {}
  for (const [id, , sourceIds, options = {}] of chinaRivers) {
    const results = await Promise.all(sourceIds.map(nominatimResult))
    const sourceLines = results.flatMap((result) => lineStrings(result.geojson))
    const riverLines = options.stitchLongestChains
      ? stitchLongestChains(sourceLines, options.stitchLongestChains)
      : sourceLines
    chinaRiverGeometry[id] = {
      path: toLinePath(riverLines, chinaProjection, 1.05, true, null, options.joinTolerance, options.boundaryTarget),
      osmIds: results.map((result) => `${result.osm_type}/${result.osm_id}`),
    }
  }

  const chinaLakeGeometry = {}
  for (const [id, , sourceId, targetCenter] of chinaLakes) {
    const result = await nominatimResult(sourceId)
    chinaLakeGeometry[id] = {
      path: toAreaPath(polygonRings(result.geojson), chinaProjection, 0.35, targetCenter),
      osmId: `${result.osm_type}/${result.osm_id}`,
    }
  }

  const chinaSeaGeometry = Object.fromEntries(
    Object.entries(chinaSeaCoastAlignedPaths).map(([id, path]) => [id, {
      path,
      alignedTo: '@svg-maps/china coastline',
    }]),
  )

  return { taiwanRiverGeometry, taiwanWaterGeometry, chinaRiverGeometry, chinaLakeGeometry, chinaSeaGeometry }
}

const data = await buildData()
const source = `// Generated by scripts/generate-geography-hydrography.mjs.\n// River, reservoir, and lake geometry: OpenStreetMap contributors (ODbL 1.0).\n// China sea teaching regions are aligned beneath the @svg-maps/china province coastline.\n\n${Object.entries(data).map(([name, value]) => `export const ${name} = ${JSON.stringify(value, null, 2)}`).join('\n\n')}\n`
await writeFile(outputPath, source, 'utf8')
console.log(`Generated ${outputPath.pathname}`)
