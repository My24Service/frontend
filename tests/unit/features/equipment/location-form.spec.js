import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  vBranch,
  vBranchAutocomplete,
  vBuilding,
  vCustomer,
  vCustomerAutocomplete,
  vLocation,
  vLocationDocument,
} from '@/api/valibot.gen'
import { LocationForm } from '@/features/equipment'
import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
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

const NOORD_BUILDINGS = [fixtureFor(vBuilding, {id: 41, name: 'Hoofdgebouw', branch: 9, customer: null})]
const ZUID_BUILDINGS = [fixtureFor(vBuilding, {id: 42, name: 'Werkplaats', branch: 10, customer: null})]
const ACME_BUILDINGS = [fixtureFor(vBuilding, {id: 43, name: 'Loods', branch: null, customer: 7})]

/** A location of branch 9, standing in building 41. */
const LOCATION = fixtureFor(vLocation, {
  id: 31,
  name: 'Hoofdgebouw',
  branch: 9,
  customer: null,
  building: 41,
})

const BUILDINGS_PATH = '/api/equipment/building/list_for_select/'
const DOCUMENTS_PATH = '/api/equipment/location-document/'
const LOCATION_PATH = '/api/equipment/location/'

const multiselectStub = {
  props: ['options'],
  emits: ['select', 'search-change'],
  template: '<div />',
}

const bodies = () => toasts().map((toast) => toast.body)
const writes = (path) => api.requests()
  .filter((request) => ['post', 'patch'].includes(request.method))
  .filter((request) => path === undefined || request.path === path)
const requestsTo = (path) => api.requests().filter((request) => request.path === path)

/** Let every request a submit sets off - including the ones a response sets off - come back. */
async function drain(wrapper) {
  for (let i = 0; i < 4; i++) {
    await settle()
    await wrapper.vm.$nextTick()
  }
}

async function click(wrapper, label) {
  await wrapper.findAll('button').find((button) => button.text() === label).trigger('click')
  await drain(wrapper)
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 550))
  await settle()
}

function picker(wrapper) {
  return wrapper.findAllComponents(multiselectStub)[0]
}

/** Pick a file the way the browser's picker does. */
async function chooseFile(wrapper, name = 'offerte.pdf') {
  const input = wrapper.get('input[type="file"]')
  const file = new File(['%PDF-1.4 test'], name, {type: 'application/pdf'})
  Object.defineProperty(input.element, 'files', {value: [file], configurable: true})
  await input.trigger('change')
  await settle()
}

/** Choose a building in the select, whose option values are the ids as strings. */
async function chooseBuilding(wrapper, id) {
  await wrapper.get('#location_building').setValue(String(id))
  await settle()
}

beforeEach(() => {
  api.get('/api/equipment/location/{id}/', LOCATION)
  api.post(LOCATION_PATH, ({body}) => fixtureFor(vLocation, {id: 32, ...body}))
  api.patch('/api/equipment/location/{id}/', ({body}) => fixtureFor(vLocation, {id: 31, ...body}))
  api.get('/api/company/branch/autocomplete/', BRANCH_AUTOCOMPLETE)
  api.get('/api/customer/customer/autocomplete/', CUSTOMER_AUTOCOMPLETE)
  api.get('/api/company/branch/{id}/', ({params}) =>
    fixtureFor(vBranch, {id: Number(params.id), name: 'Vestiging Noord', city: 'Groningen'}))
  api.get('/api/customer/customer/{id}/', fixtureFor(vCustomer, {id: 7, name: 'Acme BV', city: 'Utrecht'}))
  api.get('/api/company/branch-my/', fixtureFor(vBranch, {id: 9, name: 'Vestiging Noord', city: 'Groningen'}))
  api.get('/api/customer/customer-my/', fixtureFor(vCustomer, {id: 7, name: 'Acme BV', city: 'Utrecht'}))
  api.get(BUILDINGS_PATH, ({query}) => {
    if (query.branch === '10') return ZUID_BUILDINGS
    if (query.customer === '7') return ACME_BUILDINGS
    return NOORD_BUILDINGS
  })
  api.get(DOCUMENTS_PATH, () => paginated([]))
  api.post(DOCUMENTS_PATH, ({body}) => fixtureFor(vLocationDocument, {id: 6, ...body}))
})

function mountLocation(options = {}) {
  return mountForm(LocationForm, {
    deep: true,
    props: {pk: null},
    main: {getMemberHasBranches: true, getCurrentLanguage: 'nl'},
    auth: {isEmployee: false, isCustomer: false},
    stubs: {VueMultiselect: multiselectStub},
    ...options,
  })
}

describe('LocationForm create', () => {
  test('a branch tenant creates through the branch variant', async () => {
    const wrapper = mountLocation()
    await settle()

    await picker(wrapper).vm.$emit('search-change', 'noord')
    await pastDebounce()
    expect(requestsTo('/api/company/branch/autocomplete/')).toHaveLength(1)

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await drain(wrapper)
    await wrapper.get('#location-name').setValue('Hoofdgebouw')
    await click(wrapper, 'Submit')

    const post = writes(LOCATION_PATH).find((request) => request.method === 'post')
    expect(post.path).toBe(LOCATION_PATH)
    // The declared create body is a oneOf of the two owner variants, and this
    // tenant's is the branch one: the customer slot never reaches the wire, and
    // neither does a building nobody picked.
    expect(post.body).toEqual({branch: 9, name: 'Hoofdgebouw'})
    expect(bodies()).toContain('Location has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a branchless tenant creates through the customer variant', async () => {
    const wrapper = mountLocation({main: {getMemberHasBranches: false, getCurrentLanguage: 'nl'}})
    await settle()

    await picker(wrapper).vm.$emit('select', CUSTOMER_AUTOCOMPLETE[0])
    await drain(wrapper)
    // This tenant's building list is the customer's: the one read carries the
    // customer key, and nothing is asked for a branch.
    expect(requestsTo(BUILDINGS_PATH)).toHaveLength(1)
    expect(requestsTo(BUILDINGS_PATH)[0].query).toEqual({customer: '7'})
    await wrapper.get('#location-name').setValue('Bijgebouw')
    await click(wrapper, 'Submit')

    expect(writes(LOCATION_PATH).find((request) => request.method === 'post').body)
      .toEqual({customer: 7, name: 'Bijgebouw'})
  })

  test('a branch employee gets no picker and sends the branch the API resolves', async () => {
    const wrapper = mountLocation({auth: {isEmployee: true, isCustomer: false}})
    await settle()

    // Pinned to their own branch, so there is nothing to choose.
    expect(wrapper.findAllComponents(multiselectStub)).toHaveLength(0)
    expect(requestsTo('/api/company/branch-my/')).toHaveLength(1)

    await wrapper.get('#location-name').setValue('Werkplaats')
    await click(wrapper, 'Submit')

    // The request still names the variant's key: the API overwrites it with the
    // same value, and the declared body requires it.
    expect(writes(LOCATION_PATH).find((request) => request.method === 'post').body)
      .toEqual({branch: 9, name: 'Werkplaats'})
  })

  test('a pinned role is offered the buildings of its own branch', async () => {
    // The legacy screen fetched no buildings for an employee, which left the
    // select on screen with nothing in it. `list_for_select` scopes a pinned
    // role to its own owner whatever the request carries, so the list is
    // available and the control is now what it looks like.
    const wrapper = mountLocation({auth: {isEmployee: true, isCustomer: false}})
    await settle()

    expect(requestsTo(BUILDINGS_PATH)[0].query).toEqual({branch: '9'})
    expect(wrapper.get('#location_building').text()).toContain('Hoofdgebouw')
  })

  test('the building list is read for the owner that was chosen', async () => {
    const wrapper = mountLocation()
    await settle()

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await drain(wrapper)

    expect(requestsTo(BUILDINGS_PATH)).toHaveLength(1)
    expect(requestsTo(BUILDINGS_PATH)[0].query).toEqual({branch: '9'})
    expect(wrapper.get('#location_building').text()).toContain('Hoofdgebouw')

    // A different owner is a different list.
    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[1])
    await drain(wrapper)

    expect(requestsTo(BUILDINGS_PATH)).toHaveLength(2)
    expect(requestsTo(BUILDINGS_PATH)[1].query).toEqual({branch: '10'})
    expect(wrapper.get('#location_building').text()).toContain('Werkplaats')
  })

  test('a picked building goes out with the create', async () => {
    const wrapper = mountLocation()
    await settle()

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await drain(wrapper)
    await chooseBuilding(wrapper, 41)
    await wrapper.get('#location-name').setValue('Hoofdgebouw')
    await click(wrapper, 'Submit')

    expect(writes(LOCATION_PATH).find((request) => request.method === 'post').body)
      .toEqual({branch: 9, name: 'Hoofdgebouw', building: 41})
  })

  test('a building of the previous owner is not sent after the owner changes', async () => {
    // The legacy screen replaced the select's options on a change of owner and
    // left the id it held: submitting then wrote a building that belongs to
    // another branch.
    const wrapper = mountLocation()
    await settle()

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await drain(wrapper)
    await chooseBuilding(wrapper, 41)
    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[1])
    await drain(wrapper)
    await wrapper.get('#location-name').setValue('Werkplaats')
    await click(wrapper, 'Submit')

    expect(writes(LOCATION_PATH).find((request) => request.method === 'post').body)
      .toEqual({branch: 10, name: 'Werkplaats'})
  })

  test('an empty name is refused before anything is sent', async () => {
    const wrapper = mountLocation()
    await settle()

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await drain(wrapper)
    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please enter a name')
    expect(writes()).toHaveLength(0)
  })

  test('a missing owner is refused with the copy for that key', async () => {
    const wrapper = mountLocation()
    await settle()

    await wrapper.get('#location-name').setValue('Zonder eigenaar')
    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please select a branch')
    expect(writes()).toHaveLength(0)
  })

  test('the name field takes focus after an owner is picked', async () => {
    // The pick crosses two seams - OwnerPanel to useFormOwner to the form's
    // name input - and nothing else fails if the focus is dropped on the way.
    const wrapper = mountLocation()
    await settle()

    const focused = vi.spyOn(wrapper.get('#location-name').element, 'focus')
    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await wrapper.vm.$nextTick()

    expect(focused).toHaveBeenCalled()
  })

  test('a failed create reports it and keeps what was typed', async () => {
    api.post(LOCATION_PATH, serverError)
    const wrapper = mountLocation()
    await settle()

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await drain(wrapper)
    await wrapper.get('#location-name').setValue('Hoofdgebouw')
    await click(wrapper, 'Submit')

    expect(bodies()).toContain('Error creating location')
    expect(wrapper.get('#location-name').element.value).toBe('Hoofdgebouw')
  })
})

describe('LocationForm create with a staged document', () => {
  test('the document is written against the new location', async () => {
    const wrapper = mountLocation()
    await settle()

    // Staged while the location does not exist yet - the panel mounts with no
    // parent at all, so this is the create that hands it one.
    await chooseFile(wrapper)
    expect(wrapper.text()).toContain('offerte.pdf')

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await drain(wrapper)
    await wrapper.get('#location-name').setValue('Hoofdgebouw')
    await click(wrapper, 'Submit')

    const document = api.requests()
      .find((request) => request.method === 'post' && request.path === DOCUMENTS_PATH)
    expect(document.body).toMatchObject({location: 32, name: 'offerte.pdf'})
    expect(String(document.body.file)).toContain('data:application/pdf')
    expect(bodies()).toContain('Documents have been updated')
    // The panel picks its resource from the prop it is given, so this is also
    // what says the form handed it a location rather than an equipment.
    expect(requestsTo('/api/equipment/equipment-document/')).toHaveLength(0)
  })
})

describe('LocationForm edit', () => {
  test('reads the record, its owner and its buildings, and patches the same route', async () => {
    const wrapper = mountLocation({props: {pk: '31'}})
    await settle()

    expect(requestsTo('/api/equipment/location/31/')).toHaveLength(1)
    expect(wrapper.get('#location-name').element.value).toBe('Hoofdgebouw')
    expect(wrapper.get('h3').text()).toContain('Hoofdgebouw')
    expect(wrapper.get('h3').text()).toContain('edit')
    // The record's owner is what the building list is read for.
    expect(requestsTo(BUILDINGS_PATH)[0].query).toEqual({branch: '9'})

    await wrapper.get('#location-name').setValue('Hoofdgebouw 2')
    await click(wrapper, 'Submit')

    // The patch carries the owner keys back as they came in, and the building
    // the record stands in. `PatchedLocationRequest` declares all four, and the
    // form round-trips the record rather than diffing it, which is what the
    // legacy screen did.
    expect(writes().find((request) => request.method === 'patch').body)
      .toEqual({name: 'Hoofdgebouw 2', customer: null, branch: 9, building: 41})
    expect(bodies()).toContain('Location has been updated')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('an edit offers no Bulk button', async () => {
    const wrapper = mountLocation({props: {pk: '31'}})
    await settle()

    expect(wrapper.findAll('button').some((button) => button.text() === 'Bulk')).toBe(false)
  })
})

describe('LocationForm bulk create', () => {
  test('stays on the form, clears the name and keeps the owner', async () => {
    const wrapper = mountLocation()
    await settle()

    await picker(wrapper).vm.$emit('select', BRANCH_AUTOCOMPLETE[0])
    await drain(wrapper)
    await wrapper.get('#location-name').setValue('Eerste')
    await click(wrapper, 'Bulk')

    expect(bodies()).toContain('Location has been created')
    // The default exit is a history back; a bulk save does not take it.
    expect(routerGo()).not.toHaveBeenCalled()
    expect(wrapper.get('#location-name').element.value).toBe('')

    await wrapper.get('#location-name').setValue('Tweede')
    await click(wrapper, 'Submit')

    const posts = writes(LOCATION_PATH).filter((request) => request.method === 'post')
    expect(posts).toHaveLength(2)
    expect(posts[1].body).toEqual({branch: 9, name: 'Tweede'})
    // The owner did not change, so the building list was not read again.
    expect(requestsTo(BUILDINGS_PATH)).toHaveLength(1)
  })
})

describe('LocationForm cancel', () => {
  test('goes back without writing', async () => {
    const wrapper = mountLocation()
    await settle()

    await click(wrapper, 'Cancel')

    expect(routerGo()).toHaveBeenCalledWith(-1)
    expect(writes()).toHaveLength(0)
  })
})
