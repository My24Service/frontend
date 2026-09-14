import { beforeEach, describe, expect, test, vi } from 'vitest'

import { WorkorderPage } from '@/features/order'
import { vMember, vOrder } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const UUID = '2f1c9a2e-5b7d-4c3a-9e8f-1a2b3c4d5e6f'

const DATA = () => ({
  order: fixtureFor(vOrder, {
    order_id: '2026-042',
    order_name: 'Acme BV',
    order_reference: 'REF-1',
    customer_id: 'C-5',
    orderlines: [{ id: 1, product: 'Boiler', location: 'Cellar', remarks: 'leaks' }],
    parent_order_data: { companycode: 'hq', order_id: 'HQ-9' },
  }),
  member: fixtureFor(vMember, {
    name: 'Fixers BV',
    companylogo: 'https://files.example/logo.png',
    companylogo_workorder: 'https://files.example/logo-wo.png',
  }),
  assigned_order_activity: [
    { date: '2026-01-02', work_start: '08:00', work_end: '12:00', full_name: 'Piet', travel_to: '0:30', travel_back: '0:30', distance_to: 12, distance_back: 12 },
  ],
  assigned_order_activity_totals: { work_total: '4:00', travel_to_total: '0:30', travel_back_total: '0:30', distance_to_total: 12, distance_back_total: 12, extra_work_total: '1:00' },
  assigned_order_extra_work: [{ full_name: 'Piet', extra_work_description: 'valve', extra_work: '1:00' }],
  assigned_order_materials: [{ engineer: 'Piet', name: 'Gasket', identifier: 'G-1', amount: 2 }],
  signatures: { signature_user: 'data:image/png;base64,AA==', signature_name_user: 'Piet', signature_customer: 'data:image/png;base64,BB==', signature_name_customer: 'Jan' },
  description_work: [{ user: 'Piet', description_work: 'Replaced the valve' }],
  equipment: [{ user: 'Piet', equipment: 'Ladder' }],
})

beforeEach(() => {
  api.get('/api/order/workorder-data/{id}/', DATA())
})

async function mountPage(main = {}) {
  const wrapper = mountForm(WorkorderPage, {
    deep: true,
    props: { uuid: UUID },
    main: { getWorkorderShowRelatedOrders: false, ...main },
  })
  await settle()
  return wrapper
}

describe('WorkorderPage', () => {
  test('reads the workorder data by uuid, once', async () => {
    await mountPage()

    expect(api.requests()).toEqual([
      { method: 'get', path: `/api/order/workorder-data/${UUID}/`, query: {} },
    ])
  })

  test('renders the order, the member with its workorder logo, and every section', async () => {
    const wrapper = await mountPage()
    const text = wrapper.text()

    expect(wrapper.get('img.thumbnail').attributes('src')).toBe('https://files.example/logo-wo.png')
    expect(text).toContain('Fixers BV')
    expect(text).toContain('2026-042')
    expect(text).toContain('Boiler')
    expect(text).toContain('Piet')
    expect(text).toContain('4:00')
    expect(text).toContain('valve')
    expect(text).toContain('Gasket')
    expect(text).toContain('Ladder')
    expect(text).toContain('Replaced the valve')
    expect(text).toContain('Jan')
  })

  test('falls back to the company logo when there is no workorder logo', async () => {
    const data = DATA()
    data.member.companylogo_workorder = null
    api.get('/api/order/workorder-data/{id}/', data)

    const wrapper = await mountPage()

    expect(wrapper.get('img.thumbnail').attributes('src')).toBe('https://files.example/logo.png')
  })

  test('shows the original order only when the tenant setting asks for it', async () => {
    const hidden = await mountPage()
    expect(hidden.text()).not.toContain('HQ-9')
    hidden.unmount()

    const shown = await mountPage({ getWorkorderShowRelatedOrders: true })
    expect(shown.text()).toContain('hq - HQ-9')
  })

  test('a failed read toasts', async () => {
    api.get('/api/order/workorder-data/{id}/', serverError())

    await mountPage()

    expect(toasts().map((t) => t.title)).toEqual(['Error'])
  })
})
