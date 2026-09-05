import { describe, expect, it } from 'vitest'
import { learningSystemLaunchUrl, subjectGamesFor } from './subjectGames.js'

describe('各科遊戲選擇入口', () => {
  it.each([
    ['english', '?subject=english'],
    ['science', '?subject=science'],
    ['history', '?subject=history'],
    ['geography', '?subject=geography'],
    ['math', '?subject=math'],
  ])('%s 自由練習先進入該科遊戲選擇頁', (code, expected) => {
    expect(learningSystemLaunchUrl({
      code,
      name: code,
      launchUrl: code === 'science' ? '?game=periodic-table' : `https://example.com/${code}`,
    }, 'https://example.com/english')).toBe(expected)
  })

  it('元素週期表保留課程適用標示與現有遊戲網址', () => {
    expect(subjectGamesFor({ code: 'science', name: '自然' }, '')).toContainEqual(expect.objectContaining({
      code: 'periodic-table',
      availability: '八上 CH6 後都適用',
      launchUrl: '?game=periodic-table',
    }))
  })

  it('英文選擇頁使用目前的英文單字系統網址', () => {
    expect(subjectGamesFor({ code: 'english', name: '英語', launchUrl: '' }, 'https://example.com/english'))
      .toContainEqual(expect.objectContaining({
        code: 'english-vocabulary',
        launchUrl: 'https://example.com/english',
      }))
  })

  it('地理科顯示目前已開放的年級與章節', () => {
    expect(subjectGamesFor({ code: 'geography', name: '地理', launchUrl: '' }, '')).toContainEqual(expect.objectContaining({
      code: 'geography-fill-map',
      launchUrl: '?geography=maps',
      availability: '七上、八上全冊、九上第 1～2 章已開放',
    }))
    expect(subjectGamesFor({ code: 'geography', name: '地理', launchUrl: '' }, '')).toContainEqual(expect.objectContaining({
      code: 'geography-detective',
      launchUrl: '?geography=detective',
      availability: '翰林八上第 1～2 章',
    }))
  })

  it('歷史科先提供八年級歷史時光地圖', () => {
    expect(subjectGamesFor({ code: 'history', name: '歷史' }, '')).toContainEqual(expect.objectContaining({
      code: 'history-atlas',
      launchUrl: '?history=atlas',
      availability: '翰林八上、八下適用',
    }))
  })
})
