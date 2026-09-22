import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OrderView } from '@/features/order'
import { vOrderDetail } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { orderRoutes } from '../../support/order-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const UUID = '2f1c9a2e-5b7d-4c3a-9e8f-1a2b3c4d5e6f'

const ORDER = {
  id: 42,
  uuid: UUID,
  order_id: '2026-042',
  order_type: 'Event',
  order_name: 'Acme BV',
  order_address: 'Main 1',
  order_postal: '1234AB',
  order_city: 'Gouda',
  order_country_code: 'NL',
  order_contact: 'Jan',
  order_email: 'jan@acme.example',
  order_tel: '010-1234567',
  order_mobile: '06-12345678',
  order_reference: 'GALA-1',
  customer_id: '5013',
  customer_remarks: 'Gate code 1234',
  customer_relation: 7,
  required_users: 5,
  assigned_count: 2,
  last_status: 'planned',
  order_date: '02/01/2026',
  workorder_url: 'https://app.example/#/orders/orders/workorder/' + UUID,
  workorder_pdf_url: 'https://files.example/wo-42.pdf',
  assigned_user_info: [],
  orderlines: [{ id: 1, product: 'Waiter', location: 'Hall A', remarks: 'black tie', equipment_view: null, equipment_location_view: null }],
  statuses: [
    { id: 1, order: 42, status: 'new', created: '2026-01-01', modified: '2026-01-01' },
    { id: 2, order: 42, status: 'planned', created: '2026-01-02', modified: '2026-01-02' },
  ],
}

const DETAIL = (overrides = {}) =>
  fixtureFor(vOrderDetail, {
    ...ORDER,
    infolines: [],
    documents: [],
    invoices: [],
    workorder_documents: [],
    workorder_documents_partners: [],
    workorder_documents_org_order: [],
    workorder_pdf_url_partner: [],
    copied_order_data: [],
    parent_order_data: {},
    reported_codes_extra_data: [],
    workorder_url_org_order: null,
    order_email_extra: [],
    ...overrides,
  })

beforeEach(() => {
  api.get('/api/order/order/{id}/', DETAIL())
})

async function mountView({ props = { pk: '42' }, main = {} } = {}) {
  const wrapper = mountForm(OrderView, {
    deep: true,
    routes: orderRoutes,
    props,
    main: {
      getMemberType: 'temps', getFlavour: 'temps',
      getMemberHasBranches: false,
      getMemberUsesEquipment: false,
      getDefaultCurrency: 'EUR',
      ...main,
    },
  })
  await settle()
  return wrapper
}

describe('the order detail on a temps tenant', () => {
  test('reads the order once, by its id, and nothing else', async () => {
    await mountView()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/order/order/42/', query: {}, body: undefined },
    ])
  })

  test('shows the order, its headcount, contact, lines and timeline, with the edit link carrying the pk', async () => {
    const wrapper = await mountView()
    const text = wrapper.text()

    expect(text).toContain('#2026-042')
    expect(text).toContain('Event')
    expect(text).toContain('Acme BV')
    expect(text).toContain('5013')
    expect(text).toContain('02/01/2026')
    expect(text).toContain('GALA-1')
    expect(text).toContain('Required users')
    expect(wrapper.findAll('dd').map((dd) => dd.text())).toContain('5')
    expect(text).toContain('planned')
    expect(text).toContain('Gate code 1234')
    expect(text).toContain('Jan')
    expect(text).toContain('06-12345678')
    expect(text).toContain('Main 1')

    const lines = wrapper.findAll('#orderlines-table tbody tr').map((row) => row.findAll('td').map((td) => td.text()))
    expect(lines).toEqual([['Waiter', 'Hall A', 'black tie']])

    // the timeline, newest first
    expect(wrapper.findAll('.listing-item small').map((s) => s.text())).toEqual(['planned', '2026-01-02', 'new', '2026-01-01'])

    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain('/orders/orders/form/42')
    expect(hrefs).toContain(ORDER.workorder_url)
    expect(hrefs).toContain(ORDER.workorder_pdf_url)
    expect(hrefs).toContain('mailto:jan@acme.example')
  })

  test('has none of the maintenance detail: no workorder modal, invoices, documents or partner orders', async () => {
    const wrapper = await mountView()
    const text = wrapper.text()

    expect(text).not.toContain('View workorder')
    expect(text).not.toContain('Create invoice')
    expect(text).not.toContain('Documents')
    expect(text).not.toContain('Partner order')
    expect(text).not.toContain('Info lines')
  })

  test('without a PDF yet, offers no download', async () => {
    api.get('/api/order/order/{id}/', DETAIL({ workorder_pdf_url: null }))
    const wrapper = await mountView()

    expect(wrapper.text()).not.toContain('Download PDF')
  })

  test('reads the one detail by uuid', async () => {
    const wrapper = await mountView({ props: { uuid: UUID } })

    expect(api.requests()).toEqual([
      { method: 'get', path: `/api/order/order/${UUID}/`, query: {}, body: undefined },
    ])
    expect(wrapper.text()).toContain('#2026-042')
    expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toContain('/orders/orders/form/42')
  })

  test('a failed read toasts', async () => {
    api.get('/api/order/order/{id}/', () => serverError())
    const wrapper = await mountView()

    expect(toasts().map((t) => t.body)).toContain('Error fetching order')
    expect(wrapper.text()).not.toContain('#2026-042')
  })

  test('a maintenance tenant still gets the full detail', async () => {
    api.get('/api/invoice/purchase/', paginated([]))
    const wrapper = await mountView({ main: { getMemberType: 'maintenance', getFlavour: 'maintenance' } })

    expect(wrapper.text()).toContain('View workorder')
    expect(wrapper.text()).not.toContain('Required users')
  })
})
