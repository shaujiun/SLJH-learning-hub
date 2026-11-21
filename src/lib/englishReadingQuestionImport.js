const circledNumbers = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'

function questionNumber(value) {
  const circledIndex = circledNumbers.indexOf(value)
  return circledIndex >= 0 ? circledIndex + 1 : Number(value)
}

function normalizedOcrLines(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function questionStart(line) {
  const match = line.match(/^(?:Q(?:uestion)?\s*)?([0-9]{1,2}|[①-⑳])\s*(?:[.．、)）:：-]|\s)\s*(.+)$/i)
  if (!match) return null
  const number = questionNumber(match[1])
  return number >= 1 && number <= 20 ? { number, text: match[2].trim() } : null
}

function optionStart(line) {
  const match = line.match(/^([A-DＡ-Ｄ])\s*[.．、)）:：-]\s*(.+)$/)
  if (!match) return null
  const label = String.fromCharCode('A'.charCodeAt(0) + 'ＡＢＣＤ'.indexOf(match[1].toUpperCase()))
  return { label: 'ＡＢＣＤ'.includes(match[1].toUpperCase()) ? label : match[1].toUpperCase(), text: match[2].trim() }
}

function isExerciseHeading(line) {
  return /^(?:閱讀能力測驗|閱讀測驗|小試身手|word\s*box|reading\s*comprehension|challenge\s*yourself)\s*[:：]?$/i.test(line)
}

function emptyImportedQuestion(position, kind) {
  return {
    id: '', position, kind, groupScope: 'all', prompt: '',
    options: kind === 'choice' ? [] : [], answers: kind === 'choice' ? [''] : [],
    explanation: '', evidenceSentence: '', hintA: '', hintB: '',
  }
}

export function parseRecognizedChoiceQuestions(value, startPosition = 1) {
  const lines = normalizedOcrLines(value)
  const parsed = []
  let current = null
  let activeOptionIndex = -1

  function finishCurrent() {
    if (current?.prompt && current.options.length >= 2) {
      parsed.push({ ...current, position: startPosition + parsed.length })
    }
    current = null
    activeOptionIndex = -1
  }

  for (const line of lines) {
    if (isExerciseHeading(line)) continue
    const numbered = questionStart(line)
    if (numbered) {
      finishCurrent()
      current = { ...emptyImportedQuestion(startPosition + parsed.length, 'choice'), prompt: numbered.text }
      continue
    }

    const option = optionStart(line)
    if (option && current) {
      if (current.options.length < 4) {
        current.options.push(option.text)
        activeOptionIndex = current.options.length - 1
      }
      continue
    }

    if (!current) continue
    if (activeOptionIndex >= 0) {
      current.options[activeOptionIndex] = `${current.options[activeOptionIndex]} ${line}`.trim()
    } else {
      current.prompt = `${current.prompt} ${line}`.trim()
    }
  }
  finishCurrent()
  return parsed
}

function normalizeBlankMarkers(value) {
  return String(value || '')
    .replace(/[＿_]{2,}/g, '____')
    .replace(/(?:\.\s*){3,}/g, '____')
}

function blankCount(value) {
  return (normalizeBlankMarkers(value).match(/____/g) || []).length
}

export function parseRecognizedClozeQuestions(value, startPosition = 1) {
  const lines = normalizedOcrLines(value)
  const blocks = []
  let current = null

  function finishCurrent() {
    if (!current) return
    const prompt = normalizeBlankMarkers(current).trim()
    const count = Math.min(6, blankCount(prompt))
    if (prompt && count > 0) blocks.push({ prompt, count })
    current = null
  }

  for (const line of lines) {
    if (isExerciseHeading(line)) continue
    const numbered = questionStart(line)
    if (numbered) {
      finishCurrent()
      current = numbered.text
      continue
    }
    if (current) current = `${current} ${line}`.trim()
    else if (blankCount(line) > 0) current = line
  }
  finishCurrent()

  return blocks.map(({ prompt, count }, index) => ({
    ...emptyImportedQuestion(startPosition + index, 'cloze'),
    prompt,
    answers: Array.from({ length: count }, () => ''),
    blankCount: count,
  }))
}

export function parseRecognizedReadingQuestions({ cloze = '', questions = '' } = {}, startPosition = 1) {
  const clozeQuestions = parseRecognizedClozeQuestions(cloze, startPosition)
  const choiceQuestions = parseRecognizedChoiceQuestions(questions, startPosition + clozeQuestions.length)
  return [...clozeQuestions, ...choiceQuestions]
}
