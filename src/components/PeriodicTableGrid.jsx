import { RotateCw, TabletSmartphone } from 'lucide-react'
import { periodicElements } from '../lib/periodicTable.js'

export default function PeriodicTableGrid({ allowedNumbers, targetNumber, selectedNumber, answered, onSelect }) {
  const allowed = new Set(allowedNumbers)
  const mainElements = periodicElements.filter((element) => !element.series)
  const lanthanides = periodicElements.filter((element) => element.series === 'lanthanide')
  const actinides = periodicElements.filter((element) => element.series === 'actinide')

  const cellClass = (element) => {
    const states = [`periodic-element`, `block-${element.block}`]
    if (!allowed.has(element.number)) states.push('element-locked')
    if (answered && element.number === targetNumber) states.push('element-correct')
    if (answered && element.number === selectedNumber && selectedNumber !== targetNumber) states.push('element-wrong')
    return states.join(' ')
  }

  const renderElement = (element, style) => (
    <button
      className={cellClass(element)}
      style={style}
      type="button"
      disabled={!allowed.has(element.number) || answered}
      onClick={() => onSelect(element.number)}
      aria-label={`原子序 ${element.number}，元素符號 ${element.symbol}`}
      key={element.number}
    >
      <small>{element.number}</small>
      <strong>{element.symbol}</strong>
    </button>
  )

  return (
    <>
      <div className="periodic-orientation-hint" role="status" aria-live="polite">
        <TabletSmartphone aria-hidden="true" />
        <div>
          <strong>請將手機或平板轉成橫向</strong>
          <span>橫向畫面可以看清楚完整週期表，也比較不容易按錯。</span>
        </div>
        <RotateCw aria-hidden="true" />
      </div>
      <div className="periodic-table-scroll" aria-label="元素週期表作答區">
        <div className="periodic-table-grid" role="grid">
          <span className="table-corner" style={{ gridColumn: 1, gridRow: 1 }}>族</span>
          {Array.from({ length: 18 }, (_, index) => <span className="group-label" style={{ gridColumn: index + 2, gridRow: 1 }} key={`group-${index + 1}`}>{index + 1}</span>)}
          {Array.from({ length: 7 }, (_, index) => <span className="period-label" style={{ gridColumn: 1, gridRow: index + 2 }} key={`period-${index + 1}`}>{index + 1}</span>)}
          {mainElements.map((element) => renderElement(element, { gridColumn: element.group + 1, gridRow: element.period + 1 }))}
          <span className="series-placeholder" style={{ gridColumn: 4, gridRow: 7 }}>57–71</span>
          <span className="series-placeholder" style={{ gridColumn: 4, gridRow: 8 }}>89–103</span>
          <span className="series-label" style={{ gridColumn: '1 / span 3', gridRow: 9 }}>鑭系</span>
          <span className="series-label" style={{ gridColumn: '1 / span 3', gridRow: 10 }}>錒系</span>
          {lanthanides.map((element, index) => renderElement(element, { gridColumn: index + 4, gridRow: 9 }))}
          {actinides.map((element, index) => renderElement(element, { gridColumn: index + 4, gridRow: 10 }))}
        </div>
      </div>
    </>
  )
}

