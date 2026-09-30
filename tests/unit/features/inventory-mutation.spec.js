import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { defineComponent } from 'vue'

import {
  vInventoryLocations,
  vInventoryMaterialMoveCreateResponse,
  vInventoryMaterialsMinimal,
  vStockLocation,
  vStockMutationSimple,
} from '@/api/valibot.gen'
import { MaterialMoveForm, MutationForm, MutationList } from '@/features/inventory/mutation'

import { fixtureFor, paginated } from '../helpers/schema-fixture.js'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm, mountListView, routerGo, toasts } from '../support/form-harness.js'
import { serverError } from '../support/list-harness.js'

const api = installApiSeam()

const stub = { template: '<div />' }
const routes = [
  { name: 'mutation-list', path: '/inventory/mutations', component: stub },
  { name: 'mutation-add', path: '/inventory/mutations/form', component: stub },
  { name: 'material-move', path: '/inventory/move', component: stub },
]

/**
 * The stand-in for VueMultiselect, which has no DOM worth driving under
 * happy-dom: a search box that says what was typed, and one button per option
 * that says which was picked, labelled the way the real one labels it. The
 * root is focusable, because the move form focuses the material picker's root.
 */
const MultiselectStub = defineComponent({
  props: ['options', 'customLabel'],
  emits: ['select', 'search-change'],
  template: `<div class="multiselect-stub" tabindex="-1">
    <input class="search" @input="$emit('search-change', $event.target.value)" />
    <button v-for="(option, index) in options" :key="index" type="button" class="option"
      @click="$emit('select', option)">{{ customLabel(option) }}</button>
  </div>`,
})

const material = (overrides = {}) => fixtureFor(vInventoryMaterialsMinimal, {
  material_id: 5, material_name: 'Bolt', material_identifier: 'B-5', supplier_name: 'Acme', total_amount: 40,
  ...overrides,
})
const location = (overrides = {}) => fixtureFor(vInventoryLocations, {
  location_id: 2, location_name: 'Shelf A', total_amount: 25, ...overrides,
})
const stockLocation = (overrides = {}) => fixtureFor(vStockLocation, { id: 3, name: 'Shelf B', ...overrides })
const mutation = (overrides = {}) => fixtureFor(vStockMutationSimple, {
  id: 1, material: 5, location: 2, amount: '4.00', mutation_type: 'move-in', material_name: 'Bolt',
  summary: '<b>Move to</b> Shelf A', modified: '02-01-2026', remarks: null, ...overrides,
})

const MATERIALS = '/api/inventory/inventory-materials/'
const LOCATIONS_OF = '/api/inventory/inventory-locations-for-material/'
const STOCK_LOCATIONS = '/api/inventory/stock-location/'
const MUTATIONS = '/api/inventory/stockmutationsimple-list/'
const MOVE = '/api/inventory/material/{id}/move/'

const gets = (path) => api.requests().filter((request) => request.method === 'get' && request.path === path)
const posts = () => api.requests().filter((request) => request.method === 'post')
const bodies = () => toasts().map((toast) => toast.body)

const button = (wrapper, text) => wrapper.findAll('button').find((b) => b.text().trim() === text)
async function click(wrapper, text) {
  const target = button(wrapper, text)
  expect(target, `${text} must be reachable`).toBeTruthy()
  await target.trigger('click')
  await settle()
}
async function search(wrapper, id, term) {
  await wrapper.get(`#${id} .search`).setValue(term)
  await settle()
}
async function pick(wrapper, id, label) {
  const option = wrapper.findAll(`#${id} .option`).find((o) => o.text() === label)
  expect(option, `${label} must be offered in #${id}`).toBeTruthy()
  await option.trigger('click')
  await settle()
}

beforeEach(() => {
  window.history.replaceState(null, '', '/')
  api.get(MATERIALS, [material()])
  api.get(LOCATIONS_OF, [location()])
  api.get(STOCK_LOCATIONS, paginated([stockLocation()]))
  api.get(MUTATIONS, paginated([mutation()]))
  api.post(MUTATIONS, ({ body }) => mutation({ ...body, id: 9 }))
  api.post(MOVE, fixtureFor(vInventoryMaterialMoveCreateResponse))
})

afterEach(() => window.history.replaceState(null, '', '/'))

// ---------------------------------------------------------------------------

describe('MutationList', () => {
  async function mountMutations(options = {}) {
    const wrapper = await mountListView(MutationList, { deep: true, routes, ...options })
    await settle()
    return wrapper
  }

  test('loads page one and renders a row per mutation', async () => {
    const wrapper = await mountMutations()

    expect(gets(MUTATIONS)[0]).toMatchObject({ query: { page: '1', page_size: '20' } })
    expect(wrapper.get('h3').text()).toContain('Mutations')
    const headers = wrapper.findAll('thead th').map((th) => th.text())
    expect(headers).toEqual(expect.arrayContaining(['Material', 'Mutation', 'Amount', 'Date']))
    const cells = wrapper.get('tbody tr').findAll('td').map((td) => td.text())
    expect(cells).toEqual(['Bolt', 'Move to Shelf A', '4.00', '02-01-2026'])
  })

  // The summary is HTML the server builds, and it has always rendered as markup.
  test('renders the summary as HTML, deliberately', async () => {
    const wrapper = await mountMutations()

    expect(wrapper.get('tbody b').text()).toBe('Move to')
  })

  test('the add button goes to the add route', async () => {
    const wrapper = await mountMutations()

    const add = wrapper.findAll('a').find((a) => a.text() === 'Add mutation')
    expect(add.attributes('href')).toBe('/inventory/mutations/form')
  })

  // REGRESSION. The list endpoint declares neither `q` nor `ordering` and the
  // backend list ignores both; the legacy search modal and its sortable
  // headers sent a parameter nothing read.
  test('offers no search and no sorting, since the endpoint reads neither', async () => {
    const wrapper = await mountMutations()

    expect(wrapper.find('input[type="search"], input[aria-label]').exists()).toBe(false)
    expect(wrapper.findAll('thead th[aria-label^="Sort by"]')).toHaveLength(0)
    expect(gets(MUTATIONS).every((request) => !('q' in request.query) && !('ordering' in request.query))).toBe(true)
  })

  test('opened at page two it reads page two', async () => {
    api.get(MUTATIONS, paginated([mutation()], { count: 45 }))
    window.history.replaceState(null, '', '/#/inventory/mutations?page=2')
    await mountMutations()

    expect(gets(MUTATIONS)[0].query).toMatchObject({ page: '2' })
  })

  test('a failed load says so', async () => {
    api.get(MUTATIONS, serverError)
    await mountMutations()

    expect(bodies()).toContain('Error loading mutations')
  })
})

// ---------------------------------------------------------------------------

describe('MutationForm', () => {
  const PICKER = 'add-mutation-material-search'
  const LOCATION_PICKER = 'add-mutation-location-search'

  async function mountMutation() {
    const wrapper = mountForm(MutationForm, {
      deep: true, routes, stubs: { VueMultiselect: MultiselectStub }, attachTo: document.body,
    })
    await settle()
    return wrapper
  }

  /** Pick Bolt and Shelf A, and type an amount. */
  async function fill(wrapper, amount = '5') {
    await search(wrapper, PICKER, 'bol')
    await pick(wrapper, PICKER, 'Bolt, in stock: 40')
    await pick(wrapper, LOCATION_PICKER, 'Shelf A (25)')
    await wrapper.get('#add-mutation-amount').setValue(amount)
  }

  test('reads nothing on open, and searches in-stock materials as the user types', async () => {
    const wrapper = await mountMutation()
    expect(gets(MATERIALS)).toEqual([])

    await search(wrapper, PICKER, 'bout & moer #5+')

    expect(gets(MATERIALS).map((request) => request.query)).toEqual([{ q: 'bout & moer #5+' }])
  })

  test('picking a material names it, loads the locations that hold it and focuses the amount', async () => {
    const wrapper = await mountMutation()
    await search(wrapper, PICKER, 'bol')
    await pick(wrapper, PICKER, 'Bolt, in stock: 40')

    expect(wrapper.get('.panel h3').text()).toBe('Bolt')
    expect(gets(LOCATIONS_OF).map((request) => request.query)).toEqual([{ material: '5' }])
    expect(wrapper.findAll(`#${LOCATION_PICKER} .option`).map((o) => o.text())).toEqual(['Shelf A (25)'])
    expect(document.activeElement.id).toBe('add-mutation-amount')
  })

  test('holds the place of the material name with a non-breaking space until one is picked', async () => {
    const wrapper = await mountMutation()

    expect(wrapper.get('.panel h3').text()).not.toContain('&nbsp;')
    expect(wrapper.get('.panel h3').element.textContent).toBe('\u00a0')
  })

  test('the location is headed "To location" for a correction in and "From location" for one out', async () => {
    const wrapper = await mountMutation()
    expect(wrapper.text()).toContain('To location')

    await wrapper.get('select').setValue('correction-out')

    expect(wrapper.text()).toContain('From location')
    expect(wrapper.text()).not.toContain('To location')
  })

  test('picking a location fills its name', async () => {
    const wrapper = await mountMutation()
    await search(wrapper, PICKER, 'bol')
    await pick(wrapper, PICKER, 'Bolt, in stock: 40')
    await pick(wrapper, LOCATION_PICKER, 'Shelf A (25)')

    expect(wrapper.get('#add-mutation-location-name').element.value).toBe('Shelf A')
  })

  test('a submit with nothing picked names the three things missing and posts nothing', async () => {
    const wrapper = await mountMutation()
    expect(wrapper.text()).not.toContain('Please select a material')

    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please select a material')
    expect(wrapper.text()).toContain('Please select a location')
    expect(wrapper.text()).toContain('Please enter an amount')
    expect(posts()).toEqual([])
  })

  test('an amount of nothing is refused, and the message clears as the field is fixed', async () => {
    const wrapper = await mountMutation()
    await search(wrapper, PICKER, 'bol')
    await pick(wrapper, PICKER, 'Bolt, in stock: 40')
    await pick(wrapper, LOCATION_PICKER, 'Shelf A (25)')

    await click(wrapper, 'Submit')
    expect(wrapper.text()).toContain('Please enter an amount')
    expect(posts()).toEqual([])

    await wrapper.get('#add-mutation-amount').setValue('3')
    expect(wrapper.text()).not.toContain('Please enter an amount')
  })

  test('a correction is created with the four fields it owns, and the list is where it lands', async () => {
    const wrapper = await mountMutation()
    await fill(wrapper, '5')
    await wrapper.get('select').setValue('correction-out')

    await click(wrapper, 'Submit')

    expect(posts()).toEqual([{
      method: 'post', path: MUTATIONS, query: {},
      body: { material: 5, location: 2, amount: '5', mutation_type: 'correction-out' },
    }])
    expect(toasts()[0]).toMatchObject({ title: 'Created', body: 'Mutation created' })
    expect(wrapper.vm.$router.currentRoute.value.name).toBe('mutation-list')
  })

  test('a correction in is the default type', async () => {
    const wrapper = await mountMutation()
    await fill(wrapper)

    await click(wrapper, 'Submit')

    expect(posts()[0].body).toMatchObject({ mutation_type: 'correction-in' })
  })

  // The stock changed, so what is read from stock is read again: the legacy
  // screen re-read on every visit, the query cache would not.
  test('a created correction makes the material and location reads stale', async () => {
    const wrapper = await mountMutation()
    await fill(wrapper)
    const before = gets(LOCATIONS_OF).length

    await click(wrapper, 'Submit')

    expect(gets(LOCATIONS_OF).length).toBeGreaterThan(before)
  })

  test('a failed create says so, keeps the form and offers the submit again', async () => {
    api.post(MUTATIONS, serverError)
    const wrapper = await mountMutation()
    await fill(wrapper)

    await click(wrapper, 'Submit')

    expect(bodies()).toEqual(['Error creating mutation'])
    expect(wrapper.vm.$router.currentRoute.value.name).not.toBe('mutation-list')
    expect(button(wrapper, 'Submit').attributes('disabled')).toBeUndefined()
  })

  test('cancel goes back', async () => {
    const wrapper = await mountMutation()

    await click(wrapper, 'Cancel')

    expect(routerGo()).toHaveBeenCalledWith(-1)
  })
})

// ---------------------------------------------------------------------------

describe('MaterialMoveForm', () => {
  const PICKER = 'move-material-purchase-order-material-search'
  const FROM = 'move-material-from-location-search'
  const TO = 'move-material-to-location-search'

  async function mountMove() {
    const wrapper = mountForm(MaterialMoveForm, {
      deep: true, routes, stubs: { VueMultiselect: MultiselectStub }, attachTo: document.body,
    })
    await settle()
    return wrapper
  }

  const submitButton = (wrapper) => wrapper.findAll('button').find((b) => b.text().trim() === 'Submit')
  /** The split button's menu item. */
  const bulkButton = (wrapper) => wrapper.findAll('button').find((b) => b.text().trim() === 'Bulk')

  async function pickMaterial(wrapper, label = 'Bolt, in stock: 40') {
    await search(wrapper, PICKER, 'bol')
    await pick(wrapper, PICKER, label)
  }

  /** Bolt from Shelf A to Shelf B, ready to type an amount. */
  async function fill(wrapper) {
    await pickMaterial(wrapper)
    await pick(wrapper, FROM, 'Shelf A (25)')
    await pick(wrapper, TO, 'Shelf B')
  }

  const moves = () => posts().filter((request) => request.path.endsWith('/move/'))

  // Legacy: 'a search term reaches the backend whole, however it is spelled'.
  test('a search term reaches the backend whole, however it is spelled', async () => {
    const wrapper = await mountMove()
    const start = api.requests().length

    await search(wrapper, PICKER, 'bout & moer #5+')

    expect(api.requests().slice(start).filter((request) => request.method === 'get')).toEqual([
      { method: 'get', path: MATERIALS, query: { q: 'bout & moer #5+' }, body: undefined },
    ])
  })

  test('reads no materials on open', async () => {
    await mountMove()

    expect(gets(MATERIALS)).toEqual([])
  })

  // REGRESSION. The destinations came from `stockLocationModel.list()`, the
  // default page of twenty: a twenty-first location could never be chosen.
  test('reads every stock location as a destination, not the first twenty', async () => {
    await mountMove()

    expect(gets(STOCK_LOCATIONS)).toEqual([
      { method: 'get', path: STOCK_LOCATIONS, query: { page: '1', page_size: '1000' }, body: undefined },
    ])
  })

  test('picking a material shows what is in stock and loads the locations that hold it', async () => {
    const wrapper = await mountMove()
    await pickMaterial(wrapper)

    expect(wrapper.get('.panel h3').text()).toBe('Bolt')
    const details = wrapper.get('dl').text()
    expect(details).toContain('40')
    expect(details).toContain('Acme')
    expect(details).toContain('B-5')
    expect(gets(LOCATIONS_OF).map((request) => request.query)).toEqual([{ material: '5' }])
    expect(wrapper.findAll(`#${FROM} .option`).map((o) => o.text())).toEqual(['Shelf A (25)'])
  })

  test('the destinations are every stock location, named', async () => {
    const wrapper = await mountMove()

    expect(wrapper.findAll(`#${TO} .option`).map((o) => o.text())).toEqual(['Shelf B'])
  })

  test('the submit is dead until both a departure and an arrival are picked', async () => {
    const wrapper = await mountMove()
    await pickMaterial(wrapper)
    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()

    await pick(wrapper, FROM, 'Shelf A (25)')
    expect(submitButton(wrapper).attributes('disabled')).toBeDefined()

    await pick(wrapper, TO, 'Shelf B')
    expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  // Legacy: 'posts the move to /api/inventory/material/{id}/move/ with the
  // location ids and amount'.
  test('posts the move to the material with the location ids and the amount', async () => {
    const wrapper = await mountMove()
    await fill(wrapper)
    await wrapper.get('#move-material-amount').setValue('10')

    await click(wrapper, 'Submit')

    expect(moves()).toEqual([{
      method: 'post', path: '/api/inventory/material/5/move/', query: {},
      body: { from_location_id: 2, to_location_id: 3, amount: '10' },
    }])
  })

  test('a move says so and lands on the mutation list', async () => {
    const wrapper = await mountMove()
    await fill(wrapper)
    await wrapper.get('#move-material-amount').setValue('10')

    await click(wrapper, 'Submit')

    expect(toasts()[0]).toMatchObject({ title: 'Moved', body: 'Material moved' })
    expect(wrapper.vm.$router.currentRoute.value.name).toBe('mutation-list')
  })

  test('without an amount the move names it and posts nothing', async () => {
    const wrapper = await mountMove()
    await fill(wrapper)
    expect(wrapper.text()).not.toContain('Please enter an amount')

    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please enter an amount')
    expect(moves()).toEqual([])
  })

  test('an amount of nothing is refused', async () => {
    const wrapper = await mountMove()
    await fill(wrapper)
    await wrapper.get('#move-material-amount').setValue('0')

    await click(wrapper, 'Submit')

    expect(wrapper.text()).toContain('Please enter an amount')
    expect(moves()).toEqual([])
  })

  test('a failed move says so and offers the submit again', async () => {
    api.post(MOVE, serverError)
    const wrapper = await mountMove()
    await fill(wrapper)
    await wrapper.get('#move-material-amount').setValue('10')

    await click(wrapper, 'Submit')

    expect(bodies()).toEqual(['Error moving material'])
    expect(wrapper.vm.$router.currentRoute.value.name).not.toBe('mutation-list')
    expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  describe('bulk', () => {
    async function moveInBulk(wrapper) {
      await fill(wrapper)
      await wrapper.get('#move-material-amount').setValue('10')
      await click(wrapper, 'Bulk')
    }

    test('moves, resets the amount and the material, keeps both locations and stays', async () => {
      const wrapper = await mountMove()

      await moveInBulk(wrapper)

      expect(moves()).toHaveLength(1)
      expect(toasts()[0]).toMatchObject({ title: 'Moved', body: 'Material moved' })
      expect(wrapper.vm.$router.currentRoute.value.name).not.toBe('mutation-list')
      // The material is gone, and its details with it.
      expect(wrapper.find('dl').exists()).toBe(false)
      expect(wrapper.find('#move-material-amount').exists()).toBe(false)
      // Both locations stay picked.
      const headings = wrapper.findAll('h3').map((h) => h.text())
      expect(headings.join(' ')).toContain('Shelf A')
      expect(headings.join(' ')).toContain('Shelf B')
      expect(submitButton(wrapper).attributes('disabled')).toBeUndefined()
      // And the picker is where the user goes next.
      expect(document.activeElement.id).toBe(PICKER)
    })

    // After a bulk move the material is gone while both locations stay, which
    // is the one way to reach a submit with a material missing.
    test('the next submit asks for a material again', async () => {
      const wrapper = await mountMove()
      await moveInBulk(wrapper)

      await click(wrapper, 'Submit')

      expect(wrapper.text()).toContain('Please select a material')
      expect(moves()).toHaveLength(1)
    })

    test('does not offer the errors it has just cleared', async () => {
      const wrapper = await mountMove()

      await moveInBulk(wrapper)

      expect(wrapper.text()).not.toContain('Please select a material')
    })

    test('the amount is back to nothing for the next material', async () => {
      const wrapper = await mountMove()
      await moveInBulk(wrapper)

      await pickMaterial(wrapper, 'Bolt, in stock: 40')

      expect(wrapper.get('#move-material-amount').element.value).toBe('0')
    })

    // The departure list stays the first material's: the user is moving
    // several materials between the same two places.
    test('picking the next material does not read its locations again, and focuses the amount', async () => {
      const wrapper = await mountMove()
      await moveInBulk(wrapper)
      const before = gets(LOCATIONS_OF).length

      await pickMaterial(wrapper)

      expect(gets(LOCATIONS_OF).length).toBe(before)
      expect(document.activeElement.id).toBe('move-material-amount')
    })

    test('the next move goes out for the next material between the same two locations', async () => {
      api.get(MATERIALS, [material(), material({ material_id: 6, material_name: 'Nut', total_amount: 9 })])
      const wrapper = await mountMove()
      await moveInBulk(wrapper)

      await pickMaterial(wrapper, 'Nut, in stock: 9')
      await wrapper.get('#move-material-amount').setValue('2')
      await click(wrapper, 'Bulk')

      expect(moves().map((request) => [request.path, request.body])).toEqual([
        ['/api/inventory/material/5/move/', { from_location_id: 2, to_location_id: 3, amount: '10' }],
        ['/api/inventory/material/6/move/', { from_location_id: 2, to_location_id: 3, amount: '2' }],
      ])
    })

    // The moved stock is no longer where the first read said it was.
    test('a move makes the departure amounts stale', async () => {
      const wrapper = await mountMove()
      await fill(wrapper)
      await wrapper.get('#move-material-amount').setValue('10')
      const before = gets(LOCATIONS_OF).length

      await click(wrapper, 'Bulk')

      expect(gets(LOCATIONS_OF).length).toBeGreaterThan(before)
    })
  })
})
