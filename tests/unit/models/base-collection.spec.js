import { beforeEach, describe, expect, test, vi } from 'vitest'

import BaseModel from '@/models/base'

// BaseModel holds its axios client in an *instance* field (`axios = client`), so
// a fake can be assigned straight onto the instance. That is a cleaner seam than
// vi.mock('@/services/api'): no hoisting to reason about, and each test gets its
// own client rather than a module-level singleton shared across the file.
let client

function fakeClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}

class Thing {
  id
  name
  amount

  constructor(data = {}) {
    Object.assign(this, data)
  }
}

class ThingService extends BaseModel {
  model = Thing
  url = '/thing/thing/'
}

let service

beforeEach(() => {
  client = fakeClient()
  service = new ThingService()
  service.axios = client
  service.collection = []
  service.deletedItems = []

  // insert() and delete() fetch a CSRF token first.
  client.get.mockImplementation((url) => {
    if (url === '/get-csrf-token/') {
      return Promise.resolve({ data: { token: 'csrf-token' } })
    }
    return Promise.reject(new Error(`unexpected GET ${url}`))
  })
})

describe('collection editing', () => {
  test('addCollectionItem appends the edit item and marks the collection changed', () => {
    service.newEditItem({ name: 'a' })
    service.addCollectionItem()

    expect(service.collection).toHaveLength(1)
    expect(service.collection[0].name).toBe('a')
    expect(service.collectionHasChanges).toBe(true)
  })

  test('deleteCollectionItem removes the item and remembers it when it has an id', () => {
    service.collection = [new Thing({ id: 1, name: 'a' }), new Thing({ id: 2, name: 'b' })]

    service.deleteCollectionItem(0)

    expect(service.collection.map((t) => t.id)).toEqual([2])
    expect(service.deletedItems.map((t) => t.id)).toEqual([1])
    expect(service.collectionHasChanges).toBe(true)
  })

  test('deleteCollectionItem does not remember an item without an id', () => {
    service.collection = [new Thing({ name: 'unsaved' })]

    service.deleteCollectionItem(0)

    expect(service.collection).toHaveLength(0)
    // Nothing to delete server-side, so it must not be queued for deletion.
    expect(service.deletedItems).toHaveLength(0)
  })

  test('deleteCollectionItemByid removes by id', () => {
    service.collection = [new Thing({ id: 1 }), new Thing({ id: 2 }), new Thing({ id: 3 })]

    service.deleteCollectionItemByid(2)

    expect(service.collection.map((t) => t.id)).toEqual([1, 3])
    expect(service.deletedItems.map((t) => t.id)).toEqual([2])
  })

  test('deleteCollectionItemByid throws for an unknown id', () => {
    service.collection = [new Thing({ id: 1 })]

    expect(() => service.deleteCollectionItemByid(99)).toThrow(/not found/)
  })

  test('getIndexById finds the index by an arbitrary field', () => {
    service.collection = [new Thing({ id: 10 }), new Thing({ id: 20 })]

    expect(service.getIndexById(20, 'id')).toBe(1)
    expect(service.getIndexById(99, 'id')).toBeUndefined()
  })

  test('editCollectionItem snapshots the item before editing', () => {
    const item = new Thing({ id: 1, name: 'before' })
    service.collection = [item]

    service.editCollectionItem(item, 0)

    expect(service.isEdit).toBe(true)
    expect(service.editIndex).toBe(0)
    expect(service.beforeEditModel.name).toBe('before')
  })

  test('cancelEdit clears the edit state', () => {
    service.editCollectionItem(new Thing({ id: 1 }), 0)
    service.cancelEdit()

    expect(service.isEdit).toBe(false)
    expect(service.editPk).toBeNull()
  })
})

describe('doEditCollectionItem change detection', () => {
  test('flags an item that actually changed', () => {
    const item = new Thing({ id: 1, name: 'before' })
    service.collection = [item]
    service.editCollectionItem(item, 0)
    service.editItem.name = 'after'

    service.doEditCollectionItem()

    expect(service.collection[0].name).toBe('after')
    expect(service.collection[0].hasChanges).toBe(true)
    expect(service.collectionHasChanges).toBe(true)
    expect(service.isEdit).toBe(false)
    expect(service.editIndex).toBeNull()
  })

  test('does not flag an item that is unchanged', () => {
    const item = new Thing({ id: 1, name: 'same' })
    service.collection = [item]
    service.editCollectionItem(item, 0)

    service.doEditCollectionItem()

    expect(service.collection[0].hasChanges).toBe(false)
    expect(service.collectionHasChanges).toBe(false)
  })

  test('a changed id alone does not count as a change', () => {
    // 'id' is explicitly excluded from the comparison.
    const item = new Thing({ id: 1, name: 'same' })
    service.collection = [item]
    service.editCollectionItem(item, 0)
    service.editItem.id = 2

    service.doEditCollectionItem()

    expect(service.collection[0].hasChanges).toBe(false)
  })

  test('once the collection is marked changed it stays changed', () => {
    const item = new Thing({ id: 1, name: 'same' })
    service.collection = [item]
    service.collectionHasChanges = true
    service.editCollectionItem(item, 0)

    service.doEditCollectionItem()

    expect(service.collectionHasChanges).toBe(true)
  })
})

// This is the shape of test worth having: drive the service through a state
// change, then assert the exact API calls it produced.
describe('updateCollection -> API calls', () => {
  test('inserts new items, patches existing ones and deletes removed ones', async () => {
    client.post.mockResolvedValue({ data: { id: 99, name: 'new' } })
    client.patch.mockResolvedValue({ data: { id: 1, name: 'existing-updated' } })
    client.delete.mockResolvedValue({ data: {} })

    service.collection = [
      new Thing({ id: 1, name: 'existing-updated' }),
      new Thing({ name: 'new' }),
    ]
    service.deletedItems = [new Thing({ id: 5, name: 'gone' })]

    const result = await service.updateCollection()

    expect(client.patch).toHaveBeenCalledTimes(1)
    expect(client.patch).toHaveBeenCalledWith(
      '/thing/thing/1/',
      expect.objectContaining({ id: 1, name: 'existing-updated' }),
    )

    expect(client.post).toHaveBeenCalledTimes(1)
    expect(client.post).toHaveBeenCalledWith(
      '/thing/thing/',
      expect.objectContaining({ name: 'new' }),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-CSRFToken': 'csrf-token' }) }),
    )

    expect(client.delete).toHaveBeenCalledTimes(1)
    expect(client.delete).toHaveBeenCalledWith('/thing/thing/5/', expect.anything())

    expect(result.every((item) => item.apiOk)).toBe(true)
  })

  test('inserts an item that has an id but is flagged new', async () => {
    client.post.mockResolvedValue({ data: { id: 7 } })

    service.collection = [new Thing({ id: 7, name: 'n' })]
    service.collection[0].new = true

    await service.updateCollection()

    expect(client.post).toHaveBeenCalledTimes(1)
    expect(client.patch).not.toHaveBeenCalled()
  })

  test('a failing update marks the item and rethrows', async () => {
    client.patch.mockRejectedValue(new Error('boom'))
    service.collection = [new Thing({ id: 1, name: 'x' })]

    await expect(service.updateCollection()).rejects.toThrow(/boom/)
    expect(service.collection[0].apiOk).toBe(false)
    expect(service.collection[0].error).toBeInstanceOf(Error)
  })

  test('a failing insert stops the run and rethrows', async () => {
    client.post.mockRejectedValue(new Error('nope'))
    service.collection = [new Thing({ name: 'a' }), new Thing({ name: 'b' })]

    await expect(service.updateCollection()).rejects.toThrow(/nope/)
    // The loop throws on the first failure, so the second item is never sent.
    expect(client.post).toHaveBeenCalledTimes(1)
  })

  test('emptyCollection deletes every item that has an id', async () => {
    client.delete.mockResolvedValue({ data: {} })
    service.collection = [new Thing({ id: 1 }), new Thing({ name: 'unsaved' }), new Thing({ id: 3 })]

    await service.emptyCollection()

    expect(client.delete).toHaveBeenCalledTimes(2)
    expect(client.delete).toHaveBeenCalledWith('/thing/thing/1/', expect.anything())
    expect(client.delete).toHaveBeenCalledWith('/thing/thing/3/', expect.anything())
  })
})

describe('loadCollection', () => {
  test('maps results into model instances and resets the change state', async () => {
    client.get.mockResolvedValue({
      data: { count: 2, num_pages: 1, results: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] },
    })
    service.collectionHasChanges = true
    service.deletedItems = [new Thing({ id: 9 })]

    await service.loadCollection()

    expect(client.get).toHaveBeenCalledWith('/thing/thing/?page=1')
    expect(service.collection).toHaveLength(2)
    expect(service.collection[0]).toBeInstanceOf(Thing)
    expect(service.count).toBe(2)
    expect(service.numPages).toBe(1)
    expect(service.collectionHasChanges).toBe(false)
    expect(service.deletedItems).toEqual([])
  })
})

describe('preInsert / preUpdate', () => {
  test('preInsert strips created and modified', () => {
    expect(service.preInsert({ id: 1, created: 'x', modified: 'y', name: 'a' }))
      .toEqual({ id: 1, name: 'a' })
  })

  test('preUpdate strips created and modified', () => {
    expect(service.preUpdate({ id: 1, created: 'x', modified: 'y', name: 'a' }))
      .toEqual({ id: 1, name: 'a' })
  })
})

describe('getHeaders', () => {
  test('includes the CSRF token when given one', () => {
    expect(service.getHeaders('abc').headers).toEqual({
      'X-CSRFToken': 'abc',
      'Content-Type': 'application/json',
    })
  })

  test('omits it otherwise', () => {
    expect(service.getHeaders().headers).toEqual({ 'Content-Type': 'application/json' })
  })
})
