import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OrdersSchedule } from '@/features/order'
import { vOrderEvent } from '@/api/valibot.gen'

import { fixtureFor } from '../../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm } from '../../support/form-harness.js'
import { orderRoutes } from '../../support/order-routes.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

// The full-screen loader mounts into document.body through the library's
// plugin, which the harness does not install.
vi.mock('vue-loading-overlay', () => ({
  useLoading: () => ({ show: () => ({ hide() {} }) }),
}))

const api = installApiSeam()

const EVENTS = () => [
  fixtureFor(vOrderEvent, { id: 42, title: 'Acme BV', start: '2026-09-14T00:00:00Z', end: '2026-09-14T00:00:00Z', groupId: 'Maintenance' }),
  fixtureFor(vOrderEvent, { id: 43, title: 'Beta BV', start: '2026-09-15T08:00:00Z', end: '2026-09-15T10:00:00Z', groupId: 'Repair' }),
]

beforeEach(() => {
  api.get('/api/order/order/month_events/', EVENTS())
})

async function mountSchedule() {
  const wrapper = mountForm(OrdersSchedule, {
    deep: true,
    routes: orderRoutes,
    main: { getOrderTypes: ['Maintenance', 'Repair'], getProductFamily: 'default' },
  })
  await settle()
  await new Promise((resolve) => setTimeout(resolve, 50))
  await settle()
  return wrapper
}

describe('OrdersSchedule', () => {
  test('asks for the events of the range the calendar shows, as ISO dates', async () => {
    await mountSchedule()

    const request = api.requests().find((r) => r.path === '/api/order/order/month_events/')
    expect(request).toBeDefined()
    expect(request.query.start).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(request.query.end).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(Object.keys(request.query).sort()).toEqual(['end', 'start'])
  })

  test('renders the calendar with its own toolbar for the default family', async () => {
    const wrapper = await mountSchedule()

    expect(wrapper.find('.fc').exists()).toBe(true)
    expect(wrapper.find('.fc-toolbar').exists()).toBe(true)
    expect(wrapper.findAll('.schedule-shltr-btn')).toHaveLength(0)
  })
})
