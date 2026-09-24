import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { ModuleList } from '@/features/member'
import { vPaginatedModuleList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { addFilter, editorInput } from '../../support/column-filters.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { toasts } from '../../support/form-harness.js'
import { mountList, rowTexts, serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

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

function seedUrl(queryString) {
  window.history.replaceState(null, '', `/#/?${queryString}`)
}

function resetUrl() {
  window.history.replaceState(null, '', '/')
}

beforeEach(() => {
  resetUrl()
  api.get('/api/member/module/', modulePage())
  api.delete('/api/member/module/{id}/', noContent)
})

afterEach(() => {
  resetUrl()
})

describe('ModuleList, wire contract', () => {
  test('the initial load sends the page and the page size, and nothing else', async () => {
    await mountList(ModuleList, SUPERUSER)

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/module/',
      query: { page: '1', page_size: '20' },
    })
  })

  test('shows a row for every module the backend returned', async () => {
    const wrapper = await mountList(ModuleList, SUPERUSER)

    expect(rowTexts(wrapper).length).toBe(3)
    expect(rowTexts(wrapper)[1]).toContain('Inspection')
  })

  test('renders the original columns in the original widths', async () => {
    const wrapper = await mountList(ModuleList, SUPERUSER)

    const widths = wrapper.findAll('colgroup col').map((col) => col.attributes('style'))
    expect(widths).toEqual([
      'width: 70%;',
      'width: 10%;',
      'width: 10%;',
      'width: 10%;',
    ])
  })

  test('carries both the edit and the delete icon per row', async () => {
    const wrapper = await mountList(ModuleList, SUPERUSER)

    expect(wrapper.findAll('a[title="Edit"]').length).toBe(3)
    expect(wrapper.findAll('button[title="Delete"]').length).toBe(3)
  })

  test('a sort click sorts the wire through the ordering allow-list', async () => {
    const wrapper = await mountList(ModuleList, SUPERUSER)

    await wrapper.get('th[aria-label="Sort by name"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toEqual({
      page: '1',
      page_size: '20',
      ordering: 'name',
    })
  })
})

describe('ModuleList search and pagination', () => {
  test('the toolbar search commits the term to the wire', async () => {
    const wrapper = await mountList(ModuleList, SUPERUSER)

    await wrapper.get('input[aria-label="Search modules"]').setValue('clean')
    await pastDebounce()

    expect(api.requests().at(-1).query).toMatchObject({ q: 'clean' })
  })

  test('the next-page button asks for page two', async () => {
    const wrapper = await mountList(ModuleList, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', page_size: '20' })
  })
})

describe('ModuleList URL mirroring', () => {
  test('a shared address restores the view, page included, before the first request', async () => {
    seedUrl('q=clean&ordering=-created&page=2')

    const wrapper = await mountList(ModuleList, SUPERUSER)

    expect(api.requests().at(-1).query).toEqual({
      page: '2',
      page_size: '20',
      q: 'clean',
      ordering: '-created',
    })
    expect(wrapper.get('input[aria-label="Search modules"]').element.value).toBe('clean')
  })

  test('the restored page survives the search debounce', async () => {
    seedUrl('q=clean&page=2')
    await mountList(ModuleList, SUPERUSER)

    await pastDebounce()

    const pages = api.requests().filter((sent) => sent.method === 'get').map((sent) => sent.query.page)
    expect(pages).toEqual(['2'])
  })

  test('a page change writes the address bar', async () => {
    const wrapper = await mountList(ModuleList, SUPERUSER)

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(window.location.hash).toContain('page=2')
  })
})

describe('ModuleList loading, empty and error states', () => {
  test('says so when the backend returned nothing', async () => {
    api.get('/api/member/module/', paginated([]))
    const wrapper = await mountList(ModuleList, SUPERUSER)

    expect(wrapper.text()).toContain('No modules found')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/module/', serverError)

    await mountList(ModuleList, SUPERUSER)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading modules')
  })
})

describe('ModuleList delete', () => {
  test('deletes through the confirmation modal and refetches', async () => {
    const wrapper = await mountList(ModuleList, SUPERUSER)

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
    const wrapper = await mountList(ModuleList, SUPERUSER)

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })
})

describe('ModuleList column filters', () => {
  test('the Name filter rides the wire under its bare column name', async () => {
    const wrapper = await mountList(ModuleList, SUPERUSER)
    await settle()

    await addFilter(wrapper, 'Name')
    await editorInput(wrapper, 'name').setValue('Cleanup')
    // The kit commits the search and the filters on a 300 ms debounce.
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({name: 'Cleanup'})
  })
})
