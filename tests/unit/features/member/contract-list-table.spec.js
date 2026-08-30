import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ContractListTable } from '@/features/member'
import { vPaginatedContractList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { toasts } from '../../support/form-harness.js'
import { mountList, rowTexts, serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * ContractListTable — the TanStack Table prototype of the Contract list.
 *
 * The schema declares only page/page_size/q, so the wire claims are narrow
 * and deliberate: the initial load, the search term, the page state — and
 * never a sort (the original's b-table sorted the loaded page locally; no
 * ordering parameter exists). The columns mirror the original exactly.
 */

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedContractList)

const SUPERUSER = { auth: { isSuperuser: true } }

function contractPage({ count = 30 } = {}) {
  return paginated(
    ['Support', 'Maintenance', 'All-in'].map((name, index) =>
      fixtureFor(ITEM, {
        id: index + 7,
        name,
        modules_text: index === 0 ? 'Cleaning, Inspection' : '',
        created: '2026-01-0' + (index + 1),
        modified: '2026-02-0' + (index + 1),
      }),
    ),
    { count },
  )
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

beforeEach(() => {
  api.get('/api/member/contract/', contractPage())
  api.delete('/api/member/contract/{id}/', noContent)
})

describe('ContractListTable, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountList(ContractListTable, SUPERUSER)

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/contract/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every contract the backend returned', async () => {
    const wrapper = await mountList(ContractListTable, SUPERUSER)

    expect(rowTexts(wrapper).length).toBe(3)
    expect(rowTexts(wrapper)[0]).toContain('Support')
  })

  test('renders the original columns in the original widths', async () => {
    const wrapper = await mountList(ContractListTable, SUPERUSER)

    const widths = wrapper.findAll('colgroup col').map((col) => col.attributes('style'))
    expect(widths).toEqual([
      'width: 20%;',
      'width: 50%;',
      'width: 10%;',
      'width: 10%;',
      'width: 10%;',
    ])
    expect(rowTexts(wrapper)[0]).toContain('Cleaning, Inspection')
  })

  test('carries both the edit and the delete icon per row', async () => {
    const wrapper = await mountList(ContractListTable, SUPERUSER)

    expect(wrapper.findAll('a[title="Edit"]').length).toBe(3)
    expect(wrapper.findAll('button[title="Delete"]').length).toBe(3)
  })
})

describe('ContractListTable sorting', () => {
  test('a sort click never changes the wire', async () => {
    // The original sorted the loaded page locally; the schema declares no
    // ordering parameter, so the sorted request cannot ride the wire.
    const wrapper = await mountList(ContractListTable, SUPERUSER)
    const requestsAfterLoad = api.requests().length

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(api.requests().length).toBe(requestsAfterLoad)
  })
})

describe('ContractListTable search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountList(ContractListTable, SUPERUSER)

    await wrapper.get('input[aria-label="Search contracts"]').setValue('support')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'support' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountList(ContractListTable, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('ContractListTable loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/member/contract/', paginated([]))
    const wrapper = await mountList(ContractListTable, SUPERUSER)

    expect(wrapper.text()).toContain('No contracts found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/contract/', serverError)

    await mountList(ContractListTable, SUPERUSER)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading contracts')
  })
})

describe('ContractListTable delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountList(ContractListTable, SUPERUSER)

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-contract-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/member/contract/7/' })
    expect(toasts().map((toast) => toast.body)).toContain('Contract has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountList(ContractListTable, SUPERUSER)

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
