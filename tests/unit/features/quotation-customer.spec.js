import { expect, test } from 'vitest'
import { QuotationCustomerView } from '@/features/quotation'
import { vQuotation } from '@/api/valibot.gen'
import { fixtureFor } from '../helpers/schema-fixture.js'
import { mountForm } from '../support/form-harness.js'

const quotation = (overrides = {}) => fixtureFor(vQuotation, {
  id: 7, quotation_name: 'ACME', customer_id: 'C1', quotation_address: 'Street 1',
  quotation_country_code: 'NL', quotation_postal: '1234AB', quotation_city: 'Utrecht',
  quotation_contact: 'Jan', quotation_email: 'jan@example.com', quotation_mobile: '06', quotation_tel: null,
  ...overrides,
})
const values = (wrapper) => wrapper.findAll('p.value').map((p) => p.text())

test('renders the legacy customer block\'s markup', () => {
  // The snapshot was taken only after this block's HTML was proven identical
  // (bar scoped-style hashes) to the legacy CustomerView's, since deleted.
  const current = mountForm(QuotationCustomerView, { deep: true, props: { quotation: quotation() } }).html()
  expect(current.replace(/ data-v-[0-9a-f]+=""/g, '')).toMatchSnapshot()
})
test('shows each customer field, a blank one as a dash', () => {
  const wrapper = mountForm(QuotationCustomerView, { deep: true, props: { quotation: quotation() } })
  expect(values(wrapper)).toEqual(['ACME', 'C1', 'Street 1', 'NL-1234AB', 'Utrecht', 'Jan', 'jan@example.com', '06', '-'])
})
test('an empty postal still shows the country prefix, as the legacy block did', () => {
  const wrapper = mountForm(QuotationCustomerView, { deep: true, props: { quotation: quotation({ quotation_postal: '' }) } })
  expect(values(wrapper)[3]).toBe('NL--')
})
