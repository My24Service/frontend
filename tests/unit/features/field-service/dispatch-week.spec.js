import { beforeEach, describe, expect, test, vi } from 'vitest'

import DispatchWeek from '@/views/mobile/dispatch/DispatchWeek.vue'

import { installApiSeam, settle } from '../../support/api-seam/index.js'
import { mountForm, toastCreate } from '../../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => ({
  ...(await importOriginal()), useToast: () => ({create: toastCreate}),
}))

/**
 * Characterisation of the dispatch week board, written against the LEGACY
 * screen before it moves into `src/features/field-service/dispatch/`.
 *
 * What it pins is the part a refactor can silently break: the window request
 * (method, path, and the `start_date` the board's week is built from), which
 * users the board draws, and the two things a planner can do on a row.
 */
const api = installApiSeam()
const endpoint = '/api/company/dispatch-assignedorders-user-list-v4/'

function assignedOrder(overrides = {}) {
  return {
    id: 501,
    order: {
      id: 12,
      order_id: 'ORD-12',
      order_name: 'Acme',
      order_city: 'Utrecht',
      order_type: 'Maintenance',
      order_reference: '',
      order_status: '',
      last_status: '',
      orderlines: [],
    },
    start_date: '2026-09-14',
    end_date: '2026-09-15',
    start_time: '08:00:00',
    end_time: '12:30:00',
    last_status: '',
    date_formatted: '14-09-2026',
    ...overrides,
  }
}

/** One row per user, as the endpoint answers: `{'data': [row]}`. */
function windowOf(rows) {
  return { data: rows }
}

const twoUsers = () => windowOf([
  { full_name: 'Jan Jansen', is_partner: false, assignedorders: [assignedOrder()] },
  { full_name: 'Piet Pietersen', is_partner: false, assignedorders: [] },
])

beforeEach(() => {
  api.get(endpoint, twoUsers)
})

async function mountBoard(props = {}) {
  const wrapper = mountForm(DispatchWeek, {
    deep: true,
    props: {
      startDate: new Date(2026, 8, 14),
      mode: 'wide',
      orderClickHandler: () => {},
      isAssignMode: false,
      alreadyAssignedUsers: [],
      showUsersMode: 'active',
      ...props,
    },
    main: { getStatuscodes: [] },
  })
  await settle()
  return wrapper
}

describe('DispatchWeek', () => {
  test('reads the window for the week it is showing', async () => {
    await mountBoard()

    expect(api.requests()[0]).toMatchObject({
      method: 'get',
      path: endpoint,
      query: { start_date: '2026-09-14' },
    })
  })

  test('draws the seven days of the week it read', async () => {
    const wrapper = await mountBoard()

    expect(wrapper.findAll('.weekdays > span')).toHaveLength(7)
    expect(wrapper.get('.weekdays').text()).toContain('week')
    expect(wrapper.get('.weekdays').text()).toContain('14')
  })

  test('draws a row per user, with the orders of each', async () => {
    const wrapper = await mountBoard()

    expect(wrapper.findAll('li.planning-row')).toHaveLength(2)
    expect(wrapper.text()).toContain('Jan Jansen')
    expect(wrapper.text()).toContain('ORD-12')
  })

  test('a user with no orders is drawn only in assign mode or with the all filter', async () => {
    const hidden = await mountBoard()
    expect(hidden.text()).not.toContain('Piet Pietersen')

    const shown = await mountBoard({ showUsersMode: 'all' })
    expect(shown.text()).toContain('Piet Pietersen')
  })

  test('clicking a row picks the user, but only while assigning', async () => {
    const idle = await mountBoard()
    await idle.findAll('li.planning-row')[0].trigger('click')
    expect(idle.emitted('addSelectedUser')).toBeUndefined()

    const assigning = await mountBoard({ isAssignMode: true })
    await assigning.findAll('li.planning-row')[0].trigger('click')
    expect(assigning.emitted('addSelectedUser')).toEqual([[{ user_id: undefined, full_name: 'Jan Jansen' }]])
  })

  test('moving the week re-reads it', async () => {
    const wrapper = await mountBoard()
    expect(api.requests()).toHaveLength(1)

    await wrapper.setProps({ startDate: new Date(2026, 8, 21) })
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({ start_date: '2026-09-21' })
  })

  test('clicking an order hands the order to the parent handler', async () => {
    const onOrderClick = vi.fn()
    const wrapper = await mountBoard({ orderClickHandler: onOrderClick })

    const box = wrapper.get('.order-summary').element.parentElement
    await wrapper.get('div[style*="grid-column"]').trigger('click')

    expect(box).toBeTruthy()
    expect(onOrderClick).toHaveBeenCalledWith(undefined, 12, expect.objectContaining({ id: 501 }), false)
  })
})
