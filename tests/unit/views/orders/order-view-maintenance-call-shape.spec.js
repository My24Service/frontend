import { beforeEach, describe, expect, test, vi } from 'vitest'

import OrderViewMaintenance from '@/views/orders/OrderViewMaintenance.vue'

import { mountForm, resetFakeHttp } from '../../support/form-harness.js'
import { requestShapes } from '../../support/request-recorder.js'

/**
 * Call-shape characterisation for the OrderViewMaintenance call sites that the
 * SDK migration touched.
 *
 * - `loadOrder` by uuid used to go through `OrderService.detailUuid(uuid)`
 *   (GET `/order/order/detail/{uuid}/`); it now calls the generated
 *   `orderOrderDetailRetrieve({ path: { id: uuid } })` (GET
 *   `/api/order/order/detail/{id}/`). Same path, same query (none).
 * - `recreateWorkorderPdfGotenberg` used to go through
 *   `OrderService.recreateWorkorderPdfGotenberg(pk)` (POST
 *   `/order/order/{pk}/recreate_pdf/?gotenberg=1`); it now calls
 *   `orderOrderRecreatePdfCreate({ path: { id: Number(pk) }, query: { gotenberg: 1 } })`
 *   (POST `/api/order/order/{id}/recreate_pdf/?gotenberg=1`). The view
 *   converts the pk to a Number; the resolved URL is the same either way.
 *
 * The `pk !== null` branch of `loadOrder` (plain BaseModel `detail`) and all
 * PurchaseInvoice CRUD are unchanged by the refactor and are not pinned here.
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

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate: create } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create }) }
})

const ORDER = {
  id: 42,
  order_id: 'ORD-42',
  uuid: 'UUID-1',
  orderlines: [],
  assigned_user_info: [],
  infolines: [],
  invoices: [],
  workorder_documents: [],
  workorder_documents_partners: [],
  workorder_documents_org_order: [],
  reported_codes_extra_data: [],
  workorder_pdf_url_partner: [],
  order_email_extra: [],
  statuses: [],
  workorder_pdf_url: null,
  customer_relation: null,
  copied_order_data: null,
  parent_order_data: null,
}

const ROUTES = { '/order/order/42/': ORDER }

function mount(props) {
  return mountForm(OrderViewMaintenance, {
    props,
    main: {
      getMemberHasBranches: false,
      getMemberUsesEquipment: false,
      getDefaultCurrency: 'EUR',
    },
    stubs: {
      DocumentsComponent: { template: '<div />' },
      StatusesComponent: { template: '<div />' },
      PriceInput: { template: '<div />' },
      IconLinkPlus: { template: '<div />' },
      IconLinkDelete: { template: '<div />' },
    },
  })
}

beforeEach(() => {
  resetFakeHttp(fakeHttp, ROUTES)
})

describe('OrderViewMaintenance - call shapes', () => {
  test('loadOrder by uuid calls orderOrderDetailRetrieve with the uuid', async () => {
    // The SDK op is the first GET of the mount; serve it the order fixture.
    fakeHttp.get.mockResolvedValueOnce({ data: structuredClone(ORDER) })
    const wrapper = mount({ pk: null, uuid: 'UUID-1' })

    await vi.waitFor(() => expect(wrapper.vm.order).not.toBeNull())

    expect(requestShapes(fakeHttp, { method: 'get' })).toEqual([
      { method: 'get', path: '/api/order/order/detail/UUID-1/', query: {}, body: undefined },
    ])
  })

  test('recreateWorkorderPdfGotenberg posts to recreate_pdf with gotenberg=1', async () => {
    const wrapper = mount({ pk: 42 })
    await vi.waitFor(() => expect(wrapper.vm.order).not.toBeNull())

    await wrapper.vm.recreateWorkorderPdfGotenberg()

    expect(requestShapes(fakeHttp, { method: 'post' })).toEqual([
      { method: 'post', path: '/api/order/order/42/recreate_pdf/', query: { gotenberg: '1' }, body: undefined },
    ])
  })
})
