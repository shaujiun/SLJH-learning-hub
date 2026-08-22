import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import LearningSystemOrderButtons from './LearningSystemOrderButtons.jsx'

describe('LearningSystemOrderButtons', () => {
  it('管理者排序按鈕可以正常產生上下箭頭', () => {
    const html = renderToString(
      <LearningSystemOrderButtons
        subjectName="地理科"
        index={1}
        total={3}
        saving={false}
        onMove={() => {}}
      />,
    )

    expect(html).toContain('將地理科往前移')
    expect(html).toContain('將地理科往後移')
    expect(html.match(/<svg/g)).toHaveLength(2)
  })
})
