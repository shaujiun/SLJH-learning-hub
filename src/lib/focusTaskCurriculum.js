export const firstSemesterFirstExamEndsOn = '2026-09-18'

const geographyFirstStageChapters = [
  'grade8-upper-l01',
  'grade8-upper-l02',
]

const geographySecondStageChapters = [
  ...geographyFirstStageChapters,
  'grade8-upper-l03',
  'grade8-upper-l04',
]

const geographyGrade7ReviewChapters = [
  'grade7-upper-l01',
  'grade7-upper-l02',
  'grade7-upper-l03',
  'grade7-upper-l04',
  'grade7-upper-l05',
  'grade7-upper-l06',
]

const englishFirstStageLessons = ['L1', 'L2']
const englishSecondStageLessons = [...englishFirstStageLessons, 'L3', 'L4']

function isAfterFirstExam(assignedDate) {
  return String(assignedDate || '') > firstSemesterFirstExamEndsOn
}

export function isGeographyGrade7ReviewTask(task = {}) {
  const taskId = String(task.id || '').replace(/-/g, '')
  if (taskId.length < 2) return false
  const sample = Number.parseInt(taskId.slice(-2), 16)
  return Number.isFinite(sample) && sample % 5 === 0
}

export function getFocusTaskCurriculumScope(task = {}) {
  const subjectCode = String(task.subjectCode || task.subject_code_snapshot || '').toLowerCase()
  const secondStage = isAfterFirstExam(task.assignedDate || task.assigned_date)

  if (subjectCode === 'geography') {
    if (isGeographyGrade7ReviewTask(task)) {
      return {
        subjectCode,
        areaId: 'taiwan',
        chapterIds: [...geographyGrade7ReviewChapters],
        label: '七上地理複習',
      }
    }
    const chapterIds = secondStage
      ? geographySecondStageChapters
      : geographyFirstStageChapters
    return {
      subjectCode,
      areaId: 'china',
      chapterIds: [...chapterIds],
      label: secondStage ? '八上第 1～4 章' : '八上第 1～2 章',
    }
  }

  if (subjectCode === 'english') {
    const lessonIds = secondStage
      ? englishSecondStageLessons
      : englishFirstStageLessons
    return {
      subjectCode,
      book: 'B3',
      lessonIds: [...lessonIds],
      label: secondStage ? 'B3 第 1～4 課' : 'B3 第 1～2 課',
    }
  }

  return null
}

export function geographyTaskAllowsSelection(task, areaId, chapterId) {
  const scope = getFocusTaskCurriculumScope({
    ...task,
    subjectCode: 'geography',
  })
  return scope?.areaId === areaId && scope.chapterIds.includes(chapterId)
}

export function appendFocusTaskCurriculumScope(url, task) {
  const scope = getFocusTaskCurriculumScope(task)
  if (!scope) return url

  if (scope.areaId) url.searchParams.set('focusArea', scope.areaId)
  if (scope.chapterIds) url.searchParams.set('focusChapters', scope.chapterIds.join(','))
  if (scope.book) url.searchParams.set('focusBook', scope.book)
  if (scope.lessonIds) url.searchParams.set('focusLessons', scope.lessonIds.join(','))
  url.searchParams.set('focusScopeLabel', scope.label)
  return url
}
