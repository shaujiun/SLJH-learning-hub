import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const stringSchema = { type: 'string' }
const stringArraySchema = { type: 'array', items: stringSchema }
const questionSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    position: { type: 'integer' }, kind: { type: 'string', enum: ['choice', 'cloze'] },
    groupScope: { type: 'string', enum: ['all', 'A', 'B'] }, prompt: stringSchema,
    options: stringArraySchema, blankCount: { type: 'integer' }, answers: stringArraySchema,
    explanation: stringSchema, evidenceSentence: stringSchema, hintA: stringSchema, hintB: stringSchema,
  },
  required: ['position', 'kind', 'groupScope', 'prompt', 'options', 'blankCount', 'answers', 'explanation', 'evidenceSentence', 'hintA', 'hintB'],
}

const resultSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    lesson: {
      type: 'object', additionalProperties: false,
      properties: {
        title: stringSchema, author: stringSchema, issueDate: stringSchema, source: stringSchema,
        english: stringSchema, translation: stringSchema, grammar: stringSchema,
        coreWords: stringSchema, extraWords: stringSchema,
        mindMap: {
          type: 'object', additionalProperties: false,
          properties: {
            center: stringSchema,
            branches: {
              type: 'array', minItems: 4, maxItems: 6,
              items: {
                type: 'object', additionalProperties: false,
                properties: { title: stringSchema, keywords: stringArraySchema },
                required: ['title', 'keywords'],
              },
            },
          },
          required: ['center', 'branches'],
        },
        groupAHint: stringSchema, groupBHint: stringSchema,
      },
      required: ['title', 'author', 'issueDate', 'source', 'english', 'translation', 'grammar', 'coreWords', 'extraWords', 'mindMap', 'groupAHint', 'groupBHint'],
    },
    questions: { type: 'array', items: questionSchema },
    decision: { type: 'string', enum: ['enough', 'generated'] }, message: stringSchema,
  },
  required: ['lesson', 'questions', 'decision', 'message'],
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function emptyLesson(lesson: Record<string, unknown> = {}) {
  return {
    title: String(lesson.title || ''), author: String(lesson.author || ''),
    issueDate: String(lesson.issueDate || ''), source: String(lesson.source || '聯合報好讀周報'),
    english: String(lesson.english || ''), translation: String(lesson.translation || ''),
    grammar: String(lesson.grammar || ''), coreWords: String(lesson.coreWords || ''),
    extraWords: String(lesson.extraWords || ''),
    mindMap: { center: String(lesson.title || ''), branches: [] },
    groupAHint: String(lesson.groupAHint || ''), groupBHint: String(lesson.groupBHint || ''),
  }
}

function instructionsFor(action: string) {
  const shared = `你是臺灣國中英語閱讀教材編輯。輸出必須忠於圖片與文章，不可捏造報紙原題或答案。所有中文使用繁體中文。
A 組提示提供閱讀策略、同義改寫或定位方向，不直接洩漏答案；B 組提示更具體，指出段落、關鍵字或文法形式，但仍避免直接說出選項代號。
每一題都要有正解、繁體中文解題思路，以及能逐字在英文文章中找到的 evidenceSentence。若是獨立文法填空、原文沒有對應句，evidenceSentence 請填寫該題所用的文法規則。
選擇題的 explanation 是給國中生看的精簡學習說明，依序交代：題幹要找什麼、如何用關鍵字定位原文、正確選項與原文的同義或對應關係，以及其餘選項錯在何處。不要只重述答案，也不要輸出模型內部思考過程或冗長推演。填空題則說明判斷時態、句型或字形變化所使用的線索。
國中 2000 單與補充單字格式為每行「英文 中文」。心智圖請依文章重新設計成 4 至 6 個有層次的分支，關鍵字要簡潔，不能只是照抄報紙圖形。`
  if (action === 'import_photos') return `${shared}
分析兩張同一期報紙照片。第一張是英文文章與中文翻譯；第二張是文法、單字、心智圖、小試身手與閱讀選擇題。請直接完成：
1. 校正照片角度與閱讀順序，擷取標題、作者、日期、英文全文、中文翻譯、文法、兩類單字。
2. 辨識紙本的每一道小試身手與閱讀選擇題，直接轉成 questions 陣列；不要把多題合併成一題。
3. 根據題目與文章判定正解；若照片邊緣有倒置印刷的解答，要先在視覺上旋轉理解並交叉核對，再補上解題思路、原文依據及 A／B 組提示。
4. 另外產生比紙本更清楚、適合網頁呈現的藝術心智圖內容。
照片讀不清楚的欄位可留空，但不可猜造；message 要列出需要教師特別校對的地方。decision 固定為 generated。`
  if (action === 'evaluate_questions') return `${shared}
評估現有題目是否已涵蓋：文章主旨、細節定位、推論或語意，以及報紙原有文法／填空練習。若題量與層次足夠，decision=\"enough\"、questions=[]、message=\"題目足夠，不必再生成新題目\"。若不足，decision=\"generated\"，只新增 1 至 3 題真正補足缺口的題目，不可重複現有題目。lesson 原樣整理回傳。`
  return `${shared}
逐題檢查現有題目，保留題目、選項、順序與正解，只補強或修正 explanation、evidenceSentence、hintA、hintB。回傳全部題目且順序不變。decision 固定為 generated；message 說明已完成的檢查。lesson 原樣整理回傳。`
}

function extractOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string') return response.output_text
  const output = Array.isArray(response.output) ? response.output : []
  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : []
    const text = content.find((part: Record<string, unknown>) => part?.type === 'output_text')?.text
    if (typeof text === 'string') return text
  }
  return ''
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  try {
    const authorization = request.headers.get('Authorization') || ''
    if (!authorization.startsWith('Bearer ')) return json(401, { error: '請先登入管理者帳號。' })
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !supabaseKey) return json(500, { error: 'Supabase 伺服器設定不完整。' })
    const supabase = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authorization } } })
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) return json(401, { error: '登入狀態已失效，請重新登入。' })
    const { data: allowed, error: permissionError } = await supabase.rpc('can_manage_english_reading')
    if (permissionError || !allowed) return json(403, { error: '只有已核准管理者可以使用 AI 編題。' })

    const body = await request.json()
    const action = String(body?.action || '')
    if (!['import_photos', 'evaluate_questions', 'enrich_questions'].includes(action)) return json(400, { error: '不支援的分析操作。' })
    if (action === 'import_photos') {
      for (const image of [body?.articleImage, body?.exerciseImage]) {
        if (typeof image !== 'string' || !image.startsWith('data:image/') || image.length > 9_000_000) {
          return json(400, { error: '照片格式不正確或檔案過大。' })
        }
      }
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json(503, { error: 'AI 服務尚未設定金鑰；可先使用手動選區辨識。' })
    const lesson = emptyLesson(body?.lesson || {})
    const content: Array<Record<string, unknown>> = [{
      type: 'input_text',
      text: action === 'import_photos'
        ? '請依兩張圖片建立本期完整教材。'
        : JSON.stringify({ lesson, questions: Array.isArray(body?.questions) ? body.questions : [] }),
    }]
    if (action === 'import_photos') {
      content.push({ type: 'input_text', text: '圖片一：文章與中文翻譯。' })
      content.push({ type: 'input_image', image_url: body.articleImage, detail: 'high' })
      content.push({ type: 'input_text', text: '圖片二：文法、單字、心智圖與所有紙本題目。' })
      content.push({ type: 'input_image', image_url: body.exerciseImage, detail: 'high' })
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_READING_MODEL') || 'gpt-4.1-mini',
        store: false,
        instructions: instructionsFor(action),
        input: [{ role: 'user', content }],
        text: { format: { type: 'json_schema', name: 'english_reading_material', strict: true, schema: resultSchema } },
      }),
    })
    const responseBody = await openAiResponse.json()
    if (!openAiResponse.ok) {
      console.error('OpenAI error', openAiResponse.status, responseBody?.error?.code)
      return json(502, { error: 'AI 暫時無法分析照片，請稍後再試或改用手動選區辨識。' })
    }
    const outputText = extractOutputText(responseBody)
    if (!outputText) return json(502, { error: 'AI 沒有回傳可用的教材內容。' })
    return json(200, { result: JSON.parse(outputText) })
  } catch (error) {
    console.error('analyze-english-reading failed', error)
    return json(500, { error: '分析過程發生錯誤，請確認照片清晰後再試。' })
  }
})
