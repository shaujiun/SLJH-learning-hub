export const learningAudienceOptions = [
  { value: 'common', label: '共同（所有學生）' },
  { value: 'math_a', label: '數學 A 組' },
  { value: 'math_b', label: '數學 B 組' },
  { value: 'english_a', label: '英語 A 組' },
  { value: 'english_b', label: '英語 B 組' },
]

const learningAudienceLabels = Object.fromEntries(
  learningAudienceOptions.map((option) => [option.value, option.label]),
)

export function isValidLearningAudience(value) {
  return Object.hasOwn(learningAudienceLabels, value)
}

export function normalizeLearningAudience(value) {
  return isValidLearningAudience(value) ? value : 'common'
}

export function getLearningAudienceLabel(value) {
  return learningAudienceLabels[normalizeLearningAudience(value)]
}

export function isLearningSystemVisible(system, groupBySubject = {}) {
  const audienceScope = normalizeLearningAudience(system.audienceScope)
  if (audienceScope === 'common') return true

  const [subjectCode, requiredGroup] = audienceScope.split('_')
  return String(groupBySubject[subjectCode] || '').toUpperCase() === requiredGroup.toUpperCase()
}
