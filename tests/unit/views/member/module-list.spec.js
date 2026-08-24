import { beforeEach, describe, expect, test, vi } from 'vitest'

import ModuleList from '@/views/member/ModuleList.vue'
import moduleModel from '@/models/member/Module.js'
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
  useFreshModel,
} from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * ModuleList as it behaves today, before the Slice rewrites it (#320).
 *
 * Recorded rather than derived. What the screen asks the backend for is
 * asserted against `tests/unit/golden/module-list.json`, captured from the
 * running application against a development tenant — see
 * tests/unit/golden/README.md. A golden written by reading this component could
 * not disagree with it, and so would certify a dropped `q` or `page` as
 * correct, which is the failure #313 is about.
 *
 * Everything else here is what a user can see and do: rows in the table, the
 * search modal, the delete confirmation, the message shown when a request
 * fails. Nothing calls a method on the component.
 */

const api = installApiSeam()
const goldens = goldensFor('module-list')

const ITEM = itemSchemaOf(vPaginatedModuleList)

/** Two pages' worth, so the pagination control renders at all. */
function modulePage(names = ['Planning', 'Inventory']) {
  return paginated(
    names.map((name, index) => fixtureFor(ITEM, { id: index + 1, name })),
    { count: 45 },
  )
}

useFreshModel(moduleModel)

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
    expect(rowTexts(wrapper)[0]).toContain('Planning')
    expect(rowTexts(wrapper)[1]).toContain('Inventory')
  })

  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/member/module/', serverError)

    await mountList(ModuleList)

    expect(toasts().map((toast) => toast.body)).toContain('Error loading modules')
  })
})

describe('ModuleList pagination', () => {
  // Two halves of one behaviour, and both are needed. The view reads its page
  // in created() and never watches the route: what turns a click into a
  // request is the remount forced by `:key="$route.fullPath"` on the
  // router-view. So the click is asserted against the route it asks for, and
  // the request against a mount at that route.
  test('asks the router for page two when page two is clicked', async () => {
    const wrapper = await mountList(ModuleList)

    await goToPage(wrapper, 2)

    expect(wrapper.vm.$route.query).toEqual({ page: '2' })
  })

  goldenTest(goldens, 'page 2', 'module-list', async () => {
    await mountList(ModuleList, { query: { page: '2' } })
    return api.requests()
  })
})

describe('ModuleList search', () => {
  goldenTest(goldens, 'search', 'module-list', async () => {
    const wrapper = await mountList(ModuleList)

    await openSearch(wrapper)
    modal('search-modal').type('planning')
    modal('search-modal').ok()
    await settle()

    return api.requests()
  })

  test('shows what the search came back with', async () => {
    const wrapper = await mountList(ModuleList)
    api.get('/api/member/module/', modulePage(['Planning']))

    await openSearch(wrapper)
    modal('search-modal').type('planning')
    modal('search-modal').ok()
    await settle()

    expect(rowTexts(wrapper).length).toBe(1)
    expect(rowTexts(wrapper)[0]).toContain('Planning')
  })

  // The regression class this whole apparatus exists for: a search that is
  // silently dropped the moment the user turns a page.
  goldenTest(goldens, 'search surviving a page change', 'module-list', async () => {
    const wrapper = await mountList(ModuleList)

    await openSearch(wrapper)
    modal('search-modal').type('planning')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    await mountList(ModuleList, { query: wrapper.vm.$route.query })

    return api.requests()
  })

  test('still asks for the search term after a page change', async () => {
    const wrapper = await mountList(ModuleList)

    await openSearch(wrapper)
    modal('search-modal').type('planning')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    await mountList(ModuleList, { query: wrapper.vm.$route.query })

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', q: 'planning' })
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
