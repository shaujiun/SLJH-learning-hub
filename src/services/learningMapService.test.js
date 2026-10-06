import { describe, expect, it, vi } from 'vitest'
import { loadLearningMaps } from './learningMapService.js'

function queryResult(rows) {
  const query = {
    select: vi.fn(() => query), eq: vi.fn(() => query), order: vi.fn(() => query),
    then: (resolve) => resolve({ data: rows, error: null }),
  }
  return query
}

function client({ user = { id: 'user-1' }, manager = false, student = true, rows = [] } = {}) {
  const query = queryResult(rows)
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user }, error: null })) },
    rpc: vi.fn(async (name) => ({ data: name === 'can_manage_learning_maps' ? manager : student, error: null })),
    from: vi.fn(() => query),
    storage: { from: vi.fn(() => ({ createSignedUrls: vi.fn(async (paths) => ({ data: paths.map((path) => ({ path, signedUrl: `signed:${path}` })), error: null })) })) },
    query,
  }
}

describe('learningMapService', () => {
  it('未登入時不讀取地圖資料', async () => {
    const api = client({ user: null })
    expect(await loadLearningMaps('geography', api)).toEqual({ access: 'login', canManage: false, maps: [] })
    expect(api.from).not.toHaveBeenCalled()
  })

  it('學生查詢僅限已發布地圖並使用限時網址', async () => {
    const api = client({ rows: [{
      id: 'map-1', map_code: 'geo-8-1-3', subject_code: 'geography', grade_level: 8,
      semester: 1, chapter_no: 3, title: '中國的工業', status: 'published',
      storage_path: 'geography/map.jpg', display_order: 8030,
    }] })
    const result = await loadLearningMaps('geography', api)
    expect(result).toEqual(expect.objectContaining({ access: 'allowed', canManage: false }))
    expect(result.maps[0].signedUrl).toBe('signed:geography/map.jpg')
    expect(api.query.eq).toHaveBeenCalledWith('status', 'published')
  })

  it('管理者可查看草稿，不額外限制狀態', async () => {
    const api = client({ manager: true, student: false })
    const result = await loadLearningMaps('geography', api)
    expect(result.canManage).toBe(true)
    expect(api.query.eq).not.toHaveBeenCalledWith('status', 'published')
  })
})
