import { beforeEach, describe, expect, test, vi } from 'vitest'
import { vBranch, vBranchAutocomplete, vBuilding, vCustomer, vCustomerAutocomplete } from '@/api/valibot.gen'
import BuildingForm from '@/features/equipment/building/BuildingForm.vue'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: spy } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({create: spy}) }
})

const api = installApiSeam()

const BRANCH_AUTOCOMPLETE = [
  fixtureFor(vBranchAutocomplete, {id: 9, name: 'Vestiging Noord', city: 'Groningen'}),
  fixtureFor(vBranchAutocomplete, {id: 10, name: 'Vestiging Zuid', city: 'Maastricht'}),
]
const CUSTOMER_AUTOCOMPLETE = [
  fixtureFor(vCustomerAutocomplete, {id: 7, name: 'Acme BV', city: 'Utrecht'}),
]

const BUILDING = fixtureFor(vBuilding, {
  id: 31,
  name: 'Hoofdgebouw',
  customer: 7,
  branch: null,
})

const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  template: '<div />',
}

const bodies = () => toasts().map((toast) => toast.body)
const writes = () => api.requests().filter((request) => ['post', 'patch'].includes(request.method))

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 550))
  await settle()
}

beforeEach(() => {
  api.get('/api/equipment/building/{id}/', BUILDING)
  api.post('/api/equipment/building/', ({body}) => fixtureFor(vBuilding, {id: 32, ...body}))
  api.patch('/api/equipment/building/{id}/', ({body}) => fixtureFor(vBuilding, {id: 31, ...body}))
  api.get('/api/company/branch/autocomplete/', BRANCH_AUTOCOMPLETE)
  api.get('/api/customer/customer/autocomplete/', CUSTOMER_AUTOCOMPLETE)
  api.get('/api/company/branch/{id}/', fixtureFor(vBranch, {id: 9, name: 'Vestiging Noord', city: 'Groningen'}))
  api.get('/api/customer/customer/{id}/', fixtureFor(vCustomer, {id: 7, name: 'Acme BV', city: 'Utrecht'}))
  api.get('/api/company/branch-my/', fixtureFor(vBranch, {id: 9, name: 'Vestiging Noord', city: 'Groningen'}))
  api.get('/api/customer/customer-my/', fixtureFor(vCustomer, {id: 7, name: 'Acme BV', city: 'Utrecht'}))
})

function mountBuilding(options = {}) {
  return mountForm(BuildingForm, {
    deep: true,
    props: {pk: null},
    main: {getMemberHasBranches: true, getCurrentLanguage: 'nl'},
    auth: {isEmployee: false, isCustomer: false},
    stubs: {VueMultiselect: multiselectStub},
    ...options,
  })
}

function picker(wrapper) {
  return wrapper.findAllComponents(multiselectStub)[0]
}

async function submit(wrapper) {
  await wrapper.findAll('button').find((button) => button.text() === 'Submit').trigger('click')
  await settle()
  await wrapper.vm.$nextTick()
  await settle()
}

describe('BuildingForm create', () => {
  test('a branch tenant creates through the branch variant', async () => {
    const wrapper = mountBuilding()
    await settle()

    await picker(wrapper).vm.$emit('search-change', 'noord')
    await pastDebounce()
    expect(api.requests().some((request) => request.path === '/api/company/branch/autocomplete/')).toBe(true)

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await wrapper.get('#building-name').setValue('Hoofdgebouw')
    await submit(wrapper)

    const post = writes().find((request) => request.method === 'post')
    expect(post.path).toBe('/api/equipment/building/')
    // The declared create body is a oneOf of the two owner variants, and this
    // tenant's is the branch one: the customer slot never reaches the wire.
    expect(post.body).toEqual({branch: 9, name: 'Hoofdgebouw'})
    expect(bodies()).toContain('building has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a branchless tenant creates through the customer variant', async () => {
    const wrapper = mountBuilding({main: {getMemberHasBranches: false, getCurrentLanguage: 'nl'}})
    await settle()

    await picker(wrapper).vm.$emit('select', CUSTOMER_AUTOCOMPLETE[0])
    await wrapper.get('#building-name').setValue('Bijgebouw')
    await submit(wrapper)

    expect(writes().find((request) => request.method === 'post').body)
      .toEqual({customer: 7, name: 'Bijgebouw'})
  })

  test('a branch employee gets no picker and the branch the API resolves itself', async () => {
    const wrapper = mountBuilding({auth: {isEmployee: true, isCustomer: false}})
    await settle()

    // Pinned to their own branch, so there is nothing to choose.
    expect(wrapper.findAllComponents(multiselectStub)).toHaveLength(0)
    expect(api.requests().some((request) => request.path === '/api/company/branch-my/')).toBe(true)

    await wrapper.get('#building-name').setValue('Werkplaats')
    await submit(wrapper)

    // The request still names the variant's key: the API overwrites it with the
    // same value, and the declared body requires it.
    expect(writes().find((request) => request.method === 'post').body)
      .toEqual({branch: 9, name: 'Werkplaats'})
  })

  test('an empty name is refused before anything is sent', async () => {
    const wrapper = mountBuilding()
    await settle()

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await submit(wrapper)

    expect(wrapper.text()).toContain('Please enter a name')
    expect(writes()).toHaveLength(0)
  })

  test('a missing owner is refused with the copy for that key', async () => {
    const wrapper = mountBuilding()
    await settle()

    await wrapper.get('#building-name').setValue('Zonder eigenaar')
    await submit(wrapper)

    expect(wrapper.text()).toContain('Please select a branch')
    expect(writes()).toHaveLength(0)
  })

  test('a failed create reports it and keeps what was typed', async () => {
    api.post('/api/equipment/building/', serverError)
    const wrapper = mountBuilding()
    await settle()

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await wrapper.get('#building-name').setValue('Hoofdgebouw')
    await submit(wrapper)

    expect(bodies()).toContain('Error creating building')
    expect(wrapper.get('#building-name').element.value).toBe('Hoofdgebouw')
  })

  test('the name field takes focus after an owner is picked', async () => {
    const wrapper = mountBuilding()
    await settle()

    const name = wrapper.get('#building-name').element
    const focused = vi.spyOn(name, 'focus')
    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await wrapper.vm.$nextTick()

    expect(focused).toHaveBeenCalled()
  })
})

describe('BuildingForm edit', () => {
  test('reads the record, its owner, and patches the same route', async () => {
    const wrapper = mountBuilding({props: {pk: '31'}})
    await settle()

    expect(api.requests().some((request) => request.path === '/api/equipment/building/31/')).toBe(true)
    expect(wrapper.get('#building-name').element.value).toBe('Hoofdgebouw')
    expect(wrapper.get('h2').text()).toContain('Edit building')

    await wrapper.get('#building-name').setValue('Hoofdgebouw 2')
    await submit(wrapper)

    // The patch carries the owner keys back as they came in. `PatchedBuildingRequest`
    // declares both, and the form round-trips the record rather than diffing it,
    // which is what the legacy screen did.
    expect(writes().find((request) => request.method === 'patch').body)
      .toEqual({name: 'Hoofdgebouw 2', customer: 7, branch: null})
    expect(bodies()).toContain('building has been updated')
  })

  test('an edit offers no Bulk button', async () => {
    const wrapper = mountBuilding({props: {pk: '31'}})
    await settle()

    expect(wrapper.findAll('button').some((button) => button.text() === 'Bulk')).toBe(false)
  })
})

describe('BuildingForm bulk create', () => {
  test('stays on the form, clears the name and keeps the owner', async () => {
    const wrapper = mountBuilding()
    await settle()

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await wrapper.get('#building-name').setValue('Eerste')
    await wrapper.findAll('button').find((button) => button.text() === 'Bulk').trigger('click')
    await settle()
    await wrapper.vm.$nextTick()
    await settle()

    expect(bodies()).toContain('building has been created')
    // The default exit is a history back; a bulk save does not take it.
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.get('#building-name').element.value).toBe('')

    await wrapper.get('#building-name').setValue('Tweede')
    await submit(wrapper)

    const posts = writes().filter((request) => request.method === 'post')
    expect(posts).toHaveLength(2)
    expect(posts[1].body).toEqual({branch: 9, name: 'Tweede'})
  })
})

describe('BuildingForm cancel', () => {
  test('goes back without writing', async () => {
    const wrapper = mountBuilding()
    await settle()

    await wrapper.findAll('button').find((button) => button.text() === 'Cancel').trigger('click')

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(writes()).toHaveLength(0)
  })
})
