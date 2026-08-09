import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const sourcePageUrl = 'https://knowledgeatlas.cc/history/'
const sourceDataUrl = `${sourcePageUrl}assets/history-exam-data.js?v=20260723-junior-clearance1`
const sourceEventUrl = `${sourcePageUrl}assets/history-data.js?v=20260723-junior-clearance1`

const eventMappings = {
  'cn-feudal-1046': ['h3c1-02', 99, '西周封建制度'],
  'cn-unification-221bc': ['h3c1-05', 99, '秦統一與中央集權'],
  'cn-keju-605': ['h3c1-08', 94, '隋唐制度發展中的科舉制度'],
  'cn-tang-cosmopolitan': ['h3c2-07', 99, '唐代多元文化交流'],
  'cn-silkroad': ['h3c2-03', 94, '張騫通西域與絲路交流'],
  'jp-taika-646': ['h3c2-11', 99, '日本大化革新'],
  'cn-hundred-schools': ['h3c2-09', 99, '諸子百家'],
  'cn-northern-wei-reform': ['h3c2-06', 99, '北魏孝文帝改革'],
  'cn-paper': ['h3c2-10', 99, '造紙術改進'],
  'cn-mongol-conquest': ['h3c3-06', 92, '蒙古擴張與元朝統一'],
  'cn-maritime-song': ['h3c3-08', 99, '宋元海上貿易'],
  'cn-chanyuan-1005': ['h3c3-02', 99, '澶淵之盟'],
  'cn-zhenghe-1405': ['h3c4-03', 99, '鄭和下西洋'],
  'cn-haijin': ['h3c4-04', 99, '明代海禁'],
  'jp-europeans-1543': ['h3c4-05', 90, '日本戰國與歐洲人來航'],
  'jp-sakoku-1633': ['h3c4-05', 90, '德川幕府與鎖國政策'],
  'cn-canton-1757': ['h3c5-10', 88, '廣州一口通商，橫跨八上第 4、5 章'],
  'cn-opium-1840': ['h3c5-05', 99, '鴉片戰爭'],
  'cn-arrowwar-1856': ['h3c5-09', 99, '英法聯軍'],
  'cn-selfstrength-1861': ['h3c5-06', 99, '自強運動'],
  'cn-hundred-days-1898': ['h3c6-01', 99, '戊戌變法'],
  'cn-boxer-1900': ['h3c6-02', 99, '義和團與八國聯軍'],
  'cn-sinojapanese-1894': ['h3c5-08', 96, '甲午戰爭與馬關條約'],
  'cn-lateqing-reform': ['h3c6-03', 94, '清末新政與預備立憲'],
  'cn-1911': ['h4c1-01', 99, '武昌起義與辛亥革命'],
  'cn-roc-1912': ['h4c1-02', 99, '中華民國成立'],
  'cn-newculture-1915': ['h4c2-01', 99, '新文化運動'],
  'china-mayfourth-1919': ['h4c2-03', 99, '五四運動'],
  'cn-nanjing-decade': ['h4c3-02', 99, '十年建設'],
  'cn-manchuria-1931': ['h4c3-04', 99, '九一八事變'],
  'cn-northern-expedition-1926': ['h4c2-08', 95, '北伐'],
  'cn-xian-1936': ['h4c3-07', 99, '西安事變'],
  'cn-longmarch-1934': ['h4c3-06', 99, '紅軍長征'],
  'jp-russo-1904': ['h4c3-09', 99, '日俄戰爭'],
  'cn-warjapan-1937': ['h4c3-08', 96, '中日戰爭全面爆發'],
  'jp-pacific-1941': ['h4c4-04', 99, '太平洋戰爭'],
  'china-civilwar-1946': ['h4c4-07', 96, '國共內戰與兩岸分治'],
  'jp-surrender-1945': ['h4c4-05', 99, '日本投降與戰爭結束'],
  'cn-culturalrev-1966': ['h4c5-05', 99, '文化大革命'],
  'cn-greatleap-1958': ['h4c5-04', 99, '大躍進與人民公社'],
  'cn-reform-1978': ['h4c5-07', 99, '改革開放'],
  'cn-tiananmen-1989': ['h4c5-09', 99, '六四天安門事件'],
  'korea-war-1950': ['h4c6-02', 99, '韓戰'],
}

const questionOverrides = {
  'jh-set1-s031': ['h4c3-06', 99, '題目直接詢問紅軍長征'],
  'jh-set1-s093': ['h3c5-10', 96, '題目描述廣州一口通商下的天朝觀念'],
  'jh-set1-s116': ['h4c3-07', 99, '題目直接詢問西安事變'],
  'jh-set1-s240': ['h3c2-11', 99, '題目答案為大化革新'],
  'jh-set1-s253': ['h3c2-11', 99, '題目答案為大化革新'],
  'jh-set1-g06-q1': ['h3c5-05', 94, '題組以開港後上海租界為背景'],
  'jh-set1-g06-q2': ['h3c5-05', 94, '題組考查開港與租界造成的主權損害'],
  'jh-set1-g06-q3': ['h4c4-04', 99, '題目答案為珍珠港事件'],
  'jh-set2-s018': ['h3c5-09', 92, '題目考查鴉片戰爭至英法聯軍後傳教範圍擴張'],
  'jh-set2-s022': ['h3c6-02', 99, '題目直接詢問義和團事件'],
  'jh-set2-s029': ['h4c5-05', 99, '題目直接詢問文化大革命'],
  'jh-set2-s033': ['h3c2-11', 99, '題目答案為大化革新'],
  'jh-set2-s036': ['h3c2-03', 99, '題目答案為絲路'],
  'jh-set2-s037': ['h4c5-04', 99, '題目答案為大躍進造成的饑荒'],
  'jh-set2-s042': ['h3c6-02', 99, '題目答案為義和團與八國聯軍'],
  'jh-set2-s046': ['h4c3-09', 90, '題目以日本參與近代戰爭判斷國家'],
  'jh-set2-s051': ['h3c3-09', 99, '題目直接考查朱熹與宋代理學'],
  'jh-set2-s055': ['h4c1-06', 99, '題目答案為軍閥割據'],
  'jh-set2-s063': ['h3c3-08', 99, '題目答案為管理海上貿易的市舶司'],
  'jh-set2-s066': ['h3c5-10', 96, '題目考查鴉片戰爭前廣州一口通商'],
  'jh-set2-s071': ['h4c3-02', 99, '題目答案為十年建設時期'],
  'jh-set2-s075': ['h3c1-05', 99, '題目答案為秦代中央集權'],
  'jh-set2-s076': ['h4c3-02', 99, '題目以 1930 年代上海與法幣為線索'],
  'jh-set2-s078': ['h4c4-04', 99, '題目答案為第二次世界大戰'],
  'jh-set2-s083': ['h3c5-10', 99, '題目直接考查廣州一口通商'],
  'jh-set2-s084': ['h4c1-01', 96, '題目考查清末改革失敗與革命契機'],
  'jh-set2-s093': ['h3c1-05', 99, '題目考查西周封建至秦代郡縣的變化'],
  'jh-set2-s113': ['h3c6-02', 99, '題目答案為八國聯軍'],
  'jh-set2-s130': ['h3c6-03', 99, '題目答案為清末立憲運動'],
  'jh-set2-s142': ['h3c2-03', 99, '題目考查絲路貿易'],
  'jh-set2-s144': ['h4c3-02', 99, '題目考查十年建設與法幣政策'],
  'jh-set2-s149': ['h3c6-02', 99, '題目答案為義和團事件'],
  'jh-set2-s151': ['h4c5-04', 99, '題目答案為大躍進'],
  'jh-set2-s155': ['h4c3-08', 99, '題目答案為八年抗戰'],
  'jh-set2-s205': ['h4c4-05', 99, '題目考查日本投降與中華民國接收臺灣'],
  'jh-set2-s229': ['h4c6-02', 99, '題目考查國共內戰與韓戰的先後'],
  'jh-set2-g04-q1': ['h3c6-02', 99, '題組第一題答案為義和團與八國聯軍'],
  'jh-set2-g04-q2': ['h4c1-06', 99, '題組第二題答案為軍閥割據'],
  'jh-set2-g04-q3': ['h4c3-08', 99, '題組第三題答案為盧溝橋事變'],
}

function makeContext() {
  const context = { window: {}, console, Date }
  vm.createContext(context)
  return context
}

async function loadRemoteData() {
  const [eventResponse, examResponse] = await Promise.all([fetch(sourceEventUrl), fetch(sourceDataUrl)])
  if (!eventResponse.ok || !examResponse.ok) {
    throw new Error(`無法讀取 Knowledge Atlas 題庫資料（事件 ${eventResponse.status}、題庫 ${examResponse.status}）。`)
  }
  const context = makeContext()
  vm.runInContext(await eventResponse.text(), context)
  vm.runInContext(await examResponse.text(), context)
  return {
    events: context.window.HISTORY_ATLAS_DATA?.events || [],
    questions: context.window.HISTORY_JUNIOR_EXAM_DATA?.questions || [],
    sourceMeta: context.window.HISTORY_JUNIOR_EXAM_DATA?.meta || {},
  }
}

function absoluteMediaUrl(value) {
  try {
    return new URL(String(value || ''), sourcePageUrl).href
  } catch {
    return ''
  }
}

function normalizeQuestion(question) {
  const candidates = (question.eventIds || [])
    .map((eventId) => ({ eventId, mapping: eventMappings[eventId] }))
    .filter((item) => item.mapping)
    .map((item) => ({
      originalEventId: item.eventId,
      eventCode: item.mapping[0],
      confidence: item.mapping[1],
      note: item.mapping[2],
    }))
  if (candidates.length === 0) return null

  const override = questionOverrides[question.id]
  const selected = override
    ? { originalEventId: '', eventCode: override[0], confidence: override[1], note: override[2] }
    : [...candidates].sort((left, right) => right.confidence - left.confidence)[0]
  const targetCodes = [...new Set(candidates.map((item) => item.eventCode))]
  const hasMultipleTargets = !override && targetCodes.length > 1
  const mappingConfidence = hasMultipleTargets ? Math.min(selected.confidence, 84) : selected.confidence
  const mappingNote = override
    ? `依題幹與答案複核：${override[2]}。`
    : hasMultipleTargets
    ? `原題同時連結 ${candidates.map((item) => item.note).join('、')}；目前以「${selected.note}」為主要事件，發布前建議複核。`
    : `原網站事件「${selected.note}」自動對應。`

  return {
    questionCode: `ka-${question.id}`,
    eventCode: selected.eventCode,
    questionType: 'past',
    prompt: [question.groupStimulus, question.prompt].map((item) => String(item || '').trim()).filter(Boolean).join('\n\n'),
    options: (question.options || []).map((option) => ({
      key: String(option.key || '').trim(),
      text: String(option.text || '').trim(),
    })).filter((option) => option.key && option.text),
    mediaUrls: [...(question.groupMedia || []), ...(question.media || [])].map(absoluteMediaUrl).filter(Boolean),
    tables: [...(question.groupTables || []), ...(question.tables || [])],
    answer: String(question.answer || '').trim(),
    explanation: '',
    sourceName: String(question.source?.exam || question.source?.family || '國中正式考試').trim(),
    sourceYear: question.source?.year ? `${String(question.source.year).trim()} 年` : '',
    sourceUrl: sourcePageUrl,
    originalEventIds: [...new Set(question.eventIds || [])],
    mappingConfidence,
    mappingNote,
    displayOrder: Number(question.sourceOrdinal || 0),
    status: 'draft',
  }
}

function sqlText(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`
}

function sqlJson(value) {
  return `${sqlText(JSON.stringify(value ?? []))}::jsonb`
}

function sqlTextArray(value) {
  const items = Array.isArray(value) ? value : []
  return `array[${items.map(sqlText).join(', ')}]::text[]`
}

function buildSeedMigration(items) {
  const values = items.map((item) => `    (
      ${sqlText(item.questionCode)}, ${sqlText(item.eventCode)}, ${sqlText(item.questionType)},
      ${sqlText(item.prompt)}, ${sqlJson(item.options)}, ${sqlJson(item.mediaUrls)}, ${sqlJson(item.tables)},
      ${sqlText(item.answer)}, ${sqlText(item.explanation)}, ${sqlText(item.sourceName)}, ${sqlText(item.sourceYear)},
      ${sqlText(item.sourceUrl)}, ${sqlTextArray(item.originalEventIds)}, ${Number(item.mappingConfidence || 0)},
      ${sqlText(item.mappingNote)}, ${Number(item.displayOrder || 0)}, 'draft'
    )`).join(',\n')
  const questionCodes = items.map((item) => sqlText(item.questionCode)).join(',\n      ')

  return `-- 由 scripts/generate-history-official-questions.mjs 產生。
-- 僅建立基測與會考正式題目草稿；不包含 Knowledge Atlas 自編解析。

with seed_questions (
  question_code, event_code, question_type, prompt, options, media_urls, question_tables,
  answer, explanation, source_name, source_year, source_url, original_event_ids,
  mapping_confidence, mapping_note, display_order, status
) as (
  values
${values}
)
insert into public.history_questions (
  question_code, event_id, question_type, prompt, options, media_urls, question_tables,
  answer, explanation, source_name, source_year, source_url, original_event_ids,
  mapping_confidence, mapping_note, display_order, status
)
select
  seed.question_code, event.id, seed.question_type, seed.prompt, seed.options, seed.media_urls,
  seed.question_tables, seed.answer, seed.explanation, seed.source_name, seed.source_year,
  seed.source_url, seed.original_event_ids, seed.mapping_confidence, seed.mapping_note,
  seed.display_order, seed.status
from seed_questions seed
join public.history_events event on event.event_code = seed.event_code
on conflict (question_code) do nothing;

do $$
declare
  seeded_count integer;
begin
  select count(*) into seeded_count
  from public.history_questions
  where question_code in (
      ${questionCodes}
  );

  if seeded_count <> ${items.length} then
    raise exception '歷史正式題庫應有 ${items.length} 題，實際只有 % 題。請檢查事件對應。', seeded_count;
  end if;
end
$$;
`
}

const { events, questions, sourceMeta } = await loadRemoteData()
const officialQuestions = questions.filter((question) => ['基測', '會考'].includes(question.source?.family))
const normalized = officialQuestions.map(normalizeQuestion).filter(Boolean)
const eventIds = new Set(events.map((event) => event.id))
const unknownMappingIds = [...new Set(officialQuestions.flatMap((question) => question.eventIds || []))]
  .filter((eventId) => eventIds.has(eventId) && !eventMappings[eventId])

if (normalized.length < 140) {
  throw new Error(`八年級正式試題只整理出 ${normalized.length} 題，低於安全門檻 140 題，請檢查來源資料是否改版。`)
}

const snapshot = {
  meta: {
    generatedAt: new Date().toISOString(),
    sourcePageUrl,
    sourceDataUrl,
    sourceBuild: sourceMeta.build || '',
    sourceQuestionCount: sourceMeta.questionCount || questions.length,
    officialQuestionCount: officialQuestions.length,
    grade8QuestionCount: normalized.length,
    highConfidenceCount: normalized.filter((item) => item.mappingConfidence >= 90).length,
    reviewCount: normalized.filter((item) => item.mappingConfidence < 90).length,
    copiedExplanation: false,
    note: '僅整理基測與會考正式試題；未複製 Knowledge Atlas 自行撰寫的解析。所有題目匯入後均為草稿。',
    unknownMappingIds,
  },
  questions: normalized,
}

const currentFile = fileURLToPath(import.meta.url)
const outputPath = path.resolve(path.dirname(currentFile), '../src/data/historyOfficialQuestions.json')
const migrationPath = path.resolve(path.dirname(currentFile), '../supabase/migrations/20260809131000_seed_history_official_questions.sql')
await fs.writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8')
await fs.writeFile(migrationPath, buildSeedMigration(normalized), 'utf8')

console.log(JSON.stringify({
  outputPath,
  migrationPath,
  questions: normalized.length,
  highConfidence: snapshot.meta.highConfidenceCount,
  review: snapshot.meta.reviewCount,
  withMedia: normalized.filter((item) => item.mediaUrls.length > 0).length,
  withTables: normalized.filter((item) => item.tables.length > 0).length,
}, null, 2))
