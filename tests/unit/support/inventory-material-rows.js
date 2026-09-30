import { vAddressAutocompleteRow, vAutocompleteRow } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { settle } from './api-seam/index.js'

/**
 * What the purchase order and reservation form specs share: the two pickers'
 * rows, the widget stubs and the steps that stage a product row through the DOM.
 *
 * `vSupplierAutocomplete` and `vMaterialAutocomplete` are each an `intersect`
 * of a shared autocomplete row and the type's own half, and `fixtureFor` cannot
 * walk an intersect (it has no `entries`): the shared half comes from the
 * generated row and the rest is written out, which is the shape the seam then
 * checks.
 */

export const SUPPLIER = {
  id: 3,
  name: 'ACME',
  address: 'Street 1',
  city: 'Amsterdam',
  postal: '1000AA',
  country_code: 'NL',
  tel: '020',
  mobile: '06',
  email: 'a@b.nl',
  contact: 'Jan',
  remarks: 'none',
}

export function supplierRow(overrides = {}) {
  return {
    ...fixtureFor(vAddressAutocompleteRow, { ...SUPPLIER, ...overrides }),
    identifier: 'SUP-1',
    remarks: overrides.remarks ?? SUPPLIER.remarks,
  }
}

export function materialRow(overrides = {}) {
  return {
    ...fixtureFor(vAutocompleteRow, { id: 10, name: 'Widget', ...overrides }),
    identifier: 'MAT-1',
    price_purchase: '1.00',
    price_selling: '2.00',
    price_selling_alt: '2.00',
    image: '',
  }
}

/**
 * The third-party widgets have no meaningful DOM under happy-dom. A stub keeps
 * the root element (so `id` still falls through, which is how a spec tells the
 * pickers apart) and declares the two events the forms listen to.
 */
export const multiselectStub = {
  props: ['options', 'loading'],
  emits: ['select', 'search-change'],
  template: '<div class="multiselect-stub" />',
}

export const datePickerStub = {
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div class="datepicker-stub" />',
}

export function picker(wrapper, id) {
  return wrapper.findComponent(`#${id}`)
}

export function button(wrapper, text) {
  return wrapper.findAll('button').find((candidate) => candidate.text() === text)
}

/** Type a search term into the product picker and let the read land (the debounce is zero in specs). */
export async function searchProducts(wrapper, term) {
  picker(wrapper, 'material-rows-search').vm.$emit('search-change', term)
  await settle()
}

/**
 * Stage a product row the way a user does: pick it in the picker, type the
 * amount, click Add product.
 */
export async function addProduct(wrapper, { id, name }, amount, remarks) {
  picker(wrapper, 'material-rows-search').vm.$emit('select', { id, name })
  await settle()
  await wrapper.get('#material-rows-amount').setValue(String(amount))
  if (remarks !== undefined) await wrapper.get('#material-rows-remarks').setValue(remarks)
  await button(wrapper, 'Add product').trigger('click')
  await settle()
}

/** The staged table's rows as text cells, the icons column dropped. */
export function stagedRows(wrapper) {
  return wrapper.findAll('.material-rows tbody tr').map((tr) => tr.findAll('td').slice(0, 3).map((td) => td.text()))
}

export async function editStagedRow(wrapper, index) {
  await wrapper.findAll('.material-rows tbody tr')[index].get('.edit-row').trigger('click')
  await settle()
}

export async function deleteStagedRow(wrapper, index) {
  await wrapper.findAll('.material-rows tbody tr')[index].get('.delete-row').trigger('click')
  await settle()
}
