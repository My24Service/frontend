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

describe('listOptions and the other wire types', () => {
  const query = (resource, filters) => resource.listOptions({ page: 1, page_size: 20, ...filters }).queryKey[0].query

  test('drops what is not an integer, rather than sending something the validator throws on', () => {
    for (const value of ['7.5', ' ', 'abc', '1e3', '0x1F']) {
      expect(query(Api.InventoryMaterial, { supplier_relation: value })).toEqual({ page: 1, page_size: 20 })
    }
  })

  test('keeps a string parameter a string, a numeric-looking one included', () => {
    expect(query(Api.EquipmentEquipment, { name: '123', num_orders: '4' })).toEqual({
      page: 1, page_size: 20, name: '123', num_orders: '4',
    })
  })

  test('sends a union or picklist parameter as a string', () => {
    expect(query(Api.EquipmentEquipment, { branch: 7, type: 'facility' })).toEqual({
      page: 1, page_size: 20, branch: '7', type: 'facility',
    })
  })

  test('sends a boolean for a boolean parameter, from a flag or its URL spelling', () => {
    expect(query(Api.MemberMember, { is_deleted: 'true', is_requested: 'false' })).toMatchObject({
      is_deleted: true, is_requested: false,
    })
    expect(query(Api.MemberMember, { is_deleted: true })).toMatchObject({ is_deleted: true })
  })

  test('a boolean filter reaches the wire', async () => {
    api.get('/api/member/member/', paginated([]))

    await fetchList(Api.MemberMember.listOptions({ page: 1, page_size: 20, is_deleted: 'false' }))

    expect(api.requests()[0].query).toEqual({ page: '1', page_size: '20', is_deleted: 'false' })
  })
})
