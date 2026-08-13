import { isPhrasePunctuation, phraseCharacters } from './schulte.js'

export const schultePhraseWorkbookHeaders = [
  '類型', '標題', '完整句子', '句義', '出處', '自訂干擾字', '是否啟用',
]

function text(value) {
  if (value == null) return ''
  if (typeof value === 'object') {
    if ('text' in value) return String(value.text || '').trim()
    if (Array.isArray(value.richText)) return value.richText.map((item) => item.text).join('').trim()
    if ('result' in value) return String(value.result || '').trim()
  }
  return String(value).trim()
}

function characterCount(value) {
  return phraseCharacters(value).length
}

export function splitPhraseContent(content, maximumCharacters = 20) {
  const normalized = text(content)
  if (!normalized) return []
  const clauses = normalized.match(/[^，。！？；,.!?;]+[，。！？；,.!?;]?/gu) || [normalized]
  const results = []
  let current = ''

  const pushCurrent = () => {
    if (text(current)) results.push(text(current))
    current = ''
  }

  for (const clause of clauses) {
    if (characterCount(clause) <= maximumCharacters) {
      if (current && characterCount(current + clause) > maximumCharacters) pushCurrent()
      current += clause
      continue
    }
    pushCurrent()
    let chunk = ''
    let count = 0
    for (const character of Array.from(clause)) {
      if (!isPhrasePunctuation(character) && count >= maximumCharacters) {
        results.push(text(chunk))
        chunk = ''
        count = 0
      }
      chunk += character
      if (!isPhrasePunctuation(character)) count += 1
    }
    current = chunk
  }
  pushCurrent()
  return results
}

function normalizeCategory(value) {
  const normalized = text(value).toLowerCase()
  return normalized === '詩句' || normalized === 'poem' ? 'poem' : 'quote'
}

function normalizeActive(value) {
  const normalized = text(value).toLowerCase()
  return !['否', '停用', 'false', '0', 'no'].includes(normalized)
}

export function normalizePhraseImportRows(rawRows) {
  const rows = []
  const errors = []
  const seenContent = new Set()

  rawRows.forEach((raw, index) => {
    const rowNumber = raw.rowNumber || index + 2
    const title = text(raw.title ?? raw['標題'])
    const content = text(raw.content ?? raw['完整句子'])
    const meaning = text(raw.meaning ?? raw['句義'])
    if (!title && !content && !meaning) return
    if (!title || !content || !meaning) {
      errors.push(`第 ${rowNumber} 列：標題、完整句子與句義皆為必填。`)
      return
    }
    const fragments = splitPhraseContent(content)
    fragments.forEach((fragment, fragmentIndex) => {
      if (characterCount(fragment) < 2) {
        errors.push(`第 ${rowNumber} 列：拆分後的句子至少需要 2 個文字。`)
        return
      }
      if (seenContent.has(fragment)) {
        errors.push(`第 ${rowNumber} 列：同一份檔案中有重複句子「${fragment}」。`)
        return
      }
      seenContent.add(fragment)
      rows.push({
        rowNumber,
        category: normalizeCategory(raw.category ?? raw['類型']),
        title: fragments.length > 1 ? `${title}（${fragmentIndex + 1}）` : title,
        content: fragment,
        meaning,
        source: text(raw.source ?? raw['出處']),
        distractorCharacters: text(raw.distractorCharacters ?? raw['自訂干擾字']),
        isActive: normalizeActive(raw.isActive ?? raw['是否啟用']),
      })
    })
  })
  if (!rows.length && !errors.length) errors.push('檔案中沒有可匯入的題目。')
  return { rows, errors }
}

function worksheetRows(worksheet) {
  const headerMap = new Map()
  worksheet.getRow(1).eachCell((cell, columnNumber) => headerMap.set(text(cell.value), columnNumber))
  const missing = ['標題', '完整句子', '句義'].filter((header) => !headerMap.has(header))
  if (missing.length) return { rawRows: [], errors: [`缺少必要欄位：${missing.join('、')}`] }
  const rawRows = []
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const values = Object.fromEntries(schultePhraseWorkbookHeaders.map((header) => [
      header,
      headerMap.has(header) ? text(row.getCell(headerMap.get(header)).value) : '',
    ]))
    rawRows.push({ ...values, rowNumber })
  }
  return { rawRows, errors: [] }
}

export async function readSchultePhraseExcel(file) {
  const excelModule = await import('exceljs')
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const worksheet = workbook.getWorksheet('詩句名言題庫') || workbook.worksheets[0]
  if (!worksheet) return { rows: [], errors: ['找不到工作表。'] }
  const parsed = worksheetRows(worksheet)
  if (parsed.errors.length) return { rows: [], errors: parsed.errors }
  return normalizePhraseImportRows(parsed.rawRows)
}

export function parseSchultePhraseHtmlTable(html) {
  const documentNode = new DOMParser().parseFromString(html, 'text/html')
  const table = documentNode.querySelector('table')
  if (!table) return { rows: [], errors: ['Word 檔案中找不到表格。請使用系統提供的範本。'] }
  const tableRows = [...table.querySelectorAll('tr')]
  const headers = [...(tableRows[0]?.querySelectorAll('th,td') || [])].map((cell) => text(cell.textContent))
  const missing = ['標題', '完整句子', '句義'].filter((header) => !headers.includes(header))
  if (missing.length) return { rows: [], errors: [`缺少必要欄位：${missing.join('、')}`] }
  const rawRows = tableRows.slice(1).map((row, index) => {
    const cells = [...row.querySelectorAll('th,td')]
    const values = Object.fromEntries(headers.map((header, cellIndex) => [header, text(cells[cellIndex]?.textContent)]))
    return { ...values, rowNumber: index + 2 }
  })
  return normalizePhraseImportRows(rawRows)
}

export async function readSchultePhraseWord(file) {
  const mammothModule = await import('mammoth/mammoth.browser')
  const mammoth = mammothModule.default || mammothModule
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
  return parseSchultePhraseHtmlTable(result.value)
}

export async function readSchultePhraseFile(file) {
  const name = String(file?.name || '').toLowerCase()
  if (name.endsWith('.xlsx')) return readSchultePhraseExcel(file)
  if (name.endsWith('.docx')) return readSchultePhraseWord(file)
  return { rows: [], errors: ['僅支援 .xlsx 或 .docx 檔案。'] }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadSchultePhraseExcelTemplate() {
  const excelModule = await import('exceljs')
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()
  workbook.creator = '石榴國中各科學習系統'
  const guide = workbook.addWorksheet('使用說明')
  guide.columns = [{ width: 24 }, { width: 88 }]
  guide.addRows([
    ['項目', '說明'],
    ['固定版面', '每題固定為 5×5。系統會把正確文字與干擾字混合排列。'],
    ['長句拆分', '每題最多 20 個正確文字；超過時會依標點自動拆成多題，保留至少 5 個干擾字。'],
    ['自訂干擾字', '可留空，由系統自動補入形近字與明顯錯誤字；相同於答案的文字會自動排除。'],
    ['重複資料', '相同完整句子再次匯入時，會更新既有題目。'],
  ])
  const sheet = workbook.addWorksheet('詩句名言題庫')
  sheet.columns = schultePhraseWorkbookHeaders.map((header) => ({ header, key: header, width: header === '句義' ? 42 : 18 }))
  sheet.addRow({ 類型: '詩句', 標題: '春曉', 完整句子: '春眠不覺曉，處處聞啼鳥。', 句義: '春夜睡得安穩，不知不覺天亮了，到處都聽得到鳥叫聲。', 出處: '唐・孟浩然', 自訂干擾字: '眠覺啼聞曉鳥', 是否啟用: '是' })
  for (const worksheet of [guide, sheet]) {
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF66528F' } }
    worksheet.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true } })
  }
  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), '專注力訓練-詩句名言匯入範本.xlsx')
}

export async function downloadSchultePhraseWordTemplate() {
  const docx = await import('docx')
  const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } = docx
  const cell = (value, bold = false) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value, bold })] })] })
  const documentFile = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: '專注力訓練－詩句與名言題庫匯入範本', bold: true, size: 32 })] }),
        new Paragraph('每題最多 20 個正確文字；長句會依標點自動拆題。自訂干擾字可留空。請保留第一列表頭。'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: schultePhraseWorkbookHeaders.map((header) => cell(header, true)) }),
            new TableRow({ children: ['詩句', '春曉', '春眠不覺曉，處處聞啼鳥。', '春夜睡得安穩，不知不覺天亮了，到處都聽得到鳥叫聲。', '唐・孟浩然', '眠覺啼聞曉鳥', '是'].map((value) => cell(value)) }),
          ],
        }),
      ],
    }],
  })
  const blob = await Packer.toBlob(documentFile)
  downloadBlob(blob, '專注力訓練-詩句名言匯入範本.docx')
}
