import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import supplierReservationModel from '@/models/inventory/SupplierReservation.js'
import supplierReservationMaterialModel from '@/models/inventory/SupplierReservationMaterial.js'
import supplierModel from '@/models/inventory/Supplier.js'
import materialModel from '@/models/inventory/Material.js'

import SupplierReservationForm from '@/views/inventory/SupplierReservationForm.vue'

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
// These describe what SupplierReservationForm does *today*, before its
// hand-rolled create/update/delete loops are replaced by
// BaseModel.updateCollection. The contract they pin down is the HTTP traffic a
// given form state produces: which endpoints, in which order, with which
// payloads - plus the per-material toasts, which are user-visible and must
// survive the refactor.
//
// Do not "fix" a failing expectation here during the refactor without deciding
// deliberately that the behaviour is meant to change.

// vi.mock is hoisted and scoped per module, so the mock itself has to live here;
// it points at the harness's shared spy.
vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  // Spread the original: the auto-import resolver turns <b-form-input> & co
  // into named imports from here, so replacing the module would blank them out.
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const models = [
  supplierReservationModel,
  supplierReservationMaterialModel,
  supplierModel,
  materialModel,
]

let http

/** Mount this form. Thin wrapper so the tests read the same as before. */
function mount(props = {}, stubs = {}) {
  return mountForm(SupplierReservationForm, { props, stubs })
}

/** Wait for the async created() hook to settle. */
async function ready(wrapper) {
  await vi.waitFor(() => expect(wrapper.vm.isLoading).toBe(false))
  return wrapper
}

/**
 * Pick a supplier the way the UI does.
 *
 * This started as a workaround: while the component was options API, vuelidate
 * did not pick up a deep mutation of the supplierReservation object that
 * created() had replaced, so assigning supplierReservation.supplier directly
 * left $model null, submitForm's validity check bailed out, and nothing was
 * sent. The <script setup> conversion passes the state to useVuelidate
 * explicitly and fixes that - direct assignment works now, verified.
 *
 * Kept anyway, because going through the method is the real user path and
 * therefore the better test.
 */
async function pickSupplier(wrapper, supplier = { id: 3, name: 'ACME', city: 'Amsterdam' }) {
  wrapper.vm.selectSupplier(supplier)
  await wrapper.vm.$nextTick()
}

beforeEach(() => {
  // list() reads response.data.results, so the default GET has to be a page.
  http = installFakeClients(models, { defaultGet: { data: { count: 0, results: [] } } })
  toastCreate.mockClear()
})

afterEach(() => {
  restoreClients()
})

describe('SupplierReservationForm - create', () => {
  test('posts the reservation, then one post per material', async () => {
    const wrapper = await ready(mount())

    await pickSupplier(wrapper)
    wrapper.vm.supplierReservation.materials = [
      { material: 10, amount: 2, remarks: 'first' },
      { material: 11, amount: 5, remarks: 'second' },
    ]

    await wrapper.vm.submitForm()

    expect(urls('post')).toEqual([
      '/inventory/supplier-reservation/',
      '/inventory/supplier-reservationmaterial/',
      '/inventory/supplier-reservationmaterial/',
    ])

    const [, reservationPayload] = http.post.mock.calls[0]
    expect(reservationPayload).toMatchObject({ supplier: 3 })

    // Each material is linked to the id the server returned for the reservation.
    const [, first] = http.post.mock.calls[1]
    const [, second] = http.post.mock.calls[2]
    expect(first).toMatchObject({ material: 10, amount: 2, reservation: 100 })
    expect(second).toMatchObject({ material: 11, amount: 5, reservation: 100 })

    expect(http.patch).not.toHaveBeenCalled()
    expect(http.delete).not.toHaveBeenCalled()
  })

  test('sends nothing when the supplier is missing', async () => {
    const wrapper = await ready(mount())

    wrapper.vm.supplierReservation.supplier = null
    wrapper.vm.supplierReservation.materials = [{ material: 10, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(http.post).not.toHaveBeenCalled()
    expect(http.patch).not.toHaveBeenCalled()
  })

  test('navigates back and re-enables the button on success', async () => {
    const wrapper = await ready(mount())

    await pickSupplier(wrapper)
    wrapper.vm.supplierReservation.materials = []

    await wrapper.vm.submitForm()

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('does not navigate and re-enables the button when the reservation fails', async () => {
    const wrapper = await ready(mount())

    await pickSupplier(wrapper)
    http.post.mockRejectedValueOnce(new Error('boom'))

    wrapper.vm.supplierReservation.materials = [{ material: 10, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
    // The reservation post failed, so no material may be sent.
    expect(urls('post')).toEqual(['/inventory/supplier-reservation/'])
  })

  test('shows a single toast for the reservation and none per material', async () => {
    const wrapper = await ready(mount())

    await pickSupplier(wrapper)
    toastCreate.mockClear()
    wrapper.vm.supplierReservation.materials = [
      { material: 10, amount: 1 },
      { material: 11, amount: 2 },
    ]

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Created'])
  })
})

describe('SupplierReservationForm - update', () => {
  function editWrapper() {
    http.get.mockImplementation((url) => {
      if (url === '/get-csrf-token/') {
        return Promise.resolve({ data: { token: 'csrf-token' } })
      }
      if (url === '/inventory/supplier-reservation/42/') {
        return Promise.resolve({
          data: {
            id: 42,
            supplier: 3,
            supplier_view: { id: 3, name: 'ACME', city: 'Amsterdam' },
            materials: [],
          },
        })
      }
      return Promise.resolve({ data: { count: 0, results: [] } })
    })

    return mount({ pk: 42 })
  }

  async function readyEdit() {
    const wrapper = editWrapper()
    await vi.waitFor(() => expect(wrapper.vm.supplierReservation.id).toBe(42))
    return wrapper
  }

  test('patches the reservation, then creates, updates and deletes materials', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.supplierReservation.materials = [
      { id: 7, material: 10, amount: 3 },
      { material: 11, amount: 4 },
    ]
    wrapper.vm.deletedMaterials = [{ id: 9, material: 12, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(urls('patch')).toEqual([
      '/inventory/supplier-reservation/42/',
      '/inventory/supplier-reservationmaterial/7/',
    ])
    expect(urls('post')).toEqual(['/inventory/supplier-reservationmaterial/'])
    expect(urls('delete')).toEqual(['/inventory/supplier-reservationmaterial/9/'])

    // Existing and new materials alike are linked to the reservation being edited.
    const [, updated] = http.patch.mock.calls[1]
    expect(updated).toMatchObject({ id: 7, reservation: 42 })
    const [, created] = http.post.mock.calls[0]
    expect(created).toMatchObject({ material: 11, reservation: 42 })
  })

  test('ignores deleted materials that were never saved', async () => {
    const wrapper = await readyEdit()

    wrapper.vm.supplierReservation.materials = []
    wrapper.vm.deletedMaterials = [{ material: 12, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(http.delete).not.toHaveBeenCalled()
  })

  test('does not navigate when the patch fails', async () => {
    const wrapper = await readyEdit()

    http.patch.mockRejectedValueOnce(new Error('boom'))
    wrapper.vm.supplierReservation.materials = [{ id: 7, material: 10, amount: 3 }]

    await wrapper.vm.submitForm()

    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
  })

  test('shows one toast per material, after the reservation toast', async () => {
    const wrapper = await readyEdit()
    toastCreate.mockClear()

    wrapper.vm.supplierReservation.materials = [
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
    const wrapper = await readyEdit()
    toastCreate.mockClear()

    // The reservation patch succeeds, the first material patch succeeds, the
    // second fails.
    http.patch
      .mockResolvedValueOnce({ data: { id: 42 } })
      .mockResolvedValueOnce({ data: { id: 7 } })
      .mockRejectedValueOnce(new Error('boom'))

    wrapper.vm.supplierReservation.materials = [{ id: 7, amount: 1 }, { id: 8, amount: 2 }]

    await wrapper.vm.submitForm()

    expect(toastTitles()).toEqual(['Updated', 'Product updated', 'Error'])
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('SupplierReservationForm - material list editing', () => {
  test('deleteMaterial moves the material to deletedMaterials', async () => {
    const wrapper = await ready(mount())

    wrapper.vm.supplierReservation.materials = [{ id: 1, material: 10 }, { id: 2, material: 11 }]

    wrapper.vm.deleteMaterial(0)

    expect(wrapper.vm.supplierReservation.materials.map((m) => m.id)).toEqual([2])
    expect(wrapper.vm.deletedMaterials.map((m) => m.id)).toEqual([1])
  })

  test('doEditMaterial replaces the material at the edited index', async () => {
    const wrapper = await ready(mount())

    wrapper.vm.supplierReservation.materials = [{ id: 1, amount: 1 }, { id: 2, amount: 2 }]
    wrapper.vm.editMaterial({ id: 1, amount: 99 }, 0)
    wrapper.vm.doEditMaterial()

    expect(wrapper.vm.supplierReservation.materials[0].amount).toBe(99)
    expect(wrapper.vm.isEditMaterial).toBe(false)
    expect(wrapper.vm.editIndex).toBeNull()
  })

  test('selectSupplier stores the supplier and refreshes the material list', async () => {
    const wrapper = await ready(mount())
    http.get.mockClear()

    wrapper.vm.selectSupplier({ id: 3, name: 'ACME', city: 'Amsterdam' })
    await vi.waitFor(() => expect(http.get).toHaveBeenCalled())

    expect(wrapper.vm.supplierReservation.supplier).toBe(3)
    expect(wrapper.vm.selectedSupplier).toMatchObject({ id: 3, name: 'ACME' })
    // The material list is scoped to the chosen supplier.
    expect(urls('get').some((url) => url.includes('supplier_relation=3'))).toBe(true)
  })
})

// The add-material guard. Mutation testing showed this was entirely unpinned:
// isMaterialValid could be replaced by `true`, by `false`, or have its `&&`
// turned into `||`, and every existing test still passed. The guard decides
// whether a material may be added to the collection at all, so it is squarely
// part of what the collection refactor touches.
describe('SupplierReservationForm - the add-material guard', () => {
  async function readyToAdd() {
    const wrapper = await ready(mount())
    await pickSupplier(wrapper)
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

    expect(wrapper.vm.supplierReservation.materials).toHaveLength(1)
    expect(wrapper.vm.supplierReservation.materials[0]).toMatchObject({
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

    expect(wrapper.vm.supplierReservation.materials).toHaveLength(0)
  })

  // Pins greaterThanZero: zero is not a valid amount, so `>` may not become `>=`.
  test('refuses to add an amount of zero', async () => {
    const wrapper = await readyToAdd()
    await setMaterial(wrapper, { material: 10, amount: 0 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.supplierReservation.materials).toHaveLength(0)
  })

  test('clears the draft material after a successful add', async () => {
    const wrapper = await readyToAdd()
    await setMaterial(wrapper, { material: 10, amount: 2 })

    wrapper.vm.addMaterial()

    expect(wrapper.vm.material.material).toBeFalsy()
  })
})
