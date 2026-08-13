import { describe, expect, it } from 'vitest'
import { loadLocalSchulteRecords, saveLocalSchulteRecord } from './schulteService.js'

function createStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  }
}

describe('Schulte local records', () => {
  it('儲存並讀回本機練習紀錄', () => {
    const storage = createStorage()
    const record = {
      id: 'record-1',
      size: 4,
      durationMs: 16000,
      errorCount: 1,
      averageTapMs: 1000,
      completedAt: '2026-08-09T12:00:00.000Z',
    }
    saveLocalSchulteRecord(record, storage)
    expect(loadLocalSchulteRecords(storage)).toEqual([record])
  })

  it('紀錄損壞時安全回傳空陣列', () => {
    const storage = createStorage()
    storage.setItem('sljh-schulte-static-records-v1', '{broken')
    expect(loadLocalSchulteRecords(storage)).toEqual([])
  })

  it('動態模式使用獨立紀錄空間，不影響靜態紀錄', () => {
    const storage = createStorage()
    const staticRecord = { id: 'static', mode: 'static', size: 4 }
    const dynamicRecord = { id: 'dynamic', mode: 'dynamic', size: 20 }

    saveLocalSchulteRecord(staticRecord, storage)
    saveLocalSchulteRecord(dynamicRecord, storage, 'dynamic')

    expect(loadLocalSchulteRecords(storage)).toEqual([staticRecord])
    expect(loadLocalSchulteRecords(storage, 'dynamic')).toEqual([dynamicRecord])
  })

  it('圖形模式使用獨立紀錄空間', () => {
    const storage = createStorage()
    const shapeRecord = { id: 'shape', mode: 'shape', size: 5 }

    saveLocalSchulteRecord(shapeRecord, storage, 'shape')

    expect(loadLocalSchulteRecords(storage, 'shape')).toEqual([shapeRecord])
    expect(loadLocalSchulteRecords(storage)).toEqual([])
  })

  it('詩句與名言模式使用獨立紀錄空間', () => {
    const storage = createStorage()
    const record = { id: 'sentence', mode: 'sentence', size: 9 }

    saveLocalSchulteRecord(record, storage, 'sentence')

    expect(loadLocalSchulteRecords(storage, 'sentence')).toEqual([record])
    expect(loadLocalSchulteRecords(storage)).toEqual([])
  })
})
