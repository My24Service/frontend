import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ModulePartList } from '@/features/member'
import { vPaginatedModulePartList } from '@/api/valibot.gen'

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
 * ModulePartList, rewritten as the tracer-bullet Slice's first screen (#321).
 *
 * Requests are asserted against `tests/unit/golden/module-part-list.json`,
 * recorded from the running application before the rewrite
 * (tests/unit/golden/README.md) — the wire contract the rewrite had to meet.
 * Everything else is what a user can see and do.
 *
 * Two things are different from the characterisation spec this replaces, and
 * both are deliberate (recorded on #321):
 *
 *   - The screen keeps no state of its own. Page and search term live in the
 *     route; the query key is built from them reactively, so a search or a page
 *     change re-fetches through vue-query rather than through a model
 *     singleton's mutable `searchQuery`. The old singleton leak — where a term
 *     typed on one screen filtered another screen's dropdown — has nothing to
 *     leak through any more.
 *   - A page change is asserted live: click, then watch the request follow.
 *     The old spec remounted at the new query because the component only read
 *     the route on creation; this one watches it.
 *
 * The Module a part belongs to shows up here as a column, carried by the list
 * response (`module_name`) — no second request is made for it. That is part of
 * the contract, so it is pinned.
 */

const api = installApiSeam()
const goldens = goldensFor('module-part-list')

const ITEM = itemSchemaOf(vPaginatedModulePartList)

function modulePartPage(parts = [{ name: 'sent', module_name: 'invoices' }, { name: 'received', module_name: 'invoices' }]) {
  return paginated(
    // Ids start at 301, because the recorded delete golden names
    // /api/member/module-part/301/.
    parts.map((part, index) => fixtureFor(ITEM, { id: index + 301, ...part })),
    { count: 45 },
  )
}

beforeEach(() => {
  api.get('/api/member/module-part/', modulePartPage())
  api.delete('/api/member/module-part/{id}/', noContent)
})

describe('ModulePartList, loading', () => {
  goldenTest(goldens, 'initial load', 'module-part-list', async () => {
    await mountList(ModulePartList)
    return api.requests()
  })

  test('shows a row for every module part the backend returned', async () => {
    const wrapper = await mountList(ModulePartList)

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('sent')
    expect(rowTexts(wrapper)[1]).toContain('received')
  })

  // The Module/ModulePart relationship, as this screen shows it: named in the
  // row, and carried by the list response rather than fetched separately.
  test('names the module each part belongs to, without asking for it', async () => {
    const wrapper = await mountList(ModulePartList)

    expect(rowTexts(wrapper)[0]).toContain('invoices')
    expect(api.requests().filter((sent) => sent.path === '/api/member/module/')).toEqual([])
  })

  test('keeps the loading spinner up until the list arrives', async () => {
    let release
    api.get('/api/member/module-part/', () => new Promise((resolve) => { release = resolve }))

    const wrapper = await mountList(ModulePartList)

    expect(wrapper.find('#module-part-table .spinner-border').exists()).toBe(true)
    expect(rowTexts(wrapper)).toEqual(['Loading...'])

    release(paginated([]))
    await settle()

    expect(wrapper.find('#module-part-table .spinner-border').exists()).toBe(false)
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/module-part/', serverError)

    await mountList(ModulePartList)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading module parts')
  })
})

describe('ModulePartList pagination', () => {
  test('asks the router for page two when page two is clicked', async () => {
    const wrapper = await mountList(ModulePartList)

    await goToPage(wrapper, 2)

    expect(wrapper.vm.$route.query).toEqual({ page: '2' })
  })

  goldenTest(goldens, 'page 2', 'module-part-list', async () => {
    await mountList(ModulePartList, { query: { page: '2' } })
    return api.requests()
  })

  test('fetches page two when page two is clicked', async () => {
    const wrapper = await mountList(ModulePartList)

    await goToPage(wrapper, 2)

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/member/module-part/',
      query: { page: '2' },
    })
  })
})

describe('ModulePartList search', () => {
  goldenTest(goldens, 'search', 'module-part-list', async () => {
    const wrapper = await mountList(ModulePartList)

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    return api.requests()
  })

  test('puts the search term in the URL', async () => {
    const wrapper = await mountList(ModulePartList)

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    expect(wrapper.vm.$route.query).toEqual({ q: 'invoice' })
  })

  test('shows what the search came back with', async () => {
    const wrapper = await mountList(ModulePartList)
    api.get('/api/member/module-part/', ({ query }) =>
      paginated(
        query.q
          ? modulePartPage([{ name: 'sent', module_name: 'invoices' }]).results
          : modulePartPage().results,
        { count: query.q ? 1 : 45 },
      ),
    )

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    expect(rowTexts(wrapper).length).toBe(1)
    expect(rowTexts(wrapper)[0]).toContain('sent')
  })

  // Searched for "a" rather than "invoice" because that is what this capture
  // typed; the plain search scenario above came from a different session.
  goldenTest(goldens, 'search surviving a page change', 'module-part-list', async () => {
    const wrapper = await mountList(ModulePartList)

    await openSearch(wrapper)
    modal('search-modal').type('a')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    await settle()

    return api.requests()
  })

  test('still asks for the search term after a page change', async () => {
    const wrapper = await mountList(ModulePartList)

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', q: 'invoice' })
  })

  test('drops the search term when the user searches for nothing', async () => {
    const wrapper = await mountList(ModulePartList, { query: { q: 'invoice' } })

    await openSearch(wrapper)
    modal('search-modal').type('')
    modal('search-modal').ok()
    await settle()

    expect(wrapper.vm.$route.query).toEqual({})
    expect(api.requests().at(-1).query).toMatchObject({ page: '1' })
    expect(api.requests().at(-1).query.q).toBeUndefined()
  })
})

describe('ModulePartList delete', () => {
  // Deleted from page three, which is where the capture was when it deleted.
  // Worth having as the recorded scenario rather than a page-one delete: it
  // pins that the reload after a delete stays on the page the user was on
  // instead of dropping them back to the first.
  goldenTest(goldens, 'delete', 'module-part-list', async () => {
    const wrapper = await mountList(ModulePartList, { query: { page: '3' } })

    await openDelete(wrapper)
    modal('delete-module-part-modal').ok()
    await settle()

    return api.requests()
  })

  test('re-fetches the page the user is on after deleting', async () => {
    const wrapper = await mountList(ModulePartList, { query: { page: '3' } })

    await openDelete(wrapper)
    modal('delete-module-part-modal').ok()
    await settle()

    expect(api.requests().at(-1)).toMatchObject({
      method: 'get',
      path: '/api/member/module-part/',
      query: { page: '3' },
    })
  })

  test('confirms the deletion to the user', async () => {
    const wrapper = await mountList(ModulePartList)

    await openDelete(wrapper)
    modal('delete-module-part-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Module part has been deleted')
  })

  test('does not delete anything until the confirmation is accepted', async () => {
    const wrapper = await mountList(ModulePartList)

    await openDelete(wrapper)
    await settle()

    expect(api.requests().filter((sent) => sent.method === 'delete')).toEqual([])
  })

  test('tells the user when the delete fails', async () => {
    api.delete('/api/member/module-part/{id}/', serverError)
    const wrapper = await mountList(ModulePartList)

    await openDelete(wrapper)
    modal('delete-module-part-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error deleting module part')
  })
})
