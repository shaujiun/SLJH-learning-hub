import { useMemo, useState } from 'react'
import { saveYiziQuestion } from '../services/yiziQianjinService.js'
import { YIZI_DIFFICULTIES, YIZI_GAME_LABELS } from '../lib/yiziQianjin.js'

const gameTypes = ['four_sayings', 'remove_part', 'component_pairs']

function blankQuestion(gameType = 'four_sayings') {
  const prompt = gameType === 'four_sayings'
    ? { idioms: ['', '', '', ''], targetIndices: [0, 0, 0, 0] }
    : gameType === 'remove_part'
      ? { parts: ['', '', '', ''], removedPart: '' }
      : { title: '', parts: Array(16).fill('') }
  return {
    id: '', stableKey: '', gameType, difficulty: 1, prompt,
    answers: { accepted: [], extra: [] }, status: 'draft',
    sourceLabel: '教師自建題目', sourceUrl: '', sourceCommit: '',
  }
}

function cloneQuestion(question) {
  return JSON.parse(JSON.stringify(question || blankQuestion()))
}

function answerLines(value) {
  return String(value || '').split(/[\n,，、；;]+/).map((item) => item.trim()).filter(Boolean)
}

function AnswerFields({ form, update }) {
  return <div className="yizi-editor-answer-grid">
    <label>主要答案（每行一個）
      <textarea rows="5" value={(form.answers?.accepted || []).join('\n')}
        onChange={(event) => update({ answers: { ...form.answers, accepted: answerLines(event.target.value) } })} />
    </label>
    <label>其他可接受答案（選填）
      <textarea rows="5" value={(form.answers?.extra || []).join('\n')}
        onChange={(event) => update({ answers: { ...form.answers, extra: answerLines(event.target.value) } })} />
    </label>
  </div>
}

function FourSayingsFields({ form, update }) {
  const idioms = form.prompt?.idioms || ['', '', '', '']
  const targetIndices = form.prompt?.targetIndices || [0, 0, 0, 0]
  const updateRow = (row, key, value) => {
    const nextIdioms = [...idioms]
    const nextIndices = [...targetIndices]
    if (key === 'idiom') nextIdioms[row] = value
    else nextIndices[row] = Number(value)
    update({ prompt: { ...form.prompt, idioms: nextIdioms, targetIndices: nextIndices } })
  }
  return <div className="yizi-editor-rows">
    <p>依序輸入四句成語，並標示原題解答是從每句取第幾字；學生仍可用其他取字方式組出您列入的可接受答案。</p>
    {idioms.map((idiom, index) => <div className="yizi-editor-row" key={index}>
      <span>第 {index + 1} 句</span>
      <input value={idiom} maxLength="4" placeholder="四字成語" onChange={(event) => updateRow(index, 'idiom', event.target.value)} />
      <label>取字
        <select value={targetIndices[index] ?? 0} onChange={(event) => updateRow(index, 'index', event.target.value)}>
          {[0, 1, 2, 3].map((item) => <option key={item} value={item}>第 {item + 1} 字{idiom[item] ? `（${idiom[item]}）` : ''}</option>)}
        </select>
      </label>
    </div>)}
  </div>
}

function PartFields({ form, update }) {
  const parts = form.prompt?.parts || ['', '', '', '']
  const updatePart = (index, value) => {
    const next = [...parts]; next[index] = value
    update({ prompt: { ...form.prompt, parts: next } })
  }
  return <div className="yizi-editor-part-fields">
    <p>輸入四個文字部件。學生只會看到部件，不必指出去除哪一個。</p>
    <div className="yizi-editor-parts">{parts.map((part, index) => <label key={index}>部件 {index + 1}
      <input value={part} maxLength="4" onChange={(event) => updatePart(index, event.target.value)} />
    </label>)}</div>
    <label>原題建議去除的部件（僅供老師核對，可留白）
      <input value={form.prompt?.removedPart || ''} onChange={(event) => update({ prompt: { ...form.prompt, removedPart: event.target.value } })} />
    </label>
  </div>
}

function PairFields({ form, update }) {
  const parts = form.prompt?.parts || Array(16).fill('')
  const updatePart = (index, value) => {
    const next = [...parts]; next[index] = value
    update({ prompt: { ...form.prompt, parts: next } })
  }
  return <div className="yizi-editor-pair-fields">
    <label>題組名稱<input value={form.prompt?.title || ''} placeholder="例如：基礎部件題組"
      onChange={(event) => update({ prompt: { ...form.prompt, title: event.target.value } })} /></label>
    <p>輸入 16 個部件；部件可重複使用，因此答案區應列出所有合理答案。</p>
    <div className="yizi-editor-pair-grid">{parts.map((part, index) => <label key={index}><span>{index + 1}</span>
      <input value={part} maxLength="4" onChange={(event) => updatePart(index, event.target.value)} />
    </label>)}</div>
  </div>
}

function QuestionPreview({ form }) {
  if (form.gameType === 'four_sayings') return <div className="yizi-editor-preview"><strong>學生題目預覽</strong>
    {(form.prompt?.idioms || []).map((idiom, index) => <p key={index}>{index + 1}．{idiom || '尚未輸入'}</p>)}</div>
  if (form.gameType === 'remove_part') return <div className="yizi-editor-preview"><strong>學生題目預覽</strong>
    <div className="yizi-parts-stage">{(form.prompt?.parts || []).map((part, index) => <span key={index}>{part || '？'}</span>)}</div></div>
  return <div className="yizi-editor-preview"><strong>學生題目預覽</strong>
    <div className="yizi-component-grid">{(form.prompt?.parts || []).map((part, index) => <span key={index}>{part || '？'}</span>)}</div></div>
}

function validate(form) {
  if (!(form.answers?.accepted || []).length) return '至少要輸入一個主要答案。'
  if (form.gameType === 'four_sayings' && (form.prompt?.idioms || []).some((item) => Array.from(item).length !== 4)) return '四說新語必須完整輸入四句四字成語。'
  if (form.gameType === 'remove_part' && (form.prompt?.parts || []).filter(Boolean).length !== 4) return '去無成字必須輸入四個部件。'
  if (form.gameType === 'component_pairs' && (form.prompt?.parts || []).filter(Boolean).length !== 16) return '成雙成對必須輸入 16 個部件。'
  return ''
}

export default function YiziQuestionEditor({ questions, remoteEnabled, onSaved }) {
  const [filter, setFilter] = useState('four_sayings')
  const [form, setForm] = useState(() => blankQuestion())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const visible = useMemo(() => questions.filter((item) => item.gameType === filter), [filter, questions])
  const update = (patch) => setForm((current) => ({ ...current, ...patch }))
  const changeGame = (gameType) => { setFilter(gameType); setForm(blankQuestion(gameType)); setMessage('') }
  const edit = (question) => { setFilter(question.gameType); setForm(cloneQuestion(question)); setMessage('') }
  const save = async () => {
    const error = validate(form)
    if (error) { setMessage(error); return }
    if (!remoteEnabled) { setMessage('資料庫功能尚未發布，現在只能預覽內建題庫。'); return }
    setSaving(true); setMessage('')
    try {
      const saved = await saveYiziQuestion(form)
      setMessage(saved.status === 'published' ? '題目已儲存並發布。' : '題目已儲存為草稿。')
      setForm(cloneQuestion(saved)); await onSaved?.()
    } catch (saveError) { setMessage(saveError.message) }
    finally { setSaving(false) }
  }
  return <section className="yizi-editor" aria-labelledby="yizi-editor-title">
    <div className="yizi-editor-heading"><div><p className="eyebrow">QUESTION WORKBENCH</p><h2 id="yizi-editor-title">題庫工作區</h2>
      <p>左側找題或新增，右側直接編輯並預覽。發布前可先保留草稿。</p></div>
      <button type="button" onClick={() => setForm(blankQuestion(filter))}>建立新題</button></div>
    <div className="yizi-editor-layout">
      <aside className="yizi-editor-catalog">
        <label>玩法<select value={filter} onChange={(event) => changeGame(event.target.value)}>
          {gameTypes.map((type) => <option key={type} value={type}>{YIZI_GAME_LABELS[type]}</option>)}
        </select></label>
        <div className="yizi-editor-question-list">{visible.map((question, index) => <button type="button" key={question.id || question.stableKey}
          className={form.stableKey === question.stableKey ? 'is-active' : ''} onClick={() => edit(question)}>
          <strong>{YIZI_GAME_LABELS[question.gameType]} #{index + 1}</strong><span>{YIZI_DIFFICULTIES.find((item) => item.value === question.difficulty)?.label || '易'}・{question.status === 'published' ? '已發布' : question.status === 'archived' ? '已封存' : '草稿'}</span>
        </button>)}</div>
      </aside>
      <div className="yizi-editor-form">
        <div className="yizi-editor-meta">
          <label>玩法<select value={form.gameType} onChange={(event) => setForm(blankQuestion(event.target.value))}>{gameTypes.map((type) => <option key={type} value={type}>{YIZI_GAME_LABELS[type]}</option>)}</select></label>
          <label>適合難度<select value={form.difficulty} onChange={(event) => update({ difficulty: Number(event.target.value) })}>{YIZI_DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label>狀態<select value={form.status} onChange={(event) => update({ status: event.target.value })}><option value="draft">草稿</option><option value="published">發布</option><option value="archived">封存</option></select></label>
        </div>
        {form.gameType === 'four_sayings' && <FourSayingsFields form={form} update={update} />}
        {form.gameType === 'remove_part' && <PartFields form={form} update={update} />}
        {form.gameType === 'component_pairs' && <PairFields form={form} update={update} />}
        <AnswerFields form={form} update={update} />
        <details className="yizi-editor-source"><summary>資料來源（選填）</summary><div>
          <label>來源名稱<input value={form.sourceLabel || ''} onChange={(event) => update({ sourceLabel: event.target.value })} /></label>
          <label>來源網址<input type="url" value={form.sourceUrl || ''} onChange={(event) => update({ sourceUrl: event.target.value })} /></label>
        </div></details>
        <QuestionPreview form={form} />
        <div className="yizi-editor-save"><button type="button" className="primary" disabled={saving} onClick={save}>{saving ? '儲存中…' : '儲存題目'}</button>
          {message && <p role="status">{message}</p>}</div>
      </div>
    </div>
  </section>
}
