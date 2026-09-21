import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  SearchAndAssign,
  EditStartDate,
} from '@/features/field-service'
import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { vOrderUpdate, vPaginatedOrderList } from '@/api/valibot.gen'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate } from '../../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

/**
 * Characterisation of the dispatch board's search-and-assign modal, written
 * against the LEGACY screen before it moves into
 * `src/features/field-service/dispatch/`.
 *
 * What it pins: which order collection the search reads and when it refuses to
 * read at all (a term of three characters or fewer makes no request — a search
 * that fires on every keystroke is the defect this guard exists to prevent),
 * what picking an order does to the board's shared selection, and the
 * `dd/mm/yyyy` body the inline date editor writes.
 */
const api = installApiSeam()

const ORDER_LIST = '/api/order/order/'
const ORDER = '/api/order/order/{id}/'
const ITEM = itemSchemaOf(vPaginatedOrderList)

function orderRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 12,
    order_id: '2026-0012',
    order_name: 'Acme',
    order_city: 'Utrecht',
    order_type: 'maintenance',
    ...overrides,
  })
}

beforeEach(() => {
  api.get(ORDER_LIST, () => paginated([orderRow()], {count: 1}))
  // The response is one member of `vOrderUpdateVariant`; the screen discards
  // the body, and the seam still holds the stub to the schema it claims.
  api.patch(ORDER, () => fixtureFor(vOrderUpdate, {id: 12}))
})

async function mountModal(options = {}) {
  const wrapper = mountForm(SearchAndAssign, {
    deep: true,
    // The reference suffix in the order-id cell reads a tenant setting the
    // testing store has no memberInfo for.
    main: {getAssignOrders: [], getCurrentLanguage: 'nl', getOrderListMustIncludeReference: false},
    stubs: {
      // `EditStartDate` is mounted as its own screen below; here the modal is
      // the unit under test.
      EditStartDate: {template: '<div />', methods: {setFromOrder() {}, show() {}, hide() {}}},
    },
    ...options,
  })
  await settle()
  return wrapper
}

const listRequests = () =>
  api.requests().filter((request) => request.method === 'get' && request.path === ORDER_LIST)

describe('SearchAndAssign', () => {
  test('a term of three or more characters reads the order list with it', async () => {
    const wrapper = await mountModal()

    wrapper.vm.query = 'acme'
    await wrapper.vm.search()
    await settle()

    expect(listRequests().at(-1)).toMatchObject({path: ORDER_LIST, query: {page: '1', q: 'acme'}})
  })

  test('a term of three characters or fewer makes no request', async () => {
    const wrapper = await mountModal()

    wrapper.vm.query = 'ac'
    await wrapper.vm.search()
    await settle()

    expect(listRequests()).toHaveLength(0)
  })

  test('clearing the box empties the results instead of searching for nothing', async () => {
    const wrapper = await mountModal()

    wrapper.vm.query = 'acme'
    await wrapper.vm.search()
    await settle()
    expect(wrapper.vm.orders).toHaveLength(1)

    wrapper.vm.query = ''
    await wrapper.vm.search()
    await settle()

    expect(wrapper.vm.orders).toEqual([])
    expect(listRequests()).toHaveLength(1)
  })

  test('the same term twice is not searched twice', async () => {
    const wrapper = await mountModal()

    wrapper.vm.query = 'acme'
    await wrapper.vm.search()
    await settle()
    await wrapper.vm.search()
    await settle()

    expect(listRequests()).toHaveLength(1)
  })

  test('picking an order selects it once, and the board is told', async () => {
    const wrapper = await mountModal()
    const order = orderRow()

    wrapper.vm.selectOrder(order)
    wrapper.vm.selectOrder(order)

    expect(wrapper.vm.selectedOrders).toEqual([order])
    expect(wrapper.vm.buttonLabel).toBe('Assign these orders')
  })

  test('removing the last selected order returns the button to Close', async () => {
    const wrapper = await mountModal()

    wrapper.vm.selectOrder(orderRow())
    wrapper.vm.removeSelectedOrder(0)

    expect(wrapper.vm.selectedOrders).toEqual([])
    expect(wrapper.vm.buttonLabel).toBe('Close')
  })

  test('closing reports whether anything was selected', async () => {
    const wrapper = await mountModal()

    wrapper.vm.selectOrder(orderRow())
    wrapper.vm.searchAndAssignDone()

    expect(wrapper.emitted('search-and-assign-done')).toEqual([[true]])
  })

  // The date editor's write is the one place in this Slice where the legacy
  // body is refused by the generated request schema, so it could not be
  // characterised through the strict seam at all: the legacy screen sent
  // `dd/mm/yyyy` (its own `formatHelper`), and
  // `vPatchedOrderUpdateRequest.start_date` is `v.isoDate()`. This is the
  // conversion's regression test instead: it fails against the legacy body and
  // passes against the ISO one, which stores the same date (DRF's
  // `DATE_INPUT_FORMATS` is `['iso-8601', '%d/%m/%Y']` — my24service
  // `source/settings/default_settings.py:361`).
  test('the date editor writes the order back as the ISO date the schema declares, and re-reads the rows', async () => {
    const wrapper = await mountModal()
    wrapper.vm.query = 'acme'
    await wrapper.vm.search()
    await settle()
    expect(listRequests()).toHaveLength(1)

    await wrapper.vm.editStartDateDone(12, new Date(2026, 8, 20), new Date(2026, 8, 22))
    await settle()

    expect(api.requests().filter((request) => request.method === 'patch')).toEqual([
      {
        method: 'patch',
        path: '/api/order/order/12/',
        query: {},
        body: {start_date: '2026-09-20', end_date: '2026-09-22'},
      },
    ])

    // The row's date is the *display* spelling the backend formats per tenant,
    // so the results are re-read rather than patched in place.
    expect(listRequests()).toHaveLength(2)
  })
})

describe('EditStartDate', () => {
  function mountEditor() {
    return mountForm(EditStartDate, {
      main: {getCurrentLanguage: 'nl', getOrderListMustIncludeReference: false},
      // The modal is auto-stubbed under a shallow mount without its
      // `show`/`hide` handle, which the screen calls on itself.
      stubs: {BModal: {template: '<div><slot /></div>', methods: {show() {}, hide() {}}}},
    })
  }

  test('seeds its pickers from the order it was opened for', () => {
    const wrapper = mountEditor()

    wrapper.vm.setFromOrder({id: 12, start_date: '20/09/2026', end_date: '22/09/2026'})

    expect(wrapper.vm.order_id).toBe(12)
    expect(wrapper.vm.start_date).toBeInstanceOf(Date)
    expect(wrapper.vm.end_date).toBeInstanceOf(Date)
  })

  test('moving the start past the end drags the end along', () => {
    const wrapper = mountEditor()

    wrapper.vm.start_date = new Date(2026, 8, 25)
    wrapper.vm.end_date = new Date(2026, 8, 20)
    wrapper.vm.check_date_start()

    expect(wrapper.vm.end_date).toBe(wrapper.vm.start_date)
    expect(wrapper.vm.error).toBeNull()
  })

  test('an end before the start blocks the save with a reason', () => {
    const wrapper = mountEditor()

    wrapper.vm.start_date = new Date(2026, 8, 25)
    wrapper.vm.end_date = new Date(2026, 8, 20)
    wrapper.vm.check_date_end()

    expect(wrapper.vm.error).toBe('The end date cannot lie before start date')

    const event = {preventDefault: vi.fn()}
    wrapper.vm.editStartDateDone(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(wrapper.emitted('edit-start-date-done')).toBeUndefined()
  })

  test('a valid range is emitted to the parent', () => {
    const wrapper = mountEditor()

    wrapper.vm.order_id = 12
    wrapper.vm.start_date = new Date(2026, 8, 20)
    wrapper.vm.end_date = new Date(2026, 8, 22)
    wrapper.vm.editStartDateDone({preventDefault: vi.fn()})

    expect(wrapper.emitted('edit-start-date-done')).toEqual([[12, wrapper.vm.start_date, wrapper.vm.end_date]])
  })
})