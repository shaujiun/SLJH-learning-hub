import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const version = 'dict_idioms_2020_20260929'
const commit = '1d3f96768ee2ff33451e0e0b31ae923e007477a1'
const sourceUrl = `https://raw.githubusercontent.com/doggy8088/dict-idioms-2020/${commit}/${version}.min.json`
const licenseUrl = `https://raw.githubusercontent.com/doggy8088/dict-idioms-2020/${commit}/LICENSE`

function text(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean).join('\n')
  return String(value || '').trim()
}

async function sourceBytes() {
  const localPath = process.argv[2] || process.env.IDIOM_DICTIONARY_SOURCE
  if (localPath) return readFile(localPath)
  const response = await fetch(sourceUrl)
  if (!response.ok) throw new Error(`無法下載成語資料：${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

const bytes = await sourceBytes()
const parsed = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''))
if (!Array.isArray(parsed?.idioms)) throw new Error('上游資料不含 idioms 陣列。')

const entries = parsed.idioms.map((entry) => {
  const sourceEntryId = Number(entry['編號']) || null
  const source = text(entry['典源文獻名稱']) || text(entry['典源參考資料'])
  return {
    sourceEntryId,
    phrase: text(entry['成語']).replace(/\s/g, ''),
    zhuyin: text(entry['注音']),
    pinyin: text(entry['漢語拼音']),
    definition: text(entry['釋義']),
    source,
    story: text(entry['典故說明']),
    sourceType: text(entry['主條成語／非主條成語']),
    sourceUrl: sourceEntryId ? `https://dict.idioms.moe.edu.tw/idiomView.jsp?ID=${sourceEntryId}&webMd=2&la=0` : 'https://dict.idioms.moe.edu.tw/',
  }
}).filter((entry) => entry.phrase && entry.definition)

const output = {
  source: {
    repository: 'https://github.com/doggy8088/dict-idioms-2020',
    commit,
    version,
    license: 'CC BY-ND 3.0 TW',
    attribution: '中華民國教育部（Ministry of Education, R.O.C.）。《成語典》（版本編號：2020_20260929）網址：http://dict.idioms.moe.edu.tw/',
    originalSha256: createHash('sha256').update(bytes).digest('hex'),
  },
  entries,
}

const outputUrl = new URL('../public/idiom-dictionary-2020-search.json', import.meta.url)
await writeFile(fileURLToPath(outputUrl), JSON.stringify(output), 'utf8')

const licenseResponse = await fetch(licenseUrl)
if (!licenseResponse.ok) throw new Error(`無法下載授權文件：${licenseResponse.status}`)
await writeFile(fileURLToPath(new URL('../public/idiom-dictionary-license.txt', import.meta.url)), await licenseResponse.text(), 'utf8')

process.stdout.write(`完成：${entries.length} 筆，${fileURLToPath(outputUrl)}\n`)
