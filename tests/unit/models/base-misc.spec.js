import { beforeEach, describe, expect, test, vi } from 'vitest'

import BaseModel from '@/models/base'

// Same seam as base-collection.spec.js: BaseModel holds axios in an instance
// field, so a fake goes straight onto the instance.
//
// Collection-editing/updateCollection/direct-edit behaviour lives in
// base-collection.spec.js, which already has the ThingService + client
// fixtures for that. This file is for the rest of BaseModel: defaults,
// standalone helper methods, and list()'s own request/response handling.
function fakeClient() {
  return {
    get: vi.fn(),
  }
}

class Thing {
  id
  name

  constructor(data = {}) {
    Object.assign(this, data)
  }
}

class ThingService extends BaseModel {
  model = Thing
  url = '/thing/thing/'
}

describe('BaseModel defaults', () => {
  test('starts with the documented empty/false defaults', () => {
    const model = new BaseModel()

    expect(model.url).toBe('')
    expect(model.collection).toEqual([])
    expect(model.deletedItems).toEqual([])
    expect(model.isEdit).toBe(false)
    expect(model.sortOrder).toBe('asc')
  })
})

describe('newEditItem', () => {
  test('uses modelDefaults when called without data', () => {
    class RecordingModel {
      constructor(data) {
        this.received = data
      }
    }

    const model = new BaseModel()
    model.model = RecordingModel
    model.modelDefaults = { foo: 'bar' }

    model.newEditItem()

    expect(model.editItem.received).toBe(model.modelDefaults)
  })

  test('uses the given data instead of modelDefaults when data is passed', () => {
    class RecordingModel {
      constructor(data) {
        this.received = data
      }
    }

    const model = new BaseModel()
    model.model = RecordingModel
    model.modelDefaults = { foo: 'bar' }

    model.newEditItem({ baz: 'qux' })

    expect(model.editItem.received).toEqual({ baz: 'qux' })
  })
})

describe('setComponent', () => {
  test('stores the given component', () => {
    const model = new BaseModel()
    const component = { some: 'component' }

    model.setComponent(component)

    expect(model.component).toBe(component)
  })
})

describe('resetListArgs', () => {
  test('empties the list args', () => {
    const model = new BaseModel()
    model.addListArg('customer=12')

    model.resetListArgs()

    expect(model.listArgs).toEqual([])
  })
})

describe('getHeaders', () => {
  test('includes the CSRF token when given one', () => {
    const model = new BaseModel()

    expect(model.getHeaders('abc').headers).toEqual({
      'X-CSRFToken': 'abc',
      'Content-Type': 'application/json',
    })
  })

  test('omits the CSRF header entirely when no token is given, rather than setting it to undefined', () => {
    const model = new BaseModel()

    // toStrictEqual (unlike toEqual) distinguishes a key explicitly set to
    // undefined from a key that is absent, which is exactly the difference
    // between the real branch and a mutant that always takes the token path.
    expect(model.getHeaders()).toStrictEqual({
      headers: { 'Content-Type': 'application/json' },
    })
  })
})

describe('list', () => {
  let service
  let client

  beforeEach(() => {
    client = fakeClient()
    service = new ThingService()
    service.axios = client
  })

  test('joins multiple query params with "&"', async () => {
    client.get.mockResolvedValue({ data: { results: [] } })
    service.setUserFilter('7')
    service.setSort('name')

    await service.list()

    expect(client.get).toHaveBeenCalledWith('/thing/thing/?page=1&user_filter=7&order_by=name')
  })

  test('leaves count and numPages untouched when the response omits them', async () => {
    client.get.mockResolvedValue({ data: { results: [] } })
    service.count = 3
    service.numPages = 2

    await service.list()

    expect(service.count).toBe(3)
    expect(service.numPages).toBe(2)
  })

  test('picks up count and numPages when the response includes them', async () => {
    client.get.mockResolvedValue({ data: { count: 9, num_pages: 4, results: [] } })

    await service.list()

    expect(service.count).toBe(9)
    expect(service.numPages).toBe(4)
  })
})
