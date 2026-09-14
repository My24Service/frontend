import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { ContractList } from '@/features/member'
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

function seedUrl(queryString) {
  window.history.replaceState(null, '', `/#/?${queryString}`)
}

function resetUrl() {
  window.history.replaceState(null, '', '/')
}

beforeEach(() => {
  resetUrl()
  api.get('/api/member/contract/', contractPage())
  api.delete('/api/member/contract/{id}/', noContent)
})

afterEach(() => {
  resetUrl()
})

describe('ContractList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountList(ContractList, SUPERUSER)

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/contract/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every contract the backend returned', async () => {
    const wrapper = await mountList(ContractList, SUPERUSER)

    expect(rowTexts(wrapper).length).toBe(3)
    expect(rowTexts(wrapper)[0]).toContain('Support')
  })

  test('renders the original columns in the original widths', async () => {
    const wrapper = await mountList(ContractList, SUPERUSER)

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
    const wrapper = await mountList(ContractList, SUPERUSER)

    expect(wrapper.findAll('a[title="Edit"]').length).toBe(3)
    expect(wrapper.findAll('button[title="Delete"]').length).toBe(3)
  })
})

describe('ContractList sorting', () => {
  test('a sort click sorts the wire through the ordering allow-list', async () => {
    const wrapper = await mountList(ContractList, SUPERUSER)

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toEqual({
      page: '1',
      page_size: '20',
      ordering: 'name',
    })
  })

  test('the derived modules_text column cannot sort', async () => {
    const wrapper = await mountList(ContractList, SUPERUSER)

    expect(wrapper.find('th[aria-label="Sort by modules_text"]').exists()).toBe(false)
    expect(wrapper.find('th[aria-label="Sort by name"]').exists()).toBe(true)
  })
})

describe('ContractList search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountList(ContractList, SUPERUSER)

    await wrapper.get('input[aria-label="Search contracts"]').setValue('support')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'support' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountList(ContractList, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('ContractList URL mirroring', () => {
  test('a shared address restores the view, page included, before the first request', async () => {
    seedUrl('q=support&ordering=-created&page=2')

    const wrapper = await mountList(ContractList, SUPERUSER)

    expect(api.requests().at(-1).query).toEqual({
      page: '2',
      page_size: '20',
      q: 'support',
      ordering: '-created',
    })
    expect(wrapper.get('input[aria-label="Search contracts"]').element.value).toBe('support')
  })

  test('the restored page survives the search debounce', async () => {
    seedUrl('q=support&page=2')
    await mountList(ContractList, SUPERUSER)

    await pastDebounce()

    const pages = api.requests().filter((sent) => sent.method === 'get').map((sent) => sent.query.page)
    expect(pages).toEqual(['2'])
  })

  test('a page change writes the address bar', async () => {
    const wrapper = await mountList(ContractList, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(window.location.hash).toContain('page=2')
  })
})

describe('ContractList loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/member/contract/', paginated([]))
    const wrapper = await mountList(ContractList, SUPERUSER)

    expect(wrapper.text()).toContain('No contracts found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/contract/', serverError)

    await mountList(ContractList, SUPERUSER)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading contracts')
  })
})

describe('ContractList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountList(ContractList, SUPERUSER)

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
    const wrapper = await mountList(ContractList, SUPERUSER)

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
