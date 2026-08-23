import { beforeEach, describe, expect, test, vi } from 'vitest'

import BaseModel from '@/models/base'

// Same seam as base-collection.spec.js: BaseModel holds axios in an instance
// field, so a fake goes straight onto the instance.
class ThingService extends BaseModel {
  url = '/thing/thing/'
}

let service
let client

function page(results) {
  return { data: { count: results.length, results } }
}

beforeEach(() => {
  client = { get: vi.fn() }
  service = new ThingService()
  service.axios = client
})

describe('BaseModel.getSelectOptions', () => {
  test('maps a page of results to value/text pairs', async () => {
    client.get.mockResolvedValue(page([
      { id: 1, name: 'Planning' },
      { id: 2, name: 'Invoicing' },
    ]))

    expect(await service.getSelectOptions()).toEqual([
      { value: 1, text: 'Planning' },
      { value: 2, text: 'Invoicing' },
    ])
  })

  test('keeps the list order', async () => {
    client.get.mockResolvedValue(page([
      { id: 9, name: 'Zulu' },
      { id: 3, name: 'Alpha' },
    ]))

    expect((await service.getSelectOptions()).map((o) => o.value)).toEqual([9, 3])
  })

  test('returns an empty list when there are no results', async () => {
    client.get.mockResolvedValue(page([]))

    expect(await service.getSelectOptions()).toEqual([])
  })

  test('takes the fields to read from', async () => {
    client.get.mockResolvedValue(page([
      { code: 'nl', label: 'Netherlands' },
    ]))

    expect(await service.getSelectOptions({ valueField: 'code', textField: 'label' })).toEqual([
      { value: 'nl', text: 'Netherlands' },
    ])
  })

  // It goes through list(), so the query args a caller has set still apply.
  test('honours the query args set on the model', async () => {
    client.get.mockResolvedValue(page([]))
    service.setListArgs('module=7')

    await service.getSelectOptions()

    expect(client.get.mock.calls[0][0]).toContain('module=7')
  })

  test('propagates a failed list rather than swallowing it', async () => {
    client.get.mockRejectedValue(new Error('boom'))

    await expect(service.getSelectOptions()).rejects.toThrow('boom')
  })
})
