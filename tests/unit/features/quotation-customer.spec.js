import { afterEach, expect, test } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'
import { QuotationCustomerView } from '@/features/quotation'
import { vQuotation } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { mountForm } from '../support/form-harness.js'

enableAutoUnmount(afterEach)

const quotation = (overrides = {}) => fixtureFor(vQuotation, {
  id: 7, quotation_name: 'ACME', customer_id: 'C1', quotation_address: 'Street 1',
  quotation_country_code: 'NL', quotation_postal: '1234AB', quotation_city: 'Utrecht',
  quotation_contact: 'Jan', quotation_email: 'jan@example.com', quotation_mobile: '06', quotation_tel: null,
  ...overrides,
})
const values = (wrapper) => wrapper.findAll('p.value').map((p) => p.text())

test('renders the same markup as the legacy customer block', async () => {
  const { default: Legacy } = await import('@/views/quotations/CustomerView.vue')
  const { QuotationModel } = await import('@/models/quotations/Quotation')
  const legacy = mountForm(Legacy, { deep: true, props: { quotation: new QuotationModel(quotation()) } }).html()
  const current = mountForm(QuotationCustomerView, { deep: true, props: { quotation: quotation() } }).html()
  // Scoped-style hashes differ per component file; the markup must not.
  const unscoped = (html) => html.replace(/ data-v-[0-9a-f]+=""/g, '')
  expect(unscoped(current)).toBe(unscoped(legacy))
  // Captured only after the comparison above passed; it outlives the legacy block.
  expect(unscoped(current)).toMatchSnapshot()
})
test('shows each customer field, a blank one as a dash', () => {
  const wrapper = mountForm(QuotationCustomerView, { deep: true, props: { quotation: quotation() } })
  expect(values(wrapper)).toEqual(['ACME', 'C1', 'Street 1', 'NL-1234AB', 'Utrecht', 'Jan', 'jan@example.com', '06', '-'])
})
test('an empty postal still shows the country prefix, as the legacy block did', () => {
  const wrapper = mountForm(QuotationCustomerView, { deep: true, props: { quotation: quotation({ quotation_postal: '' }) } })
  expect(values(wrapper)[3]).toBe('NL--')
})
