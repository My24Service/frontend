import { beforeEach, describe, expect, test, vi } from 'vitest'

import ModulePartList from '@/views/member/ModulePartList.vue'
import modulePartModel from '@/models/member/ModulePart.js'
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
  useFreshModel,
} from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * ModulePartList as it behaves today, before the Slice rewrites it (#320).
 *
 * Module Part is the resource the tracer-bullet Slice goes first on, so this is
 * the description that rewrite has to meet. Requests are asserted against
 * `tests/unit/golden/module-part-list.json`, recorded from the running
 * application against a development tenant (tests/unit/golden/README.md);
 * everything else is what a user can see and do.
 *
 * The Module a part belongs to shows up here as a column, which is the only
 * place the relationship is visible on this screen — the list endpoint carries
 * `module_name` and no second request is made for it. That is part of the
 * contract, so it is pinned.
 */

const api = installApiSeam()
const goldens = goldensFor('module-part-list')

const ITEM = itemSchemaOf(vPaginatedModulePartList)

function modulePartPage(parts = [{ name: 'sent', module_name: 'invoices' }, { name: 'received', module_name: 'invoices' }]) {
  return paginated(
    parts.map((part, index) => fixtureFor(ITEM, { id: index + 1, ...part })),
    { count: 45 },
  )
}

useFreshModel(modulePartModel)

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

  test('shows what the search came back with', async () => {
    const wrapper = await mountList(ModulePartList)
    api.get('/api/member/module-part/', modulePartPage([{ name: 'sent', module_name: 'invoices' }]))

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    expect(rowTexts(wrapper).length).toBe(1)
    expect(rowTexts(wrapper)[0]).toContain('sent')
  })

  goldenTest(goldens, 'search surviving a page change', 'module-part-list', async () => {
    const wrapper = await mountList(ModulePartList)

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    await mountList(ModulePartList, { query: wrapper.vm.$route.query })

    return api.requests()
  })

  test('still asks for the search term after a page change', async () => {
    const wrapper = await mountList(ModulePartList)

    await openSearch(wrapper)
    modal('search-modal').type('invoice')
    modal('search-modal').ok()
    await settle()

    await goToPage(wrapper, 2)
    await mountList(ModulePartList, { query: wrapper.vm.$route.query })

    expect(api.requests().at(-1).query).toMatchObject({ page: '2', q: 'invoice' })
  })
})

describe('ModulePartList delete', () => {
  goldenTest(goldens, 'delete', 'module-part-list', async () => {
    const wrapper = await mountList(ModulePartList)

    await openDelete(wrapper)
    modal('delete-module-part-modal').ok()
    await settle()

    return api.requests()
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
