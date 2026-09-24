import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { StatuscodeList } from '@/features/statuscode'
import { vPaginatedStatuscodeList } from '@/api/valibot.gen'

import { fixtureFor, itemSchemaOf, paginated } from '../../helpers/schema-fixture.js'
import { addFilter, editorInput } from '../../support/column-filters.js'
import { installApiSeam, noContent, settle } from '../../support/api-seam/index.js'
import { mountListView, toasts } from '../../support/form-harness.js'
import { serverError } from '../../support/list-harness.js'
import { modal } from '../../support/modal.js'
import { statuscodeRoutes } from '../../support/statuscode-routes.js'

/**
 * The statuscode list, one screen mounted once per code type and twice per
 * tree (/company/statuscodes/<type> and /settings/statuscodes/<type>).
 *
 * Seams under test: the initial fetch and its `code_type`, the rendered rows
 * with their nested actions, the type pills, the search and delete flows,
 * the toasts, and the route names each tree links to.
 */

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

const api = installApiSeam()

const ITEM = itemSchemaOf(vPaginatedStatuscodeList)

function statuscodeRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 3,
    code_type: 'order',
    statuscode: 'Aangemaakt',
    color: '#ff3300',
    text_color: '#ffffff',
    description: 'opdracht aangemaakt',
    actions: [],
    start_order: false,
    end_order: false,
    after_end_order: false,
    num_days: null,
    num_days_operator: '<',
    num_days_model_field: null,
    ...overrides,
  })
}

function statuscodePage({ count = 30 } = {}) {
  return paginated(
    [
      statuscodeRow({
        id: 3,
        start_order: true,
        roles: ['order_entry_status', 'order_entry_branch_status'],
        actions: [
          { id: 7, name: 'mail planning', type: 'email', statuscode: 3, destination: null, conditions: '' },
        ],
      }),
      statuscodeRow({ id: 4, statuscode: 'Afgerond', end_order: true, color: '#00ff00', roles: [] }),
    ],
    { count },
  )
}

function seedUrl(queryString) {
  window.history.replaceState(null, '', `/#/?${queryString}`)
}

function resetUrl() {
  window.history.replaceState(null, '', '/')
}

async function pastDebounce() {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
}

beforeEach(() => {
  resetUrl()
  api.get('/api/statuscode/statuscode/', statuscodePage())
  api.delete('/api/statuscode/statuscode/{id}/', noContent)
})

afterEach(() => {
  resetUrl()
})

/** Mount the list for a code type, optionally down the settings tree. */
async function mountStatuscodeList({ codeType = 'order', fromSettings = false, query = {}, main = {} } = {}) {
  const wrapper = await mountListView(StatuscodeList, {
    deep: true,
    routes: statuscodeRoutes,
    query,
    main,
    props: { codeType, fromSettings },
  })
  await settle()
  return wrapper
}

function rowTexts(wrapper) {
  return wrapper.findAll('tbody > tr').map((row) => row.text())
}

describe('StatuscodeList, wire contract', () => {
  test('the initial load sends the code type, the page and the page size, and nothing else', async () => {
    await mountStatuscodeList({ codeType: 'quotation' })

    expect(api.requests().at(-1)).toMatchObject({
      path: '/api/statuscode/statuscode/',
      query: { code_type: 'quotation', page: '1', page_size: '20' },
    })
  })
})

describe('StatuscodeList, rows', () => {
  test('shows a row for every statuscode the backend returned, with its lifecycle flags', async () => {
    const wrapper = await mountStatuscodeList()

    expect(rowTexts(wrapper).length).toBe(2)
    expect(rowTexts(wrapper)[0]).toContain('Aangemaakt')
    expect(rowTexts(wrapper)[0]).toContain('Start order')
    expect(rowTexts(wrapper)[1]).toContain('End order')
  })

  test('shows each statuscode’s roles as badges', async () => {
    const wrapper = await mountStatuscodeList()

    const badges = (row) => row.findAll('.statuscode-roles .badge').map((badge) => badge.text())
    const rows = wrapper.findAll('tbody tr')
    expect(badges(rows[0])).toEqual(['Order entry status', 'Order entry branch status'])
    expect(badges(rows[1])).toEqual([])
  })

  test('draws the preview in the statuscode’s own colours', async () => {
    const wrapper = await mountStatuscodeList()

    const preview = wrapper.findAll('.statuscode-preview')[0]
    expect(preview.text()).toBe('Aangemaakt')
    expect(preview.attributes('style')).toContain('--bg-color: #ff3300')
    expect(preview.attributes('style')).toContain('--text-color: #ffffff')
  })

  test('links each statuscode to its edit page, and each nested action to the action’s edit page', async () => {
    const wrapper = await mountStatuscodeList()

    const hrefs = wrapper.findAll('tbody a').map((link) => link.attributes('href'))
    expect(hrefs).toContain('/company/statuscodes/order/form/3')
    expect(hrefs).toContain('/company/statuscodes/order/form/4')
    expect(hrefs).toContain('/company/statuscodes/action/order/form/7')
    expect(rowTexts(wrapper)[0]).toContain('mail planning (email)')
  })

  test('offers an add-action link per row, carrying the statuscode', async () => {
    const wrapper = await mountStatuscodeList()

    expect(wrapper.find('a[href="/company/statuscodes/action/order/add/3"]').exists()).toBe(true)
  })

  test('the add link and the row links follow the code type', async () => {
    const wrapper = await mountStatuscodeList({ codeType: 'quotation' })

    expect(wrapper.find('a[href="/company/statuscodes/quotation/form"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/company/statuscodes/quotation/form/3"]').exists()).toBe(true)
  })

  test('from_settings switches every link to the settings tree', async () => {
    const wrapper = await mountStatuscodeList({ codeType: 'invoice', fromSettings: true })

    expect(wrapper.find('a[href="/settings/statuscodes/invoice/form"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/settings/statuscodes/invoice/form/3"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/settings/statuscodes/invoice/action/form/7"]').exists()).toBe(true)
    expect(wrapper.find('a[href="/settings/statuscodes/invoice/action/add/3"]').exists()).toBe(true)
  })
})

describe('StatuscodeList, type pills', () => {
  test('shows a pill per code type, each linking to that type’s list — not all to the order list', async () => {
    const wrapper = await mountStatuscodeList()

    const pills = wrapper.findAll('.statuscode-pills a')
    expect(pills.map((pill) => pill.text())).toEqual(['Orders', 'Leave', 'Sick leave', 'Quotation', 'Invoice', 'Work hours'])
    expect(pills.map((pill) => pill.attributes('href'))).toEqual([
      '/company/statuscodes/order',
      '/company/statuscodes/leave_hours',
      '/company/statuscodes/sick_leave',
      '/company/statuscodes/quotation',
      '/company/statuscodes/invoice',
      '/company/statuscodes/work_hours',
    ])
  })

  test('marks the mounted type active', async () => {
    const wrapper = await mountStatuscodeList({ codeType: 'sick_leave' })

    const active = wrapper.findAll('.statuscode-pills a.active')
    expect(active.map((pill) => pill.text())).toEqual(['Sick leave'])
  })

  test('the settings tree gets pills too, pointing into the settings tree', async () => {
    const wrapper = await mountStatuscodeList({ fromSettings: true })

    const hrefs = wrapper.findAll('.statuscode-pills a').map((pill) => pill.attributes('href'))
    expect(hrefs).toContain('/settings/statuscodes/order')
    expect(hrefs).toContain('/settings/statuscodes/work_hours')
  })
})

describe('StatuscodeList, search and pagination', () => {
  test('the toolbar search commits the term to the wire, keeping the code type', async () => {
    const wrapper = await mountStatuscodeList()

    await wrapper.get('input[aria-label="Search statuscodes"]').setValue('aang')
    await pastDebounce()

    expect(api.requests().at(-1).query).toEqual({ code_type: 'order', page: '1', page_size: '20', q: 'aang' })
  })

  test('a shared address restores the view before the first request', async () => {
    seedUrl('q=aang&page=2')

    await mountStatuscodeList()

    expect(api.requests().at(-1).query).toEqual({ code_type: 'order', page: '2', page_size: '20', q: 'aang' })
  })
})

describe('StatuscodeList, delete flow', () => {
  test('confirming the delete puts the destroy on the wire and refetches', async () => {
    const wrapper = await mountStatuscodeList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-statuscode-modal').ok()
    await settle()

    expect(api.requests().map((sent) => [sent.method, sent.path])).toEqual([
      ['get', '/api/statuscode/statuscode/'],
      ['delete', '/api/statuscode/statuscode/3/'],
      ['get', '/api/statuscode/statuscode/'],
    ])
    expect(toasts().map((toast) => toast.body)).toContain('Statuscode has been deleted')
  })

  test('tells the user when the delete fails', async () => {
    api.delete('/api/statuscode/statuscode/{id}/', serverError)
    const wrapper = await mountStatuscodeList()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-statuscode-modal').ok()
    await settle()

    expect(toasts().map((toast) => toast.body)).toContain('Error deleting statuscode')
  })
})

describe('StatuscodeList, load failure', () => {
  test('tells the user when the list cannot be loaded', async () => {
    api.get('/api/statuscode/statuscode/', serverError)

    await mountStatuscodeList()

    expect(toasts().map((toast) => toast.body)).toContain('Error loading statuscodes')
  })
})

describe('StatuscodeList column filters', () => {
  test('the Statuscode filter rides the wire under its bare column name', async () => {
    const wrapper = await mountStatuscodeList()
    await settle()

    await addFilter(wrapper, 'Statuscode')
    await editorInput(wrapper, 'statuscode').setValue('Assigned')
    // The kit commits the search and the filters on a 300 ms debounce.
    await new Promise((resolve) => setTimeout(resolve, 350))
    await settle()

    expect(api.requests().at(-1).query).toMatchObject({statuscode: 'Assigned'})
  })
})
