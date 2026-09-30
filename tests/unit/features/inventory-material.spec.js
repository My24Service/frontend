import { beforeEach, describe, expect, test } from 'vitest'
import { defineComponent } from 'vue'
import {
  vInventoryLocations,
  vInventoryMaterialCreateResponse,
  vInventoryMaterialPartialUpdateResponse,
  vMaterial,
  vSupplierAutocomplete,
} from '@/api/valibot.gen'
import { MaterialForm, MaterialList, MaterialView } from '@/features/inventory'
import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, noContent, settle } from '../support/api-seam/index.js'
import { mountForm, mountListView, routerGo, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'
import { modal } from '../support/modal.js'

const api = installApiSeam()

const LIST = '/api/inventory/material/'
const RECORD = '/api/inventory/material/{id}/'
const STOCK = '/api/inventory/inventory-locations-for-material/'
const SUPPLIERS = '/api/inventory/supplier/autocomplete/'

const routes = [
  { name: 'material-list', path: '/inventory/materials', component: { template: '<div />' } },
  { name: 'material-add', path: '/inventory/materials/form', component: { template: '<div />' } },
  { name: 'material-edit', path: '/inventory/materials/form/:pk', component: { template: '<div />' } },
  { name: 'material-view', path: '/inventory/materials/view/:pk', component: { template: '<div />' } },
]

const material = (overrides = {}) => fixtureFor(vMaterial, {
  id: 42,
  name: 'Widget',
  show_name: 'Widget (W-1)',
  name_short: 'Wdg',
  identifier: 'W-1',
  unit: 'pcs',
  supplier_name: 'ACME, Utrecht',
  supplier_relation: 3,
  product_type: 'Gadgets',
  location: 'Shelf 4',
  price_purchase: '1.50',
  price_selling: '2.50',
  price_selling_alt: '2.75',
  price_purchase_ex: '1.24',
  price_selling_ex: '2.07',
  price_selling_alt_ex: '2.27',
  image: 'https://example.test/media/widget.png',
  modified: '02-01-2026',
  ...overrides,
})
const stock = (id, name, total) => fixtureFor(vInventoryLocations, { location_id: id, location_name: name, total_amount: total })
// An intersect schema: fixtureFor cannot fill it, so the row is written out.
const supplierRow = (overrides = {}) => ({
  id: 3, name: 'ACME', value: 'ACME', address: 'Main 1', city: 'Utrecht', postal: '1000AA', country_code: 'NL',
  tel: null, email: null, contact: null, mobile: null, identifier: null, remarks: null, ...overrides,
})

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

describe('MaterialList', () => {
  const endpoint = LIST
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
    api.get(endpoint, () => paginated([material()], { count: 45 }))
    api.delete(endpoint + '{id}/', noContent)
  })
  const mountMaterials = async () => {
    const wrapper = await mountListView(MaterialList, { deep: true, routes })
    await settle()
    return wrapper
  }

  test('loads page one and renders every column', async () => {
    const wrapper = await mountMaterials()

    expect(requestsOf('get', endpoint)[0]).toMatchObject({ query: { page: '1', page_size: '20' } })
    expect(wrapper.get('h3').text()).toContain('Materials')
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual([
      'Name', 'Identifier', 'Location', 'Purchase price', 'Selling price', 'Supplier', 'Modified', '',
    ])
    const cells = wrapper.findAll('tbody tr')[0].findAll('td').map((td) => td.text())
    expect(cells.slice(0, 7)).toEqual(['Widget (W-1)', 'W-1', 'Shelf 4', '1.50', '2.50', 'ACME, Utrecht', '02-01-2026'])
  })

  test('the name links to the view', async () => {
    const wrapper = await mountMaterials()

    expect(wrapper.get('tbody a').attributes('href')).toBe('/inventory/materials/view/42')
  })

  test('the row carries a delete action and no edit action, as the legacy list did', async () => {
    const wrapper = await mountMaterials()

    expect(wrapper.find('button[title="Delete"]').exists()).toBe(true)
    expect(wrapper.find('a[title="Edit"]').exists()).toBe(false)
  })

  test('the add button goes to the create form', async () => {
    const wrapper = await mountMaterials()

    const add = wrapper.findAll('a').find((a) => a.text() === 'Add material')
    expect(add.attributes('href')).toBe('/inventory/materials/form')
  })

  test('no column offers a sort, because the endpoint takes no ordering', async () => {
    const wrapper = await mountMaterials()

    expect(wrapper.findAll('thead th[aria-label^="Sort by"]')).toHaveLength(0)
    await wrapper.get('thead th').trigger('click')
    await settle()
    expect(requestsOf('get', endpoint)).toHaveLength(1)
  })

  test('a search term is debounced onto the wire', async () => {
    const wrapper = await mountMaterials()

    await wrapper.get('input[aria-label="Search materials"]').setValue('widget')
    await settle()

    expect(requestsOf('get', endpoint).at(-1).query).toMatchObject({ q: 'widget', page: '1' })
  })

  test('an empty list says so', async () => {
    api.get(endpoint, paginated([]))
    const wrapper = await mountMaterials()

    expect(wrapper.get('tbody').text()).toContain('No materials found')
  })

  test('a load failure tells the user', async () => {
    api.get(endpoint, serverError)
    await mountMaterials()

    expect(bodies()).toContain('Error loading materials')
  })

  test('delete confirms, sends the row id, refetches and says so', async () => {
    const wrapper = await mountMaterials()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    expect(api.requests().filter((request) => request.method === 'delete')).toHaveLength(0)
    expect(document.getElementById('delete-material-modal').textContent).toContain('Are you sure you want to delete this material?')

    modal('delete-material-modal').ok()
    await settle()

    expect(api.requests().find((request) => request.method === 'delete').path).toBe(endpoint + '42/')
    expect(requestsOf('get', endpoint)).toHaveLength(2)
    expect(toasts().map((toast) => [toast.title, toast.body])).toContainEqual(['Deleted', 'Material has been deleted'])
  })

  test('a failed delete keeps the row and reports it', async () => {
    api.delete(endpoint + '{id}/', serverError)
    const wrapper = await mountMaterials()

    await wrapper.get('button[title="Delete"]').trigger('click')
    await settle()
    modal('delete-material-modal').ok()
    await settle()

    expect(wrapper.get('tbody').text()).toContain('Widget')
    expect(bodies()).toContain('Error deleting material')
  })
})

describe('MaterialView', () => {
  beforeEach(() => {
    api.get(RECORD, () => material())
    api.get(STOCK, () => [stock(1, 'Main warehouse', 12), stock(2, 'Van 3', 4)])
  })
  const normalise = (html) => html
    .replace(/ data-v-[0-9a-f]+=""/g, '')
    .replace(/ id="[^"]*"/g, '')
    .replace(/ for="[^"]*"/g, '')
  const mountView = async () => {
    const wrapper = mountForm(MaterialView, { deep: true, routes, props: { pk: '42' } })
    await settle()
    return wrapper
  }

  test('renders the legacy view\'s markup', async () => {
    // The snapshot was taken only after this view's HTML was proven byte-identical
    // (bar scoped-style hashes and generated ids) to the legacy MaterialView's
    // (since deleted), for this same fixture.
    const current = normalise((await mountView()).html())

    expect(current).toMatchSnapshot()
  })
})

describe('MaterialView reads', () => {
  const mountView = async () => {
    const wrapper = mountForm(MaterialView, { deep: true, routes, props: { pk: 42 } })
    await settle()
    return wrapper
  }
  beforeEach(() => {
    api.get(RECORD, () => material())
    api.get(STOCK, () => [stock(1, 'Main warehouse', 12), stock(2, 'Van 3', 4)])
  })

  test('reads the material and its stock per location, and nothing else', async () => {
    await mountView()

    const gets = api.requests().filter((request) => request.method === 'get')
    expect(gets.map((request) => [request.path, request.query])).toEqual(expect.arrayContaining([
      ['/api/inventory/material/42/', {}],
      [STOCK, { material: '42' }],
    ]))
    expect(gets).toHaveLength(2)
  })

  test('shows the stock of each location', async () => {
    const wrapper = await mountView()

    const rows = wrapper.findAll('tbody tr').map((tr) => tr.findAll('td').map((td) => td.text()))
    expect(rows).toEqual([['Main warehouse', '12'], ['Van 3', '4']])
  })

  test('a material without an image shows the placeholder', async () => {
    api.get(RECORD, () => material({ image: null }))
    const wrapper = await mountView()

    expect(wrapper.get('img').attributes('src')).toContain('no-img.png')
  })

  test('the edit link goes to the form', async () => {
    const wrapper = await mountView()

    expect(wrapper.findAll('a').find((a) => a.text() === 'Edit material').attributes('href')).toBe('/inventory/materials/form/42')
  })

  test('the back button and the backlink go back', async () => {
    const wrapper = await mountView()

    await click(wrapper, 'Back')
    await wrapper.get('.backlink').trigger('click')

    expect(routerGo()).toHaveBeenCalledTimes(2)
    expect(routerGo()).toHaveBeenCalledWith(-1)
  })

  test('a failed material read tells the user', async () => {
    api.get(RECORD, serverError)
    await mountView()

    expect(bodies()).toContain('Error fetching inventory')
  })

  test('a failed stock read tells the user', async () => {
    api.get(STOCK, serverError)
    await mountView()

    expect(bodies()).toContain('Error fetching inventory')
  })

  test('both reads failing tell the user once', async () => {
    api.get(RECORD, serverError)
    api.get(STOCK, serverError)
    await mountView()

    expect(bodies().filter((body) => body === 'Error fetching inventory')).toHaveLength(1)
  })
})

// The supplier picker: the multiselect has no meaningful DOM under happy-dom, so
// it is replaced by a stand-in that emits what the real one does and offers the
// options it was given as buttons.
const MultiselectStub = defineComponent({
  props: ['options'],
  emits: ['select', 'search-change'],
  template: `<div>
    <input class="supplier-search" @input="$emit('search-change', $event.target.value)" />
    <button v-for="option in options" :key="option.id" type="button" class="supplier-option" @click="$emit('select', option)">{{ option.name }}</button>
  </div>`,
})

/** Pick a file the way the browser's picker does: a `change` event. */
async function chooseFile(wrapper, name = 'widget.png') {
  const input = wrapper.get('input[type="file"]')
  const file = new File(['fake-png-bytes'], name, { type: 'image/png' })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await settle()
  await settle()
}

const previewSrc = (wrapper, heading) => wrapper.findAll('h3').find((h) => h.text() === heading).element.parentElement.querySelector('img').getAttribute('src')

describe('MaterialForm', () => {
  beforeEach(() => {
    api.get(RECORD, () => material())
    api.post(LIST, ({ body }) => fixtureFor(vInventoryMaterialCreateResponse, { id: 100, ...body }))
    api.patch(RECORD, ({ body }) => fixtureFor(vInventoryMaterialPartialUpdateResponse, { id: 42, ...body }))
    api.get(SUPPLIERS, () => [supplierRow()])
  })
  const mountMaterial = async (props = {}) => {
    const wrapper = mountForm(MaterialForm, { deep: true, routes, props, stubs: { VueMultiselect: MultiselectStub } })
    await settle()
    return wrapper
  }
  const type = async (wrapper, selector, value) => {
    await wrapper.get(selector).setValue(value)
    await settle()
  }

  describe('create', () => {
    test('posts the material, says so and goes back', async () => {
      const wrapper = await mountMaterial()

      await type(wrapper, '#material_name', 'Widget')
      await click(wrapper, 'Submit')

      expect(writes().map((request) => [request.method, request.path])).toEqual([['post', LIST]])
      expect(writes()[0].body).toEqual({
        name: 'Widget',
        name_short: '',
        identifier: '',
        unit: '',
        product_type: '',
        price_purchase: '0.00',
        price_selling: '0.00',
        price_selling_alt: '0.00',
        price_purchase_ex: '0.00',
        price_selling_ex: '0.00',
        price_selling_alt_ex: '0.00',
      })
      expect(toasts().map((toast) => [toast.title, toast.body])).toContainEqual(['Created', 'Material has been created'])
      expect(routerGo()).toHaveBeenCalledWith(-1)
    })

    test('sends every field the user filled in', async () => {
      const wrapper = await mountMaterial()

      await type(wrapper, '#material_name', 'Widget')
      await type(wrapper, '#material_name_short', 'Wdg')
      await type(wrapper, '#material_identifier', 'W-1')
      await type(wrapper, '#material_unit', 'pcs')
      await type(wrapper, '#material_product_type', 'Gadgets')
      await type(wrapper, '#material_price_purchase', '1.50')
      await type(wrapper, '#material_price_selling_alt_ex', '2.27')
      await click(wrapper, 'Submit')

      expect(writes()[0].body).toMatchObject({
        name: 'Widget', name_short: 'Wdg', identifier: 'W-1', unit: 'pcs',
        product_type: 'Gadgets', price_purchase: '1.50', price_selling: '0.00', price_selling_alt_ex: '2.27',
      })
      expect(writes()[0].body).not.toHaveProperty('location')
    })

    // The create body has no `location` (the backend's create serializer does not
    // list it): the legacy screen offered the input and silently lost what was
    // typed. An edit does send it.
    test('offers no location, which a create cannot send', async () => {
      const wrapper = await mountMaterial()

      expect(wrapper.find('#material_location').exists()).toBe(false)
    })

    // The generated decimal pattern matches '', which the API answers with a
    // 400. The create body takes the price as optional, so a cleared one is
    // left out and the server's default applies.
    test('a cleared price is left out rather than sent blank', async () => {
      const wrapper = await mountMaterial()

      await type(wrapper, '#material_name', 'Widget')
      await type(wrapper, '#material_price_selling', '')
      await click(wrapper, 'Submit')

      expect(writes()).toHaveLength(1)
      expect(writes()[0].body).not.toHaveProperty('price_selling')
      expect(writes()[0].body).toMatchObject({ price_purchase: '0.00' })
    })

    test('a create leaves the image out unless a file was picked', async () => {
      const wrapper = await mountMaterial()

      await type(wrapper, '#material_name', 'Widget')
      await click(wrapper, 'Submit')

      expect(writes()[0].body).not.toHaveProperty('image')
    })

    test('a picked file previews and rides the body as a data URI', async () => {
      const wrapper = await mountMaterial()

      await type(wrapper, '#material_name', 'Widget')
      await chooseFile(wrapper)
      expect(previewSrc(wrapper, 'Upload preview')).toMatch(/^data:image\/png;base64,/)
      await click(wrapper, 'Submit')

      expect(writes()[0].body.image).toMatch(/^data:image\/png;base64,/)
    })

    test('sends nothing when the name is missing', async () => {
      const wrapper = await mountMaterial()

      await click(wrapper, 'Submit')

      expect(wrapper.text()).toContain('Please enter a name')
      expect(writes()).toEqual([])
      expect(routerGo()).not.toHaveBeenCalled()
    })

    test('a price that is not a decimal is refused before it is sent', async () => {
      const wrapper = await mountMaterial()

      await type(wrapper, '#material_name', 'Widget')
      await type(wrapper, '#material_price_selling', 'abc')
      await click(wrapper, 'Submit')

      expect(wrapper.text()).toContain('Please enter a valid selling price')
      expect(writes()).toEqual([])
    })

    test('a failed post reports it, keeps the form and does not navigate', async () => {
      api.post(LIST, serverError)
      const wrapper = await mountMaterial()

      await type(wrapper, '#material_name', 'Widget')
      await click(wrapper, 'Submit')

      expect(bodies()).toContain('Error creating material')
      expect(routerGo()).not.toHaveBeenCalled()
      expect(wrapper.get('#material_name').element.value).toBe('Widget')
      expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
    })

    test('the header shows a hint until a name is typed', async () => {
      const wrapper = await mountMaterial()

      expect(wrapper.get('h3').text()).toContain('(Material name)')
      await type(wrapper, '#material_name', 'Widget')
      expect(wrapper.get('h3').text()).toContain('Widget')
      expect(wrapper.get('h3').text()).not.toContain('Material name')
    })

    test('cancel goes back without writing', async () => {
      const wrapper = await mountMaterial()

      await click(wrapper, 'Cancel')

      expect(routerGo()).toHaveBeenCalledWith(-1)
      expect(writes()).toEqual([])
    })
  })

  describe('the supplier picker', () => {
    test('reads nothing until a term is typed', async () => {
      await mountMaterial()

      expect(requestsOf('get', SUPPLIERS)).toEqual([])
    })

    test('searches on typing, debounced, and offers what came back', async () => {
      const wrapper = await mountMaterial()

      await wrapper.get('.supplier-search').setValue('acm')
      // The search is debounced; zero in specs.
      await settle()

      expect(requestsOf('get', SUPPLIERS)).toHaveLength(1)
      expect(requestsOf('get', SUPPLIERS)[0].query).toEqual({ q: 'acm' })
      expect(wrapper.findAll('.supplier-option').map((option) => option.text())).toEqual(['ACME'])
    })

    test('picking a supplier shows it and sends it as the supplier relation', async () => {
      const wrapper = await mountMaterial()

      await wrapper.get('.supplier-search').setValue('acm')
      // The search is debounced; zero in specs.
      await settle()
      await wrapper.get('.supplier-option').trigger('click')
      await settle()

      expect(wrapper.get('#material_supplier_name').element.value).toBe('ACME')
      await type(wrapper, '#material_name', 'Widget')
      await click(wrapper, 'Submit')
      expect(writes()[0].body.supplier_relation).toBe(3)
      expect(writes()[0].body).not.toHaveProperty('supplier_name')
    })

    test('a failed search tells the user', async () => {
      api.get(SUPPLIERS, serverError)
      const wrapper = await mountMaterial()

      await wrapper.get('.supplier-search').setValue('acm')
      // The search is debounced; zero in specs.
      await settle()

      expect(bodies()).toContain('Error fetching suppliers')
    })
  })

  describe('edit', () => {
    const readyEdit = async () => {
      const wrapper = await mountMaterial({ pk: 42 })
      await settle()
      return wrapper
    }

    test('loads the material into the fields and shows its image', async () => {
      const wrapper = await readyEdit()

      expect(wrapper.get('#material_name').element.value).toBe('Widget')
      expect(wrapper.get('#material_identifier').element.value).toBe('W-1')
      expect(wrapper.get('#material_supplier_name').element.value).toBe('ACME, Utrecht')
      expect(wrapper.get('#material_price_purchase').element.value).toBe('1.50')
      expect(previewSrc(wrapper, 'Current image')).toBe('https://example.test/media/widget.png')
      expect(requestsOf('get', '/api/inventory/material/42/')).toHaveLength(1)
    })

    test('patches the material, says so and goes back', async () => {
      const wrapper = await readyEdit()

      await type(wrapper, '#material_name', 'Gadget')
      await click(wrapper, 'Submit')

      expect(writes().map((request) => [request.method, request.path])).toEqual([['patch', '/api/inventory/material/42/']])
      expect(writes()[0].body).toEqual({
        name: 'Gadget',
        name_short: 'Wdg',
        identifier: 'W-1',
        unit: 'pcs',
        location: 'Shelf 4',
        product_type: 'Gadgets',
        supplier_relation: 3,
        price_purchase: '1.50',
        price_selling: '2.50',
        price_selling_alt: '2.75',
        price_purchase_ex: '1.24',
        price_selling_ex: '2.07',
        price_selling_alt_ex: '2.27',
      })
      expect(toasts().map((toast) => [toast.title, toast.body])).toContainEqual(['Updated', 'Material has been updated'])
      expect(routerGo()).toHaveBeenCalledWith(-1)
    })

    // The image comes back from the read as a URL. Sending that back would save
    // the material with its own URL as the image.
    test('does not send the stored image URL back', async () => {
      const wrapper = await readyEdit()

      await click(wrapper, 'Submit')

      expect(writes()[0].body).not.toHaveProperty('image')
    })

    test('sends the location, which only an edit offers', async () => {
      const wrapper = await readyEdit()

      await type(wrapper, '#material_location', 'Shelf 5')
      await click(wrapper, 'Submit')

      expect(writes()[0].body.location).toBe('Shelf 5')
    })

    // The edit sends the patch body, whose `location` has a maximum of 100.
    // It was validated against the create body, which has no `location`, so
    // a long one passed validation and the save failed in the parse. The
    // validation refuses it now: a field error, and no failed-save toast.
    test('a location over 100 characters is refused by validation', async () => {
      const wrapper = await readyEdit()

      await type(wrapper, '#material_location', 'x'.repeat(101))
      await click(wrapper, 'Submit')

      expect(wrapper.text()).toContain('Please use at most 100 characters')
      expect(bodies()).not.toContain('Error updating material')
      expect(writes()).toEqual([])
      expect(routerGo()).not.toHaveBeenCalled()
    })

    test('a cleared price is left out, so the stored one stays', async () => {
      const wrapper = await readyEdit()

      await type(wrapper, '#material_price_selling_alt', '')
      await click(wrapper, 'Submit')

      expect(writes()).toHaveLength(1)
      expect(writes()[0].body).not.toHaveProperty('price_selling_alt')
      expect(writes()[0].body).toMatchObject({ price_selling: '2.50' })
    })

    test('sends the image when a new file was picked', async () => {
      const wrapper = await readyEdit()

      await chooseFile(wrapper)
      await click(wrapper, 'Submit')

      expect(writes()[0].body.image).toMatch(/^data:image\/png;base64,/)
    })

    test('a failed patch reports it and does not navigate', async () => {
      const wrapper = await readyEdit()

      api.patch(RECORD, serverError)
      await click(wrapper, 'Submit')

      expect(bodies()).toContain('Error updating material')
      expect(routerGo()).not.toHaveBeenCalled()
    })

    test('a failed read tells the user', async () => {
      api.get(RECORD, serverError)
      await mountMaterial({ pk: 42 })

      expect(bodies()).toContain('Error fetching material')
    })
  })
})
