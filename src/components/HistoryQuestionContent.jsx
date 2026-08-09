import { historyQuestionAnswerLabel } from '../lib/historyAtlas.js'

function QuestionTable({ table, index }) {
  if (!Array.isArray(table) || table.length === 0) return null
  return (
    <div className="history-question-table-wrap">
      <table aria-label={`題目附表 ${index + 1}`}>
        <tbody>
          {table.map((row, rowIndex) => (
            <tr key={`${index}-${rowIndex}`}>
              {(Array.isArray(row) ? row : []).map((cell, cellIndex) => (
                <td key={`${index}-${rowIndex}-${cellIndex}`}>{typeof cell === 'object' ? cell?.text : String(cell || '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function HistoryQuestionContent({ question, showAnswer = false }) {
  const options = Array.isArray(question?.options) ? question.options : []
  const mediaUrls = Array.isArray(question?.mediaUrls) ? question.mediaUrls : []
  const tables = Array.isArray(question?.tables) ? question.tables : []
  return (
    <>
      <p className="history-question-prompt">{question?.prompt}</p>
      {mediaUrls.length > 0 && (
        <div className="history-question-media">
          {mediaUrls.map((url, index) => <img src={url} alt={`題目附圖 ${index + 1}`} loading="lazy" key={url} />)}
        </div>
      )}
      {tables.map((table, index) => <QuestionTable table={table} index={index} key={`table-${index}`} />)}
      {options.length > 0 && (
        <ol className="history-question-options">
          {options.map((option) => <li key={option.key}><b>{option.key}</b><span>{option.text}</span></li>)}
        </ol>
      )}
      {showAnswer && <strong className="history-question-answer">{historyQuestionAnswerLabel(question)}</strong>}
    </>
  )
}

export function HistoryQuestionAnswer({ question }) {
  return <strong className="history-question-answer">{historyQuestionAnswerLabel(question)}</strong>
}
