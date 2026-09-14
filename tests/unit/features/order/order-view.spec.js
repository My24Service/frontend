import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { OrderView } from '@/features/order'
import { vOrderDetail, vOrderDetailPublic, vPurchase, vResultResponse } from '@/api/valibot.gen'

import { fixtureFor, paginated } from '../../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { orderRoutes } from '../../support/order-routes.js'


vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const UUID = '2f1c9a2e-5b7d-4c3a-9e8f-1a2b3c4d5e6f'

const DETAIL = (overrides = {}) =>
  fixtureFor(vOrderDetail, {
    id: 42,
    uuid: UUID,
    order_id: '2026-042',
    order_type: 'Maintenance',
    order_name: 'Acme BV',
    order_address: 'Main 1',
    order_postal: '1234AB',
    order_city: 'Amsterdam',
    order_country_code: 'NL',
    order_contact: 'Jan',
    order_email: 'jan@acme.example',
    order_reference: 'REF-1',
    customer_reference: 'CREF-1',
    remarks: 'Bring ladder',
    customer_remarks: 'Gate code 1234',
    planning_remarks: 'Two engineers',
    customer_relation: 5,
    last_status: 'planned',
    workorder_pdf_url: 'https://files.example/wo-42.pdf',
    assigned_user_info: [{ user_id: 7, full_name: 'Piet', license_plate: null }],
    orderlines: [
      {
        id: 1,
        product: 'Boiler',
        location: 'Cellar',
        remarks: 'leaks',
        equipment_view: { id: 9, name: 'Boiler X1' },
        equipment_location_view: { id: 3, name: 'Basement' },
      },
    ],
    infolines: [{ id: 1, order: 42, info: 'call first' }],
    documents: [{ id: 3, order: 42, name: 'plan.pdf', url: 'https://files.example/plan.pdf', filename: 'plan.pdf', created: '2026-01-01', modified: '2026-01-01' }],
    invoices: [
      { id: 11, invoice_id: 'INV-11', uuid: 'INV-UUID-11', preliminary: true },
      { id: 12, invoice_id: 'INV-12', uuid: 'INV-UUID-12', preliminary: false },
    ],
    statuses: [{ id: 1, order: 42, status: 'planned', created: '2026-01-02', modified: '2026-01-02' }],
    workorder_documents: [{ url: 'https://files.example/wd.pdf', name: 'wd.pdf' }],
    workorder_documents_partners: [],
    workorder_documents_org_order: [],
    workorder_pdf_url_partner: [{ companycode: 'partner-a', url: 'https://files.example/p.pdf' }],
    copied_order_data: [{ companycode: 'partner-a', order_id: 'P-1' }],
    parent_order_data: { companycode: 'hq', order_id: 'HQ-9' },
    reported_codes_extra_data: [{ statuscode: 'done', extra_data: 'all good' }],
    workorder_url_org_order: null,
    order_email_extra: ['extra@acme.example'],
    ...overrides,
  })

const PUBLIC_DETAIL = () =>
  fixtureFor(vOrderDetailPublic, {
    uuid: UUID,
    order_id: '2026-042',
    order_name: 'Acme BV',
    orderlines: [],
    infolines: [],
    documents: [],
    invoices: [],
    statuses: [],
    assigned_user_info: [],
    workorder_documents: [],
    workorder_documents_partners: [],
    workorder_pdf_url_partner: [],
    reported_codes_extra_data: [],
  })

const PURCHASES = () =>
  paginated([
    fixtureFor(vPurchase, { id: 70, order: 42, reference: 'PI-70', description: 'parts', vat: '2.10', vat_currency: 'EUR', total: '12.10', total_currency: 'EUR' }),
  ])

beforeEach(() => {
  // The workorder modal's iframe points at the app's own public route, which
  // happy-dom would fetch through the seam as if it were an API call.
  window.happyDOM.settings.disableIframePageLoading = true
  api.get('/api/order/order/{id}/', DETAIL())
  api.get('/api/order/order/detail/{id}/', PUBLIC_DETAIL())
  api.get('/api/invoice/purchase/', PURCHASES())
  api.post('/api/invoice/purchase/', fixtureFor(vPurchase, { id: 71, order: 42 }), { status: 201 })
  api.delete('/api/invoice/purchase/{id}/', noContent)
  api.post('/api/order/order/{id}/recreate_pdf/', fixtureFor(vResultResponse, { result: true }))
})

async function mountView({ props = { pk: '42' }, auth = {}, main = {} } = {}) {
  const wrapper = mountForm(OrderView, {
    deep: true,
    routes: orderRoutes,
    props,
    auth,
    main: {
      getMemberHasBranches: false,
      getMemberUsesEquipment: false,
      getDefaultCurrency: 'EUR',
      ...main,
    },
  })
  await settle()
  return wrapper
}

describe('OrderView by pk', () => {
  test('reads the order once, by its id', async () => {
    await mountView()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/order/order/42/', query: {} },
    ])
  })

  test('shows the order, its edit link carrying the pk, and the create-invoice link', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('2026-042')
    expect(wrapper.text()).toContain('Acme BV')
    expect(wrapper.text()).toContain('Bring ladder')
    const edit = wrapper.findAll('a').find((a) => a.text().includes('Edit order'))
    expect(edit.attributes('href')).toBe('/orders/orders/form/42')
    const invoice = wrapper.findAll('a').find((a) => a.text().includes('Create invoice'))
    expect(invoice.attributes('href')).toBe(`/invoices/create/${UUID}`)
  })

  test('links a preliminary invoice to its edit form and a final one to its view', async () => {
    const wrapper = await mountView()

    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    expect(hrefs).toContain(`/invoices/edit/11/${UUID}`)
    expect(hrefs).toContain('/invoices/view/INV-UUID-12')
  })

  test('renders the assignees, orderlines, infolines, documents and partner data', async () => {
    const wrapper = await mountView()
    const text = wrapper.text()

    expect(text).toContain('Piet')
    expect(text).toContain('Boiler')
    expect(text).toContain('Cellar')
    expect(text).toContain('call first')
    expect(text).toContain('plan.pdf')
    expect(text).toContain('partner-a - P-1')
    expect(text).toContain('hq - HQ-9')
    expect(text).toContain('all good')
    expect(text).toContain('wd.pdf')
  })

  test('with equipment enabled, an orderline shows its equipment and location names', async () => {
    const wrapper = await mountView({ main: { getMemberUsesEquipment: true } })

    expect(wrapper.text()).toContain('Boiler X1')
    expect(wrapper.text()).toContain('Basement')
    expect(wrapper.text()).not.toContain('Cellar')
  })

  test('the planning-only rows show for a planning user and not for a customer', async () => {
    const planning = await mountView({ auth: { isPlanning: true } })
    expect(planning.text()).toContain('Two engineers')
    expect(planning.text()).toContain('extra@acme.example')
    planning.unmount()

    const customer = await mountView({ auth: { isCustomer: true } })
    expect(customer.text()).not.toContain('Two engineers')
    expect(customer.text()).not.toContain('Gate code 1234')
  })

  test('a failed read toasts', async () => {
    api.get('/api/order/order/{id}/', serverError())

    await mountView()

    expect(toasts().map((t) => t.title)).toEqual(['Error'])
  })
})

describe('OrderView by uuid', () => {
  test('reads the public detail by uuid and offers no edit link', async () => {
    const wrapper = await mountView({ props: { uuid: UUID } })

    expect(api.requests()).toEqual([
      { method: 'get', path: `/api/order/order/detail/${UUID}/`, query: {} },
    ])
    expect(wrapper.text()).toContain('2026-042')
    expect(wrapper.findAll('a').some((a) => a.text().includes('Edit order'))).toBe(false)
  })
})

describe('OrderView, the workorder', () => {
  test('regenerating the PDF posts the legacy gotenberg flag and re-reads the order', async () => {
    const wrapper = await mountView({ auth: { isPlanning: true } })
    await wrapper.findAll('a').find((a) => a.text().includes('View workorder')).trigger('click')
    await settle()

    document.getElementById('recreateWorkorderPdfButtonGotenberg').click()
    await settle()

    expect(api.requests().slice(1)).toEqual([
      { method: 'post', path: '/api/order/order/42/recreate_pdf/', query: { gotenberg: '1' }, body: undefined },
      { method: 'get', path: '/api/order/order/42/', query: {} },
    ])
    expect(toasts().map((t) => t.title)).toEqual(['Success'])
  })

  test('a customer gets no regenerate button', async () => {
    const wrapper = await mountView({ auth: { isCustomer: true } })
    await wrapper.findAll('a').find((a) => a.text().includes('View workorder')).trigger('click')
    await settle()

    expect(document.getElementById('recreateWorkorderPdfButtonGotenberg')).toBeNull()
  })
})

describe('OrderView, purchase invoices (branch tenants)', () => {
  const withBranches = () => mountView({ main: { getMemberHasBranches: true } })

  test('reads the whole purchase-invoice collection for the order beside the detail', async () => {
    const wrapper = await withBranches()

    expect(api.requests()).toContainEqual({
      method: 'get',
      path: '/api/invoice/purchase/',
      query: { order: '42', page: '1', page_size: '1000' },
    })
    expect(wrapper.text()).toContain('PI-70')
    expect(wrapper.text()).toContain('€12.10')
  })

  test('a tenant without branches never asks for them', async () => {
    await mountView()

    expect(api.requests().map((r) => r.path)).not.toContain('/api/invoice/purchase/')
  })

  test('adding one posts the draft against the order and refetches the list', async () => {
    const wrapper = await withBranches()

    await wrapper.get('button[title="New purchase invoice"]').trigger('click')
    await settle()
    modal('add-purchase-invoice-modal').typeInto('#add-purchase-invoice-reference', 'PI-71')
    modal('add-purchase-invoice-modal').typeInto('#add-purchase-invoice-description', 'more parts')
    modal('add-purchase-invoice-modal').ok()
    await settle()

    const post = api.requests().find((r) => r.method === 'post')
    expect(post).toEqual({
      method: 'post',
      path: '/api/invoice/purchase/',
      query: {},
      body: { order: 42, reference: 'PI-71', description: 'more parts', vat: '0.00', total: '0.00' },
    })
    expect(api.requests().filter((r) => r.path === '/api/invoice/purchase/' && r.method === 'get')).toHaveLength(2)
  })

  test('deleting one confirms, deletes and refetches', async () => {
    const wrapper = await withBranches()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-purchase-invoice-modal').ok()
    await settle()

    expect(api.requests().filter((r) => r.method === 'delete')).toEqual([
      { method: 'delete', path: '/api/invoice/purchase/70/', query: {}, body: undefined },
    ])
    expect(api.requests().filter((r) => r.path === '/api/invoice/purchase/' && r.method === 'get')).toHaveLength(2)
  })
})
