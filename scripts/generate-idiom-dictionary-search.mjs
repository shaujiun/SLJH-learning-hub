import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const version = 'dict_idioms_2020_20260929'
const commit = '1d3f96768ee2ff33451e0e0b31ae923e007477a1'
const sourceUrl = `https://raw.githubusercontent.com/doggy8088/dict-idioms-2020/${commit}/${version}.min.json`
const appendixSourceUrl = `https://raw.githubusercontent.com/doggy8088/dict-idioms-2020/${commit}/public/dict_idioms_appendix_2020_20260929.min.json`
const licenseUrl = `https://raw.githubusercontent.com/doggy8088/dict-idioms-2020/${commit}/LICENSE`

function text(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean).join('\n')
  return String(value || '').trim()
}

async function sourceBytes(url, localPath) {
  if (localPath) return readFile(localPath)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`無法下載成語資料：${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

function searchEntry(entry, kind) {
  const sourceEntryId = Number(entry['編號']) || null
  const websiteEntryId = Number(entry['網站ID']) || sourceEntryId
  const source = text(entry['典源文獻名稱']) || text(entry['典源參考資料'])
  return {
    sourceEntryId,
    ...(websiteEntryId !== sourceEntryId ? { websiteEntryId } : {}),
    phrase: text(entry['成語']).replace(/\s/g, ''),
    zhuyin: text(entry['注音']),
    pinyin: text(entry['漢語拼音']),
    definition: text(entry['釋義']),
    source,
    story: text(entry['典故說明']),
    sourceType: text(entry['主條成語／非主條成語']) || (kind === 'appendix' ? '修訂本參考資料' : ''),
    sourceUrl: websiteEntryId ? `https://dict.idioms.moe.edu.tw/idiomView.jsp?ID=${websiteEntryId}&webMd=2&la=0` : 'https://dict.idioms.moe.edu.tw/',
  }
}

async function buildSearchPayload({ url, localPath, kind }) {
  const bytes = await sourceBytes(url, localPath)
  const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''))
  if (!Array.isArray(parsed?.idioms)) throw new Error(`上游${kind === 'appendix' ? '附錄' : '正文'}資料不含 idioms 陣列。`)
  const entries = parsed.idioms
    .map((entry) => searchEntry(entry, kind))
    .filter((entry) => entry.phrase && entry.definition)
  return {
    bytes,
    output: {
      source: {
        repository: 'https://github.com/doggy8088/dict-idioms-2020',
        commit,
        version,
        ...(kind === 'appendix' ? { kind } : {}),
        license: 'CC BY-ND 3.0 TW',
        attribution: '中華民國教育部（Ministry of Education, R.O.C.）。《成語典》（版本編號：2020_20260929）網址：http://dict.idioms.moe.edu.tw/',
        originalSha256: createHash('sha256').update(bytes).digest('hex'),
      },
      entries,
    },
  }
}

const main = await buildSearchPayload({
  url: sourceUrl,
  localPath: process.argv[2] || process.env.IDIOM_DICTIONARY_SOURCE,
  kind: 'main',
})
const appendix = await buildSearchPayload({
  url: appendixSourceUrl,
  localPath: process.argv[3] || process.env.IDIOM_DICTIONARY_APPENDIX_SOURCE,
  kind: 'appendix',
})

const outputUrl = new URL('../public/idiom-dictionary-2020-search.json', import.meta.url)
const appendixOutputUrl = new URL('../public/idiom-dictionary-2020-appendix-search.json', import.meta.url)
await writeFile(fileURLToPath(outputUrl), JSON.stringify(main.output), 'utf8')
await writeFile(fileURLToPath(appendixOutputUrl), JSON.stringify(appendix.output), 'utf8')

const licenseResponse = await fetch(licenseUrl)
if (!licenseResponse.ok) throw new Error(`無法下載授權文件：${licenseResponse.status}`)
const licenseOutputUrl = new URL('../public/idiom-dictionary-license.txt', import.meta.url)
const licenseOutputPath = fileURLToPath(licenseOutputUrl)
const downloadedLicense = await licenseResponse.text()
let existingLicense = ''
try {
  existingLicense = await readFile(licenseOutputPath, 'utf8')
} catch {
  // First generation writes the upstream license below.
}
if (existingLicense.replace(/\r\n/g, '\n') !== downloadedLicense.replace(/\r\n/g, '\n')) {
  await writeFile(licenseOutputPath, downloadedLicense, 'utf8')
}

process.stdout.write([
  `正文：${main.output.entries.length} 筆，${fileURLToPath(outputUrl)}`,
  `附錄：${appendix.output.entries.length} 筆，${fileURLToPath(appendixOutputUrl)}`,
  '',
].join('\n'))
