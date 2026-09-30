import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { defineComponent } from 'vue'

import { MaterialRowsPanel, MaterialRowsTable, useAutocompleteProductSearch, useMaterialRows } from '@/features/inventory/material-rows'
import { installApiSeam, settle } from '../support/api-seam/index.js'
import { mountForm } from '../support/form-harness.js'
import {
  addProduct,
  button,
  deleteStagedRow,
  editStagedRow,
  materialRow,
  multiselectStub,
  picker,
  stagedRows,
} from '../support/inventory-material-rows.js'

// The staged material rows both the purchase order and the reservation form
// carry. The forms' own specs pin what a save sends; this one pins the editor:
// the add / edit / cancel / delete of a row and the rules that guard them.

const api = installApiSeam()

const STORED = [
  { id: 7, material: 10, name: 'Widget', amount: '3', remarks: 'first' },
  { id: 8, material: 11, name: 'Gadget', amount: '5', remarks: null },
]

const Host = defineComponent({
  components: { MaterialRowsPanel },
  props: { supplierChosen: { type: Boolean, default: true }, stored: { type: Array, default: () => [] } },
  setup(props) {
    const staging = useMaterialRows({ products: useAutocompleteProductSearch(() => 3) })
    staging.setRows(props.stored.map((row) => ({ ...row })))
    return { staging }
  },
  template: '<MaterialRowsPanel :staging="staging" :supplier-chosen="supplierChosen" placeholder="Pick a supplier first" />',
})

let mounted = []
afterEach(() => {
  mounted.forEach((wrapper) => wrapper.unmount())
  mounted = []
})

beforeEach(() => {
  api.get('/api/inventory/material/autocomplete/', () => [materialRow()])
})

async function mountRows(props = {}, options = {}) {
  const wrapper = mountForm(Host, {
    deep: true,
    props,
    stubs: { VueMultiselect: multiselectStub },
    ...options,
  })
  mounted.push(wrapper)
  await settle()
  return wrapper
}

const feedback = (wrapper) => wrapper.findAll('.invalid-feedback.d-block').map((node) => node.text())
const amountInput = (wrapper) => wrapper.get('#material-rows-amount')

async function pick(wrapper, option) {
  picker(wrapper, 'material-rows-search').vm.$emit('select', option)
  await settle()
}

describe('the editor', () => {
  test('without a supplier it shows the placeholder instead', async () => {
    const wrapper = await mountRows({ supplierChosen: false })

    expect(wrapper.find('.material-rows').exists()).toBe(false)
    expect(wrapper.text()).toContain('Pick a supplier first')
  })

  test('picking a product fills the read-only name and starts the amount at 0', async () => {
    const wrapper = await mountRows()

    await pick(wrapper, { id: 10, name: 'Widget' })

    expect(wrapper.get('#material-rows-name').element.value).toBe('Widget')
    expect(wrapper.get('#material-rows-name').attributes('readonly')).toBeDefined()
    expect(amountInput(wrapper).element.value).toBe('0')
  })

  // The focus is imperative: the panel binds the amount input's template ref to
  // the ref the composable owns, so a broken binding fails silently.
  test('picking a product moves the focus to the amount', async () => {
    const wrapper = await mountRows({}, { attachTo: document.body })

    await pick(wrapper, { id: 10, name: 'Widget' })

    expect(document.activeElement).toBe(amountInput(wrapper).element)
  })

  test('the picker searches only through the shared search, so a term reads the supplier\'s products', async () => {
    const wrapper = await mountRows()

    picker(wrapper, 'material-rows-search').vm.$emit('search-change', 'wid')
    await new Promise((resolve) => setTimeout(resolve, 550))
    await settle()

    expect(api.requests()).toEqual([
      { method: 'get', path: '/api/inventory/material/autocomplete/', query: { q: 'wid', supplier: '3' } },
    ])
    expect(picker(wrapper, 'material-rows-search').props('options')).toHaveLength(1)
  })
})

describe('adding a row', () => {
  test('adds the product when both fields are valid, and clears the editor', async () => {
    const wrapper = await mountRows()

    await addProduct(wrapper, { id: 10, name: 'Widget' }, 2, 'note')

    expect(stagedRows(wrapper)).toEqual([['Widget', '2', 'note']])
    expect(wrapper.get('#material-rows-name').element.value).toBe('')
    expect(amountInput(wrapper).element.value).toBe('0')
    expect(wrapper.get('#material-rows-remarks').element.value).toBe('')
  })

  // Exactly one of the two checks fails in each of the next tests, which is what
  // distinguishes `&&` from `||` in the guard.
  test('refuses to add when no product has been chosen', async () => {
    const wrapper = await mountRows()

    await amountInput(wrapper).setValue('2')
    await settle()

    expect(button(wrapper, 'Add product').attributes('disabled')).toBeDefined()
    await button(wrapper, 'Add product').trigger('click')
    expect(stagedRows(wrapper)).toEqual([])
  })

  // Pins the amount rule: zero is not a valid amount, so `>` may not become `>=`.
  test.each([['0'], [''], ['-1'], ['2.5'], ['abc']])('refuses to add an amount of "%s"', async (amount) => {
    const wrapper = await mountRows()

    await pick(wrapper, { id: 10, name: 'Widget' })
    await amountInput(wrapper).setValue(amount)
    await settle()

    expect(button(wrapper, 'Add product').attributes('disabled')).toBeDefined()
    expect(feedback(wrapper)).toEqual(['Please enter an amount'])
    await button(wrapper, 'Add product').trigger('click')
    expect(stagedRows(wrapper)).toEqual([])
  })

  // The legacy editor touched both fields on every render, so a blank editor
  // opened already scolding; the copy now speaks once a product is picked.
  test('a blank editor says nothing yet', async () => {
    const wrapper = await mountRows()

    expect(feedback(wrapper)).toEqual([])
    expect(button(wrapper, 'Add product').attributes('disabled')).toBeDefined()
  })

  test('a product picked without a valid amount says so', async () => {
    const wrapper = await mountRows()

    await pick(wrapper, { id: 10, name: 'Widget' })

    expect(feedback(wrapper)).toEqual(['Please enter an amount'])
  })
})

describe('editing a row', () => {
  test('the pencil loads the row into the editor and swaps Add for Edit product', async () => {
    const wrapper = await mountRows({ stored: STORED })

    await editStagedRow(wrapper, 0)

    expect(wrapper.get('#material-rows-name').element.value).toBe('Widget')
    expect(amountInput(wrapper).element.value).toBe('3')
    expect(wrapper.get('#material-rows-remarks').element.value).toBe('first')
    expect(button(wrapper, 'Edit product')).toBeDefined()
    expect(button(wrapper, 'Add product')).toBeUndefined()
  })

  test('Edit product replaces the row at the edited index and goes back to Add', async () => {
    const wrapper = await mountRows({ stored: STORED })

    await editStagedRow(wrapper, 1)
    await amountInput(wrapper).setValue('99')
    await button(wrapper, 'Edit product').trigger('click')
    await settle()

    expect(stagedRows(wrapper)).toEqual([['Widget', '3', 'first'], ['Gadget', '99', '']])
    expect(button(wrapper, 'Add product')).toBeDefined()
    expect(button(wrapper, 'Edit product')).toBeUndefined()
  })

  test('picking another product while editing keeps the amount and the remark', async () => {
    const wrapper = await mountRows({ stored: STORED })

    await editStagedRow(wrapper, 0)
    await pick(wrapper, { id: 12, name: 'Sprocket' })

    expect(wrapper.get('#material-rows-name').element.value).toBe('Sprocket')
    expect(amountInput(wrapper).element.value).toBe('3')
    expect(wrapper.get('#material-rows-remarks').element.value).toBe('first')
  })

  // REGRESSION: the legacy editor bound its inputs to the row in the table
  // itself, so typing changed the table live and Cancel, which only cleared the
  // editor, left the change behind.
  test('Cancel discards what was typed: the table row is untouched', async () => {
    const wrapper = await mountRows({ stored: STORED })

    await editStagedRow(wrapper, 0)
    await amountInput(wrapper).setValue('99')
    await wrapper.get('#material-rows-remarks').setValue('changed')
    expect(stagedRows(wrapper)[0]).toEqual(['Widget', '3', 'first'])

    await button(wrapper, 'Cancel').trigger('click')
    await settle()

    expect(stagedRows(wrapper)).toEqual([['Widget', '3', 'first'], ['Gadget', '5', '']])
    expect(button(wrapper, 'Add product')).toBeDefined()
    expect(wrapper.get('#material-rows-name').element.value).toBe('')
  })

  // The legacy Edit product button had no guard, so an edit could save an
  // amount the Add button would have refused.
  test('Edit product is refused for an amount of zero', async () => {
    const wrapper = await mountRows({ stored: STORED })

    await editStagedRow(wrapper, 0)
    await amountInput(wrapper).setValue('0')
    await settle()

    expect(button(wrapper, 'Edit product').attributes('disabled')).toBeDefined()
    await button(wrapper, 'Edit product').trigger('click')
    expect(stagedRows(wrapper)[0]).toEqual(['Widget', '3', 'first'])
    expect(feedback(wrapper)).toEqual(['Please enter an amount'])
  })
})

describe('deleting a row', () => {
  test('removes it from the set', async () => {
    const wrapper = await mountRows({ stored: STORED })

    await deleteStagedRow(wrapper, 0)

    expect(stagedRows(wrapper)).toEqual([['Gadget', '5', '']])
  })

  test('deleting the row being edited resets the editor', async () => {
    const wrapper = await mountRows({ stored: STORED })

    await editStagedRow(wrapper, 0)
    await deleteStagedRow(wrapper, 0)

    expect(button(wrapper, 'Add product')).toBeDefined()
    expect(wrapper.get('#material-rows-name').element.value).toBe('')
  })

  test('deleting a row above the one being edited keeps the edit on its row', async () => {
    const wrapper = await mountRows({ stored: STORED })

    await editStagedRow(wrapper, 1)
    await deleteStagedRow(wrapper, 0)
    await amountInput(wrapper).setValue('50')
    await button(wrapper, 'Edit product').trigger('click')
    await settle()

    expect(stagedRows(wrapper)).toEqual([['Gadget', '50', '']])
  })
})

describe('MaterialRowsTable', () => {
  const items = [
    { amount: 3, remarks: 'first', material_view: { name: 'Widget' } },
    { amount: 5, remarks: null, material_view: { name: 'Gadget' } },
  ]

  test('lists the products, amounts and remarks, sorted by name', () => {
    const wrapper = mountForm(MaterialRowsTable, { deep: true, props: { tableId: 'products', items } })

    expect(wrapper.get('table').attributes('id')).toBe('products')
    expect(wrapper.findAll('thead th').map((th) => th.text())).toEqual(['Name', 'Amount', 'Remarks'])
    expect(wrapper.findAll('tbody tr').map((tr) => tr.findAll('td').map((td) => td.text()))).toEqual([
      ['Gadget', '5', ''],
      ['Widget', '3', 'first'],
    ])
  })

  test('the dark variant is dark, borderless and small', () => {
    const plain = mountForm(MaterialRowsTable, { deep: true, props: { tableId: 'products', items } })
    const dark = mountForm(MaterialRowsTable, { deep: true, props: { tableId: 'products', items, dark: true } })

    for (const cls of ['table-dark', 'table-borderless', 'table-sm']) {
      expect(dark.get('table').classes()).toContain(cls)
      expect(plain.get('table').classes()).not.toContain(cls)
    }
  })
})
