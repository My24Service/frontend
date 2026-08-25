import { beforeEach, describe, expect, test, vi } from 'vitest'

import ContractList from '@/views/member/ContractList.vue'
import contractModel from '@/models/member/Contract.js'
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
  useFreshModel,
} from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * ContractList as it behaves today, before the Slice rewrites it (#319).
 *
 * Requests are asserted against `tests/unit/golden/contract-list.json`,
 * recorded from the running application against a development tenant; see
 * tests/unit/golden/README.md. Everything else is what a user can see and do.
 */

const api = installApiSeam()
const goldens = goldensFor('contract-list')

const ITEM = itemSchemaOf(vPaginatedContractList)

function contractPage(names = ['Basic', 'Premium']) {
  return paginated(
    // Id 34 first, because the recorded delete golden names
    // /api/member/contract/34/ - the contract the capture deleted.
    names.map((name, index) => fixtureFor(ITEM, { id: index + 34, name })),
    { count: 45 },
  )
}

useFreshModel(contractModel)

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
})

describe('ContractList search', () => {
  // Searched for "a" rather than "premium" because that is what this capture
  // typed - the reload before it, and the search itself, are both in the file.
  goldenTest(goldens, 'search', 'contract-list', async () => {
    const wrapper = await mountList(ContractList)

    await openSearch(wrapper)
    modal('search-modal').type('a')
    modal('search-modal').ok()
    await settle()

    return api.requests()
  })

  test('shows what the search came back with', async () => {
    const wrapper = await mountList(ContractList)
    api.get('/api/member/contract/', contractPage(['Premium']))

    await openSearch(wrapper)
    modal('search-modal').type('premium')
    modal('search-modal').ok()
    await settle()

    expect(rowTexts(wrapper).length).toBe(1)
    expect(rowTexts(wrapper)[0]).toContain('Premium')
  })

  goldenTest(goldens, 'search surviving a page change', 'contract-list', async () => {
    const wrapper = await mountList(ContractList)

    await openSearch(wrapper)
    modal('search-modal').type('premium')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    await mountList(ContractList, { query: wrapper.vm.$route.query })

    return api.requests()
  })

  test('still asks for the search term after a page change', async () => {
    const wrapper = await mountList(ContractList)

    await openSearch(wrapper)
    modal('search-modal').type('premium')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    await mountList(ContractList, { query: wrapper.vm.$route.query })

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', q: 'premium' })
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
