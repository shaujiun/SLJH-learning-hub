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
})
