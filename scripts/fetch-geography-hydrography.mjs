import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const outputDirectory = join(tmpdir(), 'sljh-geography-water', 'nominatim')
const endpoint = 'https://nominatim.openstreetmap.org/search'
const lookupEndpoint = 'https://nominatim.openstreetmap.org/lookup'
const userAgent = 'SLJH-learning-hub/1.0 (educational geography map; local data preparation)'

const requests = [
  ['tw-river-tamsui', '淡水河 臺灣', 'tw'],
  ['tw-river-dajia', '大甲溪 臺灣', 'tw'],
  ['tw-river-zhuoshui', '濁水溪 臺灣', 'tw'],
  ['tw-river-zengwen', '曾文溪 臺灣', 'tw'],
  ['tw-river-gaoping', '高屏溪 臺灣', 'tw'],
  ['tw-river-lanyang', '蘭陽溪 臺灣', 'tw'],
  ['tw-river-xiuguluan', '秀姑巒溪 臺灣', 'tw'],
  ['tw-water-shimen', '石門水庫 臺灣', 'tw'],
  ['tw-water-feitsui', '翡翠水庫 臺灣', 'tw'],
  ['tw-water-sun-moon-lake', '日月潭 臺灣', 'tw'],
  ['tw-water-zengwen', '曾文水庫 臺灣', 'tw'],
  ['tw-water-wushantou', '烏山頭水庫 臺灣', 'tw'],
  ['tw-water-nanhua', '南化水庫 臺灣', 'tw'],
  ['china-river-yellow', '黃河 中國', 'cn'],
  ['china-river-yangtze', '長江 中國', 'cn'],
  ['china-river-tongtian', '通天河 中國', 'cn'],
  ['china-river-jinsha', '金沙江 中國', 'cn'],
  ['china-river-pearl', '珠江 中國', 'cn'],
  ['china-river-xijiang', '西江 中國', 'cn'],
  ['china-river-hongshui', '紅水河 中國', 'cn'],
  ['china-river-nanpan', '南盤江 中國', 'cn'],
  ['china-river-qianjiang', '黔江 廣西 河流', 'cn', 'R19292586'],
  ['china-river-xunjiang', '潯江 廣西 河流', 'cn', 'R19292605'],
  ['china-river-amur', '黑龍江 河流', '', 'R197653'],
  ['china-river-huai', '淮河 中國', 'cn', 'R407487'],
  ['china-lake-qinghai', '青海湖 中國', 'cn'],
  ['china-lake-poyang', '鄱陽湖 中國', 'cn'],
  ['china-lake-dongting', '洞庭湖 中國', 'cn'],
  ['china-lake-tai', '太湖 中國', 'cn'],
  ['china-sea-bohai', '渤海', ''],
  ['china-sea-yellow', '黃海', ''],
  ['china-sea-east', '東海', ''],
  ['china-sea-south', '南海', ''],
]

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function loadOrFetch(id, query, countryCode, osmId) {
  const cachePath = join(outputDirectory, `${id}.json`)
  try {
    const cached = JSON.parse(await readFile(cachePath, 'utf8'))
    if (!osmId || cached.some((item) => `${item.osm_type === 'relation' ? 'R' : ''}${item.osm_id}` === osmId)) return cached
  } catch {
  }

  const url = new URL(osmId ? lookupEndpoint : endpoint)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('polygon_geojson', '1')
  url.searchParams.set('accept-language', 'zh-TW,zh,en')
  if (osmId) url.searchParams.set('osm_ids', osmId)
  else {
    url.searchParams.set('limit', '5')
    url.searchParams.set('q', query)
    if (countryCode) url.searchParams.set('countrycodes', countryCode)
  }

  const response = await fetch(url, { headers: { 'User-Agent': userAgent } })
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`)
  const results = await response.json()
  await writeFile(cachePath, `${JSON.stringify(results)}\n`, 'utf8')
  await sleep(1150)
  return results
}

await mkdir(outputDirectory, { recursive: true })

for (const [id, query, countryCode, osmId] of requests) {
  const results = await loadOrFetch(id, query, countryCode, osmId)
  const summary = results.slice(0, 3).map((item) => ({
    name: item.name,
    type: item.type,
    category: item.category,
    osmType: item.osm_type,
    osmId: item.osm_id,
    bounds: item.boundingbox,
    geometry: item.geojson?.type,
    displayName: item.display_name,
  }))
  console.log(`\n${id}  ${query}`)
  console.table(summary)
}

console.log(`\nCached Nominatim responses: ${outputDirectory}`)
