import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ModuleList } from '@/features/member'
import { vPaginatedModuleList } from '@/api/valibot.gen'

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
 * ModuleList, rewritten into the feature folder (#322).
 *
 * The tracer bullet's list pattern applied to a second resource: reads through
 * the generated query options keyed reactively off the route's `page` and `q`,
 * writes through the generated mutation with the list queries invalidated.
 * Requests are asserted against `tests/unit/golden/module-list.json`, recorded
 * before the rewrite (tests/unit/golden/README.md); everything else is what a
 * user can see and do.
 *
 * The screen holds no state of its own and keeps no model singleton, so the
 * cross-screen leak class the Module Part form suffered (#321) has nowhere to
 * come back from here either.
 */

const api = installApiSeam()
const goldens = goldensFor('module-list')

const ITEM = itemSchemaOf(vPaginatedModuleList)

/** Two pages' worth, so the pagination control renders at all. */
function modulePage(names = ['orders', 'invoices']) {
  return paginated(
    // Id 12 first, because the recorded delete golden names
    // /api/member/module/12/ - the module the capture deleted.
    names.map((name, index) => fixtureFor(ITEM, { id: index + 12, name })),
    { count: 45 },
  )
}

beforeEach(() => {
  api.get('/api/member/module/', modulePage())
  api.delete('/api/member/module/{id}/', noContent)
})

describe('ModuleList, loading', () => {
  goldenTest(goldens, 'initial load', 'module-list', async () => {
    await mountList(ModuleList)
    return api.requests()
  })

  test('shows a row for every module the backend returned', async () => {
    const wrapper = await mountList(ModuleList)

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('orders')
    expect(rowTexts(wrapper)[1]).toContain('invoices')
  })

  test('keeps the loading spinner up until the list arrives', async () => {
    let release
    api.get('/api/member/module/', () => new Promise((resolve) => { release = resolve }))

    const wrapper = await mountList(ModuleList)

    expect(wrapper.find('#module-table .spinner-border').exists()).toBe(true)
    expect(rowTexts(wrapper)).toEqual(['Loading...'])

    release(paginated([]))
    await settle()

    expect(wrapper.find('#module-table .spinner-border').exists()).toBe(false)
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/module/', serverError)

    await mountList(ModuleList)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading modules')
  })
})

describe('ModuleList pagination', () => {
  test('asks the router for page two when page two is clicked', async () => {
    const wrapper = await mountList(ModuleList)

    await goToPage(wrapper, 2)

    expect(wrapper.vm.$route.query).toEqual({ page: '2' })
  })

  goldenTest(goldens, 'page 2', 'module-list', async () => {
    await mountList(ModuleList, { query: { page: '2' } })
    return api.requests()
  })

  test('fetches page two when page two is clicked', async () => {
    const wrapper = await mountList(ModuleList)

    await goToPage(wrapper, 2)

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/module/',
      query: { page: '2' },
    })
  })
})

describe('ModuleList search', () => {
  goldenTest(goldens, 'search', 'module-list', async () => {
    const wrapper = await mountList(ModuleList)

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    return api.requests()
  })

  test('puts the search term in the URL', async () => {
    const wrapper = await mountList(ModuleList)

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    expect(wrapper.vm.$route.query).toEqual({ q: 'invoice' })
  })

  test('shows what the search came back with', async () => {
    const wrapper = await mountList(ModuleList)
    api.get('/api/member/module/', ({ query }) =>
      paginated(
        query.q ? modulePage(['invoices']).results : modulePage().results,
        { count: query.q ? 1 : 45 },
      ),
    )

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    expect(rowTexts(wrapper).length).toBe(1)
    expect(rowTexts(wrapper)[0]).toContain('invoices')
  })

  // The regression class this whole apparatus exists for: a search that is
  // silently dropped the moment the user turns a page.
  goldenTest(goldens, 'search surviving a page change', 'module-list', async () => {
    const wrapper = await mountList(ModuleList)

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    await settle()

    return api.requests()
  })

  test('still asks for the search term after a page change', async () => {
    const wrapper = await mountList(ModuleList)

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', q: 'invoice' })
  })

  test('drops the search term when the user searches for nothing', async () => {
    const wrapper = await mountList(ModuleList, { query: { q: 'invoice' } })

    await openSearch(wrapper)
    modal('search-modal').type('')
    modal('search-modal').ok()
    await settle()

    expect(wrapper.vm.$route.query).toEqual({})
    expect(api.requests().at(-1).query).toMatchObject({ page: '1' })
    expect(api.requests().at(-1).query.q).toBeUndefined()
  })
})

describe('ModuleList delete', () => {
  goldenTest(goldens, 'delete', 'module-list', async () => {
    const wrapper = await mountList(ModuleList)

    await openDelete(wrapper)
    modal('delete-module-modal').ok()
    await settle()

    return api.requests()
  })

  test('re-fetches the page the user is on after deleting', async () => {
    const wrapper = await mountList(ModuleList, { query: { page: '3' } })

    await openDelete(wrapper)
    modal('delete-module-modal').ok()
    await settle()

    expect(api.requests().at(-1)).toMatchObject({
      method: 'get',
      path: '/api/member/module/',
      query: { page: '3' },
    })
  })

  test('confirms the deletion to the user', async () => {
    const wrapper = await mountList(ModuleList)

    await openDelete(wrapper)
    modal('delete-module-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Module has been deleted')
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountList(ModuleList)

    await openDelete(wrapper)
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })

  test('tells the user when the delete fails', async () => {
    api.delete('/api/member/module/{id}/', serverError)
    const wrapper = await mountList(ModuleList)

    await openDelete(wrapper)
    modal('delete-module-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error deleting module')
  })
})
