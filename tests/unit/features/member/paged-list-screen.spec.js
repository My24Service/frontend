import { beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { usePagedListScreen } from '@/features/member/paged-list-screen'

import { settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The list-screen skeleton itself, directly.
 *
 * The four resource specs already drive every list through the DOM against
 * recorded goldens, so the *wire contracts* are pinned there and are not
 * repeated here. What this file owns is the wiring those specs can only see
 * through one resource at a time: the fold of route page/search into the wire
 * query, the copy-to-toast plumbing, the invalidation ordering and the
 * delete guards — asserted once, against injected config, above the wire like
 * the schemas and module-paths suites. The skeleton declares no endpoint of
 * its own, so there is no network behaviour here for a seam to catch.
 *
 * One contract deserves its own trap warning. The composable reaches its
 * modals through `useTemplateRef('searchModal')` / `('deleteModal')` — string
 * names that have to match the templates in all four list views. A renamed
 * ref does not throw; optional chaining turns it into a silent no-op, and a
 * search button that opens nothing still passes a spec asserting requests.
 * The harness therefore binds real components under exactly those names and
 * asserts their imperative `show`/`hide` were actually reached.
 */

/** Everything the four lists hand the skeleton, as spies over inert fakes. */
function makeConfig() {
  return {
    // A real options object, so the installed vue-query runs for real — just
    // pointed at a local promise instead of the network.
    listOptions: vi.fn((query) => ({
      queryKey: ['paged-list-screen-probe', query],
      queryFn: listQuery,
    })),
    destroyMutation: () => ({mutationFn: destroyFn}),
    invalidateAfterDelete: invalidateAfterDelete,
    copy: {
      loadError: 'the list could not be loaded',
      deletedDetail: 'the row has been deleted',
      deleteError: 'the row could not be deleted',
    },
  }
}

let resolveList
let rejectList
const listQuery = vi.fn(
  () =>
    new Promise((resolve, reject) => {
      resolveList = resolve
      rejectList = reject
    }),
)

let destroyFn
const invalidateAfterDelete = vi.fn()

// The imperative handles the composable looks up by ref name, recorded per
// kind so the two modals cannot cover for each other.
const modalCalls = {searchModal: [], deleteModal: []}

const FakeModal = defineComponent({
  props: {kind: {type: String, required: true}},
  setup(props, {expose}) {
    expose({
      show: () => modalCalls[props.kind].push('show'),
      hide: () => modalCalls[props.kind].push('hide'),
    })
    return () => h('div')
  },
})

let screen
let wrapper

/** The harness binds the modals under the names the templates bind them. */
function harnessFor(config) {
  return defineComponent({
    setup() {
      screen = usePagedListScreen(config)
      return () =>
        h('div', [
          h(FakeModal, {kind: 'searchModal', ref: 'searchModal'}),
          h(FakeModal, {kind: 'deleteModal', ref: 'deleteModal'}),
        ])
    },
  })
}

async function mountScreen(query = {}) {
  const config = makeConfig()
  wrapper = await mountListView(harnessFor(config), {query, deep: true})
  await settle()
  return config
}

beforeEach(() => {
  vi.clearAllMocks()
  modalCalls.searchModal.length = 0
  modalCalls.deleteModal.length = 0
  resolveList = null
  rejectList = null
  destroyFn = vi.fn(() => Promise.resolve())
})

describe('paged-list-screen, the wire query', () => {
  test('sends page 1 even when the URL names none, omitting an absent term', async () => {
    const config = await mountScreen()

    const sent = config.listOptions.mock.lastCall[0]
    expect(sent).toStrictEqual({page: 1})
  })

  test('folds the route page and search term into the query', async () => {
    const config = await mountScreen({page: '3', q: 'abc'})

    expect(config.listOptions.mock.lastCall[0]).toStrictEqual({page: 3, q: 'abc'})
  })
})

describe('paged-list-screen, rows and count', () => {
  test('holds rows at none and count at zero until the response lands', async () => {
    await mountScreen()
    await settle()
    // Deliberately never resolving: the fallbacks are what is under test.

    expect(screen.isLoading.value).toBe(true)
    expect(screen.items.value).toEqual([])
    expect(screen.count.value).toBe(0)
  })

  test('passes the response envelope through as rows and count', async () => {
    await mountScreen()
    resolveList({count: 7, results: [{id: 1}, {id: 2}]})
    await settle()

    expect(screen.isLoading.value).toBe(false)
    expect(screen.items.value).toEqual([{id: 1}, {id: 2}])
    expect(screen.count.value).toBe(7)
  })

  test('re-runs the query when refreshed', async () => {
    await mountScreen()
    resolveList({count: 0, results: []})
    await settle()
    expect(listQuery).toHaveBeenCalledTimes(1)

    screen.refresh()
    await settle()

    expect(listQuery).toHaveBeenCalledTimes(2)
  })
})

describe('paged-list-screen, search', () => {
  test('opens the search modal through its named ref', async () => {
    await mountScreen()

    screen.showSearchModal()

    expect(modalCalls.searchModal).toEqual(['show'])
  })

  test('hides the modal and puts the term in the URL and the next request', async () => {
    const config = await mountScreen()

    screen.handleSearchOk('invoice')
    await settle()

    expect(modalCalls.searchModal).toEqual(['hide'])
    expect(wrapper.vm.$route.query).toEqual({q: 'invoice'})
    expect(config.listOptions.mock.lastCall[0]).toStrictEqual({page: 1, q: 'invoice'})
  })

  test('a blank search clears the term and the page together', async () => {
    const config = await mountScreen({page: '2', q: 'invoice'})

    screen.handleSearchOk(null)
    await settle()

    expect(wrapper.vm.$route.query).toStrictEqual({})
    expect(config.listOptions.mock.lastCall[0]).toStrictEqual({page: 1})
  })
})

describe('paged-list-screen, delete', () => {
  test('deletes nothing when no row was ever chosen', async () => {
    await mountScreen()

    await screen.doDelete()

    expect(destroyFn).not.toHaveBeenCalled()
    expect(invalidateAfterDelete).not.toHaveBeenCalled()
  })

  test('fires the mutation for the chosen row, then invalidates', async () => {
    await mountScreen()

    screen.showDeleteModal(9)
    await screen.doDelete()
    await settle()

    // vue-query hands the mutationFn its variables back as a reactive proxy,
    // so the claim here is about the shape, not object identity.
    expect(destroyFn.mock.calls[0][0]).toMatchObject({path: {id: 9}})
    expect(invalidateAfterDelete).toHaveBeenCalledTimes(1)
  })

  test('announces the deletion in the configured words', async () => {
    await mountScreen()

    screen.showDeleteModal(9)
    await screen.doDelete()
    await settle()

    expect(toasts()).toContainEqual(
      expect.objectContaining({
        title: 'Deleted',
        body: 'the row has been deleted',
        variant: 'success',
      }),
    )
  })

  test('on failure tells the user and leaves the queries alone', async () => {
    await mountScreen()
    destroyFn.mockReturnValue(Promise.reject(new Error('boom')))

    screen.showDeleteModal(9)
    await screen.doDelete()
    await settle()

    expect(toasts()).toContainEqual(
      expect.objectContaining({body: 'the row could not be deleted', variant: 'danger'}),
    )
    expect(invalidateAfterDelete).not.toHaveBeenCalled()
  })

  test('ignores a second click while one delete is still in flight', async () => {
    let release
    destroyFn.mockImplementation(() => new Promise((resolve) => {release = resolve}))
    await mountScreen()

    screen.showDeleteModal(9)
    const first = screen.doDelete()
    await screen.doDelete()

    expect(destroyFn).toHaveBeenCalledTimes(1)

    release()
    await first
    await settle()
  })
})

describe('paged-list-screen, load failures', () => {
  test('tells the user in the configured words when the list cannot load', async () => {
    await mountScreen()
    rejectList(new Error('boom'))
    await settle()

    expect(toasts()).toContainEqual(
      expect.objectContaining({body: 'the list could not be loaded', variant: 'danger'}),
    )
  })
})
