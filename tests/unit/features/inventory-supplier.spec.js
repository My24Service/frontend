import { beforeEach, describe, expect, test } from 'vitest'
import {
  vInventorySupplierCreateResponse,
  vInventorySupplierPartialUpdateResponse,
  vMaterial,
  vSupplier,
} from '@/api/valibot.gen'
import { SupplierForm, SupplierList, SupplierView } from '@/features/inventory/supplier'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountForm, mountListView, routerGo, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'
import { modal } from '../support/modal.js'

const api = installApiSeam()

const LIST = '/api/inventory/supplier/'
const RECORD = '/api/inventory/supplier/{id}/'
const MATERIALS = '/api/inventory/material/'

const routes = [
  { name: 'supplier-list', path: '/inventory/suppliers', component: { template: '<div />' } },
  { name: 'supplier-add', path: '/inventory/suppliers/form', component: { template: '<div />' } },
  { name: 'supplier-edit', path: '/inventory/suppliers/form/:pk', component: { template: '<div />' } },
  { name: 'supplier-view', path: '/inventory/suppliers/view/:pk', component: { template: '<div />' } },
]

const COUNTRIES = [
  { value: 'NL', text: 'Netherlands' },
  { value: 'DE', text: 'Germany' },
]

const supplier = (overrides = {}) => fixtureFor(vSupplier, {
  id: 7,
  name: 'ACME',
  address: 'Main 1',
  postal: '1000AA',
  city: 'Utrecht',
  country_code: 'NL',
  tel: '030-1234567',
  mobile: '06-12345678',
  email: 'orders@acme.test',
  contact: 'Jan Jansen',
  remarks: 'Pays late',
  identifier: 'S-7',
  created: '01-01-2026',
  modified: '02-01-2026',
  ...overrides,
})
const material = (id, name, unit) => fixtureFor(vMaterial, { id, name, show_name: name, unit, supplier_relation: 7, modified: '03-01-2026' })

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

describe('SupplierList', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
    api.get(LIST, () => paginated([supplier()], { count: 45 }))
    api.delete(LIST + '{id}/', noContent)
  })
  const mountSuppliers = async () => {
    const wrapper = await mountListView(SupplierList, { deep: true, routes })
    await settle()
    return wrapper
  }

  test('loads page one and renders every column', async () => {
    const wrapper = await mountSuppliers()

    expect(requestsOf('get', LIST)[0]).toMatchObject({ query: { page: '1', page_size: '20' } })
    expect(wrapper.get('h3').text()).toContain('Suppliers')
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Name', 'Address', 'City', 'Tel.', 'Mobile', ''])
    const cells = wrapper.findAll('tbody tr')[0].findAll('td').map((td) => td.text())
    expect(cells.slice(0, 5)).toEqual(['ACME', 'Main 1', 'Utrecht', '030-1234567', '06-12345678'])
  })

  test('the name links to the view', async () => {
    const wrapper = await mountSuppliers()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/inventory/suppliers/view/7')
  })

  test('the row carries a delete action and no edit action, as the legacy list did', async () => {
    const wrapper = await mountSuppliers()

    expect(wrapper.find('button[title="Delete"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Edit"]').exists()).toBe(false)
  })

  test('the add button goes to the create form', async () => {
    const wrapper = await mountSuppliers()

    expect(wrapper.findAll('a').find((a) => a.text() === 'Add supplier').attributes('href')).toBe('/inventory/suppliers/form')
  })

  test('no column offers a sort, because the endpoint takes no ordering', async () => {
    const wrapper = await mountSuppliers()

    expect(wrapper.findAll('thead th[aria-label^="Sort by"]')).toHaveLength(0)
    await wrapper.get('thead th').trigger('click')
    await settle()
    expect(requestsOf('get', LIST)).toHaveLength(1)
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountSuppliers()

    await wrapper.get('input[aria-label="Search suppliers"]').setValue('acme')
    await settle()

    expect(requestsOf('get', LIST).at(-1).query).toMatchObject({ q: 'acme', page: '1' })
  })

  test('an empty list says so', async () => {
    api.get(LIST, paginated([]))
    const wrapper = await mountSuppliers()

    expect(wrapper.get('tbody').text()).toContain('No suppliers found')
  })

  test('a load failure tells the user', async () => {
    api.get(LIST, serverError)
    await mountSuppliers()

    expect(bodies()).toContain('Error loading suppliers')
  })

  test('delete confirms, sends the row id, refetches and says so', async () => {
    const wrapper = await mountSuppliers()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
    expect(document.getElementById('delete-supplier-modal').textContent).toContain('Are you sure you want to delete this supplier?')

    modal('delete-supplier-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(LIST + '7/')
    expect(requestsOf('get', LIST)).toHaveLength(2)
    expect(toasts().map((toast) => [toast.title, toast.body])).toContainEqual(['Deleted', 'Supplier has been deleted'])
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(LIST + '{id}/', serverError)
    const wrapper = await mountSuppliers()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-supplier-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('ACME')
    expect(bodies()).toContain('Error deleting supplier')
  })
})

describe('SupplierView', () => {
  beforeEach(() => {
    api.get(RECORD, () => supplier())
    api.get(MATERIALS, () => paginated([material(1, 'Widget', 'pcs'), material(2, 'Gadget', 'kg')]))
  })
  const normalise = (html) => html
    .replace(/ data-v-[0-9a-f]+=""/g, '')
    .replace(/ id="[^"]*"/g, '')
    .replace(/ for="[^"]*"/g, '')
  const mountView = async () => {
    const wrapper = mountForm(SupplierView, { deep: true, routes, props: { pk: 7 } })
    await settle()
    return wrapper
  }
  const dd = (wrapper, term) => {
    const dt = wrapper.findAll('dt').find((node) => node.text() === term)
    return dt.element.nextElementSibling.textContent.trim()
  }

  test('renders the legacy view\'s markup, but for the two fixes', async () => {
    // The snapshot was taken only after this view's HTML was proven identical
    // (bar scoped-style hashes and generated ids) to the legacy SupplierView's
    // (since deleted). Two things differ from it by design, and the snapshot
    // carries them: the contact block reads `contact`, `tel`, `mobile` and
    // `email` where the legacy view read `order_*` keys a supplier has none of,
    // and the materials table has its rows.
    const current = normalise((await mountView()).html())

    expect(current).toMatchSnapshot()
  })

  test('reads the supplier and all of its materials at once', async () => {
    await mountView()

    const gets = api.requests().filter((request) => request.method === 'get')
    expect(gets.map((request) => [request.path, request.query])).toEqual(expect.arrayContaining([
      ['/api/inventory/supplier/7/', {}],
      [MATERIALS, { supplier_relation: '7', page: '1', page_size: '1000' }],
    ]))
    expect(gets).toHaveLength(2)
  })

  // Legacy bug: the materials table was given no `:items`, so a supplier's
  // materials were read and never shown.
  test('renders the supplier\'s materials', async () => {
    const wrapper = await mountView()

    const rows = wrapper.findAll('#materials-table tbody tr').map((tr) => tr.findAll('td').map((td) => td.text()))
    expect(rows).toEqual([['Widget', 'pcs', '03-01-2026'], ['Gadget', 'kg', '03-01-2026']])
    expect(wrapper.findAll('#materials-table thead th').map((th) => th.text())).toEqual(['Name', 'Unit', 'Modified'])
  })

  // Legacy bug: Contact, Tel., Mobile and Email read `order_*` keys, which a
  // supplier record does not have, so they were always blank.
  test('shows the supplier\'s contact, phone, mobile and email', async () => {
    const wrapper = await mountView()

    expect(dd(wrapper, 'Contact')).toBe('Jan Jansen')
    expect(dd(wrapper, 'Tel.')).toBe('030-1234567')
    expect(dd(wrapper, 'Mobile')).toBe('06-12345678')
    expect(dd(wrapper, 'Email')).toBe('orders@acme.test')
    expect(wrapper.get('a[href^="mailto:"]').attributes('href')).toBe('mailto:orders@acme.test')
  })

  test('a supplier without an email has no mailto link', async () => {
    api.get(RECORD, () => supplier({ email: null }))
    const wrapper = await mountView()

    expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
    expect(dd(wrapper, 'Email')).toBe('')
  })

  test('shows the record\'s own fields', async () => {
    const wrapper = await mountView()

    expect(dd(wrapper, 'Identifier')).toBe('S-7')
    expect(dd(wrapper, 'Name')).toBe('ACME')
    expect(dd(wrapper, 'Address')).toBe('Main 1')
    expect(dd(wrapper, 'Country/Postal/city')).toBe('NL- 1000AA Utrecht')
    expect(dd(wrapper, 'Remarks')).toBe('Pays late')
  })

  test('the edit link goes to the form', async () => {
    const wrapper = await mountView()

    expect(wrapper.findAll('a').find((a) => a.text() === 'Edit supplier').attributes('href')).toBe('/inventory/suppliers/form/7')
  })

  test('the back button and the backlink go back', async () => {
    const wrapper = await mountView()

    await click(wrapper, 'Back')
    await wrapper.get('.backlink').trigger('click')

    expect(routerGo()).toHaveBeenCalledTimes(2)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed supplier read tells the user', async () => {
    api.get(RECORD, serverError)
    await mountView()

    expect(bodies()).toContain('Error fetching supplier/materials')
  })

  test('a failed materials read tells the user', async () => {
    api.get(MATERIALS, serverError)
    await mountView()

    expect(bodies()).toContain('Error fetching supplier/materials')
  })
})

describe('SupplierForm', () => {
  beforeEach(() => {
    api.get(RECORD, () => supplier())
    api.post(LIST, ({ body }) => fixtureFor(vInventorySupplierCreateResponse, { id: 8, ...body }))
    api.patch(RECORD, ({ body }) => fixtureFor(vInventorySupplierPartialUpdateResponse, { id: 7, ...body }))
  })
  const mountSupplier = async (props = {}) => {
    const wrapper = mountForm(SupplierForm, { deep: true, routes, props, main: { getCountries: COUNTRIES } })
    await settle()
    return wrapper
  }
  const type = async (wrapper, selector, value) => {
    await wrapper.get(selector).setValue(value)
    await settle()
  }
  const fillRequired = async (wrapper) => {
    await type(wrapper, '#supplier_name', 'ACME')
    await type(wrapper, '#supplier_address', 'Main 1')
    await type(wrapper, '#supplier_postal', '1000AA')
    await type(wrapper, '#supplier_city', 'Utrecht')
  }

  describe('create', () => {
    test('posts the supplier, says so and goes back', async () => {
      const wrapper = await mountSupplier()

      await fillRequired(wrapper)
      await click(wrapper, 'Submit')

      expect(writes().map((request) => [request.method, request.path])).toEqual([['post', LIST]])
      expect(writes()[0].body).toEqual({
        name: 'ACME',
        address: 'Main 1',
        postal: '1000AA',
        city: 'Utrecht',
        country_code: 'NL',
        identifier: '',
        email: '',
        tel: '',
        mobile: '',
        contact: '',
      })
      expect(toasts().map((toast) => [toast.title, toast.body])).toContainEqual(['Created', 'Supplier has been created'])
      expect(routerGo()).toHaveBeenCalledWith(-1)
    })

    test('sends every field the user filled in, the country too', async () => {
      const wrapper = await mountSupplier()

      await fillRequired(wrapper)
      await type(wrapper, '#supplier_identifier', 'S-8')
      await type(wrapper, '#supplier_country_code', 'DE')
      await type(wrapper, '#supplier_email', 'a@b.test')
      await type(wrapper, '#supplier_tel', '030')
      await type(wrapper, '#supplier_mobile', '06')
      await type(wrapper, '#supplier_contact', 'Jan')
      await click(wrapper, 'Submit')

      expect(writes()[0].body).toEqual({
        name: 'ACME', address: 'Main 1', postal: '1000AA', city: 'Utrecht', country_code: 'DE',
        identifier: 'S-8', email: 'a@b.test', tel: '030', mobile: '06', contact: 'Jan',
      })
    })

    test('offers the tenant\'s countries', async () => {
      const wrapper = await mountSupplier()

      expect(wrapper.findAll('#supplier_country_code option').map((option) => option.text())).toEqual(['Netherlands', 'Germany'])
    })

    test('empty required fields block the submit, each with its own line', async () => {
      const wrapper = await mountSupplier()

      await click(wrapper, 'Submit')

      expect(wrapper.text()).toContain('Please enter a name')
      expect(wrapper.text()).toContain('Please enter an address')
      expect(wrapper.text()).toContain('Please enter a postal')
      expect(wrapper.text()).toContain('Please enter a city')
      expect(writes()).toEqual([])
      expect(routerGo()).not.toHaveBeenCalled()
    })

    test.each([
      ['name', '#supplier_name'],
      ['address', '#supplier_address'],
      ['postal', '#supplier_postal'],
      ['city', '#supplier_city'],
    ])('a missing %s alone blocks the submit', async (_field, selector) => {
      const wrapper = await mountSupplier()

      await fillRequired(wrapper)
      await type(wrapper, selector, '')
      await click(wrapper, 'Submit')

      expect(writes()).toEqual([])
    })

    test('a failed post reports it, keeps the form and does not navigate', async () => {
      api.post(LIST, serverError)
      const wrapper = await mountSupplier()

      await fillRequired(wrapper)
      await click(wrapper, 'Submit')

      expect(bodies()).toContain('Error creating supplier')
      expect(routerGo()).not.toHaveBeenCalled()
      expect(wrapper.get('#supplier_name').element.value).toBe('ACME')
      expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
    })

    test('cancel goes back without writing', async () => {
      const wrapper = await mountSupplier()

      await click(wrapper, 'Cancel')

      expect(routerGo()).toHaveBeenCalledWith(-1)
      expect(writes()).toEqual([])
    })

    test('the header carries the name as it is typed and no "edit" tag', async () => {
      const wrapper = await mountSupplier()

      await type(wrapper, '#supplier_name', 'ACME')

      expect(wrapper.get('h3').text()).toContain('ACME')
      expect(wrapper.get('h3').text()).not.toContain('edit')
    })
  })

  describe('edit', () => {
    test('loads the supplier into the fields', async () => {
      const wrapper = await mountSupplier({ pk: 7 })

      expect(wrapper.get('#supplier_name').element.value).toBe('ACME')
      expect(wrapper.get('#supplier_address').element.value).toBe('Main 1')
      expect(wrapper.get('#supplier_email').element.value).toBe('orders@acme.test')
      expect(wrapper.get('#supplier_country_code').element.value).toBe('NL')
      expect(wrapper.get('h3').text()).toContain('edit')
      expect(requestsOf('get', '/api/inventory/supplier/7/')).toHaveLength(1)
    })

    test('patches the supplier, says so and goes back', async () => {
      const wrapper = await mountSupplier({ pk: 7 })

      await type(wrapper, '#supplier_city', 'Amersfoort')
      await click(wrapper, 'Submit')

      expect(writes().map((request) => [request.method, request.path])).toEqual([['patch', '/api/inventory/supplier/7/']])
      expect(writes()[0].body).toEqual({
        name: 'ACME', address: 'Main 1', postal: '1000AA', city: 'Amersfoort', country_code: 'NL',
        identifier: 'S-7', email: 'orders@acme.test', tel: '030-1234567', mobile: '06-12345678', contact: 'Jan Jansen',
      })
      expect(toasts().map((toast) => [toast.title, toast.body])).toContainEqual(['Updated', 'Supplier has been updated'])
      expect(routerGo()).toHaveBeenCalledWith(-1)
    })

    test('clearing a required field blocks the patch', async () => {
      const wrapper = await mountSupplier({ pk: 7 })

      await type(wrapper, '#supplier_name', '')
      await click(wrapper, 'Submit')

      expect(wrapper.text()).toContain('Please enter a name')
      expect(writes()).toEqual([])
    })

    test('a failed patch reports it and does not navigate', async () => {
      const wrapper = await mountSupplier({ pk: 7 })

      api.patch(RECORD, serverError)
      await click(wrapper, 'Submit')

      expect(bodies()).toContain('Error updating supplier')
      expect(routerGo()).not.toHaveBeenCalled()
    })

    test('a failed read tells the user', async () => {
      api.get(RECORD, serverError)
      await mountSupplier({ pk: 7 })

      expect(bodies()).toContain('Error fetching supplier')
    })
  })
})
