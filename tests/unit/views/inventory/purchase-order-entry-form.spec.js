import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import purchaseorderEntryModel from '@/models/inventory/PurchaseOrderEntry.js'
import purchaseOrderModel from '@/models/inventory/PurchaseOrder.js'
import stockLocationModel from '@/models/inventory/StockLocation.js'
import materialModel from '@/models/inventory/Material.js'

import PurchaseOrderEntryForm from '@/views/inventory/PurchaseOrderEntryForm.vue'

import {
  installFakeClients,
  mountForm,
  restoreClients,
  routerGo,
  toastCreate,
  toastTitles,
  urls,
} from '../../support/form-harness.js'

// CHARACTERISATION TESTS.
//
// These describe what PurchaseOrderEntryForm does *today*, before the model
// logic in it moves to the model layer. The contract they pin down is the HTTP
// traffic a given form state produces, plus the per-entry toasts.
//
// Two of these tests pin behaviour that is almost certainly a bug - see the
// "update - pinned bug" block. They are here to record what the code does, not
// to bless it. Fixing it is a separate, deliberate change.

vi.mock('bootstrap-vue-next', async () => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { useToast: () => ({ create }) }
})

const models = [
  purchaseorderEntryModel,
  purchaseOrderModel,
  stockLocationModel,
  materialModel,
]

const STOCK_LOCATIONS = [
  { id: 1, name: 'Warehouse' },
  { id: 2, name: 'Van' },
]

const PURCHASE_ORDER = {
  id: 55,
  materials: [
    { id: 7, amount: 3, material_view: { name: 'Widget', unit: 'pcs' } },
    { id: 8, amount: 5, material_view: { name: 'Gadget', unit: 'box' } },
  ],
}

let http

function mount(props = {}, stubs = {}) {
  return mountForm(PurchaseOrderEntryForm, { props, stubs })
}

/**
 * created() lists stock locations and purchase orders; wait for both.
 * It is not an async hook - it chains off stockLocationModel.list() - so there
 * is no promise to await, only observable state.
 */
async function ready(wrapper) {
  await vi.waitFor(() => expect(wrapper.vm.stockLocations.length).toBe(2))
  return wrapper
}

/** Pick a purchase order, which is what builds the entry rows. */
async function pickPurchaseOrder(wrapper) {
  await wrapper.vm.selectPurchaseOrder({ id: 55 })
  await wrapper.vm.$nextTick()
}

beforeEach(() => {
  http = installFakeClients(models, {
    defaultGet: { data: { count: 0, results: [] } },
  })
  http.get.mockImplementation((url) => {
    if (url === '/get-csrf-token/') {
      return Promise.resolve({ data: { token: 'csrf-token' } })
    }
    if (url.startsWith('/inventory/stock-location/')) {
      return Promise.resolve({ data: { count: 2, results: STOCK_LOCATIONS } })
    }
    if (url === '/inventory/purchaseorder/55/') {
      return Promise.resolve({ data: PURCHASE_ORDER })
    }
    return Promise.resolve({ data: { count: 0, results: [] } })
  })
  toastCreate.mockClear()
})

afterEach(() => {
  restoreClients()
})

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

  test('deleteEntry removes the row and remembers it', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    wrapper.vm.deleteEntry(0)

    expect(wrapper.vm.purchaseorderEntries.map((e) => e.purchase_order_material)).toEqual([8])
    expect(wrapper.vm.deletedEntries.map((e) => e.purchase_order_material)).toEqual([7])
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
  test('posts one entry per row, with the date formatted', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    await wrapper.vm.submitForm()

    expect(urls('post')).toEqual([
      '/inventory/purchaseorder-entry/',
      '/inventory/purchaseorder-entry/',
    ])

    const [, first] = http.post.mock.calls[0]
    expect(first).toMatchObject({
      purchase_order: 55,
      purchase_order_material: 7,
      amount: 3,
    })
    // preInsert turns the Date into YYYY-MM-DD.
    expect(first.entry_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  test('shows one toast per entry', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Created', 'Created'])
  })

  test('navigates back and re-enables the button', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    await wrapper.vm.submitForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('stops at the first failure, keeping the toast for the entry before it', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    http.post
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockRejectedValueOnce(new Error('boom'))

    await wrapper.vm.submitForm()

    expect(urls('post')).toHaveLength(2)
    expect(toastTitles()).toEqual(['Created', 'Error'])
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })

  test('deleted rows are not sent, and are never deleted server-side', async () => {
    const wrapper = await ready(mount())
    await pickPurchaseOrder(wrapper)

    wrapper.vm.deleteEntry(0)
    await wrapper.vm.submitForm()

    expect(urls('post')).toEqual(['/inventory/purchaseorder-entry/'])
    // The rows were never saved, so there is nothing to delete.
    expect(http.delete).not.toHaveBeenCalled()
  })

  test('the create path does not validate before sending', async () => {
    // No purchase order picked, so the entry form is empty and invalid. The
    // create branch returns before submitForm's validity check, so an empty
    // entry list simply posts nothing rather than being rejected.
    const wrapper = await ready(mount())

    await wrapper.vm.submitForm()

    expect(http.post).not.toHaveBeenCalled()
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})

describe('PurchaseOrderEntryForm - edit', () => {
  async function readyEdit() {
    http.get.mockImplementation((url) => {
      if (url === '/get-csrf-token/') {
        return Promise.resolve({ data: { token: 'csrf-token' } })
      }
      if (url.startsWith('/inventory/stock-location/')) {
        return Promise.resolve({ data: { count: 2, results: STOCK_LOCATIONS } })
      }
      if (url === '/inventory/purchaseorder-entry/42/') {
        return Promise.resolve({
          data: {
            id: 42,
            purchase_order: 55,
            purchase_order_material: 7,
            material_name: 'Widget',
            amount: 3,
            entry_date: '2026-03-04',
            stock_location: 1,
          },
        })
      }
      return Promise.resolve({ data: { count: 0, results: [] } })
    })

    const wrapper = mount({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.entry.material_name).toBe('Widget'))
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
})

// PINNED BUG.
//
// In edit mode the whole form binds to `entry` (loadData fills it, and every
// v-model in the edit panel points at it), but submitForm's update path
// validates and patches `purchaseorderEntry` - a different object, left at the
// defaults from data() and never populated when a pk is present.
//
// Two consequences, both pinned below: v$.$invalid is always true because
// purchaseorderEntry.purchase_order_material is null, so submit returns early
// and nothing is sent at all. Were the validation to pass, it would PATCH the
// empty defaults object rather than the user's edits.
//
// These tests document current behaviour so a fix is a deliberate, visible
// change rather than an accident. Do not "fix" them to match intent.
describe('PurchaseOrderEntryForm - edit, pinned bug', () => {
  async function readyEdit() {
    http.get.mockImplementation((url) => {
      if (url === '/get-csrf-token/') {
        return Promise.resolve({ data: { token: 'csrf-token' } })
      }
      if (url.startsWith('/inventory/stock-location/')) {
        return Promise.resolve({ data: { count: 2, results: STOCK_LOCATIONS } })
      }
      if (url === '/inventory/purchaseorder-entry/42/') {
        return Promise.resolve({
          data: {
            id: 42,
            purchase_order: 55,
            purchase_order_material: 7,
            material_name: 'Widget',
            amount: 3,
            entry_date: '2026-03-04',
            stock_location: 1,
          },
        })
      }
      return Promise.resolve({ data: { count: 0, results: [] } })
    })

    const wrapper = mount({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.entry.material_name).toBe('Widget'))
    return wrapper
  }

  test('submitting an edit sends nothing and does not navigate', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.entry.amount = 99
    await wrapper.vm.submitForm()

    expect(http.patch).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
    expect(routerGo()).not.toHaveBeenCalled()
  })

  test('the object the update path would send is the untouched default', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.entry.amount = 99

    // The edits landed on `entry`, while the update path reads
    // `purchaseorderEntry`, which nothing ever filled in.
    expect(wrapper.vm.entry.amount).toBe(99)
    expect(wrapper.vm.purchaseorderEntry.purchase_order_material).toBeNull()
    expect(wrapper.vm.purchaseorderEntry.amount).toBe(0)
  })
})
