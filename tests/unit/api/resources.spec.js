import { describe, expect, test, vi } from 'vitest'

import * as Api from '@/services/api-client'
import {
  companyBranchMyRetrieveOptions,
  customerCustomerListOptions,
  orderOrderAssignMeCreateMutation,
  orderOrderRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import { vOrderOrderCreateBody } from '@/api/valibot.gen'

/**
 * What a generated resource answers with, pinned through the public `Api`
 * names so the shape of `resources.gen.ts` can change underneath it.
 *
 * hey-api keys each query `[{_id, baseURL, path?, query?}]`, so the key is
 * where the request a set of options would make is visible without sending it.
 */
const keyOf = (options) => options.queryKey[0]

describe('the bindings', () => {
  test('carry the generated functions and schemas themselves', () => {
    expect(Api.OrderOrder.path).toBe('api/order/order')
    expect(Api.OrderOrder.kind).toBe('collection')
    expect(Api.OrderOrder.id).toBe('string')
    expect(Api.OrderOrder.retrieve.options).toBe(orderOrderRetrieveOptions)
    expect(Api.OrderOrder.create.body).toBe(vOrderOrderCreateBody)
    expect(Api.OrderOrder.extras.assignMeCreate.mutation).toBe(orderOrderAssignMeCreateMutation)
    expect(Api.CompanyBranchMy.kind).toBe('singleton')
  })

  test('are enumerable data, so a resource can be inspected and spread', () => {
    expect(Object.keys(Api.CustomerCustomer)).toEqual(
      expect.arrayContaining(['path', 'kind', 'id', 'list', 'retrieve', 'create', 'update', 'destroy', 'reads']),
    )
  })
})

describe('listOptions', () => {
  test('sends the four page parameters and drops an empty search and sort', () => {
    const options = Api.CustomerCustomer.listOptions({page: 2, page_size: 20, q: '', ordering: []})

    expect(keyOf(options)._id).toBe(keyOf(customerCustomerListOptions())._id)
    expect(keyOf(options).query).toEqual({page: 2, page_size: 20})
  })

  test('sends the endpoint\'s own filters that hold a value, and nothing else', () => {
    const options = Api.CustomerCustomer.listOptions({
      page: 1,
      page_size: 20,
      q: 'acme',
      ordering: ['-name'],
      city: 'Utrecht',
      name: '',
      num_orders: 3,
      not_a_filter: 'x',
      contact: {},
    })

    expect(keyOf(options).query).toEqual({
      page: 1,
      page_size: 20,
      q: 'acme',
      ordering: ['-name'],
      city: 'Utrecht',
      num_orders: '3',
    })
  })

  test('sends only the named subset when a screen names one', () => {
    const options = Api.CustomerCustomer.listOptions({page: 1, page_size: 20, city: 'Utrecht', name: 'x'}, ['name'])

    expect(keyOf(options).query).toEqual({page: 1, page_size: 20, name: 'x'})
  })

  test('exists only where a table can page the list', () => {
    expect(Api.CompanyBranchMy.listOptions).toBeUndefined()
  })
})

describe('retrieveOptions', () => {
  test('puts an integer id in the path', () => {
    expect(keyOf(Api.CustomerCustomer.retrieveOptions(7)).path).toEqual({id: 7})
  })

  test('stringifies the id of a resource DRF declares by string', () => {
    expect(keyOf(Api.OrderOrder.retrieveOptions('12')).path).toEqual({id: '12'})
  })

  test('takes no id for a singleton', () => {
    const options = Api.CompanyBranchMy.retrieveOptions()

    expect(keyOf(options)._id).toBe(keyOf(companyBranchMyRetrieveOptions())._id)
    expect(keyOf(options).path).toBeUndefined()
  })
})

describe('invalidate', () => {
  test('invalidates every read under the resource\'s path, by query-key id', async () => {
    const queryClient = {invalidateQueries: vi.fn().mockResolvedValue(undefined)}

    await Api.CustomerCustomer.invalidate(queryClient)

    expect(queryClient.invalidateQueries.mock.calls.map(([filters]) => filters)).toEqual(
      Api.CustomerCustomer.reads.map((_id) => ({queryKey: [{_id}]})),
    )
    expect(Api.CustomerCustomer.reads).toContain('customerCustomerList')
    expect(Api.CustomerCustomer.reads).toContain('customerCustomerRetrieve')
  })
})
