import { describe, expect, it } from 'vitest'
import { bundledLearningMapsFor, scienceLearningMaps } from './scienceLearningMaps.js'

describe('scienceLearningMaps', () => {
  it('依檔名建立第 3 冊的六張自然科心智圖', () => {
    expect(scienceLearningMaps).toHaveLength(6)
    expect(scienceLearningMaps.every((item) => item.volumeNo === 3 && item.subjectCode === 'science')).toBe(true)
    expect(scienceLearningMaps.map((item) => [item.chapterNo, item.sectionNo])).toEqual([
      [3, 1], [3, 2], [3, 3], [3, 4], [4, 1], [4, 2],
    ])
  })

  it('聲波的反射與超聲波歸入第 3 章第 3 節', () => {
    expect(scienceLearningMaps).toContainEqual(expect.objectContaining({
      chapterNo: 3,
      sectionNo: 3,
      title: '聲波的反射與超聲波',
      originalFileName: 'B3 3-3聲波的反射與超聲波心智圖.png',
    }))
  })

  it('只在自然科載入內建地圖', () => {
    expect(bundledLearningMapsFor('science')).toHaveLength(6)
    expect(bundledLearningMapsFor('geography')).toEqual([])
  })
})
