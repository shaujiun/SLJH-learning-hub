import { useEffect, useState } from 'react'
import { loadStudentReadingQuestions, submitStudentReadingAnswer } from '../services/englishReadingQuestionService.js'

export function QuestionCard({ question, group, evidenceText }) {
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
    try { setResult(await submitStudentReadingAnswer(question.id, answers, evidenceText)) }
    catch (submissionError) { setError(submissionError.message) }
    finally { setBusy(false) }
  }

  return <form className="reading-question-card" onSubmit={submit}>
    <h4>{question.position}. {question.prompt}</h4>
    {hint && <details><summary>查看提示</summary><p>{hint}</p></details>}
    {question.kind === 'choice' ? <fieldset><legend>請選一個答案</legend>{question.options.map((option, index) => {
      const letter = 'ABCD'[index]
      return <label key={letter}><input type="radio" name={`reading-${question.id}`} value={letter} checked={answers[0] === letter} onChange={() => updateAnswer(0, letter)} />{letter}. {option}</label>
    })}</fieldset> : <div className="reading-cloze-inputs">{answers.map((answer, index) => <label key={index}>第 {index + 1} 格<input value={answer} onChange={(event) => updateAnswer(index, event.target.value)} autoComplete="off" /></label>)}</div>}
    <p className="reading-evidence">{evidenceText ? `目前標記的原文依據：${evidenceText}` : '可先點選文章中的一句英文作為答題依據。'}</p>
    <button type="submit" className="reading-action" disabled={busy}>{busy ? '判分中……' : '送出答案'}</button>
    {error && <p role="alert" className="reading-warning">{error}</p>}
    {result && <div role="status" className={result.correct ? 'reading-feedback is-correct' : 'reading-feedback'}>
      <strong>{result.correct ? '答對了' : '再對照文章看看'}</strong>
      <p>參考答案：{result.expected?.join('、')}</p>
      {result.explanation && <p>解析：{result.explanation}</p>}
      {result.evidenceSentence && <p>原文依據：{result.evidenceSentence}</p>}
    </div>}
  </form>
}

export default function EnglishReadingQuestionSet({ lessonId, group, evidenceText, fallback }) {
  const [state, setState] = useState({ loading: true, questions: [], error: '' })
  useEffect(() => {
    let active = true
    setState({ loading: true, questions: [], error: '' })
    loadStudentReadingQuestions(lessonId).then((questions) => {
      if (active) setState({ loading: false, questions, error: '' })
    }).catch((error) => { if (active) setState({ loading: false, questions: [], error: error.message }) })
    return () => { active = false }
  }, [lessonId])

  if (state.loading) return <p>正在載入題目……</p>
  if (state.error) return <p role="alert" className="reading-warning">{state.error}</p>
  if (!state.questions.length) return <p className="reading-warning">{fallback ? '老師尚未將紙本練習轉成可作答題目，請稍後再試。' : '目前沒有練習題。'}</p>
  return <div className="reading-question-set">{state.questions.map((question) => <QuestionCard key={question.id} question={question} group={group} evidenceText={evidenceText} />)}</div>
}
