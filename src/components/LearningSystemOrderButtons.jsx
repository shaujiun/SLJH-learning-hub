import { ChevronDown, ChevronUp } from 'lucide-react'

export default function LearningSystemOrderButtons({ subjectName, index, total, saving, onMove }) {
  return (
    <div className="manager-order-buttons">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0 || saving}
        aria-label={`將${subjectName}往前移`}
      >
        <ChevronUp aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === total - 1 || saving}
        aria-label={`將${subjectName}往後移`}
      >
        <ChevronDown aria-hidden="true" />
      </button>
    </div>
  )
}
