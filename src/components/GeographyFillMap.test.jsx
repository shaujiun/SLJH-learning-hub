import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { chinaReliefStepItems } from '../data/chinaGeography.js'
import GeographyFillMap, { ChinaMap } from './GeographyFillMap.jsx'

const originalWindow = globalThis.window

afterEach(() => {
  globalThis.window = originalWindow
})

describe('GeographyFillMap', () => {
  it('先顯示正式課本章節，再顯示目前章節的主題與練習方式', () => {
    globalThis.window = {
      location: new URL('http://127.0.0.1:4173/?geography=maps'),
      scrollTo: () => {},
    }

    const html = renderToString(<GeographyFillMap />)

    expect(html).toContain('地理填圖學習系統')
    expect(html).toContain('臺灣地理')
    expect(html).toContain('中國地理')
    expect(html).toContain('世界地理')
    expect(html).toContain('八上第 1 章　中國的地形')
    expect(html).toContain('八上第 2 章　中國的氣候')
    expect(html).not.toContain('八上第 3 章　中國的傳統農業區')
    expect(html).toContain('地勢三級階梯')
    expect(html).toContain('行政區填圖')
    expect(html).toContain('地形與山脈')
    expect(html).not.toContain('<em>翰林八上 L03</em>')
    expect(html).toContain('看名稱找位置')
    expect(html).toContain('看位置選名稱')
    expect(html).toContain('標籤填圖')
    expect(html).toContain('混合挑戰')
    expect(html).toContain('返回任務頁')
    expect(html).toContain('返回聯絡簿')
  })

  it('以三組可選雙箭頭呈現階梯範圍，作答前不顯示階梯名稱', () => {
    const html = renderToString(
      <ChinaMap
        currentItem={chinaReliefStepItems[0]}
        topicItems={chinaReliefStepItems}
        effectiveMode="locate"
        revealed={false}
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(html.match(/geography-map-range /g)).toHaveLength(3)
    expect(html).toContain('geography-relief-step-band')
    expect(html.match(/--range-start:/g)).toHaveLength(3)
    expect(html.match(/--range-width:/g)).toHaveLength(3)
    expect(html).toContain('依北緯 36° 地形剖面線分段；雙箭頭表示階梯範圍')
    expect(html).toContain('可選擇的階梯分布範圍')
    expect(html).toContain('階梯範圍')
    expect(html).not.toContain('第一級階梯')
    expect(html).not.toContain('geography-map-point ')
  })

  it('公布答案後在雙箭頭中央顯示正確階梯名稱', () => {
    const html = renderToString(
      <ChinaMap
        currentItem={chinaReliefStepItems[0]}
        topicItems={chinaReliefStepItems}
        effectiveMode="locate"
        revealed
        solved={false}
        wrongTargetId=""
        onAnswer={() => {}}
      />,
    )

    expect(html).toContain('第一級階梯')
  })
})
