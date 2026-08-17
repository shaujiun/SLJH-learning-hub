export const schulteMemorizationWorkbookHeaders = ['名言佳句', '測驗日期', '釋義', '出處']

function text(value) {
  if (value == null) return ''
  if (typeof value === 'object') {
    if ('text' in value) return String(value.text || '').trim()
    if (Array.isArray(value.richText)) return value.richText.map((item) => item.text).join('').trim()
    if ('result' in value) return String(value.result || '').trim()
  }
  return String(value).trim()
}

function dateString(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  if (value && typeof value === 'object') {
    if ('result' in value) return dateString(value.result)
    if ('text' in value) return dateString(value.text)
  }
  const normalized = text(value).replace(/[.／]/g, '/').replace(/-/g, '/')
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (!match) return ''
  const candidate = new Date(`${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}T12:00:00`)
  if (Number.isNaN(candidate.getTime())
    || candidate.getFullYear() !== Number(match[1])
    || candidate.getMonth() + 1 !== Number(match[2])
    || candidate.getDate() !== Number(match[3])) return ''
  return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`
}

export function normalizeMemorizationImportRows(rawRows) {
  const rows = []
  const errors = []
  const seenContent = new Set()

  rawRows.forEach((raw, index) => {
    const rowNumber = raw.rowNumber || index + 2
    const content = text(raw.content ?? raw['名言佳句'])
    const meaning = text(raw.meaning ?? raw['釋義'])
    const rawTestDateValue = raw.testDate ?? raw['測驗日期']
    const rawTestDate = text(rawTestDateValue)
    const testDate = dateString(rawTestDateValue)
    const source = text(raw.source ?? raw['出處'])
    if (!content && !meaning && !rawTestDate) return
    if (!content || !meaning) {
      errors.push(`第 ${rowNumber} 列：名言佳句與釋義皆為必填。`)
      return
    }
    if (rawTestDate && !testDate) {
      errors.push(`第 ${rowNumber} 列：測驗日期請使用完整西元 YYYY/MM/DD，或留空只加入一般練習。`)
      return
    }
    const characterCount = [...content.replace(/[，。！？；、,.!?;\s]/gu, '')].length
    if (characterCount < 2) {
      errors.push(`第 ${rowNumber} 列：名言佳句至少需要 2 個文字。`)
      return
    }
    if (characterCount > 20) {
      errors.push(`第 ${rowNumber} 列：名言佳句最多 20 個文字，才能在 5×5 中保留干擾字。`)
      return
    }
    if (seenContent.has(content)) {
      errors.push(`第 ${rowNumber} 列：同一份檔案中有重複佳句「${content}」。`)
      return
    }
    seenContent.add(content)
    rows.push({ rowNumber, content, meaning, testDate, source })
  })

  const grouped = rows.filter((row) => row.testDate).reduce((result, row) => {
    if (!result[row.testDate]) result[row.testDate] = []
    result[row.testDate].push(row)
    return result
  }, {})
  Object.entries(grouped).forEach(([testDate, items]) => {
    if (items.length !== 5) errors.push(`${testDate} 必須剛好有 5 句，目前為 ${items.length} 句。`)
  })
  if (!rows.length && !errors.length) errors.push('檔案中沒有可匯入的名言佳句。')

  return {
    rows,
    generalRows: rows.filter((row) => !row.testDate),
    batches: Object.entries(grouped)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([testDate, items]) => ({ testDate, items })),
    errors,
  }
}

function worksheetRows(worksheet) {
  const headerMap = new Map()
  worksheet.getRow(1).eachCell((cell, columnNumber) => headerMap.set(text(cell.value), columnNumber))
  const missing = ['名言佳句', '釋義'].filter((header) => !headerMap.has(header))
  if (missing.length) return { rawRows: [], errors: [`缺少必要欄位：${missing.join('、')}`] }
  const rawRows = []
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const values = Object.fromEntries(schulteMemorizationWorkbookHeaders.map((header) => [
      header,
      headerMap.has(header) ? row.getCell(headerMap.get(header)).value : '',
    ]))
    rawRows.push({ ...values, rowNumber })
  }
  return { rawRows, errors: [] }
}

export async function readSchulteMemorizationExcel(file) {
  const excelModule = await import('exceljs')
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const worksheet = workbook.getWorksheet('週五背誦題庫') || workbook.worksheets[0]
  if (!worksheet) return { rows: [], generalRows: [], batches: [], errors: ['找不到工作表。'] }
  const parsed = worksheetRows(worksheet)
  if (parsed.errors.length) return { rows: [], generalRows: [], batches: [], errors: parsed.errors }
  return normalizeMemorizationImportRows(parsed.rawRows)
}

export function parseSchulteMemorizationHtmlTable(html) {
  const documentNode = new DOMParser().parseFromString(html, 'text/html')
  const table = documentNode.querySelector('table')
  if (!table) return { rows: [], generalRows: [], batches: [], errors: ['Word 檔案中找不到表格。'] }
  const tableRows = [...table.querySelectorAll('tr')]
  const headers = [...(tableRows[0]?.querySelectorAll('th,td') || [])].map((cell) => text(cell.textContent))
  const missing = ['名言佳句', '釋義'].filter((header) => !headers.includes(header))
  if (missing.length) return { rows: [], generalRows: [], batches: [], errors: [`缺少必要欄位：${missing.join('、')}`] }
  const rawRows = tableRows.slice(1).map((row, index) => {
    const cells = [...row.querySelectorAll('th,td')]
    return {
      ...Object.fromEntries(headers.map((header, cellIndex) => [header, text(cells[cellIndex]?.textContent)])),
      rowNumber: index + 2,
    }
  })
  return normalizeMemorizationImportRows(rawRows)
}

export async function readSchulteMemorizationWord(file) {
  const mammothModule = await import('mammoth/mammoth.browser')
  const mammoth = mammothModule.default || mammothModule
  const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
  return parseSchulteMemorizationHtmlTable(result.value)
}

export async function readSchulteMemorizationFile(file) {
  const name = String(file?.name || '').toLowerCase()
  if (name.endsWith('.xlsx')) return readSchulteMemorizationExcel(file)
  if (name.endsWith('.docx')) return readSchulteMemorizationWord(file)
  return { rows: [], generalRows: [], batches: [], errors: ['只支援 .xlsx 或 .docx 檔案。'] }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadSchulteMemorizationExcelTemplate() {
  const excelModule = await import('exceljs')
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()
  workbook.creator = '石榴國中各科學習系統'
  const sheet = workbook.addWorksheet('週五背誦題庫')
  sheet.columns = [
    { header: '名言佳句', key: 'content', width: 32 },
    { header: '測驗日期', key: 'testDate', width: 18 },
    { header: '釋義', key: 'meaning', width: 48 },
    { header: '出處', key: 'source', width: 24 },
  ]
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  const guide = workbook.addWorksheet('使用說明')
  guide.columns = [{ width: 24 }, { width: 86 }]
  guide.addRows([
    ['項目', '說明'],
    ['測驗日期', '選填。有填日期會加入週五背誦及一般練習；留空只加入一般練習。'],
    ['每批數量', '有填日期時，同一個測驗日期必須剛好 5 句；每句最多 20 個文字（標點不計）。'],
    ['日期格式', '如需週五背誦，請輸入完整西元日期，例如 2026/08/21。'],
    ['背誦規則', '學生只看釋義，依序完成 5 句；任一句答錯即回到第 1 句。'],
    ['一般練習', '匯入的佳句也會同步加入一般詩句與名言練習題庫。'],
  ])
  const examples = [
    ['學而時習之，不亦說乎。', '學習知識後時常溫習，是一件令人喜悅的事。', '《論語・學而》'],
    ['三人行，必有我師焉。', '與多人同行，其中必定有人值得我學習。', '《論語・述而》'],
    ['知之為知之，不知為不知，是知也。', '知道就是知道，不知道就承認不知道，這才是真正的智慧。', '《論語・為政》'],
    ['工欲善其事，必先利其器。', '想把事情做好，應先準備好合適的工具。', '《論語・衛靈公》'],
    ['己所不欲，勿施於人。', '自己不願承受的事，也不要加在別人身上。', '《論語・顏淵》'],
  ]
  examples.forEach(([content, meaning, source]) => sheet.addRow({ content, testDate: '2026/08/21', meaning, source }))
  sheet.addRow({ content: '讀萬卷書，行萬里路。', testDate: '', meaning: '除了閱讀，也要從實際經驗中增廣見聞。', source: '古語' })
  for (const worksheet of [guide, sheet]) {
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF66528F' } }
    worksheet.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true } })
  }
  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), '週五名言佳句背誦匯入範本.xlsx')
}

export async function downloadSchulteMemorizationWordTemplate() {
  const docx = await import('docx')
  const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } = docx
  const cell = (value, bold = false) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value, bold })] })] })
  const sampleRows = [
    ['學而時習之，不亦說乎。', '2026/08/21', '學習知識後時常溫習，是一件令人喜悅的事。', '《論語・學而》'],
    ['三人行，必有我師焉。', '2026/08/21', '與多人同行，其中必定有人值得我學習。', '《論語・述而》'],
    ['知之為知之，不知為不知，是知也。', '2026/08/21', '知道就是知道，不知道就承認不知道，這才是真正的智慧。', '《論語・為政》'],
    ['工欲善其事，必先利其器。', '2026/08/21', '想把事情做好，應先準備好合適的工具。', '《論語・衛靈公》'],
    ['己所不欲，勿施於人。', '2026/08/21', '自己不願承受的事，也不要加在別人身上。', '《論語・顏淵》'],
  ]
  const documentFile = new Document({ sections: [{ children: [
    new Paragraph({ children: [new TextRun({ text: '週五名言佳句背誦匯入範本', bold: true, size: 32 })] }),
    new Paragraph('測驗日期為選填：有填日期會加入週五背誦及一般練習，同一日期必須剛好 5 句；留空則只加入一般練習。'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: schulteMemorizationWorkbookHeaders.map((header) => cell(header, true)) }),
        ...sampleRows.map((row) => new TableRow({ children: row.map((value) => cell(value)) })),
        new TableRow({ children: ['讀萬卷書，行萬里路。', '', '除了閱讀，也要從實際經驗中增廣見聞。', '古語'].map((value) => cell(value)) }),
      ],
    }),
  ] }] })
  const blob = await Packer.toBlob(documentFile)
  downloadBlob(blob, '週五名言佳句背誦匯入範本.docx')
}
