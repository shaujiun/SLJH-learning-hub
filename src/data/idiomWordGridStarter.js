import { buildIdiomPuzzle } from '../lib/idiomWordGrid.js'
import officialEntries from './idiomWordGridOfficialEntries.json'

export const IDIOM_DICTIONARY_VERSION = 'dict_idioms_2020_20260929'
export const IDIOM_DICTIONARY_ATTRIBUTION = '中華民國教育部（Ministry of Education, R.O.C.）。《成語典》2020。'

export const STARTER_IDIOM_ENTRIES = officialEntries

const STARTER_GROUPS = [
  { id: 'starter-beginner', title: '同心協力', difficulty: 'beginner', phrases: ['一心一意', '心平氣和', '和氣生財', '生財有道'] },
  { id: 'starter-basic', title: '明辨與成長', difficulty: 'basic', phrases: ['自相矛盾', '相得益彰', '益壽延年', '年富力強', '強詞奪理'] },
  { id: 'starter-advanced', title: '功成與開展', difficulty: 'advanced', phrases: ['事半功倍', '功成名就', '名列前茅', '茅塞頓開', '開門見山', '山明水秀'] },
  { id: 'starter-challenge', title: '學以致用', difficulty: 'challenge', phrases: ['學以致用', '用武之地', '地久天長', '長驅直入', '入木三分', '分秒必爭', '爭先恐後', '後生可畏', '畏首畏尾'] },
]

export function getStarterIdiomPuzzles() {
  return STARTER_GROUPS.map((group, index) => ({
    id: group.id,
    title: group.title,
    publishedOn: `2026-10-${String(31 - index).padStart(2, '0')}`,
    status: 'published',
    sourceVersion: IDIOM_DICTIONARY_VERSION,
    illustrationUrl: '',
    isDailyEligible: true,
    ...buildIdiomPuzzle(
      group.phrases.map((phrase) => STARTER_IDIOM_ENTRIES.find((entry) => entry.phrase === phrase)),
      group.difficulty,
    ),
  }))
}
