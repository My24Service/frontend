import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import purchaseOrderModel from '@/models/inventory/PurchaseOrder.js'
import purchaseOrderMaterialModel from '@/models/inventory/PurchaseOrderMaterial.js'
import supplierModel from '@/models/inventory/Supplier.js'
import materialModel from '@/models/inventory/Material.js'
import supplierReservationModel from '@/models/inventory/SupplierReservation.js'

import PurchaseOrderForm from '@/views/inventory/PurchaseOrderForm.vue'

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
// These describe what PurchaseOrderForm does *today*, before the submitForm
// refactor, and are written against the component's behaviour rather than its
// internals so they stay meaningful afterwards. The contract they pin down is
// the HTTP traffic a given form state produces: which endpoints, in which
// order, with which payloads. That contract must not change when the
// hand-rolled create/update/delete loops in submitForm are replaced by
// BaseModel.updateCollection.
//
// Do not "fix" a failing expectation here during the refactor without deciding
// deliberately that the API traffic is meant to change.

// vi.mock is hoisted and scoped per module, so the mock itself has to live here;
// it points at the harness's shared spy.
vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  // Spread the original: the auto-import resolver turns <b-form-input> & co
  // into named imports from here, so replacing the module would blank them out.
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

// Using the real model code keeps preInsert/preUpdate (notably the
// expected_entry_date formatting) in the picture.
const models = [
  purchaseOrderModel,
  purchaseOrderMaterialModel,
  supplierModel,
  materialModel,
  supplierReservationModel,
]

let http

/** Mount this form. Thin wrapper so the tests read the same as before. */
function mount(props = {}, stubs = {}) {
  return mountForm(PurchaseOrderForm, { props, stubs })
}

beforeEach(() => {
  // This form's searches hit autocomplete endpoints, which return bare arrays.
  http = installFakeClients(models)
  toastCreate.mockClear()
})

afterEach(() => {
  restoreClients()
})

describe('PurchaseOrderForm - create', () => {
  test('posts the purchase order, then one post per material', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.supplier = 3
    wrapper.vm.purchaseOrder.order_name = 'ACME'
    wrapper.vm.purchaseOrder.materials = [
      { material: 10, amount: 2, remarks: 'first' },
      { material: 11, amount: 5, remarks: 'second' },
    ]

    await wrapper.vm.submitForm()

    expect(urls('post')).toEqual([
      '/inventory/purchaseorder/',
      '/inventory/purchaseorder-material/',
      '/inventory/purchaseorder-material/',
    ])

    // The order itself carries the form data.
    const [, orderPayload] = http.post.mock.calls[0]
    expect(orderPayload).toMatchObject({ supplier: 3, order_name: 'ACME' })

    // Each material is linked to the id the server returned for the order.
    const [, firstMaterial] = http.post.mock.calls[1]
    const [, secondMaterial] = http.post.mock.calls[2]
    expect(firstMaterial).toMatchObject({ material: 10, amount: 2, purchase_order: 100 })
    expect(secondMaterial).toMatchObject({ material: 11, amount: 5, purchase_order: 100 })

    expect(http.patch).not.toHaveBeenCalled()
    expect(http.delete).not.toHaveBeenCalled()
  })

  test('formats expected_entry_date as YYYY-MM-DD before sending', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.supplier = 3
    wrapper.vm.purchaseOrder.expected_entry_date = new Date('2026-03-04T12:00:00Z')
    wrapper.vm.purchaseOrder.materials = []

    await wrapper.vm.submitForm()

    const [, payload] = http.post.mock.calls[0]
    expect(payload.expected_entry_date).toBe('2026-03-04')
  })

  test('drops purchase_order_id when creating', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.supplier = 3
    wrapper.vm.purchaseOrder.purchase_order_id = 'should-not-be-sent'
    wrapper.vm.purchaseOrder.materials = []

    await wrapper.vm.submitForm()

    const [, payload] = http.post.mock.calls[0]
    expect(payload).not.toHaveProperty('purchase_order_id')
  })

  test('sends nothing when the supplier is missing', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.supplier = null
    wrapper.vm.purchaseOrder.materials = [{ material: 10, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(http.post).not.toHaveBeenCalled()
    expect(http.patch).not.toHaveBeenCalled()
  })

  test('navigates back and re-enables the button on success', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.supplier = 3
    wrapper.vm.purchaseOrder.materials = []

    await wrapper.vm.submitForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('does not navigate and re-enables the button when the order fails', async () => {
    http.post.mockRejectedValueOnce(new Error('boom'))

    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.supplier = 3
    wrapper.vm.purchaseOrder.materials = [{ material: 10, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
    // The order post failed, so no material may be sent.
    expect(urls('post')).toEqual(['/inventory/purchaseorder/'])
  })
})

describe('PurchaseOrderForm - update', () => {
  function editWrapper() {
    // loadOrder() runs in created() and fetches the detail endpoint.
    http.get.mockImplementation((url) => {
      if (url === '/get-csrf-token/') {
        return Promise.resolve({ data: { token: 'csrf-token' } })
      }
      if (url === '/inventory/purchaseorder/42/') {
        return Promise.resolve({
          data: {
            id: 42,
            supplier: 3,
            order_name: 'ACME',
            expected_entry_date: '04/03/2026',
            materials: [],
          },
        })
      }
      return Promise.resolve({ data: [] })
    })

    return mount({ pk: 42 })
  }

  test('patches the order, then creates, updates and deletes materials', async () => {
    const wrapper = editWrapper()
    await vi.waitFor(() => expect(wrapper.vm.purchaseOrder.order_name).toBe('ACME'))

    wrapper.vm.purchaseOrder.materials = [
      { id: 7, material: 10, amount: 3 },
      { material: 11, amount: 4 },
    ]
    wrapper.vm.deletedMaterials = [{ id: 9, material: 12, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(urls('patch')).toEqual([
      '/inventory/purchaseorder/42/',
      '/inventory/purchaseorder-material/7/',
    ])
    expect(urls('post')).toEqual(['/inventory/purchaseorder-material/'])
    expect(urls('delete')).toEqual(['/inventory/purchaseorder-material/9/'])

    // Existing and new materials alike are linked to the order being edited.
    const [, updated] = http.patch.mock.calls[1]
    expect(updated).toMatchObject({ id: 7, purchase_order: 42 })
    const [, created] = http.post.mock.calls[0]
    expect(created).toMatchObject({ material: 11, purchase_order: 42 })
  })

  test('parses the API date into a Date the picker can use, and sends it back formatted', async () => {
    const wrapper = editWrapper()
    await vi.waitFor(() => expect(wrapper.vm.purchaseOrder.order_name).toBe('ACME'))

    // The detail endpoint returns DD/MM/YYYY; the form needs a Date.
    expect(wrapper.vm.purchaseOrder.expected_entry_date).toBeInstanceOf(Date)

    await wrapper.vm.submitForm()

    const [, payload] = http.patch.mock.calls[0]
    expect(payload.expected_entry_date).toBe('2026-03-04')
  })

  test('ignores deleted materials that were never saved', async () => {
    const wrapper = editWrapper()
    await vi.waitFor(() => expect(wrapper.vm.purchaseOrder.order_name).toBe('ACME'))

    wrapper.vm.purchaseOrder.materials = []
    wrapper.vm.deletedMaterials = [{ material: 12, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(http.delete).not.toHaveBeenCalled()
  })

  test('does not navigate when the patch fails', async () => {
    const wrapper = editWrapper()
    await vi.waitFor(() => expect(wrapper.vm.purchaseOrder.order_name).toBe('ACME'))

    http.patch.mockRejectedValueOnce(new Error('boom'))
    wrapper.vm.purchaseOrder.materials = [{ id: 7, material: 10, amount: 3 }]

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })
})

// The per-material toasts are user-visible behaviour that the refactor to
// BaseModel.updateCollection had to preserve, so they get their own assertions
// rather than riding along on the HTTP ones. Verified to pass against both the
// pre-refactor and post-refactor component.
describe('PurchaseOrderForm - toasts', () => {
  test('create shows a single toast for the order and none per material', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.supplier = 3
    wrapper.vm.purchaseOrder.materials = [{ material: 10, amount: 1 }, { material: 11, amount: 2 }]

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Created'])
  })

  test('update shows one toast per material, after the order toast', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/get-csrf-token/') return Promise.resolve({ data: { token: 'csrf-token' } })
      if (url === '/inventory/purchaseorder/42/') {
        return Promise.resolve({
          data: { id: 42, supplier: 3, order_name: 'ACME', expected_entry_date: '04/03/2026', materials: [] },
        })
      }
      return Promise.resolve({ data: [] })
    })

    const wrapper = mount({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.purchaseOrder.order_name).toBe('ACME'))
    toastCreate.mockClear()

    wrapper.vm.purchaseOrder.materials = [
      { id: 7, material: 10, amount: 3 },
      { material: 11, amount: 4 },
    ]
    wrapper.vm.deletedMaterials = [{ id: 9 }]

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual([
      'Updated',
      'Product updated',
      'Product created',
      'Product removed',
    ])
  })

  test('toasts for materials saved before a failure are kept', async () => {
    http.get.mockImplementation((url) => {
      if (url === '/get-csrf-token/') return Promise.resolve({ data: { token: 'csrf-token' } })
      if (url === '/inventory/purchaseorder/42/') {
        return Promise.resolve({
          data: { id: 42, supplier: 3, order_name: 'ACME', expected_entry_date: '04/03/2026', materials: [] },
        })
      }
      return Promise.resolve({ data: [] })
    })

    const wrapper = mount({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.purchaseOrder.order_name).toBe('ACME'))
    toastCreate.mockClear()

    // The order patch succeeds, the first material patch succeeds, the second fails.
    http.patch
      .mockResolvedValueOnce({ data: { id: 42 } })
      .mockResolvedValueOnce({ data: { id: 7 } })
      .mockRejectedValueOnce(new Error('boom'))

    wrapper.vm.purchaseOrder.materials = [{ id: 7, amount: 1 }, { id: 8, amount: 2 }]

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Updated', 'Product updated', 'Error'])
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('PurchaseOrderForm - material list editing', () => {
  test('deleteMaterial moves the material to deletedMaterials', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.materials = [{ id: 1, material: 10 }, { id: 2, material: 11 }]

    wrapper.vm.deleteMaterial(0)

    expect(wrapper.vm.purchaseOrder.materials.map((m) => m.id)).toEqual([2])
    expect(wrapper.vm.deletedMaterials.map((m) => m.id)).toEqual([1])
  })

  test('doEditMaterial replaces the material at the edited index', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.materials = [{ id: 1, amount: 1 }, { id: 2, amount: 2 }]
    wrapper.vm.editMaterial({ id: 1, amount: 99 }, 0)
    wrapper.vm.doEditMaterial()

    expect(wrapper.vm.purchaseOrder.materials[0].amount).toBe(99)
    expect(wrapper.vm.isEditMaterial).toBe(false)
    expect(wrapper.vm.editIndex).toBeNull()
  })

  // selectMaterial focuses the amount input through a ref. That ref moved from
  // this.$refs.amount to a <script setup> template ref during the Composition
  // API conversion, which is the kind of change that fails silently, so it gets
  // a test of its own. The input is stubbed here, hence the explicit stub with
  // a focus method.
  // The materials block is guarded by v-if="purchaseOrder.order_name", so the
  // amount input only exists once a supplier has been picked. Both helpers below
  // go through that path first, which is also the only way a user can reach
  // selectMaterial.
  async function wrapperWithSupplier(focus) {
    const wrapper = mount({}, {
      BFormInput: { template: '<input />', methods: { focus } },
    })
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.order_name = 'ACME'
    wrapper.vm.purchaseOrder.supplier = 3
    await wrapper.vm.$nextTick()

    return wrapper
  }

  test('selectMaterial copies the product and focuses the amount input', async () => {
    const focus = vi.fn()
    const wrapper = await wrapperWithSupplier(focus)

    wrapper.vm.selectMaterial({ id: 10, name: 'Widget' })

    expect(wrapper.vm.material.material).toBe(10)
    expect(wrapper.vm.material.material_view.name).toBe('Widget')
    expect(wrapper.vm.material.amount).toBe(0)
    expect(focus).toHaveBeenCalled()
  })

  test('selectMaterial keeps amount and remarks while editing', async () => {
    const focus = vi.fn()
    const wrapper = await wrapperWithSupplier(focus)

    wrapper.vm.editMaterial({ id: 1, material_view: {}, amount: 7, remarks: 'keep' }, 0)
    wrapper.vm.selectMaterial({ id: 10, name: 'Widget' })

    expect(wrapper.vm.material.amount).toBe(7)
    expect(wrapper.vm.material.remarks).toBe('keep')
  })

  test('selectSupplier copies the supplier details and clears the materials', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.purchaseOrder.materials = [{ id: 1 }]
    wrapper.vm.selectSupplier({
      id: 3, name: 'ACME', address: 'Street 1', city: 'Amsterdam',
      postal: '1000AA', country_code: 'NL', tel: '020', mobile: '06',
      email: 'a@b.nl', contact: 'Jan', remarks: 'none',
    })

    expect(wrapper.vm.purchaseOrder).toMatchObject({
      supplier: 3,
      order_name: 'ACME',
      order_city: 'Amsterdam',
      order_email: 'a@b.nl',
    })
    expect(wrapper.vm.purchaseOrder.materials).toEqual([])
  })

  test('selectReservation copies the nested supplier details', async () => {
    const wrapper = mount()
    await wrapper.vm.$nextTick()

    wrapper.vm.selectReservation({
      id: 55,
      supplier: {
        id: 3, name: 'ACME', address: 'Street 1', city: 'Amsterdam',
        postal: '1000AA', country_code: 'NL', tel: '020', mobile: '06',
        email: 'a@b.nl', contact: 'Jan', remarks: 'none',
      },
      products: [{ material: 10, amount: 1 }],
    })

    expect(wrapper.vm.purchaseOrder).toMatchObject({
      supplier_reservation: 55,
      supplier: 3,
      order_name: 'ACME',
    })
    expect(wrapper.vm.purchaseOrder.materials).toEqual([{ material: 10, amount: 1 }])
  })
})

// The add-material guard. Mutation testing showed this was entirely unpinned:
// isMaterialValid could be replaced by `true`, by `false`, or have its `&&`
// turned into `||`, and every existing test still passed. Mirrors the block of
// the same name in supplier-reservation-form.spec.js - the two forms share this
// guard verbatim.
describe('PurchaseOrderForm - the add-material guard', () => {
  async function readyToAdd() {
    const wrapper = mount()
    await wrapper.vm.$nextTick()
    return wrapper
  }

  async function setMaterial(wrapper, fields) {
    Object.assign(wrapper.vm.material, fields)
    await wrapper.vm.$nextTick()
  }

  test('adds the material when both fields are valid', async () => {
    const wrapper = await readyToAdd()
    await setMaterial(wrapper, { material: 10, amount: 2 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.purchaseOrder.materials).toHaveLength(1)
    expect(wrapper.vm.purchaseOrder.materials[0]).toMatchObject({
      material: 10,
      amount: 2,
    })
  })

  // Exactly one of the two checks fails here, which is what distinguishes
  // `&&` from `||` in the guard.
  test('refuses to add when no material has been chosen', async () => {
    const wrapper = await readyToAdd()
    await setMaterial(wrapper, { material: null, amount: 2 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.purchaseOrder.materials).toHaveLength(0)
  })

  // Pins greaterThanZero: zero is not a valid amount, so `>` may not become `>=`.
  test('refuses to add an amount of zero', async () => {
    const wrapper = await readyToAdd()
    await setMaterial(wrapper, { material: 10, amount: 0 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.purchaseOrder.materials).toHaveLength(0)
  })

  test('clears the draft material after a successful add', async () => {
    const wrapper = await readyToAdd()
    await setMaterial(wrapper, { material: 10, amount: 2 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.material.material).toBeFalsy()
  })
})
