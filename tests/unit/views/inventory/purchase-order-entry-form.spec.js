import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import PurchaseOrderEntryForm from '@/views/inventory/PurchaseOrderEntryForm.vue'

import {
  vPurchaseOrderDetail,
  vPurchaseOrderEntry,
  vPurchaseOrderList,
  vStockLocation,
} from '@/api/valibot.gen'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import {
  mountForm,
  routerGo,
  toastCreate,
  toastTitles,
} from '../../support/form-harness.js'

// THE CREATE IS ONE REQUEST.
//
// The form used to POST one entry per row through BaseModel.updateCollection,
// which threw on the first failure: entries booked in before it stayed booked
// in, and the retry booked the earlier ones in twice. `POST /api/inventory/purchaseorder-entry/bulk/`
// takes the whole list in one request, so what this spec pins is the traffic a
// given form state produces - which endpoints, in which order, with which
// bodies - plus the guarantee that comes with it: a failed save books nothing
// in, and a removed row is simply absent from the list.
//
// The requests are read off the wire (tests/unit/support/api-seam), and the
// seam validates each body against the operation's generated request schema.
// The per-entry endpoint is stubbed but never expected to be called on the
// create path: if the loop comes back, the assertion below names the leaked
// request instead of failing with "no response registered".
//
// The edit path is a single entry and stays where it was: it PATCHes one row
// through the model, which was never a per-row loop.

vi.mock('bootstrap-vue-next', async () => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { useToast: () => ({ create }) }
})

const api = installApiSeam()

const BULK = '/api/inventory/purchaseorder-entry/bulk/'
const ENTRY = '/api/inventory/purchaseorder-entry/{id}/'
const ORDERS = '/api/inventory/purchaseorder/'
const ORDER = '/api/inventory/purchaseorder/{id}/'
const LOCATIONS = '/api/inventory/stock-location/'
/** The per-entry create the loop used. Stubbed so a leak is nameable. */
const ENTRY_CREATE = '/api/inventory/purchaseorder-entry/'

const STOCK_LOCATIONS = [
  fixtureFor(vStockLocation, { id: 1, name: 'Warehouse' }),
  fixtureFor(vStockLocation, { id: 2, name: 'Van' }),
]

/**
 * The purchase order the form receives, with the two products it was ordered
 * with: one entry is staged per material, for the ordered amount.
 */
const PURCHASE_ORDER = fixtureFor(vPurchaseOrderDetail, {
  id: 55,
  supplier: 3,
  purchase_order_id: 'PO-1',
  order_name: 'ACME',
  order_city: 'Amsterdam',
  materials: [
    { id: 7, material: 10, amount: 3, material_view: { name: 'Widget', unit: 'pcs' } },
    { id: 8, material: 11, amount: 5, material_view: { name: 'Gadget', unit: 'box' } },
  ],
})

const ENTRY_ROW = fixtureFor(vPurchaseOrderEntry, {
  id: 42,
  purchase_order: 55,
  purchase_order_material: 7,
  material_name: 'Widget',
  amount: 3,
  entry_date: '2026-03-04',
  stock_location: 1,
})

/** Every write the form made, in call order. Reads are noise here. */
function writes() {
  return api.requests().filter((request) => request.method !== 'get')
}

/** The staged rows as the bulk body carries them, whole. */
function bulkBody(rows) {
  return rows.map((row) => ({
    entry_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    stock_location: null,
    ...row,
  }))
}

beforeEach(() => {
  api.get(ORDERS, () => paginated([fixtureFor(vPurchaseOrderList, {
    id: 55,
    purchase_order_id: 'PO-1',
    order_name: 'ACME',
    order_city: 'Amsterdam',
    num_materials: 2,
  })]))
  api.get(LOCATIONS, () => paginated(STOCK_LOCATIONS))
  api.get(ORDER, () => PURCHASE_ORDER)
  api.get(ENTRY, () => ENTRY_ROW)
  // The endpoint answers with the entries it created, as DRF serializes them.
  api.post(BULK, ({ body }) => body.map((row, index) => fixtureFor(
    vPurchaseOrderEntry, { ...row, id: 100 + index, material_name: 'Widget' },
  )))
  api.patch(ENTRY, ({ body }) => fixtureFor(vPurchaseOrderEntry, { ...ENTRY_ROW, ...body }))
  api.post(ENTRY_CREATE, () => fixtureFor(vPurchaseOrderEntry, { id: 100 }))
  toastCreate.mockClear()
})

// The form focuses the amount input after picking a product. Under
// shallowMount BFormInput is a stub, and a default stub has no focus() - so
// give it one, or selectPurchaseOrderMaterial throws.
const FOCUSABLE_INPUT = { BFormInput: { template: '<input />', methods: { focus() {} } } }

function mount(props = {}, stubs = {}) {
  return mountForm(PurchaseOrderEntryForm, { props, stubs: { ...FOCUSABLE_INPUT, ...stubs } })
}

/**
 * created() lists stock locations and purchase orders; wait for both.
 * It is not an async hook - it chains off stockLocationModel.list() - so there
 * is no promise to await, only observable state.
 */
async function ready(wrapper) {
  await vi.waitFor(() => expect(wrapper.vm.stockLocations.length).toBe(2))
  await settle()

  return wrapper
}

/** Pick a purchase order, which is what builds the entry rows. */
async function pickPurchaseOrder(wrapper) {
  await wrapper.vm.selectPurchaseOrder({ id: 55 })
  await settle()
}

describe('PurchaseOrderEntryForm - building the entry rows', () => {
  test('selecting a purchase order creates one entry per material', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    expect(wrapper.vm.purchaseorderEntries).toHaveLength(2)
    expect(wrapper.vm.purchaseorderEntries[0]).toMatchObject({
      purchase_order: 55,
      purchase_order_material: 7,
      amount: 3,
      ordered_amount: 3,
      purchase_order_material_view: { name: 'Widget', unit: 'pcs' },
    })
    expect(wrapper.vm.purchaseorderEntries[1]).toMatchObject({
      purchase_order: 55,
      purchase_order_material: 8,
      amount: 5,
      ordered_amount: 5,
    })
  })

  test('selecting another purchase order replaces the rows rather than appending', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)
    await pickPurchaseOrder(wrapper)

    expect(wrapper.vm.purchaseorderEntries).toHaveLength(2)
  })

  test('each entry gets its own date object, not a shared one', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    const [first, second] = wrapper.vm.purchaseorderEntries
    expect(first.entry_date).not.toBe(second.entry_date)
  })

  test('choosing a default location stamps it on every entry', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    wrapper.vm.defaultLocation = 2
    await wrapper.vm.$nextTick()

    for (const entry of wrapper.vm.purchaseorderEntries) {
      expect(entry.stock_location).toBe(2)
      expect(entry.stock_location_name).toBe('Van')
    }
  })

  test('deleteEntry removes the row from the list', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    wrapper.vm.deleteEntry(0)

    expect(wrapper.vm.purchaseorderEntries.map((e) => e.purchase_order_material)).toEqual([8])
  })

  test('doEditEntry writes back the row and resolves the location name', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    wrapper.vm.editEntry({ purchase_order_material: 7, amount: 99, stock_location: 1 }, 0)
    wrapper.vm.doEditEntry()

    expect(wrapper.vm.purchaseorderEntries[0]).toMatchObject({
      amount: 99,
      stock_location_name: 'Warehouse',
    })
    expect(wrapper.vm.isEditEntry).toBe(false)
    expect(wrapper.vm.editIndex).toBeNull()
  })
})

describe('PurchaseOrderEntryForm - create', () => {
  test('sends one request carrying every entry row, with the dates formatted', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    await wrapper.vm.submitForm()

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

  test('shows one toast for the save, not one per entry', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Created'])
  })

  test('navigates back and re-enables the button', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    await wrapper.vm.submitForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('a failed save books nothing in, and the retry sends the same list', async () => {
    // The rows are one atomic request, so the entries the first attempt failed
    // on are not booked in: the retry cannot book any of them in twice.
    let attempts = 0
    api.post(BULK, ({ body }) => {
      attempts += 1
      return attempts === 1
        ? HttpResponse.json({ detail: 'boom' }, { status: 500 })
        : body.map((row, index) => fixtureFor(vPurchaseOrderEntry, { ...row, id: 100 + index }))
    })

    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    await wrapper.vm.submitForm()

    expect(writes().map((request) => request.path)).toEqual([BULK])
    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)

    await wrapper.vm.submitForm()

    expect(writes().map((request) => request.path)).toEqual([BULK, BULK])
    expect(writes()[1].body).toEqual(writes()[0].body)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a removed row is left out of the list, and nothing is deleted server-side', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    wrapper.vm.deleteEntry(0)
    await wrapper.vm.submitForm()

    expect(writes()).toEqual([
      {
        method: 'post',
        path: BULK,
        query: {},
        body: bulkBody([{ purchase_order: 55, purchase_order_material: 8, amount: 5 }]),
      },
    ])
    expect(api.requests().map((request) => request.method)).not.toContain('delete')
  })

  test('the create path does not validate before sending', async () => {
    // No purchase order picked, so the entry form is empty and invalid. The
    // create branch returns before submitForm's validity check, and an empty
    // list is nothing to send rather than a rejection.
    const wrapper = await ready(mount())

    await wrapper.vm.submitForm()

    expect(writes()).toEqual([])
    expect(toastTitles()).toEqual([])
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})

describe('PurchaseOrderEntryForm - edit', () => {
  async function readyEdit() {
    const wrapper = mount({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.entry.material_name).toBe('Widget'))
    await settle()

    return wrapper
  }

  test('loads the entry and derives the display fields', async () => {
    const wrapper = await readyEdit()

    expect(wrapper.vm.entry).toMatchObject({
      id: 42,
      amount: 3,
      purchase_order_material_view: { name: 'Widget', unit: '' },
    })
  })

  test('patches the edited entry and navigates back', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.entry.amount = 99
    await wrapper.vm.submitForm()

    expect(writes()).toEqual([
      {
        method: 'patch',
        path: '/api/inventory/purchaseorder-entry/42/',
        query: {},
        body: expect.objectContaining({ id: 42, purchase_order_material: 7, amount: 99 }),
      },
    ])

    expect(toastTitles()).toEqual(['Updated'])
    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })

  test('picking a different product updates the entry being edited', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.selectPurchaseOrderMaterial({ id: 8 })
    await wrapper.vm.submitForm()

    expect(writes()[0].body.purchase_order_material).toBe(8)
  })

  test('sends nothing when the entry is not valid', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.entry.amount = 0
    await wrapper.vm.submitForm()

    expect(writes()).toEqual([])
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('drops a null stock_location from the payload', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.entry.stock_location = null
    await wrapper.vm.submitForm()

    expect(writes()[0].body).not.toHaveProperty('stock_location')
  })

  test('does not navigate when the patch fails', async () => {
    api.patch(ENTRY, () => HttpResponse.json({ detail: 'boom' }, { status: 500 }))

    const wrapper = await readyEdit()
    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })
})

// The add-entry guard. Mutation testing showed this was entirely unpinned:
// isEntryValid could be replaced by `true`, by `false`, or have its `&&` turned
// into `||`, and every existing test still passed.
//
// NOTE, not changed here: the guard $touch()es entry_date but never checks it,
// while entry_date is a `required` rule. It checks amount, which it does not
// touch. So an entry with no entry_date passes this guard. Pinned as-is below;
// flagged for Evert rather than fixed.
describe('PurchaseOrderEntryForm - the add-entry guard', () => {
  async function readyToAdd() {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    return wrapper
  }

  async function setEntry(wrapper, fields) {
    Object.assign(wrapper.vm.entry, fields)
    await wrapper.vm.$nextTick()
  }

  test('adds the entry when both checked fields are valid', async () => {
    const wrapper = await readyToAdd()
    const before = wrapper.vm.purchaseorderEntries.length
    await setEntry(wrapper, { purchase_order_material: 7, amount: 2 })

    wrapper.vm.addEntry()

    expect(wrapper.vm.purchaseorderEntries).toHaveLength(before + 1)
    expect(wrapper.vm.purchaseorderEntries[before]).toMatchObject({
      purchase_order_material: 7,
      amount: 2,
    })
  })

  // Exactly one of the two checks fails here, which is what distinguishes
  // `&&` from `||` in the guard.
  test('refuses to add when no purchase order material has been chosen', async () => {
    const wrapper = await readyToAdd()
    const before = wrapper.vm.purchaseorderEntries.length
    await setEntry(wrapper, { purchase_order_material: null, amount: 2 })

    wrapper.vm.addEntry()

    expect(wrapper.vm.purchaseorderEntries).toHaveLength(before)
  })

  // Pins greaterThanZero: zero is not a valid amount, so `>` may not become `>=`.
  test('refuses to add an amount of zero', async () => {
    const wrapper = await readyToAdd()
    const before = wrapper.vm.purchaseorderEntries.length
    await setEntry(wrapper, { purchase_order_material: 7, amount: 0 })

    wrapper.vm.addEntry()

    expect(wrapper.vm.purchaseorderEntries).toHaveLength(before)
  })

  test('clears the draft entry after a successful add', async () => {
    const wrapper = await readyToAdd()
    await setEntry(wrapper, { purchase_order_material: 7, amount: 2 })

    wrapper.vm.addEntry()

    expect(wrapper.vm.entry.purchase_order_material).toBeFalsy()
  })
})
