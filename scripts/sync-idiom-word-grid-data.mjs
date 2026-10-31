import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const baseUrl = 'https://dict.idioms.moe.edu.tw/'
const version = 'dict_idioms_2020_20260929'
const phraseGroups = {
  elementary: ['一心一意', '心平氣和', '和氣生財', '生財有道', '自相矛盾', '相得益彰', '益壽延年', '年富力強', '強詞奪理'],
  junior: ['事半功倍', '功成名就', '名列前茅', '茅塞頓開', '開門見山', '山明水秀', '學以致用', '用武之地', '地久天長'],
  senior: ['長驅直入', '入木三分', '分秒必爭', '爭先恐後', '後生可畏', '畏首畏尾'],
}

function decodeEntities(text) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ensp: ' ', emsp: ' ' }
  return text
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match)
}

function htmlToText(html) {
  return decodeEntities(String(html || ''))
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|blockquote)>/gi, '\n')
    .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function rowText(html, rowId) {
  const rowMatch = html.match(new RegExp(`<tr[^>]*id=['"]${rowId}['"][^>]*>([\\s\\S]*?)<\\/tr>`, 'i'))
  if (!rowMatch) return ''
  const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
  return htmlToText(cells.at(-1)?.[1] || '')
}

async function fetchPage(url, { attempt = 1, cookie = '', referer = '' } = {}) {
  const headers = { 'user-agent': 'SLJH-learning-hub/1.0 educational data sync' }
  if (cookie) headers.cookie = cookie
  if (referer) headers.referer = referer
  const response = await fetch(url, { headers })
  if (!response.ok) {
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 800))
      return fetchPage(url, { attempt: attempt + 1, cookie, referer })
    }
    throw new Error(`${response.status} ${url}`)
  }
  return {
    text: await response.text(),
    cookie: response.headers.get('set-cookie')?.split(';')[0] || cookie,
  }
}

async function fetchEntry(phrase, stage) {
  const searchUrl = new URL('idiomList.jsp', baseUrl)
  searchUrl.searchParams.set('idiom', phrase)
  searchUrl.searchParams.set('qMd', '0')
  searchUrl.searchParams.append('qTp', '1')
  searchUrl.searchParams.append('qTp', '2')
  searchUrl.searchParams.set('webMd', '2')
  searchUrl.searchParams.set('la', '0')
  const listPage = await fetchPage(searchUrl)
  const listHtml = listPage.text
  const inputPattern = new RegExp(`id=['"]chk_ID_(\\d+)['"][^>]*data-idiom=['"]${escapeRegex(phrase)}['"]`, 'i')
  const linkPattern = new RegExp(`href=['"]idiomView\\.jsp\\?ID=(\\d+)[^'"]*['"][^>]*>[\\s\\S]{0,120}?${escapeRegex(phrase)}`, 'i')
  const id = listHtml.match(inputPattern)?.[1] || listHtml.match(linkPattern)?.[1]
  if (!id) throw new Error(`找不到教育部《成語典》正文條目：${phrase}`)
  const sourceUrl = new URL('idiomView.jsp', baseUrl)
  sourceUrl.searchParams.set('ID', id)
  sourceUrl.searchParams.set('webMd', '2')
  sourceUrl.searchParams.set('la', '0')
  const detailPage = await fetchPage(sourceUrl, { cookie: listPage.cookie, referer: searchUrl.toString() })
  const detailHtml = detailPage.text
  if (!detailHtml) throw new Error(`教育部《成語典》正文回傳空白：${phrase}`)
  return {
    id: `moe-${id}`,
    phrase,
    definition: rowText(detailHtml, 'row_mean'),
    source: rowText(detailHtml, 'row_origin'),
    story: rowText(detailHtml, 'row_annotate'),
    sourceUrl: sourceUrl.toString(),
    illustrationUrl: '',
    stage,
    licenseVersion: version,
  }
}

const requested = Object.entries(phraseGroups).flatMap(([stage, phrases]) => phrases.map((phrase) => ({ phrase, stage })))
const results = []
for (let index = 0; index < requested.length; index += 4) {
  const batch = requested.slice(index, index + 4)
  results.push(...await Promise.all(batch.map(({ phrase, stage }) => fetchEntry(phrase, stage))))
  process.stdout.write(`已同步 ${results.length}／${requested.length} 個成語\n`)
}

const outputUrl = new URL('../src/data/idiomWordGridOfficialEntries.json', import.meta.url)
await writeFile(fileURLToPath(outputUrl), `${JSON.stringify(results, null, 2)}\n`, 'utf8')
process.stdout.write(`完成：${fileURLToPath(outputUrl)}\n`)
