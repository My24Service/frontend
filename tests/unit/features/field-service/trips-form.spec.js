import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HttpResponse } from 'msw'

import TripForm from '@/features/field-service/trips/TripForm.vue'

import { vTrip } from '@/api/valibot.gen'
import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, routerGo, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { fieldServiceRoutes } from '../../support/field-service-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * Characterisation of the trip create/edit form, written against the LEGACY
 * screen before it moves into `src/features/field-service/trips/`.
 *
 * What it pins is the part a refactor can silently break: the request the form
 * puts on the wire (whole, as a literal), the field ids the template carries,
 * the conditions those fields render under, the order type-ahead and the
 * client-side staging table, and the copy a failure shows.
 *
 * Two legacy traps shape the fixtures rather than the assertions:
 *
 * - The date/time fields sit behind "from first/last job?" checkboxes, and the
 *   two time fields are `<b-form-timepicker>` - a component this repo's
 *   bootstrap-vue-next (0.42) does not have, so nothing ever filled them. The
 *   create path below therefore ticks "Date/time from first job?" first, which
 *   is the only way this form could ever be submitted.
 * - The order autocomplete answers with a bare array
 *   (`OrderViewset.autocomplete`, my24service `apps/order/views/order.py`),
 *   while the generated response component claims a paginated envelope, so its
 *   stub goes out as an explicit `HttpResponse`.
 */
const api = installApiSeam()
const endpoint = '/api/mobile/trip/'
const autocomplete = '/api/order/order/autocomplete/'

const COUNTRIES = [{ value: 'NL', text: 'Nederland' }]

const ORDER = {
  id: 116,
  order_id: 'ORD-116',
  orderName: 'De Kerstmarktspecialist',
  orderAddress: 'Metaalweg 4',
  orderPostal: '3751 LS',
  orderCity: 'Bunschoten',
  orderCountryCode: 'NL',
  orderDate: '01/11/2021',
  value: 'ORD-116',
}

function tripRecord(overrides = {}) {
  return fixtureFor(vTrip, {
    id: 17,
    description: 'Bestaande trip',
    required_users: 3,
    trip_date: '16/11/2021 13:30 - 18/11/2021 17:45',
    start_date: '2021-11-16',
    end_date: '2021-11-18',
    start_time: '13:30:00',
    end_time: null,
    start_location_from_first_order: false,
    start_datetime_from_first_order: false,
    start_name: 'De markt',
    start_address: 'Metaalweg 4',
    start_postal: '3751 LS',
    start_city: 'Bunschoten',
    start_country_code: 'NL',
    end_location_from_last_order: true,
    end_datetime_from_last_order: true,
    end_name: '',
    end_address: '',
    end_postal: '',
    end_city: '',
    end_country_code: 'NL',
    trip_orders: [
      {id: 45, order: 116, name: 'De Kerstmarktspecialist', address: 'Metaalweg 4', postal: '3751 LS', city: 'Bunschoten', country_code: 'NL', date: '01/11/2021'},
    ],
    ...overrides,
  })
}

const multiselectStub = {
  props: ['options', 'modelValue'],
  emits: ['select', 'search-change', 'update:modelValue', 'tag'],
  template: '<div class="multiselect-stub" />',
}

const datePickerStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="datepicker-stub" />',
}

const writes = () => api.requests().filter((request) => ['post', 'patch'].includes(request.method))
const writeOf = (method) => writes().find((request) => request.method === method)
const bodies = () => toasts().map((toast) => toast.body)
const titles = () => toasts().map((toast) => toast.title)
const searchRequests = () => api.requests().filter((request) => request.path === autocomplete)

beforeEach(() => {
  api.get(endpoint + '{id}/', () => tripRecord())
  api.post(endpoint, () => tripRecord({ id: 100 }))
  api.patch(endpoint + '{id}/', () => tripRecord())
  api.get(autocomplete, () => new HttpResponse(JSON.stringify([ORDER]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
})

function mountTrip(props = { pk: null }) {
  return mountForm(TripForm, {
    deep: true,
    props,
    routes: fieldServiceRoutes,
    main: { getCountries: COUNTRIES, getCurrentLanguage: 'nl' },
    // Both datepicker keys: @vuepic/vue-datepicker 12.1.0 exports a component
    // named `VueDatePicker` and carries an inner `VueDatePickerRoot`, and a stub
    // keyed only the one the template does not resolve to leaves the real picker
    // mounted - a spec that then measures nothing (equipment/README.md records
    // the trap; this is the same trap with the keys the other way round).
    stubs: {
      VueMultiselect: multiselectStub,
      VueDatePicker: datePickerStub,
      VueDatePickerRoot: datePickerStub,
    },
  })
}

function orderSearch(wrapper) {
  const picker = wrapper.findAllComponents(multiselectStub)
    .find((component) => component.attributes('id') === 'trip-order-search')
  if (!picker) throw new Error('no trip-order-search picker')
  return picker
}

async function clickButton(wrapper, text) {
  const button = wrapper.findAll('button').find((candidate) => candidate.text() === text)
  if (!button) throw new Error(`no button labelled "${text}"`)
  await button.trigger('click')
  await settle()
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 700))
  await settle()
}

/** The start's location block and the headcount: asked for whatever the dates do. */
async function fillStart(wrapper) {
  await wrapper.get('#trip_start_name').setValue('De markt')
  await wrapper.get('#trip_start_address').setValue('Metaalweg 4')
  await wrapper.get('#trip_start_postal').setValue('3751 LS')
  await wrapper.get('#trip_start_city').setValue('Bunschoten')
  await wrapper.get('#required_users').setValue('3')
  await settle()
}

/**
 * The shortest trip the form can be made to submit without a date or a time:
 * the start's own ones are taken from the first job, so they are not asked for.
 */
async function fillMinimum(wrapper) {
  await wrapper.get('#start_datetime_from_first_order').setValue(true)
  await fillStart(wrapper)
}

/** The date pickers the form currently renders, in template order. */
function dates(wrapper) {
  return wrapper.findAllComponents(datePickerStub)
}

describe('TripForm create', () => {
  test('posts the whole trip, with the empty keys the model dropped left out', async () => {
    const wrapper = mountTrip()
    await settle()

    await fillMinimum(wrapper)
    await clickButton(wrapper, 'Submit')

    const post = writeOf('post')
    expect(post.path).toBe(endpoint)
    expect(post.body).toEqual({
      description: '',
      required_users: 3,
      start_location_from_first_order: false,
      start_datetime_from_first_order: true,
      start_name: 'De markt',
      start_address: 'Metaalweg 4',
      start_postal: '3751 LS',
      start_city: 'Bunschoten',
      start_country_code: 'NL',
      end_location_from_last_order: true,
      end_datetime_from_last_order: true,
      end_name: '',
      end_address: '',
      end_postal: '',
      end_city: '',
      end_country_code: 'NL',
      trip_orders: [],
    })
    expect(post.body).not.toHaveProperty('start_date')
    expect(post.body).not.toHaveProperty('start_time')
    // Read-only response fields the record carries and the parse drops: the
    // legacy model posted every one of them.
    expect(post.body).not.toHaveProperty('last_status')
    expect(post.body).not.toHaveProperty('last_status_full')
    expect(post.body).not.toHaveProperty('user_trip_is_available')

    expect(titles()).toContain('Trip created')
    expect(bodies()).toContain('Trip 100 has been created')
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a trip timed by hand carries the date and the time that were filled in', async () => {
    // The path the legacy could not take: `<b-form-timepicker>` is not a
    // component this repo's bootstrap-vue-next has, so both time fields were
    // dead elements - and since a time is required whenever the start is not
    // taken from the first job, this form's validation refused every such trip.
    const wrapper = mountTrip()
    await settle()

    await fillStart(wrapper)
    await wrapper.get('#trip_start_time').setValue('09:30')
    // Just after local midnight: the day an `toISOString()` would report as the
    // 15th, which is the trap the equipment form's ledger records.
    expect(dates(wrapper)).toHaveLength(1)
    await dates(wrapper)[0].vm.$emit('update:modelValue', new Date(2021, 10, 16, 0, 30))
    await settle()

    await clickButton(wrapper, 'Submit')

    expect(writeOf('post').body).toMatchObject({
      start_date: '2021-11-16',
      start_time: '09:30:00',
    })
  })

  test('a staged order rides the body', async () => {
    const wrapper = mountTrip()
    await settle()

    await fillMinimum(wrapper)
    await orderSearch(wrapper).vm.$emit('select', ORDER)
    await clickButton(wrapper, 'Add order')
    await clickButton(wrapper, 'Submit')

    // The row the table shows carries the order's name, address, city and
    // date; the write body carries the `order` the request component declares.
    expect(writeOf('post').body.trip_orders).toEqual([{order: 116}])
  })

  test('a failed create reports it and keeps the user on the form', async () => {
    api.post(endpoint, serverError())
    const wrapper = mountTrip()
    await settle()

    await fillMinimum(wrapper)
    await clickButton(wrapper, 'Submit')

    expect(bodies()).toContain('Error creating trip')
    expect(routerGo()).not.toHaveBeenCalled()
  })
})

describe('TripForm edit', () => {
  test('reads the trip it is editing', async () => {
    mountTrip({ pk: '17' })
    await settle()

    expect(api.requests()[0]).toMatchObject({ method: 'get', path: endpoint + '17/' })
  })

  test('patches the record back, with its dates as YYYY-MM-DD', async () => {
    const wrapper = mountTrip({ pk: '17' })
    await settle()

    await clickButton(wrapper, 'Submit')

    const patch = writeOf('patch')
    expect(patch.path).toBe(endpoint + '17/')
    // Exact, so a key the request does not declare cannot ride along: the
    // legacy PATCH posted the whole fetched record - its id, its statuses, its
    // counts and the order rows' display fields - and DRF ignored the extras.
    expect(patch.body).toEqual({
      description: 'Bestaande trip',
      required_users: 3,
      start_location_from_first_order: false,
      start_datetime_from_first_order: false,
      start_name: 'De markt',
      start_address: 'Metaalweg 4',
      start_postal: '3751 LS',
      start_city: 'Bunschoten',
      start_country_code: 'NL',
      end_location_from_last_order: true,
      end_datetime_from_last_order: true,
      end_name: '',
      end_address: '',
      end_postal: '',
      end_city: '',
      end_country_code: 'NL',
      start_date: '2021-11-16',
      start_time: '13:30:00',
      end_date: '2021-11-18',
      trip_orders: [{ order: 116 }],
    })
    expect(patch.body).not.toHaveProperty('id')
    expect(patch.body).not.toHaveProperty('end_time')
    expect(patch.body).not.toHaveProperty('last_status')
    expect(titles()).toContain('Trip updated')
    expect(bodies()).toContain('Trip has been updated')
  })

  test('a failed edit reports it', async () => {
    api.patch(endpoint + '{id}/', serverError())
    const wrapper = mountTrip({ pk: '17' })
    await settle()

    await clickButton(wrapper, 'Submit')

    expect(bodies()).toContain('Error updating trip')
  })

  test('a failed read reports it', async () => {
    api.get(endpoint + '{id}/', serverError)
    mountTrip({ pk: '17' })
    await settle()

    expect(bodies()).toContain('Error fetching trip')
  })
})

describe('TripForm order search', () => {
  test('a term is debounced onto the order autocomplete', async () => {
    const wrapper = mountTrip()
    await settle()

    await orderSearch(wrapper).vm.$emit('search-change', 'kerst')
    await pastDebounce()

    expect(searchRequests()).toHaveLength(1)
    expect(searchRequests()[0]).toMatchObject({ method: 'get', path: autocomplete, query: { q: 'kerst' } })
    expect(orderSearch(wrapper).props('options')).toEqual([ORDER])
  })

  test('an empty term asks for nothing', async () => {
    const wrapper = mountTrip()
    await settle()

    await orderSearch(wrapper).vm.$emit('search-change', '')
    await pastDebounce()

    expect(searchRequests()).toHaveLength(0)
  })
})

describe('TripForm fields', () => {
  test('every id the legacy template carried is still rendered', async () => {
    const wrapper = mountTrip()
    await settle()

    // Includes the two country selects, which the legacy template gave a
    // `label-for` and no `id` at all: their labels focused nothing, and the
    // filters that a `label-for` is for had nothing to point at.
    const ids = [
      'start_datetime_from_first_order',
      'trip_start_date',
      'trip_start_time',
      'start_location_from_first_order',
      'trip_start_name',
      'trip_start_city',
      'trip_start_address',
      'trip_start_postal',
      'start_country_code',
      'end_datetime_from_last_order',
      'trip_end_date',
      'end_time',
      'end_location_from_last_order',
      'trip_end_name',
      'trip_end_city',
      'trip_end_address',
      'trip_end_postal',
      'end_country_code',
      'required_users',
      'trip_description',
      'trip-order-search',
    ]

    // The date/time and location blocks render only while their checkbox is
    // off, and the two "from last job" boxes start on, so both are switched
    // off first - after which every id below is on screen at once.
    await wrapper.get('#end_datetime_from_last_order').setValue(false)
    await wrapper.get('#end_location_from_last_order').setValue(false)

    const missing = ids.filter((id) => !wrapper.find(`#${id}`).exists())
    expect(missing).toEqual([])
  })

  test('the date/time and location blocks follow their checkboxes', async () => {
    const wrapper = mountTrip()
    await settle()

    expect(wrapper.find('#trip_start_date').exists()).toBe(true)
    expect(wrapper.find('#trip_end_date').exists()).toBe(false)
    expect(wrapper.find('#trip_end_name').exists()).toBe(false)

    await wrapper.get('#end_datetime_from_last_order').setValue(false)
    await wrapper.get('#end_location_from_last_order').setValue(false)

    expect(wrapper.find('#trip_end_date').exists()).toBe(true)
    expect(wrapper.find('#trip_end_name').exists()).toBe(true)
  })

  test('an order staged in the table can be removed again', async () => {
    const wrapper = mountTrip()
    await settle()

    await orderSearch(wrapper).vm.$emit('select', ORDER)
    await clickButton(wrapper, 'Add order')
    expect(wrapper.get('tbody').text()).toContain('De Kerstmarktspecialist')

    await wrapper.get('tbody a.h5').trigger('click')

    expect(wrapper.find('tbody').exists()).toBe(false)
  })

  test('Cancel goes back', async () => {
    const wrapper = mountTrip()
    await settle()

    await clickButton(wrapper, 'Cancel')

    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})
