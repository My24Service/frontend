import { beforeEach, describe, expect, test, vi } from 'vitest'

import WorkorderMaintenance from '@/views/orders/WorkorderMaintenance.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for WorkorderMaintenance's one migrated call
 * site: `created()` used to go through `OrderService.getWorkorderData(uuid)`
 * (GET `/order/workorder-data/{uuid}/`); it now calls the generated
 * `orderWorkorderDataRetrieve({ path: { id: uuid } })` (GET
 * `/api/order/workorder-data/{id}/`). Same path, same query (none) - so the
 * shape recorded here is the one either seam produces. On this branch the
 * hand-written call is what runs.
 */

const fakeHttp = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/services/api', () => ({ default: fakeHttp, normalClient: fakeHttp }))

vi.mock('@/api/client.gen', async () => {
  const { apiClientMock } = await import('../../support/api-client-mock.js')
  return apiClientMock(fakeHttp)
})

const DATA = {
  member: {
    name: 'Acme B.V.',
    address: 'Kerkstraat 1',
    postal: '1000 AA',
    city: 'Utrecht',
    tel: '0301234567',
    email: 'acme@example.test',
    companylogo_url: 'http://logo.example.test/acme.png',
    companylogo_workorder_url: null,
  },
  order: {
    order_id: 'ORD-1',
    order_reference: 'REF-1',
    customer_id: 5,
    order_name: 'Klant B.V.',
    order_address: 'Straat 9',
    order_country_code: 'NL',
    order_postal: '2000 BB',
    order_city: 'Amsterdam',
    order_type: 'maintenance',
    order_date: '01/01/2026',
    order_contact: 'Jan',
    customer_reference: 'CR-1',
    orderlines: [],
  },
  assigned_order_activity: [],
  assigned_order_activity_totals: {
    work_total: 0,
    travel_to_total: 0,
    travel_back_total: 0,
    distance_to_total: 0,
    distance_back_total: 0,
    extra_work_total: 0,
  },
  assigned_order_extra_work: [],
  assigned_order_materials: [],
  equipment: [],
  description_work: [],
  signatures: null,
}

// Keyed on the path the legacy client actually calls - `/api` lives in its
// baseURL, so it never reaches the fake. `requestShapes` canonicalizes the
// prefix back on when it reports the recorded shape.
const ROUTES = { '/order/workorder-data/wo-1/': DATA }

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
})

describe('WorkorderMaintenance - call shapes', () => {
  test('created() calls orderWorkorderDataRetrieve with the uuid', async () => {
    const wrapper = mountForm(WorkorderMaintenance, { props: { uuid: 'wo-1' } })

    await vi.waitFor(() => expect(wrapper.vm.data).not.toBeNull())

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/order/workorder-data/wo-1/', query: {}, body: undefined },
    ])
  })
})
