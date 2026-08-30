import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import chinaMap from '@svg-maps/china'
import taiwanMap from '@svg-maps/taiwan'
import { chinaGeographyTopics } from '../src/data/chinaGeography.js'
import { taiwanGeographyTopics } from '../src/data/taiwanGeography.js'

const outputDir = resolve(process.argv[2] || 'tmp/geography-point-audit')

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function renderTopic(mapDefinition, topic, areaId) {
  const items = topic.items.filter((item) => item.mapKind !== 'diagram' && item.mapKind !== 'range')
  if (items.length === 0) return ''
  const [, , width, height] = mapDefinition.viewBox.split(' ').map(Number)
  const radius = areaId === 'taiwan' ? 10 : 6
  const palette = ['#e64f3d', '#5e5ac8', '#068f78', '#d88712', '#2785b3', '#b64391', '#5d812f', '#8b5b15']
  const mapPaths = mapDefinition.locations
    .map((location) => `<path d="${location.path}" fill="#f7f0d5" stroke="#527b82" stroke-width="${areaId === 'taiwan' ? 2 : 1}" />`)
    .join('')
  const overlays = items
    .map((item, index) => {
      const color = palette[index % palette.length]
      if (item.mapKind === 'point') {
        return `<g transform="translate(${item.x} ${item.y})"><circle r="${radius}" fill="${color}" stroke="#fff" stroke-width="3" /><text x="0" y="4" text-anchor="middle" font-size="${areaId === 'taiwan' ? 12 : 8}" font-weight="900" fill="#fff">${index + 1}</text></g>`
      }
      if (item.mapKind === 'line') {
        return `<path d="${item.path}" fill="none" stroke="${color}" stroke-width="${areaId === 'taiwan' ? 8 : 5}" stroke-linecap="round" stroke-linejoin="round" />`
      }
      if (item.mapKind === 'area') {
        return `<path d="${item.path}" fill="${color}" fill-opacity="0.58" stroke="${color}" stroke-width="${areaId === 'taiwan' ? 5 : 3}" fill-rule="evenodd" />`
      }
      if (item.mapKind === 'province') {
        const location = mapDefinition.locations.find((candidate) => candidate.id === item.mapId)
        return location ? `<path d="${location.path}" fill="${color}" fill-opacity="0.58" stroke="${color}" stroke-width="${areaId === 'taiwan' ? 5 : 3}" />` : ''
      }
      return ''
    })
    .join('')
  const legend = items
    .map((item, index) => {
      const color = palette[index % palette.length]
      return `<g transform="translate(${width + 18} ${28 + index * 24})"><circle cx="7" cy="-5" r="7" fill="${color}" /><text x="20" y="0" font-size="13" font-weight="800" fill="#243f49">${index + 1}. ${escapeXml(item.name)}</text></g>`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width + 330} ${height}" width="${width + 330}" height="${height}">
    <rect width="100%" height="100%" fill="#eaf6fa" />
    ${mapPaths}
    ${overlays}
    <rect x="${width}" width="330" height="${height}" fill="#fff" fill-opacity="0.92" />
    ${legend}
  </svg>`
}

await mkdir(outputDir, { recursive: true })

for (const [areaId, mapDefinition, topics] of [
  ['china', chinaMap, chinaGeographyTopics],
  ['taiwan', taiwanMap, taiwanGeographyTopics],
]) {
  for (const topic of topics) {
    const svg = renderTopic(mapDefinition, topic, areaId)
    if (!svg) continue
    await writeFile(resolve(outputDir, `${areaId}-${topic.id}.svg`), svg, 'utf8')
  }
}

console.log(outputDir)
