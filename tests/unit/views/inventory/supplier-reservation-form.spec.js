import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { createMemoryHistory, createRouter } from 'vue-router'

import supplierReservationModel from '@/models/inventory/SupplierReservation.js'
import supplierReservationMaterialModel from '@/models/inventory/SupplierReservationMaterial.js'
import supplierModel from '@/models/inventory/Supplier.js'
import materialModel from '@/models/inventory/Material.js'
import { useMainStore } from '@/stores/main'
import componentMixin from '@/mixins/common'

import SupplierReservationForm from '@/views/inventory/SupplierReservationForm.vue'

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

const toastCreate = vi.fn()

vi.mock('bootstrap-vue-next', () => ({
  useToast: () => ({ create: toastCreate }),
}))

// The models are module-level singletons, so a fake client assigned onto each
// one is visible to the component, which imports the same instances.
const models = {
  reservation: supplierReservationModel,
  reservationMaterial: supplierReservationMaterialModel,
  supplier: supplierModel,
  material: materialModel,
}

const realClients = new Map()
let http

function installFakeClients() {
  http = {
    get: vi.fn((url) => {
      if (url === '/get-csrf-token/') {
        return Promise.resolve({ data: { token: 'csrf-token' } })
      }
      // list() reads response.data.results.
      return Promise.resolve({ data: { count: 0, results: [] } })
    }),
    post: vi.fn(() => Promise.resolve({ data: { id: 100 } })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  }

  for (const model of Object.values(models)) {
    realClients.set(model, model.axios)
    model.axios = http
  }
}

function restoreClients() {
  for (const [model, client] of realClients.entries()) {
    model.axios = client
  }
  realClients.clear()
}

// A real router rather than a global.mocks.$router stub, so these tests keep
// working if the component is later converted to <script setup> and reaches the
// router through useRouter().
let routerGo

function mountForm(props = {}, extraStubs = {}) {
  const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: true })
  const mainStore = useMainStore()
  mainStore.getCurrentLanguage = 'nl'

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
  })
  routerGo = vi.spyOn(router, 'go').mockImplementation(() => {})

  return shallowMount(SupplierReservationForm, {
    props,
    global: {
      plugins: [pinia, router],
      // main.js installs componentMixin app-wide; options-API templates resolve
      // $trans and the isStaff/isAdmin family through it. A <script setup>
      // component imports $trans directly and does not need this, but this
      // component is options-API, so the mixin has to be installed here too.
      mixins: [componentMixin],
      // Do NOT stub b-overlay: a default stub does not render its slot, and
      // b-overlay wraps the entire form body, so stubbing it silently removes
      // the whole template from the rendered output.
      stubs: { ...extraStubs },
    },
  })
}

/** URLs passed to a given verb, in call order. */
function urls(verb) {
  return http[verb].mock.calls.map(([url]) => url)
}

/** Toast titles in call order. */
function toastTitles() {
  return toastCreate.mock.calls.map(([{ title }]) => title)
}

/** Wait for the async created() hook to settle. */
async function ready(wrapper) {
  await vi.waitFor(() => expect(wrapper.vm.isLoading).toBe(false))
  return wrapper
}

/**
 * Pick a supplier the way the UI does.
 *
 * The create tests must go through selectSupplier() rather than assigning
 * supplierReservation.supplier directly. created() replaces the object built in
 * data(), and vuelidate does not pick up a later deep mutation of the
 * replacement - v$.supplierReservation.supplier.$model stays null, so
 * submitForm's own validity check bails out and nothing is sent. Going through
 * the method reproduces what a user does and leaves validation in the state the
 * component actually sees in the browser.
 */
async function pickSupplier(wrapper, supplier = { id: 3, name: 'ACME', city: 'Amsterdam' }) {
  wrapper.vm.selectSupplier(supplier)
  await wrapper.vm.$nextTick()
}

beforeEach(() => {
  installFakeClients()
  toastCreate.mockClear()
})

afterEach(() => {
  restoreClients()
})

describe('SupplierReservationForm - create', () => {
  test('posts the reservation, then one post per material', async () => {
    const wrapper = await ready(mountForm())

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
    const wrapper = await ready(mountForm())

    wrapper.vm.supplierReservation.supplier = null
    wrapper.vm.supplierReservation.materials = [{ material: 10, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(http.post).not.toHaveBeenCalled()
    expect(http.patch).not.toHaveBeenCalled()
  })

  test('navigates back and re-enables the button on success', async () => {
    const wrapper = await ready(mountForm())

    await pickSupplier(wrapper)
    wrapper.vm.supplierReservation.materials = []

    await wrapper.vm.submitForm()

    expect(routerGo).toHaveBeenCalledWith(-1)
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  test('does not navigate and re-enables the button when the reservation fails', async () => {
    const wrapper = await ready(mountForm())

    await pickSupplier(wrapper)
    http.post.mockRejectedValueOnce(new Error('boom'))

    wrapper.vm.supplierReservation.materials = [{ material: 10, amount: 1 }]

    await wrapper.vm.submitForm()

    expect(routerGo).not.toHaveBeenCalled()
    expect(wrapper.vm.buttonDisabled).toBe(false)
    expect(wrapper.vm.isLoading).toBe(false)
    // The reservation post failed, so no material may be sent.
    expect(urls('post')).toEqual(['/inventory/supplier-reservation/'])
  })

  test('shows a single toast for the reservation and none per material', async () => {
    const wrapper = await ready(mountForm())

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

    return mountForm({ pk: 42 })
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

    expect(routerGo).not.toHaveBeenCalled()
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
    expect(routerGo).not.toHaveBeenCalled()
  })
})

describe('SupplierReservationForm - material list editing', () => {
  test('deleteMaterial moves the material to deletedMaterials', async () => {
    const wrapper = await ready(mountForm())

    wrapper.vm.supplierReservation.materials = [{ id: 1, material: 10 }, { id: 2, material: 11 }]

    wrapper.vm.deleteMaterial(0)

    expect(wrapper.vm.supplierReservation.materials.map((m) => m.id)).toEqual([2])
    expect(wrapper.vm.deletedMaterials.map((m) => m.id)).toEqual([1])
  })

  test('doEditMaterial replaces the material at the edited index', async () => {
    const wrapper = await ready(mountForm())

    wrapper.vm.supplierReservation.materials = [{ id: 1, amount: 1 }, { id: 2, amount: 2 }]
    wrapper.vm.editMaterial({ id: 1, amount: 99 }, 0)
    wrapper.vm.doEditMaterial()

    expect(wrapper.vm.supplierReservation.materials[0].amount).toBe(99)
    expect(wrapper.vm.isEditMaterial).toBe(false)
    expect(wrapper.vm.editIndex).toBeNull()
  })

  test('selectSupplier stores the supplier and refreshes the material list', async () => {
    const wrapper = await ready(mountForm())
    http.get.mockClear()

    wrapper.vm.selectSupplier({ id: 3, name: 'ACME', city: 'Amsterdam' })
    await vi.waitFor(() => expect(http.get).toHaveBeenCalled())

    expect(wrapper.vm.supplierReservation.supplier).toBe(3)
    expect(wrapper.vm.selectedSupplier).toMatchObject({ id: 3, name: 'ACME' })
    // The material list is scoped to the chosen supplier.
    expect(urls('get').some((url) => url.includes('supplier_relation=3'))).toBe(true)
  })
})
