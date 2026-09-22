import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  vBranch,
  vBranchAutocomplete,
  vCustomer,
  vCustomerAutocomplete,
  vEquipment,
  vLocation,
} from '@/api/valibot.gen'
import BranchCard from '@/components/BranchCard.vue'
import { EquipmentForm } from '@/features/equipment'
import { toDinero } from '@/services/money'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({create: spy}) }
})

const api = installApiSeam()

const BRANCH_RECORD = fixtureFor(vBranch, {id: 9, name: 'Vestiging Noord', city: 'Groningen'})
const CUSTOMER_RECORD = fixtureFor(vCustomer, {id: 7, name: 'Acme BV', city: 'Utrecht'})

const BRANCH_AUTOCOMPLETE = [
  fixtureFor(vBranchAutocomplete, {id: 9, name: 'Vestiging Noord', city: 'Groningen'}),
  fixtureFor(vBranchAutocomplete, {id: 10, name: 'Vestiging Zuid', city: 'Maastricht'}),
]
const CUSTOMER_AUTOCOMPLETE = [
  fixtureFor(vCustomerAutocomplete, {id: 7, name: 'Acme BV', city: 'Utrecht'}),
]

const LOCATIONS = [
  fixtureFor(vLocation, {id: 5, name: 'Kelder'}),
  fixtureFor(vLocation, {id: 6, name: 'Dak'}),
]

const equipmentRecord = (overrides = {}) => fixtureFor(vEquipment, {
  id: 31,
  name: 'CV-ketel',
  type: 'technical',
  branch: 9,
  customer: null,
  location: null,
  brand: null,
  identifier: null,
  description: null,
  serialnumber: null,
  standard_hours: null,
  installation_date: null,
  production_date: null,
  price: '0.00',
  price_currency: 'EUR',
  ...overrides,
})

/** Spied through the stub, which is the only thing standing between a create and its documents. */
const parentCreated = vi.fn()

const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  template: '<div />',
}

// Keyed on the name VTU can actually match. `@vuepic/vue-datepicker` exports an
// inner component that is also called `VueDatePicker`; a stub under that name
// replaces the inner one and never sees the model, which the root holds and
// re-emits. A change in the library fails these specs loudly rather than
// quietly testing an unwired picker.
const datePickerStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="datepicker-stub" />',
}

const documentsStub = {
  props: ['kind', 'equipment', 'isView'],
  template: '<div class="documents-stub" />',
  setup(_props, {expose}) {
    expose({parentCreated})
  },
}

const bodies = () => toasts().map((toast) => toast.body)
const writes = () => api.requests().filter((request) => ['post', 'patch'].includes(request.method))
const requestsTo = (path) => api.requests().filter((request) => request.path === path)
const writeOf = (method) => writes().find((request) => request.method === method)

const BRANCHLESS_MAIN = {getMemberHasBranches: false, getCurrentLanguage: 'nl', getDefaultCurrency: 'EUR'}

beforeEach(() => {
  parentCreated.mockReset().mockResolvedValue([])

  api.get('/api/equipment/equipment/{id}/', equipmentRecord())
  api.post('/api/equipment/equipment/', ({body}) => equipmentRecord({id: 32, ...body}))
  api.patch('/api/equipment/equipment/{id}/', ({body}) => equipmentRecord(body))
  api.get('/api/equipment/location/list_for_select/', LOCATIONS)
  api.get('/api/company/branch/autocomplete/', BRANCH_AUTOCOMPLETE)
  api.get('/api/customer/customer/autocomplete/', CUSTOMER_AUTOCOMPLETE)
  api.get('/api/company/branch/{id}/', BRANCH_RECORD)
  api.get('/api/customer/customer/{id}/', CUSTOMER_RECORD)
  api.get('/api/company/branch-my/', BRANCH_RECORD)
  api.get('/api/customer/customer-my/', CUSTOMER_RECORD)
})

function mountEquipment(options = {}) {
  return mountForm(EquipmentForm, {
    deep: true,
    props: {pk: null},
    main: {getMemberHasBranches: true, getCurrentLanguage: 'nl', getDefaultCurrency: 'EUR'},
    auth: {isEmployee: false, isCustomer: false},
    stubs: {
      VueMultiselect: multiselectStub,
      VueDatePickerRoot: datePickerStub,
      DocumentsComponent: documentsStub,
    },
    ...options,
  })
}

function picker(wrapper) {
  return wrapper.findAllComponents(multiselectStub)[0]
}

function dates(wrapper) {
  return wrapper.findAllComponents(datePickerStub)
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 550))
  await settle()
}

async function click(wrapper, text) {
  await wrapper.findAll('button').find((button) => button.text() === text).trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
  await settle()
}

/** A branch tenant with an owner picked and a name typed: the shortest valid create. */
async function fillMinimum(wrapper, name = 'CV-ketel') {
  await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
  await settle()
  await wrapper.get('#equipment_name').setValue(name)
}

describe('EquipmentForm create', () => {
  test('a branch tenant creates the branch variant, with no phantom key in the body', async () => {
    const wrapper = mountEquipment()
    await settle()

    await picker(wrapper).vm.$emit('search-change', 'noord')
    await pastDebounce()
    expect(requestsTo('/api/company/branch/autocomplete/')).toHaveLength(1)

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await settle()
    // The location list follows the branch that was picked. The URL carries
    // the id as text, which is the shape the endpoint declares.
    expect(requestsTo('/api/equipment/location/list_for_select/').at(-1).query).toEqual({branch: '9'})

    await wrapper.get('#equipment_name').setValue('CV-ketel')
    await wrapper.get('#equipment_type').setValue('facility')
    await wrapper.get('#equipment_brand').setValue('Remaha')
    await wrapper.get('#equipment_identifier').setValue('ID-1')
    await wrapper.get('#equipment_serialnumber').setValue('SN-9')
    await wrapper.get('#equipment_remarks').setValue('Jaarlijks onderhoud')
    await wrapper.get('#equipment_default_replace_months').setValue('60')
    await wrapper.get('#equipment_standard_hours_hour').setValue('2')
    await wrapper.get('#equipment_location').setValue('5')

    await dates(wrapper)[0].vm.$emit('update:modelValue', new Date(2024, 4, 6))
    await dates(wrapper)[1].vm.$emit('update:modelValue', new Date(2023, 0, 2))

    // PriceInput reports a formatted amount; the money helper is what formats it.
    await wrapper.get('#equipment_price .input-number').setValue('12')
    await wrapper.get('#equipment_price .input-decimal').setValue('34')
    await wrapper.vm.$nextTick()

    await click(wrapper, 'Submit')

    const post = writeOf('post')
    expect(post.path).toBe('/api/equipment/equipment/')
    // Exact, so a key the request does not declare cannot ride along: the
    // legacy model carried a `price_dinero` the API has no field for, and the
    // template wrote `standard_hours_hour`, a key DRF silently dropped.
    expect(post.body).toEqual({
      branch: 9,
      name: 'CV-ketel',
      type: 'facility',
      brand: 'Remaha',
      identifier: 'ID-1',
      description: 'Jaarlijks onderhoud',
      installation_date: '2024-05-06',
      production_date: '2023-01-02',
      serialnumber: 'SN-9',
      standard_hours: '2',
      location: 5,
      price: '12.34',
      default_replace_months: 60,
    })
    expect(post.body).not.toHaveProperty('price_dinero')
    expect(post.body).not.toHaveProperty('standard_hours_hour')
    expect(post.body).not.toHaveProperty('customer')

    expect(post.body.price).toBe(toDinero('12.34', 'EUR').toFormat('0.00'))
    expect(wrapper.get('#equipment_price').text()).toContain('€')
    expect(bodies()).toContain('Equipment has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('the document panel is handed the new record id', async () => {
    const wrapper = mountEquipment()
    await settle()

    // The panel is told which resource it is by `kind`, so a create form has
    // nothing to stand in for: before the record exists there is simply none.
    expect(wrapper.findComponent(documentsStub).props('kind')).toBe('equipment')
    expect(wrapper.findComponent(documentsStub).props('equipment')).toBeUndefined()

    await fillMinimum(wrapper, 'Ketel met documenten')
    await click(wrapper, 'Submit')

    expect(parentCreated).toHaveBeenCalledWith(32)
  })

  test('a branchless tenant creates the customer variant', async () => {
    const wrapper = mountEquipment({main: BRANCHLESS_MAIN})
    await settle()

    expect(picker(wrapper).attributes('id')).toBe('equipment_customer_search')
    await picker(wrapper).vm.$emit('select', CUSTOMER_AUTOCOMPLETE[0])
    await settle()
    expect(requestsTo('/api/equipment/location/list_for_select/').at(-1).query).toEqual({customer: '7'})

    await wrapper.get('#equipment_name').setValue('Bijgebouw')
    await click(wrapper, 'Submit')

    const post = writeOf('post')
    expect(post.body).toEqual({
      customer: 7,
      name: 'Bijgebouw',
      type: 'technical',
      brand: null,
      identifier: null,
      description: null,
      installation_date: null,
      production_date: null,
      serialnumber: null,
      standard_hours: null,
      location: null,
      price: '0.00',
    })
    expect(post.body).not.toHaveProperty('branch')
    expect(post.body).not.toHaveProperty('price_currency')
  })

  test('the type is a select for a branch tenant and a hidden input otherwise', async () => {
    const branch = mountEquipment()
    await settle()
    expect(branch.find('select#equipment_type').exists()).toBe(true)
    expect(branch.find('select#equipment_type').text()).toContain('Facility')

    const branchless = mountEquipment({main: BRANCHLESS_MAIN})
    await settle()
    expect(branchless.find('select#equipment_type').exists()).toBe(false)
    expect(branchless.get('input#equipment_type').attributes('type')).toBe('hidden')
  })

  test('a picked date reaches the body as an ISO date', async () => {
    const wrapper = mountEquipment()
    await settle()

    await fillMinimum(wrapper)
    await dates(wrapper)[0].vm.$emit('update:modelValue', new Date(2021, 11, 31))
    await wrapper.vm.$nextTick()
    await click(wrapper, 'Submit')

    expect(writeOf('post').body).toMatchObject({installation_date: '2021-12-31', production_date: null})
  })

  test('an empty name is refused before anything is sent', async () => {
    const wrapper = mountEquipment()
    await settle()

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await settle()
    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please enter a name')
    expect(writes()).toHaveLength(0)
  })

  test('a missing owner is refused with the copy for that key', async () => {
    const wrapper = mountEquipment()
    await settle()

    await wrapper.get('#equipment_name').setValue('Zonder eigenaar')
    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please select a branch')
    expect(writes()).toHaveLength(0)
  })

  test('a chooser asks for no locations until an owner is picked', async () => {
    const wrapper = mountEquipment()
    await settle()

    expect(requestsTo('/api/equipment/location/list_for_select/')).toHaveLength(0)
  })

  test('the owner block appears twice with an id of its own each time', async () => {
    const wrapper = mountEquipment()
    await settle()
    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await settle()

    // Panel 1 and panel 2 both show the branch; the legacy screen gave both
    // copies the same ids, so `label-for` pointed at whichever came first.
    expect(wrapper.findComponent(BranchCard).exists()).toBe(false)
    expect(wrapper.findAll('#equipment_branch_name')).toHaveLength(1)
    expect(wrapper.findAll('#equipment_detail_branch_name')).toHaveLength(1)
    expect(wrapper.get('#equipment_detail_branch_name').element.value).toBe('Vestiging Noord')
  })

  test('the name field takes focus after an owner is picked', async () => {
    // The pick crosses two seams - OwnerPanel to useFormOwner to the form's
    // name input - and nothing else fails if the focus is dropped on the way.
    const wrapper = mountEquipment()
    await settle()

    const focused = vi.spyOn(wrapper.get('#equipment_name').element, 'focus')
    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await wrapper.vm.$nextTick()

    expect(focused).toHaveBeenCalled()
  })

  test('a failed create reports it and keeps what was typed', async () => {
    api.post('/api/equipment/equipment/', serverError)
    const wrapper = mountEquipment()
    await settle()

    await fillMinimum(wrapper)
    await click(wrapper, 'Submit')

    expect(bodies()).toContain('Error creating equipment')
    expect(wrapper.get('#equipment_name').element.value).toBe('CV-ketel')
  })
})

describe('EquipmentForm owners the API pins', () => {
  test('a branch employee gets no picker, their own branch and the unscoped location list', async () => {
    const wrapper = mountEquipment({auth: {isEmployee: true, isCustomer: false}})
    await settle()

    expect(wrapper.findAllComponents(multiselectStub)).toHaveLength(0)
    // Their own branch is shown as a card rather than the editable block.
    expect(wrapper.findComponent(BranchCard).exists()).toBe(true)
    expect(wrapper.find('#equipment_branch_name').exists()).toBe(false)
    expect(requestsTo('/api/company/branch-my/')).toHaveLength(1)
    // No query at all for a pinned role: the endpoint is already scoped to them.
    expect(requestsTo('/api/equipment/location/list_for_select/').at(-1).query).toEqual({})

    await wrapper.get('#equipment_name').setValue('Werkplaats')
    await click(wrapper, 'Submit')

    expect(writeOf('post').body).toMatchObject({branch: 9, name: 'Werkplaats'})
  })

  test('a customer user gets no picker, their own customer and the unscoped location list', async () => {
    const wrapper = mountEquipment({
      main: BRANCHLESS_MAIN,
      auth: {isEmployee: false, isCustomer: true},
    })
    await settle()

    expect(wrapper.findAllComponents(multiselectStub)).toHaveLength(0)
    expect(requestsTo('/api/customer/customer-my/')).toHaveLength(1)
    expect(requestsTo('/api/equipment/location/list_for_select/').at(-1).query).toEqual({})

    await wrapper.get('#equipment_name').setValue('Mijn ketel')
    await click(wrapper, 'Submit')

    expect(writeOf('post').body).toMatchObject({customer: 7, name: 'Mijn ketel'})
  })
})

describe('EquipmentForm edit', () => {
  test('reads the record, its branch and patches the same route', async () => {
    const wrapper = mountEquipment({props: {pk: '31'}})
    await settle()

    expect(requestsTo('/api/equipment/equipment/31/')).toHaveLength(1)
    expect(wrapper.get('h3').text()).toContain('CV-ketel')
    expect(wrapper.get('#equipment_name').element.value).toBe('CV-ketel')
    expect(requestsTo('/api/equipment/location/list_for_select/').at(-1).query).toEqual({branch: '9'})
    expect(wrapper.findComponent(documentsStub).props('equipment')).toMatchObject({id: 31})

    await wrapper.get('#equipment_name').setValue('CV-ketel 2')
    await click(wrapper, 'Submit')

    const patch = writeOf('patch')
    expect(patch.path).toBe('/api/equipment/equipment/31/')
    // The patch round-trips the record rather than diffing it, and the
    // read-only `price_currency` the form holds for PriceInput stays off the wire.
    expect(patch.body).toEqual({
      name: 'CV-ketel 2',
      type: 'technical',
      branch: 9,
      customer: null,
      location: null,
      brand: null,
      identifier: null,
      description: null,
      serialnumber: null,
      standard_hours: null,
      installation_date: null,
      production_date: null,
      price: '0.00',
    })
    expect(bodies()).toContain('Equipment has been updated')
  })

  test('a stored date comes back to the picker as a Date', async () => {
    api.get('/api/equipment/equipment/{id}/', equipmentRecord({installation_date: '2020-03-04'}))
    const wrapper = mountEquipment({props: {pk: '31'}})
    await settle()

    expect(dates(wrapper)[0].props('modelValue')).toEqual(new Date(2020, 2, 4))
  })

  test('an edit offers no Bulk button', async () => {
    const wrapper = mountEquipment({props: {pk: '31'}})
    await settle()

    expect(wrapper.findAll('button').some((button) => button.text() === 'Bulk')).toBe(false)
  })
})

describe('EquipmentForm bulk create', () => {
  test('stays on the form, clears it and keeps the owner', async () => {
    const wrapper = mountEquipment()
    await settle()

    await fillMinimum(wrapper, 'Eerste')
    await click(wrapper, 'Bulk')

    expect(bodies()).toContain('Equipment has been created')
    // The default exit is a history back; a bulk save does not take it.
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.get('#equipment_name').element.value).toBe('')

    await wrapper.get('#equipment_name').setValue('Tweede')
    await click(wrapper, 'Submit')

    const posts = writes().filter((request) => request.method === 'post')
    expect(posts).toHaveLength(2)
    expect(posts[1].body).toMatchObject({branch: 9, name: 'Tweede'})
  })
})

describe('EquipmentForm cancel', () => {
  test('goes back without writing', async () => {
    const wrapper = mountEquipment()
    await settle()

    await click(wrapper, 'Cancel')

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(writes()).toHaveLength(0)
  })
})
