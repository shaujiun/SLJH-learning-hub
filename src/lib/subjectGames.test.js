import { describe, expect, it } from 'vitest'
import {
  learningSystemLaunchUrl,
  subjectGamesFor,
  subjectSectionsFor,
} from './subjectGames.js'

describe('各科遊戲選擇入口', () => {
  it('數學科提供免登入的根式馬戲團教學試玩', () => {
    expect(subjectGamesFor({ code: 'math', name: '數學科' }, '')).toContainEqual(expect.objectContaining({
      code: 'animal-equation',
      launchUrl: '?game=animal-equation',
      availability: '八上第 2 章起適用',
    }))
  })
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

  it('量測實驗室僅保留在管理者測試清單，其他自然科活動照常開放', () => {
    const publicGames = subjectGamesFor({ code: 'science', name: '自然' }, '')
    expect(publicGames.map((game) => game.code)).not.toContain('measurement-lab')
    expect(subjectGamesFor({ code: 'science', name: '自然' }, '', { adminPreview: true })).toContainEqual(expect.objectContaining({
      code: 'measurement-lab',
      name: '量測實驗室',
      availability: '封存中・僅管理者測試',
      launchUrl: '?game=measurement-lab',
    }))
    expect(subjectSectionsFor({ code: 'science', name: '自然' }, '', { adminPreview: true })[2].games.map((game) => game.code))
      .toEqual(['measurement-lab', 'chemical-formula'])
    expect(publicGames).toContainEqual(expect.objectContaining({
      code: 'periodic-table',
      availability: '八上 CH6 後都適用',
      launchUrl: '?game=periodic-table',
    }))
    expect(publicGames).toContainEqual(expect.objectContaining({
      code: 'chemical-formula',
      name: '化學事前哨站',
      availability: '八上第 6 章起適用',
      launchUrl: '?game=chemical-formula',
    }))
  })

  it('英文選擇頁使用目前的英文單字系統網址', () => {
    const games = subjectGamesFor({ code: 'english', name: '英語', launchUrl: '' }, 'https://example.com/english?school=806')
    expect(games)
      .toContainEqual(expect.objectContaining({
        code: 'english-vocabulary',
        section: 'basic',
        launchUrl: 'https://example.com/english?school=806',
      }))
    expect(games)
      .toContainEqual(expect.objectContaining({
        code: 'english-grammar',
        section: 'guided',
        launchUrl: 'https://example.com/english?school=806&entry=grammar',
      }))
  })

  it('科目頁固定四區，現有活動各只放入一區', () => {
    const examples = [
      ['math', { board: ['animal-equation'] }],
      ['english', { basic: ['english-vocabulary'], guided: ['english-grammar'] }],
      ['science', { basic: ['periodic-table'], guided: ['chemical-formula'] }],
      ['history', { map: ['history-atlas'] }],
      ['geography', { guided: ['geography-fill-map', 'geography-detective'] }],
    ]
    examples.forEach(([code, expected]) => {
      const sections = subjectSectionsFor({ code, name: code }, 'https://example.com/english')
      expect(sections.map((section) => section.code)).toEqual(['map', 'basic', 'guided', 'board'])
      expect(Object.fromEntries(sections.filter((section) => section.games.length).map((section) => [
        section.code, section.games.map((game) => game.code),
      ]))).toEqual(expected)
    })
  })

  it('未設定直接入口的科目仍保留原有學習系統連結', () => {
    expect(subjectSectionsFor({ code: 'custom', name: '自訂科目', launchUrl: 'https://example.com/custom' }, '')[1].games)
      .toEqual([expect.objectContaining({ code: 'custom-main', section: 'basic' })])
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
