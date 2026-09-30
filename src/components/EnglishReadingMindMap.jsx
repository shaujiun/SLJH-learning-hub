import { Lightbulb, Orbit, RadioTower, Sparkles } from 'lucide-react'
import { parseReadingMindMap, serializeReadingMindMap } from '../lib/englishReadingDraft.js'

const branchIcons = [Sparkles, Orbit, RadioTower, Lightbulb]

export function EnglishReadingMindMap({ value, title }) {
  const mindMap = parseReadingMindMap(value, title)
  const branches = mindMap.branches.filter((branch) => branch.title || branch.keywords.length)
  if (!mindMap.center && !branches.some((branch) => branch.keywords.length)) return null
  return <section className="reading-mind-map" aria-label="文章心智圖">
    <div className="reading-mind-map-center"><small>ARTICLE MAP</small><strong>{mindMap.center || title || '文章主題'}</strong></div>
    <div className="reading-mind-map-branches">{branches.map((branch, index) => {
      const Icon = branchIcons[index % branchIcons.length]
      return <article className={`reading-mind-map-branch branch-${index % 4}`} key={`${branch.title}-${index}`}>
        <span className="reading-mind-map-icon"><Icon aria-hidden="true" /></span>
        <h4>{branch.title || `重點 ${index + 1}`}</h4>
        <div>{branch.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
      </article>
    })}</div>
  </section>
}

export function EnglishReadingMindMapEditor({ value, title, onChange }) {
  const mindMap = parseReadingMindMap(value, title)

  function updateCenter(center) { onChange(serializeReadingMindMap({ ...mindMap, center })) }
  function updateBranch(index, key, nextValue) {
    const branches = mindMap.branches.map((branch, branchIndex) => branchIndex === index
      ? { ...branch, [key]: key === 'keywords' ? nextValue.split(/[、,，]/).map((item) => item.trim()).filter(Boolean) : nextValue }
      : branch)
    onChange(serializeReadingMindMap({ ...mindMap, branches }))
  }

  return <section className="reading-mind-map-editor">
    <h3>心智圖內容</h3>
    <p>系統會把下列內容排成視覺心智圖；您只需要修改文字，不必編輯程式碼。</p>
    <label>中心主題<input value={mindMap.center} onChange={(event) => updateCenter(event.target.value)} placeholder={title || '文章核心主題'} /></label>
    <div className="reading-mind-map-editor-grid">{mindMap.branches.map((branch, index) => <fieldset key={index}>
      <legend>分支 {index + 1}</legend>
      <label>分支名稱<input value={branch.title} onChange={(event) => updateBranch(index, 'title', event.target.value)} /></label>
      <label>關鍵字（以頓號分隔）<input value={branch.keywords.join('、')} onChange={(event) => updateBranch(index, 'keywords', event.target.value)} /></label>
    </fieldset>)}</div>
  </section>
}
