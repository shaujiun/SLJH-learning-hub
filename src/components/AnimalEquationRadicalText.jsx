import './animalEquationRadicalText.css'

const radicalPart = /^([1-9]\d*|n)?√([1-9]\d*)$/
const radicalParts = /((?:[1-9]\d*|n)?√[1-9]\d*)/g

export default function AnimalEquationRadicalText({ text }) {
  return <>{String(text ?? '').split(radicalParts).map((part, index) => {
    const match = radicalPart.exec(part)
    if (!match) return part
    const [, coefficient, radicand] = match
    return <math className="animal-radical-math" key={`${index}-${part}`}
      aria-label={coefficient ? `${coefficient} 乘根號 ${radicand}` : `根號 ${radicand}`}>
      <mrow>{coefficient && (coefficient === 'n' ? <mi>n</mi> : <mn>{coefficient}</mn>)}<msqrt><mn>{radicand}</mn></msqrt></mrow>
    </math>
  })}</>
}
