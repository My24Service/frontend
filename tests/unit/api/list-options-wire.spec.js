import { describe, expect, test } from 'vitest'

import * as Api from '@/services/api-client'

import { paginated } from '../helpers/schema-fixture.js'
import { installApiSeam } from '../support/api-seam/index.js'

/**
 * A column filter reaches the wire as the type its query schema declares.
 *
 * The generated `*ListOptions` parse the query with the valibot schema before
 * sending, so a filter that `listOptions` turned into a string threw
 * `Expected number but received "7"` for an integer parameter and no request
 * went out. These specs run the options' `queryFn` against the API seam, so
 * what is asserted is the request that would be sent, not the options' shape.
 */
const api = installApiSeam()

const fetchList = (options) =>
  options.queryFn({ queryKey: options.queryKey, signal: new AbortController().signal })

describe('listOptions and an integer filter', () => {
  test('sends a number for an integer parameter', async () => {
    api.get('/api/inventory/material/', paginated([]))

    await fetchList(Api.InventoryMaterial.listOptions({ page: 1, page_size: 1000, supplier_relation: 7 }))

    expect(api.requests()).toEqual([
      expect.objectContaining({
        path: '/api/inventory/material/',
        query: { page: '1', page_size: '1000', supplier_relation: '7' },
      }),
    ])
  })

  test('reads the numeric string a URL hands over as a number', async () => {
    api.get('/api/inventory/material/', paginated([]))

    await fetchList(Api.InventoryMaterial.listOptions({ page: 1, page_size: 20, supplier_relation: '7' }))

    expect(api.requests()[0].query).toEqual({ page: '1', page_size: '20', supplier_relation: '7' })
  })

  test('drops a value an integer parameter cannot hold, rather than throwing', () => {
    const options = Api.InventoryMaterial.listOptions({ page: 1, page_size: 20, supplier_relation: 'abc' })

    expect(options.queryKey[0].query).toEqual({ page: 1, page_size: 20 })
  })

  test('keeps a number a number in the request options', () => {
    const options = Api.InventoryMaterial.listOptions({ page: 1, page_size: 20, supplier_relation: 7 })

    expect(options.queryKey[0].query.supplier_relation).toBe(7)
  })
})
