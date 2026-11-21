import { readingParagraphs, readingSentences } from './englishReadingDraft.js'

const stopWords = new Set([
  'about', 'after', 'again', 'also', 'and', 'are', 'because', 'been', 'before', 'being', 'but', 'can',
  'could', 'did', 'does', 'doing', 'for', 'from', 'had', 'has', 'have', 'how', 'into', 'its', 'may',
  'more', 'most', 'not', 'of', 'on', 'only', 'or', 'our', 'should', 'than', 'that', 'the', 'their',
  'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'was', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
])

function words(value) {
  return String(value || '').toLowerCase().match(/[a-z]+(?:'[a-z]+)?|\d+(?:-\d+)*/g) || []
}

function keywords(value) {
  return [...new Set(words(value).filter((word) => word.length >= 3 && !stopWords.has(word)))].slice(0, 8)
}

function articleSentences(articleText) {
  return readingParagraphs(articleText).flatMap((paragraph, paragraphIndex) =>
    readingSentences(paragraph).map((sentence, sentenceIndex) => ({
      sentence,
      paragraph: paragraphIndex + 1,
      position: sentenceIndex + 1,
      tokens: new Set(words(sentence)),
    })))
}

function correctChoiceText(question) {
  if (question?.kind !== 'choice') return ''
  const answer = String(question.answers?.[0] || '').trim().toUpperCase()
  const index = 'ABCD'.indexOf(answer)
  return index >= 0 ? String(question.options?.[index] || '') : ''
}

function answerText(question) {
  if (question?.kind === 'choice') return correctChoiceText(question)
  return (question?.answers || []).map((answer) => String(answer || '').split('|')[0].trim()).filter(Boolean).join(' ')
}

export function findReadingEvidence(articleText, question) {
  const promptKeywords = keywords(question?.prompt)
  const answerKeywords = keywords(answerText(question))
  const searchKeywords = [...new Set([...promptKeywords, ...answerKeywords])]
  if (!searchKeywords.length) return null

  let best = null
  for (const candidate of articleSentences(articleText)) {
    const promptMatches = promptKeywords.filter((word) => candidate.tokens.has(word))
    const answerMatches = answerKeywords.filter((word) => candidate.tokens.has(word))
    const score = (promptMatches.length * 2) + (answerMatches.length * 3)
    if (!score || (best && score <= best.score)) continue
    best = {
      ...candidate,
      score,
      matchedKeywords: [...new Set([...promptMatches, ...answerMatches])],
    }
  }
  return best
}

function visibleKeywords(question, evidence) {
  const promptKeywords = keywords(question?.prompt)
  const matched = evidence?.matchedKeywords || []
  return [...new Set([...matched, ...promptKeywords])].slice(0, 3)
}

export function buildReadingGuidanceDraft(articleText, question) {
  const evidence = findReadingEvidence(articleText, question)
  const focusWords = visibleKeywords(question, evidence)
  const focusLabel = focusWords.length ? `「${focusWords.join('、')}」` : '題幹中的人、事、時間與地點'
  const location = evidence ? `第 ${evidence.paragraph} 段第 ${evidence.position} 句` : '與題幹關鍵字最接近的句子'
  const answer = String(question?.answers?.[0] || '').trim().toUpperCase()
  const isChoice = question?.kind === 'choice'

  const explanation = isChoice
    ? `解題順序：① 從題幹抓出 ${focusLabel}；② 回到${location}定位；③ 比較選項與原文是否同義，排除相反、過度延伸或原文未提及的敘述。${answer ? `本題設定正解為 ${answer}，請再確認該選項確實與原文一致。` : '正解尚未設定，請先校對選項後再指定答案。'}`
    : `解題順序：① 先看每個空格前後的詞；② 回到${location}核對原句；③ 檢查固定搭配、介系詞及動詞形式，再把答案放回整句確認意思。`

  const hintA = isChoice
    ? `先找題幹關鍵字 ${focusLabel}，再注意原文是否用同義字、因果或轉折改寫。不要只看到相同單字就選答案。`
    : `先判斷每個空格需要的詞性，再利用前後介系詞、動詞形式或固定搭配縮小答案範圍。`

  const hintB = evidence
    ? isChoice
      ? `請先看${location}，找 ${focusLabel}。逐一檢查選項是否與這句原文相同、相反，或加入原文沒有說的內容。`
      : `請先看${location}，找 ${focusLabel}。把答案放回句子後，再檢查詞形及整句意思是否通順。`
    : `目前無法可靠定位原文句子。請先校對文章與題幹，再手動指定原文依據；不要只靠單字猜答案。`

  return {
    evidenceSentence: evidence?.sentence || '',
    explanation,
    hintA,
    hintB,
    match: evidence ? {
      paragraph: evidence.paragraph,
      sentence: evidence.position,
      keywords: evidence.matchedKeywords,
    } : null,
  }
}
