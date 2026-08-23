import { beforeEach, describe, expect, test, vi } from 'vitest'

import OrderFormMaintenanceEmployee from '@/views/orders/OrderFormMaintenanceEmployee.vue'

import {
  mountForm,
  resetFakeHttp,
  routerGo,
  toastCreate,
} from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

// This spec drives the form the way a user does: it types into the rendered
// inputs and clicks the rendered buttons, and asserts on what the form renders
// back plus the requests it issues. Nothing reads or calls the component
// instance - see https://vuejs.org/guide/scaling-up/testing.html#component-testing
// ("don't assert the private state of a component instance").
//
// That means a full `mount`, not the harness default `shallowMount`: with the
// bootstrap-vue-next inputs stubbed there is no DOM to drive. Only the widgets
// that have no usable DOM under happy-dom are stubbed, and each stub keeps the
// real component's public contract (props in, events out).

// This form constructs its own services (`new OrderService()` in setup), so the
// seam is the axios module every BaseModel instance takes its client from - not
// the model singletons installFakeClients() patches. See form-harness.js.
const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const BRANCH = {
  id: 7,
  name: 'Branch Amsterdam',
  address: 'Kerkstraat 1',
  postal: '1000 AA',
  city: 'Amsterdam',
  country_code: 'NL',
  tel: '0201234567',
  mobile: '0612345678',
  email: 'branch@example.test',
  contact: 'Jan',
}

const DETAIL = {
  id: 42,
  order_type: 'maintenance',
  order_name: 'Branch Amsterdam',
  order_reference: 'REF-1',
  start_date: '20/08/2026',
  end_date: '21/08/2026',
  orderlines: [{ id: 5, product: 'Widget', location: 'Roof', remarks: '' }],
}

const EQUIPMENT = [{ id: 1, name: 'Widget', location: { id: 2, name: 'Roof' } }]
const LOCATIONS = [{ id: 9, name: 'Basement' }]

const ROUTES = {
  '/company/branch-my/': BRANCH,
  '/order/order/42/': DETAIL,
  '/equipment/equipment/autocomplete/': EQUIPMENT,
  '/equipment/location/autocomplete/': LOCATIONS,
}

/**
 * DocumentsComponent is a child with an imperative API: the form calls
 * `orderCreated(newOrder)` on it through a template ref once the POST lands. A
 * stub has no methods, so it needs a real one - otherwise the create path
 * throws where the app would not.
 */
const orderCreated = vi.fn()
const documentsStub = {
  template: '<div />',
  methods: { orderCreated },
}

/**
 * Stand-in for @vuepic/vue-datepicker, which renders no input element worth
 * typing into under happy-dom.
 *
 * It keeps the contract the form relies on: a `Date` in through modelValue, a
 * `Date` back out on input. The rendered value is the ISO date, so a test can
 * both read what the form put in the picker and type a new date into it. A
 * value the form failed to parse into a Date shows up verbatim (`20/08/2026`)
 * rather than as `2026-08-20`.
 */
const datePickerStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  methods: {
    onInput(event) {
      const value = event.target.value
      this.$emit('update:modelValue', value ? new Date(`${value}T00:00:00`) : null)
    },
  },
  computed: {
    text() {
      const value = this.modelValue
      if (!(value instanceof Date)) {
        return value ?? ''
      }
      const pad = (n) => String(n).padStart(2, '0')
      return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    },
  },
  template: '<input class="datepicker" :value="text" @input="onInput" />',
}

/**
 * Stand-in for vue-multiselect, which has no DOM worth clicking under
 * happy-dom.
 *
 * It keeps both halves of the contract the form uses: typing emits
 * `search-change` (which is what fills the `options` prop, through the form's
 * debounced remote search), and clicking an option emits `select` with it. So a
 * test searches and picks, exactly as a user does.
 */
const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  template: `
    <div>
      <input class="ms-search" @input="$emit('search-change', $event.target.value)" />
      <button
        v-for="option of options ?? []"
        :key="option.id"
        class="ms-option"
        type="button"
        @click="$emit('select', option)"
      >{{ option.name }}</button>
    </div>
  `,
}

const MAIN = {
  getMemberHasBranches: true,
  getCountries: [],
  getOrderTypes: ['maintenance', 'temps'],
  getSettingEquipmentQuickCreate: true,
  getSettingEquipmentLocationQuickCreate: true,
}

function mount(props = {}, main = {}) {
  return mountForm(OrderFormMaintenanceEmployee, {
    props,
    deep: true,
    main: { ...MAIN, ...main },
    stubs: {
      DocumentsComponent: documentsStub,
      VueDatePicker: datePickerStub,
      VueMultiselect: multiselectStub,
    },
  })
}

/** Mount and wait until created()'s async load has rendered the form. */
async function ready(props = {}, main = {}) {
  const wrapper = mount(props, main)
  await vi.waitFor(() => expect(wrapper.find('#order_name').exists()).toBe(true))
  return wrapper
}

/** Click a header button by its label. */
async function click(wrapper, label) {
  const button = wrapper
    .findAll('header button')
    .find((candidate) => candidate.text() === label)

  expect(button, `no "${label}" button rendered`).toBeTruthy()
  await button.trigger('click')
}

async function submit(wrapper) {
  await click(wrapper, 'Submit')
  await flush()
}

/**
 * Type a query into a multiselect and let its debounced remote search land.
 *
 * The form debounces the search by 500ms, so the timers have to be driven
 * forward; everything after that is real - the request goes through the fake
 * axios client and the response becomes the option list.
 */
async function search(multiselect, query) {
  // Only setTimeout, deliberately: faking `Date` too makes Vue drop the click
  // handlers on anything rendered while the clock was advanced (it compares an
  // event's timestamp against when the handler was attached), so the option
  // buttons would render but not respond.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    await multiselect.find('.ms-search').setValue(query)
    await vi.advanceTimersByTimeAsync(600)
  } finally {
    vi.useRealTimers()
  }
  await flush()
  await multiselect.vm.$nextTick()
}

/** Let every pending promise chain in the submit path resolve. */
async function flush() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve()
  }
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
  toastCreate.mockClear()
  orderCreated.mockClear()
})

describe('OrderFormMaintenanceEmployee - cancel', () => {
  test('goes back without touching the API', async () => {
    const wrapper = await ready()

    await click(wrapper, 'Cancel')

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(fakeHttp.post).not.toHaveBeenCalled()
    expect(fakeHttp.patch).not.toHaveBeenCalled()
  })
})

describe('OrderFormMaintenanceEmployee - call shapes', () => {
  // Old `BranchService.getMyBranch()` was a hand-written GET; `load()` now
  // calls the generated `companyBranchMyRetrieve` (GET /api/company/branch-my/).

  // Old `EquipmentService.searchBranchEmployee(query)` built `?q=..` by hand;
  // the generated `equipmentEquipmentAutocompleteList` carries it as a
  // query object.
  test('searching equipment autocompletes against the equipment endpoint', async () => {
    const wrapper = await ready()
    const equipment = wrapper.findAllComponents(multiselectStub)[0]

    await search(equipment, 'wid')

    expect(requestShapes(fakeHttp, { method: 'get' }).at(-1)).toEqual({
      method: 'get',
      path: '/api/equipment/equipment/autocomplete/',
      query: { q: 'wid' },
      body: undefined,
    })
  })

  test('searching locations autocompletes against the location endpoint', async () => {
    const wrapper = await ready()
    const location = wrapper.findAllComponents(multiselectStub)[1]

    await search(location, 'bas')

    expect(requestShapes(fakeHttp, { method: 'get' }).at(-1)).toEqual({
      method: 'get',
      path: '/api/equipment/location/autocomplete/',
      query: { q: 'bas' },
      body: undefined,
    })
  })
})
