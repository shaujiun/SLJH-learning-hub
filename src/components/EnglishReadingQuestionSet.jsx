import { useEffect, useMemo, useState } from 'react'
import {
  gradeAdminReadingAnswer, loadAdminReadingQuestions, loadStudentReadingQuestions,
  submitStudentReadingAnswer,
} from '../services/englishReadingQuestionService.js'
import { trackLearningActivityAttempt } from '../services/learningProgressService.js'

export function QuestionCard({ question, group, evidenceText, onRequestEvidence, onResult, adminPreview = false }) {
  const [answers, setAnswers] = useState(() => Array(question.blankCount).fill(''))
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const hint = group === 'A' ? question.hintA : question.hintB

  function updateAnswer(index, value) {
    setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? value : answer))
    setResult(null)
  }

  async function submit(event) {
    event.preventDefault()
    if (answers.some((answer) => !answer.trim())) { setError('請先填完或選擇答案。'); return }
    setBusy(true)
    setError('')
    try {
      const nextResult = adminPreview
        ? gradeAdminReadingAnswer(question, answers)
        : await submitStudentReadingAnswer(question.id, answers, evidenceText)
      setResult(nextResult)
      onResult?.(question.id, nextResult)
    }
    catch (submissionError) { setError(submissionError.message) }
    finally { setBusy(false) }
  }

  return <form className="reading-question-card" onSubmit={submit}>
    <h4>{question.position}. {question.prompt}</h4>
    {hint && <details><summary>查看提示</summary><p className="reading-raw-text">{hint}</p></details>}
    {question.kind === 'choice' ? <fieldset><legend>請選一個答案</legend>{question.options.map((option, index) => {
      const letter = 'ABCD'[index]
      return <label key={letter}><input type="radio" name={`reading-${question.id}`} value={letter} checked={answers[0] === letter} onChange={() => updateAnswer(0, letter)} />{letter}. {option}</label>
    })}</fieldset> : <div className="reading-cloze-inputs">{answers.map((answer, index) => <label key={index}>第 {index + 1} 格<input value={answer} onChange={(event) => updateAnswer(index, event.target.value)} autoComplete="off" /></label>)}</div>}
    {question.kind === 'choice' && <div className="reading-question-evidence"><p>{evidenceText ? `本題選擇的原文依據：${evidenceText}` : '本題尚未選擇原文依據。'}</p>{onRequestEvidence && <button type="button" onClick={() => onRequestEvidence(question.id)}>{evidenceText ? '更換本題原文' : '選擇本題原文'}</button>}</div>}
    <button type="submit" className="reading-action" disabled={busy}>{busy ? '判分中……' : adminPreview ? '檢查答案（不記錄）' : '送出答案'}</button>
    {error && <p role="alert" className="reading-warning">{error}</p>}
    {result && <div role="status" className={result.correct ? 'reading-feedback is-correct' : 'reading-feedback'}>
      <strong>{result.correct ? '答對了' : '再對照文章看看'}</strong>
      <p>參考答案：{result.expected?.join('、')}</p>
      {result.explanation && <p><strong>{question.kind === 'choice' ? 'AI 解題思路：' : '解題思路：'}</strong>{result.explanation}</p>}
      {result.evidenceSentence && <p>原文依據：{result.evidenceSentence}</p>}
    </div>}
  </form>
}

export default function EnglishReadingQuestionSet({ lessonId, group, evidenceByQuestion = {}, onEvidenceQuestionsChange, onRequestEvidence, fallback, viewerRole = 'student' }) {
  const [state, setState] = useState({ loading: true, questions: [], error: '' })
  const [answerResults, setAnswerResults] = useState({})
  const [completionRecorded, setCompletionRecorded] = useState(false)
  useEffect(() => {
    let active = true
    setState({ loading: true, questions: [], error: '' })
    setAnswerResults({})
    setCompletionRecorded(false)
    const loader = viewerRole === 'admin' ? loadAdminReadingQuestions : loadStudentReadingQuestions
    loader(lessonId).then((questions) => {
      if (active) setState({ loading: false, questions, error: '' })
    }).catch((error) => { if (active) setState({ loading: false, questions: [], error: error.message }) })
    return () => { active = false }
  }, [lessonId, viewerRole])

  const questions = useMemo(() => viewerRole === 'admin'
    ? state.questions.filter((question) => question.groupScope === 'all' || question.groupScope === group)
    : state.questions, [group, state.questions, viewerRole])
  useEffect(() => {
    onEvidenceQuestionsChange?.(questions
      .filter((question) => question.kind === 'choice')
      .map(({ id, position, prompt }) => ({ id, position, prompt })))
  }, [onEvidenceQuestionsChange, questions])

  useEffect(() => {
    if (viewerRole !== 'student' || completionRecorded || !questions.length) return
    if (!questions.every((question) => answerResults[question.id])) return
    const correctCount = questions.filter((question) => answerResults[question.id]?.correct).length
    setCompletionRecorded(true)
    trackLearningActivityAttempt({
      subjectCode: 'english', activityCode: 'english_reading', activityName: '英語閱讀練習',
      modeCode: `lesson_${lessonId}`, score: Math.round((correctCount / questions.length) * 100),
      correctCount, questionCount: questions.length, metadata: { group },
    })
  }, [answerResults, completionRecorded, group, lessonId, questions, viewerRole])

  if (state.loading) return <p>正在載入題目……</p>
  if (state.error) return <p role="alert" className="reading-warning">{state.error}</p>
  if (!state.questions.length) return <p className="reading-warning">{fallback ? '老師尚未將紙本練習轉成可作答題目，請稍後再試。' : '目前沒有練習題。'}</p>
  return <div className="reading-question-set">{questions.map((question) => <QuestionCard key={question.id} question={question} group={group} evidenceText={evidenceByQuestion[question.id] || ''} onRequestEvidence={question.kind === 'choice' ? onRequestEvidence : undefined} onResult={(questionId, result) => setAnswerResults((current) => ({ ...current, [questionId]: result }))} adminPreview={viewerRole === 'admin'} />)}</div>
}
