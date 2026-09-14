import { CircleX, Handshake, Magnet, Megaphone, ShieldCheck } from 'lucide-react'
import './animalEquationFunctionIcon.css'

const icons = {
  tame: Handshake,
  accuse: Megaphone,
  clarify: ShieldCheck,
  tempt: Magnet,
  gender_error: CircleX,
}

export default function AnimalEquationFunctionIcon({ code, className = '' }) {
  const Icon = icons[code]
  if (!Icon) return null
  return <span className={`animal-function-symbol ${className}`.trim()} data-code={code} aria-hidden="true">
    <Icon strokeWidth={2.25} />
  </span>
}
