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

  test('deleteCollectionItemByid removes by id and marks the collection changed', () => {
    service.collection = [new Thing({ id: 1 }), new Thing({ id: 2 }), new Thing({ id: 3 })]

    service.deleteCollectionItemByid(2)

    expect(service.collection.map((t) => t.id)).toEqual([1, 3])
    expect(service.deletedItems.map((t) => t.id)).toEqual([2])
    expect(service.collectionHasChanges).toBe(true)
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

  test('cancelEdit clears the edit state, via emptyCollectionItem', () => {
    // Start from a non-null editPk so a no-op emptyCollectionItem (the
    // implementation cancelEdit delegates to) would be visible here rather
    // than editPk merely staying at its already-null default.
    service.editCollectionItem(new Thing({ id: 1 }), 0)
    service.editPk = 42

    service.cancelEdit()

    expect(service.isEdit).toBe(false)
    expect(service.editPk).toBeNull()
    expect(service.editItem).toBeInstanceOf(Thing)
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

describe('direct edit and insert', () => {
  test('doDirectEditCollectionItem patches the edit item and resets edit state', async () => {
    client.patch.mockResolvedValue({ data: { id: 1, name: 'saved' } })
    service.editItem = new Thing({ id: 1, name: 'saved' })
    service.isEdit = true
    service.editIndex = 0

    await service.doDirectEditCollectionItem()

    expect(client.patch).toHaveBeenCalledWith('/thing/thing/1/', expect.objectContaining({ id: 1 }))
    expect(service.isEdit).toBe(false)
    expect(service.editIndex).toBeNull()
    expect(service.editPk).toBeNull()
  })

  test('addDirectCollectionItem inserts the edit item, resets edit state and returns the new model', async () => {
    client.post.mockResolvedValue({ data: { id: 42, name: 'created' } })
    service.editItem = new Thing({ name: 'created' })

    const result = await service.addDirectCollectionItem()

    expect(client.post).toHaveBeenCalledWith(
      '/thing/thing/',
      expect.objectContaining({ name: 'created' }),
      expect.anything(),
    )
    expect(result).toEqual({ id: 42, name: 'created' })
    expect(service.editPk).toBeNull()
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

// getHeaders is covered in base-misc.spec.js - it's not collection-specific.
