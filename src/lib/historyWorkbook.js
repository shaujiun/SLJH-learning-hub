import {
  normalizeHistoryEventInput,
  normalizeHistoryQuestionInput,
} from './historyAtlas.js'

export const historyWorkbookHeaders = [
  '事件代碼', '章節代碼', '事件名稱', '開始年份', '結束年份', '日期顯示',
  '地區代碼', '事件類型代碼', '重要程度', '一句話重點', '發生原因', '事件經過',
  '後續影響', '重要人物', '關鍵詞', '圖片網址', '圖片出處', '圖片出處網址',
  '延伸網址', '資料來源備註', '顯示順序',
]

export const historyQuestionWorkbookHeaders = [
  '題目代碼', '事件代碼', '題目類型', '題目內容', '參考答案', '解析',
  '來源名稱', '來源年度', '來源網址', '顯示順序', '選項', '圖片網址',
  '題目表格 JSON', '原始事件代碼', '配對信心', '配對備註',
]

function cellText(cell) {
  const value = cell?.value
  if (value == null) return ''
  if (typeof value === 'object') {
    if ('text' in value) return String(value.text || '')
    if (Array.isArray(value.richText)) return value.richText.map((item) => item.text).join('')
    if ('result' in value) return String(value.result || '')
  }
  return String(value).trim()
}

function rowInput(values) {
  return {
    eventCode: values['事件代碼'],
    chapterCode: values['章節代碼'],
    title: values['事件名稱'],
    startYear: values['開始年份'],
    endYear: values['結束年份'],
    displayDate: values['日期顯示'],
    region: values['地區代碼'],
    category: values['事件類型代碼'],
    importance: values['重要程度'] || 2,
    summary: values['一句話重點'],
    causeText: values['發生原因'],
    processText: values['事件經過'],
    impactText: values['後續影響'],
    people: values['重要人物'],
    keywords: values['關鍵詞'],
    imageUrl: values['圖片網址'],
    imageSource: values['圖片出處'],
    imageSourceUrl: values['圖片出處網址'],
    resourceUrl: values['延伸網址'],
    sourceNote: values['資料來源備註'],
    displayOrder: values['顯示順序'] || 0,
    status: 'draft',
  }
}

export function parseHistoryWorksheet(worksheet, chapters) {
  const headerMap = new Map()
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    headerMap.set(cellText(cell), columnNumber)
  })
  const missingHeaders = historyWorkbookHeaders.slice(0, 9).filter((header) => !headerMap.has(header))
  if (missingHeaders.length > 0) {
    return { rows: [], errors: [`缺少必要欄位：${missingHeaders.join('、')}`] }
  }

  const rows = []
  const errors = []
  const seenCodes = new Set()
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const values = Object.fromEntries(historyWorkbookHeaders.map((header) => (
      [header, cellText(row.getCell(headerMap.get(header)))]
    )))
    if (!values['事件代碼'] && !values['事件名稱']) continue
    const input = rowInput(values)
    try {
      const payload = normalizeHistoryEventInput(input, chapters)
      if (seenCodes.has(payload.event_code)) throw new Error('同一份檔案內事件代碼重複。')
      seenCodes.add(payload.event_code)
      rows.push({ rowNumber, input, payload })
    } catch (error) {
      errors.push(`第 ${rowNumber} 列：${error.message}`)
    }
  }
  if (rows.length === 0 && errors.length === 0) errors.push('檔案中沒有可匯入的事件資料。')
  return { rows, errors }
}

export async function readHistoryWorkbook(file, chapters) {
  const excelModule = await import('exceljs')
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const worksheet = workbook.getWorksheet('事件匯入') || workbook.worksheets[0]
  if (!worksheet) return { rows: [], errors: ['找不到工作表。'] }
  return parseHistoryWorksheet(worksheet, chapters)
}

function questionRowInput(values, events) {
  const eventCode = String(values['事件代碼'] || '').trim().toLowerCase()
  const relatedEvent = events.find((event) => String(event.eventCode).toLowerCase() === eventCode)
  const rawType = String(values['題目類型'] || '').trim()
  const questionType = rawType === '歷屆題' ? 'past' : rawType === '教師自編題' ? 'practice' : rawType
  return {
    questionCode: values['題目代碼'],
    eventId: relatedEvent?.id || '',
    questionType,
    prompt: values['題目內容'],
    answer: values['參考答案'],
    explanation: values['解析'],
    sourceName: values['來源名稱'],
    sourceYear: values['來源年度'],
    sourceUrl: values['來源網址'],
    options: values['選項'],
    mediaUrls: values['圖片網址'],
    tables: values['題目表格 JSON'],
    originalEventIds: values['原始事件代碼'],
    mappingConfidence: values['配對信心'],
    mappingNote: values['配對備註'],
    displayOrder: values['顯示順序'] || 0,
    status: 'draft',
  }
}

export function parseHistoryQuestionWorksheet(worksheet, events) {
  const headerMap = new Map()
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    headerMap.set(cellText(cell), columnNumber)
  })
  const missingHeaders = historyQuestionWorkbookHeaders.slice(0, 5).filter((header) => !headerMap.has(header))
  if (missingHeaders.length > 0) return { rows: [], errors: [`缺少必要欄位：${missingHeaders.join('、')}`] }

  const rows = []
  const errors = []
  const seenCodes = new Set()
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const values = Object.fromEntries(historyQuestionWorkbookHeaders.map((header) => {
      const columnNumber = headerMap.get(header)
      return [header, columnNumber ? cellText(row.getCell(columnNumber)) : '']
    }))
    if (!values['題目代碼'] && !values['題目內容']) continue
    const eventCode = String(values['事件代碼'] || '').trim().toLowerCase()
    if (!events.some((event) => String(event.eventCode).toLowerCase() === eventCode)) {
      errors.push(`第 ${rowNumber} 列：找不到事件代碼「${values['事件代碼']}」。`)
      continue
    }
    const input = questionRowInput(values, events)
    try {
      const payload = normalizeHistoryQuestionInput(input, events)
      if (seenCodes.has(payload.question_code)) throw new Error('同一份檔案內題目代碼重複。')
      seenCodes.add(payload.question_code)
      rows.push({ rowNumber, input, payload, eventCode })
    } catch (error) {
      errors.push(`第 ${rowNumber} 列：${error.message}`)
    }
  }
  if (rows.length === 0 && errors.length === 0) errors.push('檔案中沒有可匯入的題目資料。')
  return { rows, errors }
}

export async function readHistoryQuestionWorkbook(file, events) {
  const excelModule = await import('exceljs')
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const worksheet = workbook.getWorksheet('題庫匯入') || workbook.worksheets[0]
  if (!worksheet) return { rows: [], errors: ['找不到工作表。'] }
  return parseHistoryQuestionWorksheet(worksheet, events)
}

export async function downloadHistoryQuestionWorkbookTemplate(events) {
  const excelModule = await import('exceljs')
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()
  workbook.creator = '石榴國中各科學習系統'
  const guide = workbook.addWorksheet('使用說明')
  guide.columns = [{ width: 24 }, { width: 90 }]
  guide.addRows([
    ['項目', '說明'],
    ['匯入狀態', '所有題目一律先匯入為草稿，確認內容與來源後再發布。'],
    ['題目類型', '教師自編題可填 practice 或教師自編題；歷屆題可填 past 或歷屆題。'],
    ['歷屆題來源', '歷屆題的來源名稱為必填，例如國中教育會考；來源年度與網址建議一併填寫。'],
    ['選項格式', '每行一個選項，例如：A｜選項內容。沒有選項的題目可留空。'],
    ['媒體與表格', '圖片網址每行一個；表格使用 JSON 陣列格式。'],
    ['事件代碼', events.map((event) => `${event.eventCode}＝${event.title}`).join('\n')],
  ])
  guide.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  guide.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF76503A' } }
  guide.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true } })

  const sheet = workbook.addWorksheet('題庫匯入')
  sheet.columns = historyQuestionWorkbookHeaders.map((header) => ({ header, key: header, width: Math.max(16, header.length * 2 + 6) }))
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5E3C' } }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  sheet.autoFilter = { from: 'A1', to: 'P1' }
  sheet.addRow({
    題目代碼: 'h3c1-example-q01',
    事件代碼: events[0]?.eventCode || 'h3c1-01',
    題目類型: '教師自編題',
    題目內容: '範例題目（匯入前請刪除）',
    參考答案: '範例答案',
    解析: '',
    來源名稱: '石榴國中教師自編',
    來源年度: '',
    來源網址: '',
    顯示順序: 10,
    選項: 'A｜選項甲\nB｜選項乙',
    圖片網址: '',
    '題目表格 JSON': '',
    原始事件代碼: '',
    配對信心: 0,
    配對備註: '',
  })
  sheet.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true } })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = '歷史時光地圖-題庫匯入範本.xlsx'
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadHistoryWorkbookTemplate(chapters) {
  const excelModule = await import('exceljs')
  const ExcelJS = excelModule.default || excelModule
  const workbook = new ExcelJS.Workbook()
  workbook.creator = '石榴國中各科學習系統'
  const guide = workbook.addWorksheet('使用說明')
  guide.columns = [{ width: 24 }, { width: 90 }]
  guide.addRows([
    ['項目', '說明'],
    ['匯入狀態', '所有匯入資料一律先儲存為草稿，確認內容後再發布。'],
    ['年份', '西元前請輸入負數，例如西元前 221 年輸入 -221；不使用西元 0 年。'],
    ['地區代碼', 'taiwan、china、japan、korea、world'],
    ['事件類型代碼', 'dynasty、politics、war、diplomacy、economy、society'],
    ['多人或關鍵詞', '請用頓號、逗號或分號分隔。'],
    ['章節代碼', chapters.map((chapter) => `${chapter.chapterCode}＝第 ${chapter.volumeNo} 冊第 ${chapter.chapterNo} 章`).join('\n')],
  ])
  guide.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  guide.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5E3C' } }
  guide.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true } })

  const sheet = workbook.addWorksheet('事件匯入')
  sheet.columns = historyWorkbookHeaders.map((header) => ({ header, key: header, width: Math.max(14, header.length * 2 + 4) }))
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9C6B3F' } }
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  sheet.autoFilter = { from: 'A1', to: 'U1' }
  sheet.addRow({
    事件代碼: 'h3c1-example',
    章節代碼: chapters[0]?.chapterCode || 'hanlin-8-1-01',
    事件名稱: '範例事件（匯入前請刪除）',
    開始年份: -221,
    結束年份: '',
    日期顯示: '',
    地區代碼: 'china',
    事件類型代碼: 'politics',
    重要程度: 2,
    一句話重點: '用一句話說明事件最重要的意義。',
    發生原因: '',
    事件經過: '',
    後續影響: '',
    重要人物: '',
    關鍵詞: '',
    圖片網址: '',
    圖片出處: '',
    圖片出處網址: '',
    延伸網址: '',
    資料來源備註: '',
    顯示順序: 10,
  })
  sheet.eachRow((row) => { row.alignment = { vertical: 'top', wrapText: true } })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = '歷史時光地圖-事件匯入範本.xlsx'
  anchor.click()
  URL.revokeObjectURL(url)
}
