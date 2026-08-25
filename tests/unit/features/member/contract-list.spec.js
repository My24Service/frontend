import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ContractList } from '@/features/member'
import { vPaginatedContractList } from '@/api/valibot.gen'

import { goldenTest, goldensFor } from '../../helpers/golden.js'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { toasts } from '../../support/form-harness.js'
import {
  goToPage,
  mountList,
  openDelete,
  openSearch,
  rowTexts,
  serverError,
} from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * ContractList, rewritten into the feature folder (#323).
 *
 * The tracer bullet's list pattern on its third resource: reads through the
 * generated query options keyed reactively off the route's `page` and `q`,
 * writes through the generated mutation with every list variant invalidated
 * (the choice that covers the assignment dropdown is commented on the helper).
 * Requests are asserted against `tests/unit/golden/contract-list.json`,
 * recorded before the rewrite; everything else is what a user can see and do.
 */

const api = installApiSeam()
const goldens = goldensFor('contract-list')

const ITEM = itemSchemaOf(vPaginatedContractList)

/** Two pages' worth, so the pagination control renders at all. */
function contractPage(names = ['Basic', 'Premium']) {
  return paginated(
    // Id 34 first, because the recorded delete golden names
    // /api/member/contract/34/ - the contract the capture deleted.
    names.map((name, index) => fixtureFor(ITEM, { id: index + 34, name })),
    { count: 45 },
  )
}

beforeEach(() => {
  api.get('/api/member/contract/', contractPage())
  api.delete('/api/member/contract/{id}/', noContent)
})

describe('ContractList, loading', () => {
  goldenTest(goldens, 'initial load', 'contract-list', async () => {
    await mountList(ContractList)
    return api.requests()
  })

  test('shows a row for every contract the backend returned', async () => {
    const wrapper = await mountList(ContractList)

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Basic')
    expect(rowTexts(wrapper)[1]).toContain('Premium')
  })

  test('keeps the loading spinner up until the list arrives', async () => {
    let release
    api.get('/api/member/contract/', () => new Promise((resolve) => { release = resolve }))

    const wrapper = await mountList(ContractList)

    expect(wrapper.find('#contract-table .spinner-border').exists()).toBe(true)
    expect(rowTexts(wrapper)).toEqual(['Loading...'])

    release(paginated([]))
    await settle()

    expect(wrapper.find('#contract-table .spinner-border').exists()).toBe(false)
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/contract/', serverError)

    await mountList(ContractList)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading contracts')
  })
})

describe('ContractList pagination', () => {
  test('asks the router for page two when page two is clicked', async () => {
    const wrapper = await mountList(ContractList)

    await goToPage(wrapper, 2)

    expect(wrapper.vm.$route.query).toEqual({ page: '2' })
  })

  goldenTest(goldens, 'page 2', 'contract-list', async () => {
    await mountList(ContractList, { query: { page: '2' } })
    return api.requests()
  })

  test('fetches page two when page two is clicked', async () => {
    const wrapper = await mountList(ContractList)

    await goToPage(wrapper, 2)

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/contract/',
      query: { page: '2' },
    })
  })
})

describe('ContractList search', () => {
  goldenTest(goldens, 'search', 'contract-list', async () => {
    const wrapper = await mountList(ContractList)

    await openSearch(wrapper)
    modal('search-modal').type('a')
    modal('search-modal').ok()
    await settle()

    return api.requests()
  })

  test('puts the search term in the URL', async () => {
    const wrapper = await mountList(ContractList)

    await openSearch(wrapper)
    modal('search-modal').type('a')
    modal('search-modal').ok()
    await settle()

    expect(wrapper.vm.$route.query).toEqual({ q: 'a' })
  })

  test('shows what the search came back with', async () => {
    const wrapper = await mountList(ContractList)
    api.get('/api/member/contract/', ({ query }) =>
      paginated(
        query.q ? contractPage(['Premium']).results : contractPage().results,
        { count: query.q ? 1 : 45 },
      ),
    )

    await openSearch(wrapper)
    modal('search-modal').type('a')
    modal('search-modal').ok()
    await settle()

    expect(rowTexts(wrapper).length).toBe(1)
    expect(rowTexts(wrapper)[0]).toContain('Premium')
  })

  goldenTest(goldens, 'search surviving a page change', 'contract-list', async () => {
    const wrapper = await mountList(ContractList)

    await openSearch(wrapper)
    modal('search-modal').type('a')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    await settle()

    return api.requests()
  })

  test('still asks for the search term after a page change', async () => {
    const wrapper = await mountList(ContractList)

    await openSearch(wrapper)
    modal('search-modal').type('a')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', q: 'a' })
  })

  test('drops the search term when the user searches for nothing', async () => {
    const wrapper = await mountList(ContractList, { query: { q: 'a' } })

    await openSearch(wrapper)
    modal('search-modal').type('')
    modal('search-modal').ok()
    await settle()

    expect(wrapper.vm.$route.query).toEqual({})
    expect(api.requests().at(-1).query).toMatchObject({ page: '1' })
    expect(api.requests().at(-1).query.q).toBeUndefined()
  })
})

describe('ContractList delete', () => {
  goldenTest(goldens, 'delete', 'contract-list', async () => {
    const wrapper = await mountList(ContractList)

    await openDelete(wrapper)
    modal('delete-contract-modal').ok()
    await settle()

    return api.requests()
  })

  test('re-fetches the page the user is on after deleting', async () => {
    const wrapper = await mountList(ContractList, { query: { page: '3' } })

    await openDelete(wrapper)
    modal('delete-contract-modal').ok()
    await settle()

    expect(api.requests().at(-1)).toMatchObject({
      method: 'get',
      path: '/api/member/contract/',
      query: { page: '3' },
    })
  })

  test('confirms the deletion to the user', async () => {
    const wrapper = await mountList(ContractList)

    await openDelete(wrapper)
    modal('delete-contract-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Contract has been deleted')
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountList(ContractList)

    await openDelete(wrapper)
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })

  test('tells the user when the delete fails', async () => {
    api.delete('/api/member/contract/{id}/', serverError)
    const wrapper = await mountList(ContractList)

    await openDelete(wrapper)
    modal('delete-contract-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error deleting contract')
  })
})
