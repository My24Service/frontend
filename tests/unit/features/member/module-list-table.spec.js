import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ModuleListTable } from '@/features/member'
import { vPaginatedModuleList } from '@/api/valibot.gen'

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
 * ModuleListTable — the TanStack Table prototype of the Module list. The
 * columns mirror the original exactly; the toolbar that the original kept
 * inside the table's icons header (unfinished styling) is the standard
 * header here. The schema declares only page/page_size/q, so a sort click
 * never changes the wire.
 */

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedModuleList)

const SUPERUSER = { auth: { isSuperuser: true } }

function modulePage({ count = 30 } = {}) {
  return paginated(
    ['Cleaning', 'Inspection', 'Maintenance'].map((name, index) =>
      fixtureFor(ITEM, {
        id: index + 11,
        name,
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
  api.get('/api/member/module/', modulePage())
  api.delete('/api/member/module/{id}/', noContent)
})

describe('ModuleListTable, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountList(ModuleListTable, SUPERUSER)

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/module/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every module the backend returned', async () => {
    const wrapper = await mountList(ModuleListTable, SUPERUSER)

    expect(rowTexts(wrapper).length).toBe(3)
    expect(rowTexts(wrapper)[1]).toContain('Inspection')
  })

  test('renders the original columns in the original widths', async () => {
    const wrapper = await mountList(ModuleListTable, SUPERUSER)

    const widths = wrapper.findAll('colgroup col').map((col) => col.attributes('style'))
    expect(widths).toEqual([
      'width: 70%;',
      'width: 10%;',
      'width: 10%;',
      'width: 10%;',
    ])
  })

  test('carries both the edit and the delete icon per row', async () => {
    const wrapper = await mountList(ModuleListTable, SUPERUSER)

    expect(wrapper.findAll('a[title="Edit"]').length).toBe(3)
    expect(wrapper.findAll('button[title="Delete"]').length).toBe(3)
  })

  test('a sort click sorts the wire through the ordering allow-list', async () => {
    const wrapper = await mountList(ModuleListTable, SUPERUSER)

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toEqual({
      page: '1',
      page_size: '20',
      ordering: 'name',
    })
  })
})

describe('ModuleListTable search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountList(ModuleListTable, SUPERUSER)

    await wrapper.get('input[aria-label="Search modules"]').setValue('clean')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'clean' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountList(ModuleListTable, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('ModuleListTable loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/member/module/', paginated([]))
    const wrapper = await mountList(ModuleListTable, SUPERUSER)

    expect(wrapper.text()).toContain('No modules found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/module/', serverError)

    await mountList(ModuleListTable, SUPERUSER)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading modules')
  })
})

describe('ModuleListTable delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountList(ModuleListTable, SUPERUSER)

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-module-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/member/module/11/' })
    expect(toasts().map((toast) => toast.body)).toContain('Module has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountList(ModuleListTable, SUPERUSER)

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
