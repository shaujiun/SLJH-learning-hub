import { describe, expect, it, vi } from 'vitest'
import { loadAnimalEquationTask, recordAnimalEquationTask } from './animalEquationTaskService.js'

function taskQuery(result) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
  }
  return query
}

describe('animalEquationTaskService', () => {
  it('只接受根式馬戲團單人每日任務', async () => {
    const query = taskQuery({
      data: {
        id: 'task-1',
        subject_code_snapshot: 'math',
        activity_code_snapshot: 'animal_equation_solo',
        activity_name_snapshot: '根式馬戲團單人對戰',
        status: 'pending',
      },
      error: null,
    })
    const client = { from: vi.fn(() => query) }
    await expect(loadAnimalEquationTask('task-1', client)).resolves.toMatchObject({ id: 'task-1' })
  })

  it('完成整局且至少一次有效根式出牌即完成任務', async () => {
    const client = { rpc: vi.fn(async () => ({ data: { passed: true }, error: null })) }
    await recordAnimalEquationTask({
      focusTaskId: 'task-1', finished: true, validRadicalPlays: 2,
    }, client)
    expect(client.rpc).toHaveBeenCalledWith('record_focus_task_attempt', {
      p_focus_task_id: 'task-1', p_score: 100, p_correct_count: 1, p_question_count: 1,
    })
  })

  it('完成整局但沒有有效根式出牌時不算通過', async () => {
    const client = { rpc: vi.fn(async () => ({ data: { passed: false }, error: null })) }
    await recordAnimalEquationTask({
      focusTaskId: 'task-1', finished: true, validRadicalPlays: 0,
    }, client)
    expect(client.rpc).toHaveBeenCalledWith('record_focus_task_attempt', {
      p_focus_task_id: 'task-1', p_score: 0, p_correct_count: 0, p_question_count: 1,
    })
  })
})
