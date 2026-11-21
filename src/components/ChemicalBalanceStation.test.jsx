import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ChemicalBalanceStation, { AtomBuilder, StageFourLesson, StageThreeLesson, StageTwoLesson } from './ChemicalBalanceStation.jsx'
import { buildStageFourRound, buildStageThreeRound, buildStageTwoRound, initialFormulaSelections, initialReactionCoefficients } from '../lib/chemicalBalance.js'

describe('化學反應平衡站', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {
      location: new URL('http://127.0.0.1:4173/?game=chemical-balance&guest=1'),
      localStorage: { getItem: vi.fn(() => null), setItem: vi.fn() },
      scrollTo: vi.fn(),
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('呈現並開放完整四關學習路線', () => {
    const html = renderToStaticMarkup(<ChemicalBalanceStation />)
    expect(html).toContain('化學反應平衡站')
    expect(html).toContain('分子組裝室')
    expect(html).toContain('原子守恆天平')
    expect(html).toContain('係數平衡訓練')
    expect(html).toContain('完整反應式挑戰')
    expect(html).toContain('開始第 1 關')
    expect(html).toContain('開始第 2 關')
    expect(html).toContain('開始第 3 關')
    expect(html).toContain('開始第 4 關')
    expect(html).toContain('右下角數字改變粒子的組成')
    expect(html).toContain('?subject=science&amp;guest=1')
  })

  it('第四關先確認化學式，通過後才開啟係數配平', () => {
    const question = buildStageFourRound(() => 0.999).find((item) => item.mode === 'full-equation')
    const initial = renderToStaticMarkup(<StageFourLesson
      question={question}
      formulaSelections={initialFormulaSelections(question)}
      formulaConfirmed={false}
      coefficients={initialReactionCoefficients(question)}
      resolved={false}
      feedback=""
      feedbackKind="hint"
      onFormulaChange={() => {}}
      onFormulaSubmit={() => {}}
      onCoefficientChange={() => {}}
      onCoefficientSubmit={() => {}}
      onNext={() => {}}
      questionIndex={0}
      totalQuestions={13}
    />)
    const correctFormulas = {
      reactants: question.reactants.map((term) => term.molecule.formula),
      products: question.products.map((term) => term.molecule.formula),
    }
    const balancing = renderToStaticMarkup(<StageFourLesson
      question={question}
      formulaSelections={correctFormulas}
      formulaConfirmed
      coefficients={initialReactionCoefficients(question)}
      resolved={false}
      feedback=""
      feedbackKind="success"
      onFormulaChange={() => {}}
      onFormulaSubmit={() => {}}
      onCoefficientChange={() => {}}
      onCoefficientSubmit={() => {}}
      onNext={() => {}}
      questionIndex={0}
      totalQuestions={13}
    />)

    expect(initial).toContain('STAGE 4・完整反應式挑戰')
    expect(initial).toContain('選擇化學式')
    expect(initial).toContain('檢查化學式')
    expect(initial).not.toContain('檢查完整反應式')
    expect(balancing).toContain('化學式已固定')
    expect(balancing).toContain('本關係數可調整為 1～8')
    expect(balancing).toContain('檢查完整反應式')
    expect(balancing).toContain('完整挑戰不提供作答中的原子統計')
  })

  it('第四關缺項推理題可由生成物回推反應物，且只呈現一個輸入格', () => {
    const question = buildStageFourRound(() => 0.413)
      .find((item) => item.mode === 'missing-compound' && item.missingSide === 'reactants')
    const html = renderToStaticMarkup(<StageFourLesson
      question={question}
      formulaSelections={initialFormulaSelections(question)}
      formulaConfirmed={false}
      coefficients={initialReactionCoefficients(question)}
      resolved={false}
      feedback=""
      feedbackKind="hint"
      missingAnswer=""
      onMissingAnswerChange={() => {}}
      onMissingAnswerSubmit={() => {}}
      onFormulaChange={() => {}}
      onFormulaSubmit={() => {}}
      onCoefficientChange={() => {}}
      onCoefficientSubmit={() => {}}
      onNext={() => {}}
      questionIndex={0}
      totalQuestions={13}
    />)

    expect(html).toContain('STAGE 4・缺項推理題')
    expect(html).toContain('係數已固定')
    expect(html).toContain('先算右側生成物的原子總數')
    expect(html).toContain('aria-label="缺少的反應物化學式"')
    expect(html).toContain('檢查缺少的反應物化學式')
    expect(html).not.toContain('選擇化學式')
    expect((html.match(/<input/g) || [])).toHaveLength(1)
  })

  it('高中與有機延伸題明確說明不必背誦反應式', () => {
    const question = buildStageFourRound(() => 0.271)
      .find((item) => item.mode === 'missing-compound' && item.extendedContext)
    const html = renderToStaticMarkup(<StageFourLesson
      question={question}
      formulaSelections={initialFormulaSelections(question)}
      formulaConfirmed={false}
      coefficients={initialReactionCoefficients(question)}
      resolved={false}
      feedback=""
      feedbackKind="hint"
      missingAnswer=""
      onMissingAnswerChange={() => {}}
      onMissingAnswerSubmit={() => {}}
      onFormulaChange={() => {}}
      onFormulaSubmit={() => {}}
      onCoefficientChange={() => {}}
      onCoefficientSubmit={() => {}}
      onNext={() => {}}
      questionIndex={0}
      totalQuestions={13}
    />)

    expect(html).toContain(question.contextLabel)
    expect(html).toContain('不必背誦這個反應')
    expect(html).toContain('只需用原子守恆推理')
  })

  it('第三關依題目階段顯示或隱藏原子統計，不再呈現粒子模型', () => {
    const questions = buildStageThreeRound()
    const assisted = renderToStaticMarkup(<StageThreeLesson
      question={questions[0]}
      coefficients={initialReactionCoefficients(questions[0])}
      resolved={false}
      feedback=""
      revealLedger={false}
      onChange={() => {}}
      onSubmit={() => {}}
      onNext={() => {}}
      questionIndex={0}
      totalQuestions={7}
    />)
    const formulaOnly = renderToStaticMarkup(<StageThreeLesson
      question={questions[5]}
      coefficients={initialReactionCoefficients(questions[5])}
      resolved={false}
      feedback=""
      revealLedger={false}
      onChange={() => {}}
      onSubmit={() => {}}
      onNext={() => {}}
      questionIndex={5}
      totalQuestions={7}
    />)

    expect(assisted).toContain('STAGE 3・係數平衡訓練')
    expect(assisted).toContain('原子統計')
    expect(assisted).not.toContain('球棒模型')
    expect(formulaOnly).toContain('反應式挑戰')
    expect(formulaOnly).toContain('先自行計算反應前後的原子數')
    expect(formulaOnly).not.toContain('原子統計</h2>')
  })

  it('第二關同時呈現係數操作、分子模型與原子守恆表', () => {
    const question = buildStageTwoRound(() => 0.999)[0]
    const html = renderToStaticMarkup(<StageTwoLesson
      question={question}
      coefficients={initialReactionCoefficients(question)}
      resolved={false}
      feedback=""
      onChange={() => {}}
      onSubmit={() => {}}
      onNext={() => {}}
      questionIndex={0}
      totalQuestions={7}
    />)
    expect(html).toContain('STAGE 2・原子守恆天平')
    expect(html).toContain('反應前')
    expect(html).toContain('反應後')
    expect(html).toContain('原子守恆檢查')
    expect(html).toContain('係數加一')
    expect(html).toContain('檢查是否守恆')
  })

  it('提供可拖曳原子、選擇鍵級與清除鍵結的球棒模型工具', () => {
    const html = renderToStaticMarkup(<AtomBuilder
      atoms={[{ id: 'c1', symbol: 'C', x: 50, y: 50 }]}
      bonds={[]}
      disabled={false}
      tool="bond"
      bondOrder={1}
      activeBondAtom="c1"
      builderMessage="已選第 1 顆原子"
      onAdd={() => {}}
      onMove={() => {}}
      onAtomAction={() => {}}
      onTool={() => {}}
      onClearBonds={() => {}}
      onClear={() => {}}
    />)
    expect(html).toContain('分子模型組裝畫布')
    expect(html).toContain('單鍵')
    expect(html).toContain('雙鍵')
    expect(html).toContain('三鍵')
    expect(html).toContain('只清除鍵結')
    expect(html).toContain('已選第 1 顆原子')
    expect(html).toContain('draggable="true"')
    expect(html).not.toContain('<span>C</span>')
    expect(html).toContain('碳原子')
    expect(html).toContain('<b>S</b><span>硫</span>')
  })
})
