import { beforeEach, describe, expect, test } from 'vitest'
import { HttpResponse } from 'msw'

import {
  vPurchaseOrderEntry,
  vPurchaseOrderDetail,
  vPurchaseOrderList,
  vPurchaseOrderMaterial,
  vStockLocation,
} from '@/api/valibot.gen'
import { PurchaseOrderEntryCreate, PurchaseOrderEntryEdit } from '@/features/inventory/entry'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../support/form-harness.js'

// The contract is the legacy purchase-order-entry-form spec. The create is ONE
// request (the bulk endpoint, a bare array); the edit is one PATCH. They are
// two screens on two routes; `mountEntry` mounts the one the route would.

const api = installApiSeam()

const BULK = '/api/inventory/purchaseorder-entry/bulk/'
const ENTRY = '/api/inventory/purchaseorder-entry/{id}/'
const ORDERS = '/api/inventory/purchaseorder/'
const ORDER_DETAIL = '/api/inventory/purchaseorder/{id}/'
const LOCATIONS = '/api/inventory/stock-location/'

const STOCK_LOCATIONS = [
  fixtureFor(vStockLocation, { id: 1, name: 'Warehouse' }),
  fixtureFor(vStockLocation, { id: 2, name: 'Van' }),
]

const ORDER = fixtureFor(vPurchaseOrderList, {
  id: 55,
  purchase_order_id: 'PO-1',
  order_name: 'ACME',
  order_city: 'Amsterdam',
  expected_entry_date: '01/05/2026',
  num_materials: 2,
})

function orderMaterial(id, name, unit, amount) {
  return fixtureFor(vPurchaseOrderMaterial, {
    id,
    material: id + 3,
    purchase_order: 55,
    amount,
    num_entries: 0,
    material_view: { id: id + 3, name, unit, price_purchase: '1.00', price_selling: '1.00', price_selling_alt: '1.00', price_purchase_ex: '1.00', price_selling_ex: '1.00', price_selling_alt_ex: '1.00', modified: '01-01-2026', show_name: name },
  })
}

const MATERIAL_ROWS = [orderMaterial(7, 'Widget', 'pcs', 3), orderMaterial(8, 'Gadget', 'box', 5)]

const ENTRY_ROW = fixtureFor(vPurchaseOrderEntry, {
  id: 42,
  purchase_order: 55,
  purchase_order_material: 7,
  order_id: 'PO-1',
  supplier: 'ACME',
  material_name: 'Widget',
  amount: 3,
  entry_date: '04/03/2026',
  entry_date_iso: '2026-03-04',
  stock_location: 1,
  stock_location_name: 'Warehouse',
})

const bodies = () => toasts().map((toast) => toast.body)
const titles = () => toasts().map((toast) => toast.title)
const writes = () => api.requests().filter((request) => request.method !== 'get')
const reads = (path) => api.requests().filter((request) => request.method === 'get' && request.path === path)

beforeEach(() => {
  api.get(ORDERS, () => paginated([ORDER]))
  api.get(LOCATIONS, () => paginated(STOCK_LOCATIONS))
  api.get(ORDER_DETAIL, () => fixtureFor(vPurchaseOrderDetail, { ...ORDER, materials: MATERIAL_ROWS, reservation_materials: null, statuses: [], entries: [] }))
  api.get(ENTRY, () => ENTRY_ROW)
  api.post(BULK, ({ body }) => body.map((row, index) => fixtureFor(vPurchaseOrderEntry, { ...row, id: 100 + index })))
  api.patch(ENTRY, ({ body }) => fixtureFor(vPurchaseOrderEntry, { ...ENTRY_ROW, ...body }))
})

/**
 * The third-party widgets have no DOM under happy-dom, so each is a stub that
 * says what it was given: the multiselect renders its options as buttons
 * labelled by the form's own `custom-label`, and the date picker is a text
 * input holding `YYYY-MM-DD`.
 */
const multiselectStub = {
  props: ['options', 'customLabel'],
  emits: ['select', 'search-change'],
  template: `<div class="multiselect-stub">
    <input class="search" @input="$emit('search-change', $event.target.value)" />
    <ul><li v-for="option in options" :key="option.id">
      <button type="button" @click="$emit('select', option)">{{ customLabel(option) }}</button>
    </li></ul>
  </div>`,
}

const pad = (n) => String(n).padStart(2, '0')
const day = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const TODAY = day(new Date())

const datePickerStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  methods: {
    day(value) { return value ? day(value) : '' },
    change(event) {
      const [year, month, date] = event.target.value.split('-').map(Number)
      this.$emit('update:modelValue', event.target.value ? new Date(year, month - 1, date) : null)
    },
  },
  template: '<input class="datepicker-stub" :value="day(modelValue)" @change="change" />',
}

async function mountEntry(props = {}) {
  const wrapper = mountForm(props.pk == null ? PurchaseOrderEntryCreate : PurchaseOrderEntryEdit, {
    deep: true,
    props,
    attachTo: document.body,
    stubs: { VueMultiselect: multiselectStub, VueDatePicker: datePickerStub },
  })
  await settle()
  return wrapper
}

const SEARCH_DEBOUNCE = 550

async function search(wrapper, selector, term) {
  await wrapper.get(`${selector} input.search`).setValue(term)
  await new Promise((resolve) => setTimeout(resolve, SEARCH_DEBOUNCE))
  await settle()
}

/** Pick a purchase order the way a user does: type, then choose the option. */
async function pickOrder(wrapper) {
  await search(wrapper, '#purchaseorder-entry-order-search', 'PO')
  await wrapper.get('#purchaseorder-entry-order-search li button').trigger('click')
  await settle()
}

const rowsOf = (wrapper) => wrapper.findAll('tbody tr').map((row) => row.findAll('td').map((cell) => cell.text()).slice(0, -1))

/** The feedback lines the form is showing: Bootstrap displays one only for an invalid field. */
const shownErrors = (wrapper) => wrapper.findAll('.invalid-feedback.d-block').map((line) => line.text())

const button = (wrapper, label) => wrapper.findAll('button').find((candidate) => candidate.text() === label)

async function click(wrapper, label) {
  await button(wrapper, label).trigger('click')
  await settle()
}

/** The pencil and the bin of row `index`: the two links of its last cell. */
const rowLinks = (wrapper, index) => wrapper.findAll('tbody tr')[index].findAll('a')

async function pickProduct(wrapper, name) {
  const option = wrapper.findAll('#purchaseorder-entry-material-search li button')
    .find((candidate) => candidate.text().startsWith(name))
  await option.trigger('click')
  await settle()
}

async function typeAmount(wrapper, value) {
  await wrapper.get('#purchaseorder-entry-amount').setValue(value)
  await settle()
}

async function setDate(wrapper, value) {
  await wrapper.get('input.datepicker-stub').setValue(value)
  await wrapper.get('input.datepicker-stub').trigger('change')
  await settle()
}

/** What the bulk body carries for each row, as the legacy spec wrote it. */
function bulkBody(rows) {
  return rows.map((row) => ({
    entry_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    stock_location: null,
    ...row,
  }))
}

describe('create: the order and its staged entries', () => {
  test('nothing is searched until a term is typed', async () => {
    await mountEntry()

    expect(reads(ORDERS)).toHaveLength(0)
  })

  test('the order picker lists matches under the legacy label', async () => {
    const wrapper = await mountEntry()

    await search(wrapper, '#purchaseorder-entry-order-search', 'PO')

    expect(reads(ORDERS)[0].query).toMatchObject({ q: 'PO' })
    expect(wrapper.get('#purchaseorder-entry-order-search li button').text())
      .toBe('PO-1 - ACME, Amsterdam (materials: 2)')
  })

  test('picking an order stages one entry per material, for the ordered amount', async () => {
    const wrapper = await mountEntry()

    await pickOrder(wrapper)

    expect(reads('/api/inventory/purchaseorder/55/')).toHaveLength(1)
    expect(rowsOf(wrapper)).toEqual([
      ['Widget', 'pcs', '3', '3', TODAY, ''],
      ['Gadget', 'box', '5', '5', TODAY, ''],
    ])
    expect(wrapper.get('#purchaseorder-entry-order-id').element.value).toBe('PO-1')
    expect(wrapper.get('#purchaseorder-entry-supplier').element.value).toBe('ACME')
    expect(wrapper.get('#purchaseorder-entry-city').element.value).toBe('Amsterdam')
    expect(wrapper.get('#purchaseorder-entry-expected_entry_date').element.value).toBe('01/05/2026')
  })

  test('picking an order again replaces the rows rather than appending', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)
    await rowLinks(wrapper, 0)[1].trigger('click')
    expect(rowsOf(wrapper)).toHaveLength(1)

    await wrapper.get('#purchaseorder-entry-order-search li button').trigger('click')
    await settle()

    expect(rowsOf(wrapper)).toHaveLength(2)
  })

  test('a failed products read tells the user and stages nothing', async () => {
    api.get(ORDER_DETAIL, () => HttpResponse.json({ detail: 'boom' }, { status: 500 }))
    const wrapper = await mountEntry()

    await pickOrder(wrapper)

    expect(bodies()).toContain('Error fetching purchase order products')
    expect(wrapper.find('tbody').exists()).toBe(false)
  })

  test('choosing a default location stamps it on every entry', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await wrapper.get('#purchaseorder-entry-default-location').setValue('2')
    await settle()

    expect(rowsOf(wrapper).map((row) => row[5])).toEqual(['Van', 'Van'])
    await click(wrapper, 'Submit')
    expect(writes()[0].body.map((row) => row.stock_location)).toEqual([2, 2])
  })

  test('each entry has its own date: editing one leaves the other', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await rowLinks(wrapper, 0)[0].trigger('click')
    await setDate(wrapper, '2026-01-15')
    await click(wrapper, 'Edit entry')
    await click(wrapper, 'Submit')

    expect(writes()[0].body.map((row) => row.entry_date)).toEqual(['2026-01-15', TODAY])
  })

  test('deleting a row takes it out of the list', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await rowLinks(wrapper, 0)[1].trigger('click')

    expect(rowsOf(wrapper).map((row) => row[0])).toEqual(['Gadget'])
  })

  test('editing a row writes it back and resolves the location name', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await rowLinks(wrapper, 0)[0].trigger('click')
    expect(wrapper.get('#purchaseorder-entry-material-name').element.value).toBe('Widget')
    await typeAmount(wrapper, '99')
    await wrapper.get('#purchaseorder-entry-location').setValue('1')
    await click(wrapper, 'Edit entry')

    expect(rowsOf(wrapper)[0]).toEqual(['Widget', 'pcs', '3', '99', TODAY, 'Warehouse'])
    expect(button(wrapper, 'Add entry')).toBeDefined()
  })

  test('cancelling an edit leaves the row as it was', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await rowLinks(wrapper, 0)[0].trigger('click')
    await typeAmount(wrapper, '99')
    await click(wrapper, 'Cancel')

    expect(rowsOf(wrapper)[0][3]).toBe('3')
  })

  // REGRESSION (inherited from the legacy form): the default location was
  // applied only when it changed, so one chosen before the order reached
  // neither the rows the pick staged nor a row added by hand.
  test('a default location chosen before the order is on every staged row, and on the next one', async () => {
    const wrapper = await mountEntry()
    await wrapper.get('#purchaseorder-entry-default-location').setValue('2')
    await settle()

    await pickOrder(wrapper)

    expect(rowsOf(wrapper).map((row) => row[5])).toEqual(['Van', 'Van'])
    expect(wrapper.get('#purchaseorder-entry-location').element.value).toBe('2')
    await click(wrapper, 'Submit')
    expect(writes()[0].body.map((row) => row.stock_location)).toEqual([2, 2])
  })
})

describe('create: picking another order', () => {
  const ORDER_B = fixtureFor(vPurchaseOrderList, {
    id: 56,
    purchase_order_id: 'PO-2',
    order_name: 'Globex',
    order_city: 'Utrecht',
    expected_entry_date: '02/05/2026',
    num_materials: 1,
  })
  const B_MATERIALS = [orderMaterial(9, 'Sprocket', 'kg', 4)]

  const detail = (order, materials) =>
    fixtureFor(vPurchaseOrderDetail, { ...order, materials, reservation_materials: null, statuses: [], entries: [] })

  beforeEach(() => {
    api.get(ORDERS, () => paginated([ORDER, ORDER_B]))
  })

  async function pickNth(wrapper, index) {
    await wrapper.findAll('#purchaseorder-entry-order-search li button')[index].trigger('click')
    await settle()
  }

  // REGRESSION. The header followed the new pick at once, but the rows were
  // replaced only when its products arrived: a failed read left the first
  // order's rows under the second order's header, and Submit booked them.
  test('a second order whose products fail to load keeps none of the first order\'s rows', async () => {
    api.get(ORDER_DETAIL, ({ params }) => (Number(params.id) === 56
      ? HttpResponse.json({ detail: 'boom' }, { status: 500 })
      : detail(ORDER, MATERIAL_ROWS)))
    const wrapper = await mountEntry()
    await search(wrapper, '#purchaseorder-entry-order-search', 'PO')
    await pickNth(wrapper, 0)
    expect(rowsOf(wrapper)).toHaveLength(2)

    await pickNth(wrapper, 1)

    expect(bodies()).toContain('Error fetching purchase order products')
    expect(wrapper.get('#purchaseorder-entry-order-id').element.value).toBe('PO-2')
    expect(wrapper.find('tbody').exists()).toBe(false)
    await click(wrapper, 'Submit')
    expect(writes()).toEqual([])
  })

  // REGRESSION. Whichever read answered last won: a slow answer for the first
  // pick replaced the rows of the order picked after it.
  test('a late answer for an order no longer picked does not replace the rows', async () => {
    let releaseFirst
    const firstHeld = new Promise((resolve) => { releaseFirst = resolve })
    api.get(ORDER_DETAIL, async ({ params }) => {
      if (Number(params.id) === 56) return detail(ORDER_B, B_MATERIALS)
      await firstHeld
      return detail(ORDER, MATERIAL_ROWS)
    })
    const wrapper = await mountEntry()
    await search(wrapper, '#purchaseorder-entry-order-search', 'PO')

    await pickNth(wrapper, 0)
    await pickNth(wrapper, 1)
    releaseFirst()
    await settle()

    expect(rowsOf(wrapper).map((row) => row[0])).toEqual(['Sprocket'])
    await click(wrapper, 'Submit')
    expect(writes()[0].body).toEqual(bulkBody([{ purchase_order: 56, purchase_order_material: 9, amount: 4 }]))
  })
})

describe('create: adding a row', () => {
  test('picking a product shows what was ordered and moves focus to the amount', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await pickProduct(wrapper, 'Gadget')

    expect(wrapper.get('#purchaseorder-entry-material-name').element.value).toBe('Gadget')
    expect(wrapper.get('#purchaseorder-entry-material-amount').element.value).toBe('5')
    expect(wrapper.get('#purchaseorder-entry-material-unit').element.value).toBe('box')
    expect(document.activeElement.id).toBe('purchaseorder-entry-amount')
  })

  test('the product options carry the ordered and booked-in counts', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    expect(wrapper.get('#purchaseorder-entry-material-search li button').text())
      .toBe('Widget (ordered: 3, entries: 0)')
  })

  test('adds the row when a product and an amount are set, and clears the draft', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)
    await pickProduct(wrapper, 'Widget')
    await typeAmount(wrapper, '2')
    await wrapper.get('#purchaseorder-entry-location').setValue('2')

    await click(wrapper, 'Add entry')

    // The new row carries the product's and the location's names: the legacy
    // form left both blank on a row typed in by hand.
    expect(rowsOf(wrapper)[2]).toEqual(['Widget', 'pcs', '3', '2', TODAY, 'Van'])
    expect(wrapper.get('#purchaseorder-entry-material-name').element.value).toBe('')
    await click(wrapper, 'Submit')
    expect(writes()[0].body[2]).toMatchObject({ purchase_order: 55, purchase_order_material: 7, amount: 2, stock_location: 2 })
  })

  test('refuses a row with no product', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)
    await typeAmount(wrapper, '2')

    expect(button(wrapper, 'Add entry').attributes('disabled')).toBeDefined()
    await click(wrapper, 'Add entry')

    expect(rowsOf(wrapper)).toHaveLength(2)
  })

  test('refuses an amount of zero', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)
    await pickProduct(wrapper, 'Widget')
    await typeAmount(wrapper, '0')

    expect(button(wrapper, 'Add entry').attributes('disabled')).toBeDefined()
  })

  test('refuses a row with no date', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)
    await pickProduct(wrapper, 'Widget')
    await typeAmount(wrapper, '2')
    await setDate(wrapper, '')

    expect(button(wrapper, 'Add entry').attributes('disabled')).toBeDefined()
  })

  // Changed deliberately: the row errors waited for a Submit, so a save of the
  // staged rows lit the blank row editor red. They now wait for a product to
  // be picked or a row to be edited, as the purchase order's material rows do.
  test('a blank row editor stays quiet through a save', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await click(wrapper, 'Submit')

    expect(shownErrors(wrapper)).toEqual([])
  })

  test('the row errors show once a product is picked', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)
    expect(shownErrors(wrapper)).toEqual([])

    await pickProduct(wrapper, 'Widget')
    await typeAmount(wrapper, '0')

    expect(shownErrors(wrapper)).toEqual(['Please enter an amount'])
  })
})

describe('create: the save', () => {
  test('sends one request carrying every entry row, with the dates formatted', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await click(wrapper, 'Submit')

    expect(writes()).toEqual([
      {
        method: 'post',
        path: BULK,
        query: {},
        body: bulkBody([
          { purchase_order: 55, purchase_order_material: 7, amount: 3 },
          { purchase_order: 55, purchase_order_material: 8, amount: 5 },
        ]),
      },
    ])
  })

  test('toasts once for the save, not once per entry, and goes back', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await click(wrapper, 'Submit')

    expect(titles()).toEqual(['Created'])
    expect(bodies()).toEqual(['Entry has been created'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
  })

  test('a failed save books nothing in, and the retry sends the same list', async () => {
    let attempts = 0
    api.post(BULK, ({ body }) => {
      attempts += 1
      return attempts === 1
        ? HttpResponse.json({ detail: 'boom' }, { status: 500 })
        : body.map((row, index) => fixtureFor(vPurchaseOrderEntry, { ...row, id: 100 + index }))
    })
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await click(wrapper, 'Submit')

    expect(writes().map((request) => request.path)).toEqual([BULK])
    expect(bodies()).toEqual(['Error creating entry'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()

    await click(wrapper, 'Submit')

    expect(writes().map((request) => request.path)).toEqual([BULK, BULK])
    expect(writes()[1].body).toEqual(writes()[0].body)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a removed row is left out of the list, and nothing is deleted server-side', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)

    await rowLinks(wrapper, 0)[1].trigger('click')
    await click(wrapper, 'Submit')

    expect(writes()).toEqual([
      {
        method: 'post',
        path: BULK,
        query: {},
        body: bulkBody([{ purchase_order: 55, purchase_order_material: 8, amount: 5 }]),
      },
    ])
  })

  // REGRESSION. Every entry books a stock mutation server-side (the bulk
  // endpoint's own description), and the save refreshed only the order reads.
  test('the save makes the stock reads stale', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)
    const before = reads(LOCATIONS).length

    await click(wrapper, 'Submit')

    expect(reads(LOCATIONS).length).toBeGreaterThan(before)
  })

  // REGRESSION. The row editor works on a copy since the migration (the
  // legacy bound it live to the row), so a Submit with an edit open booked the
  // row as it was before the edit, and dropped the edit without a word.
  test('Submit with a row edit open books the edit', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)
    await rowLinks(wrapper, 0)[0].trigger('click')
    await typeAmount(wrapper, '7')

    await click(wrapper, 'Submit')

    expect(writes()[0].body.map((row) => row.amount)).toEqual([7, 5])
  })

  test('Submit with an invalid row edit open sends nothing and says why', async () => {
    const wrapper = await mountEntry()
    await pickOrder(wrapper)
    await rowLinks(wrapper, 0)[0].trigger('click')
    await typeAmount(wrapper, '0')

    await click(wrapper, 'Submit')

    expect(writes()).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(shownErrors(wrapper)).toEqual(['Please enter an amount'])
  })

  test('nothing staged sends nothing, says nothing and goes back', async () => {
    const wrapper = await mountEntry()

    await click(wrapper, 'Submit')

    expect(writes()).toEqual([])
    expect(toasts()).toEqual([])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})

describe('edit', () => {
  test('loads the entry into the fields', async () => {
    const wrapper = await mountEntry({ pk: 42 })

    expect(wrapper.get('#purchaseorder-entry-order-id').element.value).toBe('PO-1')
    expect(wrapper.get('#purchaseorder-entry-supplier').element.value).toBe('ACME')
    expect(wrapper.get('#purchaseorder-entry-material-name').element.value).toBe('Widget')
    expect(wrapper.get('#purchaseorder-entry-amount').element.value).toBe('3')
    expect(wrapper.get('input.datepicker-stub').element.value).toBe('2026-03-04')
    expect(wrapper.get('#purchaseorder-entry-location').element.value).toBe('1')
    expect(wrapper.text()).toContain('Edit entry')
  })

  test('has no order or product picker, and no staged rows', async () => {
    const wrapper = await mountEntry({ pk: 42 })

    expect(wrapper.find('#purchaseorder-entry-order-search').exists()).toBe(false)
    expect(wrapper.find('#purchaseorder-entry-material-search').exists()).toBe(false)
    expect(wrapper.find('tbody').exists()).toBe(false)
    expect(button(wrapper, 'Add entry')).toBeUndefined()
  })

  test('patches the edited entry and navigates back', async () => {
    const wrapper = await mountEntry({ pk: 42 })

    await typeAmount(wrapper, '99')
    await click(wrapper, 'Submit')

    expect(writes()).toEqual([
      {
        method: 'patch',
        path: '/api/inventory/purchaseorder-entry/42/',
        query: {},
        body: { purchase_order: 55, purchase_order_material: 7, amount: 99, entry_date: '2026-03-04', stock_location: 1 },
      },
    ])
    expect(titles()).toEqual(['Updated'])
    expect(bodies()).toEqual(['Entry has been updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  // REGRESSION. A changed entry changes the stock it booked.
  test('the save makes the stock reads stale', async () => {
    const wrapper = await mountEntry({ pk: 42 })
    const before = reads(LOCATIONS).length

    await click(wrapper, 'Submit')

    expect(reads(LOCATIONS).length).toBeGreaterThan(before)
  })

  test('sends the date the picker holds as YYYY-MM-DD', async () => {
    const wrapper = await mountEntry({ pk: 42 })

    await setDate(wrapper, '2026-04-05')
    await click(wrapper, 'Submit')

    expect(writes()[0].body.entry_date).toBe('2026-04-05')
  })

  test('drops a null stock_location from the payload', async () => {
    api.get(ENTRY, () => ({ ...ENTRY_ROW, stock_location: null, stock_location_name: '' }))
    const wrapper = await mountEntry({ pk: 42 })

    await click(wrapper, 'Submit')

    expect(writes()).toHaveLength(1)
    expect(writes()[0].body).not.toHaveProperty('stock_location')
  })

  test('sends nothing when the amount is not above zero, and says why', async () => {
    const wrapper = await mountEntry({ pk: 42 })

    await typeAmount(wrapper, '0')
    await click(wrapper, 'Submit')

    expect(writes()).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(shownErrors(wrapper)).toEqual(['Please enter an amount'])
  })

  test('sends nothing without a date', async () => {
    const wrapper = await mountEntry({ pk: 42 })

    await setDate(wrapper, '')
    await click(wrapper, 'Submit')

    expect(writes()).toEqual([])
    expect(shownErrors(wrapper)).toEqual(['Please enter a date'])
  })

  // The legacy submit set isLoading and buttonDisabled before validating and
  // returned on an invalid form, leaving the button disabled and the overlay
  // on for good.
  test('an invalid submit leaves the form usable, and the fix then saves', async () => {
    const wrapper = await mountEntry({ pk: 42 })

    await typeAmount(wrapper, '0')
    await click(wrapper, 'Submit')

    expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('.b-overlay').exists()).toBe(false)

    await typeAmount(wrapper, '4')
    await click(wrapper, 'Submit')

    expect(writes()).toHaveLength(1)
    expect(writes()[0].body.amount).toBe(4)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed patch reports it and keeps the form', async () => {
    api.patch(ENTRY, () => HttpResponse.json({ detail: 'boom' }, { status: 500 }))
    const wrapper = await mountEntry({ pk: 42 })

    await click(wrapper, 'Submit')

    expect(bodies()).toEqual(['Error updating entry'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
  })

  test('a failed read tells the user', async () => {
    api.get(ENTRY, () => HttpResponse.json({ detail: 'boom' }, { status: 500 }))

    await mountEntry({ pk: 42 })

    expect(bodies()).toContain('Error fetching entry')
  })
})

describe('the header', () => {
  test('Cancel and the title link go back', async () => {
    const wrapper = await mountEntry()

    await click(wrapper, 'Cancel')
    expect(routerGo()).toHaveBeenCalledWith(-1)

    await wrapper.get('.backlink').trigger('click')
    expect(routerGo()).toHaveBeenCalledTimes(2)
  })

  test('the title names the mode', async () => {
    expect((await mountEntry()).get('h3').text()).toContain('New entry')
    expect((await mountEntry({ pk: 42 })).get('h3').text()).toContain('Edit entry')
  })
})
