import { describe, expect, test, vi } from 'vitest'

import { useStagedRows } from '@/features/order'

function writes() {
  return {
    create: vi.fn().mockResolvedValue({ id: 7 }),
    update: vi.fn().mockResolvedValue({}),
    destroy: vi.fn().mockResolvedValue({}),
  }
}

describe('useStagedRows.replay', () => {
  test('a replayed create keeps the id it was given, so a second replay updates', async () => {
    const staged = useStagedRows(() => ({ info: '' }))
    staged.rows.value = [{ info: 'call first' }]
    const api = writes()

    await staged.replay(42, api)

    expect(api.create).toHaveBeenCalledTimes(1)
    expect(staged.rows.value[0].id).toBe(7)

    await staged.replay(42, api)

    expect(api.create).toHaveBeenCalledTimes(1)
    expect(api.update).toHaveBeenCalledTimes(1)
    expect(api.update).toHaveBeenCalledWith(7, expect.objectContaining({ id: 7, info: 'call first' }), 42)
  })

  test('an existing row is updated and a removed one deleted', async () => {
    const staged = useStagedRows(() => ({ info: '' }))
    staged.rows.value = [{ id: 3, info: 'kept' }]
    staged.deletedIds.value = [9]
    const api = writes()

    await staged.replay(42, api)

    expect(api.create).not.toHaveBeenCalled()
    expect(api.update).toHaveBeenCalledWith(3, expect.objectContaining({ id: 3 }), 42)
    expect(api.destroy).toHaveBeenCalledWith(9)
    expect(staged.deletedIds.value).toEqual([])
  })
})
