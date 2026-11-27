import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { buildIdiomPuzzle } from '../lib/idiomWordGrid.js'
import {
  buildIdiomCompletionProgress,
  IdiomBoard,
  IdiomCompletionDialog,
  IdiomLearningPanel,
  IdiomPuzzleEditor,
  PlayIdiomPuzzle,
} from './IdiomWordGrid.jsx'

const puzzle = {
  id: 'test-puzzle', title: '成語挑戰', publishedOn: '2026-10-31', sourceVersion: 'dict_idioms_2020_20260929',
  ...buildIdiomPuzzle([
    { id: 'a', phrase: '一心一意', definition: '專心一意。', source: '教育部《成語典》。', sourceUrl: 'https://dict.idioms.moe.edu.tw/', zhuyin: 'ㄧ ㄒㄧㄣ ㄧ ㄧˋ' },
    { id: 'b', phrase: '心平氣和', definition: '心情平靜。', source: '教育部《成語典》。' },
    { id: 'c', phrase: '和氣生財', definition: '待人和善能招來財富。', source: '教育部《成語典》。' },
    { id: 'd', phrase: '財源廣進', definition: '財富從各方而來。', source: '教育部《成語典》。' },
  ], 'beginner'),
}

describe('成語填字圖畫面', () => {
  it('依題目長寬建立非固定 10×10 的格線', () => {
    const html = renderToStaticMarkup(<IdiomBoard puzzle={puzzle} assignments={{}} revealedKeys={[]} onCellClick={() => {}} />)
    expect(html).toContain(`--idiom-grid-columns:${puzzle.board.width}`)
    expect(html).toContain('交錯格')
  })

  it('通關後列出成語、教育部釋義與出處，沒有圖片時不顯示空白圖片區塊', () => {
    const html = renderToStaticMarkup(<IdiomLearningPanel puzzle={puzzle} />)
    expect(html).toContain('一心一意')
    expect(html).toContain('專心一意。')
    expect(html).toContain('典源或出處')
    expect(html).toContain('播放發音')
    expect(html).toContain('ㄧ ㄒㄧㄣ ㄧ ㄧˋ')
    expect(html).not.toContain('idiom-entry-illustration')
    expect(html).not.toContain('待老師上傳')
  })

  it('教師已設定圖片時才在學生端顯示成語輔助插圖', () => {
    const withImage = {
      ...puzzle,
      idioms: puzzle.idioms.map((entry, index) => index === 0
        ? { ...entry, illustrationUrl: 'https://example.com/idiom.webp' }
        : entry),
    }
    const html = renderToStaticMarkup(<IdiomLearningPanel puzzle={withImage} />)
    expect(html).toContain('src="https://example.com/idiom.webp"')
    expect(html).toContain('一心一意的輔助插圖')
  })

  it('提供一字、交錯字與完整成語提示，並顯示每關兩次上限', () => {
    const html = renderToStaticMarkup(<PlayIdiomPuzzle puzzle={puzzle} context={{ studentId: '', energy: 5, remoteEnabled: false, hintUseCounts: {} }} focusTaskId="" onEnergyChange={() => {}} />)
    expect(html).toContain('一字提示')
    expect(html).toContain('交錯字提示')
    expect(html).toContain('完整成語提示')
    expect(html).not.toContain('錯字檢查')
    expect(html).toContain('1 能量')
    expect(html).toContain('2 能量')
    expect(html).toContain('5 能量')
    expect(html).toContain('本關提示已使用 0／2 次')
  })

  it('完成的成語可用較深底色標示，錯誤填字格使用紅色狀態', () => {
    const correctCell = puzzle.board.cells[0]
    const wrongCell = puzzle.board.cells[1]
    const html = renderToStaticMarkup(
      <IdiomBoard
        puzzle={puzzle}
        assignments={{}}
        revealedKeys={[]}
        feedbackByCell={{
          [correctCell.key]: [{ id: 'a', status: 'correct', colorIndex: 0 }],
          [wrongCell.key]: [{ id: 'b', status: 'incorrect', colorIndex: 1 }],
        }}
        onCellClick={() => {}}
      />,
    )
    expect(html).toContain('data-idiom-feedback="correct"')
    expect(html).toContain('data-idiom-feedback="incorrect"')
    expect(html).toContain('--idiom-feedback-background:#ffd2cf')
  })

  it('登入學生可看到目前能量與累計收支', () => {
    const html = renderToStaticMarkup(
      <PlayIdiomPuzzle
        puzzle={puzzle}
        context={{ studentId: 'student-1', energy: 7, energyEarnedTotal: 18, energySpentTotal: 11, hintUseCounts: {}, remoteEnabled: true, completedPuzzleIds: [] }}
        focusTaskId=""
        onEnergyChange={() => {}}
      />,
    )
    expect(html).toContain('7</strong><span>目前能量')
    expect(html).toContain('累計獲得 18・已使用 11')
  })

  it('其他裝置載入遠端通關紀錄後可直接開啟本關成語解說', () => {
    const html = renderToStaticMarkup(
      <PlayIdiomPuzzle
        puzzle={puzzle}
        context={{ studentId: 'student-1', energy: 5, remoteEnabled: true, completedPuzzleIds: [puzzle.id] }}
        focusTaskId=""
        onEnergyChange={() => {}}
      />,
    )
    expect(html).toContain('查看本關成語解說')
  })

  it('通關視窗直接列出本關成語、解釋入口與下一關按鈕', () => {
    const html = renderToStaticMarkup(
      <IdiomCompletionDialog
        puzzle={puzzle}
        levelLabel="入門第 1 關"
        nextLevelLabel="入門第 2 關"
        reviewEntryIds={[]}
        canReview
        onToggleReview={() => {}}
        onClose={() => {}}
        onNextPuzzle={() => {}}
      />,
    )
    expect(html).toContain('入門第 1 關全部答對')
    expect(html).toContain('一心一意')
    expect(html).toContain('加入複習')
    expect(html).toContain('進入下一關：入門第 2 關')
  })

  it('已通關關卡可重新開啟解說，最後一關視窗顯示等待更新', () => {
    const context = { studentId: 'student-1', energy: 5, remoteEnabled: true, completedPuzzleIds: [puzzle.id] }
    const withNext = renderToStaticMarkup(
      <PlayIdiomPuzzle
        puzzle={puzzle}
        context={context}
        focusTaskId=""
        levelLabel="入門第 1 關"
        nextLevelLabel="入門第 2 關"
        onNextPuzzle={() => {}}
        onEnergyChange={() => {}}
      />,
    )
    expect(withNext).toContain('查看本關成語解說')
    expect(withNext).not.toContain('2026／10／31')

    const finalLevel = renderToStaticMarkup(
      <IdiomCompletionDialog
        puzzle={puzzle}
        levelLabel="入門第 2 關"
        onClose={() => {}}
      />,
    )
    expect(finalLevel).toContain('這是目前這個難度最後一關，請靜待更新。')
  })

  it('重玩同一關通關時會用目前提示次數建立同步紀錄', () => {
    const progress = buildIdiomCompletionProgress({ puzzle, focusTaskId: 'task-1', hintUses: 2 })
    expect(progress).toMatchObject({
      activityCode: 'idiom_word_grid',
      source: 'daily_task',
      metadata: { hintsUsed: 2 },
    })
    expect(progress.questionCount).toBeGreaterThan(0)
  })

  it('進階與挑戰關卡提供 10 點的所有交錯字提示', () => {
    const html = renderToStaticMarkup(
      <PlayIdiomPuzzle
        puzzle={{ ...puzzle, difficulty: 'advanced' }}
        context={{ studentId: 'student-1', energy: 12, remoteEnabled: true, completedPuzzleIds: [], reviewEntryIds: [], hintUseCounts: {} }}
        focusTaskId=""
        onEnergyChange={() => {}}
      />,
    )
    expect(html).toContain('所有交錯字提示')
    expect(html).toContain('10 能量')
    expect(html).toContain('完整成語提示')
    expect(html).not.toContain('錯字檢查')
    expect(html).not.toContain('／20 能量')
    expect(html).toContain('先點選題目空格，再選下方文字')
  })

  it('管理者可設定黑格、白格、提示字、完整答案、等級與發布狀態', () => {
    const html = renderToStaticMarkup(
      <IdiomPuzzleEditor
        catalog={puzzle.idioms.map((entry) => ({ ...entry, stage: 'junior' }))}
        puzzle={{ ...puzzle, acceptedAnswers: { a: ['一意一心'] } }}
        onSaved={() => {}}
        onCancel={() => {}}
        onCatalogAdded={() => {}}
      />,
    )
    expect(html).toContain('黑格')
    expect(html).toContain('白格')
    expect(html).toContain('提示字')
    expect(html).toContain('完整答案')
    expect(html).toContain('適合等級')
    expect(html).toContain('正式發布')
    expect(html).toContain('搜尋、新增或編輯成語資料')
    expect(html).toContain('破音字')
    expect(html).toContain('依所選成語自動排版')
    expect(html).toContain('先勾選至少 4 個具有共同文字的成語')
    expect(html).toContain('設定可接受的替代答案')
    expect(html).toContain('不會改寫教育部成語資料')
    expect(html).toContain('placeholder="例如：一十一五"')
    expect(html).toContain('新增並加入本題')
    expect(html).toContain('上傳圖檔')
    expect(html).toContain('image/jpeg,image/png,image/webp')
    expect(html).toContain('查看並修改')
    expect(html).toContain(`class="idiom-admin-catalog-phrase">${puzzle.idioms[0].phrase}</span>`)
    expect(html).toContain('適合等級：國中階段')
    expect(html).not.toContain('>編輯</button>')
    expect(html).not.toContain('type="url"')
    expect(html).toContain('lang="zh-Hant"')
  })
})
