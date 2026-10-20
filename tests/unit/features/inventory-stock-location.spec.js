import { beforeEach, describe, expect, test } from 'vitest'
import {
  vInventoryMaterials,
  vInventoryStockLocationCreateResponse,
  vInventoryStockLocationPartialUpdateResponse,
  vStockLocation,
} from '@/api/valibot.gen'
import { StockLocationForm, StockLocationList, StockLocationView } from '@/features/inventory'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountForm, mountListView, routerGo, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'
import { modal } from '../support/modal.js'

const api = installApiSeam()

const LIST = '/api/inventory/stock-location/'
const RECORD = '/api/inventory/stock-location/{id}/'
const STOCK = '/api/inventory/inventory-materials-for-location/'

const routes = [
  { name: 'stock-location-list', path: '/inventory/stock-locations', component: { template: '<div />' } },
  { name: 'stock-location-add', path: '/inventory/stock-locations/form', component: { template: '<div />' } },
  { name: 'stock-location-edit', path: '/inventory/stock-locations/form/:pk', component: { template: '<div />' } },
  { name: 'stock-location-view', path: '/inventory/stock-locations/view/:pk', component: { template: '<div />' } },
]

const location = (overrides = {}) => fixtureFor(vStockLocation, {
  id: 5,
  name: 'Main warehouse',
  identifier: 'WH-1',
  inventory: 12,
  show_in_stats: true,
  created: '01-01-2026',
  modified: '02-01-2026',
  ...overrides,
})
const stock = (id, name, total) => fixtureFor(vInventoryMaterials, { material_id: id, material_name: name, total_amount: total })

const bodies = () => toasts().map((toast) => toast.body)
const requestsOf = (method, path) => api.requests().filter((request) => request.method === method && request.path === path)
const writes = () => api.requests().filter((request) => ['post', 'patch'].includes(request.method))
const button = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().trim() === text)
async function click(wrapper, text) {
  const target = button(wrapper, text)
  expect(target, text + ' must be reachable').toBeTruthy()
  await target.trigger('click')
  await settle()
}

describe('StockLocationList', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
    api.get(LIST, () => paginated([location(), location({ id: 6, name: 'Van 3', identifier: 'V-3', inventory: 0, show_in_stats: false })], { count: 45 }))
    api.delete(LIST + '{id}/', noContent)
  })
  const mountLocations = async () => {
    const wrapper = await mountListView(StockLocationList, { deep: true, routes })
    await settle()
    return wrapper
  }

  test('loads page one and renders every column', async () => {
    const wrapper = await mountLocations()

    expect(requestsOf('get', LIST)[0]).toMatchObject({ query: { page: '1', page_size: '20' } })
    expect(wrapper.get('h3').text()).toContain('Stock Locations')
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual([
      'Name', 'Identifier', 'Inventory', 'In stats?', 'Created', 'Modified', '',
    ])
    const cells = wrapper.findAll('tbody tr')[0].findAll('td').map((td) => td.text())
    expect(cells.slice(0, 3)).toEqual(['Main warehouse', 'WH-1', '12'])
    expect(cells.slice(4, 6)).toEqual(['01-01-2026', '02-01-2026'])
  })

  test('the in-stats column shows a check for a location in the stats and nothing for one that is not', async () => {
    const wrapper = await mountLocations()

    const [inStats, notInStats] = wrapper.findAll('tbody tr').map((tr) => tr.findAll('td')[3])
    expect(inStats.find('svg').exists()).toBe(true)
    expect(notInStats.find('svg').exists()).toBe(false)
  })

  test('the name links to the view', async () => {
    const wrapper = await mountLocations()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/inventory/stock-locations/view/5')
  })

  test('the row carries a delete action and no edit action, as the legacy list did', async () => {
    const wrapper = await mountLocations()

    expect(wrapper.find('button[title="Delete"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Edit"]').exists()).toBe(false)
  })

  test('the add button goes to the create form', async () => {
    const wrapper = await mountLocations()

    expect(wrapper.findAll('a').find((a) => a.text() === 'Add stock location').attributes('href')).toBe('/inventory/stock-locations/form')
  })

  test('no column offers a sort, because the endpoint takes no ordering', async () => {
    const wrapper = await mountLocations()

    expect(wrapper.findAll('thead th[aria-label^="Sort by"]')).toHaveLength(0)
    await wrapper.get('thead th').trigger('click')
    await settle()
    expect(requestsOf('get', LIST)).toHaveLength(1)
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountLocations()

    await wrapper.get('input[aria-label="Search stock locations"]').setValue('van')
    await settle()

    expect(requestsOf('get', LIST).at(-1).query).toMatchObject({ q: 'van', page: '1' })
  })

  test('an empty list says so', async () => {
    api.get(LIST, paginated([]))
    const wrapper = await mountLocations()

    expect(wrapper.get('tbody').text()).toContain('No stock locations found')
  })

  test('a load failure tells the user', async () => {
    api.get(LIST, serverError)
    await mountLocations()

    expect(bodies()).toContain('Error loading stock locations')
  })

  test('delete confirms, sends the row id, refetches and says so', async () => {
    const wrapper = await mountLocations()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
    expect(document.getElementById('delete-stock-location-modal').textContent).toContain('Are you sure you want to delete this stock location?')

    modal('delete-stock-location-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(LIST + '5/')
    expect(requestsOf('get', LIST)).toHaveLength(2)
    expect(toasts().map((toast) => [toast.title, toast.body])).toContainEqual(['Deleted', 'Stock location has been deleted'])
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(LIST + '{id}/', serverError)
    const wrapper = await mountLocations()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-stock-location-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Main warehouse')
    expect(bodies()).toContain('Error deleting stock location')
  })
})

describe('StockLocationView', () => {
  beforeEach(() => {
    api.get(RECORD, () => location())
    api.get(STOCK, () => [stock(1, 'Widget', 12), stock(2, 'Gadget', 4)])
  })
  const normalise = (html) => html
    .replace(/ data-v-[0-9a-f]+=""/g, '')
    .replace(/ id="[^"]*"/g, '')
    .replace(/ for="[^"]*"/g, '')
  const mountView = async () => {
    const wrapper = mountForm(StockLocationView, { deep: true, routes, props: { pk: 5 } })
    await settle()
    return wrapper
  }

  test('renders the legacy view\'s markup', async () => {
    // The snapshot was taken only after this view's HTML was proven identical
    // (bar scoped-style hashes, generated ids and the legacy view's
    // commented-out block) to the legacy StockLocationView's (since deleted),
    // for this same fixture.
    const current = normalise((await mountView()).html())

    expect(current).toMatchSnapshot()
  })

  test('reads the location and the materials it holds, and nothing else', async () => {
    await mountView()

    const gets = api.requests().filter((request) => request.method === 'get')
    expect(gets.map((request) => [request.path, request.query])).toEqual(expect.arrayContaining([
      ['/api/inventory/stock-location/5/', {}],
      [STOCK, { location: '5' }],
    ]))
    expect(gets).toHaveLength(2)
  })

  test('shows the name, its identifier and the stock of each material', async () => {
    const wrapper = await mountView()

    expect(wrapper.get('h3').text()).toContain('Main warehouse (WH-1)')
    expect(wrapper.get('h6').text()).toBe('Inventory · Main warehouse')
    const rows = wrapper.findAll('tbody tr').map((tr) => tr.findAll('td').map((td) => td.text()))
    expect(rows).toEqual([['Widget', '12'], ['Gadget', '4']])
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Material', 'Total amount'])
  })

  test('the edit link goes to the form', async () => {
    const wrapper = await mountView()

    expect(wrapper.findAll('a').find((a) => a.text() === 'Edit stock location').attributes('href')).toBe('/inventory/stock-locations/form/5')
  })

  test('the backlink goes back', async () => {
    const wrapper = await mountView()

    await wrapper.get('.backlink').trigger('click')

    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed location read tells the user', async () => {
    api.get(RECORD, serverError)
    await mountView()

    expect(bodies()).toContain('Error fetching stock location/inventory')
  })

  test('a failed stock read tells the user', async () => {
    api.get(STOCK, serverError)
    await mountView()

    expect(bodies()).toContain('Error fetching stock location/inventory')
  })

  test('both reads failing tell the user once', async () => {
    api.get(RECORD, serverError)
    api.get(STOCK, serverError)
    await mountView()

    expect(bodies().filter((body) => body === 'Error fetching stock location/inventory')).toHaveLength(1)
  })
})

describe('StockLocationForm', () => {
  beforeEach(() => {
    api.get(RECORD, () => location())
    api.post(LIST, ({ body }) => fixtureFor(vInventoryStockLocationCreateResponse, { id: 8, ...body }))
    api.patch(RECORD, ({ body }) => fixtureFor(vInventoryStockLocationPartialUpdateResponse, { id: 5, ...body }))
  })
  const mountLocation = async (props = {}) => {
    const wrapper = mountForm(StockLocationForm, { deep: true, routes, props })
    await settle()
    return wrapper
  }
  const type = async (wrapper, selector, value) => {
    await wrapper.get(selector).setValue(value)
    await settle()
  }

  describe('create', () => {
    test('posts the stock location, says so and goes back', async () => {
      const wrapper = await mountLocation()

      await type(wrapper, '#stock-location_name', 'Van 3')
      await click(wrapper, 'Submit')

      expect(writes().map((request) => [request.method, request.path])).toEqual([['post', LIST]])
      expect(writes()[0].body).toEqual({ name: 'Van 3', identifier: '', show_in_stats: false })
      expect(toasts().map((toast) => [toast.title, toast.body])).toContainEqual(['Created', 'Stock location has been created'])
      expect(routerGo()).toHaveBeenCalledWith(-1)
    })

    test('sends the identifier and the stats checkbox', async () => {
      const wrapper = await mountLocation()

      await type(wrapper, '#stock-location_name', 'Van 3')
      await type(wrapper, '#stock-location_identifier', 'V-3')
      await wrapper.get('#stock-location_show_in_stats').setValue(true)
      await click(wrapper, 'Submit')

      expect(writes()[0].body).toEqual({ name: 'Van 3', identifier: 'V-3', show_in_stats: true })
    })

    test('sends nothing when the name is missing', async () => {
      const wrapper = await mountLocation()

      await click(wrapper, 'Submit')

      expect(wrapper.text()).toContain('Please enter a name')
      expect(writes()).toEqual([])
      expect(routerGo()).not.toHaveBeenCalled()
    })

    test('the header says the location is new', async () => {
      const wrapper = await mountLocation()

      expect(wrapper.get('h3').text()).toBe('New stock location')
    })

    test('a failed post reports it, keeps the form and does not navigate', async () => {
      api.post(LIST, serverError)
      const wrapper = await mountLocation()

      await type(wrapper, '#stock-location_name', 'Van 3')
      await click(wrapper, 'Submit')

      expect(bodies()).toContain('Error creating stock location')
      expect(routerGo()).not.toHaveBeenCalled()
      expect(wrapper.get('#stock-location_name').element.value).toBe('Van 3')
      expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
    })

    test('cancel goes back without writing', async () => {
      const wrapper = await mountLocation()

      await click(wrapper, 'Cancel')

      expect(routerGo()).toHaveBeenCalledWith(-1)
      expect(writes()).toEqual([])
    })
  })

  describe('edit', () => {
    test('loads the stock location into the fields', async () => {
      const wrapper = await mountLocation({ pk: 5 })

      expect(wrapper.get('#stock-location_name').element.value).toBe('Main warehouse')
      expect(wrapper.get('#stock-location_identifier').element.value).toBe('WH-1')
      expect(wrapper.get('#stock-location_show_in_stats').element.checked).toBe(true)
      expect(wrapper.get('h3').text()).toBe('Edit stock location')
      expect(requestsOf('get', '/api/inventory/stock-location/5/')).toHaveLength(1)
    })

    test('patches the stock location, says so and goes back', async () => {
      const wrapper = await mountLocation({ pk: 5 })

      await type(wrapper, '#stock-location_name', 'Central warehouse')
      await wrapper.get('#stock-location_show_in_stats').setValue(false)
      await click(wrapper, 'Submit')

      expect(writes().map((request) => [request.method, request.path])).toEqual([['patch', '/api/inventory/stock-location/5/']])
      expect(writes()[0].body).toEqual({ name: 'Central warehouse', identifier: 'WH-1', show_in_stats: false })
      expect(toasts().map((toast) => [toast.title, toast.body])).toContainEqual(['Updated', 'Stock location has been updated'])
      expect(routerGo()).toHaveBeenCalledWith(-1)
    })

    test('clearing the name blocks the patch', async () => {
      const wrapper = await mountLocation({ pk: 5 })

      await type(wrapper, '#stock-location_name', '')
      await click(wrapper, 'Submit')

      expect(wrapper.text()).toContain('Please enter a name')
      expect(writes()).toEqual([])
    })

    test('a failed patch reports it and does not navigate', async () => {
      const wrapper = await mountLocation({ pk: 5 })

      api.patch(RECORD, serverError)
      await click(wrapper, 'Submit')

      expect(bodies()).toContain('Error updating stock location')
      expect(routerGo()).not.toHaveBeenCalled()
    })

    test('a failed read tells the user', async () => {
      api.get(RECORD, serverError)
      await mountLocation({ pk: 5 })

      expect(bodies()).toContain('Error fetching stock location')
    })
  })
})
