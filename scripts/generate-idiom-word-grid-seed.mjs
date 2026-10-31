import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { buildIdiomPuzzle } from '../src/lib/idiomWordGrid.js'

const entriesUrl = new URL('../src/data/idiomWordGridOfficialEntries.json', import.meta.url)
const officialEntries = JSON.parse(await readFile(entriesUrl, 'utf8'))

const puzzleGroups = [
  { title: '同心協力', publishedOn: '2026-10-31', difficulty: 'beginner', phrases: ['一心一意', '心平氣和', '和氣生財', '生財有道'] },
  { title: '明辨與成長', publishedOn: '2026-10-30', difficulty: 'basic', phrases: ['自相矛盾', '相得益彰', '益壽延年', '年富力強', '強詞奪理'] },
  { title: '功成與開展', publishedOn: '2026-10-29', difficulty: 'advanced', phrases: ['事半功倍', '功成名就', '名列前茅', '茅塞頓開', '開門見山', '山明水秀'] },
  { title: '學以致用', publishedOn: '2026-10-28', difficulty: 'challenge', phrases: ['學以致用', '用武之地', '地久天長', '長驅直入', '入木三分', '分秒必爭', '爭先恐後', '後生可畏', '畏首畏尾'] },
]

function sqlText(value) {
  return `'${String(value ?? '').replaceAll("'", "''")}'`
}

function jsonb(value) {
  return `${sqlText(JSON.stringify(value))}::jsonb`
}

const lines = [
  '-- 由 scripts/generate-idiom-word-grid-seed.mjs 產生。',
  '-- 教育部《成語典》資料保留原文，不自行改寫；網站連結供查證。',
  '',
  'begin;',
  '',
]

for (const entry of officialEntries) {
  lines.push(
    'insert into public.idiom_entries (phrase, definition, source_text, story, source_url, illustration_url, stage, license_version)',
    `values (${sqlText(entry.phrase)}, ${sqlText(entry.definition)}, ${sqlText(entry.source)}, ${sqlText(entry.story)}, ${sqlText(entry.sourceUrl)}, ${sqlText(entry.illustrationUrl)}, ${sqlText(entry.stage)}, ${sqlText(entry.licenseVersion)})`,
    'on conflict (phrase) do update set',
    '  definition = excluded.definition, source_text = excluded.source_text, story = excluded.story,',
    '  source_url = excluded.source_url, stage = excluded.stage, license_version = excluded.license_version,',
    '  is_active = true, updated_at = now();',
    '',
  )
}

for (const group of puzzleGroups) {
  const built = buildIdiomPuzzle(
    group.phrases.map((phrase) => officialEntries.find((entry) => entry.phrase === phrase)),
    group.difficulty,
  )
  const puzzle = { ...group, ...built, sourceVersion: 'dict_idioms_2020_20260929' }
  const data = {
    board: puzzle.board,
    idioms: puzzle.idioms,
    givenCellKeys: puzzle.givenCellKeys,
  }
  lines.push(
    'insert into public.idiom_word_grid_puzzles (title, published_on, difficulty, puzzle_data, source_version, illustration_url, is_daily_eligible, status)',
    `values (${sqlText(puzzle.title)}, ${sqlText(puzzle.publishedOn)}::date, ${sqlText(puzzle.difficulty)}, ${jsonb(data)}, ${sqlText(puzzle.sourceVersion)}, '', true, 'published')`,
    'on conflict (title, published_on) do update set',
    '  difficulty = excluded.difficulty, puzzle_data = excluded.puzzle_data, source_version = excluded.source_version,',
    "  is_daily_eligible = true, status = 'published', updated_at = now();",
    '',
  )
}

lines.push('commit;', '')

const outputUrl = new URL('../supabase/migrations/20261031151000_seed_idiom_word_grid.sql', import.meta.url)
await writeFile(fileURLToPath(outputUrl), lines.join('\n'), 'utf8')
process.stdout.write(`完成：${fileURLToPath(outputUrl)}\n`)
