import { requireSupabase } from '../lib/supabase.js'
import {
  getLearningAudienceLabel,
  isValidLearningAudience,
  normalizeLearningAudience,
} from '../lib/learningAudiences.js'

const systemSelect = `
  id,
  subject_code,
  subject_name,
  description,
  launch_url,
  display_order,
  weekly_minimum,
  weekly_maximum,
  audience_scope,
  is_active,
  learning_activities(id,activity_code,activity_name,is_active)
`

function integerBetween(value, minimum, maximum, fieldName) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${fieldName}必須介於 ${minimum}～${maximum}。`)
  }
  return parsed
}

function validateLaunchUrl(value) {
  const launchUrl = String(value || '').trim()
  let parsed
  try {
    parsed = new URL(launchUrl)
  } catch {
    throw new Error('請輸入完整的學習系統網址。')
  }
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error('學習系統網址只能使用 HTTP 或 HTTPS。')
  }
  return parsed.toString()
}

export function normalizeLearningSystemInput(input = {}) {
  const subjectCode = String(input.subjectCode || '').trim().toLowerCase()
  const subjectName = String(input.subjectName || '').trim()
  const description = String(input.description || '').trim()
  const audienceScope = String(input.audienceScope || 'common').trim().toLowerCase()

  if (!/^[a-z0-9][a-z0-9_-]{1,31}$/.test(subjectCode)) {
    throw new Error('科目代碼須為 2～32 個小寫英文字母、數字、底線或連字號。')
  }
  if (!subjectName) throw new Error('請輸入科目名稱。')
  if (subjectName.length > 30) throw new Error('科目名稱不可超過 30 個字。')
  if (description.length > 180) throw new Error('科目說明不可超過 180 個字。')
  if (!isValidLearningAudience(audienceScope)) throw new Error('請選擇正確的顯示對象。')

  const weeklyMinimum = integerBetween(input.weeklyMinimum, 1, 3, '每週最少次數')
  const weeklyMaximum = integerBetween(input.weeklyMaximum, 1, 3, '每週最多次數')
  if (weeklyMaximum < weeklyMinimum) {
    throw new Error('每週最多次數不可少於每週最少次數。')
  }

  return {
    subject_code: subjectCode,
    subject_name: subjectName,
    description,
    launch_url: validateLaunchUrl(input.launchUrl),
    display_order: integerBetween(input.displayOrder ?? 0, 0, 9999, '顯示順序'),
    weekly_minimum: weeklyMinimum,
    weekly_maximum: weeklyMaximum,
    audience_scope: audienceScope,
    is_active: input.isActive !== false,
    updated_at: new Date().toISOString(),
  }
}

function mapAdminSystem(row) {
  return {
    id: row.id,
    subjectCode: row.subject_code,
    subjectName: row.subject_name,
    description: row.description || '',
    launchUrl: row.launch_url,
    displayOrder: row.display_order,
    weeklyMinimum: row.weekly_minimum,
    weeklyMaximum: row.weekly_maximum,
    audienceScope: normalizeLearningAudience(row.audience_scope),
    audienceLabel: getLearningAudienceLabel(row.audience_scope),
    isActive: row.is_active,
    activities: (row.learning_activities || []).map((activity) => ({
      id: activity.id,
      code: activity.activity_code,
      name: activity.activity_name,
      isActive: activity.is_active,
    })),
  }
}

export async function loadAdminLearningSystems(client = requireSupabase()) {
  const { data, error } = await client
    .from('learning_systems')
    .select(systemSelect)
    .order('display_order')
    .order('subject_name')

  if (error) throw new Error(`無法讀取學習系統設定：${error.message}`)
  return (data || []).map(mapAdminSystem)
}

export async function saveLearningSystem(input, client = requireSupabase()) {
  const payload = normalizeLearningSystemInput(input)
  const query = input.id
    ? client.from('learning_systems').update(payload).eq('id', input.id)
    : client.from('learning_systems').insert(payload)
  const { data, error } = await query.select(systemSelect).single()

  if (error) {
    const duplicate = error.code === '23505'
    throw new Error(duplicate ? '這個科目代碼已經存在。' : `無法儲存學習系統：${error.message}`)
  }
  return mapAdminSystem(data)
}

export async function setLearningSystemActive(id, isActive, client = requireSupabase()) {
  const { error } = await client
    .from('learning_systems')
    .update({ is_active: Boolean(isActive), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`無法更新顯示狀態：${error.message}`)
}

export async function reorderLearningSystems(orderedIds, client = requireSupabase()) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) return
  const updatedAt = new Date().toISOString()
  const results = await Promise.all(orderedIds.map((id, index) => (
    client
      .from('learning_systems')
      .update({ display_order: (index + 1) * 10, updated_at: updatedAt })
      .eq('id', id)
  )))
  const failed = results.find((result) => result.error)
  if (failed?.error) throw new Error(`無法儲存排序：${failed.error.message}`)
}
