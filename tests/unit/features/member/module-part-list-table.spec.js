import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ModulePartListTable } from '@/features/member'
import { vPaginatedModulePartList } from '@/api/valibot.gen'

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
 * ModulePartListTable — the TanStack Table prototype of the Module Part list.
 * The columns mirror the original exactly, including the always-selected
 * checkmark cell; the toolbar that the original kept inside the table's
 * icons header (unfinished styling) is the standard header here. The schema
 * declares only page/page_size/q, so a sort click never changes the wire.
 */

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedModulePartList)

const SUPERUSER = { auth: { isSuperuser: true } }

function modulePartPage({ count = 30 } = {}) {
  return paginated(
    ['Windows', 'Doors', 'Frames'].map((name, index) =>
      fixtureFor(ITEM, {
        id: index + 21,
        name,
        module_name: index === 0 ? 'Cleaning' : 'Inspection',
        is_always_selected: index === 0,
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
  api.get('/api/member/module-part/', modulePartPage())
  api.delete('/api/member/module-part/{id}/', noContent)
})

describe('ModulePartListTable, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountList(ModulePartListTable, SUPERUSER)

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/module-part/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every module part the backend returned', async () => {
    const wrapper = await mountList(ModulePartListTable, SUPERUSER)

    expect(rowTexts(wrapper).length).toBe(3)
    expect(rowTexts(wrapper)[0]).toContain('Windows')
    expect(rowTexts(wrapper)[0]).toContain('Cleaning')
  })

  test('renders the original columns in the original widths', async () => {
    const wrapper = await mountList(ModulePartListTable, SUPERUSER)

    const widths = wrapper.findAll('colgroup col').map((col) => col.attributes('style'))
    expect(widths).toEqual([
      'width: 30%;',
      'width: 20%;',
      'width: 20%;',
      'width: 10%;',
      'width: 10%;',
      'width: 10%;',
    ])
  })

  test('the always-selected cell shows a checkmark for true and nothing for false', async () => {
    const wrapper = await mountList(ModulePartListTable, SUPERUSER)

    const rows = wrapper.findAll('tbody tr')
    expect(rows[0].find('svg.checkmark').exists()).toBe(true)
    expect(rows[1].find('svg.checkmark').exists()).toBe(false)
  })

  test('a sort click never changes the wire', async () => {
    const wrapper = await mountList(ModulePartListTable, SUPERUSER)
    const requestsAfterLoad = api.requests().length

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(api.requests().length).toBe(requestsAfterLoad)
  })
})

describe('ModulePartListTable search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountList(ModulePartListTable, SUPERUSER)

    await wrapper.get('input[aria-label="Search module parts"]').setValue('window')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'window' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountList(ModulePartListTable, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('ModulePartListTable loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/member/module-part/', paginated([]))
    const wrapper = await mountList(ModulePartListTable, SUPERUSER)

    expect(wrapper.text()).toContain('No module parts found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/module-part/', serverError)

    await mountList(ModulePartListTable, SUPERUSER)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading module parts')
  })
})

describe('ModulePartListTable delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountList(ModulePartListTable, SUPERUSER)

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-module-part-modal').ok()
    await settle()

    const deleteSent = api.requests().find((sent) => sent.method === 'delete')
    expect(deleteSent).toMatchObject({ path: '/api/member/module-part/21/' })
    expect(toasts().map((toast) => toast.body)).toContain('Module part has been deleted')
    const listFetches = api.requests().filter((sent) => sent.method === 'get')
    expect(listFetches.length).toBeGreaterThan(1)
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountList(ModulePartListTable, SUPERUSER)

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})
