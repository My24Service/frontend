import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OrdersSchedule } from '@/features/order'
import { vOrderDetail, vOrderEvent } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import { modal } from '../../support/modal.js'
import { orderRoutes } from '../../support/order-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

vi.mock('vue-loading-overlay', () => ({
  useLoading: () => ({ show: () => ({ hide() {} }) }),
}))

const api = installApiSeam()

// Events in the month the calendar opens on, so they land in the grid.
const now = new Date()
const iso = (day, hour = 0) => new Date(Date.UTC(now.getFullYear(), now.getMonth(), day, hour)).toISOString()

const EVENTS = () => [
  fixtureFor(vOrderEvent, { id: 42, title: 'Acme BV', start: iso(10), end: iso(10), groupId: 'Maintenance' }),
  fixtureFor(vOrderEvent, { id: 43, title: 'Beta BV', start: iso(12, 8), end: iso(12, 10), groupId: 'Repair' }),
  fixtureFor(vOrderEvent, { id: 44, title: 'Gamma BV', start: iso(14), end: iso(14), groupId: 'Maintenance' }),
]

beforeEach(() => {
  api.get('/api/order/order/month_events/', EVENTS())
  api.get('/api/order/order/{id}/', fixtureFor(vOrderDetail, {
    id: 42, order_id: '2026-042', order_name: 'Acme BV', order_address: 'Main 1', order_postal: '1234AB', order_city: 'Gouda',
    orderlines: [], infolines: [], documents: [], invoices: [], statuses: [], assigned_user_info: [],
    workorder_documents: [], workorder_documents_partners: [], workorder_documents_org_order: [],
    workorder_pdf_url_partner: [], copied_order_data: [], reported_codes_extra_data: [], parent_order_data: {},
    workorder_url_org_order: null,
  }))
})

async function mountSchedule() {
  const wrapper = mountForm(OrdersSchedule, {
    deep: true,
    routes: orderRoutes,
    main: { getOrderTypes: ['Maintenance', 'Repair', 'Inspection'], getProductFamily: 'shltr' },
  })
  await settle()
  await new Promise((resolve) => setTimeout(resolve, 50))
  await settle()
  return wrapper
}

function button(wrapper, text) {
  const found = wrapper.findAll('button').find((b) => b.text() === text)
  if (!found) throw new Error(`no button "${text}"`)
  return found
}

const legendButtons = (wrapper) => wrapper.findAll('button[aria-pressed]')
const renderedEvents = (wrapper) => wrapper.findAll('.fc-event')

describe('OrdersSchedule (shltr family)', () => {
  test('shows the period, the appointment count and one legend button per order type', async () => {
    const wrapper = await mountSchedule()

    expect(wrapper.text()).toContain('3 appointments')
    expect(legendButtons(wrapper).map((b) => b.text())).toEqual(['Maintenance', 'Repair', 'Inspection'])
    expect(wrapper.find('.tw\\:text-sm.tw\\:font-semibold').text()).not.toBe('')
    expect(renderedEvents(wrapper)).toHaveLength(3)
    // the card's own header drives the calendar; FullCalendar's toolbar is off
    expect(wrapper.find('.fc-toolbar').exists()).toBe(false)
    expect(wrapper.find('.fc-col-header-cell').text()).toMatch(/^[A-Za-z]{2,3}$/)
  })

  test('the legend tints each type by its position in the tenant list', async () => {
    const wrapper = await mountSchedule()

    expect(legendButtons(wrapper)[0].classes()).toContain('my24-event-type-0')
    expect(legendButtons(wrapper)[2].classes()).toContain('my24-event-type-2')
    expect(renderedEvents(wrapper)[1].classes()).toContain('my24-event-type-1')
  })

  test('picking a type in the legend hides the other events and recounts, without a request; Clear restores them', async () => {
    const wrapper = await mountSchedule()
    const before = api.requests().length

    await legendButtons(wrapper)[1].trigger('click')
    await settle()

    expect(legendButtons(wrapper)[1].attributes('aria-pressed')).toBe('true')
    expect(legendButtons(wrapper)[0].classes()).toContain('tw:opacity-40')
    expect(wrapper.text()).toContain('1 appointment')
    expect(renderedEvents(wrapper)).toHaveLength(1)
    expect(api.requests()).toHaveLength(before)

    await button(wrapper, 'Clear').trigger('click')
    await settle()

    expect(wrapper.text()).toContain('3 appointments')
    expect(renderedEvents(wrapper)).toHaveLength(3)
  })

  test('picking a type twice unpicks it', async () => {
    const wrapper = await mountSchedule()

    await legendButtons(wrapper)[0].trigger('click')
    await legendButtons(wrapper)[0].trigger('click')
    await settle()

    expect(legendButtons(wrapper)[0].attributes('aria-pressed')).toBe('false')
    expect(wrapper.text()).toContain('3 appointments')
  })

  test('the view switch changes the calendar view and marks the active one', async () => {
    const wrapper = await mountSchedule()
    expect(wrapper.find('.fc-dayGridMonth-view').exists()).toBe(true)

    await button(wrapper, 'Week').trigger('click')
    await settle()

    expect(wrapper.find('.fc-timeGridWeek-view').exists()).toBe(true)
    expect(button(wrapper, 'Week').classes()).toContain('tw:bg-white')
    expect(button(wrapper, 'Month').classes()).not.toContain('tw:bg-white')

    await button(wrapper, 'Day').trigger('click')
    await settle()
    expect(wrapper.find('.fc-timeGridDay-view').exists()).toBe(true)
  })

  test('previous / next step the period and ask for the new range; today comes back', async () => {
    const wrapper = await mountSchedule()
    const title = () => wrapper.find('.tw\\:text-sm.tw\\:font-semibold').text()
    const start = title()

    await wrapper.get('button[title="Next"]').trigger('click')
    await settle()
    expect(title()).not.toBe(start)
    expect(api.requests().filter((r) => r.path === '/api/order/order/month_events/').length).toBeGreaterThan(1)

    await wrapper.get('button[title="Previous"]').trigger('click')
    await settle()
    expect(title()).toBe(start)

    await wrapper.get('button[title="Next"]').trigger('click')
    await button(wrapper, 'Today').trigger('click')
    await settle()
    expect(title()).toBe(start)
  })

  test('clicking an event reads the order and opens its modal', async () => {
    const wrapper = await mountSchedule()

    await renderedEvents(wrapper)[0].trigger('click')
    await settle()
    await new Promise((resolve) => setTimeout(resolve, 10))
    await settle()

    expect(api.requests().at(-1)).toMatchObject({ method: 'get', path: '/api/order/order/42/' })
    expect(modal('order-info-modal').isOpen()).toBe(true)
    expect(document.getElementById('order-info-modal').textContent).toContain('Main 1')
  })
})
