import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import chinaMap from '@svg-maps/china'
import taiwanMap from '@svg-maps/taiwan'
import { chinaLakeGeometry, chinaRiverGeometry, chinaSeaGeometry, taiwanRiverGeometry, taiwanWaterGeometry } from '../src/data/geographyHydrography.js'

const colors = ['#d62828', '#f77f00', '#936f00', '#2a9d8f', '#6a4c93', '#0077b6', '#e6398f']
const endpointPattern = /(?:M|L) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g

const provinceLayer = taiwanMap.locations
  .map((location) => `<path d="${location.path}" />`)
  .join('')

const riverLayer = Object.entries(taiwanRiverGeometry)
  .map(([id, item], index) => {
    const points = [...item.path.matchAll(endpointPattern)].map((match) => [Number(match[1]), Number(match[2])])
    const start = points[0]
    const end = points.at(-1)
    return `<path d="${item.path}" fill="none" stroke="${colors[index]}" stroke-width="7" />
      <circle cx="${start[0]}" cy="${start[1]}" r="9" fill="${colors[index]}" />
      <circle cx="${end[0]}" cy="${end[1]}" r="9" fill="${colors[index]}" />
      <text x="${end[0] + 12}" y="${end[1]}" font-size="16">${id}</text>`
  })
  .join('')

const waterLayer = Object.values(taiwanWaterGeometry)
  .map((item) => `<path d="${item.path}" fill="#4db5e6" stroke="#045f8c" stroke-width="3" fill-rule="evenodd" />`)
  .join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${taiwanMap.viewBox}" width="1000" height="1295">
  <rect width="100%" height="100%" fill="#dff3fb" />
  <g fill="#f8f2d8" stroke="#333" stroke-width="2">${provinceLayer}</g>
  <g>${waterLayer}</g>
  <g>${riverLayer}</g>
</svg>`

const output = join(tmpdir(), 'tw-hydro-overlay.svg')
await writeFile(output, svg, 'utf8')
console.log(output)

const chinaProvinceLayer = chinaMap.locations
  .map((location) => `<path d="${location.path}" />`)
  .join('')

const chinaRiverLayer = Object.entries(chinaRiverGeometry)
  .map(([id, item], index) => {
    const points = [...item.path.matchAll(endpointPattern)].map((match) => [Number(match[1]), Number(match[2])])
    const start = points[0]
    const end = points.at(-1)
    return `<path d="${item.path}" fill="none" stroke="${colors[index]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${start[0]}" cy="${start[1]}" r="6" fill="${colors[index]}" />
      <circle cx="${end[0]}" cy="${end[1]}" r="6" fill="${colors[index]}" />
      <text x="${end[0] + 8}" y="${end[1] - 6}" font-size="13">${id}</text>`
  })
  .join('')

const chinaLakeLayer = Object.entries(chinaLakeGeometry)
  .map(([id, item]) => `<path d="${item.path}" fill="#3b82f6" stroke="#173f7a" stroke-width="2" fill-rule="evenodd" />
    <text x="0" y="0" font-size="13">${id}</text>`)
  .join('')

const seaColors = ['#a7d8f0', '#7fc4e5', '#58acd7', '#318fc5']
const selectedSeaId = process.env.GEOGRAPHY_SEA_ID || ''
const showGrid = process.env.GEOGRAPHY_GRID === '1'
const seaEntries = Object.entries(chinaSeaGeometry)
  .sort(([leftId], [rightId]) => Number(leftId === selectedSeaId) - Number(rightId === selectedSeaId))
const chinaSeaLayer = seaEntries
  .map(([id, item], index) => `<path d="${item.path}" fill="${selectedSeaId === id ? '#ffca46' : seaColors[index]}" stroke="${selectedSeaId === id ? '#d97706' : '#176f9d'}" stroke-width="2" fill-rule="evenodd" />`)
  .join('')

const chinaGridLayer = showGrid
  ? `${Array.from({ length: 33 }, (_, index) => index * 25).map((value) => `<path d="M ${value} 0 V 570" stroke="#dc2626" stroke-width="0.5" opacity="0.35" /><text x="${value + 2}" y="14" font-size="9" fill="#991b1b">${value}</text>`).join('')}
    ${Array.from({ length: 24 }, (_, index) => index * 25).map((value) => `<path d="M 0 ${value} H 810" stroke="#dc2626" stroke-width="0.5" opacity="0.35" /><text x="2" y="${value - 2}" font-size="9" fill="#991b1b">${value}</text>`).join('')}`
  : ''

const chinaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${chinaMap.viewBox}" width="1000" height="750">
  <rect width="100%" height="100%" fill="#dff3fb" />
  <g>${chinaSeaLayer}</g>
  <g fill="#f8f2d8" stroke="#777" stroke-width="1">${chinaProvinceLayer}</g>
  <g>${chinaLakeLayer}</g>
  <g>${chinaRiverLayer}</g>
  <g>${chinaGridLayer}</g>
</svg>`

const chinaOutput = join(tmpdir(), 'china-hydro-overlay.svg')
await writeFile(chinaOutput, chinaSvg, 'utf8')
console.log(chinaOutput)
